/* eslint strict:0 */
(function(global) {
  var modules = Object.create(null);
  var inGuard = false;

  function define(id, factory) {
    modules[id] = {
      factory,
      module: {exports: {}},
      isInitialized: false,
      hasError: false,
    };
  }

  function require(id) {
    var mod = modules[id];
    if (mod && mod.isInitialized) {
      return mod.module.exports;
    }

    return requireImpl(id);
  }

  function requireImpl(id) {
    if (global.ErrorUtils && !inGuard) {
      inGuard = true;
      var returnValue;
      try {
        returnValue = requireImpl.apply(this, arguments);
      } catch (e) {
        global.ErrorUtils.reportFatalError(e);
      }
      inGuard = false;
      return returnValue;
    }

    var mod = modules[id];
    if (!mod) {
      var msg = 'Requiring unknown module "' + id + '"';
      if (__DEV__) {
        msg += '. If you are sure the module is there, try restarting the packager.';
      }
      throw new Error(msg);
    }

    if (mod.hasError) {
      throw new Error(
        'Requiring module "' + id + '" which threw an exception'
      );
    }

    try {
      // We must optimistically mark mod as initialized before running the factory to keep any
      // require cycles inside the factory from causing an infinite require loop.
      mod.isInitialized = true;

      // keep args in sync with with defineModuleCode in
      // packager/react-packager/src/DependencyResolver/index.js
      mod.factory.call(global, global, require, mod.module, mod.module.exports);
    } catch (e) {
      mod.hasError = true;
      mod.isInitialized = false;
      throw e;
    }

    return mod.module.exports;
  }

  global.__d = define;
  global.require = require;
})(this);
