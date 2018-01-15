---
id: running-on-device
title: Running On Device
layout: docs
category: Guides
permalink: docs/running-on-device.html
banner: ejected
next: upgrading
previous: integration-with-existing-apps
---

It's always a good idea to test your app on an actual device before releasing it to your users. This document will guide you through the necessary steps to run your React Native app on a device.

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
    .display-os-windows .toggler .button-windows,
    .display-platform-ios .toggler .button-ios,
    .display-platform-android .toggler .button-android {
      background-color: #05A5D1;
      color: white;
    }
    block { display: none; }
    .display-platform-ios.display-os-mac .ios.mac,
    .display-platform-ios.display-os-linux .ios.linux,
    .display-platform-ios.display-os-windows .ios.windows,
    .display-platform-android.display-os-mac .android.mac,
    .display-platform-android.display-os-linux .android.linux,
    .display-platform-android.display-os-windows .android.windows {
      display: block;
    }
  </style>
  <span>Mobile OS:</span>
  <a href="javascript:void(0);" class="button-ios" onclick="display('platform', 'ios')">iOS</a>
  <a href="javascript:void(0);" class="button-android" onclick="display('platform', 'android')">Android</a>
  <span>Development OS:</span>
  <a href="javascript:void(0);" class="button-mac" onclick="display('os', 'mac')">macOS</a>
  <a href="javascript:void(0);" class="button-linux" onclick="display('os', 'linux')">Linux</a>
  <a href="javascript:void(0);" class="button-windows" onclick="display('os', 'windows')">Windows</a>
</div>

<block class="linux windows ios" />

A Mac is required in order to build your app for iOS devices.

<block class="mac ios" />

## Running your app on iOS devices

Register for a [Apple developer account](https://developer.apple.com/) if you don't have one yet.

Connect your device to your Mac using a USB to Lightning cable. Navigate to the `ios` folder in your project, then open the `.xcodeproj` file within it using Xcode.

Select your app in the Project Navigator and look for the "General" tab. Go to "Signing" and make sure your Apple developer account is selected.

Open the "Product" menu from Xcode's menubar, then go to "Destination". Look for and select your device from the list. Xcode will then register your device for development.

If everything is set up correctly, your device will be listed as the build target in the Xcode toolbar. You can now press the **Build and run** button or select "Run" from the "Product" menu. Your app will launch on your device shortly.

> If you run into any issues, please take a look at Apple's [Launching Your App on a Device](https://developer.apple.com/library/content/documentation/IDEs/Conceptual/AppDistributionGuide/LaunchingYourApponDevices/LaunchingYourApponDevices.html#//apple_ref/doc/uid/TP40012582-CH27-SW4) docs.

<block class="mac windows linux android" />

## Running your app on Android devices

### 1. Enable Debugging over USB

Most Android devices can only install and run apps downloaded from Google Play, by default. You will need to enable USB Debugging on your device in order to install your app during development.

To enable USB debugging on your device, you will first need to enable the "Developer options" menu by going to **Settings** → **About phone** and then tapping the `Build number` row at the bottom seven times. You can then go back to **Settings** → **Developer options** to enable "USB debugging".

### 2. Plug in your device via USB

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

### 3. Run your app

Type the following in your command prompt to install and launch your app on the device:

```
$ react-native run-android
```

> If you get a "bridge configuration isn't available" error, see [Using adb reverse](docs/running-on-device.html#method-1-using-adb-reverse-recommended).

> Hint
>
> You can also use the `React Native CLI` to generate and run a `Release` build (e.g. `react-native run-android --variant=release`).

<block class="mac windows linux android ios" />

<block class="mac ios" />

## Connecting to the development server

You can also iterate quickly on a device using the development server. You only have to be on the same Wi-Fi network as your computer. Enable Live reloading from the [Developer menu](docs/debugging.html#accessing-the-in-app-developer-menu) and your app will reload whenever your JavaScript code has changed.

> If you have any issues, ensure that your Mac and device are on the same network and can reach each other. Many open wireless networks with captive portals are configured to prevent devices from reaching other devices on the network. You may use your device's Personal Hotspot feature in this case.

<block class="mac windows linux android" />

## Connecting to the development server

You can also iterate quickly on a device by connecting to the development server running on your development machine. There are several ways of accomplishing this, depending on whether you have access to a USB cable or a Wi-Fi network.

### Method 1: Using adb reverse (recommended)

<block class="mac windows linux android" />

You can use this method if your device is running Android 5.0 (Lollipop), it has USB debugging enabled, and it is connected via USB to your development machine.

<block class="mac windows linux android" />

Run the following in a command prompt:

```
$ adb reverse tcp:8081 tcp:8081
```

You can now enable Live reloading from the [Developer menu](docs/debugging.html#accessing-the-in-app-developer-menu). Your app will reload whenever your JavaScript code has changed.

### Method 2: Connect via Wi-Fi

You can also connect to the development server over Wi-Fi. You'll first need to install the app on your device using a USB cable, but once that has been done you can debug wirelessly by following these instructions. You'll need your development machine's current IP address before proceeding.

<block class="mac android" />

You can find the IP address in **System Preferences** → **Network**.

<block class="windows android" />

Open the command prompt and type `ipconfig` to find your machine's IP address ([more info](http://windows.microsoft.com/en-us/windows/using-command-line-tools-networking-information)).

<block class="linux android" />

Open a terminal and type `/sbin/ifconfig` to find your machine's IP address.

<block class="mac windows linux android" />

1. Make sure your laptop and your phone are on the **same** Wi-Fi network.
2. Open your React Native app on your device.
3. You'll see a [red screen with an error](docs/debugging.html#in-app-errors-and-warnings). This is OK. The following steps will fix that.
4. Open the in-app [Developer menu](docs/debugging.html#accessing-the-in-app-developer-menu).
5. Go to **Dev Settings** → **Debug server host for device**.
6. Type in your machine's IP address and the port of the local dev server (e.g. 10.0.1.1:8081).
7. Go back to the **Developer menu** and select **Reload JS**.

You can now enable Live reloading from the [Developer menu](docs/debugging.html#accessing-the-in-app-developer-menu). Your app will reload whenever your JavaScript code has changed.

<block class="mac ios" />

## Building your app for production

You have built a great app using React Native, and you are now itching to release it in the App Store. The process is the same as any other native iOS app, with some additional considerations to take into account.

Building an app for distribution in the App Store requires using the `Release` scheme in Xcode. To do this, go to **Product** → **Scheme** → **Edit Scheme (cmd + <)**, make sure you're in the **Run** tab from the side, and set the Build Configuration dropdown to `Release`.

Apps built for `Release` will automatically disable the in-app Developer menu, which will prevent your users from inadvertently accessing the menu in production. It will also load the JavaScript locally, so you can put the app on a device and test whilst not connected to the computer.

> Hint
>
> You can also use the `React Native CLI` to perform this operation using the option `--configuration` with the value `Release` (e.g. `react-native run-ios --configuration Release`).

Once built for release, you'll be able to distribute the app to beta testers and submit the app to the App Store.

### App Transport Security

App Transport Security is a security feature, added in iOS 9, that rejects all HTTP requests that are not sent over HTTPS. This can result in HTTP traffic being blocked, including the developer React Native server.

ATS is disabled by default in projects generated using the React Native CLI in order to make development easier. You should re-enable ATS prior to building your app for production by removing the `NSAllowsArbitraryLoads` entry from your `Info.plist` file in the `ios/` folder.

To learn more about how to configure ATS on your own Xcode projects, see [this post on ATS][cats].

[cats]: http://ste.vn/2015/06/10/configuring-app-transport-security-ios-9-osx-10-11/

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
  display('platform', isMac ? 'ios' : 'android');
}
</script>
