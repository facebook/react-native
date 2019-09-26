/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TurboModuleBinding.h"

#include <string>

#include <cxxreact/SystraceSection.h>
#include <jsireact/LongLivedObject.h>

using namespace facebook;

namespace facebook {
namespace react {

/**
 * Public API to install the TurboModule system.
 */
TurboModuleBinding::TurboModuleBinding(const TurboModuleProviderFunctionType &moduleProvider)
  : moduleProvider_(moduleProvider) {}

void TurboModuleBinding::install(
    jsi::Runtime &runtime,
    std::shared_ptr<TurboModuleBinding> binding) {
  runtime.global().setProperty(
      runtime,
      "__turboModuleProxy",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "__turboModuleProxy"),
          1,
          [binding](jsi::Runtime& rt, const jsi::Value& thisVal, const jsi::Value* args, size_t count) {
            return binding->jsProxy(rt, thisVal, args, count);
          }));
}

void TurboModuleBinding::invalidate() const {
  LongLivedObjectCollection::get().clear();
}

std::shared_ptr<TurboModule> TurboModuleBinding::getModule(const std::string &name) {
  std::shared_ptr<TurboModule> module = nullptr;
  {
    SystraceSection s("TurboModuleBinding::getModule", "module", name);
    module = moduleProvider_(name);
  }
  return module;
}

jsi::Value TurboModuleBinding::jsProxy(
    jsi::Runtime& runtime,
    const jsi::Value& thisVal,
    const jsi::Value* args,
    size_t count) {
  if (count != 1) {
    throw std::invalid_argument("TurboModuleBinding::jsProxy arg count must be 1");
  }
  std::string moduleName = args[0].getString(runtime).utf8(runtime);
  std::shared_ptr<TurboModule> module = getModule(moduleName);

  if (module == nullptr) {
    return jsi::Value::null();
  }

  return jsi::Object::createFromHostObject(runtime, std::move(module));
}

} // namespace react
} // namespace facebook
