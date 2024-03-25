/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ComponentNameResolverManager.h"

#include <react/renderer/componentregistry/native/NativeComponentRegistryBinding.h>

namespace facebook::react {

using namespace facebook::jni;

constexpr static auto ComponentNameResolverJavaDescriptor =
    "com/facebook/react/uimanager/ComponentNameResolver";

ComponentNameResolverManager::ComponentNameResolverManager(
    RuntimeExecutor runtimeExecutor,
    jni::alias_ref<jobject> componentNameResolver)
    : runtimeExecutor_(std::move(runtimeExecutor)),
      componentNameResolver_(jni::make_global(componentNameResolver)) {}

jni::local_ref<ComponentNameResolverManager::jhybriddata>
ComponentNameResolverManager::initHybrid(
    jni::alias_ref<jhybridobject> jThis,
    jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutor,
    jni::alias_ref<jobject> componentNameResolver) {
  return makeCxxInstance(
      runtimeExecutor->cthis()->get(), componentNameResolver);
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
  runtimeExecutor_([this](jsi::Runtime& runtime) {
    auto viewManagerProvider = [this](const std::string& name) -> bool {
      if (componentNames_.size() == 0) {
        static auto getComponentNames =
            jni::findClassStatic(ComponentNameResolverJavaDescriptor)
                ->getMethod<jni::alias_ref<jtypeArray<jstring>>()>(
                    "getComponentNames");

        auto componentNamesJArray = getComponentNames(componentNameResolver_);
        auto len = componentNamesJArray->size();
        for (size_t i = 0; i < len; i++) {
          jni::local_ref<jstring> elem = (*componentNamesJArray)[i];
          componentNames_.insert(elem->toStdString());
        }
      }
      return componentNames_.find(name) != componentNames_.end();
    };
    bindHasComponentProvider(runtime, std::move(viewManagerProvider));
  });
}

} // namespace facebook::react
