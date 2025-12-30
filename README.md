<img width="747" height="382" alt="image" src="https://github.com/user-attachments/assets/3a63d72d-6b25-415e-9947-cd7b1d83f5f3" />


# F-RootKiller: Advanced Android Root Detection Bypass Suite

**F-RootKiller** is an advanced Frida-based instrumentation suite designed for **Android App VAPT** (Vulnerability Assessment and Penetration Testing) and security auditing. It enables researchers to bypass deep-rooted environment integrity checks by masking root indicators, spoofing system properties, and intercepting native library calls in real-time.

---

## Target Security Mechanisms
During a security audit, root detection is often the first barrier to dynamic analysis. F-RootKiller is engineered to neutralize the following detection vectors:

* **File & Package Fingerprinting**: Masks the presence of `su`, `magisk`, `busybox`, and common superuser management applications.
* **Runtime & Shell Protection**: Blocks suspicious shell commands such as `which su` or `id` and redirects execution to safe outputs.
* **SELinux Hardening**: Implements multiple native hooks into `libselinux.so` to force a `Permissive` or `Disabled` status across various Android versions.
* **UID Masking**: Spoofs the process UID to `1000` (system) to evade applications that perform UID-based root verification.
* **Attestation Spoofing**: Simulates certified device responses for modern **Google Play Integrity API** and legacy **SafetyNet** attestation.
* **Library-Level Detection**: Provides built-in bypasses for popular third-party detection libraries like **RootBeer**.

---

## Key Features
* **Sequential Loading**: Clean UI that initializes 11 distinct bypass mechanisms one by one.
* **Native /proc Filtering**: Intercepts and sanitizes `/proc/mounts` and `/proc/self/mountstats` to remove traces of Magisk or Zygisk mounts.
* **Environment Sanitizer**: Automatically cleans dangerous environment variables like `PATH` and `LD_PRELOAD`.
* **Stealth Mode**: Designed to be lightweight with minimal logging to avoid detection by certain anti-frida timings.

---

## Features
* Root File & Path Hiding: Bypasses File.exists checks for common SU binaries and root paths.
* Shell Command Blocking: Intercepts Runtime.exec for "su", "which", "magisk" commands.
* Package Hiding: Hides root-related apps like Magisk from PackageManager queries.
* Build Tag Spoofing: Fakes ro.build.tags from "test-keys" to "release-keys".
* UID Spoofing: Returns system UID (1000) instead of root (0).
* Environment Variable Cleaning: Clears suspicious env vars like PATH, LD_PRELOAD, MAGISK.
* Storage Volume Cleaning: Removes Magisk-related paths from storage volumes.
* SELinux Flag Bypass: Comprehensive spoofing across 9 methods, including properties, shell commands, native libselinux hooks, file access interception, stat blocking, Java methods, memory patching, and context manipulation.
* Native-Level /proc Filtering: Sanitizes /proc/mounts and filesystems to hide Magisk/SU traces.
* Play Integrity Placeholder: Basic logging for integrity checks (NOT WORKING CURRENTLY).
* Colorful & Dynamic Console Output: ANSI-colored logs for better readability during testing (green for success, red for warnings).
* Wireless ADB Optimization: Delayed heavy hooks for stability on TCP connections.

---

## Usage

### Prerequisites
1.  **Frida-Server**: Installed and running on the target Android device.
2.  **Frida-Tools**: Installed on your workstation (`pip install frida-tools`).
3.  **ADB**: Connection established with the target device.
4.  Rooted Android device (Magisk recommended for modern hiding).

### Installation
1. Download the script (f-rootkiller.js).
2. Push frida-server to device:
```bash
adb push frida-server /data/local/tmp/
adb shell
su
chmod +x /data/local/tmp/frida-server
/data/local/tmp/frida-server &
 ```
3. For wireless ADB (optional but optimized in script):
```bash
adb tcpip 5555
adb connect <device-ip>:5555
 ```

### Execution
To spawn an application and inject the bypass suite immediately:
```bash
frida -U -f <com.package.name> -l advanced_bypass.js
 ```
### Running the Script

* USB ADB (recommended for stability):
1. Attach to running app:
```bash
textfrida -U -p <PID> -l f-rootkiller.js
```
2. Spawn fresh (force new process):
```bash
   textfrida -U -f <package-name> -l f-rootkiller.js --no-pauseExample for RootBeer Sample:textfrida -U -f com.scottyab.rootbeer.sample -l f-rootkiller.js --no-pause
```
3. Wireless ADB (optimized with delays):
```bash
Attach:textfrida -H <device-ip>:5555 -N <package-name> -l f-rootkiller.jsExample for RootCheckerPro:textfrida -H 192.168.1.100:5555 -N com.joeykrim.rootcheck -l f-rootkiller.js
```
* Note: Open app manually first for attach; use USB for spawn if possible.

* ZygiskFrida Setup (for stealth against anti-Frida apps like Momo/Hunter):
1. Install ZygiskFrida module in Magisk → reboot.
2. Add targets: adb shell su -c "echo '<package>' > /data/local/tmp/re.zyg.fri/target_packages"
3. Use: frida -N <package> -l f-rootkiller.js


Observe colored console output for bypassed detections. For VAPT reports, log outputs provide evidence of successful bypasses.

---

## Legal Disclaimer
This tool is provided for educational and security research purposes only. It is intended to assist in vulnerability assessment, penetration testing, and QA of Android apps in controlled environments.

* Do not use to circumvent protections in production apps without permission.
* Misuse may violate laws (e.g., CFAA in US, Computer Misuse Act in UK).
* The author assumes no responsibility for any misuse or damage caused.

Always obtain explicit authorization from app owners before testing. Use ethically.

---

## Credits

Original Author: Beast (base script inspiration)

Special thanks to the Frida community for the powerful tooling.

---

## License
This project is licensed under the MIT License - see the LICENSE file for details.
Copyright (c) 2025 BEAST


---

## Real-time Monitoring

The script provides detailed console output during the VAPT process:

* [+] Bypassed File.exists → Shows the specific path the app tried to verify.

* [!] Blocked Runtime.exec → Identifies which shell commands the app uses for detection.

* [INTEGRITY] Bypassed Request → Confirms the app attempted cloud-based attestation.


