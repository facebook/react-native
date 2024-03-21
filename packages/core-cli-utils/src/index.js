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

import {tasks as android} from './private/android.js';
import {tasks as apple} from './private/apple.js';
import {tasks as clean} from './private/clean.js';

/* eslint sort-keys : "error" */
export default {
  android: typeof android,
  apple: typeof apple,
  clean: typeof clean,
};

export type {Task} from './private/types';
