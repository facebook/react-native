/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ReactNativeConfigJni.h"
#include <fbjni/fbjni.h>
#include <react/config/ReactNativeConfig.h>

namespace facebook::react {

jni::local_ref<ReactNativeConfigJni::jhybriddata>
ReactNativeConfigJni::initHybrid(jni::alias_ref<jclass>) {
  return makeCxxInstance();
}

jboolean ReactNativeConfigJni::getBool(const jni::alias_ref<jstring> param) {
  return reactNativeConfig_.getBool(param->toStdString());
}

jni::local_ref<jstring> ReactNativeConfigJni::getString(
    const jni::alias_ref<jstring> param) {
  return jni::make_jstring(reactNativeConfig_.getString(param->toStdString()));
}

jlong ReactNativeConfigJni::getInt64(const jni::alias_ref<jstring> param) {
  return reactNativeConfig_.getInt64(param->toStdString());
}

jdouble ReactNativeConfigJni::getDouble(const jni::alias_ref<jstring> param) {
  return reactNativeConfig_.getDouble(param->toStdString());
}

void ReactNativeConfigJni::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", ReactNativeConfigJni::initHybrid),
      makeNativeMethod("getBool", ReactNativeConfigJni::getBool),
      makeNativeMethod("getString", ReactNativeConfigJni::getString),
      makeNativeMethod("getInt64", ReactNativeConfigJni::getInt64),
      makeNativeMethod("getDouble", ReactNativeConfigJni::getDouble),
  });
}

} // namespace facebook::react
