/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <string>

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>

#include "ComponentNameResolverManager.h"

#include <react/renderer/componentregistry/native/NativeComponentRegistryBinding.h>

namespace facebook {
namespace react {

using namespace facebook::jni;

ComponentNameResolverManager::ComponentNameResolverManager(
    jni::alias_ref<ComponentNameResolverManager::javaobject> jThis,
    RuntimeExecutor runtimeExecutor,
    jni::alias_ref<jobject> componentNameResolver)
    : javaPart_(jni::make_global(jThis)),
      runtimeExecutor_(runtimeExecutor),
      componentNameResolver_(jni::make_global(componentNameResolver)) {}

jni::local_ref<ComponentNameResolverManager::jhybriddata>
ComponentNameResolverManager::initHybrid(
    jni::alias_ref<jhybridobject> jThis,
    jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutor,
    jni::alias_ref<jobject> componentNameResolver) {
  return makeCxxInstance(
      jThis, runtimeExecutor->cthis()->get(), componentNameResolver);
}

void ComponentNameResolverManager::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", ComponentNameResolverManager::initHybrid),
      makeNativeMethod(
          "installJSIBindings",
          ComponentNameResolverManager::installJSIBindings),
  });
}

void ComponentNameResolverManager::installJSIBindings() {
  runtimeExecutor_([thizz = this](jsi::Runtime &runtime) {
    auto viewManagerProvider = [thizz](const std::string &name) -> bool {
      if (thizz->componentNames_.size() == 0) {
        static auto getComponentNames =
            jni::findClassStatic(ComponentNameResolverManager::
                                     ComponentNameResolverJavaDescriptor)
                ->getMethod<jni::alias_ref<jtypeArray<jstring>>()>(
                    "getComponentNames");

        auto componentNamesJArray =
            getComponentNames(thizz->componentNameResolver_.get());
        auto len = componentNamesJArray->size();
        for (size_t i = 0; i < len; i++) {
          jni::local_ref<jstring> elem = (*componentNamesJArray)[i];
          auto componentName = elem->toStdString();
          thizz->componentNames_.insert(componentName);
        }
      }

      return thizz->componentNames_.find(name) != thizz->componentNames_.end();
    };

    react::NativeComponentRegistryBinding::install(
        runtime, std::move(viewManagerProvider));
  });
}

} // namespace react
} // namespace facebook
