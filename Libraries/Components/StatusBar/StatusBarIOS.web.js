/**
 * @providesModule StatusBarIOS
 */
'use strict';

var warning = require('warning');

class StatusBarIOS {

  static setStyle(style, animated) {
    warning(false, 'Cannot modify status bar on web.');
  }

  static setHidden(hidden, animation) {
    warning(false, 'Cannot modify status bar on web.');
  }

}

module.exports = StatusBarIOS;
