/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>

#include <jni.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

struct Runnable : public JavaClass<Runnable> {
 public:
  static constexpr auto kJavaDescriptor = "Ljava/lang/Runnable;";
};

/**
 * The c++ interface for the Java NativeRunnable class
 */
class JNativeRunnable : public HybridClass<JNativeRunnable, Runnable> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/bridge/queue/NativeRunnable;";

  void run() {
    m_runnable();
  }

  static void registerNatives() {
    javaClassStatic()->registerNatives({
        makeNativeMethod("run", JNativeRunnable::run),
    });
  }

 private:
  friend HybridBase;

  JNativeRunnable(std::function<void()> runnable)
      : m_runnable(std::move(runnable)) {}

  std::function<void()> m_runnable;
};

} // namespace react
} // namespace facebook
