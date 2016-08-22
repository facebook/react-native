/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * @flow
 */
'use strict';

const ReactNative = require('react-native');

export type UIExplorerExample = {
  key: string;
  module: Object;
  tvosSupported: boolean;
};

const ComponentExamples: Array<UIExplorerExample> = [
  {
    key: 'ActivityIndicatorExample',
    module: require('./ActivityIndicatorExample'),
    tvosSupported: true
  },
  {
    key: 'DatePickerIOSExample',
    module: require('./DatePickerIOSExample'),
    tvosSupported: false
  },
  {
    key: 'ImageExample',
    module: require('./ImageExample'),
    tvosSupported: true
  },
  {
    key: 'KeyboardAvoidingViewExample',
    module: require('./KeyboardAvoidingViewExample'),
  },
  {
    key: 'LayoutEventsExample',
    module: require('./LayoutEventsExample'),
    tvosSupported: true
  },
  {
    key: 'ListViewExample',
    module: require('./ListViewExample'),
    tvosSupported: true
  },
  {
    key: 'ListViewGridLayoutExample',
    module: require('./ListViewGridLayoutExample'),
    tvosSupported: true
  },
  {
    key: 'ListViewPagingExample',
    module: require('./ListViewPagingExample'),
    tvosSupported: true
  },
  {
     key: 'MapViewExample',
     module: require('./MapViewExample'),
    tvosSupported: true
  },
  {
    key: 'ModalExample',
    module: require('./ModalExample'),
    tvosSupported: true
  },
  {
    key: 'NavigatorExample',
    module: require('./Navigator/NavigatorExample'),
    tvosSupported: true
  },
  {
    key: 'NavigatorIOSColorsExample',
    module: require('./NavigatorIOSColorsExample'),
    tvosSupported: true
  },
  {
    key: 'NavigatorIOSExample',
    module: require('./NavigatorIOSExample'),
    tvosSupported: true
  },
  {
    key: 'PickerExample',
    module: require('./PickerExample'),
    tvosSupported: false
  },
  {
    key: 'PickerIOSExample',
    module: require('./PickerIOSExample'),
    tvosSupported: false
  },
  {
    key: 'ProgressViewIOSExample',
    module: require('./ProgressViewIOSExample'),
    tvosSupported: true
  },
  {
    key: 'RefreshControlExample',
    module: require('./RefreshControlExample'),
    tvosSupported: false
  },
  {
    key: 'ScrollViewExample',
    module: require('./ScrollViewExample'),
    tvosSupported: false
  },
  {
    key: 'SegmentedControlIOSExample',
    module: require('./SegmentedControlIOSExample'),
    tvosSupported: true
  },
  {
    key: 'SliderExample',
    module: require('./SliderExample'),
    tvosSupported: false
  },
  {
    key: 'StatusBarExample',
    module: require('./StatusBarExample'),
    tvosSupported: false
  },
  {
    key: 'SwipeableListViewExample',
    module: require('./SwipeableListViewExample')
  },
  {
    key: 'SwitchExample',
    module: require('./SwitchExample'),
    tvosSupported: false
  },
  {
    key: 'TabBarIOSExample',
    module: require('./TabBarIOSExample'),
    tvosSupported: true
  },
  {
    key: 'TextExample',
    module: require('./TextExample.ios'),
    tvosSupported: true
  },
  {
    key: 'TextInputExample',
    module: require('./TextInputExample.ios'),
    tvosSupported: true
  },
  {
    key: 'TouchableExample',
    module: require('./TouchableExample'),
    tvosSupported: false
  },
  {
    key: 'TransparentHitTestExample',
    module: require('./TransparentHitTestExample'),
    tvosSupported: false
  },
  {
    key: 'ViewExample',
    module: require('./ViewExample'),
    tvosSupported: true
  },
  {
    key: 'WebViewExample',
    module: require('./WebViewExample'),
    tvosSupported: false
  },
];

const APIExamples: Array<UIExplorerExample> = [
  {
    key: 'AccessibilityIOSExample',
    module: require('./AccessibilityIOSExample'),
    tvosSupported: true
  },
  {
    key: 'ActionSheetIOSExample',
    module: require('./ActionSheetIOSExample'),
    tvosSupported: false
  },
  {
    key: 'AdSupportIOSExample',
    module: require('./AdSupportIOSExample'),
    tvosSupported: false
  },
  {
    key: 'AlertExample',
    module: require('./AlertExample').AlertExample,
    tvosSupported: true
  },
  {
    key: 'AlertIOSExample',
    module: require('./AlertIOSExample'),
    tvosSupported: true
  },
  {
    key: 'AnimatedExample',
    module: require('./AnimatedExample'),
    tvosSupported: true
  },
  {
    key: 'AnExApp',
    module: require('./AnimatedGratuitousApp/AnExApp'),
    tvosSupported: true
  },
  {
    key: 'AppStateExample',
    module: require('./AppStateExample'),
    tvosSupported: true
  },
  {
    key: 'AsyncStorageExample',
    module: require('./AsyncStorageExample'),
    tvosSupported: false
  },
  {
    key: 'BorderExample',
    module: require('./BorderExample'),
    tvosSupported: true
  },
  {
    key: 'BoxShadowExample',
    module: require('./BoxShadowExample'),
    tvosSupported: true
  },
  {
    key: 'CameraRollExample',
    module: require('./CameraRollExample'),
    tvosSupported: false
  },
  {
    key: 'ClipboardExample',
    module: require('./ClipboardExample'),
    tvosSupported: false
  },
  {
    key: 'GeolocationExample',
    module: require('./GeolocationExample'),
    tvosSupported: true
  },
  {
    key: 'ImageEditingExample',
    module: require('./ImageEditingExample'),
    tvosSupported: false
  },
  {
    key: 'LayoutAnimationExample',
    module: require('./LayoutAnimationExample'),
    tvosSupported: true
  },
  {
    key: 'LayoutExample',
    module: require('./LayoutExample'),
    tvosSupported: true
  },
  {
    key: 'LinkingExample',
    module: require('./LinkingExample'),
    tvosSupported: true
  },
  {
    key: 'NativeAnimationsExample',
    module: require('./NativeAnimationsExample'),
  },
  {
    key: 'NavigationExperimentalExample',
    module: require('./NavigationExperimental/NavigationExperimentalExample'),
    tvosSupported: true
  },
  {
    key: 'NetInfoExample',
    module: require('./NetInfoExample'),
    tvosSupported: true
  },
  {
    key: 'PanResponderExample',
    module: require('./PanResponderExample'),
    tvosSupported: false
  },
  {
    key: 'PointerEventsExample',
    module: require('./PointerEventsExample'),
    tvosSupported: false
  },
  {
    key: 'PushNotificationIOSExample',
    module: require('./PushNotificationIOSExample'),
    tvosSupported: false
  },
  {
    key: 'RCTRootViewIOSExample',
    module: require('./RCTRootViewIOSExample'),
    tvosSupported: true
  },
  {
    key: 'RTLExample',
    module: require('./RTLExample'),
  },
  {
    key: 'ShareExample',
    module: require('./ShareExample'),
  },
  {
    key: 'SnapshotExample',
    module: require('./SnapshotExample'),
    tvosSupported: false
  },
  {
    key: 'TimerExample',
    module: require('./TimerExample'),
    tvosSupported: true
  },
  {
    key: 'TransformExample',
    module: require('./TransformExample'),
    tvosSupported: true
  },
  {
    key: 'VibrationExample',
    module: require('./VibrationExample'),
    tvosSupported: false
  },
  {
    key: 'WebSocketExample',
    module: require('./WebSocketExample'),
    tvosSupported: true
  },
  {
    key: 'XHRExample',
    module: require('./XHRExample.ios'),
    tvosSupported: false
  },
];

const Modules = {};

APIExamples.concat(ComponentExamples).forEach(Example => {
  Modules[Example.key] = Example.module;
});

const UIExplorerList = {
  APIExamples,
  ComponentExamples,
  Modules,
};

module.exports = UIExplorerList;
