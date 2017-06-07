// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <functional>

#include <jni.h>

using namespace facebook::jni;

namespace facebook {
namespace react {

class Runnable : public JavaClass<Runnable> {
public:
  static constexpr auto kJavaDescriptor = "Ljava/lang/Runnable;";
};

/**
 * The c++ interface for the Java NativeRunnable class
 */
class JNativeRunnable : public HybridClass<JNativeRunnable, Runnable> {
public:
  static auto constexpr kJavaDescriptor = "Lcom/facebook/react/bridge/queue/NativeRunnable;";

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

} }
