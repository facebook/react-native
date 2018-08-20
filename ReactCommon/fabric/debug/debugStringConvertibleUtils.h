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
#include <folly/Optional.h>

namespace facebook {
namespace react {

inline std::string toString(const std::string &value) { return value; }
inline std::string toString(const int &value) { return folly::to<std::string>(value); }
inline std::string toString(const bool &value) { return folly::to<std::string>(value); }
inline std::string toString(const float &value) { return folly::to<std::string>(value); }
inline std::string toString(const double &value) { return folly::to<std::string>(value); }

template <typename T>
inline SharedDebugStringConvertible debugStringConvertibleItem(std::string name, T value, T defaultValue = {}) {
  if (value == defaultValue) {
    return nullptr;
  }

  return std::make_shared<DebugStringConvertibleItem>(name, toString(value));
}

template <typename T>
inline SharedDebugStringConvertible debugStringConvertibleItem(std::string name, folly::Optional<T> value, T defaultValue = {}) {
  if (!value.hasValue()) {
    return nullptr;
  }

  return debugStringConvertibleItem(name, value.value_or(defaultValue), defaultValue);
}

inline SharedDebugStringConvertibleList operator+(const SharedDebugStringConvertibleList &lhs, const SharedDebugStringConvertibleList &rhs) {
  SharedDebugStringConvertibleList result = {};
  std::move(lhs.begin(), lhs.end(), std::back_inserter(result));
  std::move(rhs.begin(), rhs.end(), std::back_inserter(result));
  return result;
}

inline SharedDebugStringConvertible debugStringConvertibleItem(std::string name, DebugStringConvertible value, std::string defaultValue) {
  return debugStringConvertibleItem(name, value.getDebugDescription(), defaultValue);
}

} // namespace react
} // namespace facebook
