/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TurboModuleBinding.h"

#include <stdexcept>
#include <string>

#include <ReactCommon/LongLivedObject.h>
#include <cxxreact/SystraceSection.h>

using namespace facebook;

namespace facebook {
namespace react {

namespace {
class BridgelessNativeModuleProxy : public jsi::HostObject {
 public:
  jsi::Value get(jsi::Runtime &runtime, const jsi::PropNameID &name) override {
    /**
     * BatchedBridge/NativeModules.js contains this line:
     *
     * module.exports = global.nativeModuleProxy
     *
     * This means that NativeModuleProxy is exported as a module from
     * 'NativeModules.js'. Whenever some JavaScript requires 'NativeModule.js',
     * Metro checks this module's __esModule property to see if the module is an
     * ES6 module.
     *
     * We return false from this property access, so that we can fail on the
     * actual NativeModule require that happens later, which is more actionable.
     */
    if (name.utf8(runtime) == "__esModule") {
      return jsi::Value(false);
    }
    throw jsi::JSError(
        runtime,
        "Tried to access NativeModule \"" + name.utf8(runtime) +
            "\" from the bridge. This isn't allowed in Bridgeless mode.");
  }

  void set(
      jsi::Runtime &runtime,
      const jsi::PropNameID & /*name*/,
      const jsi::Value & /*value*/) override {
    throw jsi::JSError(
        runtime,
        "Tried to insert a NativeModule into the bridge's NativeModule proxy.");
  }
};
} // namespace

// TODO(148359183): Merge this with the Bridgeless defineReadOnlyGlobal util
static void defineReadOnlyGlobal(
    jsi::Runtime &runtime,
    std::string propName,
    jsi::Value &&value) {
  jsi::Object jsObject =
      runtime.global().getProperty(runtime, "Object").asObject(runtime);
  jsi::Function defineProperty = jsObject.getProperty(runtime, "defineProperty")
                                     .asObject(runtime)
                                     .asFunction(runtime);

  jsi::Object descriptor = jsi::Object(runtime);
  descriptor.setProperty(runtime, "value", std::move(value));
  defineProperty.callWithThis(
      runtime,
      jsObject,
      runtime.global(),
      jsi::String::createFromUtf8(runtime, propName),
      descriptor);
}

/**
 * Public API to install the TurboModule system.
 */

TurboModuleBinding::TurboModuleBinding(
    TurboModuleBindingMode bindingMode,
    TurboModuleProviderFunctionType &&moduleProvider)
    : bindingMode_(bindingMode), moduleProvider_(std::move(moduleProvider)) {}

void TurboModuleBinding::install(
    jsi::Runtime &runtime,
    TurboModuleBindingMode bindingMode,
    TurboModuleProviderFunctionType &&moduleProvider) {
  runtime.global().setProperty(
      runtime,
      "__turboModuleProxy",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "__turboModuleProxy"),
          1,
          [binding =
               TurboModuleBinding(bindingMode, std::move(moduleProvider))](
              jsi::Runtime &rt,
              const jsi::Value &thisVal,
              const jsi::Value *args,
              size_t count) {
            if (count < 1) {
              throw std::invalid_argument(
                  "__turboModuleProxy must be called with at least 1 argument");
            }
            std::string moduleName = args[0].getString(rt).utf8(rt);
            return binding.getModule(rt, moduleName);
          }));

  if (runtime.global().hasProperty(runtime, "RN$Bridgeless")) {
    defineReadOnlyGlobal(
        runtime,
        "nativeModuleProxy",
        jsi::Object::createFromHostObject(
            runtime, std::make_shared<BridgelessNativeModuleProxy>()));
  }
}

TurboModuleBinding::~TurboModuleBinding() {
  LongLivedObjectCollection::get().clear();
}

jsi::Value TurboModuleBinding::getModule(
    jsi::Runtime &runtime,
    const std::string &moduleName) const {
  std::shared_ptr<TurboModule> module;
  {
    SystraceSection s(
        "TurboModuleBinding::moduleProvider", "module", moduleName);
    module = moduleProvider_(moduleName);
  }
  if (module) {
    // Default behaviour
    if (bindingMode_ == TurboModuleBindingMode::HostObject) {
      return jsi::Object::createFromHostObject(runtime, std::move(module));
    }

    auto &weakJsRepresentation = module->jsRepresentation_;
    if (weakJsRepresentation) {
      auto jsRepresentation = weakJsRepresentation->lock(runtime);
      if (!jsRepresentation.isUndefined()) {
        return jsRepresentation;
      }
    }

    // No JS representation found, or object has been collected
    jsi::Object jsRepresentation(runtime);
    weakJsRepresentation =
        std::make_unique<jsi::WeakObject>(runtime, jsRepresentation);

    if (bindingMode_ == TurboModuleBindingMode::Prototype) {
      // Option 1: create plain object, with it's prototype mapped back to the
      // hostobject. Any properties accessed are stored on the plain object
      auto hostObject =
          jsi::Object::createFromHostObject(runtime, std::move(module));
      jsRepresentation.setProperty(runtime, "__proto__", std::move(hostObject));
    } else {
      // Option 2: eagerly install all hostfunctions at this point, avoids
      // prototype
      for (auto &propName : module->getPropertyNames(runtime)) {
        module->get(runtime, propName);
      }
    }
    return jsRepresentation;
  } else {
    return jsi::Value::null();
  }
}

} // namespace react
} // namespace facebook
