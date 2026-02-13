/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <string>
#include <vector>

#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/Float.h>
#include <react/utils/hash_combine.h>

namespace facebook::react {

struct TextShadow {
  bool operator==(const TextShadow &other) const = default;

  Float offsetX{};
  Float offsetY{};
  Float blurRadius{};
  SharedColor color{};

#ifdef RN_SERIALIZABLE_STATE
  folly::dynamic toDynamic() const
  {
    folly::dynamic result = folly::dynamic::object();
    result["offsetX"] = offsetX;
    result["offsetY"] = offsetY;
    result["blurRadius"] = blurRadius;
    result["color"] = *color;
    return result;
  }
#endif
};

#ifdef RN_SERIALIZABLE_STATE
inline folly::dynamic toDynamic(const TextShadow &textShadow)
{
  return textShadow.toDynamic();
}
#endif

inline std::string toString(const TextShadow &textShadow)
{
  return "TextShadow{offsetX: " + std::to_string(textShadow.offsetX) +
      ", offsetY: " + std::to_string(textShadow.offsetY) +
      ", blurRadius: " + std::to_string(textShadow.blurRadius) +
      ", color: " + (textShadow.color ? textShadow.color.toString() : "none") + "}";
}

inline std::string toString(const std::vector<TextShadow> &textShadows)
{
  std::string result = "[";
  for (size_t i = 0; i < textShadows.size(); ++i) {
    if (i > 0) {
      result += ", ";
    }
    result += toString(textShadows[i]);
  }
  result += "]";
  return result;
}

} // namespace facebook::react

namespace std {

template <>
struct hash<facebook::react::TextShadow> {
  size_t operator()(const facebook::react::TextShadow &textShadow) const
  {
    return facebook::react::hash_combine(
        textShadow.offsetX, textShadow.offsetY, textShadow.blurRadius, textShadow.color);
  }
};

template <>
struct hash<std::vector<facebook::react::TextShadow>> {
  size_t operator()(const std::vector<facebook::react::TextShadow> &textShadows) const
  {
    size_t seed = 0;
    for (const auto &textShadow : textShadows) {
      facebook::react::hash_combine(seed, textShadow);
    }
    return seed;
  }
};

} // namespace std
