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
    const TurboModuleProviderFunctionType &&moduleProvider)
    : moduleProvider_(std::move(moduleProvider)),
      longLivedObjectCollection_(nullptr),
      disableGlobalLongLivedObjectCollection_(false) {}

TurboModuleBinding::TurboModuleBinding(
    const TurboModuleProviderFunctionType &&moduleProvider,
    std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection)
    : moduleProvider_(std::move(moduleProvider)),
      longLivedObjectCollection_(longLivedObjectCollection),
      disableGlobalLongLivedObjectCollection_(true) {}

void TurboModuleBinding::install(
    jsi::Runtime &runtime,
    const TurboModuleProviderFunctionType &&moduleProvider) {
  runtime.global().setProperty(
      runtime,
      "__turboModuleProxy",
      jsi::Function::createFromHostFunction(
          runtime,
          jsi::PropNameID::forAscii(runtime, "__turboModuleProxy"),
          1,

          // Create a TurboModuleBinding that uses the global
          // LongLivedObjectCollection
          [binding =
               std::make_shared<TurboModuleBinding>(std::move(moduleProvider))](
              jsi::Runtime &rt,
              const jsi::Value &thisVal,
              const jsi::Value *args,
              size_t count) {
            return binding->jsProxy(rt, thisVal, args, count);
          }));
}

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
          // Create a TurboModuleBinding that doesn't use the global
          // LongLivedObjectCollection
          [binding = std::make_shared<TurboModuleBinding>(
               std::move(moduleProvider), longLivedObjectCollection)](
              jsi::Runtime &rt,
              const jsi::Value &thisVal,
              const jsi::Value *args,
              size_t count) {
            return binding->jsProxy(rt, thisVal, args, count);
          }));
}

TurboModuleBinding::~TurboModuleBinding() {
  if (longLivedObjectCollection_ != nullptr) {
    longLivedObjectCollection_->clear();
    return;
  }

  if (disableGlobalLongLivedObjectCollection_) {
    return;
  }

  LongLivedObjectCollection::get().clear();
}

std::shared_ptr<TurboModule> TurboModuleBinding::getModule(
    const std::string &name) {
  std::shared_ptr<TurboModule> module = nullptr;
  {
    SystraceSection s("TurboModuleBinding::getModule", "module", name);
    module = moduleProvider_(name);
  }
  return module;
}

jsi::Value TurboModuleBinding::jsProxy(
    jsi::Runtime &runtime,
    const jsi::Value &thisVal,
    const jsi::Value *args,
    size_t count) {
  if (count < 1) {
    throw std::invalid_argument(
        "__turboModuleProxy must be called with at least 1 argument");
  }
  std::string moduleName = args[0].getString(runtime).utf8(runtime);
  jsi::Value nullSchema = jsi::Value::undefined();

  std::shared_ptr<TurboModule> module = getModule(moduleName);
  if (module == nullptr) {
    return jsi::Value::null();
  }

  return jsi::Object::createFromHostObject(runtime, std::move(module));
}

} // namespace react
} // namespace facebook
