---
id: version-0.43-running-on-device
title: running-on-device
original_id: running-on-device
---
<a id="content"></a><h1><a class="anchor" name="running-on-device"></a>Running On Device <a class="hash-link" href="docs/running-on-device.html#running-on-device">#</a></h1><div><p>It's always a good idea to test your app on an actual device before releasing it to your users. This document will guide you through the necessary steps to run your React Native app on a device.</p><span><div class="toggler">
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

</span><span><block class="mac linux windows ios">

</block></span><h2><a class="anchor" name="setting-up-an-ios-device"></a>Setting up an iOS device <a class="hash-link" href="docs/running-on-device.html#setting-up-an-ios-device">#</a></h2><p>Installing an app on an iOS device requires a Mac, an Apple ID, and a USB cable.</p><span><block class="mac ios">

</block></span><p>Connect your device to your Mac via USB, then open Xcode. In the project navigator, choose your device from the Product &gt; Destination toolbar menu. Xcode will then register your device for development.</p><blockquote><p>If you run into any issues, please take a look at Apple's <a href="https://developer.apple.com/library/content/documentation/IDEs/Conceptual/AppDistributionGuide/LaunchingYourApponDevices/LaunchingYourApponDevices.html#//apple_ref/doc/uid/TP40012582-CH27-SW4" target="_blank">Launching Your App on a Device docs</a>.</p></blockquote><p>Finally, select your phone as the build target and press <strong>Build and run</strong>.</p><span><block class="mac windows linux android">

</block></span><h2><a class="anchor" name="setting-up-an-android-device"></a>Setting up an Android device <a class="hash-link" href="docs/running-on-device.html#setting-up-an-android-device">#</a></h2><p>Running an Android app on a device requires a Mac or PC and a USB cable.</p><h3><a class="anchor" name="1-enable-debugging-over-usb"></a>1. Enable Debugging over USB <a class="hash-link" href="docs/running-on-device.html#1-enable-debugging-over-usb">#</a></h3><p>Most Android devices can only install and run apps downloaded from Google Play, by default. You will need to enable USB Debugging on your device in order to install your app during development.</p><p>To enable USB debugging on your device, you will first need to enable the "Developer options" menu by going to <strong>Settings</strong> → <strong>About phone</strong> and then tapping the <code>Build number</code> row at the bottom seven times. You can then go back to <strong>Settings</strong> → <strong>Developer options</strong> to enable "USB debugging".</p><h3><a class="anchor" name="2-plug-in-your-device-via-usb"></a>2. Plug in your device via USB <a class="hash-link" href="docs/running-on-device.html#2-plug-in-your-device-via-usb">#</a></h3><p>Let's now set up an Android device to run our React Native projects. Go ahead and plug in your device via USB to your development machine.</p><span><block class="linux android">

</block></span><p>Next, check the manufacturer code by using <code>lsusb</code> (on mac, you must first <a href="https://github.com/jlhonora/lsusb" target="_blank">install lsusb</a>). <code>lsusb</code> should output something like this:</p><div class="prism language-javascript">$ lsusb
Bus <span class="token number">002</span> Device <span class="token number">002</span><span class="token punctuation">:</span> ID <span class="token number">8087</span><span class="token punctuation">:</span><span class="token number">0024</span> Intel Corp<span class="token punctuation">.</span> Integrated Rate Matching Hub
Bus <span class="token number">002</span> Device <span class="token number">001</span><span class="token punctuation">:</span> ID 1d6b<span class="token punctuation">:</span><span class="token number">0002</span> Linux Foundation <span class="token number">2.0</span> root hub
Bus <span class="token number">001</span> Device <span class="token number">003</span><span class="token punctuation">:</span> ID 22b8<span class="token punctuation">:</span><span class="token number">2e76</span> Motorola PCS
Bus <span class="token number">001</span> Device <span class="token number">002</span><span class="token punctuation">:</span> ID <span class="token number">8087</span><span class="token punctuation">:</span><span class="token number">0024</span> Intel Corp<span class="token punctuation">.</span> Integrated Rate Matching Hub
Bus <span class="token number">001</span> Device <span class="token number">001</span><span class="token punctuation">:</span> ID 1d6b<span class="token punctuation">:</span><span class="token number">0002</span> Linux Foundation <span class="token number">2.0</span> root hub
Bus <span class="token number">004</span> Device <span class="token number">001</span><span class="token punctuation">:</span> ID 1d6b<span class="token punctuation">:</span><span class="token number">0003</span> Linux Foundation <span class="token number">3.0</span> root hub
Bus <span class="token number">003</span> Device <span class="token number">001</span><span class="token punctuation">:</span> ID 1d6b<span class="token punctuation">:</span><span class="token number">0002</span> Linux Foundation <span class="token number">2.0</span> root hub</div><p>These lines represent the USB devices currently connected to your machine.</p><p>You want the line that represents your phone. If you're in doubt, try unplugging your phone and running the command again:</p><div class="prism language-javascript">$ lsusb
Bus <span class="token number">002</span> Device <span class="token number">002</span><span class="token punctuation">:</span> ID <span class="token number">8087</span><span class="token punctuation">:</span><span class="token number">0024</span> Intel Corp<span class="token punctuation">.</span> Integrated Rate Matching Hub
Bus <span class="token number">002</span> Device <span class="token number">001</span><span class="token punctuation">:</span> ID 1d6b<span class="token punctuation">:</span><span class="token number">0002</span> Linux Foundation <span class="token number">2.0</span> root hub
Bus <span class="token number">001</span> Device <span class="token number">002</span><span class="token punctuation">:</span> ID <span class="token number">8087</span><span class="token punctuation">:</span><span class="token number">0024</span> Intel Corp<span class="token punctuation">.</span> Integrated Rate Matching Hub
Bus <span class="token number">001</span> Device <span class="token number">001</span><span class="token punctuation">:</span> ID 1d6b<span class="token punctuation">:</span><span class="token number">0002</span> Linux Foundation <span class="token number">2.0</span> root hub
Bus <span class="token number">004</span> Device <span class="token number">001</span><span class="token punctuation">:</span> ID 1d6b<span class="token punctuation">:</span><span class="token number">0003</span> Linux Foundation <span class="token number">3.0</span> root hub
Bus <span class="token number">003</span> Device <span class="token number">001</span><span class="token punctuation">:</span> ID 1d6b<span class="token punctuation">:</span><span class="token number">0002</span> Linux Foundation <span class="token number">2.0</span> root hub</div><p>You'll see that after removing the phone, the line which has the phone model ("Motorola PCS" in this case) disappeared from the list. This is the line that we care about.</p><p><code>Bus 001 Device 003: ID 22b8:2e76 Motorola PCS</code></p><p>From the above line, you want to grab the first four digits from the device ID:</p><p><code>22b8:2e76</code></p><p>In this case, it's <code>22b8</code>. That's the identifier for Motorola.</p><p>You'll need to input this into your udev rules in order to get up and running:</p><div class="prism language-javascript">echo SUBSYSTEM<span class="token operator">==</span><span class="token string">"usb"</span><span class="token punctuation">,</span> ATTR<span class="token punctuation">{</span>idVendor<span class="token punctuation">}</span><span class="token operator">==</span><span class="token string">"22b8"</span><span class="token punctuation">,</span> MODE<span class="token operator">=</span><span class="token string">"0666"</span><span class="token punctuation">,</span> GROUP<span class="token operator">=</span><span class="token string">"plugdev"</span> <span class="token operator">|</span> sudo tee <span class="token operator">/</span>etc<span class="token operator">/</span>udev<span class="token operator">/</span>rules<span class="token punctuation">.</span>d<span class="token operator">/</span><span class="token number">51</span><span class="token operator">-</span>android<span class="token operator">-</span>usb<span class="token punctuation">.</span>rules</div><p>Make sure that you replace <code>22b8</code> with the identifier you get in the above command.</p><span><block class="mac windows linux android">

</block></span><p>Now check that your device is properly connecting to ADB, the Android Debug Bridge, by running <code>adb devices</code>.</p><div class="prism language-javascript">$ adb devices
List of devices attached
emulator<span class="token number">-5554</span> offline   # Google emulator
14ed2fcc device         # Physical device</div><p>Seeing <code>device</code> in the right column means the device is connected. You must have <strong>only one device connected</strong> at a time.</p><h3><a class="anchor" name="3-run-your-app"></a>3. Run your app <a class="hash-link" href="docs/running-on-device.html#3-run-your-app">#</a></h3><p>Type the following in your command prompt to install and launch your app on the device:</p><div class="prism language-javascript">$ react<span class="token operator">-</span>native run<span class="token operator">-</span>android</div><blockquote><p>If you get a "bridge configuration isn't available" error, see <a href="docs/running-on-device.html#method-1-using-adb-reverse-recommended" target="_blank">Using adb reverse</a>.</p><p>Hint</p><p>You can also use the <code>React Native CLI</code> to generate and run a <code>Release</code> build (e.g. <code>react-native run-android --variant=release</code>).</p></blockquote><span><block class="mac windows linux android ios">

</block></span><h2><a class="anchor" name="connecting-to-the-development-server"></a>Connecting to the development server <a class="hash-link" href="docs/running-on-device.html#connecting-to-the-development-server">#</a></h2><span><block class="mac ios">

</block></span><p>You can also iterate quickly on a device using the development server. You only have to be on the same Wi-Fi network as your computer. Shake the device to open the <a href="docs/debugging.html#accessing-the-in-app-developer-menu" target="_blank">Developer menu</a>.</p><span><block class="mac windows linux android">

</block></span><p>You can also iterate quickly on a device by connecting to the development server running on your development machine. There are several ways of accomplishing this, depending on whether you have access to a USB cable or a Wi-Fi network.</p><h3><a class="anchor" name="method-1-using-adb-reverse-recommended"></a>Method 1: Using adb reverse (recommended) <a class="hash-link" href="docs/running-on-device.html#method-1-using-adb-reverse-recommended">#</a></h3><span><block class="mac windows linux android">

</block></span><p>You can use this method if your device is running Android 5.0 (Lollipop), it has USB debugging enabled, and it is connected via USB to your development machine.</p><span><block class="mac windows linux android">

</block></span><p>Run the following in a command prompt:</p><div class="prism language-javascript">$ adb reverse tcp<span class="token punctuation">:</span><span class="token number">8081</span> tcp<span class="token punctuation">:</span><span class="token number">8081</span></div><p>You can now use <code>Reload JS</code> from the React Native in-app Developer menu without any additional configuration.</p><h3><a class="anchor" name="method-2-connect-via-wi-fi"></a>Method 2: Connect via Wi-Fi <a class="hash-link" href="docs/running-on-device.html#method-2-connect-via-wi-fi">#</a></h3><p>You can also connect to the development server over Wi-Fi. You'll first need to install the app on your device using a USB cable, but once that has been done you can debug wirelessly by following these instructions. You'll need your development machine's current IP address before proceeding.</p><span><block class="mac android">

</block></span><p>You can find the IP address in <strong>System Preferences</strong> → <strong>Network</strong>.</p><span><block class="windows android">

</block></span><p>Open the command prompt and type <code>ipconfig</code> to find your machine's IP address (<a href="http://windows.microsoft.com/en-us/windows/using-command-line-tools-networking-information" target="_blank">more info</a>).</p><span><block class="linux android">

</block></span><p>Open a terminal and type <code>/sbin/ifconfig</code> to find your machine's IP address.</p><span><block class="mac windows linux android">

</block></span><ol><li>Make sure your laptop and your phone are on the <strong>same</strong> Wi-Fi network.</li><li>Open your React Native app on your device.</li><li>You'll see a <a href="docs/debugging.html#in-app-errors-and-warnings" target="_blank">red screen with an error</a>. This is OK. The following steps will fix that.</li><li>Open the in-app <a href="docs/debugging.html#accessing-the-in-app-developer-menu" target="_blank">Developer menu</a>.</li><li>Go to <strong>Dev Settings</strong> → <strong>Debug server host for device</strong>.</li><li>Type in your machine's IP address and the port of the local dev server (e.g. 10.0.1.1:8081).</li><li>Go back to the <strong>Developer menu</strong> and select <strong>Reload JS</strong>.</li></ol><span><block class="mac ios">

</block></span><h2><a class="anchor" name="building-your-app-for-production"></a>Building your app for production <a class="hash-link" href="docs/running-on-device.html#building-your-app-for-production">#</a></h2><p>You have built a great app using React Native, and you are now itching to release it in the App Store. The process is the same as any other native iOS app, with some additional considerations to take into account.</p><p>Building an app for distribution in the App Store requires using the <code>Release</code> scheme in Xcode. To do this, go to <strong>Product</strong> → <strong>Scheme</strong> → <strong>Edit Scheme (cmd + &lt;)</strong>, make sure you're in the <strong>Run</strong> tab from the side, and set the Build Configuration dropdown to <code>Release</code>.</p><p>Apps built for <code>Release</code> will automatically disable the in-app Developer menu, which will prevent your users from inadvertently accessing the menu in production. It will also load the JavaScript locally, so you can put the app on a device and test whilst not connected to the computer.</p><blockquote><p>Hint</p><p>You can also use the <code>React Native CLI</code> to perform this operation using the option <code>--configuration</code> with the value <code>Release</code> (e.g. <code>react-native run-ios --configuration Release</code>).</p></blockquote><p>Once built for release, you'll be able to distribute the app to beta testers and submit the app to the App Store.</p><h3><a class="anchor" name="app-transport-security"></a>App Transport Security <a class="hash-link" href="docs/running-on-device.html#app-transport-security">#</a></h3><p>App Transport Security is a security feature, added in iOS 9, that rejects all HTTP requests that are not sent over HTTPS. This can result in HTTP traffic being blocked, including the developer React Native server.</p><p>ATS is disabled by default in projects generated using the React Native CLI in order to make development easier. You should re-enable ATS prior to building your app for production by removing the <code>NSAllowsArbitraryLoads</code> entry from your <code>Info.plist</code> file in the <code>ios/</code> folder.</p><p>To learn more about how to configure ATS on your own Xcode projects, see <a href="http://ste.vn/2015/06/10/configuring-app-transport-security-ios-9-osx-10-11/" target="_blank">this post on ATS</a>.</p><span><script>
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
</span></div><div class="docs-prevnext"><a class="docs-prev" href="docs/testing.html#content">← Prev</a><a class="docs-next" href="docs/javascript-environment.html#content">Next →</a></div><p class="edit-page-block">You can <a target="_blank" href="https://github.com/facebook/react-native/blob/master/docs/RunningOnDevice.md">edit the content above on GitHub</a> and send us a pull request!</p>