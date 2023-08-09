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
