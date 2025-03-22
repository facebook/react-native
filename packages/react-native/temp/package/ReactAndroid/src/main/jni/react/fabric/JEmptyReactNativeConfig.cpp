/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JEmptyReactNativeConfig.h"
#include <fbjni/fbjni.h>
#include <react/config/ReactNativeConfig.h>

namespace facebook::react {

jni::local_ref<JEmptyReactNativeConfig::jhybriddata>
JEmptyReactNativeConfig::initHybrid(jni::alias_ref<jclass>) {
  return makeCxxInstance();
}

jboolean JEmptyReactNativeConfig::getBool(const jni::alias_ref<jstring> param) {
  return reactNativeConfig_.getBool(param->toStdString());
}

jni::local_ref<jstring> JEmptyReactNativeConfig::getString(
    const jni::alias_ref<jstring> param) {
  return jni::make_jstring(reactNativeConfig_.getString(param->toStdString()));
}

jlong JEmptyReactNativeConfig::getInt64(const jni::alias_ref<jstring> param) {
  return reactNativeConfig_.getInt64(param->toStdString());
}

jdouble JEmptyReactNativeConfig::getDouble(
    const jni::alias_ref<jstring> param) {
  return reactNativeConfig_.getDouble(param->toStdString());
}

void JEmptyReactNativeConfig::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", JEmptyReactNativeConfig::initHybrid),
      makeNativeMethod("getBool", JEmptyReactNativeConfig::getBool),
      makeNativeMethod("getString", JEmptyReactNativeConfig::getString),
      makeNativeMethod("getInt64", JEmptyReactNativeConfig::getInt64),
      makeNativeMethod("getDouble", JEmptyReactNativeConfig::getDouble),
  });
}

} // namespace facebook::react
