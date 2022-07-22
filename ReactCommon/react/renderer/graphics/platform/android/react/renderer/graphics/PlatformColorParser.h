/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/graphics/ColorComponents.h>

namespace facebook {
namespace react {

inline ColorComponents parsePlatformColor(
    const PropsParserContext &context,
    const RawValue &value) {
  ColorComponents colorComponents = {0, 0, 0, 0};

  if (value.hasType<butter::map<std::string, std::vector<std::string>>>()) {
    const auto &fabricUIManager =
        context.contextContainer.at<jni::global_ref<jobject>>(
            "FabricUIManager");
    static auto getColorFromJava =
        fabricUIManager->getClass()
            ->getMethod<jint(jint, jni::JArrayClass<jni::JString>)>("getColor");

    auto map = (butter::map<std::string, std::vector<std::string>>)value;
    auto &resourcePaths = map["resource_paths"];

    auto javaResourcePaths =
        jni::JArrayClass<jni::JString>::newArray(resourcePaths.size());
    for (int i = 0; i < resourcePaths.size(); i++) {
      javaResourcePaths->setElement(i, *jni::make_jstring(resourcePaths[i]));
    }
    auto color = getColorFromJava(
        fabricUIManager, context.surfaceId, *javaResourcePaths);

    auto argb = (int64_t)color;
    auto ratio = 255.f;
    colorComponents.alpha = ((argb >> 24) & 0xFF) / ratio;
    colorComponents.red = ((argb >> 16) & 0xFF) / ratio;
    colorComponents.green = ((argb >> 8) & 0xFF) / ratio;
    colorComponents.blue = (argb & 0xFF) / ratio;
  }

  return colorComponents;
}

} // namespace react
} // namespace facebook
