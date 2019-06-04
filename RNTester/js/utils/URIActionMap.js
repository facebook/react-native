/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const ReactNative = require('react-native');
const RNTesterActions = require('./RNTesterActions');
const RNTesterList = require('./RNTesterList');

const {Alert} = ReactNative;

import type {RNTesterAction} from './RNTesterActions';

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
