/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fbjni/Context.h>
#include <fbjni/fbjni.h>

namespace facebook::react {

jobject getApplication(JNIEnv* env) {
  auto activityThreadClass = env->FindClass("android/app/ActivityThread");
  auto currentApplicationMethodID = env->GetStaticMethodID(
      activityThreadClass, "currentApplication", "()Landroid/app/Application;");
  return env->CallStaticObjectMethod(
      activityThreadClass, currentApplicationMethodID);
}

jni::alias_ref<jni::AContext> getContext() {
  auto env = facebook::jni::Environment::ensureCurrentThreadIsAttached();
  auto application = getApplication(env);
  return facebook::jni::wrap_alias(
      static_cast<facebook::jni::AContext::javaobject>(application));
}

} // namespace facebook::react
