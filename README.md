# ⚔️ Warrior Helper

> Advanced Warrior utility module
> Includes **Skill Reset notifications**, **Deadly Gamble tracking**, **Tempest Aura (I & II)** and **Traverse Cut alerts**

---

## ✨ Features

### 🔁 Skill Reset Notifications

* Visual alert when skills reset (icon + styled text)
* Anti-spam protection
* Can be toggled in-game
* Automatically disabled if external reset module is detected

---

### 🗡️ Deadly Gamble Counter

* Tracks **Scythe** and **Aerial Scythe** hits during Deadly Gamble
* Displays result after buff ends
* Keeps session totals

```
AERIAL: X / SCYTHE: Y
```

---

### 🌪️ Tempest Aura (TA)

* Tracks stack buildup (0 → 50)
* Warns when aura is about to activate
* Delayed **ACTIVE** notification for better timing

```
[TA] SOON
[TA] ACTIVE
```

---

### ⚡ Tempest Aura II (TA2)

* Detects activation during Deadly Gamble
* Shows activation notice
* Shows **3-second warning before expiration**

```
[TA II] ACTIVE
[TA II] 3 SEC
```

---

### ⚔️ Traverse Cut (TC)

* Tracks Traverse Cut buff via abnormality or skill trigger
* Shows **3-second warning before buff ends**

```
[TC] 3 SEC
```

* Handles duration automatically (fallback + normalization) 

---

## 🎮 Commands

### 🔧 Main

| Command          | Description        |
| ---------------- | ------------------ |
| `whelper`        | Toggle module      |
| `whelper on/off` | Enable / Disable   |
| `whelper status` | Quick status       |
| `whelper stats`  | Detailed stats     |
| `whelper reset`  | Reset all counters |
| `whelper help`   | Show help          |

---

### 🌪️ Tempest Aura

| Command             | Description      |
| ------------------- | ---------------- |
| `whelper ta`        | Toggle TA        |
| `whelper ta on/off` | Enable / Disable |
| `whelper ta status` | Show status      |

---

### ⚡ Tempest Aura II

| Command              | Description      |
| -------------------- | ---------------- |
| `whelper ta2`        | Toggle TA2       |
| `whelper ta2 on/off` | Enable / Disable |
| `whelper ta2 status` | Show status      |

---

### ⚔️ Traverse Cut

| Command             | Description      |
| ------------------- | ---------------- |
| `whelper tc`        | Toggle TC        |
| `whelper tc on/off` | Enable / Disable |
| `whelper tc status` | Show status      |

---

### 🔁 Skill Reset Controls

| Command                 | Description            |
| ----------------------- | ---------------------- |
| `whelper resets`        | Toggle reset notices   |
| `whelper resets on/off` | Enable / Disable       |
| `whelper resets status` | Show status            |
| `whelper rs`            | Short alias (toggle)   |
| `whelper rs on/off`     | Alias enable / disable |

**Status indicators:**

* `ON` → enabled
* `OFF` → disabled
* `EXT` → disabled by external module

---

### 🎨 Visual Settings

| Command                | Description             |
| ---------------------- | ----------------------- |
| `whelper colors`       | Show available colors   |
| `whelper color <name>` | Change TA message color |

Available:

```
green, blue, red, info, text
```



---

## ⚙️ Configuration

Main file:

```
config.json
```

### Key settings:

```json
"thresholds": {
  "tempestAuraSoon": 40,
  "tempestAuraActiveDelayMs": 1200,
  "ta2DurationMs": 10000,
  "ta2EndingSoonMs": 3000
},
"traverseCut": {
  "durationMs": 27000,
  "endingSoonMs": 3000
}
```



---

## 💾 Settings

Stored automatically in:

```
settings.json
```

Supports:

* Module enable/disable
* Reset toggle
* TA / TA2 / TC toggles
* Custom message color

Default values defined via migrator 

---

## ⚠️ Notes

* Works only for **Warrior class** 
* Designed for real-time combat feedback
* Includes internal fallback logic for timing and durations
* Edge cases may still exist (especially TA2 / TC detection)

---

## 🙏 Credits

Original skill reset module:
https://github.com/eemj/skill-resets

This module is partially based on and inspired by their implementation.

**jkq** for the TERA guide module and for enabling adaptation of reset notifications.
