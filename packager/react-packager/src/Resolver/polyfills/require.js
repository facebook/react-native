/* eslint strict:0 */
var modules = Object.create(null);
var inGuard = false;

function define(id, factory) {
  modules[id] = {
    factory,
    module: {exports: {}},
    isInitialized: false,
    hasError: false,
  };

  if (__DEV__) { // HMR
    Object.assign(modules[id].module, {
      hot: {
        acceptCallback: null,
        accept: function(callback) {
          modules[id].module.hot.acceptCallback = callback;
        }
      }
    });
  }
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

    __DEV__ && Systrace().beginEvent('JS_require_' + id);

    // keep args in sync with with defineModuleCode in
    // packager/react-packager/src/Resolver/index.js
    mod.factory.call(global, global, require, mod.module, mod.module.exports);

    __DEV__ && Systrace().endEvent();
  } catch (e) {
    mod.hasError = true;
    mod.isInitialized = false;
    throw e;
  }

  return mod.module.exports;
}

const Systrace = __DEV__ && (() => {
  var _Systrace;
  try {
    _Systrace = require('Systrace');
  } catch (e) {}

  return _Systrace && _Systrace.beginEvent ?
    _Systrace : { beginEvent: () => {}, endEvent: () => {} };
});

global.__d = define;
global.require = require;

if (__DEV__) { // HMR
  function accept(id, factory) {
    var mod = modules[id];

    if (!mod) {
      define(id, factory);
      return; // new modules don't need to be accepted
    }

    if (!mod.module.hot) {
      console.warn(
        'Cannot accept module because Hot Module Replacement ' +
        'API was not installed.'
      );
      return;
    }

    if (mod.module.hot.acceptCallback) {
      mod.factory = factory;
      mod.isInitialized = false;
      require(id);

      mod.module.hot.acceptCallback();
    } else {
      console.warn(
        '[HMR] Module `' + id + '` can\'t be hot reloaded because it ' +
        'doesn\'t provide accept callback hook. Reload the app to get the updates.'
      );
    }
  }

  global.__accept = accept;
}
