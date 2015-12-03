/**
 * Copyright (c) 2015-present, Facebook, Inc. All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the LICENSE
 * file in the root directory of this source tree. An additional grant of patent
 * rights can be found in the PATENTS file in the same directory.
 * 
 * @providesModule WeiboPrivacyAndroid
 */

'use strict';

var { NativeModules } = require('react-native');

var RCTWeiboPrivacyAndroid= NativeModules.WeiboPrivacyAndroid;

var WeiboPrivacyAndroid = {
  getStates: function (
    url: string,
    callback: Function,
  ): void {
    RCTWeiboPrivacyAndroid.getStates(url,callback);
  },
  
  updateState: function(
	url: string,
	key: string,
	value: number,
	):void{
	RCTWeiboPrivacyAndroid.updateState(url,key,value); 
  },

};

module.exports = WeiboPrivacyAndroid;
