---
id: building-for-apple-tv
title: Building For Apple TV
layout: docs
category: Guides (Apple TV)
permalink: docs/building-for-apple-tv.html
banner: ejected
next: native-modules-android
previous: communication-ios
---

Apple TV support has been implemented with the intention of making existing React Native iOS applications "just work" on tvOS, with few or no changes needed in the JavaScript code for the applications.

The UIExplorer example project supports Apple TV; use the `UIExplorer-tvOS` build target to build for tvOS.

## Build changes

- *Native layer*: React Native Xcode projects all now have Apple TV build targets, with names ending in the string '-tvOS'.

- *react-native init*: New React Native projects created with `react-native init` will have Apple TV target automatically created in their XCode projects.

- *JavaScript layer*: Support for Apple TV has been added to `Platform.ios.js`.  You can check whether code is running on AppleTV by doing

```js
var Platform = require('Platform');
var running_on_apple_tv = Platform.isTVOS;
```

## Code changes

- *General support for tvOS*: Apple TV specific changes in native code are all wrapped by the TARGET_OS_TV define.  These include changes to suppress APIs that are not supported on tvOS (e.g. web views, sliders, switches, status bar, etc.), and changes to support user input from the TV remote or keyboard.

- *Common codebase*:  Since tvOS and iOS share most Objective-C and JavaScript code in common, most documentation for iOS applies equally to tvOS.

- *Access to touchable controls*: When running on Apple TV, the native view class is `RCTTVView`, which has additional methods to make use of the tvOS focus engine.  The `Touchable` mixin has code added to detect focus changes and use existing methods to style the components properly and initiate the proper actions when the view is selected using the TV remote, so `TouchableHighlight` and `TouchableOpacity` will "just work".  In particular:

  - `touchableHandleActivePressIn` will be executed when the touchable view goes into focus
  - `touchableHandleActivePressOut` will be executed when the touchable view goes out of focus
  - `touchableHandlePress` will be executed when the touchable view is actually selected by pressing the "select" button on the TV remote.

- *TV remote/keyboard input*: A new native class, `RCTTVRemoteHandler`, sets up gesture recognizers for TV remote events.  When TV remote events occur, this class fires notifications that are picked up by `RCTTVNavigationEventEmitter` (a subclass of `RCTEventEmitter`), that fires a JS event.  This event will be picked up by instances of the `TVEventHandler` JavaScript object.  Application code that needs to implement custom handling of TV remote events can create an instance of `TVEventHandler` and listen for these events, as in the following code:

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

- *TV remote animations*: `RCTTVView` native code implements Apple-recommended parallax animations to help guide the eye as the user navigates through views.  The animations can be disabled or adjusted with new optional view properties. 

- *Back navigation with the TV remote menu button*: The `BackHandler` component, originally written to support the Android back button, now also supports back navigation on the Apple TV using the menu button on the TV remote.

- *Known issues*:

  - [ListView scrolling](https://github.com/facebook/react-native/issues/12793).  The issue can be easily worked around by setting `removeClippedSubviews` to false in ListView and similar components.  For more discussion of this issue, see [this PR](https://github.com/facebook/react-native/pull/12944).


