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

BackgroundExecutor JBackgroundExecutor::create(const std::string &name) {
  auto instance = make_global(newInstance(name));
  return [instance = std::move(instance)](std::function<void()> &&runnable) {
    static auto method =
        javaClassStatic()->getMethod<void(Runnable::javaobject)>(
            "queueRunnable");

    auto jrunnable = JNativeRunnable::newObjectCxxArgs(std::move(runnable));
    method(instance, jrunnable.get());
  };
}

} // namespace react
} // namespace facebook
