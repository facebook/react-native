/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DefaultTurboModuleManagerDelegate.h"

#include <rncore.h>

namespace facebook::react {

DefaultTurboModuleManagerDelegate::DefaultTurboModuleManagerDelegate(
    jni::alias_ref<CxxReactPackage::javaobject> cxxReactPackage)
    : cxxReactPackage_(jni::make_global(cxxReactPackage)){};

std::function<std::shared_ptr<TurboModule>(
    const std::string&,
    const std::shared_ptr<CallInvoker>&)>
    DefaultTurboModuleManagerDelegate::cxxModuleProvider{nullptr};

std::function<std::shared_ptr<TurboModule>(
    const std::string&,
    const JavaTurboModule::InitParams&)>
    DefaultTurboModuleManagerDelegate::javaModuleProvider{nullptr};

jni::local_ref<DefaultTurboModuleManagerDelegate::jhybriddata>
DefaultTurboModuleManagerDelegate::initHybrid(
    jni::alias_ref<jhybridobject>,
    jni::alias_ref<CxxReactPackage::javaobject> cxxReactPackage) {
  return makeCxxInstance(cxxReactPackage);
}

void DefaultTurboModuleManagerDelegate::registerNatives() {
  registerHybrid({
      makeNativeMethod(
          "initHybrid", DefaultTurboModuleManagerDelegate::initHybrid),
  });
}

std::shared_ptr<TurboModule> DefaultTurboModuleManagerDelegate::getTurboModule(
    const std::string& name,
    const std::shared_ptr<CallInvoker>& jsInvoker) {
  if (cxxReactPackage_) {
    auto module = cxxReactPackage_->cthis()->getModule(name, jsInvoker);
    if (module) {
      return module;
    }
  }

  auto moduleProvider = DefaultTurboModuleManagerDelegate::cxxModuleProvider;
  if (moduleProvider) {
    return moduleProvider(name, jsInvoker);
  }
  return nullptr;
}

std::shared_ptr<TurboModule> DefaultTurboModuleManagerDelegate::getTurboModule(
    const std::string& name,
    const JavaTurboModule::InitParams& params) {
  auto moduleProvider = DefaultTurboModuleManagerDelegate::javaModuleProvider;
  if (moduleProvider) {
    if (auto resolvedModule = moduleProvider(name, params)) {
      return resolvedModule;
    }
  }
  return rncore_ModuleProvider(name, params);
}

} // namespace facebook::react
