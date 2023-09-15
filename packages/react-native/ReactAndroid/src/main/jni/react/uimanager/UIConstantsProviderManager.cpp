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
    jni::alias_ref<jobject> uiConstantsProvider)
    : javaPart_(jni::make_global(jThis)),
      runtimeExecutor_(runtimeExecutor),
      uiConstantsProvider_(jni::make_global(uiConstantsProvider)) {}

jni::local_ref<UIConstantsProviderManager::jhybriddata>
UIConstantsProviderManager::initHybrid(
    jni::alias_ref<jhybridobject> jThis,
    jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutor,
    jni::alias_ref<jobject> uiConstantsProvider) {
  return makeCxxInstance(
      jThis, runtimeExecutor->cthis()->get(), uiConstantsProvider);
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
    auto uiConstantsProvider = [thizz, &runtime]() -> jsi::Value {
      static auto getConstants =
          jni::findClassStatic(
              UIConstantsProviderManager::UIConstantsProviderJavaDescriptor)
              ->getMethod<jni::alias_ref<NativeMap::jhybridobject>()>(
                  "getConstants");
      auto constants = getConstants(thizz->uiConstantsProvider_.get());
      return jsi::valueFromDynamic(runtime, constants->cthis()->consume());
    };

    LegacyUIManagerConstantsProviderBinding::install(
        runtime, std::move(uiConstantsProvider));
  });
}

} // namespace facebook::react
