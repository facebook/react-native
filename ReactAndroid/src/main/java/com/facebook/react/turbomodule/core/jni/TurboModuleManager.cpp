/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>
#include <string>

#include <fb/fbjni.h>
#include <jsi/jsi.h>

#include <jsireact/TurboModuleBinding.h>

#include <react/jni/JMessageQueueThread.h>

#include "TurboModuleManager.h"

namespace facebook {
namespace react {

static JTurboModuleProviderFunctionType moduleProvider_ = nullptr;

TurboModuleManager::TurboModuleManager(
  jni::alias_ref<TurboModuleManager::javaobject> jThis,
  jsi::Runtime* rt,
  std::shared_ptr<JMessageQueueThread> jsMessageQueueThread
):
  javaPart_(make_global(jThis)),
  runtime_(rt),
  jsMessageQueueThread_(jsMessageQueueThread)
  {}

jni::local_ref<TurboModuleManager::jhybriddata> TurboModuleManager::initHybrid(
  jni::alias_ref<jhybridobject> jThis,
  jlong jsContext,
  jni::alias_ref<JavaMessageQueueThread::javaobject> jsQueue
) {
  auto sharedJSMessageQueueThread = std::make_shared<JMessageQueueThread> (jsQueue);
  return makeCxxInstance(jThis, (jsi::Runtime *) jsContext, sharedJSMessageQueueThread);
}

void TurboModuleManager::registerNatives() {
  registerHybrid({
    makeNativeMethod("initHybrid", TurboModuleManager::initHybrid),
    makeNativeMethod("installJSIBindings", TurboModuleManager::installJSIBindings),
  });
}

void TurboModuleManager::installJSIBindings() {
  if (!runtime_) {
    return; // Runtime doesn't exist when attached to Chrome debugger.
  }
  TurboModuleBinding::install(*runtime_, std::make_shared<TurboModuleBinding>(
      [this](const std::string &name) {
        const auto moduleInstance = getJavaModule(name);
        const auto jsInvoker = std::make_shared<react::JSCallInvoker>(jsMessageQueueThread_);
        return moduleProvider_(name, moduleInstance, jsInvoker);
      })
  );
}

jni::global_ref<JTurboModule> TurboModuleManager::getJavaModule(std::string name) {
  static auto method = javaClassStatic()->getMethod<jni::alias_ref<JTurboModule>(const std::string&)>("getJavaModule");
  return make_global(method(javaPart_.get(), name));
}

void TurboModuleManager::setModuleProvider(JTurboModuleProviderFunctionType fn) {
  moduleProvider_ = fn;
}

} // namespace react
} // namespace facebook
