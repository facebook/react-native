'use strict';

((global) => {
  const {ErrorUtils, __nativeRequire} = global;
  global.require = require;
  global.__d = define;

  const modules = Object.create(null);

  const loadModule = ErrorUtils ?
    guardedLoadModule : loadModuleImplementation;

  function define(moduleId, factory) {
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
      __nativeRequire(moduleId);
      module = modules[moduleId];
    }

    if (!module) {
      throw unknownModuleError(moduleId);
    }

    if (module.hasError) {
      throw moduleThrewError(moduleId);
    }

    const exports = module.exports = {};
    const {factory} = module;
    try {
      const moduleObject = {exports};
      factory(global, require, moduleObject, exports);
      return (module.exports = moduleObject.exports);
    } catch(e) {
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

})(this);
