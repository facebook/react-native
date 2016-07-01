/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#pragma once
#include <functional>
#include <string>
#include <jni.h>

#include <fb/visibility.h>

namespace facebook {
namespace jni {

// Keeps a thread-local reference to the current thread's JNIEnv.
struct Environment {
  // May be null if this thread isn't attached to the JVM
  FBEXPORT static JNIEnv* current();
  static void initialize(JavaVM* vm);

  // There are subtle issues with calling the next functions directly. It is
  // much better to always use a ThreadScope to manage attaching/detaching for
  // you.
  FBEXPORT static JNIEnv* ensureCurrentThreadIsAttached();
  FBEXPORT static void detachCurrentThread();
};

/**
 * RAII Object that attaches a thread to the JVM. Failing to detach from a thread before it
 * exits will cause a crash, as will calling Detach an extra time, and this guard class helps
 * keep that straight. In addition, it remembers whether it performed the attach or not, so it
 * is safe to nest it with itself or with non-fbjni code that manages the attachment correctly.
 *
 * Potential concerns:
 *  - Attaching to the JVM is fast (~100us on MotoG), but ideally you would attach while the
 *    app is not busy.
 *  - Having a thread detach at arbitrary points is not safe in Dalvik; you need to be sure that
 *    there is no Java code on the current stack or you run the risk of a crash like:
 *      ERROR: detaching thread with interp frames (count=18)
 *    (More detail at https://groups.google.com/forum/#!topic/android-ndk/2H8z5grNqjo)
 *    ThreadScope won't do a detach if the thread was already attached before the guard is
 *    instantiated, but there's probably some usage that could trip this up.
 *  - Newly attached C++ threads only get the bootstrap class loader -- i.e. java language
 *    classes, not any of our application's classes. This will be different behavior than threads
 *    that were initiated on the Java side. A workaround is to pass a global reference for a
 *    class or instance to the new thread; this bypasses the need for the class loader.
 *    (See http://docs.oracle.com/javase/7/docs/technotes/guides/jni/spec/invocation.html#attach_current_thread)
 *    If you need access to the application's classes, you can use ThreadScope::WithClassLoader.
 */
class FBEXPORT ThreadScope {
 public:
  ThreadScope();
  ThreadScope(ThreadScope&) = delete;
  ThreadScope(ThreadScope&&) = default;
  ThreadScope& operator=(ThreadScope&) = delete;
  ThreadScope& operator=(ThreadScope&&) = delete;
  ~ThreadScope();

  /**
   * This runs the closure in a scope with fbjni's classloader. This should be
   * the same classloader as the rest of the application and thus anything
   * running in the closure will have access to the same classes as in a normal
   * java-create thread.
   */
  static void WithClassLoader(std::function<void()>&& runnable);

  static void OnLoad();
 private:
  bool attachedWithThisScope_;
};
}
}
