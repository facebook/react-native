/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// @babel/register doesn't like export {foo} from './bar'; statements,
// so we have to jump through hoops here.
import {tasks as _android} from './private/android.js';
import {tasks as _app} from './private/app.js';
import {tasks as _apple} from './private/apple.js';
import {tasks as _clean} from './private/clean.js';
import * as _version from './public/version.js';

export const android = _android;
export const app = _app;
export const apple = _apple;
export const clean = _clean;
export const version = _version;

export type {Task} from './private/types';
