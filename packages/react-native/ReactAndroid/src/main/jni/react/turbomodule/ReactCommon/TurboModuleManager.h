/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <memory>
#include <unordered_map>

#include <ReactCommon/CallInvokerHolder.h>
#include <ReactCommon/JavaTurboModule.h>
#include <ReactCommon/NativeMethodCallInvokerHolder.h>
#include <ReactCommon/RuntimeExecutor.h>
#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleManagerDelegate.h>
#include <react/jni/JRuntimeExecutor.h>

namespace facebook::react {

class TurboModuleManager : public jni::HybridClass<TurboModuleManager> {
 public:
  static auto constexpr kJavaDescriptor = "Lcom/facebook/react/internal/turbomodule/core/TurboModuleManager;";
  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jhybridobject> /* unused */,
      jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutor,
      jni::alias_ref<CallInvokerHolder::javaobject> jsCallInvokerHolder,
      jni::alias_ref<NativeMethodCallInvokerHolder::javaobject> nativeMethodCallInvokerHolder,
      jni::alias_ref<TurboModuleManagerDelegate::javaobject> delegate);
  static void registerNatives();

 private:
  friend HybridBase;
  RuntimeExecutor runtimeExecutor_;
  std::shared_ptr<CallInvoker> jsCallInvoker_;
  std::shared_ptr<NativeMethodCallInvoker> nativeMethodCallInvoker_;
  jni::global_ref<TurboModuleManagerDelegate::javaobject> delegate_;

  using ModuleCache = std::unordered_map<std::string, std::shared_ptr<TurboModule>>;

  /**
   * TODO(T48018690):
   * All modules are currently long-lived.
   * We need to come up with a mechanism to allow modules to specify whether
   * they want to be long-lived or short-lived.
   */
  ModuleCache turboModuleCache_;
  ModuleCache legacyModuleCache_;

  explicit TurboModuleManager(
      RuntimeExecutor runtimeExecutor,
      std::shared_ptr<CallInvoker> jsCallInvoker,
      std::shared_ptr<NativeMethodCallInvoker> nativeMethodCallInvoker,
      jni::alias_ref<TurboModuleManagerDelegate::javaobject> delegate);

  static void installJSIBindings(jni::alias_ref<jhybridobject> javaPart, bool shouldCreateLegacyModules);

  static TurboModuleProviderFunctionType createTurboModuleProvider(
      jni::alias_ref<jhybridobject> javaPart,
      jsi::Runtime *runtime);
  std::shared_ptr<TurboModule>
  getTurboModule(jni::alias_ref<jhybridobject> javaPart, const std::string &name, jsi::Runtime &runtime);

  static TurboModuleProviderFunctionType createLegacyModuleProvider(jni::alias_ref<jhybridobject> javaPart);
  std::shared_ptr<TurboModule> getLegacyModule(jni::alias_ref<jhybridobject> javaPart, const std::string &name);
};

} // namespace facebook::react
