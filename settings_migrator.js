const DefaultSettings = {
    enabled: true,
    resetsEnabled: true,
    tempestAuraColor: "blue",
    summaryColor: "text",
    taEnabled: true,
    ta2Enabled: false,
    tcEnabled: true
};

module.exports = function MigrateSettings(from_ver, to_ver, settings) {
    if (from_ver === undefined) {
        return { ...DefaultSettings, ...settings };
    }

    if (from_ver === null) {
        return { ...DefaultSettings };
    }

    if (from_ver + 1 < to_ver) {
        settings = MigrateSettings(from_ver, from_ver + 1, settings);
        return MigrateSettings(from_ver + 1, to_ver, settings);
    }

    switch (to_ver) {
        default:
            return { ...DefaultSettings, ...settings };
    }
};
