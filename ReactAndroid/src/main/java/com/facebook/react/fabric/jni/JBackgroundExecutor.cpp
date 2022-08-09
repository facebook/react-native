/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fbjni/fbjni.h>
#include <react/jni/JNativeRunnable.h>

#include "JBackgroundExecutor.h"

namespace facebook {
namespace react {

using namespace facebook::jni;

using facebook::react::JNativeRunnable;
using facebook::react::Runnable;

BackgroundExecutor JBackgroundExecutor::get() {
  auto self = JBackgroundExecutor::create();

  return [self](std::function<void()> &&runnable) {
    static auto method =
        findClassStatic(JBackgroundExecutor::JBackgroundExecutorJavaDescriptor)
            ->getMethod<void(Runnable::javaobject)>("queueRunnable");

    auto jrunnable = JNativeRunnable::newObjectCxxArgs(std::move(runnable));
    method(self, static_ref_cast<Runnable::javaobject>(jrunnable).get());
  };
}

} // namespace react
} // namespace facebook
