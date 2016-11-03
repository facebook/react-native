---
id: running-on-device-android
title: Running On Device
layout: docs
category: Guides (Android)
permalink: docs/running-on-device-android.html
next: signed-apk-android
previous: headless-js-android
---

<div class="toggler">
<style>
.toggler a {
  display: inline-block;
  padding: 10px 5px;
  margin: 2px;
  border: 1px solid #05A5D1;
  border-radius: 3px;
  text-decoration: none !important;
}
.display-os-mac .toggler .button-mac,
.display-os-linux .toggler .button-linux,
.display-os-windows .toggler .button-windows {
  background-color: #05A5D1;
  color: white;
}
block { display: none; }
.display-platform-android.display-os-mac .android.mac,
.display-platform-android.display-os-linux .android.linux,
.display-platform-android.display-os-windows .android.windows {
  display: block;
}
</style>
<span>Development OS:</span>
<a href="javascript:void(0);" class="button-mac" onclick="display('os', 'mac')">macOS</a>
<a href="javascript:void(0);" class="button-linux" onclick="display('os', 'linux')">Linux</a>
<a href="javascript:void(0);" class="button-windows" onclick="display('os', 'windows')">Windows</a>
</div>

<block class="mac windows linux android" />

## Prerequisite: USB Debugging

You'll need this in order to install your app on your device. First, make sure you have [USB debugging enabled on your device](https://www.google.com/search?q=android+Enable+USB+debugging).

## Setting up an Android Device

Let's now set up an Android device to run our React Native projects. Go ahead and plug in your device via USB to your development machine.

<block class="linux android" />

Next, check the manufacturer code by using `lsusb` (on mac, you must first [install lsusb](https://github.com/jlhonora/lsusb)). `lsusb` should output something like this:

```bash
$ lsusb
Bus 002 Device 002: ID 8087:0024 Intel Corp. Integrated Rate Matching Hub
Bus 002 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
Bus 001 Device 003: ID 22b8:2e76 Motorola PCS
Bus 001 Device 002: ID 8087:0024 Intel Corp. Integrated Rate Matching Hub
Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
Bus 004 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub
Bus 003 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
```

These lines represent the USB devices currently connected to your machine.

You want the line that represents your phone. If you're in doubt, try unplugging your phone and running the command again:

```bash
$ lsusb
Bus 002 Device 002: ID 8087:0024 Intel Corp. Integrated Rate Matching Hub
Bus 002 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
Bus 001 Device 002: ID 8087:0024 Intel Corp. Integrated Rate Matching Hub
Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
Bus 004 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub
Bus 003 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
```

You'll see that after removing the phone, the line which has the phone model ("Motorola PCS" in this case) disappeared from the list. This is the line that we care about.

`Bus 001 Device 003: ID 22b8:2e76 Motorola PCS`

From the above line, you want to grab the first four digits from the device ID:

`22b8:2e76`

In this case, it's `22b8`. That's the identifier for Motorola.

You'll need to input this into your udev rules in order to get up and running:

```sh
echo SUBSYSTEM=="usb", ATTR{idVendor}=="22b8", MODE="0666", GROUP="plugdev" | sudo tee /etc/udev/rules.d/51-android-usb.rules
```

Make sure that you replace `22b8` with the identifier you get in the above command.

<block class="mac windows linux android" />

Now check that your device is properly connecting to ADB, the Android Debug Bridge, by running `adb devices`.

```
    $ adb devices
    List of devices attached
    emulator-5554 offline   # Google emulator
    14ed2fcc device         # Physical device
```

Seeing `device` in the right column means the device is connected. You must have **only one device connected** at a time.

Now you can use `react-native run-android` to install and launch your app on the device. If you get a "bridge configuration isn't available" error, see [Using adb reverse](#using-adb-reverse).

<block class="mac windows linux android" />

## Accessing development server from device

You can also iterate quickly on device using the development server. Follow one of the steps described below to make your development server running on your laptop accessible for your device.

> Hint
>
> Most modern android devices don't have a hardware menu button, which we use to trigger the developer menu. In that case you can shake the device to open the dev menu (to reload, debug, etc.). Alternatively, you can run the command `adb shell input keyevent 82` to open the dev menu (82 being the [Menu](http://developer.android.com/reference/android/view/KeyEvent.html#KEYCODE_MENU) key code).

### Using adb reverse

> Note that this option is available on devices running android 5.0+ (API 21).

Have your device connected via USB with debugging enabled (see paragraph above on how to enable USB debugging on your device).

1. Run `adb reverse tcp:8081 tcp:8081`
2. You can use `Reload JS` and other development options with no extra configuration


### Running packager on a non-standard port

Launch the packager manually with `react-native start --port [PORT]`

For Android: Use the developer menu by clicking the menu button or shake. Select 'Debug server host & port for device' to set a different port.
<center>
  <img src="img/AndroidDeveloperMenu.png" width="162" />
  <img src="img/AndroidDevSettings.png" width="150" />
  <img src="img/AndroidDevServerDialog.png" width="150" />
</center>

For IOS: Edit the AppDelegate.m and change the line below to match the port number you're running:

```
jsCodeLocation = [NSURL URLWithString:@"http://localhost:8081/index.ios.bundle?platform=ios&dev=true"];
```

### Configure your app to connect to the local dev server via Wi-Fi

You'll need your development machine's current IP address before proceeding.

<block class="mac android" />

You can find the IP address in **System Preferences** → **Network**.

<block class="windows android" />

Open the command prompt and type `ipconfig` to find your machine's IP address ([more info](http://windows.microsoft.com/en-us/windows/using-command-line-tools-networking-information)).

<block class="linux android" />

Open a terminal and type `/sbin/ifconfig` to find your machine's IP address.

<block class="mac windows linux android" />

1. Make sure your laptop and your phone are on the **same Wi-Fi network**.
2. Open your React Native app on your device. You can do this the same way you'd open any other app.
3. You'll see a red screen with an error. This is OK. The following steps will fix that.
4. Open the **Developer menu** by shaking the device or running `adb shell input keyevent 82` from the command line.
5. Go to `Dev Settings`.
6. Go to `Debug server host for device`.
7. Type in your machine's IP address and the port of the local dev server (e.g. 10.0.1.1:8081).
8. Go back to the **Developer menu** and select `Reload JS`.

<script>
// Convert <div>...<span><block /></span>...</div>
// Into <div>...<block />...</div>
var blocks = document.getElementsByTagName('block');
for (var i = 0; i < blocks.length; ++i) {
  var block = blocks[i];
  var span = blocks[i].parentNode;
  var container = span.parentNode;
  container.insertBefore(block, span);
  container.removeChild(span);
}
// Convert <div>...<block />content<block />...</div>
// Into <div>...<block>content</block><block />...</div>
blocks = document.getElementsByTagName('block');
for (var i = 0; i < blocks.length; ++i) {
  var block = blocks[i];
  while (block.nextSibling && block.nextSibling.tagName !== 'BLOCK') {
    block.appendChild(block.nextSibling);
  }
}
function display(type, value) {
  var container = document.getElementsByTagName('block')[0].parentNode;
  container.className = 'display-' + type + '-' + value + ' ' +
    container.className.replace(RegExp('display-' + type + '-[a-z]+ ?'), '');
}

// If we are coming to the page with a hash in it (i.e. from a search, for example), try to get
// us as close as possible to the correct platform and dev os using the hashtag and block walk up.
var foundHash = false;
if (window.location.hash !== '' && window.location.hash !== 'content') { // content is default
  var hashLinks = document.querySelectorAll('a.hash-link');
  for (var i = 0; i < hashLinks.length && !foundHash; ++i) {
    if (hashLinks[i].hash === window.location.hash) {
      var parent = hashLinks[i].parentElement;
      while (parent) {
        if (parent.tagName === 'BLOCK') {
          var devOS = null;
          var targetPlatform = null;
          // Could be more than one target os and dev platform, but just choose some sort of order
          // of priority here.

          // Dev OS
          if (parent.className.indexOf('mac') > -1) {
            devOS = 'mac';
          } else if (parent.className.indexOf('linux') > -1) {
            devOS = 'linux';
          } else if (parent.className.indexOf('windows') > -1) {
            devOS = 'windows';
          } else {
            break; // assume we don't have anything.
          }

          // Target Platform
          if (parent.className.indexOf('ios') > -1) {
            targetPlatform = 'ios';
          } else if (parent.className.indexOf('android') > -1) {
            targetPlatform = 'android';
          } else {
            break; // assume we don't have anything.
          }
          // We would have broken out if both targetPlatform and devOS hadn't been filled.
          display('os', devOS);
          display('platform', targetPlatform);      
          foundHash = true;
          break;
        }
        parent = parent.parentElement;
      }
    }
  }
}
// Do the default if there is no matching hash
if (!foundHash) {
  var isMac = navigator.platform === 'MacIntel';
  var isWindows = navigator.platform === 'Win32';
  display('os', isMac ? 'mac' : (isWindows ? 'windows' : 'linux'));
  display('platform', 'android');
}
</script>
