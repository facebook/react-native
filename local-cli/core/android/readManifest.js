/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
