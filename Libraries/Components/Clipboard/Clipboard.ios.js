'use strict';


var Clipboard = require('./Clipboard.js');
var NativeClipboard = require('react-native').NativeModules.RCTPasteboard;

module.exports = Clipboard(NativeClipboard);
