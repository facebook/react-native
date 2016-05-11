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
      msg += '. If you are sure the module is there, try restarting the packager or running "npm install".';
    }
    throw new Error(msg);
  }

  if (mod.hasError) {
    throw new Error(
      'Requiring module "' + id + '" which threw an exception'
    );
  }

  // `require` calls int  the require polyfill itself are not analyzed and
  // replaced so that they use numeric module IDs.
  // The systrace module will expose itself on the require function so that
  // it can be used here.
  // TODO(davidaurelio) Scan polyfills for dependencies, too (t9759686)
  if (__DEV__) {
    var {Systrace} = require;
  }

  try {
    // We must optimistically mark mod as initialized before running the factory to keep any
    // require cycles inside the factory from causing an infinite require loop.
    mod.isInitialized = true;

    if (__DEV__) {
      Systrace.beginEvent('JS_require_' + id);
    }

    // keep args in sync with with defineModuleCode in
    // packager/react-packager/src/Resolver/index.js
    mod.factory.call(global, global, require, mod.module, mod.module.exports);

    if (__DEV__) {
      Systrace.endEvent();
    }
  } catch (e) {
    mod.hasError = true;
    mod.isInitialized = false;
    throw e;
  }

  return mod.module.exports;
}

if (__DEV__) {
  require.Systrace = { beginEvent: () => {}, endEvent: () => {} };
}

global.__d = define;
global.require = require;

if (__DEV__) { // HMR
  function accept(id, factory, inverseDependencies) {
    var mod = modules[id];

    if (!mod) {
      define(id, factory);
      return true; // new modules don't need to be accepted
    }

    if (!mod.module.hot) {
      console.warn(
        'Cannot accept module because Hot Module Replacement ' +
        'API was not installed.'
      );
      return false;
    }

    // replace and initialize factory
    if (factory) {
      mod.factory = factory;
    }
    mod.isInitialized = false;
    require(id);

    if (mod.module.hot.acceptCallback) {
      mod.module.hot.acceptCallback();
      return true;
    } else {
      // need to have inverseDependencies to bubble up accept
      if (!inverseDependencies) {
        throw new Error('Undefined `inverseDependencies`');
      }

      // accept parent modules recursively up until all siblings are accepted
      return acceptAll(inverseDependencies[id], inverseDependencies);
    }
  }

  function acceptAll(modules, inverseDependencies) {
    if (!modules || modules.length === 0) {
      return true;
    }

    var notAccepted = modules.filter(function(module) {
      return !accept(module, /*factory*/ undefined, inverseDependencies);
    });

    var parents = [];
    for (var i = 0; i < notAccepted.length; i++) {
      // if this the module has no parents then the change cannot be hot loaded
      if (inverseDependencies[notAccepted[i]].length === 0) {
        return false;
      }

      parents.pushAll(inverseDependencies[notAccepted[i]]);
    }

    return acceptAll(parents, inverseDependencies);
  }

  global.__accept = accept;
}
