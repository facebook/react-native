/**
 * @providesModule StatusBarIOS
 */
'use strict';

var warning = require('warning');

class StatusBarIOS {

  static setStyle(style: StatusBarStyle, animated?: boolean) {
    warning(false, 'Cannot modify status bar on web.');
  }

  static setHidden(hidden: boolean, animation?: StatusBarAnimation) {
    warning(false, 'Cannot modify status bar on web.');
  }

}

module.exports = StatusBarIOS;
