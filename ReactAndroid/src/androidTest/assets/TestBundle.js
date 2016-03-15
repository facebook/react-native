/**
 * Copyright (c) 2014-present, Facebook, Inc.
 * All rights reserved.
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

// Disable YellowBox so we do not have to mock its dependencies
console.disableYellowBox = true;

// Include modules used by integration tests
require('ScrollViewTestModule');

// Define catalyst test apps used in integration tests
var AppRegistry = require('AppRegistry');

var apps = [
{
    appKey: 'ScrollViewTestApp',
    component: () => require('ScrollViewTestModule').ScrollViewTestApp
},
{
  appKey: 'HorizontalScrollViewTestApp',
  component: () => require('ScrollViewTestModule').HorizontalScrollViewTestApp
},
];

AppRegistry.registerConfig(apps);
