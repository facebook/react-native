/**
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

export type UIExplorerExample = {
  key: string;
  module: Object;
};

var ComponentExamples: Array<UIExplorerExample> = [
  {
    key: 'ActivityIndicatorIOSExample',
    module: require('./ActivityIndicatorIOSExample'),
  },
  {
    key: 'DatePickerIOSExample',
    module: require('./DatePickerIOSExample'),
  },
  {
    key: 'ImageExample',
    module: require('./ImageExample'),
  },
  {
    key: 'LayoutEventsExample',
    module: require('./LayoutEventsExample'),
  },
  {
    key: 'ListViewExample',
    module: require('./ListViewExample'),
  },
  {
    key: 'ListViewGridLayoutExample',
    module: require('./ListViewGridLayoutExample'),
  },
  {
    key: 'ListViewPagingExample',
    module: require('./ListViewPagingExample'),
  },
  {
     key: 'MapViewExample',
     module: require('./MapViewExample'),
  },
  {
    key: 'ModalExample',
    module: require('./ModalExample'),
  },
  {
    key: 'NavigatorExample',
    module: require('./Navigator/NavigatorExample'),
  },
  {
    key: 'NavigatorIOSColorsExample',
    module: require('./NavigatorIOSColorsExample'),
  },
  {
    key: 'NavigatorIOSExample',
    module: require('./NavigatorIOSExample'),
  },
  {
    key: 'PickerIOSExample',
    module: require('./PickerIOSExample'),
  },
  {
    key: 'ProgressViewIOSExample',
    module: require('./ProgressViewIOSExample'),
  },
  {
    key: 'RefreshControlExample',
    module: require('./RefreshControlExample'),
  },
  {
    key: 'ScrollViewExample',
    module: require('./ScrollViewExample'),
  },
  {
    key: 'SegmentedControlIOSExample',
    module: require('./SegmentedControlIOSExample'),
  },
  {
    key: 'SliderExample',
    module: require('./SliderExample'),
  },
  {
    key: 'StatusBarExample',
    module: require('./StatusBarExample'),
  },
  {
    key: 'SwitchExample',
    module: require('./SwitchExample'),
  },
  {
    key: 'TabBarIOSExample',
    module: require('./TabBarIOSExample'),
  },
  {
    key: 'TextExample',
    module: require('./TextExample.ios'),
  },
  {
    key: 'TextInputExample',
    module: require('./TextInputExample.ios'),
  },
  {
    key: 'TouchableExample',
    module: require('./TouchableExample'),
  },
  {
    key: 'TransparentHitTestExample',
    module: require('./TransparentHitTestExample'),
  },
  {
    key: 'ViewExample',
    module: require('./ViewExample'),
  },
  {
    key: 'WebViewExample',
    module: require('./WebViewExample'),
  },
];

var APIExamples: Array<UIExplorerExample> = [
  {
    key: 'AccessibilityIOSExample',
    module: require('./AccessibilityIOSExample'),
  },
  {
    key: 'ActionSheetIOSExample',
    module: require('./ActionSheetIOSExample'),
  },
  {
    key: 'AdSupportIOSExample',
    module: require('./AdSupportIOSExample'),
  },
  {
    key: 'AlertIOSExample',
    module: require('./AlertIOSExample'),
  },
  {
    key: 'AnimatedExample',
    module: require('./AnimatedExample'),
  },
  {
    key: 'AnExApp',
    module: require('./AnimatedGratuitousApp/AnExApp'),
  },
  {
    key: 'AppStateIOSExample',
    module: require('./AppStateIOSExample'),
  },
  {
    key: 'AppStateExample',
    module: require('./AppStateExample'),
  },
  {
    key: 'AsyncStorageExample',
    module: require('./AsyncStorageExample'),
  },
  {
    key: 'BorderExample',
    module: require('./BorderExample'),
  },
  {
    key: 'BoxShadowExample',
    module: require('./BoxShadowExample'),
  },
  {
    key: 'CameraRollExample',
    module: require('./CameraRollExample'),
  },
  {
    key: 'ClipboardExample',
    module: require('./ClipboardExample'),
  },
  {
    key: 'GeolocationExample',
    module: require('./GeolocationExample'),
  },
  {
    key: 'ImageEditingExample',
    module: require('./ImageEditingExample'),
  },
  {
    key: 'LayoutAnimationExample',
    module: require('./LayoutAnimationExample'),
  },
  {
    key: 'LayoutExample',
    module: require('./LayoutExample'),
  },
  {
    key: 'LinkingExample',
    module: require('./LinkingExample'),
  },
  {
    key: 'NavigationExperimentalExample',
    module: require('./NavigationExperimental/NavigationExperimentalExample'),
  },
  {
    key: 'NavigationExperimentalLegacyNavigatorExample',
    module: require('./NavigationExperimental/LegacyNavigator/LegacyNavigatorExample'),
  },
  {
    key: 'NetInfoExample',
    module: require('./NetInfoExample'),
  },
  {
    key: 'PanResponderExample',
    module: require('./PanResponderExample'),
  },
  {
    key: 'PointerEventsExample',
    module: require('./PointerEventsExample'),
  },
  {
    key: 'PushNotificationIOSExample',
    module: require('./PushNotificationIOSExample'),
  },
  {
    key: 'RCTRootViewIOSExample',
    module: require('./RCTRootViewIOSExample'),
  },
  {
    key: 'SnapshotExample',
    module: require('./SnapshotExample'),
  },
  {
    key: 'StatusBarIOSExample',
    module: require('./StatusBarIOSExample'),
  },
  {
    key: 'TimerExample',
    module: require('./TimerExample'),
  },
  {
    key: 'TransformExample',
    module: require('./TransformExample'),
  },
  {
    key: 'VibrationExample',
    module: require('./VibrationExample'),
  },
  {
    key: 'WebSocketExample',
    module: require('./WebSocketExample'),
  },
  {
    key: 'XHRExample',
    module: require('./XHRExample.ios'),
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
