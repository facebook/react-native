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

'use strict';

const {combineSchemasInFileList} = require('./combine-js-to-schema');
const {parseArgs} = require('./combine-utils');

const {platform, outfile, fileList} = parseArgs(process.argv);

combineSchemasInFileList(fileList, platform, outfile);
