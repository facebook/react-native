/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DefaultTurboModuleManagerDelegate.h"

#include <rncore.h>

namespace facebook {
namespace react {

std::function<std::shared_ptr<TurboModule>(
    const std::string &,
    const JavaTurboModule::InitParams &)>
    DefaultTurboModuleManagerDelegate::moduleProvidersFromEntryPoint{nullptr};

jni::local_ref<DefaultTurboModuleManagerDelegate::jhybriddata>
DefaultTurboModuleManagerDelegate::initHybrid(jni::alias_ref<jhybridobject>) {
  return makeCxxInstance();
}

void DefaultTurboModuleManagerDelegate::registerNatives() {
  registerHybrid({
      makeNativeMethod(
          "initHybrid", DefaultTurboModuleManagerDelegate::initHybrid),
  });
}

std::shared_ptr<TurboModule> DefaultTurboModuleManagerDelegate::getTurboModule(
    const std::string &name,
    const std::shared_ptr<CallInvoker> &jsInvoker) {
  // Not implemented yet: provide pure-C++ NativeModules here.
  return nullptr;
}

std::shared_ptr<TurboModule> DefaultTurboModuleManagerDelegate::getTurboModule(
    const std::string &name,
    const JavaTurboModule::InitParams &params) {
  auto resolvedModule = (DefaultTurboModuleManagerDelegate::
                             moduleProvidersFromEntryPoint)(name, params);
  if (resolvedModule != nullptr) {
    return resolvedModule;
  }
  return rncore_ModuleProvider(name, params);
}

} // namespace react
} // namespace facebook
