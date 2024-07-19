/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/NativeRunnable.h>
#include <fbjni/fbjni.h>

namespace facebook::react {

struct JExecutor : public jni::JavaClass<JExecutor> {
  constexpr static auto kJavaDescriptor = "Ljava/util/concurrent/Executor;";

  void execute(jni::alias_ref<jni::JRunnable::javaobject> runnable);
};

} // namespace facebook::react
