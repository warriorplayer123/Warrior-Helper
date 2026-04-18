# ⚔️ Warrior Helper

> Advanced Warrior utility module
> Includes **Skill Reset notifications**, **Deadly Gamble tracking**, **Tempest Aura (I & II)** and **Traverse Cut alerts**

---

## ✨ Features

### 🔁 Skill Reset Notifications

* Visual alert with **skill icon + styled text**
* Anti-spam protection
* Toggle in-game (`resets` / `rs`)
* Auto-disabled if external module is detected

---

### 🗡️ Deadly Gamble Counter

* Tracks **Scythe** and **Aerial Scythe** during Deadly Gamble
* Shows styled summary when buff ends
* Keeps session totals

```text
AERIAL: X / SCYTHE: Y
```

* Summary uses **custom color setting** (separate from TA)

---

### 🌪️ Tempest Aura (TA)

* Tracks stack buildup (0 → 50)
* Sends **SOON warning** when threshold is reached
* Sends delayed **ACTIVE notification**
* Supports **custom color + optional icons**

```text
[TA] SOON
[TA] ACTIVE
```

---

### ⚡ Tempest Aura II (TA2)

* Detects activation during Deadly Gamble
* Shows activation notice
* Shows **3-second warning before expiration**
* Uses same styling system as TA

```text
[TA II] ACTIVE
[TA II] 3 SEC
```

---

### ⚔️ Traverse Cut (TC)

* Tracks Traverse Cut via **abnormality (buff)**
* Shows **5-second warning before expiration**
* Supports **icon display (if configured)**

```text
[TC] 5 SEC
```

#### Duration handling:

* Uses real **packet duration** when available
* Falls back to config value if needed
* Handles ms/sec inconsistencies automatically 

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

| Command                 | Description          |
| ----------------------- | -------------------- |
| `whelper resets`        | Toggle reset notices |
| `whelper resets on/off` | Enable / Disable     |
| `whelper resets status` | Show status          |
| `whelper rs`            | Alias toggle         |
| `whelper rs on/off`     | Alias enable/disable |

**Status:**

* `ON` → enabled
* `OFF` → disabled
* `EXT` → disabled by external module

---

### 🎨 Visual Settings

#### Tempest Aura colors

| Command                | Description  |
| ---------------------- | ------------ |
| `whelper colors`       | Show colors  |
| `whelper color <name>` | Set TA color |

---

#### Scythe Summary colors

| Command                      | Description       |
| ---------------------------- | ----------------- |
| `whelper scythecolors`       | Show colors       |
| `whelper scythecolor <name>` | Set summary color |

---

Available colors:

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
  "ta2EndingSoonMs": 5000
},
"traverseCut": {
  "durationMs": 27000,
  "endingSoonMs": 3000
}
```

---

### Additional options:

* TA icons (`tempestAuraNotice.icons`)
* TC icon (`traverseCut.iconSkillId`)
* Reset styling (icon, font, sound)
* Buff / skill IDs

---

## 💾 Settings

Stored in:

```
settings.json
```

Includes:

* Module toggle
* TA / TA2 / TC toggles
* Reset toggle
* TA color
* Scythe summary color

---

## ⚠️ Notes

* Works only for **Warrior**
* Uses real-time packet data
* Includes fallback logic for missing durations
* TC / TA2 behavior depends on server packets

---

## 🙏 Credits

Original skill reset module:
https://github.com/eemj/skill-resets

This module is partially based on and inspired by their implementation.

**jkq** for the TERA guide module and enabling integration of reset notifications.
