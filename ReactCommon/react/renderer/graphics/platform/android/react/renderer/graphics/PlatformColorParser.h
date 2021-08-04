/*
 * Copyright (c) Facebook, Inc. and its affiliates.
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

  if (value.hasType<better::map<std::string, std::vector<std::string>>>()) {
    auto map = (better::map<std::string, std::vector<std::string>>)value;
    auto resourcePaths = map["resource_paths"];
    auto dynamicResourcePaths = folly::dynamic::array();
    for (const auto &resourcePath : resourcePaths) {
      dynamicResourcePaths.push_back(resourcePath);
    }
    folly::dynamic dynamicPlatformColor = folly::dynamic::object();
    dynamicPlatformColor["resource_paths"] = dynamicResourcePaths;

    auto fabricUIManager =
        context.contextContainer.at<jni::global_ref<jobject>>(
            "FabricUIManager");

    static auto getColorFromJava =
        facebook::jni::findClassStatic(
            "com/facebook/react/fabric/FabricUIManager")
            ->getMethod<jint(jint, ReadableMap::javaobject)>("getColor");

    jni::local_ref<ReadableNativeMap::javaobject> dynamicPlatformColorRNM =
        ReadableNativeMap::newObjectCxxArgs(dynamicPlatformColor);
    jni::local_ref<ReadableMap::javaobject> dynamicPlatformColorRM =
        jni::make_local(reinterpret_cast<ReadableMap::javaobject>(
            dynamicPlatformColorRNM.get()));

    auto color = getColorFromJava(
        fabricUIManager, context.surfaceId, dynamicPlatformColorRM.get());

    dynamicPlatformColorRM.reset();
    dynamicPlatformColorRNM.reset();

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
