/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <fabric/graphics/Color.h>
#include <fabric/graphics/Geometry.h>
#include <fabric/graphics/conversions.h>

namespace facebook {
namespace react {

inline bool boolFromDynamic(const folly::dynamic &value) { return value.getBool(); }
inline int intFromDynamic(const folly::dynamic &value) { return value.getInt(); }
inline Float floatFromDynamic(const folly::dynamic &value) { return value.getDouble(); }
inline std::string stringFromDynamic(const folly::dynamic &value) { return value.getString(); }

#define CONVERT_RAW_PROP_TEMPLATE(type, converter) \
inline static type convertRawProp(const RawProps &rawProps, const std::string &name, const type &defaultValue) { \
  auto &&iterator = rawProps.find(name); \
  if (iterator != rawProps.end()) { \
    return converter(iterator->second); \
  } else { \
    return defaultValue; \
  } \
} \
\
inline static folly::Optional<type> convertRawProp(const RawProps &rawProps, const std::string &name, const folly::Optional<type> &defaultValue) { \
  auto &&iterator = rawProps.find(name); \
  if (iterator != rawProps.end()) { \
    auto &&value = iterator->second; \
    if (value.isNull()) { \
      return {}; \
    } else { \
      return converter(value); \
    } \
  } else { \
    return defaultValue; \
  } \
}

inline void fromDynamic(const folly::dynamic &value, bool &result) { result = value.getBool(); }
inline void fromDynamic(const folly::dynamic &value, int &result) { result = value.getInt(); }
inline void fromDynamic(const folly::dynamic &value, std::string &result) { result = value.getString(); }

template <typename T>
inline T convertRawProp(const RawProps &rawProps, const std::string &name, const T &defaultValue) {
  auto &&iterator = rawProps.find(name);
  if (iterator != rawProps.end()) {
    T result = defaultValue;
    fromDynamic(iterator->second, result);
    return result;
  } else {
    return defaultValue;
  }
}

template <typename T>
inline static folly::Optional<T> convertRawProp(const RawProps &rawProps, const std::string &name, const folly::Optional<T> &defaultValue) {
  auto &&iterator = rawProps.find(name);
  if (iterator != rawProps.end()) {
    auto &&value = iterator->second;
    if (value.isNull()) {
      return defaultValue;
    } else {
      T result;
      fromDynamic(value, result);
      return result;
    }
  } else {
    return defaultValue;
  }
}

} // namespace react
} // namespace facebook
