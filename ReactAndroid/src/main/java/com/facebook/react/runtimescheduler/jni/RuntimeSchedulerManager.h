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
#include <react/jni/JRuntimeExecutor.h>

namespace facebook {
namespace react {

class RuntimeSchedulerManager
    : public facebook::jni::HybridClass<RuntimeSchedulerManager> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/runtimescheduler/RuntimeSchedulerManager;";

  static facebook::jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jclass>,
      facebook::jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutor);

  static void registerNatives();

 private:
  friend HybridBase;
  RuntimeExecutor runtimeExecutor_;

  void installJSIBindings();

  explicit RuntimeSchedulerManager(RuntimeExecutor runtimeExecutor);
};

} // namespace react
} // namespace facebook
