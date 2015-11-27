'use strict';


var Clipboard = require('./Clipboard.js');
var NativeClipboard = require('react-native').NativeModules.ClipboardAndroid;

module.exports = Clipboard(NativeClipboard);
