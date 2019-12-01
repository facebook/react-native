/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {RNTesterExample} from './Shared/RNTesterTypes';

const ComponentExamples: Array<RNTesterExample> = [
  {
    key: 'ActivityIndicatorExample',
    module: require('./ActivityIndicatorExample'),
    supportsTVOS: false,
  },
  {
    key: 'ARTExample',
    module: require('./ARTExample'),
    supportsTVOS: false,
  },
  {
    key: 'ButtonExample',
    module: require('./ButtonExample'),
    supportsTVOS: false,
  },
  {
    key: 'DarkModeExample',
    module: require('./DarkModeExample'),
    supportsTVOS: false,
  },
  {
    key: 'DatePickerMacOSExample',
    module: require('./DatePickerMacOSExample'),
    supportsTVOS: false,
  },
  {
    key: 'FlatListExample',
    module: require('./FlatListExample'),
    supportsTVOS: false,
  },
  {
    key: 'FocusEvents',
    module: require('./FocusEventsExample'),
    supportsTVOS: true,
  },
  {
    key: 'ImageExample',
    module: require('./ImageExample'),
    supportsTVOS: false,
  },
  {
    key: 'LayoutEventsExample',
    module: require('./LayoutEventsExample'),
    supportsTVOS: false,
  },
  {
    key: 'MultiColumnExample',
    module: require('./MultiColumnExample'),
    supportsTVOS: false,
  },
  {
    key: 'PickerExample',
    module: require('./PickerExample'),
    supportsTVOS: false,
  },
  {
    key: 'ScrollViewExample',
    module: require('./ScrollViewExample'),
    supportsTVOS: false,
  },
  {
    key: 'SectionListExample',
    module: require('./SectionListExample'),
    supportsTVOS: false,
  },
  {
    key: 'SliderExample',
    module: require('./SliderExample'),
    supportsTVOS: false,
  },
  {
    key: 'SwitchExample',
    module: require('./SwitchExample'),
    supportsTVOS: false,
  },
  {
    key: 'TextExample',
    module: require('./TextExample.macos'),
    supportsTVOS: false,
  },
  {
    key: 'TextInputExample',
    module: require('./TextInputExample.macos'),
    supportsTVOS: false,
  },
  {
    key: 'TouchableExample',
    module: require('./TouchableExample'),
    supportsTVOS: false,
  },
  {
    key: 'TransparentHitTestExample',
    module: require('./TransparentHitTestExample'),
    supportsTVOS: false,
  },
  {
    key: 'ViewExample',
    module: require('./ViewExample'),
    supportsTVOS: false,
  },
];

const APIExamples: Array<RNTesterExample> = [
  {
    key: 'ActionSheetIOSExample',
    module: require('./ActionSheetMacOSExample'),
    supportsTVOS: false,
  },
  {
    key: 'AnimatedExampleMacOS',
    module: require('./AnimatedExampleMacOS'),
    supportsTVOS: false,
  },
  {
    key: 'AlertExample',
    module: require('./AlertExample').AlertExample,
    supportsTVOS: false,
  },
  {
    key: 'AlertMacOSExample',
    module: require('./AlertMacOSExample'),
    supportsTVOS: false,
  },
  {
    key: 'AsyncStorageExample',
    module: require('./AsyncStorageExample'),
    supportsTVOS: false,
  },
  {
    key: 'BorderExample',
    module: require('./BorderExample'),
    supportsTVOS: false,
  },
  {
    key: 'BoxShadowExample',
    module: require('./BoxShadowExample'),
    supportsTVOS: false,
  },
  {
    key: 'ClipboardExample',
    module: require('./ClipboardExample'),
    supportsTVOS: false,
  },
  {
    key: 'LayoutAnimationExample',
    module: require('./LayoutAnimationExample'),
    supportsTVOS: false,
  },
  {
    key: 'LayoutExample',
    module: require('./LayoutExample'),
    supportsTVOS: false,
  },
  {
    key: 'LinkingExample',
    module: require('./LinkingExample'),
    supportsTVOS: false,
  },
  {
    key: 'NativeAnimationsExample',
    module: require('./NativeAnimationsExample'),
    supportsTVOS: false,
  },
  {
    key: 'PanResponderExample',
    module: require('./PanResponderExample'),
    supportsTVOS: false,
  },
  {
    key: 'PointerEventsExample',
    module: require('./PointerEventsExample'),
    supportsTVOS: false,
  },
  {
    key: 'PushNotificationIOSExample',
    module: require('./PushNotificationIOSExample'),
    supportsTVOS: false,
  },
  {
    key: 'RTLExample',
    module: require('./RTLExample'),
    supportsTVOS: false,
  },
  {
    key: 'TimerExample',
    module: require('./TimerExample'),
    supportsTVOS: false,
  },
  {
    key: 'TransformExample',
    module: require('./TransformExample'),
    supportsTVOS: false,
  },
  {
    key: 'WebSocketExample',
    module: require('./WebSocketExample'),
    supportsTVOS: false,
  },
];

const Modules = {};

APIExamples.concat(ComponentExamples).forEach(Example => {
  Modules[Example.key] = Example.module;
});

const RNTesterList = {
  APIExamples,
  ComponentExamples,
  Modules,
};

module.exports = RNTesterList;
