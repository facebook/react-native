/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <fbjni/fbjni.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/jni/JRuntimeExecutor.h>
#include <react/jni/NativeMap.h>

namespace facebook::react {

class DefaultEventTypesProvider
    : public jni::JavaClass<DefaultEventTypesProvider> {
 public:
  static constexpr const char* kJavaDescriptor =
      "Lcom/facebook/react/uimanager/UIConstantsProviderManager$DefaultEventTypesProvider;";

  jsi::Value getDefaultEventTypes(jsi::Runtime& runtime) {
    static auto method =
        javaClassStatic()
            ->getMethod<jni::alias_ref<NativeMap::jhybridobject>()>(
                "getDefaultEventTypes");
    auto result = method(self());
    return jsi::valueFromDynamic(runtime, result->cthis()->consume());
  }
};

class ConstantsForViewManagerProvider
    : public jni::JavaClass<ConstantsForViewManagerProvider> {
 public:
  static constexpr const char* kJavaDescriptor =
      "Lcom/facebook/react/uimanager/UIConstantsProviderManager$ConstantsForViewManagerProvider;";

  jsi::Value getConstantsForViewManager(
      jsi::Runtime& runtime,
      std::string viewManagerName) {
    static auto method =
        javaClassStatic()
            ->getMethod<jni::alias_ref<NativeMap::jhybridobject>(std::string)>(
                "getConstantsForViewManager");
    auto result = method(self(), viewManagerName);
    if (result == nullptr) {
      return jsi::Value::null();
    }
    return jsi::valueFromDynamic(runtime, result->cthis()->consume());
  }
};

class ConstantsProvider : public jni::JavaClass<ConstantsProvider> {
 public:
  static constexpr const char* kJavaDescriptor =
      "Lcom/facebook/react/uimanager/UIConstantsProviderManager$ConstantsProvider;";

  jsi::Value getConstants(jsi::Runtime& runtime) {
    static auto method =
        javaClassStatic()
            ->getMethod<jni::alias_ref<NativeMap::jhybridobject>()>(
                "getConstants");
    auto result = method(self());
    return jsi::valueFromDynamic(runtime, result->cthis()->consume());
  }
};

class UIConstantsProviderManager
    : public facebook::jni::HybridClass<UIConstantsProviderManager> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/uimanager/UIConstantsProviderManager;";

  static facebook::jni::local_ref<jhybriddata> initHybrid(
      facebook::jni::alias_ref<jhybridobject> jThis,
      facebook::jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutor,
      facebook::jni::alias_ref<DefaultEventTypesProvider::javaobject>
          defaultExportableEventTypesProvider,
      facebook::jni::alias_ref<ConstantsForViewManagerProvider::javaobject>
          constantsForViewManagerProvider,
      facebook::jni::alias_ref<ConstantsProvider::javaobject>
          constantsProvider);

  static void registerNatives();

 private:
  friend HybridBase;
  facebook::jni::global_ref<UIConstantsProviderManager::javaobject> javaPart_;
  RuntimeExecutor runtimeExecutor_;

  facebook::jni::global_ref<DefaultEventTypesProvider::javaobject>
      defaultExportableEventTypesProvider_;
  facebook::jni::global_ref<ConstantsForViewManagerProvider::javaobject>
      constantsForViewManagerProvider_;
  facebook::jni::global_ref<ConstantsProvider::javaobject> constantsProvider_;

  void installJSIBindings();

  explicit UIConstantsProviderManager(
      facebook::jni::alias_ref<UIConstantsProviderManager::jhybridobject> jThis,
      RuntimeExecutor runtimeExecutor,
      facebook::jni::alias_ref<DefaultEventTypesProvider::javaobject>
          defaultExportableEventTypesProvider,
      facebook::jni::alias_ref<ConstantsForViewManagerProvider::javaobject>
          constantsForViewManagerProvider,
      facebook::jni::alias_ref<ConstantsProvider::javaobject>
          constantsProvider);
};

} // namespace facebook::react
