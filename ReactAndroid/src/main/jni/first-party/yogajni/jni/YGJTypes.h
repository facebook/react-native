/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the LICENSE
 * file in the root directory of this source tree.
 */
#include <fb/fbjni.h>
#include <yoga/YGValue.h>

struct JYogaNode : public facebook::jni::JavaClass<JYogaNode> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/yoga/YogaNodeJNIBase;";

  jfloat baseline(jfloat width, jfloat height);
  jlong measure(jfloat width, jint widthMode, jfloat height, jint heightMode);
};

struct JYogaLogLevel : public facebook::jni::JavaClass<JYogaLogLevel> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/yoga/YogaLogLevel;";

  static facebook::jni::local_ref<JYogaLogLevel> fromInt(jint);
};

struct JYogaLogger : public facebook::jni::JavaClass<JYogaLogger> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/yoga/YogaLogger";

  void log(
      facebook::jni::alias_ref<JYogaNode>,
      facebook::jni::alias_ref<JYogaLogLevel>,
      jstring);
};
