# ⚔️ Warrior Helper

> Advanced Warrior utility module
> Includes **Skill Reset notifications**, **Deadly Gamble tracking**, and **Tempest Aura (I & II) alerts**

---

## ✨ Features

### 🔁 Skill Reset Notifications

* Visual alert when skills reset (icon + styled text)
* Optional sound support
* Anti-spam protection
* Automatically disables itself if external reset module is detected

---

### 🗡️ Deadly Gamble Counter

* Tracks **Scythe** and **Aerial Scythe** hits during Deadly Gamble
* Shows result after buff ends
* Keeps session totals

```
AERIAL: X / SCYTHE: Y
```

---

### 🌪️ Tempest Aura (TA) Tracking

* Tracks stack buildup (0 → 50)
* Warns when aura is about to activate
* Delayed "ACTIVE" notification for better timing accuracy

```
[TA] SOON
[TA] ACTIVE
```

* Smart logic prevents false triggers and spam 

---

### ⚡ Tempest Aura II (TA2) Alerts

* Detects TA2 activation during Deadly Gamble
* Shows activation notice
* Shows **“3 seconds remaining”** warning before it ends

```
[TA II] ACTIVE
[TA II] 3 SEC
```

* Timing is configurable (default: 10s duration, 3s warning) 

---

## 🎮 Commands

### 🔧 Main

| Command          | Description      |
| ---------------- | ---------------- |
| `whelper`        | Toggle module    |
| `whelper on/off` | Enable / Disable |
| `whelper status` | Quick status     |
| `whelper stats`  | Detailed stats   |
| `whelper reset`  | Reset counters   |
| `whelper help`   | Show help        |

---

### 🌪️ Tempest Aura

| Command             | Description                  |
| ------------------- | ---------------------------- |
| `whelper ta on/off` | Enable / Disable TA warnings |
| `whelper ta status` | Show TA status               |

---

### ⚡ Tempest Aura II

| Command                   | Description                 |
| ------------------------- | --------------------------- |
| `whelper ta2 on/off`      | Enable / Disable TA2 alerts |
| `whelper ta2 status`      | Show TA2 status             |
| `whelper ta2debug on/off` | Debug TA2 packets           |

---

### 🎨 Visual Settings

| Command                | Description             |
| ---------------------- | ----------------------- |
| `whelper colors`       | Show available colors   |
| `whelper color <name>` | Change TA message color |

Available colors:

```
green, blue, red, info, text
```



---

## ⚙️ Configuration

Main config file:

```
config.json
```

### Key options:

```json
"thresholds": {
  "tempestAuraSoon": 40,
  "tempestAuraActiveDelayMs": 1200,
  "ta2DurationMs": 10000,
  "ta2EndingSoonMs": 3000
}
```

You can customize:

* TA warning threshold
* TA activation delay
* TA2 timing
* Message text
* Colors & styles
* Skill / buff IDs

---

## 💾 Settings

Stored automatically in:

```
settings.json
```

Supports:

* Enable/disable module
* TA / TA2 toggles
* Custom message color

Includes automatic migration system 

---

## ⚠️ Notes

* Works only for **Warrior class** 
* Designed for real-time combat feedback
* Edge cases may still exist (especially TA2 detection)
