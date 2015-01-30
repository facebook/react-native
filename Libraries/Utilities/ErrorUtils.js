/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule ErrorUtils
 */

var GLOBAL = this;

/**
 * The particular require runtime that we are using looks for a global
 * `ErrorUtils` object and if it exists, then it requires modules with the
 * error handler specified via ErrorUtils.setGlobalHandler by calling the
 * require function with applyWithGuard. Since the require module is loaded
 * before any of the modules, this ErrorUtils must be defined (and the handler
 * set) globally before requiring anything.
 *
 * However, we still want to treat ErrorUtils as a module so that other modules
 * that use it aren't just using a global variable, so simply export the global
 * variable here. ErrorUtils is original defined in a file named error-guard.js.
 */
module.exports = GLOBAL.ErrorUtils;
