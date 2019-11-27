/**
 * Copyright 2018-present, Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once
#include <functional>
#include <string>
#include <jni.h>


namespace facebook {
namespace jni {

// Keeps a thread-local reference to the current thread's JNIEnv.
struct Environment {
  // Throws a std::runtime_error if this thread isn't attached to the JVM
  // TODO(T6594868) Benchmark against raw JNI access
  static JNIEnv* current();
  static void initialize(JavaVM* vm);

  // There are subtle issues with calling the next functions directly. It is
  // much better to always use a ThreadScope to manage attaching/detaching for
  // you.
  static JNIEnv* ensureCurrentThreadIsAttached();
};

namespace detail {

// This will return null the thread isn't attached to the VM, or if
// fbjni has never been initialized with a VM at all.  You probably
// shouldn't be using this.
JNIEnv* currentOrNull();

/**
 * If there's thread-local data, it's a pointer to one of these.  The
 * instance is a member of JniEnvCacher or ThreadScope, and lives on
 * the stack.
 */
struct TLData {
  // This is modified only by JniEnvCacher, and is guaranteed to be
  // valid if set, and refer to an env which originated from a JNI
  // call into C++.
  JNIEnv* env;
  // This is modified only by ThreadScope, and is set only if an
  // instance of ThreadScope which attached is on the stack.
  bool attached;
};

/**
 * RAII object which manages a cached JNIEnv* value.  A Value is only
 * cached if it is guaranteed safe, which means when C++ is called
 * from a registered fbjni function.
 */
class JniEnvCacher {
public:
  JniEnvCacher(JNIEnv* env);
  JniEnvCacher(JniEnvCacher&) = delete;
  JniEnvCacher(JniEnvCacher&&) = default;
  JniEnvCacher& operator=(JniEnvCacher&) = delete;
  JniEnvCacher& operator=(JniEnvCacher&&) = delete;
  ~JniEnvCacher();

private:
  // If this flag is set, then, this object needs to clear the cache.
  bool thisCached_;

  // The thread local pointer may point here.
  detail::TLData data_;
};

}

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
 *  - If fbjni has never been initialized, there will be no JavaVM object to attach with.
 *    In that case, a std::runtime_error will be thrown.  This is only likely to happen in a
 *    standalone C++ application, or if Environment::initialize is not used.
 */
class ThreadScope {
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
  // If this flag is set, then this object needs to detach.
  bool thisAttached_;

  // The thread local pointer may point here.
  detail::TLData data_;
};

}
}
