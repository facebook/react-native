/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/CallInvokerHolder.h>
#include <ReactCommon/RuntimeExecutor.h>
#include <fbjni/fbjni.h>
#include <react/jni/JRuntimeExecutor.h>
#include <set>

namespace facebook {
namespace react {

class ComponentNameResolverManager
    : public facebook::jni::HybridClass<ComponentNameResolverManager> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/uimanager/ComponentNameResolverManager;";

  constexpr static auto ComponentNameResolverJavaDescriptor =
      "com/facebook/react/uimanager/ComponentNameResolver";

  static facebook::jni::local_ref<jhybriddata> initHybrid(
      facebook::jni::alias_ref<jhybridobject> jThis,
      facebook::jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutor,
      facebook::jni::alias_ref<jobject> componentNameResolver);

  static void registerNatives();

 private:
  friend HybridBase;
  facebook::jni::global_ref<ComponentNameResolverManager::javaobject> javaPart_;
  RuntimeExecutor runtimeExecutor_;

  facebook::jni::global_ref<jobject> componentNameResolver_;

  std::set<std::string> componentNames_;

  void installJSIBindings();

  explicit ComponentNameResolverManager(
      facebook::jni::alias_ref<ComponentNameResolverManager::jhybridobject>
          jThis,
      RuntimeExecutor runtimeExecutor,
      facebook::jni::alias_ref<jobject> componentNameResolver);
};

} // namespace react
} // namespace facebook
