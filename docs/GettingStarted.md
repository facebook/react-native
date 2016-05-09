---
id: getting-started
title: Getting Started
layout: docs
category: Quick Start
permalink: docs/getting-started.html
next: tutorial
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
}</style>
<span>Platform:</span>
<a href="javascript:void(0);" class="button-ios" onclick="display('platform', 'ios')">iOS</a>
<a href="javascript:void(0);" class="button-android" onclick="display('platform', 'android')">Android</a>
<span>OS:</span>
<a href="javascript:void(0);" class="button-mac" onclick="display('os', 'mac')">Mac</a>
<a href="javascript:void(0);" class="button-linux" onclick="display('os', 'linux')">Linux</a>
<a href="javascript:void(0);" class="button-windows" onclick="display('os', 'windows')">Windows</a>
</div>

<!-- ######### LINUX AND WINDOWS for iOS ##################### -->

<block class="linux windows ios" />

## Unsupported

<div>Unfortunately, Apple only lets you develop for iOS on a Mac machine. Please check out the <a href="" onclick="display('platform', 'android')">Android</a> instructions instead.</div>

<center><img src="https://fbcdn-dragon-a.akamaihd.net/hphotos-ak-xaf1/t39.1997-6/851591_233289256829505_447005964_n.png" width="150"></img></center>

<!-- ######### MAC for iOS ##################### -->

<block class="mac ios android" />

## Installation

### Required Prerequisites

#### Homebrew

[Homebrew](http://brew.sh/), in order to install the required NodeJS, in addition to some
recommended installs.

```
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

> We recommend periodically running `brew update && brew upgrade` to keep your programs up-to-date.

#### Node

Use Homebrew to install [Node.js](https://nodejs.org/).

> NodeJS 4.0 or greater is required for React Native. The default Homebrew package for Node is
> currently 6.0, so that is not an issue.  

```
brew install node
```

#### React Native Command Line Tools

The React Native command line tools allow you to easily create and initialize projects, etc.

```
npm install -g react-native-cli
```

> If you see the error, `EACCES: permission denied`, please run the command:
> `sudo npm install -g react-native-cli`.

<block class="mac ios" />

#### Xcode

[Xcode](https://developer.apple.com/xcode/downloads/) 7.0 or higher. Open the App Store or go to https://developer.apple.com/xcode/downloads/. This will also install `git` as well.

<block class="mac android" />

#### Android Studio

[Android Studio](http://developer.android.com/sdk/index.html) 2.0 or higher. This will provide you
the Android SDK and emulator required to run and test your React Native apps.

> Android Studio requires the Java Development Kit [JDK] 1.8 or higher. You can type
> `javac -version` to see what version you have, if any. If you do not meet the JDK requirement,
> you can
> [download it](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html).

You will need to customize your installation:

- Choose a `Custom` installation

![custom installation](img/react-native-android-studio-custom-install.png)

- Choose both `Performance` and `Android Virtual Device`

![additional installs](img/react-native-android-studio-additional-installs.png)

- After installation, choose `Configure | SDK Manager` from the Android Studio welcome window.

![configure sdk](img/react-native-android-studio-configure-sdk.png)

- In the `SDK Platforms` window, choose `Show Package Details` and under `Android 6.0 (Marshmallow)`, make sure that `Google APIs`, `Intel x86 Atom System Image`, `Intel x86 Atom_64 System Image`, and `Google APIs Intel x86 Atom_64 System Image` are checked.

![platforms](img/react-native-android-studio-android-sdk-platforms.png)

- In the `SDK Tools` window, choose `Show Package Details` and under `Android SDK Build Tools`, make sure that `Android SDK Build-Tools 23.0.1` is selected.

![build tools](img/react-native-android-studio-android-sdk-build-tools.png)

#### ANDROID_HOME Environment Variable

Ensure the `ANDROID_HOME` environment variable points to your existing Android SDK. To do that, add
this to your `~/.bashrc`, `~/.bash_profile` (or whatever your shell uses) and re-open your terminal:

```
# If you installed the SDK without Android Studio, then it may be something like:
# /usr/local/opt/android-sdk
export ANDROID_HOME=~/Library/Android/sdk
```

<block class="mac ios android" />

### Highly Recommended Installs

#### Watchman

[Watchman](https://facebook.github.io/watchman/docs/install.html) is a tool by Facebook for watching
changes in the filesystem. It is recommended you install it for better performance.

```
brew install watchman
```

#### Flow

[Flow](http://www.flowtype.org), for static typechecking of your React Native code (when using
Flow as part of your codebase).


```
brew install flow
```

<block class="mac android" />

#### Add Android Tools Directory to your `PATH`

You can add the Android tools directory on your `PATH` in case you need to run any of the Android
tools from the command line such as `android avd`. In your `~/.bash` or `~/.bash_profile`:

```
# Your exact string here may be different.
PATH="~/Library/Android/sdk/tools:~/Library/Android/sdk/platform-tools:${PATH}"
export PATH
```

#### Gradle Daemon

Enable [Gradle Daemon](https://docs.gradle.org/2.9/userguide/gradle_daemon.html) which greatly improves incremental build times for changes in java code.

### Other Optional Installs

#### Git

Git version control. If you have installed [Xcode](https://developer.apple.com/xcode/), Git is
already installed, otherwise run the following:

```
brew install git
```

<block class="mac ios android" />

#### Nuclide

[Nuclide] is an IDE from Facebook providing a first-class development environment for writing,
[running](http://nuclide.io/docs/platforms/react-native/#running-applications) and
[debugging](http://nuclide.io/docs/platforms/react-native/#debugging)
[React Native](http://nuclide.io/docs/platforms/react-native/) applications.

Get started with Nuclide [here](http://nuclide.io/docs/quick-start/getting-started/).

<block class="mac android" />

#### Genymotion

Genymotion is an alternative to the stock Google emulator that comes with Android Studio.
However, it's only free for personal use. If you want to use the stock Google emulator, see below.

1. Download and install [Genymotion](https://www.genymotion.com/).
2. Open Genymotion. It might ask you to install VirtualBox unless you already have it.
3. Create a new emulator and start it.
4. To bring up the developer menu press ⌘+M

### Troubleshooting

#### Virtual Device Not Created When Installing Android Studio

There is a [known bug](https://code.google.com/p/android/issues/detail?id=207563) on some versions
of Android Studio where a virtual device will not be created, even though you selected it in the
installation sequence. You may see this at the end of the installation:

```
Creating Android virtual device
Unable to create a virtual device: Unable to create Android virtual device
```

If you see this, run `android avd` and create the virtual device manually.

![avd](img/react-native-android-studio-avd.png)

Then select the new device in the AVD Manager window and click `Start...`.

#### Shell Command Unresponsive Exception

If you encounter:

```
Execution failed for task ':app:installDebug'.
  com.android.builder.testing.api.DeviceException: com.android.ddmlib.ShellCommandUnresponsiveException
```

try downgrading your Gradle version to 1.2.3 in `<project-name>/android/build.gradle` (https://github.com/facebook/react-native/issues/2720)


<!-- ######### LINUX and WINDOWS for ANDROID ##################### -->

<block class="linux windows android" />

## Installation

### Required Prerequisites

<block class="windows android" />

#### Chocolatey

[Chocolatey](https://chocolatey.org) is a package manager for Windows similar to `yum` and
`apt-get`. See the [website](https://chocolatey.org) for updated instructions, but installing from
the Terminal should be something like:

```
@powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((new-object net.webclient).DownloadString('https://chocolatey.org/install.ps1'))" && SET PATH=%PATH%;%ALLUSERSPROFILE%\chocolatey\bin
```

> Normally when you run Chocolatey to install a package, you should run your Terminal as
> Administrator.

#### Python 2

Fire up the Termimal and use Chocolatey to install Python 2.

> Python 3 will currently not work when initializing a React Native project.

```
choco install python2
```

<block class="linux windows android" />

#### Node

<block class="linux android" />

Fire up the Terminal and type the following commands to install NodeJS from the NodeSource
repository:

```
sudo apt-get install -y build-essential
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo ln -s /usr/bin/nodejs /usr/bin/node
```

<block class='windows android' />

Fire up the Termimal and use Chocolatey to install NodeJS.

```
choco install nodejs.install
```

<block class="windows linux android" />

#### React Native Command Line Tools

The React Native command line tools allow you to easily create and initialize projects, etc.

```
npm install -g react-native-cli
```

> If you see the error, `EACCES: permission denied`, please run the command:
> `sudo npm install -g react-native-cli`.

#### Android Studio

[Android Studio](http://developer.android.com/sdk/index.html) 2.0 or higher. This will provide you
the Android SDK and emulator required to run and test your React Native apps.

> Android Studio requires the Java Development Kit [JDK] 1.8 or higher. You can type
> `javac -version` to see what version you have, if any. If you do not meet the JDK requirement,
> you can
> [download it](http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html),
> or use a pacakage manager to install it (e.g. `choco install jdk8`,
> `apt-get install default-jdk`).

<block class="linux android" />

You will need to customize your installation:

- Choose a `Custom` installation

![custom installation](img/react-native-android-studio-custom-install-linux.png)

- Choose `Android Virtual Device`

![additional installs](img/react-native-android-studio-additional-installs-linux.png)

<block class="windows android" />

- Make sure all components are checked for the install, particularly the `Android SDK` and `Android Device Emulator`.

- After the initial install, choose a `Custom` installation.

![custom installation](img/react-native-android-studio-custom-install-windows.png)

- Verify installed components, particularly the emulator and the HAXM accelerator. They should be checked.

![verify installs](img/react-native-android-studio-verify-installs-windows.png)

<block class="windows linux android" />

- After installation, choose `Configure | SDK Manager` from the Android Studio welcome window.

<block class="linux android" />

![configure sdk](img/react-native-android-studio-configure-sdk-linux.png)

<block class="windows android" />

![configure sdk](img/react-native-android-studio-configure-sdk-windows.png)

<block class="windows linux android" />

- In the `SDK Platforms` window, choose `Show Package Details` and under `Android 6.0 (Marshmallow)`, make sure that `Google APIs`, `Intel x86 Atom System Image`, `Intel x86 Atom_64 System Image`, and `Google APIs Intel x86 Atom_64 System Image` are checked.

<block class="linux android" />

![platforms](img/react-native-android-studio-android-sdk-platforms-linux.png)

<block class="windows android" />

![platforms](img/react-native-android-studio-android-sdk-platforms-windows.png)

<block class="windows linux android" />

- In the `SDK Tools` window, choose `Show Package Details` and under `Android SDK Build Tools`, make sure that `Android SDK Build-Tools 23.0.1` is selected.

<block class="linux android" />

![build tools](img/react-native-android-studio-android-sdk-build-tools-linux.png)

<block class="windows android" />

![build tools](img/react-native-android-studio-android-sdk-build-tools-windows.png)

<block class="windows linux android" />

#### ANDROID_HOME Environment Variable

Ensure the `ANDROID_HOME` environment variable points to your existing Android SDK.

<block class="linux android" />

To do that, add this to your `~/.bashrc`, `~/.bash_profile` (or whatever your shell uses) and
re-open your terminal:

```
# If you installed the SDK without Android Studio, then it may be something like:
# /usr/local/opt/android-sdk; Generally with Android Studio, the SDK is installed here...
export ANDROID_HOME=~/Android/Sdk
```

> You need to restart the Terminal to apply the new environment variables (or `source` the relevant
> bash file).

<block class="windows android" />

Go to `Control Panel` -> `System and Security` -> `System` -> `Change settings` ->
`Advanced System Settings` -> `Environment variables` -> `New`

> Your path to the SDK will vary to the one shown below.

![env variable](img/react-native-android-sdk-environment-variable-windows.png)

> You need to restart the Command Prompt (Windows) to apply the new environment variables.

<block class="linux windows android" />

### Highly Recommended Installs

<block class="linux android" />

#### Watchman

Watchman is a tool by Facebook for watching changes in the filesystem. It is recommended you install
it for better performance.

> This also helps avoid a node file-watching bug.

Type the following into your terminal to compile watchman from source and install it:

```
git clone https://github.com/facebook/watchman.git
cd watchman
git checkout v4.5.0  # the latest stable release
./autogen.sh
./configure
make
sudo make install
```

#### Flow

[Flow](http://www.flowtype.org), for static typechecking of your React Native code (when using
Flow as part of your codebase).

Type the following in the terminal:

```
npm install -g flow-bin
```

<block class="windows linux android" />

#### Gradle Daemon

Enable [Gradle Daemon](https://docs.gradle.org/2.9/userguide/gradle_daemon.html) which greatly
improves incremental build times for changes in java code.

<block class="mac linux android" />

```
touch ~/.gradle/gradle.properties && echo "org.gradle.daemon=true" >> ~/.gradle/gradle.properties
```

<block class="windows android" />

```
(if not exist "%USERPROFILE%/.gradle" mkdir "%USERPROFILE%/.gradle") && (echo org.gradle.daemon=true >> "%USERPROFILE%/.gradle/gradle.properties")
```

<block class="linux android" />

#### Android Emulator Accelerator

You may have seen the following screen when installing Android Studio.

![accelerator](img/react-native-android-studio-kvm-linux.png)

If your system supports KVM, you should install the
[Intel Android Emulator Accelerator](https://software.intel.com/en-us/android/articles/speeding-up-the-android-emulator-on-intel-architecture#_Toc358213272).

<block class="windows linux android" />

#### Add Android Tools Directory to your `PATH`

You can add the Android tools directory on your `PATH` in case you need to run any of the Android
tools from the command line such as `android avd`.

<block class="linux android" />

In your `~/.bashrc` or `~/.bash_profile`:

```
# Your exact string here may be different.
PATH="~/Android/Sdk/tools:~/Android/Sdk/platform-tools:${PATH}"
export PATH
```

<block class="windows android" />

Go to `Control Panel` -> `System and Security` -> `System` -> `Change settings` ->
`Advanced System Settings` -> `Environment variables` ->  highlight `PATH` -> `Edit...`

> The location of your Android tools directories will vary.

![env variable](img/react-native-android-tools-environment-variable-windows.png)

<block class="windows linux android" />

### Other Optional Installs

#### Git

<block class="linux android">

Install Git [via your package manager](https://git-scm.com/download/linux)
(e.g., `sudo apt-get install git-all`).

<block class="windows android" />

You can use Chocolatey to install `git` via:

```
choco install git
```

Alternatively, you can download and install [Git for Windows](https://git-for-windows.github.io/).
During the setup process, choose "Run Git from Windows Command Prompt", which will add `git` to your
`PATH` environment variable.

<block class="linux android" />

#### Nuclide

[Nuclide] is an IDE from Facebook providing a first-class development environment for writing,
[running](http://nuclide.io/docs/platforms/react-native/#running-applications) and
[debugging](http://nuclide.io/docs/platforms/react-native/#debugging)
[React Native](http://nuclide.io/docs/platforms/react-native/) applications.

Get started with Nuclide [here](http://nuclide.io/docs/quick-start/getting-started/).

<block class="linux windows android" />

#### Genymotion

Genymotion is an alternative to the stock Google emulator that comes with Android Studio.
However, it's only free for personal use. If you want to use the stock Google emulator, see below.

1. Download and install [Genymotion](https://www.genymotion.com/).
2. Open Genymotion. It might ask you to install VirtualBox unless you already have it.
3. Create a new emulator and start it.
4. To bring up the developer menu press ⌘+M

<block class="windows android" />

#### Visual Studio Emulator for Android

The [Visual Studio Emulator for Android](https://www.visualstudio.com/en-us/features/msft-android-emulator-vs.aspx)
is a free android emulator that is hardware accelerated via Hyper-V. It is an alternative to the
stock Google emulator that comes with Android Studio. It doesn't require you to install Visual
Studio at all.

To use it with react-native you just have to add a key and value to your registry:

1. Open the Run Command (Windows+R)
2. Enter `regedit.exe`
3. In the Registry Editor navigate to `HKEY_LOCAL_MACHINE\SOFTWARE\Wow6432Node\Android SDK Tools`
4. Right Click on `Android SDK Tools` and choose `New > String Value`
5. Set the name to `Path`
6. Double Click the new `Path` Key and set the value to `C:\Program Files\Android\sdk`. The path value might be different on your machine.

You will also need to run the command `adb reverse tcp:8081 tcp:8081` with this emulator.

Then restart the emulator and when it runs you can just do `react-native run-android` as usual.

<block class="windows linux android" />

### Troubleshooting

#### Unable to run mksdcard SDK Tool

When installing Android Studio, if you get the error:

```
Unable to run mksdcard SDK tool
```

then install the standard C++ library:

```
sudo apt-get install lib32stdc++6
```

#### Virtual Device Not Created When Installing Android Studio

There is a [known bug](https://code.google.com/p/android/issues/detail?id=207563) on some versions
of Android Studio where a virtual device will not be created, even though you selected it in the
installation sequence. You may see this at the end of the installation:

<block class="linux android" />

```
Creating Android virtual device
Unable to create a virtual device: Unable to create Android virtual device
```

<block class="windows android" />

![no virtual device](img/react-native-android-studio-no-virtual-device-windows.png)

<block class="windows linux android" />

If you see this, run `android avd` and create the virtual device manually.

<block class="linux android" />

![avd](img/react-native-android-studio-avd-linux.png)

<block class="windows android" />

![avd](img/react-native-android-studio-avd-windows.png)

<block class="windows linux android" />

Then select the new device in the AVD Manager window and click `Start...`.

<block class="linux android" />

#### Shell Command Unresponsive Exception

In case you encounter

```
Execution failed for task ':app:installDebug'.
  com.android.builder.testing.api.DeviceException: com.android.ddmlib.ShellCommandUnresponsiveException
```

try downgrading your Gradle version to 1.2.3 in `<project-name>/android/build.gradle` (https://github.com/facebook/react-native/issues/2720)

<block class="mac ios android" />

## Testing Installation

<block class="mac ios" />

```
react-native init AwesomeProject
cd AwesomeProject
react-native run-ios
```

> You can also
> [open the `AwesomeProject`](http://nuclide.io/docs/quick-start/getting-started/#adding-a-project)
> folder in [Nuclide](http://nuclide.io) and
> [run the application](http://nuclide.io/docs/platforms/react-native/#command-line), or open
> `ios/AwesomeProject.xcodeproj` and hit the `Run` button in Xcode.

<block class="mac android" />

```
react-native init AwesomeProject
cd AwesomeProject
react-native run-android
```

> You can also
> [open the `AwesomeProject`](http://nuclide.io/docs/quick-start/getting-started/#adding-a-project)
> folder in [Nuclide](http://nuclide.io) and
> [run the application](http://nuclide.io/docs/platforms/react-native/#command-line).

<block class="mac ios android" />

### Modifying Project

Now that you successfully started the project, let's modify it:

<block class="mac ios" />

- Open `index.ios.js` in your text editor of choice (e.g. [Nuclide](http://nuclide.io/docs/platforms/react-native/)) and edit some lines.
- Hit ⌘-R in your iOS simulator to reload the app and see your change!

<block class="mac android" />

- Press the `R` key twice **OR** open the menu (F2 by default, or ⌘-M in Genymotion) and select Reload JS to see your change!
- Run `adb logcat *:S ReactNative:V ReactNativeJS:V` in a terminal to see your app's logs

<block class="mac ios android" />

### That's It

Congratulations! You've successfully run and modified your first React Native app.

<center><img src="https://fbcdn-dragon-a.akamaihd.net/hphotos-ak-xfa1/t39.1997-6/851555_209575209232981_1876032292_n.png" width="150"></img></center>

<block class="windows linux android" />

## Testing Installation

```
react-native init AwesomeProject
cd AwesomeProject
react-native run-android
```

<block class="windows android" />

### Troubleshooting Run

A common issue on Windows is that the packager is not started automatically when you run
`react-native run-android`. You can start it manually using:

```
cd AwesomeProject
react-native start
```

Or if you hit a `ERROR  Watcher took too long to load` on Windows, try increasing the timeout in [this file](https://github.com/facebook/react-native/blob/5fa33f3d07f8595a188f6fe04d6168a6ede1e721/packager/react-packager/src/DependencyResolver/FileWatcher/index.js#L16) (under your `node_modules/react-native/`).

### Modifying Project

Now that you successfully started the project, let's modify it:

- Press the `R` key twice **OR** open the menu (F2 by default, or ⌘-M in Genymotion) and select Reload JS to see your change!
- Run `adb logcat *:S ReactNative:V ReactNativeJS:V` in a terminal to see your app's logs

### That's It

Congratulations! You've successfully run and modified your first React Native app.

<center><img src="https://fbcdn-dragon-a.akamaihd.net/hphotos-ak-xfa1/t39.1997-6/851555_209575209232981_1876032292_n.png" width="150"></img></center>


<block class="mac ios android" />

## Common Followups

<block class="mac ios" />

- If you want to run on a physical device, see the [Running on iOS Device page](docs/running-on-device-ios.html#content).

<block class="mac android" />

- If you want to run on a physical device, see the [Running on Android Device page](docs/running-on-device-android.html#content).

<block class="mac ios android" />

- If you run into any issues getting started, see the [Troubleshooting page](docs/troubleshooting.html#content).


<block class="windows linux android" />

## Common Followups

- If you want to run on a physical device, see the [Running on Android Device page](docs/running-on-device-android.html#content).

- If you run into any issues getting started, see the [Troubleshooting page](docs/troubleshooting.html#content).

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
  event && event.preventDefault();
}
var isMac = navigator.platform === 'MacIntel';
var isWindows = navigator.platform === 'Win32';
display('os', isMac ? 'mac' : (isWindows ? 'windows' : 'linux'));
display('platform', isMac ? 'ios' : 'android');
</script>
