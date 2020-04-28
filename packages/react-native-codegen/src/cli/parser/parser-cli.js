/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails oncall+react_native
 * @flow
 * @format
 */

'use strict';

const parseFiles = require('./parser.js');

const [...fileList] = process.argv.slice(2);

parseFiles(fileList);
