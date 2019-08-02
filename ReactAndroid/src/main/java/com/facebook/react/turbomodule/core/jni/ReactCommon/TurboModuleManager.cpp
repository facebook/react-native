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

#include <ReactCommon/TurboModuleBinding.h>
#include <ReactCommon/TurboCxxModule.h>
#include <react/jni/JMessageQueueThread.h>

#include "TurboModuleManager.h"

namespace facebook {
namespace react {

TurboModuleManager::TurboModuleManager(
  jni::alias_ref<TurboModuleManager::javaobject> jThis,
  jsi::Runtime* rt,
  std::shared_ptr<JSCallInvoker> jsCallInvoker,
  jni::alias_ref<TurboModuleManagerDelegate::javaobject> tmmDelegate
):
  javaPart_(jni::make_global(jThis)),
  runtime_(rt),
  jsCallInvoker_(jsCallInvoker),
  turboModuleManagerDelegate_(jni::make_global(tmmDelegate))
  {}

jni::local_ref<TurboModuleManager::jhybriddata> TurboModuleManager::initHybrid(
  jni::alias_ref<jhybridobject> jThis,
  jlong jsContext,
  jni::alias_ref<JSCallInvokerHolder::javaobject> jsCallInvokerHolder,
  jni::alias_ref<TurboModuleManagerDelegate::javaobject> tmmDelegate
) {
  auto jsCallInvoker = jsCallInvokerHolder->cthis()->getJSCallInvoker();

  return makeCxxInstance(jThis, (jsi::Runtime *) jsContext, jsCallInvoker, tmmDelegate);
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
      [this](const std::string &name) -> std::shared_ptr<TurboModule> {
        auto cxxModule = turboModuleManagerDelegate_->cthis()->getTurboModule(name, jsCallInvoker_);
        if (cxxModule) {
          return cxxModule;
        }

        auto legacyCxxModule = getLegacyCxxJavaModule(name);
        if (legacyCxxModule) {
          return std::make_shared<react::TurboCxxModule>(legacyCxxModule->cthis()->getModule(), jsCallInvoker_);
        }

        auto moduleInstance = getJavaModule(name);

        if (moduleInstance) {
          return turboModuleManagerDelegate_->cthis()->getTurboModule(name, moduleInstance, jsCallInvoker_);
        }

        return std::shared_ptr<TurboModule>(nullptr);
      })
  );
}

jni::global_ref<JTurboModule> TurboModuleManager::getJavaModule(std::string name) {
  static auto method = javaClassStatic()->getMethod<jni::alias_ref<JTurboModule>(const std::string&)>("getJavaModule");

  auto module = jni::make_global(method(javaPart_.get(), name));

  return module;
}

jni::global_ref<CxxModuleWrapper::javaobject> TurboModuleManager::getLegacyCxxJavaModule(std::string name) {
  static auto method = turboModuleManagerDelegate_->getClass()->getMethod<jni::alias_ref<CxxModuleWrapper::javaobject>(const std::string&)>("getLegacyCxxModule");
  auto module = jni::make_global(method(turboModuleManagerDelegate_.get(), name));
  return module;
}

} // namespace react
} // namespace facebook
