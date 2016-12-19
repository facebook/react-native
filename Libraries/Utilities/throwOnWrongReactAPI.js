/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule throwOnWrongReactAPI
 * @flow
 */

'use strict';

function throwOnWrongReactAPI(key: string) {
  throw new Error(
`Seems you're trying to access 'ReactNative.${key}' from the 'react-native' package. Perhaps you meant to access 'React.${key}' from the 'react' package instead?

For example, instead of:

  import React, { Component, View } from 'react-native';

You should now do:

  import React, { Component } from 'react';
  import { View } from 'react-native';

Check the release notes on how to upgrade your code - https://github.com/facebook/react-native/releases/tag/v0.25.1
`);
}

module.exports = throwOnWrongReactAPI;
