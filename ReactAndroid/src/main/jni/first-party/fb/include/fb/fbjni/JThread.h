/*
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
