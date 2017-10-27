---
id: version-0.31-getting-started
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
}</style>
<span>Mobile OS:</span>
<a href="javascript:void(0);" class="button-ios" onclick="display('platform', 'ios')">iOS</a>
<a href="javascript:void(0);" class="button-android" onclick="display('platform', 'android')">Android</a>
<span>Development OS:</span>
<a href="javascript:void(0);" class="button-mac" onclick="display('os', 'mac')">Mac</a>
<a href="javascript:void(0);" class="button-linux" onclick="display('os', 'linux')">Linux</a>
<a href="javascript:void(0);" class="button-windows" onclick="display('os', 'windows')">Windows</a>
</div>

</span><span><!-- ######### LINUX AND WINDOWS for iOS ##################### -->

</span><span><block class="linux windows ios">

</block></span><h2><a class="anchor" name="unsupported"></a>Unsupported <a class="hash-link" href="docs/getting-started.html#unsupported">#</a></h2><span><div>Unfortunately, Apple only lets you develop for iOS on a Mac. If you want to build an iOS app but you don't have a Mac yet, you can try starting with the <a href="" onclick="display('platform', 'android')">Android</a> instructions instead.</div>

</span><span><center><img src="img/react-native-sorry-not-supported.png" width="150"></center>

</span><span><!-- ######### MAC for iOS ##################### -->

</span><span><block class="mac ios">

</block></span><h2><a class="anchor" name="dependencies-for-mac-ios"></a>Dependencies for Mac + iOS <a class="hash-link" href="docs/getting-started.html#dependencies-for-mac-ios">#</a></h2><p>You will need Xcode, node.js, the React Native command line tools, and Watchman.</p><span><block class="mac android">

</block></span><h2><a class="anchor" name="dependencies-for-mac-android"></a>Dependencies for Mac + Android <a class="hash-link" href="docs/getting-started.html#dependencies-for-mac-android">#</a></h2><p>You will need Android Studio, node.js, the React Native command line tools, and Watchman.</p><span><block class="mac ios android">

</block></span><p>We recommend installing node and watchman via <a href="http://brew.sh/" target="_blank">Homebrew</a>.</p><div class="prism language-javascript">brew install node
brew install watchman</div><p>Node comes with npm, which lets you install the React Native command line interface.</p><div class="prism language-javascript">npm install <span class="token operator">-</span>g react<span class="token operator">-</span>native<span class="token operator">-</span>cli</div><p>If you get a permission error, try with sudo: <code>sudo npm install -g react-native-cli</code>.</p><span><block class="mac ios">

</block></span><p>The easiest way to install Xcode is via the <a href="https://itunes.apple.com/us/app/xcode/id497799835?mt=12" target="_blank">Mac App Store</a>.</p><span><block class="mac android">

</block></span><p>Download and install <a href="https://developer.android.com/studio/install.html" target="_blank">Android Studio</a>.</p><p>If you plan to make changes in Java code, we recommend <a href="https://docs.gradle.org/2.9/userguide/gradle_daemon.html" target="_blank">Gradle Daemon</a> which speeds up the build.</p><span><!-- ######### LINUX and WINDOWS for ANDROID ##################### -->

</span><span><block class="linux android">

</block></span><h2><a class="anchor" name="dependencies-for-linux-android"></a>Dependencies for Linux + Android <a class="hash-link" href="docs/getting-started.html#dependencies-for-linux-android">#</a></h2><span><block class="windows android">

</block></span><h2><a class="anchor" name="dependencies-for-windows-android"></a>Dependencies for Windows + Android <a class="hash-link" href="docs/getting-started.html#dependencies-for-windows-android">#</a></h2><span><block class="linux windows android">

</block></span><p>You will need node.js, the React Native command line tools, Watchman, and Android Studio.</p><span><block class="linux android">

</block></span><p>Follow the <a href="https://nodejs.org/en/download/package-manager/" target="_blank">installation instructions for your Linux distribution</a> to install Node.js 4 or newer.</p><span><block class="windows android">

</block></span><p>We recommend installing node.js and Python2 via <a href="https://chocolatey.org" target="_blank">Chocolatey</a>, a popular package manager for Windows. Open a Command Prompt as Administrator, then run:</p><div class="prism language-javascript">choco install nodejs<span class="token punctuation">.</span>install
choco install python2</div><span><block class="windows linux android">

</block></span><p>Node comes with npm, which lets you install the React Native command line interface.</p><div class="prism language-javascript">npm install <span class="token operator">-</span>g react<span class="token operator">-</span>native<span class="token operator">-</span>cli</div><span><block class="windows linux android">

</block></span><p>Download and install <a href="https://developer.android.com/studio/install.html" target="_blank">Android Studio</a>.</p><span><block class="linux android">

</block></span><p><a href="https://facebook.github.io/watchman" target="_blank">Watchman</a> is a tool by Facebook for watching changes in the filesystem. Installing it should
improve performance, but you can also try not installing it, if the installation process is too annoying. You can follow the <a href="https://facebook.github.io/watchman/docs/install.html#installing-from-source" target="_blank">Watchman installation guide</a> to compile and install from source.</p><span><block class="windows linux android">

</block></span><p>If you plan to make changes in Java code, we recommend <a href="https://docs.gradle.org/2.9/userguide/gradle_daemon.html" target="_blank">Gradle Daemon</a> which speeds up the build.</p><span><block class="mac ios android">

</block></span><h2><a class="anchor" name="testing-your-react-native-installation"></a>Testing your React Native Installation <a class="hash-link" href="docs/getting-started.html#testing-your-react-native-installation">#</a></h2><span><block class="mac ios">

</block></span><p>Use the React Native command line tools to generate a new React Native project called "AwesomeProject", then run <code>react-native run-ios</code> inside the newly created folder.</p><div class="prism language-javascript">react<span class="token operator">-</span>native init AwesomeProject
cd AwesomeProject
react<span class="token operator">-</span>native run<span class="token operator">-</span>ios</div><p>You should see your new app running in the iOS Simulator shortly. <code>react-native run-ios</code> is just one way to run your app - you can also run it directly from within Xcode or Nuclide.</p><span><block class="mac android">

</block></span><p>Use the React Native command line tools to generate a new React Native project called "AwesomeProject", then run <code>react-native run-android</code> inside the newly created folder.</p><div class="prism language-javascript">react<span class="token operator">-</span>native init AwesomeProject
cd AwesomeProject
react<span class="token operator">-</span>native run<span class="token operator">-</span>android</div><p>If everything is set up correctly, you should see your new app running in your Android emulator shortly. <code>react-native run-android</code> is just one way to run your app - you can also run it directly from within Android Studio or Nuclide.</p><span><block class="mac ios android">

</block></span><h3><a class="anchor" name="modifying-your-app"></a>Modifying your app <a class="hash-link" href="docs/getting-started.html#modifying-your-app">#</a></h3><p>Now that you have successfully run the app, let's modify it.</p><span><block class="mac ios">

</block></span><ul><li>Open <code>index.ios.js</code> in your text editor of choice and edit some lines.</li><li>Hit <code>Command⌘ + R</code> in your iOS Simulator to reload the app and see your change!</li></ul><span><block class="mac android">

</block></span><ul><li>Open <code>index.android.js</code> in your text editor of choice and edit some lines.</li><li>Press the <code>R</code> key twice or select <code>Reload</code> from the Developer Menu to see your change!</li></ul><span><block class="mac ios android">

</block></span><h3><a class="anchor" name="that-s-it"></a>That's it! <a class="hash-link" href="docs/getting-started.html#that-s-it">#</a></h3><p>Congratulations! You've successfully run and modified your first React Native app.</p><span><center><img src="img/react-native-congratulations.png" width="150"></center>

</span><span><block class="windows linux android">

</block></span><h2><a class="anchor" name="testing-your-react-native-installation"></a>Testing your React Native Installation <a class="hash-link" href="docs/getting-started.html#testing-your-react-native-installation">#</a></h2><p>Use the React Native command line tools to generate a new React Native project called "AwesomeProject", then run <code>react-native run-android</code> inside the newly created folder.</p><div class="prism language-javascript">react<span class="token operator">-</span>native init AwesomeProject
cd AwesomeProject
react<span class="token operator">-</span>native run<span class="token operator">-</span>android</div><p>If everything is set up correctly, you should see your new app running in your Android emulator shortly.</p><blockquote><p>A common issue is that the packager is not started automatically when you run
<code>react-native run-android</code>. You can start it manually using <code>react-native start</code>.</p></blockquote><span><block class="windows android">

</block></span><blockquote><p>If you hit a <code>ERROR  Watcher took too long to load</code> on Windows, try increasing the timeout in <a href="https://github.com/facebook/react-native/blob/5fa33f3d07f8595a188f6fe04d6168a6ede1e721/packager/react-packager/src/DependencyResolver/FileWatcher/index.js#L16" target="_blank">this file</a> (under your <code>node_modules/react-native/</code>).</p></blockquote><span><block class="windows linux android">

</block></span><h3><a class="anchor" name="modifying-your-app"></a>Modifying your app <a class="hash-link" href="docs/getting-started.html#modifying-your-app">#</a></h3><p>Now that you have successfully run the app, let's modify it.</p><ul><li>Open <code>index.android.js</code> in your text editor of choice and edit some lines.</li><li>Press the <code>R</code> key twice or select <code>Reload</code> from the Developer Menu to see your change!</li></ul><h3><a class="anchor" name="that-s-it"></a>That's it! <a class="hash-link" href="docs/getting-started.html#that-s-it">#</a></h3><p>Congratulations! You've successfully run and modified a React Native app.</p><span><center><img src="img/react-native-congratulations.png" width="150"></center>

</span><span><block class="mac windows linux ios android">

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
</span></div><div class="docs-prevnext"><a class="docs-next" href="docs/tutorial.html#content">Next →</a></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/docs/GettingStarted.md">edit the content above on GitHub</a> and send us a pull request!</p><div class="survey"><div class="survey-image"></div><p>Recently, we have been working hard to make the documentation better based on your feedback. Your responses to this yes/no style survey will help us gauge whether we moved in the right direction with the improvements. Thank you!</p><center><a class="button" href="https://www.facebook.com/survey?oid=516954245168428">Take Survey</a></center></div>