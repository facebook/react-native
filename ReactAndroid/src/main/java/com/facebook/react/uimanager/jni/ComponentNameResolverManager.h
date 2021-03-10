/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/CallInvokerHolder.h>
#include <ReactCommon/RuntimeExecutor.h>
#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <react/jni/JRuntimeExecutor.h>
#include <memory>
#include <set>
#include <unordered_map>

using namespace facebook::jni;
using namespace facebook::jsi;

namespace facebook {
namespace react {

class ComponentNameResolverManager
    : public jni::HybridClass<ComponentNameResolverManager> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/uimanager/ComponentNameResolverManager;";

  constexpr static auto ComponentNameResolverJavaDescriptor =
      "com/facebook/react/uimanager/ComponentNameResolver";

  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jhybridobject> jThis,
      jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutor,
      jni::alias_ref<jobject> componentNameResolver);

  static void registerNatives();

 private:
  friend HybridBase;
  jni::global_ref<ComponentNameResolverManager::javaobject> javaPart_;
  RuntimeExecutor runtimeExecutor_;

  jni::global_ref<jobject> componentNameResolver_;

  std::set<std::string> componentNames_;

  void installJSIBindings();

  explicit ComponentNameResolverManager(
      jni::alias_ref<ComponentNameResolverManager::jhybridobject> jThis,
      RuntimeExecutor runtimeExecutor,
      jni::alias_ref<jobject> componentNameResolver);
};

} // namespace react
} // namespace facebook
