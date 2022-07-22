/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RNTesterTurboModuleManagerDelegate.h"

#include "RNTesterAppModuleProvider.h"

namespace facebook {
namespace react {

jni::local_ref<RNTesterTurboModuleManagerDelegate::jhybriddata>
RNTesterTurboModuleManagerDelegate::initHybrid(jni::alias_ref<jhybridobject>) {
  return makeCxxInstance();
}

void RNTesterTurboModuleManagerDelegate::registerNatives() {
  registerHybrid({
      makeNativeMethod(
          "initHybrid", RNTesterTurboModuleManagerDelegate::initHybrid),
      makeNativeMethod(
          "canCreateTurboModule",
          RNTesterTurboModuleManagerDelegate::canCreateTurboModule),
  });
}

std::shared_ptr<TurboModule> RNTesterTurboModuleManagerDelegate::getTurboModule(
    const std::string &name,
    const std::shared_ptr<CallInvoker> &jsInvoker) {
  // Not implemented yet: provide pure-C++ NativeModules here.
  return nullptr;
}

std::shared_ptr<TurboModule> RNTesterTurboModuleManagerDelegate::getTurboModule(
    const std::string &name,
    const JavaTurboModule::InitParams &params) {
  return RNTesterAppModuleProvider(name, params);
}

bool RNTesterTurboModuleManagerDelegate::canCreateTurboModule(
    const std::string &name) {
  return getTurboModule(name, nullptr) != nullptr ||
      getTurboModule(name, {.moduleName = name}) != nullptr;
}

} // namespace react
} // namespace facebook
