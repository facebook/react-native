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
#include <ReactCommon/TurboModule.h>
#include <ReactCommon/JavaTurboModule.h>
#include <react/jni/CxxModuleWrapper.h>
#include <react/jni/JMessageQueueThread.h>
#include <ReactCommon/JSCallInvokerHolder.h>
#include <ReactCommon/TurboModuleManagerDelegate.h>

namespace facebook {
namespace react {

class TurboModuleManager : public jni::HybridClass<TurboModuleManager> {
public:
  static auto constexpr kJavaDescriptor = "Lcom/facebook/react/turbomodule/core/TurboModuleManager;";
  static jni::local_ref<jhybriddata> initHybrid(
    jni::alias_ref<jhybridobject> jThis,
    jlong jsContext,
    jni::alias_ref<JSCallInvokerHolder::javaobject> jsCallInvokerHolder,
    jni::alias_ref<TurboModuleManagerDelegate::javaobject> tmmDelegate
  );
  static void registerNatives();
private:
  friend HybridBase;
  jni::global_ref<TurboModuleManager::javaobject> javaPart_;
  jsi::Runtime* runtime_;
  std::shared_ptr<JSCallInvoker> jsCallInvoker_;
  jni::global_ref<TurboModuleManagerDelegate::javaobject> turboModuleManagerDelegate_;

  jni::global_ref<JTurboModule> getJavaModule(std::string name);
  jni::global_ref<CxxModuleWrapper::javaobject> getLegacyCxxJavaModule(std::string name);
  void installJSIBindings();
  explicit TurboModuleManager(
    jni::alias_ref<TurboModuleManager::jhybridobject> jThis,
    jsi::Runtime *rt,
    std::shared_ptr<JSCallInvoker> jsCallInvoker,
    jni::alias_ref<TurboModuleManagerDelegate::javaobject> tmmDelegate
  );
};

} // namespace react
} // namespace facebook
