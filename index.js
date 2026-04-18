const fs = require("fs");
const path = require("path");
const config = require("./config.json");

const DEADLY_GAMBLE_BUFF_IDS = new Set(config.abnormalities.deadlyGamble);
const TEMPEST_AURA_BUILDUP_IDS = new Set(config.abnormalities.tempestAuraBuildup);
const TEMPEST_AURA_ACTIVE_IDS = new Set(config.abnormalities.tempestAuraActive);
const TRAVERSE_CUT_ABNORMALITY_ID = Number(config.traverseCut && config.traverseCut.abnormalityId);
const SKILL_IDS = {
    SCYTHE: new Set(config.skills.scythe),
    AERIAL_SCYTHE: new Set(config.skills.aerialScythe)
};

module.exports = function WarriorHelper(mod) {
    mod.game.initialize("me");
    const resetModuleBlocked = shouldDisableResetModule();

    let enabled = mod.settings.enabled !== false;
    let deadlyGambleActive = false;
    let activeBuffs = new Set();
    let current = createCounter();
    let total = createCounter();
    let lastCounted = createLastCounted();
    let tempestAuraStacks = 0;
    let tempestAuraWarned = false;
    let tempestAuraWarnedAt = 0;
    let tempestAuraCycleActive = false;
    let tempestAuraActiveTimeout = null;
    let ta2ActiveNoticeSent = false;
    let ta2ThreeSecNoticeSent = false;
    let ta2ThreeSecTimeout = null;
    let tcThreeSecTimeout = null;
    let lastTcTriggerAt = 0;
    let lastReset = { time: 0, icon: null };
    let skillIcons = new Map();

    mod.command.add("whelper", {
        $none() {
            setEnabled(!enabled);
        },
        help() {
            showHelp();
        },
        status() {
            reportQuickStatus();
        },
        stats() {
            reportStatus();
        },
        reset() {
            current = createCounter();
            total = createCounter();
            lastCounted = createLastCounted();
            deadlyGambleActive = false;
            activeBuffs.clear();
            resetTempestAura();
            mod.command.message(config.messages.reset);
        },
        on() {
            setEnabled(true);
        },
        off() {
            setEnabled(false);
        },
        ta: {
            $none() {
                mod.settings.taEnabled = !isTaEnabled();
                persistSettings();
                mod.command.message(`${config.messages.tempestAuraLabel} ${isTaEnabled() ? "enabled" : "disabled"}.`);
            },
            on() {
                mod.settings.taEnabled = true;
                persistSettings();
                mod.command.message(`${config.messages.tempestAuraLabel} enabled.`);
            },
            off() {
                mod.settings.taEnabled = false;
                persistSettings();
                mod.command.message(`${config.messages.tempestAuraLabel} disabled.`);
            },
            status() {
                mod.command.message(`${config.messages.tempestAuraLabel} ${isTaEnabled() ? "enabled" : "disabled"}. Current stacks: ${tempestAuraStacks}.`);
            }
        },
        ta2: {
            $none() {
                mod.settings.ta2Enabled = !isTa2Enabled();
                persistSettings();
                mod.command.message(`${config.messages.tempestAuraIILabel} ${isTa2Enabled() ? "enabled" : "disabled"}.`);
            },
            on() {
                mod.settings.ta2Enabled = true;
                persistSettings();
                mod.command.message(`${config.messages.tempestAuraIILabel} enabled.`);
            },
            off() {
                mod.settings.ta2Enabled = false;
                persistSettings();
                mod.command.message(`${config.messages.tempestAuraIILabel} disabled.`);
            },
            status() {
                mod.command.message(`${config.messages.tempestAuraIILabel} ${isTa2Enabled() ? "enabled" : "disabled"}.`);
            }
        },
        tc: {
            $none() {
                mod.settings.tcEnabled = !isTcEnabled();
                persistSettings();
                if (!isTcEnabled()) {
                    clearTcNotice();
                }
                mod.command.message(`${config.messages.traverseCutLabel} ${isTcEnabled() ? "enabled" : "disabled"}.`);
            },
            on() {
                mod.settings.tcEnabled = true;
                persistSettings();
                mod.command.message(`${config.messages.traverseCutLabel} enabled.`);
            },
            off() {
                mod.settings.tcEnabled = false;
                persistSettings();
                clearTcNotice();
                mod.command.message(`${config.messages.traverseCutLabel} disabled.`);
            },
            status() {
                mod.command.message(`${config.messages.traverseCutLabel} ${isTcEnabled() ? "enabled" : "disabled"}.`);
            }
        },
        resets: {
            $none() {
                mod.settings.resetsEnabled = !isResetEnabled();
                persistSettings();
                mod.command.message(`Reset notices ${getResetStatusLabel()}.`);
            },
            on() {
                mod.settings.resetsEnabled = true;
                persistSettings();
                mod.command.message(`Reset notices ${getResetStatusLabel()}.`);
            },
            off() {
                mod.settings.resetsEnabled = false;
                persistSettings();
                mod.command.message(`Reset notices ${getResetStatusLabel()}.`);
            },
            status() {
                mod.command.message(`Reset notices ${getResetStatusLabel()}.`);
            }
        },
        rs: {
            $none() {
                mod.settings.resetsEnabled = !isResetEnabled();
                persistSettings();
                mod.command.message(`Reset notices ${getResetStatusLabel()}.`);
            },
            on() {
                mod.settings.resetsEnabled = true;
                persistSettings();
                mod.command.message(`Reset notices ${getResetStatusLabel()}.`);
            },
            off() {
                mod.settings.resetsEnabled = false;
                persistSettings();
                mod.command.message(`Reset notices ${getResetStatusLabel()}.`);
            },
            status() {
                mod.command.message(`Reset notices ${getResetStatusLabel()}.`);
            }
        },
        color(value) {
            const nextColor = normalizeTempestAuraColor(value);
            if (!nextColor) {
                mod.command.message(`Invalid color. Available: ${config.tempestAuraNotice.availableColors.join(", ")}.`);
                return;
            }

            mod.settings.tempestAuraColor = nextColor;
            persistSettings();
            mod.command.message(`Tempest Aura color set to ${nextColor}.`);
        },
        colors() {
            mod.command.message(`Available Tempest Aura colors: ${config.tempestAuraNotice.availableColors.join(", ")}. Current: ${getTempestAuraColor()}.`);
        }
    });

    mod.game.on("leave_game", resetState);
    if (!resetModuleBlocked) {
        mod.game.on("enter_game", loadSkillIcons);
    }

    mod.hook("S_ABNORMALITY_BEGIN", mod.majorPatchVersion <= 106 ? 4 : 5, { filter: { fake: null } }, event => {
        if (!isMe(event.target)) return;

        if (DEADLY_GAMBLE_BUFF_IDS.has(event.id)) {
            activeBuffs.add(event.id);

            if (!deadlyGambleActive) {
                deadlyGambleActive = true;
                current = createCounter();
                lastCounted = createLastCounted();
                mod.command.message(config.messages.deadlyGambleStart);
            }

            handleTa2Buff(event.duration, true);

            return;
        }

        if (TEMPEST_AURA_BUILDUP_IDS.has(event.id)) {
            tempestAuraCycleActive = true;
            updateTempestAuraStacks(event.id, event.stacks);
            return;
        }

        if (isTraverseCutAbnormality(event.id)) {
            handleTraverseCutAbnormality(event);
            return;
        }

        if (TEMPEST_AURA_ACTIVE_IDS.has(event.id)) {
            const shouldSendActive = isTaEnabled() && tempestAuraWarned && tempestAuraCycleActive && tempestAuraStacks >= config.thresholds.tempestAuraSoon;
            resetTempestAura(false);
            if (shouldSendActive && isTaEnabled()) {
                scheduleTempestAuraActiveNotice();
            }
        }
    });

    mod.hook("S_ABNORMALITY_REFRESH", 2, { filter: { fake: null } }, event => {
        if (!isMe(event.target)) return;

        if (DEADLY_GAMBLE_BUFF_IDS.has(event.id)) {
            activeBuffs.add(event.id);
            handleTa2Buff(event.duration, false);
            return;
        }

        if (TEMPEST_AURA_BUILDUP_IDS.has(event.id)) {
            tempestAuraCycleActive = true;
            updateTempestAuraStacks(event.id, event.stacks);
            return;
        }

        if (isTraverseCutAbnormality(event.id)) {
            handleTraverseCutAbnormality(event);
            return;
        }

        if (TEMPEST_AURA_ACTIVE_IDS.has(event.id)) {
            const shouldSendActive = isTaEnabled() && tempestAuraWarned && tempestAuraCycleActive && tempestAuraStacks >= config.thresholds.tempestAuraSoon;
            resetTempestAura(false);
            if (shouldSendActive && isTaEnabled()) {
                scheduleTempestAuraActiveNotice();
            }
        }
    });

    mod.hook("S_ABNORMALITY_END", 1, { filter: { fake: null } }, event => {
        if (!isMe(event.target)) return;

        if (DEADLY_GAMBLE_BUFF_IDS.has(event.id)) {
            activeBuffs.delete(event.id);
            if (activeBuffs.size === 0 && deadlyGambleActive) {
                deadlyGambleActive = false;
                lastCounted = createLastCounted();
                sendNotice(formatOverlaySummary());
                resetTa2();
            }
            return;
        }

        if (TEMPEST_AURA_BUILDUP_IDS.has(event.id)) {
            return;
        }

        if (isTraverseCutAbnormality(event.id)) {
            clearTcNotice();
            return;
        }

        if (TEMPEST_AURA_ACTIVE_IDS.has(event.id)) {
            resetTempestAura();
        }
    });

    mod.hook("S_EACH_SKILL_RESULT", mod.majorPatchVersion >= 86 ? 14 : 13, { filter: { fake: null } }, event => {
        if (!enabled || !deadlyGambleActive || event.type !== config.damageType) return;
        if (!isMyDamage(event)) return;

        const skillId = Number(event.skill.id);
        if (SKILL_IDS.SCYTHE.has(skillId)) {
            countSkill("Scythe", skillId);
            return;
        }

        if (SKILL_IDS.AERIAL_SCYTHE.has(skillId)) {
            countSkill("Aerial Scythe", skillId);
        }
    });

    if (!resetModuleBlocked) {
        mod.hook("S_CREST_MESSAGE", 2, { filter: { fake: null } }, event => {
            if (!isResetEnabled()) return;
            if (!isWarrior() || event.type !== config.skillReset.type) return;

            const skill = Number(event.skill);
            const skillBase = getSkillBase(skill);
            const icon = skillIcons.get(skill) || skillIcons.get(skillBase);
            if (!icon) return;

            const now = Date.now();
            if (lastReset.icon === icon && now - lastReset.time <= config.skillReset.warnTimeoutMs) {
                if (!config.skillReset.showSystemMessage) return false;
                return;
            }

            lastReset = { icon, time: now };
            sendResetNotice(icon);

            if (config.skillReset.sound.enabled) {
                mod.send("S_PLAY_SOUND", 1, { SoundID: config.skillReset.sound.id });
            }

            if (!config.skillReset.showSystemMessage) {
                return false;
            }
        });
    } else {
        mod.log(`${config.skillReset.externalModuleName} detected. Built-in reset notifications disabled.`);
    }

    function isMe(gameId) {
        return mod.game.me.is(gameId) && String(mod.game.me.class).toLowerCase() === config.playerClass;
    }

    function isMyDamage(event) {
        return isMe(event.source) || isMe(event.owner);
    }

    function isWarrior() {
        return String(mod.game.me.class).toLowerCase() === config.playerClass;
    }

    function reportQuickStatus() {
        mod.command.message(`WH: DG ${enabled ? "ON" : "OFF"} | TA ${isTaEnabled() ? "ON" : "OFF"} | TA2 ${isTa2Enabled() ? "ON" : "OFF"} | TC ${isTcEnabled() ? "ON" : "OFF"} | RST ${getResetStatusShort()} | Color: ${getTempestAuraColor()}`);
    }

    function reportStatus() {
        mod.command.message([
            `${config.messages.deadlyGambleLabel} ${enabled ? "enabled" : "disabled"}.`,
            `Buff active: ${deadlyGambleActive ? "yes" : "no"}.`,
            `Current buff: Scythe ${current.Scythe}, Aerial Scythe ${current["Aerial Scythe"]}.`,
            `Session total: Scythe ${total.Scythe}, Aerial Scythe ${total["Aerial Scythe"]}.`,
            `${config.messages.tempestAuraStatus}: ${tempestAuraStacks} stack(s), cycle ${tempestAuraCycleActive ? "active" : "idle"}, warning ${isTaEnabled() ? "enabled" : "disabled"}, TA II ${isTa2Enabled() ? "enabled" : "disabled"}, TC ${isTcEnabled() ? "enabled" : "disabled"}, resets ${getResetStatusLabel()}, color ${getTempestAuraColor()}.`
        ].join(" "));
    }

    function showHelp() {
        mod.command.message([
            `WH: DG ${enabled ? "ON" : "OFF"} | TA ${isTaEnabled() ? "ON" : "OFF"} | TA2 ${isTa2Enabled() ? "ON" : "OFF"} | TC ${isTcEnabled() ? "ON" : "OFF"}`,
            "whelper on/off | ta on/off | ta2 on/off | tc on/off | resets/rs on/off",
            "whelper status | stats | reset",
            `whelper colors | color <name> (${config.tempestAuraNotice.availableColors.join(", ")})`
        ].join("\n"));
    }

    function resetState() {
        activeBuffs.clear();
        lastCounted = createLastCounted();
        deadlyGambleActive = false;
        current = createCounter();
        resetTempestAura();
        lastReset = { time: 0, icon: null };
        skillIcons.clear();
        resetTa2();
        clearTcNotice();
    }

    function resetTempestAura(cancelActiveNotice = true) {
        if (cancelActiveNotice && tempestAuraActiveTimeout) {
            mod.clearTimeout(tempestAuraActiveTimeout);
            tempestAuraActiveTimeout = null;
        }
        tempestAuraStacks = 0;
        tempestAuraWarned = false;
        tempestAuraWarnedAt = 0;
        tempestAuraCycleActive = false;
    }

    function updateTempestAuraStacks(id, stacks) {
        if (typeof stacks !== "number") return;

        if (stacks <= 0) {
            resetTempestAura();
            return;
        }

        if (tempestAuraCycleActive && stacks < tempestAuraStacks) {
            tempestAuraWarned = false;
        }

        tempestAuraStacks = stacks;

        if (isTaEnabled() && !tempestAuraWarned && tempestAuraStacks >= config.thresholds.tempestAuraSoon) {
            tempestAuraWarned = true;
            tempestAuraWarnedAt = Date.now();
            sendTempestAuraNotice(config.messages.tempestAuraSoon);
        }
    }

    function scheduleTempestAuraActiveNotice() {
        const now = Date.now();
        const elapsed = now - tempestAuraWarnedAt;
        const delay = elapsed < config.thresholds.tempestAuraActiveDelayMs
            ? config.thresholds.tempestAuraActiveDelayMs - elapsed
            : 0;

        if (tempestAuraActiveTimeout) {
            mod.clearTimeout(tempestAuraActiveTimeout);
        }

        tempestAuraActiveTimeout = mod.setTimeout(() => {
            tempestAuraActiveTimeout = null;
            sendTempestAuraNotice(config.messages.tempestAuraActive);
        }, delay);
    }

    function resetTa2() {
        if (ta2ThreeSecTimeout) {
            mod.clearTimeout(ta2ThreeSecTimeout);
            ta2ThreeSecTimeout = null;
        }

        ta2ActiveNoticeSent = false;
        ta2ThreeSecNoticeSent = false;
    }

    function handleTa2Buff(duration, isBegin) {
        if (!isTa2Enabled()) return;

        if (isBegin && !ta2ActiveNoticeSent) {
            ta2ActiveNoticeSent = true;
            sendTempestAuraNotice(config.messages.tempestAuraIIActive);
            scheduleTa2ThreeSecNotice();
        }
    }

    function scheduleTa2ThreeSecNotice() {
        if (ta2ThreeSecNoticeSent) {
            return;
        }

        if (ta2ThreeSecTimeout) {
            mod.clearTimeout(ta2ThreeSecTimeout);
            ta2ThreeSecTimeout = null;
        }

        const totalMs = Number(config.thresholds.ta2DurationMs) || 10000;
        const leadMs = Number(config.thresholds.ta2EndingSoonMs) || 3000;
        const delay = Math.max(0, totalMs - leadMs);

        ta2ThreeSecTimeout = mod.setTimeout(() => {
            ta2ThreeSecTimeout = null;
            if (!deadlyGambleActive || !isTa2Enabled() || ta2ThreeSecNoticeSent) {
                return;
            }

            ta2ThreeSecNoticeSent = true;
            sendTempestAuraNotice(config.messages.tempestAuraIIEnding);
        }, delay);
    }

    function isTraverseCutAbnormality(id) {
        return Number(id) === TRAVERSE_CUT_ABNORMALITY_ID;
    }

    function handleTraverseCutAbnormality(event) {
        if (!isTcEnabled() || !isTraverseCutAbnormality(event.id)) {
            return;
        }

        const totalMs = normalizeDurationMs(event.duration, Number(config.traverseCut.durationMs) || 27000);
        const now = Date.now();
        if (tcThreeSecTimeout && now - lastTcTriggerAt < 250) {
            return;
        }

        lastTcTriggerAt = now;
        scheduleTcThreeSecNotice(totalMs);
    }

    function scheduleTcThreeSecNotice(totalMs) {
        clearTcNotice();

        const safeTotalMs = Math.max(0, Number(totalMs) || Number(config.traverseCut.durationMs) || 27000);
        const leadMs = Number(config.traverseCut.endingSoonMs) || 3000;
        const delay = Math.max(0, safeTotalMs - leadMs);

        tcThreeSecTimeout = mod.setTimeout(() => {
            tcThreeSecTimeout = null;
            if (!isTcEnabled()) {
                return;
            }

            sendTempestAuraNotice(config.messages.tcEnding);
        }, delay);
    }

    function clearTcNotice() {
        if (tcThreeSecTimeout) {
            mod.clearTimeout(tcThreeSecTimeout);
            tcThreeSecTimeout = null;
        }
    }

    function normalizeDurationMs(duration, fallbackMs) {
        const numeric = Number(duration);
        if (!Number.isFinite(numeric) || numeric <= 0) {
            return fallbackMs;
        }

        if (numeric < 1000) {
            return numeric * 1000;
        }

        if (numeric > 600000) {
            return Math.round(numeric / 1000);
        }

        return numeric;
    }

    function isTaEnabled() {
        return mod.settings.taEnabled !== false;
    }

    function isTa2Enabled() {
        return mod.settings.ta2Enabled === true;
    }

    function isTcEnabled() {
        return mod.settings.tcEnabled !== false;
    }

    function isResetEnabled() {
        return mod.settings.resetsEnabled !== false;
    }

    function getResetStatusShort() {
        if (resetModuleBlocked) {
            return "EXT";
        }

        return isResetEnabled() ? "ON" : "OFF";
    }

    function getResetStatusLabel() {
        if (resetModuleBlocked) {
            return `disabled by ${config.skillReset.externalModuleName}`;
        }

        return isResetEnabled() ? "enabled" : "disabled";
    }

    function formatOverlaySummary() {
        return `${config.messages.aerialLabel}: ${current["Aerial Scythe"]} / ${config.messages.scytheLabel}: ${current.Scythe}`;
    }

    function setEnabled(value) {
        enabled = value === true;
        mod.settings.enabled = enabled;
        persistSettings();
        mod.command.message(`${config.messages.deadlyGambleLabel} ${enabled ? "enabled" : "disabled"}.`);
    }

    function persistSettings() {
        if (typeof mod.saveSettings === "function") {
            mod.saveSettings();
        }
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function sendNotice(message) {
        mod.send("S_CHAT", getChatVersion(), {
            channel: config.noticeChatChannel,
            name: "",
            message
        });
    }

    function sendTempestAuraNotice(message) {
        const safeMessage = escapeHtml(message);

        if (config.tempestAuraNotice.useCustomStyle) {
            mod.send("S_CUSTOM_STYLE_SYSTEM_MESSAGE", 1, {
                message: `<font size="${config.tempestAuraNotice.customStyle.fontSize}" color="${getTempestAuraTextColor()}">${safeMessage}</font>`,
                style: config.tempestAuraNotice.customStyle.style
            });
            return;
        }

        mod.send("S_DUNGEON_EVENT_MESSAGE", config.tempestAuraNotice.dungeonEvent.version, {
            type: getTempestAuraDungeonEventType(),
            chat: config.tempestAuraNotice.dungeonEvent.chat,
            channel: config.tempestAuraNotice.dungeonEvent.channel,
            message: safeMessage
        });
    }

    function getTempestAuraDungeonEventType() {
        const color = getTempestAuraColor();
        switch (color) {
            case "green":
                return 42;
            case "blue":
                return 43;
            case "red":
                return 44;
            case "info":
                return 66;
            case "text":
                return 31;
            default:
                return config.tempestAuraNotice.dungeonEvent.type;
        }
    }

    function getTempestAuraColor() {
        return normalizeTempestAuraColor(mod.settings.tempestAuraColor) || normalizeTempestAuraColor(config.tempestAuraNotice.color) || "blue";
    }

    function normalizeTempestAuraColor(value) {
        const color = String(value || "").toLowerCase();
        return config.tempestAuraNotice.availableColors.includes(color) ? color : null;
    }

    function getTempestAuraTextColor() {
        switch (getTempestAuraColor()) {
            case "green":
                return "#00FF00";
            case "blue":
                return "#00FFFF";
            case "red":
                return "#FF4500";
            case "info":
                return "#4DA6FF";
            case "text":
                return "#FFFFFF";
            default:
                return config.tempestAuraNotice.customStyle.fontColor;
        }
    }

    function sendResetNotice(icon) {
        mod.send("S_CUSTOM_STYLE_SYSTEM_MESSAGE", 1, {
            message: `<img src="img://__${icon}" width="${config.skillReset.icon.width}" height="${config.skillReset.icon.height}" vspace="${config.skillReset.icon.vspace}"/><font size="${config.skillReset.font.size}" color="${config.skillReset.font.color}">&nbsp;${config.skillReset.text}</font>`,
            style: config.skillReset.style
        });
    }

    function loadSkillIcons() {
        skillIcons.clear();
        mod.queryData("/SkillIconData/Icon@class=?/", [mod.game.me.class], true, false, ["skillId", "iconName"]).then(result => {
            for (const icon of result) {
                const skillId = Number(icon.attributes.skillId);
                const iconName = icon.attributes.iconName;
                skillIcons.set(skillId, iconName);
                skillIcons.set(getSkillBase(skillId), iconName);
            }
        }).catch(() => {
            // Ignore datacenter lookup failures; reset notices will simply not render icons.
        });
    }

    function getSkillBase(skillId) {
        return Math.floor(skillId / 10000);
    }

    function shouldDisableResetModule() {
        if (!config.skillReset.disableWhenExternalModulePresent) {
            return false;
        }

        const externalModulePath = path.join(__dirname, "..", config.skillReset.externalModuleName);
        return fs.existsSync(externalModulePath);
    }

    function countSkill(skillName, skillId) {
        const now = Date.now();
        const last = lastCounted[skillName];
        if (last.skillId === skillId && now - last.at < 250) return;

        lastCounted[skillName] = { skillId, at: now };
        current[skillName] += 1;
        total[skillName] += 1;
    }

    function getChatVersion() {
        return mod.majorPatchVersion === 92 || mod.majorPatchVersion === 100 ? 3 : 4;
    }
};

function createCounter() {
    return {
        Scythe: 0,
        "Aerial Scythe": 0
    };
}

function createLastCounted() {
    return {
        Scythe: { skillId: 0, at: 0 },
        "Aerial Scythe": { skillId: 0, at: 0 }
    };
}




















