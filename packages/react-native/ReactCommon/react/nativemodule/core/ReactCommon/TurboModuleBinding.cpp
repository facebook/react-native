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

namespace facebook::react {

class BridgelessNativeModuleProxy : public jsi::HostObject {
  std::unique_ptr<TurboModuleBinding> binding_;

 public:
  BridgelessNativeModuleProxy(std::unique_ptr<TurboModuleBinding> binding)
      : binding_(std::move(binding)) {}

  jsi::Value get(jsi::Runtime& runtime, const jsi::PropNameID& name) override {
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
    std::string moduleName = name.utf8(runtime);
    if (moduleName == "__esModule") {
      return jsi::Value(false);
    }

    if (binding_) {
      return binding_->getModule(runtime, moduleName);
    }

    throw jsi::JSError(
        runtime,
        "Tried to access NativeModule \"" + name.utf8(runtime) +
            "\" from the bridge. This isn't allowed in Bridgeless mode.");
  }

  void set(
      jsi::Runtime& runtime,
      const jsi::PropNameID& /*name*/,
      const jsi::Value& /*value*/) override {
    throw jsi::JSError(
        runtime,
        "Tried to insert a NativeModule into the bridge's NativeModule proxy.");
  }
};

// TODO(148359183): Merge this with the Bridgeless defineReadOnlyGlobal util
static void defineReadOnlyGlobal(
    jsi::Runtime& runtime,
    std::string propName,
    jsi::Value&& value) {
  if (runtime.global().hasProperty(runtime, propName.c_str())) {
    throw jsi::JSError(
        runtime,
        "Tried to redefine read-only global \"" + propName +
            "\", but read-only globals can only be defined once.");
  }
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
    TurboModuleProviderFunctionType&& moduleProvider)
    : moduleProvider_(std::move(moduleProvider)) {}

void TurboModuleBinding::install(
    jsi::Runtime& runtime,
    TurboModuleProviderFunctionType&& moduleProvider,
    TurboModuleProviderFunctionType&& legacyModuleProvider) {
  runtime.global().setProperty(
      runtime,
      "__turboModuleProxy",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "__turboModuleProxy"),
          1,
          [binding = TurboModuleBinding(std::move(moduleProvider))](
              jsi::Runtime& rt,
              const jsi::Value& thisVal,
              const jsi::Value* args,
              size_t count) {
            if (count < 1) {
              throw std::invalid_argument(
                  "__turboModuleProxy must be called with at least 1 argument");
            }
            std::string moduleName = args[0].getString(rt).utf8(rt);
            return binding.getModule(rt, moduleName);
          }));

  if (runtime.global().hasProperty(runtime, "RN$Bridgeless")) {
    if (legacyModuleProvider != nullptr) {
      defineReadOnlyGlobal(runtime, "RN$TurboInterop", jsi::Value(true));
      defineReadOnlyGlobal(
          runtime,
          "nativeModuleProxy",
          jsi::Object::createFromHostObject(
              runtime,
              std::make_shared<BridgelessNativeModuleProxy>(
                  std::make_unique<TurboModuleBinding>(
                      std::move(legacyModuleProvider)))));
    } else {
      defineReadOnlyGlobal(
          runtime,
          "nativeModuleProxy",
          jsi::Object::createFromHostObject(
              runtime, std::make_shared<BridgelessNativeModuleProxy>(nullptr)));
    }
  }
}

TurboModuleBinding::~TurboModuleBinding() {
  LongLivedObjectCollection::get().clear();
}

jsi::Value TurboModuleBinding::getModule(
    jsi::Runtime& runtime,
    const std::string& moduleName) const {
  std::shared_ptr<TurboModule> module;
  {
    SystraceSection s(
        "TurboModuleBinding::moduleProvider", "module", moduleName);
    module = moduleProvider_(moduleName);
  }
  if (module) {
    // What is jsRepresentation? A cache for the TurboModule's properties
    // Henceforth, always return the cache (i.e: jsRepresentation) to JavaScript
    //
    // If a jsRepresentation is found on the TurboModule, return it.
    //
    // Note: TurboModules are cached by name in TurboModuleManagers. Hence,
    // jsRepresentation is also cached by by name by the TurboModuleManager
    auto& weakJsRepresentation = module->jsRepresentation_;
    if (weakJsRepresentation) {
      auto jsRepresentation = weakJsRepresentation->lock(runtime);
      if (!jsRepresentation.isUndefined()) {
        return jsRepresentation;
      }
    }

    // Status: No jsRepresentation found on TurboModule
    // Create a brand new jsRepresentation, and attach it to TurboModule
    jsi::Object jsRepresentation(runtime);
    weakJsRepresentation =
        std::make_unique<jsi::WeakObject>(runtime, jsRepresentation);

    // Lazily populate the jsRepresentation, on property access.
    //
    // How does this work?
    //   1. Initially jsRepresentation is empty: {}
    //   2. If property lookup on jsRepresentation fails, the JS runtime will
    //   search jsRepresentation's prototype: jsi::Object(TurboModule).
    //   3. TurboModule::get(runtime, propKey) executes. This creates the
    //   property, caches it on jsRepresentation, then returns it to
    //   JavaScript.
    auto hostObject =
        jsi::Object::createFromHostObject(runtime, std::move(module));
    jsRepresentation.setProperty(runtime, "__proto__", std::move(hostObject));

    return jsRepresentation;
  } else {
    return jsi::Value::null();
  }
}

} // namespace facebook::react
