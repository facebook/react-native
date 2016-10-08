/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const signedsource = require('./signedsource');
const util = require('util');

function sign(source) {
  var ssToken = util.format('<<%sSource::*O*zOeWoEQle#+L!plEphiEmie@IsG>>', 'Signed');
  var signedPackageText =
    source + util.format('\n__SSTOKENSTRING = "@%s %s";\n', 'generated', ssToken);
  return signedsource.sign(signedPackageText).signed_data;
}

module.exports = sign;
