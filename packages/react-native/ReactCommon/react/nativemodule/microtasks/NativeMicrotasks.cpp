/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeMicrotasks.h"

#ifdef RN_DISABLE_OSS_PLUGIN_HEADER
#include "Plugins.h"
#endif

std::shared_ptr<facebook::react::TurboModule> NativeMicrotasksModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativeMicrotasks>(
      std::move(jsInvoker));
}

namespace facebook::react {

NativeMicrotasks::NativeMicrotasks(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeMicrotasksCxxSpec(std::move(jsInvoker)) {}

void NativeMicrotasks::queueMicrotask(
    jsi::Runtime& runtime,
    jsi::Function callback) {
  runtime.queueMicrotask(callback);
}

} // namespace facebook::react
