/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ReactNativeConfigHolder.h"

#include <fbjni/fbjni.h>

using namespace facebook::react;

bool ReactNativeConfigHolder::getBool(const std::string &param) const {
  static const auto method = facebook::jni::findClassStatic(
                                 "com/facebook/react/fabric/ReactNativeConfig")
                                 ->getMethod<jboolean(jstring)>("getBool");
  return method(reactNativeConfig_, facebook::jni::make_jstring(param).get());
}

std::string ReactNativeConfigHolder::getString(const std::string &param) const {
  static const auto method = facebook::jni::findClassStatic(
                                 "com/facebook/react/fabric/ReactNativeConfig")
                                 ->getMethod<jstring(jstring)>("getString");
  return method(reactNativeConfig_, facebook::jni::make_jstring(param).get())
      ->toString();
}

int64_t ReactNativeConfigHolder::getInt64(const std::string &param) const {
  static const auto method = facebook::jni::findClassStatic(
                                 "com/facebook/react/fabric/ReactNativeConfig")
                                 ->getMethod<jlong(jstring)>("getInt64");
  return method(reactNativeConfig_, facebook::jni::make_jstring(param).get());
}

double ReactNativeConfigHolder::getDouble(const std::string &param) const {
  static const auto method = facebook::jni::findClassStatic(
                                 "com/facebook/react/fabric/ReactNativeConfig")
                                 ->getMethod<jdouble(jstring)>("getDouble");
  return method(reactNativeConfig_, facebook::jni::make_jstring(param).get());
}
