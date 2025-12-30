/**
 * F-RootKiller - Advanced Root Detection Bypass Suite
 * Targeted at fully bypassing Root Detection Mechanism
 *Targets: File checks, Runtime execution, and Package Manager
 * Author: Beast
 * For internal QA/testing purposes only - NOT for production use!
 */

Java.perform(function () {
    // === ANSI Color Definitions ===
    const R = "\x1b[31m"; // Red
    const G = "\x1b[32m"; // Green
    const Y = "\x1b[33m"; // Yellow
    const B = "\x1b[34m"; // Blue
    const M = "\x1b[35m"; // Magenta
    const C = "\x1b[36m"; // Cyan
    const W = "\x1b[37m"; // White
    const RESET = "\x1b[0m";

    //Common root indicators
    const RootPackages = [
        "com.noshufou.android.su",
        "com.thirdparty.superuser",
        "eu.chainfire.supersu",
        "com.koushikdutta.superuser",
        "com.zachspong.temprootremovejb",
        "com.ramdroid.appquarantine",
        "com.topjohnwu.magisk"
    ];

    const RootBinaries = ["su", "busybox", "magisk", "daemonsu", "supersu"];

    const RootPaths = [
        "/system/app/Superuser.apk",
        "/sbin/su",
        "/system/bin/su",
        "/system/xbin/su",
        "/data/local/xbin/su",
        "/data/local/bin/su",
        "/system/sd/xbin/su",
        "/system/bin/failsafe/su",
        "/data/local/su",
        "/su/bin/su",
        "/data/adb/magisk"
    ];

    let uidSpoofMessageShown = false;

    // 1. Hide root files via File.exists
    try {
        const File = Java.use("java.io.File");
        File.exists.implementation = function () {
            const path = this.getAbsolutePath();
            const name = this.getName();

            if (RootBinaries.includes(name) || RootPaths.includes(path)) {
                console.log(G + "[+] Bypassed File.exists → " + W + path + RESET);

                if (!uidSpoofMessageShown) {
                    console.log(C + "[!] Spoofing UID from root to system" + RESET);
                    uidSpoofMessageShown = true;
                }

                return false;
            }
            return this.exists.call(this);
        };
    } catch (e) {
        console.log(Y + "[!] File.exists hook skipped" + RESET);
    }

    // 2. Block suspicious shell commands
    try {
        const Runtime = Java.use("java.lang.Runtime");
        Runtime.exec.overload('java.lang.String').implementation = function (cmd) {
            if (/su|which|magisk/i.test(cmd)) {
                console.log(R + "[!] Blocked Runtime.exec → " + W + cmd + RESET);
                return Runtime.exec.call(this, "echo denied");
            }
            return this.exec.call(this, cmd);
        };
    } catch (e) {
        console.log(Y + "[!] Runtime.exec hook skipped" + RESET);
    }

    // 3. Hide root-related packages
    try {
        const PackageManager = Java.use("android.app.ApplicationPackageManager");
        PackageManager.getPackageInfo.overload('java.lang.String', 'int').implementation = function (pkg, flags) {
            if (RootPackages.includes(pkg)) {
                console.log(B + "[+] Hiding package: " + W + pkg + RESET);
                throw Java.use("android.content.pm.PackageManager$NameNotFoundException").$new(pkg);
            }
            return this.getPackageInfo.call(this, pkg, flags);
        };
    } catch (e) {
        console.log(Y + "[!] Package hiding hook skipped" + RESET);
    }

    // 4. Spoof build tags
    try {
        const SystemProperties = Java.use("android.os.SystemProperties");
        SystemProperties.get.overload('java.lang.String').implementation = function (key) {
            const value = this.get.call(this, key);
            if (key === "ro.build.tags" && value.includes("test-keys")) {
                console.log(G + "[+] Spoofed ro.build.tags → " + W + "release-keys" + RESET);
                return "release-keys";
            }
            return value;
        };
    } catch (e) {
        console.log(Y + "[!] Build tags hook skipped" + RESET);
    }

    // 5. UID spoof
    try {
        const Process = Java.use("android.os.Process");
        Process.myUid.implementation = function () {
            return 1000;
        };
    } catch (e) {
        console.log(Y + "[!] UID spoof hook skipped" + RESET);
    }

    // 6. Clean dangerous environment variables
    try {
        const System = Java.use("java.lang.System");
        System.getenv.overload('java.lang.String').implementation = function (name) {
            if (/PATH|LD_PRELOAD|MAGISK/i.test(name)) {
                console.log(M + "[+] Cleaned env: " + W + name + RESET);
                return "";
            }
            return this.getenv.call(this, name);
        };
    } catch (e) {
        console.log(Y + "[!] Environment variables hook skipped" + RESET);
    }

    // 7. Storage volumes hook
    try {
        let StorageManager = null;
        try { StorageManager = Java.use("android.os.storage.StorageManager"); } catch (e) {}
        if (!StorageManager) try { StorageManager = Java.use("android.os.mount.MountService"); } catch (e) {}

        if (StorageManager && StorageManager.getStorageVolumes) {
            StorageManager.getStorageVolumes.overload().implementation = function () {
                const volumes = this.getStorageVolumes.call(this);
                const clean = [];
                for (let i = 0; i < volumes.size(); i++) {
                    const path = volumes.get(i).getPath().toString();
                    if (!path.includes("magisk")) clean.push(volumes.get(i));
                }
                return clean;
            };
        }
    } catch (e) {
        console.log(Y + "[!] Storage volumes hook skipped" + RESET);
    }


    // 8. PLAY INTEGRITY & SAFETYNET BYPASS

    // --- Play Integrity API Bypass (Modern) ---
    try {
        const IntegrityManager = Java.use("com.google.android.play.core.integrity.IntegrityManager");
        IntegrityManager.requestIntegrityToken.overload('android.app.Activity', 'java.lang.String', 'com.google.android.play.core.integrity.IntegrityTokenRequest').implementation = function(activity, nonce, request) {
            console.log(G + "[INTEGRITY] Bypassed Play Integrity request" + RESET);
            
            const now = Math.floor(new Date().getTime() / 1000);
            const expTime = now + 3600;
            const fakeToken = "fake_integrity_token_" + Date.now() + "_" + Math.random().toString(36).substring(2, 15);

            const TaskCompletionSource = Java.use("com.google.android.play.core.tasks.TaskCompletionSource");
            const source = TaskCompletionSource.$new();
            const tokenResponse = Java.use("com.google.android.play.core.integrity.IntegrityTokenResponse").$new(fakeToken);
            source.getTask().setResult(tokenResponse);
            
            return source.getTask();
        };
    } catch (e) {
        if (e.message.includes("ClassNotFoundException")) {
            console.log("\n" + C + "[*] Play Integrity Not Found." + RESET);
        } else {
            console.log(Y + "[INTEGRITY] Play Integrity hook failed." + RESET);
        }
    }

    // --- SafetyNet Attestation API Bypass (Legacy) ---
    try {
        const SafetyNet = Java.use("com.google.android.gms.safetynet.SafetyNetClient");
        SafetyNet.attest.overload('android.app.Activity', 'java.lang.String').implementation = function(activity, nonce) {
            console.log(G + "[SAFETYNET] Bypassed SafetyNet attestation" + RESET);

            const now = Math.floor(new Date().getTime() / 1000);
            const expTime = now + 3600;
            const fakeJWS = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJnb29nbGVwbGF5Iiwic3ViIjoiZmFrZV9kZXZpY2VfaWQiLCJpc3MiOiJnb29nbGVwbGF5IiwiaWF0Ijox${now}LCJleHAiOjE${expTime}LCJub25jZSI6IiR7bm9uY2V9IiwiYWRwIjpmYWxzZSwiY3BwIjp0cnVlLCJyZXF1ZXN0X3JlY2VudF9hY3Rpdml0eV9lbmZvcmNlZCI6dHJ1ZSwibm91bmNlX3JlY2VudF9hY3Rpdml0eV9lbmZvcmNlZCI6dHJ1ZSwibWF4X2Jpb21ldHJpY3NfZW5mb3JjZWQiOnRydWUsIm1ldGFkYXRhIjp7ImRldmljZV9yZWNvcmRfYXR0ZXN0YXRpb24iOnRydWUsImRldmljZV9yZWNvcmRfYmFzaWNfaW50ZWdyaXR5Ijp0cnVlLCJkZXZpY2VfcmVjb3JkX2NhbGxlZF9wYWNrYWdlX2hhc2giOnRydWUsImRldmljZV9yZWNvcmRfcHJvcGVydHlfZmlzaHkiOmZhbHNlLCJkZXZpY2VfcmVjb3JkX3Byb3BlcnR5X25vdGZpc2h5Ijp0cnVlLCJkZXZpY2VfcmVjb3JkX2RldmljZV9pZCI6dHJ1ZSwiZGV2aWNlX3JlY29yZF90aW1lc3RhbXBfY29uc2lzdGVuY3kiOnRydWV9LCJub3RlIjoidGVzdCJ9.fake_signature_placeholder`;

            const Tasks = Java.use("com.google.android.gms.tasks.Tasks");
            const AttestationResponse = Java.use("com.google.android.gms.safetynet.SafetyNetApi$AttestationResponse");
            const result = AttestationResponse.$new(fakeJWS);

            return Tasks.forResult(result);
        };
    } catch (e) {
        if (e.message.includes("ClassNotFoundException")) {
            console.log(C + "[*] SafetyNet Not Found." + RESET);
        } else {
            console.log(Y + "[SAFETYNET] SafetyNet hook failed." + RESET);
        }
    }



    // 9. SELinux hardening 
   

    // Force RootBeer methods (if present)
    try {
        const RootBeer = Java.use("com.scottyab.rootbeer.RootBeer");
        RootBeer.isRooted.implementation = function() { return false; };
        RootBeer.isRootedWithoutBusyBoxCheck.implementation = function() { return false; };
        RootBeer.checkForSuBinary.implementation = function() { return false; };
        RootBeer.checkForDangerousProps.implementation = function() { return false; };
        RootBeer.checkForRWPaths.implementation = function() { return false; };
        RootBeer.checkSuExists.implementation = function() { return false; };
        RootBeer.checkForRootNative.implementation = function() { return false; };
    } catch (e) { /* silent */ }

    // SELinux bypass method 1: Native Library Function Hooking (libselinux.so)
    try {
        var isSELinuxEnabledPtr = Module.findExportByName("libselinux.so", "is_selinux_enabled");
        if (isSELinuxEnabledPtr) {
            Interceptor.attach(isSELinuxEnabledPtr, {
                onLeave: function (retval) {
                    console.log(G + "[SELINUX] is_selinux_enabled() → forcing 0 (disabled)" + RESET);
                    retval.replace(ptr(0));
                }
            });
        }

        var securityGetenforcePtr = Module.findExportByName("libselinux.so", "security_getenforce");
        if (securityGetenforcePtr) {
            Interceptor.attach(securityGetenforcePtr, {
                onLeave: function (retval) {
                    console.log(G + "[SELINUX] security_getenforce() → forcing 0 (permissive)" + RESET);
                    retval.replace(ptr(0));
                }
            });
        }
    } catch (e) {
        console.log(Y + "[!] SELinux native hooking skipped" + RESET);
    }

    // SELinux bypass method 2: File System Access Interception
    try {
        var openPtr = Module.findExportByName("libc.so", "open");
        if (openPtr) {
            Interceptor.attach(openPtr, {
                onEnter: function (args) {
                    var path = args[0].readCString();
                    if (path === "/proc/sys/fs/selinux/enforce" || 
                        path === "/sys/fs/selinux/enforce") {
                        console.log(R + "[SELINUX] Blocked open() for " + W + path + RESET);
                        this.isSELinuxFile = true;
                    }
                },
                onLeave: function (retval) {
                    if (this.isSELinuxFile) {
                        retval.replace(ptr(-1));
                    }
                }
            });
        }
    } catch (e) {
        console.log(Y + "[!] SELinux file system access interception skipped" + RESET);
    }

    // SELinux bypass method 3: Command Execution Bypass
    try {
        var Runtime = Java.use("java.lang.Runtime");
        Runtime.exec.overload("[Ljava.lang.String;").implementation = function (cmdArray) {
            if (cmdArray.length > 0) {
                var cmd = cmdArray[0];
                if (cmd.indexOf("getenforce") !== -1) {
                    console.log(G + "[SELINUX] Redirected getenforce command" + RESET);
                    return Runtime.exec.call(this, ["sh", "-c", "echo Permissive"]);
                }
            }
            return this.exec(cmdArray);
        };
    } catch (e) {
        console.log(Y + "[!] SELinux command execution bypass skipped" + RESET);
    }

    // SELinux bypass method 4: System Property Spoofing
    try {
        var SysProps = Java.use("android.os.SystemProperties");
        SysProps.get.overload("java.lang.String").implementation = function (key) {
            if (key === "ro.build.selinux") {
                console.log(G + "[SELINUX] Bypassing ro.build.selinux" + RESET);
                return "0";
            }
            if (key === "ro.secure") {
                console.log(G + "[SELINUX] Bypassing ro.secure" + RESET);
                return "0";
            }
            return this.get(key);
        };
    } catch (e) {
        console.log(Y + "[!] SELinux system property spoofing skipped" + RESET);
    }

    // SELinux bypass method 5: stat() Function Interception
    try {
        var statPtr = Module.findExportByName("libc.so", "stat");
        if (statPtr) {
            Interceptor.attach(statPtr, {
                onEnter: function (args) {
                    var path = args[0].readCString();
                    if (path && (path.indexOf("selinux") !== -1 || 
                                path.indexOf("/sys/fs/selinux") !== -1)) {
                        console.log(R + "[SELINUX] Blocked stat() for " + W + path + RESET);
                        this.shouldBlock = true;
                    }
                },
                onLeave: function (retval) {
                    if (this.shouldBlock) {
                        retval.replace(ptr(-1));
                    }
                }
            });
        }
    } catch (e) {
        console.log(Y + "[!] SELinux stat() interception skipped" + RESET);
    }

    // SELinux bypass method 6: Java-Level Method Hooking
    try {
        var Process = Java.use("android.os.Process");
        Process.myUid.implementation = function () {
            var uid = this.myUid();
            if (uid === 0) {
                console.log(C + "[SELINUX] Spoofing root UID to system" + RESET);
                return 1000;
            }
            return uid;
        };
    } catch (e) {
        console.log(Y + "[!] SELinux Java-level method hooking skipped" + RESET);
    }

    // SELinux bypass method 7: Memory Patching Approach
    try {
        function patchSELinuxChecks() {
            var ranges = Process.enumerateRanges('r-x');
            ranges.forEach(function(range) {
                try {
                    Memory.scan(range.base, range.size, "73 65 6C 69 6E 75 78", {
                        onMatch: function(address, size) {
                            console.log(M + "[SELINUX] Found SELinux string at: " + W + address + RESET);
                            Memory.writeByteArray(address, [0x00, 0x00, 0x00, 0x00]);
                        },
                        onComplete: function() {}
                    });
                } catch (e) {}
            });
        }
        patchSELinuxChecks();
    } catch (e) {
        console.log(Y + "[!] SELinux memory patching skipped" + RESET);
    }

    // SELinux bypass method 8: Context Manipulation
    try {
        var getconPtr = Module.findExportByName("libselinux.so", "getcon");
        if (getconPtr) {
            Interceptor.attach(getconPtr, {
                onLeave: function (retval) {
                    if (retval.toInt32() === 0) {
                        var context = "u:r:untrusted_app:s0";
                        Memory.writeUtf8String(this.contextPtr, context);
                        console.log(G + "[SELINUX] Spoofed context to: " + W + context + RESET);
                    }
                }
            });
        }
    } catch (e) {
        console.log(Y + "[!] SELinux context manipulation skipped" + RESET);
    }

    // SELinux bypass method 9: Comprehensive SELinux Bypass Script
    try {
        console.log(C + "[*] SELinux Bypass Suite Loading..." + RESET);
    
        var isSEEnabledPtr = Module.findExportByName("libselinux.so", "is_selinux_enabled");
        if (isSEEnabledPtr) {
            Interceptor.attach(isSEEnabledPtr, {
                onLeave: function(retval) {
                    console.log(G + "[SELINUX] is_selinux_enabled() → 0" + RESET);
                    retval.replace(ptr(0));
                }
            });
        }
    
        var secGetEnforcePtr = Module.findExportByName("libselinux.so", "security_getenforce");
        if (secGetEnforcePtr) {
            Interceptor.attach(secGetEnforcePtr, {
                onLeave: function(retval) {
                    console.log(G + "[SELINUX] security_getenforce() → 0" + RESET);
                    retval.replace(ptr(0));
                }
            });
        }
    
        var opPtr = Module.findExportByName("libc.so", "open");
        if (opPtr) {
            Interceptor.attach(opPtr, {
                onEnter: function(args) {
                    var path = args[0].readCString();
                    if (path && (path.indexOf("selinux") !== -1 || 
                                path.indexOf("/proc/sys/fs/selinux") !== -1)) {
                        console.log(R + "[SELINUX] Blocked open: " + W + path + RESET);
                        this.block = true;
                    }
                },
                onLeave: function(retval) {
                    if (this.block) retval.replace(ptr(-1));
                }
            });
        }
    
        var SP = Java.use("android.os.SystemProperties");
        SP.get.overload("java.lang.String").implementation = function(key) {
            if (key === "ro.build.selinux") return "0";
            if (key === "ro.secure") return "0";
            return this.get(key);
        };
    
        var RT = Java.use("java.lang.Runtime");
        RT.exec.overload("java.lang.String").implementation = function(cmd) {
            if (cmd.indexOf("getenforce") !== -1) {
                console.log(G + "[SELINUX] Blocked getenforce" + RESET);
                return RT.exec.call(this, "echo Permissive");
            }
            return this.exec(cmd);
        };
    
        console.log(G + "[*] SELinux Bypass Suite Loaded" + RESET);
    } catch (e) {
        console.log(Y + "[!] SELinux comprehensive bypass skipped" + RESET);
    }

    // 10. Native-level /proc filtering
    try {
        const FileInputStream = Java.use("java.io.FileInputStream");
        FileInputStream.read.overload('[B').implementation = function (buffer) {
            const path = this.getFD ? this.getFD().toString() : "unknown";
            if (path.includes("/proc/") && (path.includes("mounts") || path.includes("filesystems"))) {
                let data = this.read.call(this, buffer);
                if (data > 0) {
                    let content = Java.array('byte', buffer).toString();
                    content = content.replace(/magisk|su/gi, "");
                    for (let i = 0; i < Math.min(data, buffer.length); i++) {
                        buffer[i] = content.charCodeAt(i);
                    }
                }
                return data;
            }
            return this.read.call(this, buffer);
        };
    } catch (e) {
        console.log(Y + "[!] /proc filtering hook skipped" + RESET);
    }
    
    console.log("\n" + C + "═".repeat(51) + RESET);
    console.log(G + "F-RootKiller: Advanced Root Detection Bypass Suite" + RESET);
    console.log(C + "═".repeat(51) + RESET);
});
