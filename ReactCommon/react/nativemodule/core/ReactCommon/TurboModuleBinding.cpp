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
    const TurboModuleProviderFunctionType &&moduleProvider,
    std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection)
    : moduleProvider_(std::move(moduleProvider)),
      longLivedObjectCollection_(std::move(longLivedObjectCollection)) {}

void TurboModuleBinding::install(
    jsi::Runtime &runtime,
    const TurboModuleProviderFunctionType &&moduleProvider,
    std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection) {
  runtime.global().setProperty(
      runtime,
      "__turboModuleProxy",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "__turboModuleProxy"),
          1,
          [binding = TurboModuleBinding(
               std::move(moduleProvider),
               std::move(longLivedObjectCollection))](
              jsi::Runtime &rt,
              const jsi::Value &thisVal,
              const jsi::Value *args,
              size_t count) mutable {
            return binding.getModule(rt, thisVal, args, count);
          }));
}

TurboModuleBinding::~TurboModuleBinding() {
  if (longLivedObjectCollection_) {
    longLivedObjectCollection_->clear();
  } else {
    LongLivedObjectCollection::get().clear();
  }
}

jsi::Value TurboModuleBinding::getModule(
    jsi::Runtime &runtime,
    const jsi::Value &thisVal,
    const jsi::Value *args,
    size_t count) {
  if (count < 1) {
    throw std::invalid_argument(
        "__turboModuleProxy must be called with at least 1 argument");
  }
  std::string moduleName = args[0].getString(runtime).utf8(runtime);

  std::shared_ptr<TurboModule> module;
  {
    SystraceSection s(
        "TurboModuleBinding::moduleProvider", "module", moduleName);
    module = moduleProvider_(moduleName);
  }
  if (module) {
    return jsi::Object::createFromHostObject(runtime, std::move(module));
  } else {
    return jsi::Value::null();
  }
}

} // namespace react
} // namespace facebook
