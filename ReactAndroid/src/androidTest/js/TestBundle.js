/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

// Disable YellowBox so we do not have to mock its dependencies
console.disableYellowBox = true;

// Include callable JS modules first, in case one of the other ones below throws
require('./ProgressBarTestModule');
require('./ViewRenderingTestModule');
require('./TestJavaToJSArgumentsModule');
require('./TestJSLocaleModule');
require('./TestJSToJavaParametersModule');
require('./TestJavaToJSReturnValuesModule');
require('./UIManagerTestModule');

require('./CatalystRootViewTestModule');
require('./DatePickerDialogTestModule');
require('./MeasureLayoutTestModule');
require('./PickerAndroidTestModule');
require('./ScrollViewTestModule');
require('./ShareTestModule');
require('./SwipeRefreshLayoutTestModule');
require('./TextInputTestModule');

// Define catalyst test apps used in integration tests
const {AppRegistry} = require('react-native');

const apps = [
  {
    appKey: 'AnimatedTransformTestApp',
    component: () =>
      require('./AnimatedTransformTestModule').AnimatedTransformTestApp,
  },
  {
    appKey: 'CatalystRootViewTestApp',
    component: () =>
      require('./CatalystRootViewTestModule').CatalystRootViewTestApp,
  },
  {
    appKey: 'DatePickerDialogTestApp',
    component: () =>
      require('./DatePickerDialogTestModule').DatePickerDialogTestApp,
  },
  {
    appKey: 'JSResponderTestApp',
    component: () => require('./JSResponderTestApp'),
  },
  {
    appKey: 'HorizontalScrollViewTestApp',
    component: () =>
      require('./ScrollViewTestModule').HorizontalScrollViewTestApp,
  },
  {
    appKey: 'ImageOverlayColorTestApp',
    component: () => require('./ImageOverlayColorTestApp'),
  },
  {
    appKey: 'ImageErrorTestApp',
    component: () => require('./ImageErrorTestApp'),
  },
  {
    appKey: 'InitialPropsTestApp',
    component: () => require('./InitialPropsTestApp'),
  },
  {
    appKey: 'LayoutEventsTestApp',
    component: () => require('./LayoutEventsTestApp'),
  },
  {
    appKey: 'MeasureLayoutTestApp',
    component: () => require('./MeasureLayoutTestModule').MeasureLayoutTestApp,
  },
  {
    appKey: 'MultitouchHandlingTestAppModule',
    component: () => require('./MultitouchHandlingTestAppModule'),
  },
  {
    appKey: 'NativeIdTestApp',
    component: () => require('./NativeIdTestModule').NativeIdTestApp,
  },
  {
    appKey: 'PickerAndroidTestApp',
    component: () => require('./PickerAndroidTestModule').PickerAndroidTestApp,
  },
  {
    appKey: 'ScrollViewTestApp',
    component: () => require('./ScrollViewTestModule').ScrollViewTestApp,
  },
  {
    appKey: 'ShareTestApp',
    component: () => require('./ShareTestModule').ShareTestApp,
  },
  {
    appKey: 'SubviewsClippingTestApp',
    component: () => require('./SubviewsClippingTestModule').App,
  },
  {
    appKey: 'SwipeRefreshLayoutTestApp',
    component: () =>
      require('./SwipeRefreshLayoutTestModule').SwipeRefreshLayoutTestApp,
  },
  {
    appKey: 'TextInputTestApp',
    component: () => require('./TextInputTestModule').TextInputTestApp,
  },
  {
    appKey: 'TestIdTestApp',
    component: () => require('./TestIdTestModule').TestIdTestApp,
  },
  {
    appKey: 'TouchBubblingTestAppModule',
    component: () => require('./TouchBubblingTestAppModule'),
  },
];

module.exports = apps;
AppRegistry.registerConfig(apps);
