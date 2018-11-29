/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jni.h>

#include <fb/Countable.h>
#include <fb/RefPtr.h>
#include <fb/visibility.h>

namespace facebook {
namespace jni {

FBEXPORT const RefPtr<Countable>& countableFromJava(JNIEnv* env, jobject obj);

template <typename T> RefPtr<T> extractRefPtr(JNIEnv* env, jobject obj) {
  return static_cast<RefPtr<T>>(countableFromJava(env, obj));
}

template <typename T> RefPtr<T> extractPossiblyNullRefPtr(JNIEnv* env, jobject obj) {
  return obj ? extractRefPtr<T>(env, obj) : nullptr;
}

FBEXPORT void setCountableForJava(JNIEnv* env, jobject obj, RefPtr<Countable>&& countable);

void CountableOnLoad(JNIEnv* env);

} }

