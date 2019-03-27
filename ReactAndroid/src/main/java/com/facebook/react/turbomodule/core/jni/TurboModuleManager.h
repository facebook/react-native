/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <fb/fbjni.h>
#include <jsi/jsi.h>
#include <jsireact/TurboModule.h>
#include <jsireact/JavaTurboModule.h>
#include <react/jni/JMessageQueueThread.h>

namespace facebook {
namespace react {

using JTurboModuleProviderFunctionType = std::function<std::shared_ptr<TurboModule>(
    const std::string &name, jni::global_ref<JTurboModule> moduleInstance, std::shared_ptr<JSCallInvoker> jsInvoker)>;

class TurboModuleManager : public jni::HybridClass<TurboModuleManager> {
public:
  static auto constexpr kJavaDescriptor = "Lcom/facebook/react/turbomodule/core/TurboModuleManager;";
  static jni::local_ref<jhybriddata> initHybrid(
    jni::alias_ref<jhybridobject> jThis,
    jlong jsContext,
    jni::alias_ref<JavaMessageQueueThread::javaobject> jsQueue
  );
  static void registerNatives();
  static void setModuleProvider(JTurboModuleProviderFunctionType moduleProvider);
private:
  friend HybridBase;
  jni::global_ref<TurboModuleManager::javaobject> javaPart_;
  jsi::Runtime* runtime_;
  std::shared_ptr<JMessageQueueThread> jsMessageQueueThread_;

  jni::global_ref<JTurboModule> getJavaModule(std::string name);
  void installJSIBindings();
  explicit TurboModuleManager(
    jni::alias_ref<TurboModuleManager::jhybridobject> jThis,
    jsi::Runtime* rt,
    std::shared_ptr<JMessageQueueThread> jsMessageQueueThread
  );
};

} // namespace react
} // namespace facebook
