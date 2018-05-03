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
#include <fabric/graphics/graphicValuesConversions.h>

namespace facebook {
namespace react {

inline bool boolFromDynamic(const folly::dynamic &value) { return value.getBool(); }
inline int intFromDynamic(const folly::dynamic &value) { return value.getInt(); }
inline Float floatFromDynamic(const folly::dynamic &value) { return value.getDouble(); }
inline std::string stringFromDynamic(const folly::dynamic &value) { return value.getString(); }

#define APPLY_RAW_PROP_TEMPLATE(type, converter) \
inline static void applyRawProp(const RawProps &rawProps, const std::string &name, type &property) { \
  auto &&iterator = rawProps.find(name); \
  if (iterator != rawProps.end()) { \
    property = converter(iterator->second); \
  } \
} \
\
inline static void applyRawProp(const RawProps &rawProps, const std::string &name, folly::Optional<type> &property) { \
  auto &&iterator = rawProps.find(name); \
  if (iterator != rawProps.end()) { \
    auto &&value = iterator->second; \
    if (value.isNull()) { \
      property = {}; \
    } else { \
      property = converter(value); \
    } \
  } \
}

APPLY_RAW_PROP_TEMPLATE(bool, boolFromDynamic)
APPLY_RAW_PROP_TEMPLATE(int, intFromDynamic)
APPLY_RAW_PROP_TEMPLATE(Float, floatFromDynamic)
APPLY_RAW_PROP_TEMPLATE(std::string, stringFromDynamic)
APPLY_RAW_PROP_TEMPLATE(SharedColor, colorFromDynamic)
APPLY_RAW_PROP_TEMPLATE(Point, pointFromDynamic)
APPLY_RAW_PROP_TEMPLATE(Size, sizeFromDynamic)

} // namespace react
} // namespace facebook
