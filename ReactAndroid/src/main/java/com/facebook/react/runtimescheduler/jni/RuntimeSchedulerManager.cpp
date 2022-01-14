/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <react/renderer/runtimescheduler/RuntimeSchedulerBinding.h>

#include "RuntimeSchedulerManager.h"

namespace facebook {
namespace react {

RuntimeSchedulerManager::RuntimeSchedulerManager(
    RuntimeExecutor runtimeExecutor)
    : runtimeExecutor_(runtimeExecutor) {}

jni::local_ref<RuntimeSchedulerManager::jhybriddata>
RuntimeSchedulerManager::initHybrid(
    jni::alias_ref<jclass>,
    jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutor) {
  return makeCxxInstance(runtimeExecutor->cthis()->get());
}

void RuntimeSchedulerManager::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", RuntimeSchedulerManager::initHybrid),
      makeNativeMethod(
          "installJSIBindings", RuntimeSchedulerManager::installJSIBindings),
  });
}

void RuntimeSchedulerManager::installJSIBindings() {
  runtimeExecutor_([runtimeExecutor = runtimeExecutor_](jsi::Runtime &runtime) {
    auto runtimeScheduler = std::make_shared<RuntimeScheduler>(runtimeExecutor);
    RuntimeSchedulerBinding::createAndInstallIfNeeded(
        runtime, runtimeScheduler);
  });
}

} // namespace react
} // namespace facebook
