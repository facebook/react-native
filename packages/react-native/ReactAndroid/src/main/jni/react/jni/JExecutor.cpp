/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JExecutor.h"

namespace facebook::react {

void JExecutor::execute(jni::alias_ref<jni::JRunnable::javaobject> runnable) {
  static auto executeMethod =
      javaClassStatic()->getMethod<void(jni::JRunnable::javaobject)>("execute");
  executeMethod(self(), runnable.get());
}

} // namespace facebook::react
