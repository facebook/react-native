/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const fs = require('fs-extra');

exports.readFile = file => () => fs.readFileSync(file, 'utf8');

exports.writeFile = (file, content) =>
  content
    ? fs.writeFileSync(file, content, 'utf8')
    : c => fs.writeFileSync(file, c, 'utf8');
