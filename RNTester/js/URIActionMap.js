/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @providesModule URIActionMap
 */
'use strict';

const ReactNative = require('react-native');
const RNTesterActions = require('./RNTesterActions');
// $FlowFixMe : This is a platform-forked component, and flow seems to only run on iOS?
const RNTesterList = require('./RNTesterList');

const {
  Alert,
} = ReactNative;

import type { RNTesterAction } from './RNTesterActions';

function PathActionMap(path: string): ?RNTesterAction {
  // Warning! Hacky parsing for example code. Use a library for this!
  const exampleParts = path.split('/example/');
  const exampleKey = exampleParts[1];
  if (exampleKey) {
    if (!RNTesterList.Modules[exampleKey]) {
      Alert.alert(`${exampleKey} example could not be found!`);
      return null;
    }
    return RNTesterActions.ExampleAction(exampleKey);
  }
  return null;
}

function URIActionMap(uri: ?string): ?RNTesterAction {
  if (!uri) {
    return null;
  }
  // Warning! Hacky parsing for example code. Use a library for this!
  const parts = uri.split('rntester:/');
  if (!parts[1]) {
    return null;
  }
  const path = parts[1];
  return PathActionMap(path);
}

module.exports = URIActionMap;
