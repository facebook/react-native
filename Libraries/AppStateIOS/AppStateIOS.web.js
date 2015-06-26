/**
 * @providesModule AppStateIOS
 */
'use strict';

var warning = require('warning');

class AppStateIOS {

  static addEventListener(type, handler) {
    warning(false, 'Cannot listen to AppStateIOS events on web.');
  }

  static removeEventListener(type, handler) {
    warning(false, 'Cannot remove AppStateIOS listener on web.');
  }

}

AppStateIOS.currentState = null;

module.exports = AppStateIOS;
