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
  module: React.Component;
};

var ComponentExamples: Array<UIExplorerExample> = [
  {
    key: 'ImageExample',
    module: require('./ImageExample'),
  },
  {
    key: 'ListViewExample',
    module: require('./ListViewExample'),
  },
  {
    key: 'PickerAndroidExample',
    module: require('./PickerAndroidExample'),
  },
  {
    key: 'ProgressBarAndroidExample',
    module: require('./ProgressBarAndroidExample'),
  },
  {
    key: 'RefreshControlExample',
    module: require('./RefreshControlExample'),
  },
  {
    key: 'ScrollViewSimpleExample',
    module: require('./ScrollViewSimpleExample'),
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
    key: 'TextExample',
    module: require('./TextExample'),
  },
  {
    key: 'TextInputExample',
    module: require('./TextInputExample'),
  },
  {
    key: 'ToolbarAndroidExample',
    module: require('./ToolbarAndroidExample'),
  },
  {
    key: 'TouchableExample',
    module: require('./TouchableExample'),
  },
  {
    key: 'ViewExample',
    module: require('./ViewExample'),
  },
  {
    key: 'ViewPagerAndroidExample',
    module: require('./ViewPagerAndroidExample'),
  },
  {
    key: 'WebViewExample',
    module: require('./WebViewExample'),
  },
];

const APIExamples = [
  {
    key: 'AccessibilityAndroidExample',
    module: require('./AccessibilityAndroidExample'),
  },
  {
    key: 'AlertExample',
    module: require('./AlertExample').AlertExample,
  },
  {
    key: 'AppStateExample',
    module: require('./AppStateExample'),
  },
  {
    key: 'BorderExample',
    module: require('./BorderExample'),
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
    key: 'DatePickerAndroidExample',
    module: require('./DatePickerAndroidExample'),
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
    key: 'LayoutEventsExample',
    module: require('./LayoutEventsExample'),
  },
  {
    key: 'LinkingExample',
    module: require('./LinkingExample'),
  },
  {
    key: 'LayoutExample',
    module: require('./LayoutExample'),
  },
  {
    key: 'NavigationExperimentalExample',
    module: require('./NavigationExperimental/NavigationExperimentalExample'),
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
    key: 'TimePickerAndroidExample',
    module: require('./TimePickerAndroidExample'),
  },
  {
    key: 'TimerExample',
    module: require('./TimerExample'),
  },
  {
    key: 'ToastAndroidExample',
    module: require('./ToastAndroidExample'),
  },
  {
    key: 'VibrationExample',
    module: require('./VibrationExample'),
  },
  {
    key: 'XHRExample',
    module: require('./XHRExample'),
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
