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
  jni::alias_ref<TurboModuleManagerDelegate::javaobject> delegate
):
  javaPart_(jni::make_global(jThis)),
  runtime_(rt),
  jsCallInvoker_(jsCallInvoker),
  delegate_(jni::make_global(delegate))
  {}

jni::local_ref<TurboModuleManager::jhybriddata> TurboModuleManager::initHybrid(
  jni::alias_ref<jhybridobject> jThis,
  jlong jsContext,
  jni::alias_ref<JSCallInvokerHolder::javaobject> jsCallInvokerHolder,
  jni::alias_ref<TurboModuleManagerDelegate::javaobject> delegate
) {
  auto jsCallInvoker = jsCallInvokerHolder->cthis()->getJSCallInvoker();

  return makeCxxInstance(jThis, (jsi::Runtime *) jsContext, jsCallInvoker, delegate);
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
        auto turboModuleLookup = turboModuleCache_.find(name);
        if (turboModuleLookup != turboModuleCache_.end()) {
          return turboModuleLookup->second;
        }

        auto cxxModule = delegate_->cthis()->getTurboModule(name, jsCallInvoker_);
        if (cxxModule) {
          turboModuleCache_.insert({name, cxxModule});
          return cxxModule;
        }

        static auto getLegacyCxxModule = delegate_->getClass()->getMethod<jni::alias_ref<CxxModuleWrapper::javaobject>(const std::string&)>("getLegacyCxxModule");
        auto legacyCxxModule = getLegacyCxxModule(delegate_.get(), name);

        if (legacyCxxModule) {
          auto turboModule = std::make_shared<react::TurboCxxModule>(legacyCxxModule->cthis()->getModule(), jsCallInvoker_);
          turboModuleCache_.insert({name, turboModule});
          return turboModule;
        }

        static auto getJavaModule = javaClassStatic()->getMethod<jni::alias_ref<JTurboModule>(const std::string&)>("getJavaModule");
        auto moduleInstance = getJavaModule(javaPart_.get(), name);

        if (moduleInstance) {
          auto turboModule = delegate_->cthis()->getTurboModule(name, moduleInstance, jsCallInvoker_);
          turboModuleCache_.insert({name, turboModule});
          return turboModule;
        }

        return std::shared_ptr<TurboModule>(nullptr);
      })
  );
}

} // namespace react
} // namespace facebook
