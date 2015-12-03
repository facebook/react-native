/**
 * Copyright (c) 2015-present, Weibo, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule WeiboPrivacyAndroid
 */
'use strict';

var warning = require('warning');

var WeiboPrivacyAndroid = {

  show: function (
    message: string,
    duration: number
  ): void {
    warning(false, 'Cannot use WeiboPrivacyAndroid on iOS.');
  },

};

module.exports = WeiboPrivacyAndroid;
