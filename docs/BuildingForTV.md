---
id: building-for-tv
title: Building For TV Devices
layout: docs
category: Guides
permalink: docs/building-for-tv.html
banner: ejected
next: upgrading
previous: running-on-device
---

<style>
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
  .display-platform-ios .toggler .button-ios,
  .display-platform-android .toggler .button-android {
    background-color: #05A5D1;
    color: white;
  }
  block { display: none; }
  .display-platform-ios .ios,
  .display-platform-android .android {
    display: block;
  }
</style>

TV devices support has been implemented with the intention of making existing React Native applications "just work" on Apple TV and Android TV, with few or no changes needed in the JavaScript code for the applications.

<div class="toggler">

  <ul role="tablist" >
    <li id="ios" class="button-ios" aria-selected="false" role="tab" tabindex="0" aria-controls="iostab" onclick="displayTab('platform', 'ios')">
      iOS
    </li>
    <li id="android" class="button-android" aria-selected="false" role="tab" tabindex="-1" aria-controls="androidtab" onclick="displayTab('platform', 'android')">
      Android
    </li>
  </ul>
</div>

<block class="ios" />

The RNTester app supports Apple TV; use the `RNTester-tvOS` build target to build for tvOS.

## Build changes

- *Native layer*: React Native Xcode projects all now have Apple TV build targets, with names ending in the string '-tvOS'.

- *react-native init*: New React Native projects created with `react-native init` will have Apple TV target automatically created in their XCode projects.

- *JavaScript layer*: Support for Apple TV has been added to `Platform.ios.js`.  You can check whether code is running on AppleTV by doing

```js
var Platform = require('Platform');
var running_on_tv = Platform.isTV;

// If you want to be more specific and only detect devices running tvOS (but no Android TV devices) you can use:
var running_on_apple_tv = Platform.isTVOS
```

<block class="android" />

## Build changes

- *Native layer*: To run React Native project on Android TV make sure to make the following changes to `AndroidManifest.xml`

```
  <!-- Add custom banner image to display as Android TV launcher icon -->
 <application
  ...
  android:banner="@drawable/tv_banner"
  >
    ...
    <intent-filter>
      ...
      <!-- Needed to properly create a launch intent when running on Android TV -->
      <category android:name="android.intent.category.LEANBACK_LAUNCHER"/>
    </intent-filter>
    ...
  </application>
```

- *JavaScript layer*: Support for Android TV has been added to `Platform.android.js`.  You can check whether code is running on Android TV by doing

```js
var Platform = require('Platform');
var running_on_android_tv = Platform.isTV;
```

<block class="ios android" />

## Code changes

<block class="ios" />

- *General support for tvOS*: Apple TV specific changes in native code are all wrapped by the TARGET_OS_TV define.  These include changes to suppress APIs that are not supported on tvOS (e.g. web views, sliders, switches, status bar, etc.), and changes to support user input from the TV remote or keyboard.

- *Common codebase*:  Since tvOS and iOS share most Objective-C and JavaScript code in common, most documentation for iOS applies equally to tvOS.

- *Access to touchable controls*: When running on Apple TV, the native view class is `RCTTVView`, which has additional methods to make use of the tvOS focus engine.  The `Touchable` mixin has code added to detect focus changes and use existing methods to style the components properly and initiate the proper actions when the view is selected using the TV remote, so `TouchableHighlight` and `TouchableOpacity` will "just work".  In particular:

  - `touchableHandleActivePressIn` will be executed when the touchable view goes into focus
  - `touchableHandleActivePressOut` will be executed when the touchable view goes out of focus
  - `touchableHandlePress` will be executed when the touchable view is actually selected by pressing the "select" button on the TV remote.

<block class="android" />

- *Access to touchable controls*: When running on Android TV the Android framework will automatically apply a directional navigation scheme based on relative position of focusable elements in your views. The `Touchable` mixin has code added to detect focus changes and use existing methods to style the components properly and initiate the proper actions when the view is selected using the TV remote, so `TouchableHighlight`, `TouchableOpacity` and `TouchableNativeFeedback` will "just work".  In particular:

  - `touchableHandleActivePressIn` will be executed when the touchable view goes into focus
  - `touchableHandleActivePressOut` will be executed when the touchable view goes out of focus
  - `touchableHandlePress` will be executed when the touchable view is actually selected by pressing the "select" button on the TV remote.

<block class="ios" />

- *TV remote/keyboard input*: A new native class, `RCTTVRemoteHandler`, sets up gesture recognizers for TV remote events.  When TV remote events occur, this class fires notifications that are picked up by `RCTTVNavigationEventEmitter` (a subclass of `RCTEventEmitter`), that fires a JS event.  This event will be picked up by instances of the `TVEventHandler` JavaScript object.  Application code that needs to implement custom handling of TV remote events can create an instance of `TVEventHandler` and listen for these events, as in the following code:

<block class="android">

- *TV remote/keyboard input*: A new native class, `ReactAndroidTVRootViewHelper`, sets up key events handlers for TV remote events.  When TV remote events occur, this class fires a JS event.  This event will be picked up by instances of the `TVEventHandler` JavaScript object.  Application code that needs to implement custom handling of TV remote events can create an instance of `TVEventHandler` and listen for these events, as in the following code:

<block class="ios android">

```js
var TVEventHandler = require('TVEventHandler');

.
.
.

class Game2048 extends React.Component {
  _tvEventHandler: any;

  _enableTVEventHandler() {
    this._tvEventHandler = new TVEventHandler();
    this._tvEventHandler.enable(this, function(cmp, evt) {
      if (evt && evt.eventType === 'right') {
        cmp.setState({board: cmp.state.board.move(2)});
      } else if(evt && evt.eventType === 'up') {
        cmp.setState({board: cmp.state.board.move(1)});
      } else if(evt && evt.eventType === 'left') {
        cmp.setState({board: cmp.state.board.move(0)});
      } else if(evt && evt.eventType === 'down') {
        cmp.setState({board: cmp.state.board.move(3)});
      } else if(evt && evt.eventType === 'playPause') {
        cmp.restartGame();
      }
    });
  }

  _disableTVEventHandler() {
    if (this._tvEventHandler) {
      this._tvEventHandler.disable();
      delete this._tvEventHandler;
    }
  }

  componentDidMount() {
    this._enableTVEventHandler();
  }

  componentWillUnmount() {
    this._disableTVEventHandler();
  }

```

<block class="ios" />

- *Dev Menu support*: On the simulator, cmd-D will bring up the developer menu, just like on iOS.  To bring it up on a real Apple TV device, make a long press on the play/pause button on the remote.  (Please do not shake the Apple TV device, that will not work :) )

- *TV remote animations*: `RCTTVView` native code implements Apple-recommended parallax animations to help guide the eye as the user navigates through views.  The animations can be disabled or adjusted with new optional view properties.

- *Back navigation with the TV remote menu button*: The `BackHandler` component, originally written to support the Android back button, now also supports back navigation on the Apple TV using the menu button on the TV remote.

- *TabBarIOS behavior*: The `TabBarIOS` component wraps the native `UITabBar` API, which works differently on Apple TV.  To avoid jittery rerendering of the tab bar in tvOS (see [this issue](https://github.com/facebook/react-native/issues/15081)), the selected tab bar item can only be set from Javascript on initial render, and is controlled after that by the user through native code.

<block class="android" />

- *Dev Menu support*: On the simulator, cmd-M will bring up the developer menu, just like on Android.  To bring it up on a real Android TV device, make a long press on the play/pause button on the remote.  (Please do not shake the Android TV device, that will not work :) )

<block class="ios" />

- *Known issues*:

  - [ListView scrolling](https://github.com/facebook/react-native/issues/12793).  The issue can be easily worked around by setting `removeClippedSubviews` to false in ListView and similar components.  For more discussion of this issue, see [this PR](https://github.com/facebook/react-native/pull/12944).

<block class="android" />

- *Known issues*:

  - `InputText` components do not work for now (i.e. they cannot receive focus).

<script>
  function displayTab(type, value) {
    var container = document.getElementsByTagName('block')[0].parentNode;
    container.className = 'display-' + type + '-' + value + ' ' +
      container.className.replace(RegExp('display-' + type + '-[a-z]+ ?'), '');
  }

  function convertBlocks() {
    // Convert <div>...<span><block /></span>...</div>
    // Into <div>...<block />...</div>
    var blocks = document.querySelectorAll('block');
    for (var i = 0; i < blocks.length; ++i) {
      var block = blocks[i];
      var span = blocks[i].parentNode;
      var container = span.parentNode;
      container.insertBefore(block, span);
      container.removeChild(span);
    }
    // Convert <div>...<block />content<block />...</div>
    // Into <div>...<block>content</block><block />...</div>
    blocks = document.querySelectorAll('block');
    for (var i = 0; i < blocks.length; ++i) {
      var block = blocks[i];
      while (
        block.nextSibling &&
        block.nextSibling.tagName !== 'BLOCK'
      ) {
        block.appendChild(block.nextSibling);
      }
    }
  }

  function guessPlatformAndOS() {
    if (!document.querySelector('block')) {
      return;
    }
  
    // If we are coming to the page with a hash in it (i.e. from a search, for example), try to get
    // us as close as possible to the correct platform and dev os using the hashtag and block walk up.
    var foundHash = false;
    if (
      window.location.hash !== '' &&
      window.location.hash !== 'content'
    ) {
      // content is default
      var hashLinks = document.querySelectorAll(
        'a.hash-link'
      );
      for (
        var i = 0;
        i < hashLinks.length && !foundHash;
        ++i
      ) {
        if (hashLinks[i].hash === window.location.hash) {
          var parent = hashLinks[i].parentElement;
          while (parent) {
            if (parent.tagName === 'BLOCK') {
              // Could be more than one target os and dev platform, but just choose some sort of order
              // of priority here.

              // Target Platform
              if (parent.className.indexOf('ios') > -1) {
                displayTab('platform', 'ios');
                foundHash = true;
              } else if (
                parent.className.indexOf('android') > -1
              ) {
                displayTab('platform', 'android');
                foundHash = true;
              } else {
                break;
              }
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
      displayTab('platform', isMac ? 'ios' : 'android');
    }
  }

  convertBlocks();
  guessPlatformAndOS();
</script>
