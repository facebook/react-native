/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DefaultTurboModuleManagerDelegate.h"

#include <algorithm>

#include <react/nativemodule/dom/NativeDOM.h>
#include <react/nativemodule/featureflags/NativeReactNativeFeatureFlags.h>
#include <react/nativemodule/microtasks/NativeMicrotasks.h>

namespace facebook::react {

DefaultTurboModuleManagerDelegate::DefaultTurboModuleManagerDelegate(
    jni::alias_ref<jni::JList<CxxReactPackage::javaobject>::javaobject>
        cxxReactPackages)
    : cxxReactPackages_() {
  cxxReactPackages_.reserve(cxxReactPackages->size());
  std::transform(
      cxxReactPackages->begin(),
      cxxReactPackages->end(),
      std::back_inserter(cxxReactPackages_),
      [](jni::alias_ref<CxxReactPackage::javaobject> elem) {
        return jni::make_global(elem);
      });
};

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
    jni::alias_ref<jclass> jClass,
    jni::alias_ref<jni::JList<CxxReactPackage::javaobject>::javaobject>
        cxxReactPackages) {
  return makeCxxInstance(cxxReactPackages);
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
  for (const auto& cxxReactPackage : cxxReactPackages_) {
    auto cppPart = cxxReactPackage->cthis();
    if (cppPart) {
      auto module = cppPart->getModule(name, jsInvoker);
      if (module) {
        return module;
      }
    }
  }

  auto moduleProvider = DefaultTurboModuleManagerDelegate::cxxModuleProvider;
  if (moduleProvider) {
    auto module = moduleProvider(name, jsInvoker);
    if (module) {
      return module;
    }
  }

  if (name == NativeReactNativeFeatureFlags::kModuleName) {
    return std::make_shared<NativeReactNativeFeatureFlags>(jsInvoker);
  }

  if (name == NativeMicrotasks::kModuleName) {
    return std::make_shared<NativeMicrotasks>(jsInvoker);
  }

  if (name == NativeDOM::kModuleName) {
    return std::make_shared<NativeDOM>(jsInvoker);
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

  return nullptr;
}

} // namespace facebook::react
