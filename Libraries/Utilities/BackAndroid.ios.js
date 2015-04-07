/**
 * iOS stub for BackAndroid.android.js
 *
 * @providesModule BackAndroid
 */

'use strict';

var warning = require('warning');

function platformWarn() {
  warning(false, 'BackAndroid is not supported on this platform.');
}

var BackAndroid = {
  exitApp: platformWarn,
  addEventListener: platformWarn,
  removeEventListener: platformWarn,
};

module.exports = BackAndroid;
