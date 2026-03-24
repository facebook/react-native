/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "configurePlatformColorCacheInvalidationHook.h"

#include <fbjni/fbjni.h>
#include <folly/container/EvictingCacheMap.h>
#include <react/renderer/core/RawValue.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/fromRawValueShared.h>
#include <react/utils/ContextContainer.h>
#include <functional>
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>

namespace facebook::react {

inline size_t hashGetColourArguments(int32_t surfaceId, const std::vector<std::string> &resourcePaths)
{
  size_t seed = std::hash<int32_t>{}(surfaceId);
  for (const auto &path : resourcePaths) {
    seed ^= std::hash<std::string>{}(path) + 0x9e3779b9 + (seed << 6) + (seed >> 2);
  }
  return seed;
}

inline SharedColor
parsePlatformColor(const ContextContainer &contextContainer, int32_t surfaceId, const RawValue &value)
{
  Color color = 0;
  if (value.hasType<std::unordered_map<std::string, std::vector<std::string>>>()) {
    auto map = (std::unordered_map<std::string, std::vector<std::string>>)value;
    auto &resourcePaths = map["resource_paths"];

    // JNI calls are time consuming. Let's cache results here to avoid
    // unnecessary calls.
    static std::mutex getColorCacheMutex;
    static folly::EvictingCacheMap<size_t, Color> getColorCache(64);

    // Listen for appearance changes, which should invalidate the cache
    static std::once_flag setupCacheInvalidation;
    std::call_once(setupCacheInvalidation, configurePlatformColorCacheInvalidationHook, [&] {
      std::scoped_lock lock(getColorCacheMutex);
      getColorCache.clear();
    });

    auto hash = hashGetColourArguments(surfaceId, resourcePaths);
    {
      std::scoped_lock lock(getColorCacheMutex);
      auto iterator = getColorCache.find(hash);
      if (iterator != getColorCache.end()) {
        color = iterator->second;
      } else {
        const auto &fabricUIManager = contextContainer.at<jni::global_ref<jobject>>("FabricUIManager");
        static auto getColorFromJava =
            fabricUIManager->getClass()->getMethod<jint(jint, jni::JArrayClass<jni::JString>)>("getColor");
        auto javaResourcePaths = jni::JArrayClass<jni::JString>::newArray(resourcePaths.size());

        for (int i = 0; i < resourcePaths.size(); i++) {
          javaResourcePaths->setElement(i, *jni::make_jstring(resourcePaths[i]));
        }
        color = getColorFromJava(fabricUIManager, surfaceId, *javaResourcePaths);
        getColorCache.set(hash, color);
      }
    }
  }

  return color;
}

inline void
fromRawValue(const ContextContainer &contextContainer, int32_t surfaceId, const RawValue &value, SharedColor &result)
{
  fromRawValueShared(contextContainer, surfaceId, value, result, parsePlatformColor);
}

} // namespace facebook::react
