/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/Optional.h>
#include <folly/dynamic.h>
#include <fabric/graphics/Color.h>
#include <fabric/graphics/Geometry.h>
#include <fabric/graphics/conversions.h>

namespace facebook {
namespace react {

inline void fromDynamic(const folly::dynamic &value, bool &result) { result = value.getBool(); }
inline void fromDynamic(const folly::dynamic &value, int &result) {
  // All numbers from JS are treated as double, and JS cannot represent int64 in practice.
  // So this always converts the value to int64 instead.
  result = value.asInt();
}
inline void fromDynamic(const folly::dynamic &value, float &result) { result = (float)value.asDouble(); }
inline void fromDynamic(const folly::dynamic &value, double &result) { result = value.asDouble(); }
inline void fromDynamic(const folly::dynamic &value, std::string &result) { result = value.getString(); }

template <typename T>
inline void fromDynamic(const folly::dynamic &value, std::vector<T> &result) {
  if (!value.isArray()) {
    T itemResult;
    fromDynamic(value, itemResult);
    result = {itemResult};
    return;
  }

  result.clear();
  T itemResult;
  for (auto &itemValue : value) {
    fromDynamic(itemValue, itemResult);
    result.push_back(itemResult);
  }
}

template <typename T>
inline T convertRawProp(
  const RawProps &rawProps,
  const std::string &name,
  const T &sourceValue,
  const T &defaultValue = T()
) {
  const auto &iterator = rawProps.find(name);
  if (iterator == rawProps.end()) {
    return sourceValue;
  }

  const auto &value = iterator->second;

  // Special case: `null` always means `the prop was removed, use default value`.
  if (value.isNull()) {
    return defaultValue;
  }

  T result;
  fromDynamic(value, result);
  return result;
}

template <typename T>
inline static folly::Optional<T> convertRawProp(
  const RawProps &rawProps,
  const std::string &name,
  const folly::Optional<T> &sourceValue,
  const folly::Optional<T> &defaultValue = {}
) {
  const auto &iterator = rawProps.find(name);
  if (iterator == rawProps.end()) {
    return sourceValue;
  }

  const auto &value = iterator->second;

  // Special case: `null` always means `the prop was removed, use default value`.
  if (value.isNull()) {
    return defaultValue;
  }

  T result;
  fromDynamic(value, result);
  return result;
}

} // namespace react
} // namespace facebook
