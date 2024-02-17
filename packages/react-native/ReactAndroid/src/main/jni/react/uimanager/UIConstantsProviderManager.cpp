/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <string>

#include <fbjni/fbjni.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/jni/NativeMap.h>

#include <react/runtime/nativeviewconfig/LegacyUIManagerConstantsProviderBinding.h>
#include "UIConstantsProviderManager.h"

namespace facebook::react {

using namespace facebook::jni;

UIConstantsProviderManager::UIConstantsProviderManager(
    jni::alias_ref<UIConstantsProviderManager::javaobject> jThis,
    RuntimeExecutor runtimeExecutor,
    jni::alias_ref<DefaultEventTypesProvider::javaobject>
        defaultExportableEventTypesProvider,
    jni::alias_ref<ConstantsForViewManagerProvider::javaobject>
        constantsForViewManagerProvider,
    jni::alias_ref<ConstantsProvider::javaobject> constantsProvider)
    : javaPart_(jni::make_global(jThis)),
      runtimeExecutor_(runtimeExecutor),
      defaultExportableEventTypesProvider_(
          jni::make_global(defaultExportableEventTypesProvider)),
      constantsForViewManagerProvider_(
          jni::make_global(constantsForViewManagerProvider)),
      constantsProvider_(jni::make_global(constantsProvider)) {}

jni::local_ref<UIConstantsProviderManager::jhybriddata>
UIConstantsProviderManager::initHybrid(
    jni::alias_ref<jhybridobject> jThis,
    jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutor,
    jni::alias_ref<DefaultEventTypesProvider::javaobject>
        defaultExportableEventTypesProvider,
    jni::alias_ref<ConstantsForViewManagerProvider::javaobject>
        constantsForViewManagerProvider,
    jni::alias_ref<ConstantsProvider::javaobject> constantsProvider) {
  return makeCxxInstance(
      jThis,
      runtimeExecutor->cthis()->get(),
      defaultExportableEventTypesProvider,
      constantsForViewManagerProvider,
      constantsProvider);
}

void UIConstantsProviderManager::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", UIConstantsProviderManager::initHybrid),
      makeNativeMethod(
          "installJSIBindings", UIConstantsProviderManager::installJSIBindings),
  });
}

void UIConstantsProviderManager::installJSIBindings() {
  runtimeExecutor_([thizz = this](jsi::Runtime& runtime) {
    auto jsiDefaultEventTypesProvider = [thizz, &runtime]() -> jsi::Value {
      return thizz->defaultExportableEventTypesProvider_->getDefaultEventTypes(
          runtime);
    };

    auto jsiConstantsForViewManagerProvider =
        [thizz, &runtime](std::string viewManagerName) -> jsi::Value {
      return thizz->constantsForViewManagerProvider_
          ->getConstantsForViewManager(runtime, viewManagerName);
    };

    auto jsiConstantsProvider = [thizz, &runtime]() -> jsi::Value {
      return thizz->constantsProvider_->getConstants(runtime);
    };

    LegacyUIManagerConstantsProviderBinding::install(
        runtime,
        "getDefaultEventTypes",
        std::move(jsiDefaultEventTypesProvider));

    LegacyUIManagerConstantsProviderBinding::install(
        runtime,
        "getConstantsForViewManager",
        std::move(jsiConstantsForViewManagerProvider));

    LegacyUIManagerConstantsProviderBinding::install(
        runtime, "getConstants", std::move(jsiConstantsProvider));
  });
}

} // namespace facebook::react
