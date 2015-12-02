/*
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include <pthread.h>
#include <fb/log.h>
#include <fb/StaticInitialized.h>
#include <fb/ThreadLocal.h>
#include <jni/Environment.h>

namespace facebook {
namespace jni {

static StaticInitialized<ThreadLocal<JNIEnv>> g_env;
static JavaVM* g_vm = nullptr;

/* static */
JNIEnv* Environment::current() {
  JNIEnv* env = g_env->get();
  if ((env == nullptr) && (g_vm != nullptr)) {
    if (g_vm->GetEnv((void**) &env, JNI_VERSION_1_6) != JNI_OK) {
      FBLOGE("Error retrieving JNI Environment, thread is probably not attached to JVM");
      env = nullptr;
    } else {
      g_env->reset(env);
    }
  }
  return env;
}

/* static */
void Environment::detachCurrentThread() {
  auto env = g_env->get();
  if (env) {
    FBASSERT(g_vm);
    g_vm->DetachCurrentThread();
    g_env->reset();
  }
}

struct EnvironmentInitializer {
  EnvironmentInitializer(JavaVM* vm) {
      FBASSERT(!g_vm);
      FBASSERT(vm);
      g_vm = vm;
      g_env.initialize([] (void*) {});
  }
};

/* static */
void Environment::initialize(JavaVM* vm) {
  static EnvironmentInitializer init(vm);
}

/* static */
JNIEnv* Environment::ensureCurrentThreadIsAttached() {
  auto env = g_env->get();
  if (!env) {
    FBASSERT(g_vm);
    g_vm->AttachCurrentThread(&env, nullptr);
    g_env->reset(env);
  }
  return env;
}

ThreadScope::ThreadScope()
    : attachedWithThisScope_(false) {
  JNIEnv* env = nullptr;
  if (g_vm->GetEnv((void**) &env, JNI_VERSION_1_6) != JNI_EDETACHED) {
    return;
  }
  env = facebook::jni::Environment::ensureCurrentThreadIsAttached();
  FBASSERT(env);
  attachedWithThisScope_ = true;
}

ThreadScope::~ThreadScope() {
  if (attachedWithThisScope_) {
    Environment::detachCurrentThread();
  }
}

} }

