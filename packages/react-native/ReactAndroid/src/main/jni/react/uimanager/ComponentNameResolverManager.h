/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <unordered_set>

#include <fbjni/fbjni.h>
#include <react/jni/JRuntimeExecutor.h>

namespace facebook::react {

class ComponentNameResolverManager
    : public facebook::jni::HybridClass<ComponentNameResolverManager> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/uimanager/ComponentNameResolverManager;";

  static facebook::jni::local_ref<jhybriddata> initHybrid(
      facebook::jni::alias_ref<jhybridobject> jThis,
      facebook::jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutor,
      facebook::jni::alias_ref<jobject> componentNameResolver);

  static void registerNatives();

 private:
  friend HybridBase;

  RuntimeExecutor runtimeExecutor_;
  facebook::jni::global_ref<jobject> componentNameResolver_;
  std::unordered_set<std::string> componentNames_;

  void installJSIBindings();

  explicit ComponentNameResolverManager(
      RuntimeExecutor runtimeExecutor,
      facebook::jni::alias_ref<jobject> componentNameResolver);
};

} // namespace facebook::react
