/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ComponentNameResolverBinding.h"

#include <react/renderer/componentregistry/native/NativeComponentRegistryBinding.h>

#include <unordered_set>

namespace facebook::react {

using namespace facebook::jni;

constexpr static auto ComponentNameResolverJavaDescriptor =
    "com/facebook/react/uimanager/ComponentNameResolver";

void ComponentNameResolverBinding::registerNatives() {
  javaClassStatic()->registerNatives({
      makeNativeMethod("install", ComponentNameResolverBinding::install),
  });
}

void ComponentNameResolverBinding::install(
    jni::alias_ref<jclass> /* unused */,
    jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutor,
    jni::alias_ref<jobject> componentNameResolver) {
  auto executor = runtimeExecutor->cthis()->get();
  executor([componentNameResolver = make_global(componentNameResolver)](
               jsi::Runtime& runtime) mutable {
    auto viewManagerProvider =
        [componentNameResolver = std::move(componentNameResolver),
         componentNames = std::unordered_set<std::string>()](
            const std::string& name) mutable {
          if (componentNames.empty()) {
            static auto getComponentNames =
                jni::findClassStatic(ComponentNameResolverJavaDescriptor)
                    ->getMethod<jni::alias_ref<jtypeArray<jstring>>()>(
                        "getComponentNames");

            auto componentNamesJArray =
                getComponentNames(componentNameResolver);
            auto len = componentNamesJArray->size();
            for (size_t i = 0; i < len; i++) {
              jni::local_ref<jstring> elem = (*componentNamesJArray)[i];
              componentNames.insert(elem->toStdString());
            }
          }
          return componentNames.find(name) != componentNames.end();
        };

    bindHasComponentProvider(runtime, std::move(viewManagerProvider));
  });
}

} // namespace facebook::react
