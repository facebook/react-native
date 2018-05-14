/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>
#include <limits>
#include <memory>
#include <vector>

#include <fabric/debug/DebugStringConvertible.h>
#include <fabric/debug/DebugStringConvertibleItem.h>
#include <folly/Conv.h>

namespace facebook {
namespace react {

template <typename T>
inline SharedDebugStringConvertible debugStringConvertibleItem(std::string name, T value, T defaultValue = {}) {
  if (value == defaultValue) {
    return nullptr;
  }

  return std::make_shared<DebugStringConvertibleItem>(name, toString(value));
}

template <typename T>
inline SharedDebugStringConvertible debugStringConvertibleItem(std::string name, folly::Optional<T> value, T defaultValue = {}) {
  if (!value.has_value()) {
    return nullptr;
  }
  return debugStringConvertibleItem(name, value.value_or(defaultValue), defaultValue);
}

SharedDebugStringConvertibleList operator+(const SharedDebugStringConvertibleList &lhs, const SharedDebugStringConvertibleList &rhs);
SharedDebugStringConvertible debugStringConvertibleItem(std::string name, DebugStringConvertible value, std::string defaultValue = "");

#define IS_EQUAL(a, b) ((a) == (b))
#define IS_EQUAL_FLOAT(a, b) ((isnan(a) == isnan(b)) || ((a) == (b)))

#define DEBUG_STRING_CONVERTIBLE_TEMPLATE(type, converter) \
DEBUG_STRING_CONVERTIBLE_TEMPLATE_EX(type, converter, {}, IS_EQUAL)

#define DEBUG_STRING_CONVERTIBLE_TEMPLATE_EX(type, converter, defaults, comparator) \
inline SharedDebugStringConvertible debugStringConvertibleItem(std::string name, type value, type defaultValue = defaults) { \
  if (comparator(value, defaultValue)) { \
    return nullptr; \
  } \
  return std::make_shared<DebugStringConvertibleItem>(name, converter(value)); \
} \
\
inline SharedDebugStringConvertible debugStringConvertibleItem(std::string name, folly::Optional<type> value, type defaultValue = defaults) { \
  if (value.has_value()) { \
    return nullptr; \
  } \
  return debugStringConvertibleItem(name, value.value_or(defaultValue), defaultValue); \
}

DEBUG_STRING_CONVERTIBLE_TEMPLATE(std::string, )
DEBUG_STRING_CONVERTIBLE_TEMPLATE(int, folly::to<std::string>)
DEBUG_STRING_CONVERTIBLE_TEMPLATE(bool, folly::to<std::string>)
DEBUG_STRING_CONVERTIBLE_TEMPLATE_EX(float, folly::to<std::string>, std::numeric_limits<float>::quiet_NaN(), IS_EQUAL_FLOAT)
DEBUG_STRING_CONVERTIBLE_TEMPLATE_EX(double, folly::to<std::string>, std::numeric_limits<float>::quiet_NaN(), IS_EQUAL_FLOAT)

} // namespace react
} // namespace facebook
