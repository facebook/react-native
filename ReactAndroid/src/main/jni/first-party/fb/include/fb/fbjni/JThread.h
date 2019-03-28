/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "CoreClasses.h"
#include "NativeRunnable.h"

namespace facebook {
namespace jni {

class JThread : public JavaClass<JThread> {
 public:
  static constexpr const char* kJavaDescriptor = "Ljava/lang/Thread;";

  void start() {
    static auto method = javaClassStatic()->getMethod<void()>("start");
    method(self());
  }

  void join() {
    static auto method = javaClassStatic()->getMethod<void()>("join");
    method(self());
  }

  static local_ref<JThread> create(std::function<void()>&& runnable) {
    auto jrunnable = JNativeRunnable::newObjectCxxArgs(std::move(runnable));
    return newInstance(static_ref_cast<JRunnable::javaobject>(jrunnable));
  }
};

}
}
