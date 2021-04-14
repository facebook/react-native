/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeSchedulerBinding.h"
#include "SchedulerPriority.h"
#include "primitives.h"

#include <react/debug/react_native_assert.h>
#include <memory>

namespace facebook::react {

std::shared_ptr<RuntimeSchedulerBinding>
RuntimeSchedulerBinding::createAndInstallIfNeeded(
    jsi::Runtime &runtime,
    RuntimeExecutor runtimeExecutor) {
  auto runtimeSchedulerModuleName = "nativeRuntimeScheduler";

  auto runtimeSchedulerValue =
      runtime.global().getProperty(runtime, runtimeSchedulerModuleName);
  if (runtimeSchedulerValue.isUndefined()) {
    // The global namespace does not have an instance of the binding;
    // we need to create, install and return it.
    auto runtimeScheduler = std::make_unique<RuntimeScheduler>(runtimeExecutor);
    auto runtimeSchedulerBinding =
        std::make_shared<RuntimeSchedulerBinding>(std::move(runtimeScheduler));
    auto object =
        jsi::Object::createFromHostObject(runtime, runtimeSchedulerBinding);
    runtime.global().setProperty(
        runtime, runtimeSchedulerModuleName, std::move(object));
    return runtimeSchedulerBinding;
  }

  // The global namespace already has an instance of the binding;
  // we need to return that.
  auto runtimeSchedulerObject = runtimeSchedulerValue.asObject(runtime);
  return runtimeSchedulerObject.getHostObject<RuntimeSchedulerBinding>(runtime);
}

RuntimeSchedulerBinding::RuntimeSchedulerBinding(
    std::unique_ptr<RuntimeScheduler> runtimeScheduler)
    : runtimeScheduler_(std::move(runtimeScheduler)) {}

jsi::Value RuntimeSchedulerBinding::get(
    jsi::Runtime &runtime,
    jsi::PropNameID const &name) {
  auto propertyName = name.utf8(runtime);

  if (propertyName == "unstable_scheduleCallback") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        3,
        [this](
            jsi::Runtime &runtime,
            jsi::Value const &,
            jsi::Value const *arguments,
            size_t) noexcept -> jsi::Value {
          SchedulerPriority priority = fromRawValue(arguments[0].getNumber());
          auto callback = arguments[1].getObject(runtime).getFunction(runtime);
          react_native_assert(arguments[2].isUndefined());

          auto task = std::make_shared<Task>(priority, std::move(callback));
          runtimeScheduler_->scheduleTask(task);

          return valueFromTask(runtime, task);
        });
  }

  if (propertyName == "unstable_cancelCallback") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        1,
        [this](
            jsi::Runtime &runtime,
            jsi::Value const &,
            jsi::Value const *arguments,
            size_t) noexcept -> jsi::Value {
          runtimeScheduler_->cancelTask(taskFromValue(runtime, arguments[0]));
          return jsi::Value::undefined();
        });
  }

  if (propertyName == "unstable_shouldYield") {
    return jsi::Function::createFromHostFunction(
        runtime,
        name,
        0,
        [this](
            jsi::Runtime &,
            jsi::Value const &,
            jsi::Value const *,
            size_t) noexcept -> jsi::Value {
          auto shouldYield = runtimeScheduler_->getShouldYield();
          return jsi::Value(shouldYield);
        });
  }
  if (propertyName == "unstable_ImmediatePriority") {
    return jsi::Value(runtime, serialize(SchedulerPriority::ImmediatePriority));
  }

  if (propertyName == "unstable_UserBlockingPriority") {
    return jsi::Value(
        runtime, serialize(SchedulerPriority::UserBlockingPriority));
  }

  if (propertyName == "unstable_NormalPriority") {
    return jsi::Value(runtime, serialize(SchedulerPriority::NormalPriority));
  }

  if (propertyName == "unstable_LowPriority") {
    return jsi::Value(runtime, serialize(SchedulerPriority::LowPriority));
  }

  if (propertyName == "unstable_IdlePriority") {
    return jsi::Value(runtime, serialize(SchedulerPriority::IdlePriority));
  }

  react_native_assert(false && "undefined property");
  return jsi::Value::undefined();
}

} // namespace facebook::react
