---
id: running-on-device
title: running-on-device
---
<a id="content"></a><h1><a class="anchor" name="running-on-device"></a>Running On Device <a class="hash-link" href="docs/running-on-device.html#running-on-device">#</a></h1><div class="banner-crna-ejected"><h3>Project with Native Code Required</h3><p>This page only applies to projects made with <code>react-native init</code> or to those made with Create React Native App which have since ejected. For more information about ejecting, please see the <a href="https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md" target="_blank">guide</a> on the Create React Native App repository.</p></div><div><span><style>
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

</span><p>It's always a good idea to test your app on an actual device before releasing it to your users. This document will guide you through the necessary steps to run your React Native app on a device and to get it ready for production.</p><p>If you used Create React Native App to set up your project, you can preview your app on a device by scanning the QR code with the Expo app. In order to build and run your app on a device, you will need to eject and install the native code dependencies from the <a href="docs/getting-started.html" target="_blank">Getting Started guide</a>.</p><span><div class="toggler">

  <ul role="tablist">
    <li id="ios" class="button-ios" aria-selected="false" role="tab" tabindex="0" aria-controls="iostab" onclick="displayTab('platform', 'ios')">
      iOS
    </li>
    <li id="android" class="button-android" aria-selected="false" role="tab" tabindex="-1" aria-controls="androidtab" onclick="displayTab('platform', 'android')">
      Android
    </li>
  </ul>
</div>

</span><span><block class="linux windows mac ios">

</block></span><h2><a class="anchor" name="running-your-app-on-ios-devices"></a>Running your app on iOS devices <a class="hash-link" href="docs/running-on-device.html#running-your-app-on-ios-devices">#</a></h2><span><block class="linux windows mac android">

</block></span><h2><a class="anchor" name="running-your-app-on-android-devices"></a>Running your app on Android devices <a class="hash-link" href="docs/running-on-device.html#running-your-app-on-android-devices">#</a></h2><span><block class="linux windows mac ios android">

</block></span><span><div class="toggler">
<span>Development OS:</span>
<a href="javascript:void(0);" class="button-mac" onclick="displayTab('os', 'mac')">macOS</a>
<a href="javascript:void(0);" class="button-linux" onclick="displayTab('os', 'linux')">Linux</a>
<a href="javascript:void(0);" class="button-windows" onclick="displayTab('os', 'windows')">Windows</a>
</div>

</span><span><block class="linux windows ios">

</block></span><p>A Mac is required in order to build your app for iOS devices. Alternatively, you can refer to the <a href="docs/getting-started.html" target="_blank">Quick Start instructions</a> to learn how to build your app using Create React Native App, which will allow you to run your app using the Expo client app.</p><span><block class="mac ios">

</block></span><h3><a class="anchor" name="1-plug-in-your-device-via-usb"></a>1. Plug in your device via USB <a class="hash-link" href="docs/running-on-device.html#1-plug-in-your-device-via-usb">#</a></h3><p>Connect your iOS device to your Mac using a USB to Lightning cable. Navigate to the <code>ios</code> folder in your project, then open the <code>.xcodeproj</code> file within it using Xcode.</p><p>If this is your first time running an app on your iOS device, you may need to register your device for development. Open the <strong>Product</strong> menu from Xcode's menubar, then go to <strong>Destination</strong>. Look for and select your device from the list. Xcode will then register your device for development.</p><h3><a class="anchor" name="2-configure-code-signing"></a>2. Configure code signing <a class="hash-link" href="docs/running-on-device.html#2-configure-code-signing">#</a></h3><p>Register for an <a href="https://developer.apple.com/" target="_blank">Apple developer account</a> if you don't have one yet.</p><p>Select your project in the Xcode Project Navigator, then select your main target (it should share the same name as your project). Look for the "General" tab. Go to "Signing" and make sure your Apple developer account or team is selected under the Team dropdown.</p><p><img src="img/RunningOnDeviceCodeSigning.png" alt=""></p><p>Repeat this step for the Tests target in your project.</p><h3><a class="anchor" name="3-build-and-run-your-app"></a>3. Build and Run your app <a class="hash-link" href="docs/running-on-device.html#3-build-and-run-your-app">#</a></h3><p>If everything is set up correctly, your device will be listed as the build target in the Xcode toolbar, and it will also appear in the Devices pane (<code>⇧⌘2</code>). You can now press the <strong>Build and run</strong> button (<code>⌘R</code>) or select <strong>Run</strong> from the <strong>Product</strong> menu. Your app will launch on your device shortly.</p><p><img src="img/RunningOnDeviceReady.png" alt=""></p><blockquote><p>If you run into any issues, please take a look at Apple's <a href="https://developer.apple.com/library/content/documentation/IDEs/Conceptual/AppDistributionGuide/LaunchingYourApponDevices/LaunchingYourApponDevices.html#//apple_ref/doc/uid/TP40012582-CH27-SW4" target="_blank">Launching Your App on a Device</a> docs.</p></blockquote><span><block class="mac windows linux android">

</block></span><h3><a class="anchor" name="1-enable-debugging-over-usb"></a>1. Enable Debugging over USB <a class="hash-link" href="docs/running-on-device.html#1-enable-debugging-over-usb">#</a></h3><p>Most Android devices can only install and run apps downloaded from Google Play, by default. You will need to enable USB Debugging on your device in order to install your app during development.</p><p>To enable USB debugging on your device, you will first need to enable the "Developer options" menu by going to <strong>Settings</strong> → <strong>About phone</strong> and then tapping the <code>Build number</code> row at the bottom seven times. You can then go back to <strong>Settings</strong> → <strong>Developer options</strong> to enable "USB debugging".</p><h3><a class="anchor" name="2-plug-in-your-device-via-usb"></a>2. Plug in your device via USB <a class="hash-link" href="docs/running-on-device.html#2-plug-in-your-device-via-usb">#</a></h3><p>Let's now set up an Android device to run our React Native projects. Go ahead and plug in your device via USB to your development machine.</p><span><block class="linux android">

</block></span><p>Next, check the manufacturer code by using <code>lsusb</code> (on mac, you must first <a href="https://github.com/jlhonora/lsusb" target="_blank">install lsusb</a>). <code>lsusb</code> should output something like this:</p><div class="prism language-bash">$ lsusb
Bus <span class="token number">002</span> Device <span class="token number">002</span><span class="token punctuation">:</span> ID <span class="token number">8087</span><span class="token punctuation">:</span><span class="token number">0024</span> Intel Corp<span class="token punctuation">.</span> Integrated Rate Matching Hub
Bus <span class="token number">002</span> Device <span class="token number">001</span><span class="token punctuation">:</span> ID 1d6b<span class="token punctuation">:</span><span class="token number">0002</span> Linux Foundation <span class="token number">2.0</span> root hub
Bus <span class="token number">001</span> Device <span class="token number">003</span><span class="token punctuation">:</span> ID 22b8<span class="token punctuation">:</span><span class="token number">2e76</span> Motorola PCS
Bus <span class="token number">001</span> Device <span class="token number">002</span><span class="token punctuation">:</span> ID <span class="token number">8087</span><span class="token punctuation">:</span><span class="token number">0024</span> Intel Corp<span class="token punctuation">.</span> Integrated Rate Matching Hub
Bus <span class="token number">001</span> Device <span class="token number">001</span><span class="token punctuation">:</span> ID 1d6b<span class="token punctuation">:</span><span class="token number">0002</span> Linux Foundation <span class="token number">2.0</span> root hub
Bus <span class="token number">004</span> Device <span class="token number">001</span><span class="token punctuation">:</span> ID 1d6b<span class="token punctuation">:</span><span class="token number">0003</span> Linux Foundation <span class="token number">3.0</span> root hub
Bus <span class="token number">003</span> Device <span class="token number">001</span><span class="token punctuation">:</span> ID 1d6b<span class="token punctuation">:</span><span class="token number">0002</span> Linux Foundation <span class="token number">2.0</span> root hub</div><p>These lines represent the USB devices currently connected to your machine.</p><p>You want the line that represents your phone. If you're in doubt, try unplugging your phone and running the command again:</p><div class="prism language-bash">$ lsusb
Bus <span class="token number">002</span> Device <span class="token number">002</span><span class="token punctuation">:</span> ID <span class="token number">8087</span><span class="token punctuation">:</span><span class="token number">0024</span> Intel Corp<span class="token punctuation">.</span> Integrated Rate Matching Hub
Bus <span class="token number">002</span> Device <span class="token number">001</span><span class="token punctuation">:</span> ID 1d6b<span class="token punctuation">:</span><span class="token number">0002</span> Linux Foundation <span class="token number">2.0</span> root hub
Bus <span class="token number">001</span> Device <span class="token number">002</span><span class="token punctuation">:</span> ID <span class="token number">8087</span><span class="token punctuation">:</span><span class="token number">0024</span> Intel Corp<span class="token punctuation">.</span> Integrated Rate Matching Hub
Bus <span class="token number">001</span> Device <span class="token number">001</span><span class="token punctuation">:</span> ID 1d6b<span class="token punctuation">:</span><span class="token number">0002</span> Linux Foundation <span class="token number">2.0</span> root hub
Bus <span class="token number">004</span> Device <span class="token number">001</span><span class="token punctuation">:</span> ID 1d6b<span class="token punctuation">:</span><span class="token number">0003</span> Linux Foundation <span class="token number">3.0</span> root hub
Bus <span class="token number">003</span> Device <span class="token number">001</span><span class="token punctuation">:</span> ID 1d6b<span class="token punctuation">:</span><span class="token number">0002</span> Linux Foundation <span class="token number">2.0</span> root hub</div><p>You'll see that after removing the phone, the line which has the phone model ("Motorola PCS" in this case) disappeared from the list. This is the line that we care about.</p><p><code>Bus 001 Device 003: ID 22b8:2e76 Motorola PCS</code></p><p>From the above line, you want to grab the first four digits from the device ID:</p><p><code>22b8:2e76</code></p><p>In this case, it's <code>22b8</code>. That's the identifier for Motorola.</p><p>You'll need to input this into your udev rules in order to get up and running:</p><div class="prism language-sh">echo SUBSYSTEM<span class="token operator">==</span><span class="token string">"usb"</span><span class="token punctuation">,</span> ATTR<span class="token punctuation">{</span>idVendor<span class="token punctuation">}</span><span class="token operator">==</span><span class="token string">"22b8"</span><span class="token punctuation">,</span> MODE<span class="token operator">=</span><span class="token string">"0666"</span><span class="token punctuation">,</span> GROUP<span class="token operator">=</span><span class="token string">"plugdev"</span> <span class="token operator">|</span> sudo tee <span class="token operator">/</span>etc<span class="token operator">/</span>udev<span class="token operator">/</span>rules<span class="token punctuation">.</span>d<span class="token operator">/</span><span class="token number">51</span><span class="token operator">-</span>android<span class="token operator">-</span>usb<span class="token punctuation">.</span>rules</div><p>Make sure that you replace <code>22b8</code> with the identifier you get in the above command.</p><span><block class="mac windows linux android">

</block></span><p>Now check that your device is properly connecting to ADB, the Android Debug Bridge, by running <code>adb devices</code>.</p><div class="prism language-javascript">$ adb devices
List <span class="token keyword">of</span> devices attached
emulator<span class="token number">-5554</span> offline   # Google emulator
14ed2fcc device         # Physical device</div><p>Seeing <code>device</code> in the right column means the device is connected. You must have <strong>only one device connected</strong> at a time.</p><h3><a class="anchor" name="3-run-your-app"></a>3. Run your app <a class="hash-link" href="docs/running-on-device.html#3-run-your-app">#</a></h3><p>Type the following in your command prompt to install and launch your app on the device:</p><div class="prism language-javascript">$ react<span class="token operator">-</span>native run<span class="token operator">-</span>android</div><blockquote><p>If you get a "bridge configuration isn't available" error, see <a href="docs/running-on-device.html#method-1-using-adb-reverse-recommended" target="_blank">Using adb reverse</a>.</p><p>Hint</p><p>You can also use the <code>React Native CLI</code> to generate and run a <code>Release</code> build (e.g. <code>react-native run-android --variant=release</code>).</p></blockquote><span><block class="mac windows linux android ios">

</block></span><span><block class="mac ios">

</block></span><h2><a class="anchor" name="connecting-to-the-development-server"></a>Connecting to the development server <a class="hash-link" href="docs/running-on-device.html#connecting-to-the-development-server">#</a></h2><p>You can also iterate quickly on a device using the development server. You only have to be on the same Wi-Fi network as your computer. Shake your device to open the <a href="docs/debugging.html#accessing-the-in-app-developer-menu" target="_blank">Developer menu</a>, then enable Live Reload. Your app will reload whenever your JavaScript code has changed.</p><p><img src="img/DeveloperMenu.png" alt=""></p><blockquote><p>If you have any issues, ensure that your Mac and device are on the same network and can reach each other. Many open wireless networks with captive portals are configured to prevent devices from reaching other devices on the network. You may use your device's Personal Hotspot feature in this case.</p></blockquote><span><block class="mac windows linux android">

</block></span><h2><a class="anchor" name="connecting-to-the-development-server"></a>Connecting to the development server <a class="hash-link" href="docs/running-on-device.html#connecting-to-the-development-server">#</a></h2><p>You can also iterate quickly on a device by connecting to the development server running on your development machine. There are several ways of accomplishing this, depending on whether you have access to a USB cable or a Wi-Fi network.</p><h3><a class="anchor" name="method-1-using-adb-reverse-recommended"></a>Method 1: Using adb reverse (recommended) <a class="hash-link" href="docs/running-on-device.html#method-1-using-adb-reverse-recommended">#</a></h3><span><block class="mac windows linux android">

</block></span><p>You can use this method if your device is running Android 5.0 (Lollipop) or newer, it has USB debugging enabled, and it is connected via USB to your development machine.</p><span><block class="mac windows linux android">

</block></span><p>Run the following in a command prompt:</p><div class="prism language-javascript">$ adb reverse tcp<span class="token punctuation">:</span><span class="token number">8081</span> tcp<span class="token punctuation">:</span><span class="token number">8081</span></div><p>You can now enable Live reloading from the <a href="docs/debugging.html#accessing-the-in-app-developer-menu" target="_blank">Developer menu</a>. Your app will reload whenever your JavaScript code has changed.</p><h3><a class="anchor" name="method-2-connect-via-wi-fi"></a>Method 2: Connect via Wi-Fi <a class="hash-link" href="docs/running-on-device.html#method-2-connect-via-wi-fi">#</a></h3><p>You can also connect to the development server over Wi-Fi. You'll first need to install the app on your device using a USB cable, but once that has been done you can debug wirelessly by following these instructions. You'll need your development machine's current IP address before proceeding.</p><span><block class="mac android">

</block></span><p>You can find the IP address in <strong>System Preferences</strong> → <strong>Network</strong>.</p><span><block class="windows android">

</block></span><p>Open the command prompt and type <code>ipconfig</code> to find your machine's IP address (<a href="http://windows.microsoft.com/en-us/windows/using-command-line-tools-networking-information" target="_blank">more info</a>).</p><span><block class="linux android">

</block></span><p>Open a terminal and type <code>/sbin/ifconfig</code> to find your machine's IP address.</p><span><block class="mac windows linux android">

</block></span><ol><li>Make sure your laptop and your phone are on the <strong>same</strong> Wi-Fi network.</li><li>Open your React Native app on your device.</li><li>You'll see a <a href="docs/debugging.html#in-app-errors-and-warnings" target="_blank">red screen with an error</a>. This is OK. The following steps will fix that.</li><li>Open the in-app <a href="docs/debugging.html#accessing-the-in-app-developer-menu" target="_blank">Developer menu</a>.</li><li>Go to <strong>Dev Settings</strong> → <strong>Debug server host for device</strong>.</li><li>Type in your machine's IP address and the port of the local dev server (e.g. 10.0.1.1:8081).</li><li>Go back to the <strong>Developer menu</strong> and select <strong>Reload JS</strong>.</li></ol><p>You can now enable Live reloading from the <a href="docs/debugging.html#accessing-the-in-app-developer-menu" target="_blank">Developer menu</a>. Your app will reload whenever your JavaScript code has changed.</p><span><block class="mac ios">

</block></span><h2><a class="anchor" name="building-your-app-for-production"></a>Building your app for production <a class="hash-link" href="docs/running-on-device.html#building-your-app-for-production">#</a></h2><p>You have built a great app using React Native, and you are now itching to release it in the App Store. The process is the same as any other native iOS app, with some additional considerations to take into account.</p><h3><a class="anchor" name="1-enable-app-transport-security"></a>1. Enable App Transport Security <a class="hash-link" href="docs/running-on-device.html#1-enable-app-transport-security">#</a></h3><p>App Transport Security is a security feature introduced in iOS 9 that rejects all HTTP requests that are not sent over HTTPS. This can result in HTTP traffic being blocked, including the developer React Native server. ATS is disabled for <code>localhost</code> by default in React Native projects in order to make development easier.</p><p>You should re-enable ATS prior to building your app for production by removing the <code>localhost</code> entry from the <code>NSExceptionDomains</code> dictionary in your <code>Info.plist</code> file in the <code>ios/</code> folder. You can also re-enable ATS from within Xcode by opening your target properties under the Info pane and editing the App Transport Security Settings entry.</p><blockquote><p>If your application needs to access HTTP resources on production, see <a href="http://ste.vn/2015/06/10/configuring-app-transport-security-ios-9-osx-10-11/" target="_blank">this post</a> to learn how to configure ATS on your project.</p></blockquote><h3><a class="anchor" name="2-configure-release-scheme"></a>2. Configure release scheme <a class="hash-link" href="docs/running-on-device.html#2-configure-release-scheme">#</a></h3><p>Building an app for distribution in the App Store requires using the <code>Release</code> scheme in Xcode. Apps built for <code>Release</code> will automatically disable the in-app Developer menu, which will prevent your users from inadvertently accessing the menu in production. It will also bundle the JavaScript locally, so you can put the app on a device and test whilst not connected to the computer.</p><p>To configure your app to be built using the <code>Release</code> scheme, go to <strong>Product</strong> → <strong>Scheme</strong> → <strong>Edit Scheme</strong>. Select the <strong>Run</strong> tab in the sidebar, then set the Build Configuration dropdown to <code>Release</code>.</p><p><img src="img/ConfigureReleaseScheme.png" alt=""></p><h3><a class="anchor" name="3-build-app-for-release"></a>3. Build app for release <a class="hash-link" href="docs/running-on-device.html#3-build-app-for-release">#</a></h3><p>You can now build your app for release by tapping <code>⌘B</code> or selecting <strong>Product</strong> → <strong>Build</strong> from the menu bar. Once built for release, you'll be able to distribute the app to beta testers and submit the app to the App Store.</p><blockquote><p>You can also use the <code>React Native CLI</code> to perform this operation using the option <code>--configuration</code> with the value <code>Release</code> (e.g. <code>react-native run-ios --configuration Release</code>).</p></blockquote><span><block class="mac windows linux android">

</block></span><h2><a class="anchor" name="building-your-app-for-production"></a>Building your app for production <a class="hash-link" href="docs/running-on-device.html#building-your-app-for-production">#</a></h2><p>You have built a great app using React Native, and you are now itching to release it in the Play Store. The process is the same as any other native Android app, with some additional considerations to take into account. Follow the guide for <a href="docs/signed-apk-android.html" target="_blank">generating a signed APK</a> to learn more.</p><span><script>
function displayTab(type, value) {
  var container = document.getElementsByTagName('block')[0].parentNode;
  container.className = 'display-' + type + '-' + value + ' ' +
    container.className.replace(RegExp('display-' + type + '-[a-z]+ ?'), '');
}
</script>
</span></div><div class="docs-prevnext"><a class="docs-prev" href="docs/integration-with-existing-apps.html#content">← Prev</a><a class="docs-next" href="docs/upgrading.html#content">Next →</a></div><p class="edit-page-block"><a target="_blank" href="https://github.com/facebook/react-native/blob/master/docs/RunningOnDevice.md">Improve this page</a> by sending a pull request!</p>