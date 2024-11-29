/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

/**
 * This is just an entrypoint to warm up the Metro cache before the tests run.
 */

import '../../../packages/react-native/Libraries/Core/InitializeCore.js';
import '../../../packages/react-native/src/private/__tests__/ReactNativeTester';
import './setup';
