/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <fb/log.h>
#include <fb/ThreadLocal.h>
#include <fb/Environment.h>
#include <fb/fbjni/CoreClasses.h>
#include <fb/fbjni/NativeRunnable.h>

#include <functional>

namespace facebook {
namespace jni {

namespace {

ThreadLocal<ThreadScope>& scopeStorage() {
  // We don't want the ThreadLocal to delete the ThreadScopes.
  static ThreadLocal<ThreadScope> scope([] (void*) {});
  return scope;
}

ThreadScope* currentScope() {
  return scopeStorage().get();
}

JavaVM* g_vm = nullptr;

struct EnvironmentInitializer {
  EnvironmentInitializer(JavaVM* vm) {
      FBASSERT(!g_vm);
      FBASSERT(vm);
      g_vm = vm;
  }
};

int getEnv(JNIEnv** env) {
  FBASSERT(g_vm);
  // g_vm->GetEnv() might not clear the env* in failure cases.
  *env = nullptr;
  return g_vm->GetEnv((void**)env, JNI_VERSION_1_6);
}

JNIEnv* attachCurrentThread() {
  JavaVMAttachArgs args{JNI_VERSION_1_6, nullptr, nullptr};
  JNIEnv* env = nullptr;
  auto result = g_vm->AttachCurrentThread(&env, &args);
  FBASSERT(result == JNI_OK);
  return env;
}
}

/* static */
void Environment::initialize(JavaVM* vm) {
  static EnvironmentInitializer init(vm);
}

/* static */
JNIEnv* Environment::current() {
  auto scope = currentScope();
  if (scope && scope->env_) {
    return scope->env_;
  }

  JNIEnv* env;
  if (getEnv(&env) != JNI_OK) {
    // If there's a ThreadScope in the stack, we should be attached and able to
    // retrieve a JNIEnv*.
    FBASSERT(!scope);

    // TODO(cjhopman): this should probably be a hard failure, too.
    FBLOGE("Unable to retrieve jni environment. Is the thread attached?");
  }
  return env;
}

/* static */
void Environment::detachCurrentThread() {
  FBASSERT(g_vm);
  // The thread shouldn't be detached while a ThreadScope is in the stack.
  FBASSERT(!currentScope());
  g_vm->DetachCurrentThread();
}

/* static */
JNIEnv* Environment::ensureCurrentThreadIsAttached() {
  auto scope = currentScope();
  if (scope && scope->env_) {
    return scope->env_;
  }

  JNIEnv* env;
  // We should be able to just get the JNIEnv* by just calling
  // AttachCurrentThread, but the spec is unclear (and using getEnv is probably
  // generally more reliable).
  auto result = getEnv(&env);
  // We don't know how to deal with anything other than JNI_OK or JNI_DETACHED.
  FBASSERT(result == JNI_OK || result == JNI_EDETACHED);
  if (result == JNI_EDETACHED) {
    // The thread should not be detached while a ThreadScope is in the stack.
    FBASSERT(!scope);
    env = attachCurrentThread();
  }
  FBASSERT(env);
  return env;
}

ThreadScope::ThreadScope() : ThreadScope(nullptr, internal::CacheEnvTag{}) {}

ThreadScope::ThreadScope(JNIEnv* env, internal::CacheEnvTag)
    : previous_(nullptr), env_(nullptr), attachedWithThisScope_(false) {
  auto& storage = scopeStorage();
  previous_ = storage.get();
  storage.reset(this);

  if (previous_ && previous_->env_) {
    FBASSERT(!env || env == previous_->env_);
    env = previous_->env_;
  }

  env_ = env;
  if (env_) {
    return;
  }

  // Check if the thread is attached by someone else.
  auto result = getEnv(&env);
  if (result == JNI_OK) {
    return;
  }

  // We don't know how to deal with anything other than JNI_OK or JNI_DETACHED.
  FBASSERT(result == JNI_EDETACHED);

  // If there's already a ThreadScope on the stack, then the thread should be attached.
  FBASSERT(!previous_);
  attachCurrentThread();
  attachedWithThisScope_ = true;
}

ThreadScope::~ThreadScope() {
  auto& storage = scopeStorage();
  // ThreadScopes should be destroyed in the reverse order they are created
  // (that is, just put them on the stack).
  FBASSERT(this == storage.get());
  storage.reset(previous_);
  if (attachedWithThisScope_) {
    Environment::detachCurrentThread();
  }
}

namespace {
struct JThreadScopeSupport : JavaClass<JThreadScopeSupport> {
  static auto constexpr kJavaDescriptor = "Lcom/facebook/jni/ThreadScopeSupport;";

  // These reinterpret_casts are a totally dangerous pattern. Don't use them. Use HybridData instead.
  static void runStdFunction(std::function<void()>&& func) {
    static auto method = javaClassStatic()->getStaticMethod<void(jlong)>("runStdFunction");
    method(javaClassStatic(), reinterpret_cast<jlong>(&func));
  }

  static void runStdFunctionImpl(alias_ref<JClass>, jlong ptr) {
    (*reinterpret_cast<std::function<void()>*>(ptr))();
  }

  static void OnLoad() {
    // We need the javaClassStatic so that the class lookup is cached and that
    // runStdFunction can be called from a ThreadScope-attached thread.
    javaClassStatic()->registerNatives({
        makeNativeMethod("runStdFunctionImpl", runStdFunctionImpl),
      });
  }
};
}

/* static */
void ThreadScope::OnLoad() {
  // These classes are required for ScopeWithClassLoader. Ensure they are looked up when loading.
  JThreadScopeSupport::OnLoad();
}

/* static */
void ThreadScope::WithClassLoader(std::function<void()>&& runnable) {
  // TODO(cjhopman): If the classloader is already available in this scope, we
  // shouldn't have to jump through java. It should be enough to check if the
  // attach state env* is set.
  ThreadScope ts;
  JThreadScopeSupport::runStdFunction(std::move(runnable));
}

} }

