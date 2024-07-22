/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <folly/container/EvictingCacheMap.h>
#include <react/renderer/core/RawValue.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/fromRawValueShared.h>
#include <react/utils/ContextContainer.h>
#include <react/utils/hash_combine.h>
#include <unordered_map>
#include <vector>

namespace facebook::react {

static size_t hashGetColourArguments(
    int32_t surfaceId,
    const std::vector<std::string>& resourcePaths) {
  std::size_t seed = surfaceId;
  for (const auto& item : resourcePaths) {
    facebook::react::hash_combine(seed, item);
  }
  return seed;
}

inline SharedColor parsePlatformColor(
    const ContextContainer& contextContainer,
    int32_t surfaceId,
    const RawValue& value) {
  ColorComponents colorComponents = {0, 0, 0, 0};

  if (value.hasType<
          std::unordered_map<std::string, std::vector<std::string>>>()) {
    auto map = (std::unordered_map<std::string, std::vector<std::string>>)value;
    auto& resourcePaths = map["resource_paths"];

    // JNI calls are time consuming. Let's cache results here to avoid
    // unnecessary calls.
    static auto getColorCache =
        folly::EvictingCacheMap<size_t, ColorComponents>(64);

    auto hash = hashGetColourArguments(surfaceId, resourcePaths);
    auto iterator = getColorCache.find(hash);

    if (iterator != getColorCache.end()) {
      colorComponents = iterator->second;
    } else {
      const auto& fabricUIManager =
          contextContainer.at<jni::global_ref<jobject>>("FabricUIManager");
      static auto getColorFromJava =
          fabricUIManager->getClass()
              ->getMethod<jint(jint, jni::JArrayClass<jni::JString>)>(
                  "getColor");
      auto javaResourcePaths =
          jni::JArrayClass<jni::JString>::newArray(resourcePaths.size());

      for (int i = 0; i < resourcePaths.size(); i++) {
        javaResourcePaths->setElement(i, *jni::make_jstring(resourcePaths[i]));
      }
      auto color =
          getColorFromJava(fabricUIManager, surfaceId, *javaResourcePaths);

      auto argb = (int64_t)color;
      auto ratio = 255.f;

      colorComponents.alpha = ((argb >> 24) & 0xFF) / ratio;
      colorComponents.red = ((argb >> 16) & 0xFF) / ratio;
      colorComponents.green = ((argb >> 8) & 0xFF) / ratio;
      colorComponents.blue = (argb & 0xFF) / ratio;

      getColorCache.set(hash, colorComponents);
    }
  }

  return {colorFromComponents(colorComponents)};
}

inline void fromRawValue(
    const ContextContainer& contextContainer,
    int32_t surfaceId,
    const RawValue& value,
    SharedColor& result) {
  fromRawValueShared(
      contextContainer, surfaceId, value, result, parsePlatformColor);
}

} // namespace facebook::react
