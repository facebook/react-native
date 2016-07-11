/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

'use strict';

global.require = require;
global.__d = define;

const modules = Object.create(null);
if (__DEV__) {
  var verboseNamesToModuleIds = Object.create(null);
}

function define(moduleId, factory) {
  if (moduleId in modules) {
    // prevent repeated calls to `global.nativeRequire` to overwrite modules
    // that are already loaded
    return;
  }
  modules[moduleId] = {
    factory,
    hasError: false,
    isInitialized: false,
    exports: undefined,
  };
  if (__DEV__) {
    // HMR
    modules[moduleId].hot = createHotReloadingObject();

    // DEBUGGABLE MODULES NAMES
    // avoid unnecessary parameter in prod
    const verboseName = modules[moduleId].verboseName = arguments[2];
    verboseNamesToModuleIds[verboseName] = moduleId;
  }
}

function require(moduleId) {
  const module = __DEV__
    ? modules[moduleId] || modules[verboseNamesToModuleIds[moduleId]]
    : modules[moduleId];
  return module && module.isInitialized
    ? module.exports
    : guardedLoadModule(moduleId, module);
}

let inGuard = false;
function guardedLoadModule(moduleId, module) {
  if (!inGuard && global.ErrorUtils) {
    inGuard = true;
    let returnValue;
    try {
      returnValue = loadModuleImplementation(moduleId, module);
    } catch (e) {
      global.ErrorUtils.reportFatalError(e);
    }
    inGuard = false;
    return returnValue;
  } else {
    return loadModuleImplementation(moduleId, module);
  }
}

function loadModuleImplementation(moduleId, module) {
  const nativeRequire = global.nativeRequire;
  if (!module && nativeRequire) {
    nativeRequire(moduleId);
    module = modules[moduleId];
  }

  if (__DEV__ && !module) {
    // allow verbose module names to be passed as module ID
    module = modules[verboseNamesToModuleIds[moduleId]];
    if (module) {
      console.warn(
        `Requiring module '${moduleId}' by name is only supported for ` +
        'debugging purposes and will break in production'
      );
    }
  }

  if (!module) {
    throw unknownModuleError(moduleId);
  }

  if (module.hasError) {
    throw moduleThrewError(moduleId);
  }

  // `require` calls int  the require polyfill itself are not analyzed and
  // replaced so that they use numeric module IDs.
  // The systrace module will expose itself on the require function so that
  // it can be used here.
  // TODO(davidaurelio) Scan polyfills for dependencies, too (t9759686)
  if (__DEV__) {
    var {Systrace} = require;
  }

  // We must optimistically mark module as initialized before running the
  // factory to keep any require cycles inside the factory from causing an
  // infinite require loop.
  module.isInitialized = true;
  const exports = module.exports = {};
  const {factory} = module;
  try {
    if (__DEV__) {
      Systrace.beginEvent('JS_require_' + (module.verboseName || moduleId));
    }

    const moduleObject = {exports};
    if (__DEV__ && module.hot) {
      moduleObject.hot = module.hot;
    }

    // keep args in sync with with defineModuleCode in
    // packager/react-packager/src/Resolver/index.js
    factory(global, require, moduleObject, exports);

    // avoid removing factory in DEV mode as it breaks HMR
    if (!__DEV__) {
      module.factory = undefined;
    }

    if (__DEV__) {
      Systrace.endEvent();
    }
    return (module.exports = moduleObject.exports);
  } catch (e) {
    module.hasError = true;
    module.isInitialized = false;
    module.exports = undefined;
    throw e;
  }
}

function unknownModuleError(id) {
  let message = 'Requiring unknown module "' + id + '".';
  if (__DEV__) {
    message +=
      'If you are sure the module is there, try restarting the packager or running "npm install".';
  }
  return Error(message);
}

function moduleThrewError(id) {
  return Error('Requiring module "' + id + '", which threw an exception.');
}

if (__DEV__) {
  require.Systrace = { beginEvent: () => {}, endEvent: () => {} };

  // HOT MODULE RELOADING
  var createHotReloadingObject = function() {
    const hot = {
      acceptCallback: null,
      accept: callback => { hot.acceptCallback = callback; },
    };
    return hot;
  };

  const acceptAll = function(dependentModules, inverseDependencies) {
    if (!dependentModules || dependentModules.length === 0) {
      return true;
    }

    const notAccepted = dependentModules.filter(
      module => !accept(module, /*factory*/ undefined, inverseDependencies));

    const parents = [];
    for (let i = 0; i < notAccepted.length; i++) {
      // if the module has no parents then the change cannot be hot loaded
      if (inverseDependencies[notAccepted[i]].length === 0) {
        return false;
      }

      parents.pushAll(inverseDependencies[notAccepted[i]]);
    }

    return acceptAll(parents, inverseDependencies);
  };

  const accept = function(id, factory, inverseDependencies) {
    const mod = modules[id];

    if (!mod) {
      define(id, factory);
      return true; // new modules don't need to be accepted
    }

    const {hot} = mod;
    if (!hot) {
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
    mod.hasError = false;
    mod.isInitialized = false;
    require(id);

    if (hot.acceptCallback) {
      hot.acceptCallback();
      return true;
    } else {
      // need to have inverseDependencies to bubble up accept
      if (!inverseDependencies) {
        throw new Error('Undefined `inverseDependencies`');
      }

      // accept parent modules recursively up until all siblings are accepted
      return acceptAll(inverseDependencies[id], inverseDependencies);
    }
  };

  global.__accept = accept;
}
