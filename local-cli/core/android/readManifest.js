/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

'use strict';

const fs = require('fs');
const xml = require('xmldoc');

/**
 * @param  {String} manifestPath
 * @return {XMLDocument} Parsed manifest's content
 */
module.exports = function readManifest(manifestPath) {
  return new xml.XmlDocument(fs.readFileSync(manifestPath, 'utf8'));
};
