/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>
#include <string>

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include <ReactCommon/TurboCxxModule.h>
#include <ReactCommon/TurboModuleBinding.h>
#include <react/jni/JMessageQueueThread.h>

#include "TurboModuleManager.h"

namespace facebook {
namespace react {

TurboModuleManager::TurboModuleManager(
    jni::alias_ref<TurboModuleManager::javaobject> jThis,
    jsi::Runtime *rt,
    std::shared_ptr<CallInvoker> jsCallInvoker,
    std::shared_ptr<CallInvoker> nativeCallInvoker,
    jni::alias_ref<TurboModuleManagerDelegate::javaobject> delegate)
    : javaPart_(jni::make_global(jThis)),
      runtime_(rt),
      jsCallInvoker_(jsCallInvoker),
      nativeCallInvoker_(nativeCallInvoker),
      delegate_(jni::make_global(delegate)),
      turboModuleCache_(std::make_shared<TurboModuleCache>()) {}

jni::local_ref<TurboModuleManager::jhybriddata> TurboModuleManager::initHybrid(
    jni::alias_ref<jhybridobject> jThis,
    jlong jsContext,
    jni::alias_ref<CallInvokerHolder::javaobject> jsCallInvokerHolder,
    jni::alias_ref<CallInvokerHolder::javaobject> nativeCallInvokerHolder,
    jni::alias_ref<TurboModuleManagerDelegate::javaobject> delegate) {
  auto jsCallInvoker = jsCallInvokerHolder->cthis()->getCallInvoker();
  auto nativeCallInvoker = nativeCallInvokerHolder->cthis()->getCallInvoker();

  return makeCxxInstance(
      jThis,
      (jsi::Runtime *)jsContext,
      jsCallInvoker,
      nativeCallInvoker,
      delegate);
}

void TurboModuleManager::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", TurboModuleManager::initHybrid),
      makeNativeMethod(
          "installJSIBindings", TurboModuleManager::installJSIBindings),
  });
}

void TurboModuleManager::installJSIBindings() {
  if (!runtime_ || !jsCallInvoker_) {
    return; // Runtime doesn't exist when attached to Chrome debugger.
  }

  auto turboModuleProvider =
      [turboModuleCache_ = std::weak_ptr<TurboModuleCache>(turboModuleCache_),
       jsCallInvoker_ = std::weak_ptr<CallInvoker>(jsCallInvoker_),
       nativeCallInvoker_ = std::weak_ptr<CallInvoker>(nativeCallInvoker_),
       delegate_ = jni::make_weak(delegate_),
       javaPart_ = jni::make_weak(javaPart_)](
          const std::string &name) -> std::shared_ptr<TurboModule> {
    auto turboModuleCache = turboModuleCache_.lock();
    auto jsCallInvoker = jsCallInvoker_.lock();
    auto nativeCallInvoker = nativeCallInvoker_.lock();
    auto delegate = delegate_.lockLocal();
    auto javaPart = javaPart_.lockLocal();

    if (!turboModuleCache || !jsCallInvoker || !nativeCallInvoker ||
        !delegate || !javaPart) {
      return nullptr;
    }

    auto turboModuleLookup = turboModuleCache->find(name);
    if (turboModuleLookup != turboModuleCache->end()) {
      return turboModuleLookup->second;
    }

    auto cxxModule = delegate->cthis()->getTurboModule(name, jsCallInvoker);
    if (cxxModule) {
      turboModuleCache->insert({name, cxxModule});
      return cxxModule;
    }

    static auto getLegacyCxxModule =
        javaPart->getClass()
            ->getMethod<jni::alias_ref<CxxModuleWrapper::javaobject>(
                const std::string &)>("getLegacyCxxModule");
    auto legacyCxxModule = getLegacyCxxModule(javaPart.get(), name);

    if (legacyCxxModule) {
      auto turboModule = std::make_shared<react::TurboCxxModule>(
          legacyCxxModule->cthis()->getModule(), jsCallInvoker);
      turboModuleCache->insert({name, turboModule});
      return turboModule;
    }

    static auto getJavaModule =
        javaPart->getClass()
            ->getMethod<jni::alias_ref<JTurboModule>(const std::string &)>(
                "getJavaModule");
    auto moduleInstance = getJavaModule(javaPart.get(), name);

    if (moduleInstance) {
      auto turboModule = delegate->cthis()->getTurboModule(
          name, moduleInstance, jsCallInvoker, nativeCallInvoker);
      turboModuleCache->insert({name, turboModule});
      return turboModule;
    }

    return nullptr;
  };

  jsCallInvoker_->invokeAsync(
      [this, turboModuleProvider = std::move(turboModuleProvider)]() -> void {
        TurboModuleBinding::install(*runtime_, std::move(turboModuleProvider));
      });
}

} // namespace react
} // namespace facebook
