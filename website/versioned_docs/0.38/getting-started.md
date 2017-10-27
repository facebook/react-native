---
id: version-0.38-getting-started
title: getting-started
original_id: getting-started
---
<a id="content"></a><h1><a class="anchor" name="getting-started"></a>Getting Started <a class="hash-link" href="docs/getting-started.html#getting-started">#</a></h1><div><p>Welcome to React Native! This page will help you install React Native on
your system, so that you can build apps with it right away. If you already
have React Native installed, you can skip ahead to the
<a href="/react-native/docs/tutorial.html" target="">Tutorial</a>.</p><p>The instructions are a bit different depending on your development operating system, and whether you want to start developing for iOS or Android. If you
want to develop for both iOS and Android, that's fine - you just have to pick
one to start with, since the setup is a bit different.</p><span><div class="toggler">
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

</span><span><block class="linux windows ios">

</block></span><h2><a class="anchor" name="unsupported"></a>Unsupported <a class="hash-link" href="docs/getting-started.html#unsupported">#</a></h2><span><div>Unfortunately, Apple only lets you develop for iOS on a Mac. If you want to build an iOS app but you don't have a Mac yet, you can try starting with the <a href="" onclick="display('platform', 'android')">Android</a> instructions instead.</div>

</span><span><center><img src="img/react-native-sorry-not-supported.png" width="150"></center>

</span><span><block class="mac ios">

</block></span><h2><a class="anchor" name="installing-dependencies"></a>Installing Dependencies <a class="hash-link" href="docs/getting-started.html#installing-dependencies">#</a></h2><p>You will need Node.js, Watchman, the React Native command line interface, and Xcode.</p><span><block class="mac android">

</block></span><h2><a class="anchor" name="installing-dependencies"></a>Installing Dependencies <a class="hash-link" href="docs/getting-started.html#installing-dependencies">#</a></h2><p>You will need Node.js, Watchman, the React Native command line interface, and Android Studio.</p><span><block class="windows linux android">

</block></span><h2><a class="anchor" name="installing-dependencies"></a>Installing Dependencies <a class="hash-link" href="docs/getting-started.html#installing-dependencies">#</a></h2><p>You will need Node.js, the React Native command line interface, and Android Studio.</p><span><block class="mac ios android">

</block></span><h3><a class="anchor" name="node-watchman"></a>Node, Watchman <a class="hash-link" href="docs/getting-started.html#node-watchman">#</a></h3><p>We recommend installing Node and Watchman using <a href="http://brew.sh/" target="_blank">Homebrew</a>. Run the following commands in a Terminal after installing Homebrew:</p><div class="prism language-javascript">brew install node
brew install watchman</div><blockquote><p><a href="https://facebook.github.io/watchman" target="_blank">Watchman</a> is a tool by Facebook for watching
changes in the filesystem. It is highly recommended you install it for better performance.</p></blockquote><span><block class="linux android">

</block></span><h3><a class="anchor" name="node"></a>Node <a class="hash-link" href="docs/getting-started.html#node">#</a></h3><p>Follow the <a href="https://nodejs.org/en/download/package-manager/" target="_blank">installation instructions for your Linux distribution</a> to install Node.js 4 or newer.</p><span><block class="windows android">

</block></span><h3><a class="anchor" name="node"></a>Node <a class="hash-link" href="docs/getting-started.html#node">#</a></h3><p>We recommend installing Node.js and Python2 via <a href="https://chocolatey.org" target="_blank">Chocolatey</a>, a popular package manager for Windows. Open a Command Prompt as Administrator, then run:</p><div class="prism language-javascript">choco install nodejs<span class="token punctuation">.</span>install
choco install python2</div><blockquote><p>You can find additional installation options on <a href="https://nodejs.org/en/download/" target="_blank">Node.js's Downloads page</a>.</p></blockquote><span><block class="mac ios android">

</block></span><h3><a class="anchor" name="the-react-native-cli"></a>The React Native CLI <a class="hash-link" href="docs/getting-started.html#the-react-native-cli">#</a></h3><p>Node.js comes with npm, which lets you install the React Native command line interface.</p><span><block class="windows linux android">

</block></span><h3><a class="anchor" name="the-react-native-cli"></a>The React Native CLI <a class="hash-link" href="docs/getting-started.html#the-react-native-cli">#</a></h3><p>Node.js comes with npm, which lets you install the React Native command line interface.</p><span><block class="mac ios android">

</block></span><p>Run the following command in a Terminal:</p><div class="prism language-javascript">npm install <span class="token operator">-</span>g react<span class="token operator">-</span>native<span class="token operator">-</span>cli</div><blockquote><p>If you get a <em>permission error</em>, try using sudo: <code>sudo npm install -g react-native-cli</code>.</p><p>If you get an error like <code>Cannot find module 'npmlog'</code>, try installing npm directly: <code>curl -0 -L http://npmjs.org/install.sh | sudo sh</code>.</p></blockquote><span><block class="mac ios">

</block></span><h3><a class="anchor" name="xcode"></a>Xcode <a class="hash-link" href="docs/getting-started.html#xcode">#</a></h3><p>The easiest way to install Xcode is via the <a href="https://itunes.apple.com/us/app/xcode/id497799835?mt=12" target="_blank">Mac App Store</a>. Installing Xcode will also install the iOS Simulator and all the necessary tools to build your iOS app.</p><span><block class="mac linux windows android">

</block></span><h3><a class="anchor" name="android-development-environment"></a>Android Development Environment <a class="hash-link" href="docs/getting-started.html#android-development-environment">#</a></h3><p>Setting up your development environment can be somewhat tedious if you're new to Android development. If you're already familiar with Android development, there are a few things you may need to configure. In either case, please make sure to carefully follow the next few steps.</p><h4><a class="anchor" name="1-download-and-install-android-studio"></a>1. Download and install Android Studio <a class="hash-link" href="docs/getting-started.html#1-download-and-install-android-studio">#</a></h4><p><a href="https://developer.android.com/studio/install.html" target="_blank">Android Studio</a> provides the Android SDK and AVD (emulator) required to run and test your React Native apps.</p><span><block class="mac android">

</block></span><blockquote><p>Android Studio requires the <a href="https://www.java.com/en/download/mac_download.jsp" target="_blank">Java Development Kit (JDK)</a>, version 1.8 or higher. You can type <code>javac -version</code> in a terminal to see what version you have, if any.</p></blockquote><span><block class="mac windows android">

</block></span><h4><a class="anchor" name="2-install-the-avd-and-haxm"></a>2. Install the AVD and HAXM <a class="hash-link" href="docs/getting-started.html#2-install-the-avd-and-haxm">#</a></h4><p>Choose <code>Custom</code> installation when running Android Studio for the first time. Make sure the boxes next to all of the following are checked:</p><ul><li><code>Android SDK</code></li><li><code>Android SDK Platform</code></li><li><code>Performance (Intel ® HAXM)</code></li><li><code>Android Virtual Device</code></li></ul><p>Then, click "Next" to install all of these components.</p><blockquote><p>If you've already installed Android Studio before, you can still <a href="https://software.intel.com/en-us/android/articles/installation-instructions-for-intel-hardware-accelerated-execution-manager-windows" target="_blank">install HAXM</a> without performing a custom installation.</p></blockquote><span><block class="linux android">

</block></span><h4><a class="anchor" name="2-install-the-avd-and-configure-vm-acceleration"></a>2. Install the AVD and configure VM acceleration <a class="hash-link" href="docs/getting-started.html#2-install-the-avd-and-configure-vm-acceleration">#</a></h4><p>Choose <code>Custom</code> installation when running Android Studio for the first time. Make sure the boxes next to all of the following are checked:</p><ul><li><code>Android SDK</code></li><li><code>Android SDK Platform</code></li><li><code>Android Virtual Device</code></li></ul><p>Click "Next" to install all of these components, then <a href="https://developer.android.com/studio/run/emulator-acceleration.html#vm-linux" target="_blank">configure VM acceleration</a> on your system.</p><span><block class="mac linux windows android">

</block></span><h4><a class="anchor" name="3-install-the-android-6-0-marshmallow-sdk"></a>3. Install the Android 6.0 (Marshmallow) SDK <a class="hash-link" href="docs/getting-started.html#3-install-the-android-6-0-marshmallow-sdk">#</a></h4><p>Android Studio installs the most recent Android SDK by default. React Native, however, requires the <code>Android 6.0 (Marshmallow)</code> SDK. To install it, launch the SDK Manager, click on "Configure" in the "Welcome to Android Studio" screen.</p><blockquote><p>The SDK Manager can also be found within the Android Studio "Preferences" menu, under <strong>Appearance &amp; Behavior</strong> → <strong>System Settings</strong> → <strong>Android SDK</strong>.</p></blockquote><p>Select "SDK Platforms" from within the SDK Manager, then check the box next to "Show Package Details". Look for and expand the <code>Android 6.0 (Marshmallow)</code> entry, then make sure the following items are all checked:</p><ul><li><code>Google APIs</code></li><li><code>Intel x86 Atom System Image</code></li><li><code>Intel x86 Atom_64 System Image</code></li><li><code>Google APIs Intel x86 Atom_64 System Image</code></li></ul><p>Next, select "SDK Tools" and check the box next to "Show Package Details" here as well. Look for and expand the "Android SDK Build Tools" entry, then make sure that <code>Android SDK Build-Tools 23.0.1</code> is selected.</p><p>Finally, click "Apply" to download and install the Android SDK and related build tools.</p><span><block class="mac windows linux android">

</block></span><h4><a class="anchor" name="4-set-up-the-android-home-environment-variable"></a>4. Set up the ANDROID_HOME environment variable <a class="hash-link" href="docs/getting-started.html#4-set-up-the-android-home-environment-variable">#</a></h4><p>The React Native command line interface requires the <code>ANDROID_HOME</code> environment variable to be set up.</p><span><block class="mac android">

</block></span><p>Add the following lines to your <code>~/.bashrc</code> (or equivalent) config file:</p><div class="prism language-javascript">export ANDROID_HOME<span class="token operator">=</span><span class="token operator">~</span><span class="token operator">/</span>Library<span class="token operator">/</span>Android<span class="token operator">/</span>sdk
export PATH<span class="token operator">=</span>$<span class="token punctuation">{</span>PATH<span class="token punctuation">}</span><span class="token punctuation">:</span>$<span class="token punctuation">{</span>ANDROID_HOME<span class="token punctuation">}</span><span class="token operator">/</span>tools
export PATH<span class="token operator">=</span>$<span class="token punctuation">{</span>PATH<span class="token punctuation">}</span><span class="token punctuation">:</span>$<span class="token punctuation">{</span>ANDROID_HOME<span class="token punctuation">}</span><span class="token operator">/</span>platform<span class="token operator">-</span>tools</div><blockquote><p>Please make sure you export the correct path for <code>ANDROID_HOME</code>. If you installed the Android SDK using Homebrew, it would be located at <code>/usr/local/opt/android-sdk</code>.</p></blockquote><span><block class="linux android">

</block></span><p>Add the following lines to your <code>~/.bashrc</code> (or equivalent) config file:</p><div class="prism language-javascript">export ANDROID_HOME<span class="token operator">=</span><span class="token operator">~</span><span class="token operator">/</span>Android<span class="token operator">/</span>Sdk
export PATH<span class="token operator">=</span>$<span class="token punctuation">{</span>PATH<span class="token punctuation">}</span><span class="token punctuation">:</span>$<span class="token punctuation">{</span>ANDROID_HOME<span class="token punctuation">}</span><span class="token operator">/</span>tools
export PATH<span class="token operator">=</span>$<span class="token punctuation">{</span>PATH<span class="token punctuation">}</span><span class="token punctuation">:</span>$<span class="token punctuation">{</span>ANDROID_HOME<span class="token punctuation">}</span><span class="token operator">/</span>platform<span class="token operator">-</span>tools</div><blockquote><p>Please make sure you export the correct path for <code>ANDROID_HOME</code> if you did not install the Android SDK using Android Studio.</p></blockquote><span><block class="windows android">

</block></span><p>Go to <strong>Control Panel</strong> → <strong>System and Security</strong> → <strong>System</strong> → <strong>Change settings</strong> →
<strong>Advanced System Settings</strong> → <strong>Environment variables</strong> → <strong>New</strong>, then enter the path to your Android SDK.</p><p><img src="img/react-native-android-sdk-environment-variable-windows.png" alt="env variable"></p><p>Restart the Command Prompt to apply the new environment variable.</p><span><block class="linux windows android">

</block></span><blockquote><p>Please make sure you export the correct path for <code>ANDROID_HOME</code> if you did not install the Android SDK using Android Studio.</p></blockquote><span><block class="linux android">

</block></span><h3><a class="anchor" name="watchman-optional"></a>Watchman (optional) <a class="hash-link" href="docs/getting-started.html#watchman-optional">#</a></h3><p>Follow the <a href="https://facebook.github.io/watchman/docs/install.html#build-install" target="_blank">Watchman installation guide</a> to compile and install Watchman from source.</p><blockquote><p><a href="https://facebook.github.io/watchman/docs/install.html" target="_blank">Watchman</a> is a tool by Facebook for watching
changes in the filesystem. It is highly recommended you install it for better performance, but it's alright to skip this if you find the process to be tedious.</p></blockquote><span><block class="mac windows linux android">

</block></span><h2><a class="anchor" name="starting-the-android-virtual-device"></a>Starting the Android Virtual Device <a class="hash-link" href="docs/getting-started.html#starting-the-android-virtual-device">#</a></h2><p><img src="img/react-native-tools-avd.png" alt="Android Studio AVD Manager"></p><p>You can see the list of available AVDs by opening the "AVD Manager" from within Android Studio. You can also run the following command in a terminal:</p><div class="prism language-javascript">android avd</div><p>Once in the "AVD Manager", select your AVD and click "Start...".</p><blockquote><p>Android Studio should have set up an Android Virtual Device for you during installation, but it is very common to run into an issue where Android Studio fails to install the AVD. You may follow the <a href="https://developer.android.com/studio/run/managing-avds.html" target="_blank">Android Studio User Guide</a> to create a new AVD manually if needed.</p></blockquote><span><block class="mac ios android">

</block></span><h2><a class="anchor" name="testing-your-react-native-installation"></a>Testing your React Native Installation <a class="hash-link" href="docs/getting-started.html#testing-your-react-native-installation">#</a></h2><span><block class="mac ios">

</block></span><p>Use the React Native command line interface to generate a new React Native project called "AwesomeProject", then run <code>react-native run-ios</code> inside the newly created folder.</p><div class="prism language-javascript">react<span class="token operator">-</span>native init AwesomeProject
cd AwesomeProject
react<span class="token operator">-</span>native run<span class="token operator">-</span>ios</div><p>You should see your new app running in the iOS Simulator shortly.</p><p><code>react-native run-ios</code> is just one way to run your app. You can also run it directly from within Xcode or <a href="https://nuclide.io/" target="_blank">Nuclide</a>.</p><span><block class="mac android">

</block></span><p>Use the React Native command line interface to generate a new React Native project called "AwesomeProject", then run <code>react-native run-android</code> inside the newly created folder:</p><div class="prism language-javascript">react<span class="token operator">-</span>native init AwesomeProject
cd AwesomeProject
react<span class="token operator">-</span>native run<span class="token operator">-</span>android</div><p>If everything is set up correctly, you should see your new app running in your AVD shortly.</p><p><code>react-native run-android</code> is just one way to run your app - you can also run it directly from within Android Studio or <a href="https://nuclide.io/" target="_blank">Nuclide</a>.</p><span><block class="mac ios android">

</block></span><h3><a class="anchor" name="modifying-your-app"></a>Modifying your app <a class="hash-link" href="docs/getting-started.html#modifying-your-app">#</a></h3><p>Now that you have successfully run the app, let's modify it.</p><span><block class="mac ios">

</block></span><ul><li>Open <code>index.ios.js</code> in your text editor of choice and edit some lines.</li><li>Hit <code>Command⌘ + R</code> in your iOS Simulator to reload the app and see your change!</li></ul><span><block class="mac android">

</block></span><ul><li>Open <code>index.android.js</code> in your text editor of choice and edit some lines.</li><li>Press the <code>R</code> key twice or select <code>Reload</code> from the Developer Menu to see your change!</li></ul><span><block class="mac ios android">

</block></span><h3><a class="anchor" name="that-s-it"></a>That's it! <a class="hash-link" href="docs/getting-started.html#that-s-it">#</a></h3><p>Congratulations! You've successfully run and modified your first React Native app.</p><span><center><img src="img/react-native-congratulations.png" width="150"></center>

</span><span><block class="windows android">

</block></span><h2><a class="anchor" name="testing-your-react-native-installation"></a>Testing your React Native Installation <a class="hash-link" href="docs/getting-started.html#testing-your-react-native-installation">#</a></h2><p>Use the React Native command line interface to generate a new React Native project called "AwesomeProject", then run <code>react-native start</code> inside the newly created folder to start the packager.</p><div class="prism language-javascript">react<span class="token operator">-</span>native init AwesomeProject
cd AwesomeProject
react<span class="token operator">-</span>native start</div><p>Open a new command prompt and run <code>react-native run-android</code> inside the same folder to launch the app on your AVD.</p><div class="prism language-javascript">react<span class="token operator">-</span>native run<span class="token operator">-</span>android</div><span><block class="linux android">

</block></span><h2><a class="anchor" name="testing-your-react-native-installation"></a>Testing your React Native Installation <a class="hash-link" href="docs/getting-started.html#testing-your-react-native-installation">#</a></h2><p>Use the React Native command line interface to generate a new React Native project called "AwesomeProject", then run <code>react-native run-android</code> inside the newly created folder.</p><div class="prism language-javascript">react<span class="token operator">-</span>native init AwesomeProject
cd AwesomeProject
react<span class="token operator">-</span>native run<span class="token operator">-</span>android</div><span><block class="windows linux android">

</block></span><p>If everything is set up correctly, you should see your new app running in your Android emulator shortly.</p><span><block class="windows android">

</block></span><blockquote><p>If you hit a <code>ERROR  Watcher took too long to load</code>, try increasing the timeout in <a href="https://github.com/facebook/react-native/blob/5fa33f3d07f8595a188f6fe04d6168a6ede1e721/packager/react-packager/src/DependencyResolver/FileWatcher/index.js#L16" target="_blank">this file</a> (under your <code>node_modules/react-native/</code>).</p></blockquote><span><block class="windows linux android">

</block></span><h3><a class="anchor" name="modifying-your-app"></a>Modifying your app <a class="hash-link" href="docs/getting-started.html#modifying-your-app">#</a></h3><p>Now that you have successfully run the app, let's modify it.</p><ul><li>Open <code>index.android.js</code> in your text editor of choice and edit some lines.</li><li>Press the <code>R</code> key twice or select <code>Reload</code> from the Developer Menu to see your change!</li></ul><h3><a class="anchor" name="that-s-it"></a>That's it! <a class="hash-link" href="docs/getting-started.html#that-s-it">#</a></h3><p>Congratulations! You've successfully run and modified a React Native app.</p><span><center><img src="img/react-native-congratulations.png" width="150"></center>

</span><span><block class="mac ios">

</block></span><h2><a class="anchor" name="now-what"></a>Now What? <a class="hash-link" href="docs/getting-started.html#now-what">#</a></h2><ul><li><p>If you want to add this new React Native code to an existing application, check out the <a href="docs/integration-with-existing-apps.html" target="_blank">Integration guide</a>.</p></li><li><p>If you can't get this to work, see the <a href="docs/troubleshooting.html#content" target="_blank">Troubleshooting</a> page.</p></li><li><p>If you're curious to learn more about React Native, continue on
to the <a href="docs/tutorial.html" target="_blank">Tutorial</a>.</p></li></ul><span><block class="windows linux mac android">

</block></span><h2><a class="anchor" name="now-what"></a>Now What? <a class="hash-link" href="docs/getting-started.html#now-what">#</a></h2><ul><li><p>If you want to add this new React Native code to an existing application, check out the <a href="docs/integration-with-existing-apps.html" target="_blank">Integration guide</a>.</p></li><li><p>If you can't get this to work, see the <a href="docs/troubleshooting.html#content" target="_blank">Troubleshooting</a> page.</p></li><li><p>If you're curious to learn more about React Native, continue on
to the <a href="docs/tutorial.html" target="_blank">Tutorial</a>.</p></li></ul><span><script>
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
</span></div><div class="docs-prevnext"><a class="docs-next" href="docs/tutorial.html#content">Next →</a></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/docs/GettingStarted.md">edit the content above on GitHub</a> and send us a pull request!</p>