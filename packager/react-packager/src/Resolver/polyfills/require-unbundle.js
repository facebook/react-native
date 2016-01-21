'use strict';

const {ErrorUtils, nativeRequire} = global;
global.require = require;
global.__d = define;

const modules = Object.create(null);

const loadModule = ErrorUtils ?
  guardedLoadModule : loadModuleImplementation;

function define(moduleId, factory) {
  if (moduleId in modules) {
    // prevent repeated calls to `global.nativeRequire` to overwrite modules
    // that are already loaded
    return;
  }
  modules[moduleId] = {
    factory,
    hasError: false,
    exports: undefined,
  };
}

function require(moduleId) {
  const module = modules[moduleId];
  return module && module.exports || loadModule(moduleId, module);
}

function guardedLoadModule(moduleId, module) {
  try {
    return loadModuleImplementation(moduleId, module);
  } catch (e) {
    ErrorUtils.reportFatalError(e);
  }
}

function loadModuleImplementation(moduleId, module) {
  if (!module) {
    nativeRequire(moduleId);
    module = modules[moduleId];
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
  const {Systrace} = require;

  const exports = module.exports = {};
  const {factory} = module;
  try {
    if (__DEV__) {
      Systrace.beginEvent('JS_require_' + moduleId);
    }

    const moduleObject = {exports};
    factory(global, require, moduleObject, exports);

    if (__DEV__) {
      Systrace.endEvent();
    }
    return (module.exports = moduleObject.exports);
  } catch (e) {
    module.hasError = true;
    module.exports = undefined;
  }
}

function unknownModuleError(id) {
  let message = 'Requiring unknown module "' + id + '".';
  if (__DEV__) {
    message +=
      'If you are sure the module is there, try restarting the packager.';
  }
  return Error(message);
}

function moduleThrewError(id) {
  return Error('Requiring module "' + id + '", which threw an exception.');
}

if (__DEV__) {
  require.Systrace = { beginEvent: () => {}, endEvent: () => {} };
}
