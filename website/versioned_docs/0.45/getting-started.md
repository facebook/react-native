---
id: getting-started
title: getting-started
---
<a id="content"></a><h1><a class="anchor" name="getting-started"></a>Getting Started <a class="hash-link" href="docs/getting-started.html#getting-started">#</a></h1><div><span><style>
  .toggler li {
    display: inline-block;
    position: relative;
    top: 1px;
    padding: 10px;
    margin: 0px 2px 0px 2px;
    border: 1px solid #05A5D1;
    border-bottom-color: transparent;
    border-radius: 3px 3px 0px 0px;
    color: #05A5D1;
    background-color: transparent;
    font-size: 0.99em;
    cursor: pointer;
  }
  .toggler li:first-child {
    margin-left: 0;
  }
  .toggler li:last-child {
    margin-right: 0;
  }
  .toggler ul {
    width: 100%;
    display: inline-block;
    list-style-type: none;
    margin: 0;
    border-bottom: 1px solid #05A5D1;
    cursor: default;
  }
  @media screen and (max-width: 960px) {
    .toggler li,
    .toggler li:first-child,
    .toggler li:last-child {
      display: block;
      border-bottom-color: #05A5D1;
      border-radius: 3px;
      margin: 2px 0px 2px 0px;
    }
    .toggler ul {
      border-bottom: 0;
    }
  }
  .toggler a {
    display: inline-block;
    padding: 10px 5px;
    margin: 2px;
    border: 1px solid #05A5D1;
    border-radius: 3px;
    text-decoration: none !important;
  }
  .display-guide-quickstart .toggler .button-quickstart,
  .display-guide-native .toggler .button-native,
  .display-os-mac .toggler .button-mac,
  .display-os-linux .toggler .button-linux,
  .display-os-windows .toggler .button-windows,
  .display-platform-ios .toggler .button-ios,
  .display-platform-android .toggler .button-android {
    background-color: #05A5D1;
    color: white;
  }
  block { display: none; }
  .display-guide-quickstart.display-platform-ios.display-os-mac .quickstart.ios.mac,
  .display-guide-quickstart.display-platform-ios.display-os-linux .quickstart.ios.linux,
  .display-guide-quickstart.display-platform-ios.display-os-windows .quickstart.ios.windows,
  .display-guide-quickstart.display-platform-android.display-os-mac .quickstart.android.mac,
  .display-guide-quickstart.display-platform-android.display-os-linux .quickstart.android.linux,
  .display-guide-quickstart.display-platform-android.display-os-windows .quickstart.android.windows,    .display-guide-native.display-platform-ios.display-os-mac .native.ios.mac,
  .display-guide-native.display-platform-ios.display-os-linux .native.ios.linux,
  .display-guide-native.display-platform-ios.display-os-windows .native.ios.windows,
  .display-guide-native.display-platform-android.display-os-mac .native.android.mac,
  .display-guide-native.display-platform-android.display-os-linux .native.android.linux,
  .display-guide-native.display-platform-android.display-os-windows .native.android.windows {
    display: block;
  }
</style>

</span><p>This page will help you install and build your first React Native app. If you already have React Native installed, you can skip ahead to the <a href="docs/tutorial.html" target="_blank">Tutorial</a>.</p><span><div class="toggler">
  <ul role="tablist">
    <li id="quickstart" class="button-quickstart" aria-selected="false" role="tab" tabindex="0" aria-controls="quickstarttab" onclick="display('guide', 'quickstart')">
      Quick Start
    </li>
    <li id="native" class="button-native" aria-selected="false" role="tab" tabindex="-1" aria-controls="nativetab" onclick="display('guide', 'native')">
      Building Projects with Native Code
    </li>
  </ul>
</div>

</span><span><block class="quickstart mac windows linux ios android">

</block></span><p><a href="https://github.com/react-community/create-react-native-app" target="_blank">Create React Native App</a> is the easiest way to start building a new React Native application. It allows you to start a project without installing or configuring any tools to build native code - no Xcode or Android Studio installation required (see <a href="docs/getting-started.html#caveats" target="_blank">Caveats</a>).</p><p>Assuming that you have <a href="https://nodejs.org/en/download/" target="_blank">Node</a> installed, you can use npm to install the <code>create-react-native-app</code> command line utility:</p><div class="prism language-javascript">npm install <span class="token operator">-</span>g create<span class="token operator">-</span>react<span class="token operator">-</span>native<span class="token operator">-</span>app</div><p>Then run the following commands to create a new React Native project called "AwesomeProject":</p><div class="prism language-javascript">create<span class="token operator">-</span>react<span class="token operator">-</span>native<span class="token operator">-</span>app AwesomeProject

cd AwesomeProject
npm start</div><p>This will start a development server for you, and print a QR code in your terminal.</p><h2><a class="anchor" name="running-your-react-native-application"></a>Running your React Native application <a class="hash-link" href="docs/getting-started.html#running-your-react-native-application">#</a></h2><p>Install the <a href="https://expo.io" target="_blank">Expo</a> client app on your iOS or Android phone and connect to the same wireless network as your computer. Using the Expo app, scan the QR code from your terminal to open your project.</p><h3><a class="anchor" name="modifying-your-app"></a>Modifying your app <a class="hash-link" href="docs/getting-started.html#modifying-your-app">#</a></h3><p>Now that you have successfully run the app, let's modify it. Open <code>App.js</code> in your text editor of choice and edit some lines. The application should reload automatically once you save your changes.</p><h3><a class="anchor" name="that-s-it"></a>That's it! <a class="hash-link" href="docs/getting-started.html#that-s-it">#</a></h3><p>Congratulations! You've successfully run and modified your first React Native app.</p><span><center><img src="img/react-native-congratulations.png" width="150"></center>

</span><h2><a class="anchor" name="now-what"></a>Now what? <a class="hash-link" href="docs/getting-started.html#now-what">#</a></h2><ul><li><p>Create React Native App also has a <a href="https://github.com/react-community/create-react-native-app/blob/master/react-native-scripts/template/README.md" target="_blank">user guide</a> you can reference if you have questions specific to the tool.</p></li><li><p>If you can't get this to work, see the <a href="https://github.com/react-community/create-react-native-app/blob/master/react-native-scripts/template/README.md#troubleshooting" target="_blank">Troubleshooting</a> section in the README for Create React Native App.</p></li></ul><p>If you're curious to learn more about React Native, continue on
to the <a href="docs/tutorial.html" target="_blank">Tutorial</a>.</p><h3><a class="anchor" name="running-your-app-on-a-simulator-or-virtual-device"></a>Running your app on a simulator or virtual device <a class="hash-link" href="docs/getting-started.html#running-your-app-on-a-simulator-or-virtual-device">#</a></h3><p>Create React Native App makes it really easy to run your React Native app on a physical device without setting up a development environment. If you want to run your app on the iOS Simulator or an Android Virtual Device, please refer to the instructions for building projects with native code to learn how to install Xcode and set up your Android development environment.</p><p>Once you've set these up, you can launch your app on on an Android Virtual Device by running <code>npm run android</code>, or on the iOS Simulator by running <code>npm run ios</code> (macOS only).</p><h3><a class="anchor" name="caveats"></a>Caveats <a class="hash-link" href="docs/getting-started.html#caveats">#</a></h3><p>Because you don't build any native code when using Create React Native App to create a project, it's not possible to include custom native modules beyond the React Native APIs and components that are available in the Expo client app.</p><p>If you know that you'll eventually need to include your own native code, Create React Native App is still a good way to get started. In that case you'll just need to "<a href="https://github.com/react-community/create-react-native-app/blob/master/react-native-scripts/template/README.md#ejecting-from-create-react-native-app" target="_blank">eject</a>" eventually to create your own native builds. If you do eject, the "Building Projects with Native Code" instructions will be required to continue working on your project.</p><p>Create React Native App configures your project to use the most recent React Native version that is supported by the Expo client app. The Expo client app usually gains support for a given React Native version about a week after the React Native version is released as stable. You can check <a href="https://github.com/react-community/create-react-native-app/blob/master/VERSIONS.md" target="_blank">this document</a> to find out what versions are supported.</p><p>If you're integrating React Native into an existing project, you'll want to skip Create React Native App and go directly to setting up the native build environment. Select "Building Projects with Native Code" above for instructions on configuring a native build environment for React Native.</p><span><block class="native mac windows linux ios android">

</block></span><span><p>Follow these instructions if you need to build native code in your project. For example, if you are integrating React Native into an existing application, or if you "ejected" from <a href="docs/getting-started.html" onclick="display('guide', 'quickstart')">Create React Native App</a>, you'll need this section.</p>

</span><p>The instructions are a bit different depending on your development operating system, and whether you want to start developing for iOS or Android. If you want to develop for both iOS and Android, that's fine - you just have to pick
one to start with, since the setup is a bit different.</p><span><div class="toggler">
  <span>Development OS:</span>
  <a href="javascript:void(0);" class="button-mac" onclick="display('os', 'mac')">macOS</a>
  <a href="javascript:void(0);" class="button-windows" onclick="display('os', 'windows')">Windows</a>
  <a href="javascript:void(0);" class="button-linux" onclick="display('os', 'linux')">Linux</a>
  <span>Target OS:</span>
  <a href="javascript:void(0);" class="button-ios" onclick="display('platform', 'ios')">iOS</a>
  <a href="javascript:void(0);" class="button-android" onclick="display('platform', 'android')">Android</a>
</div>

</span><span><block class="native linux windows ios">

</block></span><h2><a class="anchor" name="unsupported"></a>Unsupported <a class="hash-link" href="docs/getting-started.html#unsupported">#</a></h2><span><blockquote><p>A Mac is required to build projects with native code for iOS. You can follow the <a href="docs/getting-started.html" onclick="display('guide', 'quickstart')">Quick Start</a> to learn how to build your app using Create React Native App instead.</p></blockquote>

</span><span><block class="native mac ios">

</block></span><h2><a class="anchor" name="installing-dependencies"></a>Installing dependencies <a class="hash-link" href="docs/getting-started.html#installing-dependencies">#</a></h2><p>You will need Node, Watchman, the React Native command line interface, and Xcode.</p><p>While you can use any editor of your choice to develop your app, you will need to install Xcode in order to set up the necessary tooling to build your React Native app for iOS.</p><span><block class="native mac android">

</block></span><h2><a class="anchor" name="installing-dependencies"></a>Installing dependencies <a class="hash-link" href="docs/getting-started.html#installing-dependencies">#</a></h2><p>You will need Node, Watchman, the React Native command line interface, a JDK, and Android Studio.</p><span><block class="native linux android">

</block></span><h2><a class="anchor" name="installing-dependencies"></a>Installing dependencies <a class="hash-link" href="docs/getting-started.html#installing-dependencies">#</a></h2><p>You will need Node, the React Native command line interface, a JDK, and Android Studio.</p><span><block class="native windows android">

</block></span><h2><a class="anchor" name="installing-dependencies"></a>Installing dependencies <a class="hash-link" href="docs/getting-started.html#installing-dependencies">#</a></h2><p>You will need Node, the React Native command line interface, Python2, a JDK, and Android Studio.</p><span><block class="native mac windows linux android">

</block></span><p>While you can use any editor of your choice to develop your app, you will need to install Android Studio in order to set up the necessary tooling to build your React Native app for Android.</p><span><block class="native mac ios android">

</block></span><h3><a class="anchor" name="node-watchman"></a>Node, Watchman <a class="hash-link" href="docs/getting-started.html#node-watchman">#</a></h3><p>We recommend installing Node and Watchman using <a href="http://brew.sh/" target="_blank">Homebrew</a>. Run the following commands in a Terminal after installing Homebrew:</p><div class="prism language-javascript">brew install node
brew install watchman</div><p>If you have already installed Node on your system, make sure it is version 4 or newer.</p><p><a href="https://facebook.github.io/watchman" target="_blank">Watchman</a> is a tool by Facebook for watching changes in the filesystem. It is highly recommended you install it for better performance.</p><span><block class="native linux android">

</block></span><h3><a class="anchor" name="node"></a>Node <a class="hash-link" href="docs/getting-started.html#node">#</a></h3><p>Follow the <a href="https://nodejs.org/en/download/package-manager/" target="_blank">installation instructions for your Linux distribution</a> to install Node 6 or newer.</p><span><block class="native windows android">

</block></span><h3><a class="anchor" name="node-python2-jdk"></a>Node, Python2, JDK <a class="hash-link" href="docs/getting-started.html#node-python2-jdk">#</a></h3><p>We recommend installing Node and Python2 via <a href="https://chocolatey.org" target="_blank">Chocolatey</a>, a popular package manager for Windows.</p><p>React Native also requires a recent version of the <a href="http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html" target="_blank">Java SE Development Kit (JDK)</a>, as well as Python 2. Both can be installed using Chocolatey.</p><p>Open an Administrator Command Prompt (right click Command Prompt and select "Run as Administrator"), then run the following commands:</p><div class="prism language-javascript">choco install nodejs<span class="token punctuation">.</span>install
choco install python2
choco install jdk8</div><p>If you have already installed Node on your system, make sure it is version 4 or newer. If you already have a JDK on your system, make sure it is version 8 or newer.</p><blockquote><p>You can find additional installation options on <a href="https://nodejs.org/en/download/" target="_blank">Node's Downloads page</a>.</p></blockquote><span><block class="native mac ios android">

</block></span><h3><a class="anchor" name="the-react-native-cli"></a>The React Native CLI <a class="hash-link" href="docs/getting-started.html#the-react-native-cli">#</a></h3><p>Node comes with npm, which lets you install the React Native command line interface.</p><p>Run the following command in a Terminal:</p><div class="prism language-javascript">npm install <span class="token operator">-</span>g react<span class="token operator">-</span>native<span class="token operator">-</span>cli</div><blockquote><p>If you get an error like <code>Cannot find module 'npmlog'</code>, try installing npm directly: <code>curl -0 -L https://npmjs.org/install.sh | sudo sh</code>.</p></blockquote><span><block class="native windows linux android">

</block></span><h3><a class="anchor" name="the-react-native-cli"></a>The React Native CLI <a class="hash-link" href="docs/getting-started.html#the-react-native-cli">#</a></h3><p>Node comes with npm, which lets you install the React Native command line interface.</p><p>Run the following command in a Command Prompt or shell:</p><div class="prism language-javascript">npm install <span class="token operator">-</span>g react<span class="token operator">-</span>native<span class="token operator">-</span>cli</div><blockquote><p>If you get an error like <code>Cannot find module 'npmlog'</code>, try installing npm directly: <code>curl -0 -L https://npmjs.org/install.sh | sudo sh</code>.</p></blockquote><span><block class="native mac ios">

</block></span><h3><a class="anchor" name="xcode"></a>Xcode <a class="hash-link" href="docs/getting-started.html#xcode">#</a></h3><p>The easiest way to install Xcode is via the <a href="https://itunes.apple.com/us/app/xcode/id497799835?mt=12" target="_blank">Mac App Store</a>. Installing Xcode will also install the iOS Simulator and all the necessary tools to build your iOS app.</p><p>If you have already installed Xcode on your system, make sure it is version 8 or higher.</p><h4><a class="anchor" name="command-line-tools"></a>Command Line Tools <a class="hash-link" href="docs/getting-started.html#command-line-tools">#</a></h4><p>You will also need to install the Xcode Command Line Tools. Open Xcode, then choose "Preferences..." from the Xcode menu. Go to the Locations panel and install the tools by selecting the most recent version in the Command Line Tools dropdown.</p><p><img src="img/XcodeCommandLineTools.png" alt="Xcode Command Line Tools"></p><span><block class="native mac linux android">

</block></span><h3><a class="anchor" name="java-development-kit"></a>Java Development Kit <a class="hash-link" href="docs/getting-started.html#java-development-kit">#</a></h3><p>React Native requires a recent version of the Java SE Development Kit (JDK). <a href="http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html" target="_blank">Download and install JDK 8 or newer</a> if needed.</p><span><block class="native mac linux windows android">

</block></span><h3><a class="anchor" name="android-development-environment"></a>Android development environment <a class="hash-link" href="docs/getting-started.html#android-development-environment">#</a></h3><p>Setting up your development environment can be somewhat tedious if you're new to Android development. If you're already familiar with Android development, there are a few things you may need to configure. In either case, please make sure to carefully follow the next few steps.</p><span><block class="native mac windows linux android">

</block></span><h4><a class="anchor" name="1-install-android-studio"></a>1. Install Android Studio <a class="hash-link" href="docs/getting-started.html#1-install-android-studio">#</a></h4><p><a href="https://developer.android.com/studio/index.html" target="_blank">Download and install Android Studio</a>. Choose a "Custom" setup when prompted to select an installation type. Make sure the boxes next to all of the following are checked:</p><span><block class="native mac windows android">

</block></span><ul><li><code>Android SDK</code></li><li><code>Android SDK Platform</code></li><li><code>Performance (Intel ® HAXM)</code></li><li><code>Android Virtual Device</code></li></ul><span><block class="native linux android">

</block></span><ul><li><code>Android SDK</code></li><li><code>Android SDK Platform</code></li><li><code>Android Virtual Device</code></li></ul><span><block class="native mac windows linux android">

</block></span><p>Then, click "Next" to install all of these components.</p><blockquote><p>If the checkboxes are grayed out, you will have a chance to install these components later on.</p></blockquote><p>Once setup has finalized and you're presented with the Welcome screen, proceed to the next step.</p><h4><a class="anchor" name="2-install-the-android-sdk"></a>2. Install the Android SDK <a class="hash-link" href="docs/getting-started.html#2-install-the-android-sdk">#</a></h4><p>Android Studio installs the latest Android SDK by default. Building a React Native app with native code, however, requires the <code>Android 6.0 (Marshmallow)</code> SDK in particular. Additional Android SDKs can be installed through the SDK Manager in Android Studio.</p><p>The SDK Manager can be accessed from the "Welcome to Android Studio" screen. Click on "Configure", then select "SDK Manager".</p><span><block class="native mac android">

</block></span><p><img src="img/AndroidStudioWelcomeMacOS.png" alt="Android Studio Welcome"></p><span><block class="native windows android">

</block></span><p><img src="img/AndroidStudioWelcomeWindows.png" alt="Android Studio Welcome"></p><span><block class="native mac windows linux android">

</block></span><blockquote><p>The SDK Manager can also be found within the Android Studio "Preferences" dialog, under <strong>Appearance &amp; Behavior</strong> → <strong>System Settings</strong> → <strong>Android SDK</strong>.</p></blockquote><p>Select the "SDK Platforms" tab from within the SDK Manager, then check the box next to "Show Package Details" in the bottom right corner. Look for and expand the <code>Android 6.0 (Marshmallow)</code> entry, then make sure the following items are all checked:</p><ul><li><code>Google APIs</code></li><li><code>Android SDK Platform 23</code></li><li><code>Intel x86 Atom_64 System Image</code></li><li><code>Google APIs Intel x86 Atom_64 System Image</code></li></ul><span><block class="native mac android">

</block></span><p><img src="img/AndroidSDKManagerMacOS.png" alt="Android SDK Manager"></p><span><block class="native windows android">

</block></span><p><img src="img/AndroidSDKManagerWindows.png" alt="Android SDK Manager"></p><span><block class="native windows mac linux android">

</block></span><p>Next, select the "SDK Tools" tab and check the box next to "Show Package Details" here as well. Look for and expand the "Android SDK Build-Tools" entry, then make sure that <code>23.0.1</code> is selected.</p><span><block class="native mac android">

</block></span><p><img src="img/AndroidSDKManagerSDKToolsMacOS.png" alt="Android SDK Manager - 23.0.1 Build Tools"></p><span><block class="native windows android">

</block></span><p><img src="img/AndroidSDKManagerSDKToolsWindows.png" alt="Android SDK Manager - 23.0.1 Build Tools"></p><span><block class="native windows mac linux android">

</block></span><p>Finally, click "Apply" to download and install the Android SDK and related build tools.</p><span><block class="native mac android">

</block></span><p><img src="img/AndroidSDKManagerInstallsMacOS.png" alt="Android SDK Manager - Installs"></p><span><block class="native windows android">

</block></span><p><img src="img/AndroidSDKManagerInstallsWindows.png" alt="Android SDK Manager - Installs"></p><span><block class="native mac windows linux android">

</block></span><h4><a class="anchor" name="3-configure-the-android-home-environment-variable"></a>3. Configure the ANDROID_HOME environment variable <a class="hash-link" href="docs/getting-started.html#3-configure-the-android-home-environment-variable">#</a></h4><p>The React Native tools require some environment variables to be set up in order to build apps with native code.</p><span><block class="native mac linux android">

</block></span><p>Add the following lines to your <code>$HOME/.bash_profile</code> config file:</p><span><block class="native mac android">

</block></span><div class="prism language-javascript">export ANDROID_HOME<span class="token operator">=</span>$HOME<span class="token operator">/</span>Library<span class="token operator">/</span>Android<span class="token operator">/</span>sdk
export PATH<span class="token operator">=</span>$PATH<span class="token punctuation">:</span>$ANDROID_HOME<span class="token operator">/</span>tools
export PATH<span class="token operator">=</span>$PATH<span class="token punctuation">:</span>$ANDROID_HOME<span class="token operator">/</span>platform<span class="token operator">-</span>tools</div><span><block class="native linux android">

</block></span><div class="prism language-javascript">export ANDROID_HOME<span class="token operator">=</span>$HOME<span class="token operator">/</span>Android<span class="token operator">/</span>Sdk
export PATH<span class="token operator">=</span>$PATH<span class="token punctuation">:</span>$ANDROID_HOME<span class="token operator">/</span>tools
export PATH<span class="token operator">=</span>$PATH<span class="token punctuation">:</span>$ANDROID_HOME<span class="token operator">/</span>platform<span class="token operator">-</span>tools</div><span><block class="native mac linux android">

</block></span><blockquote><p><code>.bash_profile</code> is specific to <code>bash</code>. If you're using another shell, you will need to edit the appropriate shell-specific config file.</p></blockquote><p>Type <code>source $HOME/.bash_profile</code> to load the config into your current shell. Verify that ANDROID_HOME has been added to your path by running <code>echo $PATH</code>.</p><blockquote><p>Please make sure you use the correct Android SDK path. You can find the actual location of the SDK in the Android Studio "Preferences" dialog, under <strong>Appearance &amp; Behavior</strong> → <strong>System Settings</strong> → <strong>Android SDK</strong>.</p></blockquote><span><block class="native windows android">

</block></span><p>Open the System pane under <strong>System and Security</strong> in the Control Panel, then click on <strong>Change settings...</strong>. Open the <strong>Advanced</strong> tab and click on <strong>Environment Variables...</strong>. Click on <strong>New...</strong> to create a new <code>ANDROID_HOME</code> user variable that points to the path to your Android SDK:</p><p><img src="img/AndroidEnvironmentVariableANDROID_HOME.png" alt="ANDROID_HOME Environment Variable"></p><p>The SDK is installed, by default, at the following location:</p><div class="prism language-javascript">c<span class="token punctuation">:</span>\Users\YOUR_USERNAME\AppData\Local\Android\Sdk</div><p>You can find the actual location of the SDK in the Android Studio "Preferences" dialog, under <strong>Appearance &amp; Behavior</strong> → <strong>System Settings</strong> → <strong>Android SDK</strong>.</p><p>Open a new Command Prompt window to ensure the new environment variable is loaded before proceeding to the next step.</p><span><block class="native linux android">

</block></span><h3><a class="anchor" name="watchman-optional"></a>Watchman (optional) <a class="hash-link" href="docs/getting-started.html#watchman-optional">#</a></h3><p>Follow the <a href="https://facebook.github.io/watchman/docs/install.html#build-install" target="_blank">Watchman installation guide</a> to compile and install Watchman from source.</p><blockquote><p><a href="https://facebook.github.io/watchman/docs/install.html" target="_blank">Watchman</a> is a tool by Facebook for watching
changes in the filesystem. It is highly recommended you install it for better performance, but it's alright to skip this if you find the process to be tedious.</p></blockquote><span><block class="native mac ios">

</block></span><h2><a class="anchor" name="creating-a-new-application"></a>Creating a new application <a class="hash-link" href="docs/getting-started.html#creating-a-new-application">#</a></h2><p>Use the React Native command line interface to generate a new React Native project called "AwesomeProject":</p><div class="prism language-javascript">react<span class="token operator">-</span>native init AwesomeProject</div><p>This is not necessary if you are integrating React Native into an existing application, if you "ejected" from Create React Native App, or if you're adding iOS support to an existing React Native project (see <a href="docs/platform-specific-code.html" target="_blank">Platform Specific Code</a>).</p><span><block class="native mac windows linux android">

</block></span><h2><a class="anchor" name="creating-a-new-application"></a>Creating a new application <a class="hash-link" href="docs/getting-started.html#creating-a-new-application">#</a></h2><p>Use the React Native command line interface to generate a new React Native project called "AwesomeProject":</p><div class="prism language-javascript">react<span class="token operator">-</span>native init AwesomeProject</div><p>This is not necessary if you are integrating React Native into an existing application, if you "ejected" from Create React Native App, or if you're adding Android support to an existing React Native project (see <a href="docs/platform-specific-code.html" target="_blank">Platform Specific Code</a>).</p><span><block class="native mac windows linux android">

</block></span><h2><a class="anchor" name="preparing-the-android-device"></a>Preparing the Android device <a class="hash-link" href="docs/getting-started.html#preparing-the-android-device">#</a></h2><p>You will need an Android device to run your React Native Android app. This can be either a physical Android device, or more commonly, you can use an Android Virtual Device which allows you to emulate an Android device on your computer.</p><p>Either way, you will need to prepare the device to run Android apps for development.</p><h3><a class="anchor" name="using-a-physical-device"></a>Using a physical device <a class="hash-link" href="docs/getting-started.html#using-a-physical-device">#</a></h3><p>If you have a physical Android device, you can use it for development in place of an AVD by plugging it in to your computer using a USB cable and following the instructions <a href="docs/running-on-device.html" target="_blank">here</a>.</p><h3><a class="anchor" name="using-a-virtual-device"></a>Using a virtual device <a class="hash-link" href="docs/getting-started.html#using-a-virtual-device">#</a></h3><p>You can see the list of available Android Virtual Devices (AVDs) by opening the "AVD Manager" from within Android Studio. Look for an icon that looks like this:</p><p><img src="img/react-native-tools-avd.png" alt="Android Studio AVD Manager"></p><p>If you have just installed Android Studio, you will likely need to <a href="https://developer.android.com/studio/run/managing-avds.html" target="_blank">create a new AVD</a>. Select "Create Virtual Device...", then pick any Phone from the list and click "Next".</p><span><block class="native windows android">

</block></span><p><img src="img/CreateAVDWindows.png" alt="Android Studio AVD Manager"></p><span><block class="native mac android">

</block></span><p><img src="img/CreateAVDMacOS.png" alt="Android Studio AVD Manager"></p><span><block class="native mac windows linux android">

</block></span><p>Select the "x86 Images" tab, then look for the <strong>Marshmallow</strong> API Level 23, x86_64 ABI image with a Android 6.0 (Google APIs) target.</p><span><block class="native linux android">

</block></span><blockquote><p>We recommend configuring <a href="https://developer.android.com/studio/run/emulator-acceleration.html#vm-linux" target="_blank">VM acceleration</a> on your system to improve performance. Once you've followed those instructions, go back to the AVD Manager.</p></blockquote><span><block class="native windows android">

</block></span><p><img src="img/CreateAVDx86Windows.png" alt="Install HAXM"></p><blockquote><p>If you don't have HAXM installed, click on "Install HAXM" or follow <a href="https://software.intel.com/en-us/android/articles/installation-instructions-for-intel-hardware-accelerated-execution-manager-windows" target="_blank">these instructions</a> to set it up, then go back to the AVD Manager.</p></blockquote><p><img src="img/AVDManagerWindows.png" alt="AVD List"></p><span><block class="native mac android">

</block></span><p><img src="img/CreateAVDx86MacOS.png" alt="Install HAXM"></p><blockquote><p>If you don't have HAXM installed, follow <a href="https://software.intel.com/en-us/android/articles/installation-instructions-for-intel-hardware-accelerated-execution-manager-mac-os-x" target="_blank">these instructions</a> to set it up, then go back to the AVD Manager.</p></blockquote><p><img src="img/AVDManagerMacOS.png" alt="AVD List"></p><span><block class="native mac windows linux android">

</block></span><p>Click "Next" then "Finish" to create your AVD. At this point you should be able to click on the green triangle button next to your AVD to launch it, then proceed to the next step.</p><span><block class="native mac ios">

</block></span><h2><a class="anchor" name="running-your-react-native-application"></a>Running your React Native application <a class="hash-link" href="docs/getting-started.html#running-your-react-native-application">#</a></h2><p>Run <code>react-native run-ios</code> inside your React Native project folder:</p><div class="prism language-javascript">cd AwesomeProject
react<span class="token operator">-</span>native run<span class="token operator">-</span>ios</div><p>You should see your new app running in the iOS Simulator shortly.</p><p><img src="img/iOSSuccess.png" alt="AwesomeProject on iOS"></p><p><code>react-native run-ios</code> is just one way to run your app. You can also run it directly from within Xcode or <a href="https://nuclide.io/" target="_blank">Nuclide</a>.</p><blockquote><p>If you can't get this to work, see the <a href="docs/troubleshooting.html#content" target="_blank">Troubleshooting</a> page.</p></blockquote><h3><a class="anchor" name="running-on-a-device"></a>Running on a device <a class="hash-link" href="docs/getting-started.html#running-on-a-device">#</a></h3><p>The above command will automatically run your app on the iOS Simulator by default. If you want to run the app on an actual physical iOS device, please follow the instructions <a href="docs/running-on-device.html" target="_blank">here</a>.</p><span><block class="native mac windows linux android">

</block></span><h2><a class="anchor" name="running-your-react-native-application"></a>Running your React Native application <a class="hash-link" href="docs/getting-started.html#running-your-react-native-application">#</a></h2><p>Run <code>react-native run-android</code> inside your React Native project folder:</p><div class="prism language-javascript">cd AwesomeProject
react<span class="token operator">-</span>native run<span class="token operator">-</span>android</div><p>If everything is set up correctly, you should see your new app running in your Android emulator shortly.</p><span><block class="native mac android">

</block></span><p><img src="img/AndroidSuccessMacOS.png" alt="AwesomeProject on Android"></p><span><block class="native windows android">

</block></span><p><img src="img/AndroidSuccessWindows.png" alt="AwesomeProject on Android"></p><span><block class="native mac windows linux android">

</block></span><p><code>react-native run-android</code> is just one way to run your app - you can also run it directly from within Android Studio or <a href="https://nuclide.io/" target="_blank">Nuclide</a>.</p><blockquote><p>If you can't get this to work, see the <a href="docs/troubleshooting.html#content" target="_blank">Troubleshooting</a> page.</p></blockquote><span><block class="native mac ios android">

</block></span><h3><a class="anchor" name="modifying-your-app"></a>Modifying your app <a class="hash-link" href="docs/getting-started.html#modifying-your-app">#</a></h3><p>Now that you have successfully run the app, let's modify it.</p><span><block class="native mac ios">

</block></span><ul><li>Open <code>index.ios.js</code> in your text editor of choice and edit some lines.</li><li>Hit <code>⌘R</code> in your iOS Simulator to reload the app and see your changes!</li></ul><span><block class="native mac android">

</block></span><ul><li>Open <code>index.android.js</code> in your text editor of choice and edit some lines.</li><li>Press the <code>R</code> key twice or select <code>Reload</code> from the Developer Menu (<code>⌘M</code>) to see your changes!</li></ul><span><block class="native windows linux android">

</block></span><h3><a class="anchor" name="modifying-your-app"></a>Modifying your app <a class="hash-link" href="docs/getting-started.html#modifying-your-app">#</a></h3><p>Now that you have successfully run the app, let's modify it.</p><ul><li>Open <code>index.android.js</code> in your text editor of choice and edit some lines.</li><li>Press the <code>R</code> key twice or select <code>Reload</code> from the Developer Menu (<code>⌘M</code>) to see your changes!</li></ul><span><block class="native mac ios android">

</block></span><h3><a class="anchor" name="that-s-it"></a>That's it! <a class="hash-link" href="docs/getting-started.html#that-s-it">#</a></h3><p>Congratulations! You've successfully run and modified your first React Native app.</p><span><center><img src="img/react-native-congratulations.png" width="150"></center>

</span><span><block class="native windows linux android">

</block></span><h3><a class="anchor" name="that-s-it"></a>That's it! <a class="hash-link" href="docs/getting-started.html#that-s-it">#</a></h3><p>Congratulations! You've successfully run and modified your first React Native app.</p><span><center><img src="img/react-native-congratulations.png" width="150"></center>

</span><span><block class="native mac ios">

</block></span><h2><a class="anchor" name="now-what"></a>Now what? <a class="hash-link" href="docs/getting-started.html#now-what">#</a></h2><ul><li><p>Turn on <a href="docs/debugging.html#reloading-javascript" target="_blank">Live Reload</a> in the Developer Menu. Your app will now reload automatically whenever you save any changes!</p></li><li><p>If you want to add this new React Native code to an existing application, check out the <a href="docs/integration-with-existing-apps.html" target="_blank">Integration guide</a>.</p></li></ul><p>If you're curious to learn more about React Native, continue on
to the <a href="docs/tutorial.html" target="_blank">Tutorial</a>.</p><span><block class="native windows linux mac android">

</block></span><h2><a class="anchor" name="now-what"></a>Now what? <a class="hash-link" href="docs/getting-started.html#now-what">#</a></h2><ul><li><p>Turn on <a href="docs/debugging.html#reloading-javascript" target="_blank">Live Reload</a> in the Developer Menu. Your app will now reload automatically whenever you save any changes!</p></li><li><p>If you want to add this new React Native code to an existing application, check out the <a href="docs/integration-with-existing-apps.html" target="_blank">Integration guide</a>.</p></li></ul><p>If you're curious to learn more about React Native, continue on
to the <a href="docs/tutorial.html" target="_blank">Tutorial</a>.</p><span><script>
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
          display('guide', 'native');
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
  display('guide', 'quickstart');
  display('os', isMac ? 'mac' : (isWindows ? 'windows' : 'linux'));
  display('platform', isMac ? 'ios' : 'android');
}
</script>
</span></div><div class="docs-prevnext"><a class="docs-next" href="docs/tutorial.html#content">Next →</a></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/docs/GettingStarted.md">edit the content above on GitHub</a> and send us a pull request!</p>