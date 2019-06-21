/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/optional.h>
#include <folly/Likely.h>
#include <folly/dynamic.h>
#include <react/core/RawProps.h>
#include <react/graphics/Color.h>
#include <react/graphics/Geometry.h>
#include <react/graphics/conversions.h>

namespace facebook {
namespace react {

template <typename T>
void fromRawValue(RawValue const &rawValue, T &result) {
  result = (T)rawValue;
}

template <typename T>
void fromRawValue(RawValue const &rawValue, std::vector<T> &result) {
  if (rawValue.hasType<std::vector<RawValue>>()) {
    auto items = (std::vector<RawValue>)rawValue;
    auto length = items.size();
    result.clear();
    result.reserve(length);
    for (int i = 0; i < length; i++) {
      T itemResult;
      fromRawValue(items.at(i), itemResult);
      result.push_back(itemResult);
    }
    return;
  }

  // The case where `value` is not an array.
  result.clear();
  result.reserve(1);
  T itemResult;
  fromRawValue(rawValue, itemResult);
  result.push_back(itemResult);
}

template <typename T, typename U = T>
T convertRawProp(
    RawProps const &rawProps,
    char const *name,
    T const &sourceValue,
    U const &defaultValue = U(),
    char const *namePrefix = nullptr,
    char const *nameSuffix = nullptr) {
  const auto *rawValue = rawProps.at(name, namePrefix, nameSuffix);

  if (LIKELY(rawValue == nullptr)) {
    return sourceValue;
  }

  // Special case: `null` always means "the prop was removed, use default
  // value".
  if (UNLIKELY(!rawValue->hasValue())) {
    return defaultValue;
  }

  T result;
  fromRawValue(*rawValue, result);
  return result;
}

template <typename T>
static better::optional<T> convertRawProp(
    RawProps const &rawProps,
    char const *name,
    better::optional<T> const &sourceValue,
    better::optional<T> const &defaultValue = {},
    char const *namePrefix = nullptr,
    char const *nameSuffix = nullptr) {
  const auto *rawValue = rawProps.at(name, namePrefix, nameSuffix);

  if (LIKELY(rawValue == nullptr)) {
    return sourceValue;
  }

  // Special case: `null` always means `the prop was removed, use default
  // value`.
  if (UNLIKELY(!rawValue->hasValue())) {
    return defaultValue;
  }

  T result;
  fromRawValue(*rawValue, result);
  return better::optional<T>{result};
}

} // namespace react
} // namespace facebook
