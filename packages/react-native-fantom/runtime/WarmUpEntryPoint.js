/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/**
 * This is just an entrypoint to warm up the Metro cache before the tests run.
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';
import '@react-native/fantom/src/__tests__/Fantom-itest';
import './setup';
