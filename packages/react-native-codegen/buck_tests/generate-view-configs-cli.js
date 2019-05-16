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

const generate = require('./generate-view-configs');

const [fileList] = process.argv.slice(2);

const CURRENT_VIEW_CONFIG_SCHEMAS = ['SliderSchema.js'];

generate(
  fileList
    .split('\n')
    .filter(fileName =>
      CURRENT_VIEW_CONFIG_SCHEMAS.find(supportedFileName =>
        fileName.endsWith(supportedFileName),
      ),
    ),
);
