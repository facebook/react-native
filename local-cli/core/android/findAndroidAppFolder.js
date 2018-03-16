/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * @param  {String} folder Folder to seek in
 * @return {String}
 */
module.exports = function findAndroidAppFolder(folder) {
  const flat = 'android';
  const nested = path.join('android', 'app');

  if (fs.existsSync(path.join(folder, nested))) {
    return nested;
  }

  if (fs.existsSync(path.join(folder, flat))) {
    return flat;
  }

  return null;
};
