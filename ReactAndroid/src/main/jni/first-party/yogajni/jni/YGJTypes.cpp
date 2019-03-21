/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include "YGJTypes.h"

using facebook::jni::alias_ref;
using facebook::jni::local_ref;

jfloat JYogaNode::baseline(jfloat width, jfloat height) {
  static auto javaMethod =
      javaClassLocal()->getMethod<jfloat(jfloat, jfloat)>("baseline");
  return javaMethod(self(), width, height);
}

jlong JYogaNode::measure(
    jfloat width,
    jint widthMode,
    jfloat height,
    jint heightMode) {
  static auto javaMethod =
      javaClassLocal()->getMethod<jlong(jfloat, jint, jfloat, jint)>("measure");
  return javaMethod(self(), width, widthMode, height, heightMode);
}

facebook::jni::local_ref<JYogaLogLevel> JYogaLogLevel::fromInt(jint logLevel) {
  static auto javaMethod =
      javaClassStatic()->getStaticMethod<alias_ref<JYogaLogLevel>(jint)>(
          "fromInt");
  return javaMethod(javaClassStatic(), logLevel);
}

void JYogaLogger::log(
    facebook::jni::alias_ref<JYogaNode> node,
    facebook::jni::alias_ref<JYogaLogLevel> logLevel,
    jstring message) {
  static auto javaMethod =
      javaClassLocal()
          ->getMethod<void(
              alias_ref<JYogaNode>, alias_ref<JYogaLogLevel>, jstring)>("log");
  javaMethod(self(), node, logLevel, message);
}
