/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 */
'use strict';

// Disable YellowBox so we do not have to mock its dependencies
console.disableYellowBox = true;

// Include callable JS modules first, in case one of the other ones below throws
require('ProgressBarTestModule');
require('ViewRenderingTestModule');
require('TestJavaToJSArgumentsModule');
require('TestJSLocaleModule');
require('TestJSToJavaParametersModule');
require('UIManagerTestModule');

require('CatalystRootViewTestModule');
require('DatePickerDialogTestModule');
require('MeasureLayoutTestModule');
require('PickerAndroidTestModule');
require('ScrollViewTestModule');
require('SwipeRefreshLayoutTestModule');
require('TextInputTestModule');
require('TimePickerDialogTestModule');


// Define catalyst test apps used in integration tests
var AppRegistry = require('AppRegistry');

var apps = [
{
  appKey: 'CatalystRootViewTestApp',
  component: () => require('CatalystRootViewTestModule').CatalystRootViewTestApp
},
{
  appKey: 'DatePickerDialogTestApp',
  component: () => require('DatePickerDialogTestModule').DatePickerDialogTestApp
},
{
  appKey: 'JSResponderTestApp',
  component: () => require('JSResponderTestApp'),
},
{
  appKey: 'HorizontalScrollViewTestApp',
  component: () => require('ScrollViewTestModule').HorizontalScrollViewTestApp,
},
{
  appKey: 'InitialPropsTestApp',
  component: () => require('InitialPropsTestApp'),
},
{
  appKey: 'LayoutEventsTestApp',
  component: () => require('LayoutEventsTestApp'),
},
{
  appKey: 'MeasureLayoutTestApp',
  component: () => require('MeasureLayoutTestModule').MeasureLayoutTestApp
},
{
  appKey: 'MultitouchHandlingTestAppModule',
  component: () => require('MultitouchHandlingTestAppModule')
},
{
  appKey: 'PickerAndroidTestApp',
  component: () => require('PickerAndroidTestModule').PickerAndroidTestApp,
},
{
  appKey: 'ScrollViewTestApp',
  component: () => require('ScrollViewTestModule').ScrollViewTestApp,
},
{
  appKey: 'SubviewsClippingTestApp',
  component: () => require('SubviewsClippingTestModule').App,
},
{
  appKey: 'SwipeRefreshLayoutTestApp',
  component: () => require('SwipeRefreshLayoutTestModule').SwipeRefreshLayoutTestApp
},
{
  appKey: 'TextInputTestApp',
  component: () => require('TextInputTestModule').TextInputTestApp
},
{
  appKey: 'TestIdTestApp',
  component: () => require('TestIdTestModule').TestIdTestApp
},
{
  appKey: 'TimePickerDialogTestApp',
  component: () => require('TimePickerDialogTestModule').TimePickerDialogTestApp
},
{
  appKey: 'TouchBubblingTestAppModule',
  component: () => require('TouchBubblingTestAppModule')
},

];


module.exports = apps;
AppRegistry.registerConfig(apps);
