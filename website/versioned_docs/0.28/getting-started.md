---
id: getting-started
title: getting-started
---
<a id="content"></a><table width="100%"><tbody><tr><td><h1><a class="anchor" name="getting-started"></a>Getting Started <a class="hash-link" href="docs/getting-started.html#getting-started">#</a></h1></td><td style="text-align:right;"><a target="_blank" href="https://github.com/facebook/react-native/blob/0.28-stable/docs/QuickStart-GettingStarted.md">Edit on GitHub</a></td></tr></tbody></table><div><span><div class="toggler">
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
<span>Target:</span>
<a href="javascript:void(0);" class="button-ios" onclick="display('platform', 'ios')">iOS</a>
<a href="javascript:void(0);" class="button-android" onclick="display('platform', 'android')">Android</a>
<span>Development OS:</span>
<a href="javascript:void(0);" class="button-mac" onclick="display('os', 'mac')">Mac</a>
<a href="javascript:void(0);" class="button-linux" onclick="display('os', 'linux')">Linux</a>
<a href="javascript:void(0);" class="button-windows" onclick="display('os', 'windows')">Windows</a>
</div>

</span><span><!-- ######### LINUX AND WINDOWS for iOS ##################### -->

</span><span><block class="linux windows ios">

</block></span><h2><a class="anchor" name="unsupported"></a>Unsupported <a class="hash-link" href="docs/getting-started.html#unsupported">#</a></h2><span><div>Unfortunately, Apple only lets you develop for iOS on a Mac machine. Please check out the <a href="" onclick="display('platform', 'android')">Android</a> instructions instead.</div>

</span><span><center><img src="img/react-native-sorry-not-supported.png" width="150"></center>

</span><span><!-- ######### MAC for iOS ##################### -->

</span><span><block class="mac ios android">

</block></span><h2><a class="anchor" name="installation"></a>Installation <a class="hash-link" href="docs/getting-started.html#installation">#</a></h2><h3><a class="anchor" name="required-prerequisites"></a>Required Prerequisites <a class="hash-link" href="docs/getting-started.html#required-prerequisites">#</a></h3><h4><a class="anchor" name="homebrew"></a>Homebrew <a class="hash-link" href="docs/getting-started.html#homebrew">#</a></h4><p><a href="http://brew.sh/" target="_blank">Homebrew</a>, in order to install the required NodeJS, in addition to some
recommended installs.</p><div class="prism language-javascript"><span class="token operator">/</span>usr<span class="token operator">/</span>bin<span class="token operator">/</span>ruby <span class="token operator">-</span>e <span class="token string">"$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"</span></div><h4><a class="anchor" name="node"></a>Node <a class="hash-link" href="docs/getting-started.html#node">#</a></h4><p>Use Homebrew to install <a href="https://nodejs.org/" target="_blank">Node.js</a>.</p><blockquote><p>NodeJS 4.0 or greater is required for React Native. The default Homebrew package for Node is
currently 6.0, so that is not an issue.  </p></blockquote><div class="prism language-javascript">brew install node</div><h4><a class="anchor" name="react-native-command-line-tools"></a>React Native Command Line Tools <a class="hash-link" href="docs/getting-started.html#react-native-command-line-tools">#</a></h4><p>The React Native command line tools allow you to easily create and initialize projects, etc.</p><div class="prism language-javascript">npm install <span class="token operator">-</span>g react<span class="token operator">-</span>native<span class="token operator">-</span>cli</div><blockquote><p>If you see the error, <code>EACCES: permission denied</code>, please run the command:
<code>sudo npm install -g react-native-cli</code>.</p></blockquote><span><block class="mac ios">

</block></span><h4><a class="anchor" name="xcode"></a>Xcode <a class="hash-link" href="docs/getting-started.html#xcode">#</a></h4><p><a href="https://developer.apple.com/xcode/downloads/" target="_blank">Xcode</a> 7.0 or higher is required. You can install Xcode via the App Store or <a href="https://developer.apple.com/xcode/downloads/" target="_blank">Apple developer downloads</a>. This will install the Xcode IDE and Xcode Command Line Tools.</p><blockquote><p>While generally installed by default, you can verify that the Xcode Command Line Tools are installed by launching Xcode and selecting <code>Xcode | Preferences | Locations</code> and ensuring there is a version of the command line tools shown in the <code>Command Line Tools</code> list box. The Command Line Tools give you <code>git</code>, etc.</p></blockquote><span><block class="mac android">

</block></span><h4><a class="anchor" name="android-studio"></a>Android Studio <a class="hash-link" href="docs/getting-started.html#android-studio">#</a></h4><p><a href="http://developer.android.com/sdk/index.html" target="_blank">Android Studio</a> 2.0 or higher.</p><blockquote><p>Android Studio requires the Java Development Kit [JDK] 1.8 or higher. You can type
<code>javac -version</code> to see what version you have, if any. If you do not meet the JDK requirement,
you can
<a href="http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html" target="_blank">download it</a>.</p></blockquote><p>Android Studio will provide you the Android SDK and emulator required to run and test your React
Native apps.</p><blockquote><p>Unless otherwise mentioned, keep all the setup defaults intact. For example, the
<code>Android Support Repository</code> is installed automatically with Android Studio, and we need that
for React Native.</p></blockquote><p>You will need to customize your installation:</p><ul><li>Choose a <code>Custom</code> installation</li></ul><p><img src="img/react-native-android-studio-custom-install.png" alt="custom installation"></p><ul><li>Choose both <code>Performance</code> and <code>Android Virtual Device</code></li></ul><p><img src="img/react-native-android-studio-additional-installs.png" alt="additional installs"></p><ul><li>After installation, choose <code>Configure | SDK Manager</code> from the Android Studio welcome window.</li></ul><p><img src="img/react-native-android-studio-configure-sdk.png" alt="configure sdk"></p><ul><li>In the <code>SDK Platforms</code> window, choose <code>Show Package Details</code> and under <code>Android 6.0 (Marshmallow)</code>, make sure that <code>Google APIs</code>, <code>Intel x86 Atom System Image</code>, <code>Intel x86 Atom_64 System Image</code>, and <code>Google APIs Intel x86 Atom_64 System Image</code> are checked.</li></ul><p><img src="img/react-native-android-studio-android-sdk-platforms.png" alt="platforms"></p><ul><li>In the <code>SDK Tools</code> window, choose <code>Show Package Details</code> and under <code>Android SDK Build Tools</code>, make sure that <code>Android SDK Build-Tools 23.0.1</code> is selected.</li></ul><p><img src="img/react-native-android-studio-android-sdk-build-tools.png" alt="build tools"></p><h4><a class="anchor" name="android-home-environment-variable"></a>ANDROID_HOME Environment Variable <a class="hash-link" href="docs/getting-started.html#android-home-environment-variable">#</a></h4><p>Ensure the <code>ANDROID_HOME</code> environment variable points to your existing Android SDK. To do that, add
this to your <code>~/.bashrc</code>, <code>~/.bash_profile</code> (or whatever your shell uses) and re-open your terminal:</p><div class="prism language-javascript"># If you installed the SDK without Android Studio<span class="token punctuation">,</span> then it may be something like<span class="token punctuation">:</span>
# <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>opt<span class="token operator">/</span>android<span class="token operator">-</span>sdk
export ANDROID_HOME<span class="token operator">=</span><span class="token operator">~</span><span class="token operator">/</span>Library<span class="token operator">/</span>Android<span class="token operator">/</span>sdk</div><span><block class="mac ios android">

</block></span><h3><a class="anchor" name="highly-recommended-installs"></a>Highly Recommended Installs <a class="hash-link" href="docs/getting-started.html#highly-recommended-installs">#</a></h3><h4><a class="anchor" name="watchman"></a>Watchman <a class="hash-link" href="docs/getting-started.html#watchman">#</a></h4><p><a href="https://facebook.github.io/watchman/docs/install.html" target="_blank">Watchman</a> is a tool by Facebook for watching
changes in the filesystem. It is recommended you install it for better performance.</p><div class="prism language-javascript">brew install watchman</div><h4><a class="anchor" name="flow"></a>Flow <a class="hash-link" href="docs/getting-started.html#flow">#</a></h4><p><a href="http://www.flowtype.org" target="_blank">Flow</a>, for static typechecking of your React Native code (when using
Flow as part of your codebase).</p><div class="prism language-javascript">brew install flow</div><span><block class="mac android">

</block></span><h4><a class="anchor" name="add-android-tools-directory-to-your-path"></a>Add Android Tools Directory to your <code>PATH</code> <a class="hash-link" href="docs/getting-started.html#add-android-tools-directory-to-your-path">#</a></h4><p>You can add the Android tools directory on your <code>PATH</code> in case you need to run any of the Android
tools from the command line such as <code>android avd</code>. In your <code>~/.bash</code> or <code>~/.bash_profile</code>:</p><div class="prism language-javascript"># Your exact string here may be different<span class="token punctuation">.</span>
PATH<span class="token operator">=</span><span class="token string">"~/Library/Android/sdk/tools:~/Library/Android/sdk/platform-tools:${PATH}"</span>
export PATH</div><h4><a class="anchor" name="gradle-daemon"></a>Gradle Daemon <a class="hash-link" href="docs/getting-started.html#gradle-daemon">#</a></h4><p>Enable <a href="https://docs.gradle.org/2.9/userguide/gradle_daemon.html" target="_blank">Gradle Daemon</a> which greatly improves incremental build times for changes in java code.</p><h3><a class="anchor" name="other-optional-installs"></a>Other Optional Installs <a class="hash-link" href="docs/getting-started.html#other-optional-installs">#</a></h3><h4><a class="anchor" name="git"></a>Git <a class="hash-link" href="docs/getting-started.html#git">#</a></h4><p>Git version control. If you have installed <a href="https://developer.apple.com/xcode/" target="_blank">Xcode</a>, Git is
already installed, otherwise run the following:</p><div class="prism language-javascript">brew install git</div><span><block class="mac ios android">

</block></span><h4><a class="anchor" name="nuclide"></a>Nuclide <a class="hash-link" href="docs/getting-started.html#nuclide">#</a></h4><p><a href="http://nuclide.io" target="_blank">Nuclide</a> is an IDE from Facebook providing a first-class development environment
for writing, <a href="http://nuclide.io/docs/platforms/react-native/#running-applications" target="_blank">running</a> and
<a href="http://nuclide.io/docs/platforms/react-native/#debugging" target="_blank">debugging</a>
<a href="http://nuclide.io/docs/platforms/react-native/" target="_blank">React Native</a> applications.</p><p>Get started with Nuclide <a href="http://nuclide.io/docs/quick-start/getting-started/" target="_blank">here</a>.</p><span><block class="mac android">

</block></span><h4><a class="anchor" name="genymotion"></a>Genymotion <a class="hash-link" href="docs/getting-started.html#genymotion">#</a></h4><p>Genymotion is an alternative to the stock Google emulator that comes with Android Studio.
However, it's only free for personal use. If you want to use Genymotion, see below.</p><ol><li>Download and install <a href="https://www.genymotion.com/" target="_blank">Genymotion</a>.</li><li>Open Genymotion. It might ask you to install VirtualBox unless you already have it.</li><li>Create a new emulator and start it.</li><li>To bring up the developer menu press ⌘+M</li></ol><h3><a class="anchor" name="troubleshooting"></a>Troubleshooting <a class="hash-link" href="docs/getting-started.html#troubleshooting">#</a></h3><h4><a class="anchor" name="virtual-device-not-created-when-installing-android-studio"></a>Virtual Device Not Created When Installing Android Studio <a class="hash-link" href="docs/getting-started.html#virtual-device-not-created-when-installing-android-studio">#</a></h4><p>There is a <a href="https://code.google.com/p/android/issues/detail?id=207563" target="_blank">known bug</a> on some versions
of Android Studio where a virtual device will not be created, even though you selected it in the
installation sequence. You may see this at the end of the installation:</p><div class="prism language-javascript">Creating Android virtual device
Unable to create a virtual device<span class="token punctuation">:</span> Unable to create Android virtual device</div><p>If you see this, run <code>android avd</code> and create the virtual device manually.</p><p><img src="img/react-native-android-studio-avd.png" alt="avd"></p><p>Then select the new device in the AVD Manager window and click <code>Start...</code>.</p><h4><a class="anchor" name="shell-command-unresponsive-exception"></a>Shell Command Unresponsive Exception <a class="hash-link" href="docs/getting-started.html#shell-command-unresponsive-exception">#</a></h4><p>If you encounter:</p><div class="prism language-javascript">Execution failed <span class="token keyword">for</span> task <span class="token string">':app:installDebug'</span><span class="token punctuation">.</span>
  com<span class="token punctuation">.</span>android<span class="token punctuation">.</span>builder<span class="token punctuation">.</span>testing<span class="token punctuation">.</span>api<span class="token punctuation">.</span>DeviceException<span class="token punctuation">:</span> com<span class="token punctuation">.</span>android<span class="token punctuation">.</span>ddmlib<span class="token punctuation">.</span>ShellCommandUnresponsiveException</div><p>try downgrading your Gradle version to 1.2.3 in <code>&lt;project-name&gt;/android/build.gradle</code> (<a href="https://github.com/facebook/react-native/issues/2720">https://github.com/facebook/react-native/issues/2720</a>)</p><span><!-- ######### LINUX and WINDOWS for ANDROID ##################### -->

</span><span><block class="linux windows android">

</block></span><h2><a class="anchor" name="installation"></a>Installation <a class="hash-link" href="docs/getting-started.html#installation">#</a></h2><h3><a class="anchor" name="required-prerequisites"></a>Required Prerequisites <a class="hash-link" href="docs/getting-started.html#required-prerequisites">#</a></h3><span><block class="windows android">

</block></span><h4><a class="anchor" name="chocolatey"></a>Chocolatey <a class="hash-link" href="docs/getting-started.html#chocolatey">#</a></h4><p><a href="https://chocolatey.org" target="_blank">Chocolatey</a> is a package manager for Windows similar to <code>yum</code> and
<code>apt-get</code>. See the <a href="https://chocolatey.org" target="_blank">website</a> for updated instructions, but installing from
the Terminal should be something like:</p><div class="prism language-javascript">@powershell <span class="token operator">-</span>NoProfile <span class="token operator">-</span>ExecutionPolicy Bypass <span class="token operator">-</span>Command <span class="token string">"iex ((new-object net.webclient).DownloadString('https://chocolatey.org/install.ps1'))"</span> &amp;&amp; SET PATH<span class="token operator">=</span><span class="token operator">%</span>PATH<span class="token operator">%</span><span class="token punctuation">;</span><span class="token operator">%</span>ALLUSERSPROFILE<span class="token operator">%</span>\chocolatey\bin</div><blockquote><p>Normally when you run Chocolatey to install a package, you should run your Terminal as
Administrator.</p></blockquote><h4><a class="anchor" name="python-2"></a>Python 2 <a class="hash-link" href="docs/getting-started.html#python-2">#</a></h4><p>Fire up the Termimal and use Chocolatey to install Python 2.</p><blockquote><p>Python 3 will currently not work when initializing a React Native project.</p></blockquote><div class="prism language-javascript">choco install python2</div><span><block class="linux windows android">

</block></span><h4><a class="anchor" name="node"></a>Node <a class="hash-link" href="docs/getting-started.html#node">#</a></h4><span><block class="linux android">

</block></span><p>Fire up the Terminal and type the following commands to install NodeJS from the NodeSource
repository:</p><div class="prism language-javascript">sudo apt<span class="token operator">-</span><span class="token keyword">get</span> install <span class="token operator">-</span>y build<span class="token operator">-</span>essential
curl <span class="token operator">-</span>sL https<span class="token punctuation">:</span><span class="token operator">/</span><span class="token operator">/</span>deb<span class="token punctuation">.</span>nodesource<span class="token punctuation">.</span>com<span class="token operator">/</span>setup_4<span class="token punctuation">.</span>x <span class="token operator">|</span> sudo <span class="token operator">-</span>E bash <span class="token operator">-</span>
sudo apt<span class="token operator">-</span><span class="token keyword">get</span> install <span class="token operator">-</span>y nodejs
sudo ln <span class="token operator">-</span>s <span class="token operator">/</span>usr<span class="token operator">/</span>bin<span class="token operator">/</span>nodejs <span class="token operator">/</span>usr<span class="token operator">/</span>bin<span class="token operator">/</span>node</div><span><block class="windows android">

</block></span><p>Fire up the Termimal and use Chocolatey to install NodeJS.</p><div class="prism language-javascript">choco install nodejs<span class="token punctuation">.</span>install</div><span><block class="windows linux android">

</block></span><h4><a class="anchor" name="react-native-command-line-tools"></a>React Native Command Line Tools <a class="hash-link" href="docs/getting-started.html#react-native-command-line-tools">#</a></h4><p>The React Native command line tools allow you to easily create and initialize projects, etc.</p><div class="prism language-javascript">npm install <span class="token operator">-</span>g react<span class="token operator">-</span>native<span class="token operator">-</span>cli</div><blockquote><p>If you see the error, <code>EACCES: permission denied</code>, please run the command:
<code>sudo npm install -g react-native-cli</code>.</p></blockquote><h4><a class="anchor" name="android-studio"></a>Android Studio <a class="hash-link" href="docs/getting-started.html#android-studio">#</a></h4><p><a href="http://developer.android.com/sdk/index.html" target="_blank">Android Studio</a> 2.0 or higher.</p><blockquote><p>Android Studio requires the Java Development Kit [JDK] 1.8 or higher. You can type
<code>javac -version</code> to see what version you have, if any. If you do not meet the JDK requirement,
you can
<a href="http://www.oracle.com/technetwork/java/javase/downloads/jdk8-downloads-2133151.html" target="_blank">download it</a>,
or use a pacakage manager to install it (e.g. <code>choco install jdk8</code>,
<code>apt-get install default-jdk</code>).</p></blockquote><p>Android Studio will provide you the Android SDK and emulator required to run and test your React
Native apps.</p><blockquote><p>Unless otherwise mentioned, keep all the setup defaults intact. For example, the
<code>Android Support Repository</code> is installed automatically with Android Studio, and we need that
for React Native.</p></blockquote><span><block class="linux android">

</block></span><p>You will need to customize your installation:</p><ul><li>Choose a <code>Custom</code> installation</li></ul><p><img src="img/react-native-android-studio-custom-install-linux.png" alt="custom installation"></p><ul><li>Choose <code>Android Virtual Device</code></li></ul><p><img src="img/react-native-android-studio-additional-installs-linux.png" alt="additional installs"></p><span><block class="windows android">

</block></span><ul><li><p>Make sure all components are checked for the install, particularly the <code>Android SDK</code> and <code>Android Device Emulator</code>.</p></li><li><p>After the initial install, choose a <code>Custom</code> installation.</p></li></ul><p><img src="img/react-native-android-studio-custom-install-windows.png" alt="custom installation"></p><ul><li>Verify installed components, particularly the emulator and the HAXM accelerator. They should be checked.</li></ul><p><img src="img/react-native-android-studio-verify-installs-windows.png" alt="verify installs"></p><span><block class="windows linux android">

</block></span><ul><li>After installation, choose <code>Configure | SDK Manager</code> from the Android Studio welcome window.</li></ul><span><block class="linux android">

</block></span><p><img src="img/react-native-android-studio-configure-sdk-linux.png" alt="configure sdk"></p><span><block class="windows android">

</block></span><p><img src="img/react-native-android-studio-configure-sdk-windows.png" alt="configure sdk"></p><span><block class="windows linux android">

</block></span><ul><li>In the <code>SDK Platforms</code> window, choose <code>Show Package Details</code> and under <code>Android 6.0 (Marshmallow)</code>, make sure that <code>Google APIs</code>, <code>Intel x86 Atom System Image</code>, <code>Intel x86 Atom_64 System Image</code>, and <code>Google APIs Intel x86 Atom_64 System Image</code> are checked.</li></ul><span><block class="linux android">

</block></span><p><img src="img/react-native-android-studio-android-sdk-platforms-linux.png" alt="platforms"></p><span><block class="windows android">

</block></span><p><img src="img/react-native-android-studio-android-sdk-platforms-windows.png" alt="platforms"></p><span><block class="windows linux android">

</block></span><ul><li>In the <code>SDK Tools</code> window, choose <code>Show Package Details</code> and under <code>Android SDK Build Tools</code>, make sure that <code>Android SDK Build-Tools 23.0.1</code> is selected.</li></ul><span><block class="linux android">

</block></span><p><img src="img/react-native-android-studio-android-sdk-build-tools-linux.png" alt="build tools"></p><span><block class="windows android">

</block></span><p><img src="img/react-native-android-studio-android-sdk-build-tools-windows.png" alt="build tools"></p><span><block class="windows linux android">

</block></span><h4><a class="anchor" name="android-home-environment-variable"></a>ANDROID_HOME Environment Variable <a class="hash-link" href="docs/getting-started.html#android-home-environment-variable">#</a></h4><p>Ensure the <code>ANDROID_HOME</code> environment variable points to your existing Android SDK.</p><span><block class="linux android">

</block></span><p>To do that, add this to your <code>~/.bashrc</code>, <code>~/.bash_profile</code> (or whatever your shell uses) and
re-open your terminal:</p><div class="prism language-javascript"># If you installed the SDK without Android Studio<span class="token punctuation">,</span> then it may be something like<span class="token punctuation">:</span>
# <span class="token operator">/</span>usr<span class="token operator">/</span>local<span class="token operator">/</span>opt<span class="token operator">/</span>android<span class="token operator">-</span>sdk<span class="token punctuation">;</span> Generally <span class="token keyword">with</span> Android Studio<span class="token punctuation">,</span> the SDK is installed here<span class="token punctuation">.</span><span class="token punctuation">.</span><span class="token punctuation">.</span>
export ANDROID_HOME<span class="token operator">=</span><span class="token operator">~</span><span class="token operator">/</span>Android<span class="token operator">/</span>Sdk</div><blockquote><p>You need to restart the Terminal to apply the new environment variables (or <code>source</code> the relevant
bash file).</p></blockquote><span><block class="windows android">

</block></span><p>Go to <code>Control Panel</code> -&gt; <code>System and Security</code> -&gt; <code>System</code> -&gt; <code>Change settings</code> -&gt;
<code>Advanced System Settings</code> -&gt; <code>Environment variables</code> -&gt; <code>New</code></p><blockquote><p>Your path to the SDK will vary to the one shown below.</p></blockquote><p><img src="img/react-native-android-sdk-environment-variable-windows.png" alt="env variable"></p><blockquote><p>You need to restart the Command Prompt (Windows) to apply the new environment variables.</p></blockquote><span><block class="linux windows android">

</block></span><h3><a class="anchor" name="highly-recommended-installs"></a>Highly Recommended Installs <a class="hash-link" href="docs/getting-started.html#highly-recommended-installs">#</a></h3><span><block class="linux android">

</block></span><h4><a class="anchor" name="watchman"></a>Watchman <a class="hash-link" href="docs/getting-started.html#watchman">#</a></h4><p>Watchman is a tool by Facebook for watching changes in the filesystem. It is recommended you install
it for better performance.</p><blockquote><p>This also helps avoid a node file-watching bug.</p></blockquote><p>Type the following into your terminal to compile watchman from source and install it:</p><div class="prism language-javascript">git clone https<span class="token punctuation">:</span><span class="token operator">/</span><span class="token operator">/</span>github<span class="token punctuation">.</span>com<span class="token operator">/</span>facebook<span class="token operator">/</span>watchman<span class="token punctuation">.</span>git
cd watchman
git checkout v4<span class="token number">.5</span><span class="token punctuation">.</span><span class="token number">0</span>  # the latest stable release
<span class="token punctuation">.</span><span class="token operator">/</span>autogen<span class="token punctuation">.</span>sh
<span class="token punctuation">.</span><span class="token operator">/</span>configure
make
sudo make install</div><h4><a class="anchor" name="flow"></a>Flow <a class="hash-link" href="docs/getting-started.html#flow">#</a></h4><p><a href="http://www.flowtype.org" target="_blank">Flow</a>, for static typechecking of your React Native code (when using
Flow as part of your codebase).</p><p>Type the following in the terminal:</p><div class="prism language-javascript">npm install <span class="token operator">-</span>g flow<span class="token operator">-</span>bin</div><span><block class="windows linux android">

</block></span><h4><a class="anchor" name="gradle-daemon"></a>Gradle Daemon <a class="hash-link" href="docs/getting-started.html#gradle-daemon">#</a></h4><p>Enable <a href="https://docs.gradle.org/2.9/userguide/gradle_daemon.html" target="_blank">Gradle Daemon</a> which greatly
improves incremental build times for changes in java code.</p><span><block class="mac linux android">

</block></span><div class="prism language-javascript">touch <span class="token operator">~</span><span class="token operator">/</span><span class="token punctuation">.</span>gradle<span class="token operator">/</span>gradle<span class="token punctuation">.</span>properties &amp;&amp; echo <span class="token string">"org.gradle.daemon=true"</span> <span class="token operator">&gt;</span><span class="token operator">&gt;</span> <span class="token operator">~</span><span class="token operator">/</span><span class="token punctuation">.</span>gradle<span class="token operator">/</span>gradle<span class="token punctuation">.</span>properties</div><span><block class="windows android">

</block></span><div class="prism language-javascript"><span class="token punctuation">(</span><span class="token keyword">if</span> not exist <span class="token string">"%USERPROFILE%/.gradle"</span> mkdir <span class="token string">"%USERPROFILE%/.gradle"</span><span class="token punctuation">)</span> &amp;&amp; <span class="token punctuation">(</span>echo org<span class="token punctuation">.</span>gradle<span class="token punctuation">.</span>daemon<span class="token operator">=</span><span class="token boolean">true</span> <span class="token operator">&gt;</span><span class="token operator">&gt;</span> <span class="token string">"%USERPROFILE%/.gradle/gradle.properties"</span><span class="token punctuation">)</span></div><span><block class="linux android">

</block></span><h4><a class="anchor" name="android-emulator-accelerator"></a>Android Emulator Accelerator <a class="hash-link" href="docs/getting-started.html#android-emulator-accelerator">#</a></h4><p>You may have seen the following screen when installing Android Studio.</p><p><img src="img/react-native-android-studio-kvm-linux.png" alt="accelerator"></p><p>If your system supports KVM, you should install the
<a href="https://software.intel.com/en-us/android/articles/speeding-up-the-android-emulator-on-intel-architecture#_Toc358213272" target="_blank">Intel Android Emulator Accelerator</a>.</p><span><block class="windows linux android">

</block></span><h4><a class="anchor" name="add-android-tools-directory-to-your-path"></a>Add Android Tools Directory to your <code>PATH</code> <a class="hash-link" href="docs/getting-started.html#add-android-tools-directory-to-your-path">#</a></h4><p>You can add the Android tools directory on your <code>PATH</code> in case you need to run any of the Android
tools from the command line such as <code>android avd</code>.</p><span><block class="linux android">

</block></span><p>In your <code>~/.bashrc</code> or <code>~/.bash_profile</code>:</p><div class="prism language-javascript"># Your exact string here may be different<span class="token punctuation">.</span>
PATH<span class="token operator">=</span><span class="token string">"~/Android/Sdk/tools:~/Android/Sdk/platform-tools:${PATH}"</span>
export PATH</div><span><block class="windows android">

</block></span><p>Go to <code>Control Panel</code> -&gt; <code>System and Security</code> -&gt; <code>System</code> -&gt; <code>Change settings</code> -&gt;
<code>Advanced System Settings</code> -&gt; <code>Environment variables</code> -&gt;  highlight <code>PATH</code> -&gt; <code>Edit...</code></p><blockquote><p>The location of your Android tools directories will vary.</p></blockquote><p><img src="img/react-native-android-tools-environment-variable-windows.png" alt="env variable"></p><span><block class="windows linux android">

</block></span><h3><a class="anchor" name="other-optional-installs"></a>Other Optional Installs <a class="hash-link" href="docs/getting-started.html#other-optional-installs">#</a></h3><h4><a class="anchor" name="git"></a>Git <a class="hash-link" href="docs/getting-started.html#git">#</a></h4><span><block class="linux android">

</block></span><p>Install Git <a href="https://git-scm.com/download/linux" target="_blank">via your package manager</a>
(e.g., <code>sudo apt-get install git-all</code>).</p><span><block class="windows android">

</block></span><p>You can use Chocolatey to install <code>git</code> via:</p><div class="prism language-javascript">choco install git</div><p>Alternatively, you can download and install <a href="https://git-for-windows.github.io/" target="_blank">Git for Windows</a>.
During the setup process, choose "Run Git from Windows Command Prompt", which will add <code>git</code> to your
<code>PATH</code> environment variable.</p><span><block class="linux android">

</block></span><h4><a class="anchor" name="nuclide"></a>Nuclide <a class="hash-link" href="docs/getting-started.html#nuclide">#</a></h4><p>[Nuclide] is an IDE from Facebook providing a first-class development environment for writing,
<a href="http://nuclide.io/docs/platforms/react-native/#running-applications" target="_blank">running</a> and
<a href="http://nuclide.io/docs/platforms/react-native/#debugging" target="_blank">debugging</a>
<a href="http://nuclide.io/docs/platforms/react-native/" target="_blank">React Native</a> applications.</p><p>Get started with Nuclide <a href="http://nuclide.io/docs/quick-start/getting-started/" target="_blank">here</a>.</p><span><block class="linux windows android">

</block></span><h4><a class="anchor" name="genymotion"></a>Genymotion <a class="hash-link" href="docs/getting-started.html#genymotion">#</a></h4><p>Genymotion is an alternative to the stock Google emulator that comes with Android Studio.
However, it's only free for personal use. If you want to use the stock Google emulator, see below.</p><ol><li>Download and install <a href="https://www.genymotion.com/" target="_blank">Genymotion</a>.</li><li>Open Genymotion. It might ask you to install VirtualBox unless you already have it.</li><li>Create a new emulator and start it.</li><li>To bring up the developer menu press ⌘+M</li></ol><span><block class="windows android">

</block></span><h4><a class="anchor" name="visual-studio-emulator-for-android"></a>Visual Studio Emulator for Android <a class="hash-link" href="docs/getting-started.html#visual-studio-emulator-for-android">#</a></h4><p>The <a href="https://www.visualstudio.com/en-us/features/msft-android-emulator-vs.aspx" target="_blank">Visual Studio Emulator for Android</a>
is a free android emulator that is hardware accelerated via Hyper-V. It is an alternative to the
stock Google emulator that comes with Android Studio. It doesn't require you to install Visual
Studio at all.</p><p>To use it with react-native you just have to add a key and value to your registry:</p><ol><li>Open the Run Command (Windows+R)</li><li>Enter <code>regedit.exe</code></li><li>In the Registry Editor navigate to <code>HKEY_LOCAL_MACHINE\SOFTWARE\Wow6432Node\Android SDK Tools</code></li><li>Right Click on <code>Android SDK Tools</code> and choose <code>New &gt; String Value</code></li><li>Set the name to <code>Path</code></li><li>Double Click the new <code>Path</code> Key and set the value to <code>C:\Program Files\Android\sdk</code>. The path value might be different on your machine.</li></ol><p>You will also need to run the command <code>adb reverse tcp:8081 tcp:8081</code> with this emulator.</p><p>Then restart the emulator and when it runs you can just do <code>react-native run-android</code> as usual.</p><span><block class="windows linux android">

</block></span><h3><a class="anchor" name="troubleshooting"></a>Troubleshooting <a class="hash-link" href="docs/getting-started.html#troubleshooting">#</a></h3><h4><a class="anchor" name="unable-to-run-mksdcard-sdk-tool"></a>Unable to run mksdcard SDK Tool <a class="hash-link" href="docs/getting-started.html#unable-to-run-mksdcard-sdk-tool">#</a></h4><p>When installing Android Studio, if you get the error:</p><div class="prism language-javascript">Unable to run mksdcard SDK tool</div><p>then install the standard C++ library:</p><div class="prism language-javascript">sudo apt<span class="token operator">-</span><span class="token keyword">get</span> install lib32stdc<span class="token operator">++</span><span class="token number">6</span></div><h4><a class="anchor" name="virtual-device-not-created-when-installing-android-studio"></a>Virtual Device Not Created When Installing Android Studio <a class="hash-link" href="docs/getting-started.html#virtual-device-not-created-when-installing-android-studio">#</a></h4><p>There is a <a href="https://code.google.com/p/android/issues/detail?id=207563" target="_blank">known bug</a> on some versions
of Android Studio where a virtual device will not be created, even though you selected it in the
installation sequence. You may see this at the end of the installation:</p><span><block class="linux android">

</block></span><div class="prism language-javascript">Creating Android virtual device
Unable to create a virtual device<span class="token punctuation">:</span> Unable to create Android virtual device</div><span><block class="windows android">

</block></span><p><img src="img/react-native-android-studio-no-virtual-device-windows.png" alt="no virtual device"></p><span><block class="windows linux android">

</block></span><p>If you see this, run <code>android avd</code> and create the virtual device manually.</p><span><block class="linux android">

</block></span><p><img src="img/react-native-android-studio-avd-linux.png" alt="avd"></p><span><block class="windows android">

</block></span><p><img src="img/react-native-android-studio-avd-windows.png" alt="avd"></p><span><block class="windows linux android">

</block></span><p>Then select the new device in the AVD Manager window and click <code>Start...</code>.</p><span><block class="linux android">

</block></span><h4><a class="anchor" name="shell-command-unresponsive-exception"></a>Shell Command Unresponsive Exception <a class="hash-link" href="docs/getting-started.html#shell-command-unresponsive-exception">#</a></h4><p>In case you encounter</p><div class="prism language-javascript">Execution failed <span class="token keyword">for</span> task <span class="token string">':app:installDebug'</span><span class="token punctuation">.</span>
  com<span class="token punctuation">.</span>android<span class="token punctuation">.</span>builder<span class="token punctuation">.</span>testing<span class="token punctuation">.</span>api<span class="token punctuation">.</span>DeviceException<span class="token punctuation">:</span> com<span class="token punctuation">.</span>android<span class="token punctuation">.</span>ddmlib<span class="token punctuation">.</span>ShellCommandUnresponsiveException</div><p>try downgrading your Gradle version to 1.2.3 in <code>&lt;project-name&gt;/android/build.gradle</code> (<a href="https://github.com/facebook/react-native/issues/2720">https://github.com/facebook/react-native/issues/2720</a>)</p><span><block class="mac ios android">

</block></span><h2><a class="anchor" name="testing-installation"></a>Testing Installation <a class="hash-link" href="docs/getting-started.html#testing-installation">#</a></h2><span><block class="mac ios">

</block></span><div class="prism language-javascript">react<span class="token operator">-</span>native init AwesomeProject
cd AwesomeProject
react<span class="token operator">-</span>native run<span class="token operator">-</span>ios</div><blockquote><p>You can also
<a href="http://nuclide.io/docs/quick-start/getting-started/#adding-a-project" target="_blank">open the <code>AwesomeProject</code></a>
folder in <a href="http://nuclide.io" target="_blank">Nuclide</a> and
<a href="http://nuclide.io/docs/platforms/react-native/#command-line" target="_blank">run the application</a>, or open
<code>ios/AwesomeProject.xcodeproj</code> and hit the <code>Run</code> button in Xcode.</p></blockquote><span><block class="mac android">

</block></span><div class="prism language-javascript">react<span class="token operator">-</span>native init AwesomeProject
cd AwesomeProject
react<span class="token operator">-</span>native run<span class="token operator">-</span>android</div><blockquote><p>You can also
<a href="http://nuclide.io/docs/quick-start/getting-started/#adding-a-project" target="_blank">open the <code>AwesomeProject</code></a>
folder in <a href="http://nuclide.io" target="_blank">Nuclide</a> and
<a href="http://nuclide.io/docs/platforms/react-native/#command-line" target="_blank">run the application</a>.</p></blockquote><span><block class="mac ios android">

</block></span><h3><a class="anchor" name="modifying-project"></a>Modifying Project <a class="hash-link" href="docs/getting-started.html#modifying-project">#</a></h3><p>Now that you successfully started the project, let's modify it:</p><span><block class="mac ios">

</block></span><ul><li>Open <code>index.ios.js</code> in your text editor of choice (e.g. <a href="http://nuclide.io/docs/platforms/react-native/" target="_blank">Nuclide</a>) and edit some lines.</li><li>Hit ⌘-R in your iOS simulator to reload the app and see your change!</li></ul><span><block class="mac android">

</block></span><ul><li>Open <code>index.android.js</code> in your text editor of choice (e.g. <a href="http://nuclide.io/docs/platforms/react-native/" target="_blank">Nuclide</a>) and edit some lines.</li><li>Press the <code>R</code> key twice <strong>OR</strong> open the menu (F2 by default, or ⌘-M in Genymotion) and select Reload JS to see your change!</li><li>Run <code>adb logcat *:S ReactNative:V ReactNativeJS:V</code> in a terminal to see your app's logs</li></ul><span><block class="mac ios android">

</block></span><h3><a class="anchor" name="that-s-it"></a>That's It <a class="hash-link" href="docs/getting-started.html#that-s-it">#</a></h3><p>Congratulations! You've successfully run and modified your first React Native app.</p><span><center><img src="img/react-native-congratulations.png" width="150"></center>

</span><span><block class="windows linux android">

</block></span><h2><a class="anchor" name="testing-installation"></a>Testing Installation <a class="hash-link" href="docs/getting-started.html#testing-installation">#</a></h2><div class="prism language-javascript">react<span class="token operator">-</span>native init AwesomeProject
cd AwesomeProject
react<span class="token operator">-</span>native run<span class="token operator">-</span>android</div><span><block class="windows linux android">

</block></span><h3><a class="anchor" name="troubleshooting-run"></a>Troubleshooting Run <a class="hash-link" href="docs/getting-started.html#troubleshooting-run">#</a></h3><p>A common issue is that the packager is not started automatically when you run
<code>react-native run-android</code>. You can start it manually using:</p><div class="prism language-javascript">cd AwesomeProject
react<span class="token operator">-</span>native start</div><span><block class="windows android">

</block></span><p>Or if you hit a <code>ERROR  Watcher took too long to load</code> on Windows, try increasing the timeout in <a href="https://github.com/facebook/react-native/blob/5fa33f3d07f8595a188f6fe04d6168a6ede1e721/packager/react-packager/src/DependencyResolver/FileWatcher/index.js#L16" target="_blank">this file</a> (under your <code>node_modules/react-native/</code>).</p><span><block class="windows linux android">

</block></span><h3><a class="anchor" name="modifying-project"></a>Modifying Project <a class="hash-link" href="docs/getting-started.html#modifying-project">#</a></h3><p>Now that you successfully started the project, let's modify it:</p><ul><li>Open <code>index.android.js</code> in your text editor of choice (e.g. <a href="http://nuclide.io/docs/platforms/react-native/" target="_blank">Nuclide</a>) and edit some lines.</li><li>Press the <code>R</code> key twice <strong>OR</strong> open the menu (F2 by default, or ctrl-M in the emulator) and select Reload JS to see your change!</li><li>Run <code>adb logcat *:S ReactNative:V ReactNativeJS:V</code> in a terminal to see your app's logs</li></ul><h3><a class="anchor" name="that-s-it"></a>That's It <a class="hash-link" href="docs/getting-started.html#that-s-it">#</a></h3><p>Congratulations! You've successfully run and modified your first React Native app.</p><span><center><img src="img/react-native-congratulations.png" width="150"></center>

</span><span><block class="mac ios android">

</block></span><h2><a class="anchor" name="common-followups"></a>Common Followups <a class="hash-link" href="docs/getting-started.html#common-followups">#</a></h2><span><block class="mac ios">

</block></span><ul><li>If you want to run on a physical device, see the <a href="docs/running-on-device-ios.html#content" target="_blank">Running on iOS Device page</a>.</li></ul><span><block class="mac android">

</block></span><ul><li>If you want to run on a physical device, see the <a href="docs/running-on-device-android.html#content" target="_blank">Running on Android Device page</a>.</li></ul><span><block class="mac ios android">

</block></span><ul><li>If you run into any issues getting started, see the <a href="docs/troubleshooting.html#content" target="_blank">Troubleshooting page</a>.</li></ul><span><block class="windows linux android">

</block></span><h2><a class="anchor" name="common-followups"></a>Common Followups <a class="hash-link" href="docs/getting-started.html#common-followups">#</a></h2><ul><li><p>If you want to run on a physical device, see the <a href="docs/running-on-device-android.html#content" target="_blank">Running on Android Device page</a>.</p></li><li><p>If you run into any issues getting started, see the <a href="docs/troubleshooting.html#content" target="_blank">Troubleshooting page</a>.</p></li></ul><span><script>
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
</span></div><div class="docs-prevnext"><a class="docs-next" href="docs/tutorial-core-components.html#content">Next →</a></div><div class="survey"><div class="survey-image"></div><p>We are planning improvements to the React Native documentation. Your responses to this short survey will go a long way in helping us provide valuable content. Thank you!</p><center><a class="button" href="https://www.facebook.com/survey?oid=681969738611332">Take Survey</a></center></div>