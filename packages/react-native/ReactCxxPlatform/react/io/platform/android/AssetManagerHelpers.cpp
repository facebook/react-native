/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "AssetManagerHelpers.h"

#include <android/asset_manager_jni.h>
#include <react/jni/JniHelper.h>

namespace facebook::react {

jobject getAssetManagerObject(JNIEnv* env) {
  auto contextObject = getApplication(env);
  auto contextClass = env->GetObjectClass(contextObject);
  auto getAssetsMethod = env->GetMethodID(
      contextClass, "getAssets", "()Landroid/content/res/AssetManager;");
  return env->CallObjectMethod(contextObject, getAssetsMethod);
}

AAssetManager* getJavaAssetManager() {
  auto env = facebook::jni::Environment::ensureCurrentThreadIsAttached();
  auto AssetManagerObject = getAssetManagerObject(env);
  return AAssetManager_fromJava(env, AssetManagerObject);
}

bool isDirectoryNotEmpty(const std::string& path) {
  auto env = facebook::jni::Environment::ensureCurrentThreadIsAttached();
  auto AssetManagerObject = getAssetManagerObject(env);
  auto listMethodID = env->GetMethodID(
      env->GetObjectClass(AssetManagerObject),
      "list",
      "(Ljava/lang/String;)[Ljava/lang/String;");

  auto pathString = env->NewStringUTF(path.c_str());
  auto filesObject = static_cast<jobjectArray>(
      env->CallObjectMethod(AssetManagerObject, listMethodID, pathString));
  env->DeleteLocalRef(pathString);

  auto length = env->GetArrayLength(filesObject);
  for (int i = 0; i < length; i++) {
    auto jstr =
        static_cast<jstring>(env->GetObjectArrayElement(filesObject, i));

    const char* filename = env->GetStringUTFChars(jstr, nullptr);

    if (filename != nullptr) {
      env->ReleaseStringUTFChars(jstr, filename);
      env->DeleteLocalRef(jstr);
      return true;
    }

    env->DeleteLocalRef(jstr);
  }
  return false;
}

} // namespace facebook::react
