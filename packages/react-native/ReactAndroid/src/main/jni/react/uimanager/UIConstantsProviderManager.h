/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <fbjni/fbjni.h>
#include <react/jni/JRuntimeExecutor.h>

namespace facebook::react {

class UIConstantsProviderManager
    : public facebook::jni::HybridClass<UIConstantsProviderManager> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/uimanager/UIConstantsProviderManager;";

  constexpr static auto UIConstantsProviderJavaDescriptor =
      "com/facebook/react/uimanager/UIConstantsProvider";

  static facebook::jni::local_ref<jhybriddata> initHybrid(
      facebook::jni::alias_ref<jhybridobject> jThis,
      facebook::jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutor,
      facebook::jni::alias_ref<jobject> uiConstantsProviderManager);

  static void registerNatives();

 private:
  friend HybridBase;
  facebook::jni::global_ref<UIConstantsProviderManager::javaobject> javaPart_;
  RuntimeExecutor runtimeExecutor_;

  facebook::jni::global_ref<jobject> uiConstantsProvider_;

  void installJSIBindings();

  explicit UIConstantsProviderManager(
      facebook::jni::alias_ref<UIConstantsProviderManager::jhybridobject> jThis,
      RuntimeExecutor runtimeExecutor,
      facebook::jni::alias_ref<jobject> uiConstantsProviderManager);
};

} // namespace facebook::react
