---
id: getting-started-linux
title: Getting Started on Linux
layout: docs
category: Quick Start
permalink: docs/getting-started-linux.html
next: android-setup
---

This guide is essentially a beginner-friendly version of the [Getting Started](/react-native/docs/getting-started.html) page for React Native on Linux.

### Prerequisites

For the purposes of this guide, we assume that you're working on Ubuntu Linux 14.04 LTS.

Before following this guide, you should have installed the Android SDK and run a successful Java-based "Hello World" app for Android.

See [Android Setup](/react-native/docs/android-setup.html) for details.

#### Installing NodeJS

The first thing you need to do is to install NodeJS, a popular Javascript implementation.

Fire up the Terminal and paste the following commands to install NodeJS from the [NodeSource](https://nodesource.com/) repository:

```sh
sudo apt-get install -y build-essential
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo ln -s /usr/bin/nodejs /usr/bin/node
```
__NOTE__: The above instructions are for Ubuntu. If you're on a different distro,  please follow the instructions on the [NodeJS website](https://nodejs.org/en/download/).

#### Installing Watchman

[watchman](https://facebook.github.io/watchman/docs/install.html) is a tool by Facebook for watching changes in the filesystem. You need to install it for better performance and avoid a node file-watching bug.

Paste the following into your terminal to compile watchman from source and install it:

```sh
sudo apt-get install -y automake python-dev
git clone https://github.com/facebook/watchman.git
cd watchman
git checkout v4.5.0  # the latest stable release
./autogen.sh
./configure
make
sudo make install
```
__NOTE__: The above ```apt-get install``` line is for Ubuntu/Debian only. You might need to install required dependencies differently on other distributions.

#### Installing Flow

Flow is a static type checker for JavaScript. To install it, paste the following in the terminal:

```sh
sudo npm install -g flow-bin
```

## Setting up an Android Device

Let's set up an Android device to run our starter project.

First thing is to plug in your device and check the manufacturer code by using `lsusb`, which should output something like this:

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

Now check that your device is properly connecting to ADB, the Android Debug Bridge, by using `adb devices`.

```bash
List of devices attached
TA9300GLMK	device
```

For more information, please see the docs for [running an Android app on your device](/react-native/docs/running-on-device-android.html).

## Next Steps

Your Android device and your tools are all ready to go. You can now follow the instructions in the [Quick Start](http://facebook.github.io/react-native/docs/getting-started.html#quick-start) guide to install React Native and start your first project.
