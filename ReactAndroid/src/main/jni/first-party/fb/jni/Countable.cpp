/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <cstdint>
#include <jni/Countable.h>
#include <fb/Environment.h>
#include <jni/Registration.h>

namespace facebook {
namespace jni {

static jfieldID gCountableNativePtr;

static RefPtr<Countable>* rawCountableFromJava(JNIEnv* env, jobject obj) {
  FBASSERT(obj);
  return reinterpret_cast<RefPtr<Countable>*>(env->GetLongField(obj, gCountableNativePtr));
}

const RefPtr<Countable>& countableFromJava(JNIEnv* env, jobject obj) {
  FBASSERT(obj);
  return *rawCountableFromJava(env, obj);
}

void setCountableForJava(JNIEnv* env, jobject obj, RefPtr<Countable>&& countable) {
  int oldValue = env->GetLongField(obj, gCountableNativePtr);
  FBASSERTMSGF(oldValue == 0, "Cannot reinitialize object; expected nullptr, got %x", oldValue);

  FBASSERT(countable);
  uintptr_t fieldValue = (uintptr_t) new RefPtr<Countable>(std::move(countable));
  env->SetLongField(obj, gCountableNativePtr, fieldValue);
}

/**
 * NB: THREAD SAFETY (this comment also exists at Countable.java)
 *
 * This method deletes the corresponding native object on whatever thread the method is called
 * on. In the common case when this is called by Countable#finalize(), this will be called on the
 * system finalizer thread. If you manually call dispose on the Java object, the native object 
 * will be deleted synchronously on that thread.
 */
void dispose(JNIEnv* env, jobject obj) {
  // Grab the pointer
  RefPtr<Countable>* countable = rawCountableFromJava(env, obj);
  if (!countable) {
    // That was easy.
    return;
  }

  // Clear out the old value to avoid double-frees
  env->SetLongField(obj, gCountableNativePtr, 0);

  delete countable;
}

void CountableOnLoad(JNIEnv* env) {
  jclass countable = env->FindClass("com/facebook/jni/Countable");
  gCountableNativePtr = env->GetFieldID(countable, "mInstance", "J");
  registerNatives(env, countable, {
    { "dispose", "()V", (void*) dispose },
  });
}

} }
