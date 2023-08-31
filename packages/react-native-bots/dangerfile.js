/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const {danger, fail, /*message,*/ warn} = require('danger');
const includes = require('lodash.includes');
const eslint = require('@seadub/danger-plugin-eslint');
const fetch = require('node-fetch');
const {validate: validateChangelog} =
  require('@rnx-kit/rn-changelog-generator').default;

warn(`${process.env.DANGER_GITHUB_API_TOKEN.length} errors were detected`);
