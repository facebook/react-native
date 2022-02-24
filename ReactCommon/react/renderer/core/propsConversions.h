/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <butter/optional.h>
#include <folly/Likely.h>
#include <folly/dynamic.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/Geometry.h>
#include <react/renderer/graphics/conversions.h>

namespace facebook {
namespace react {

template <typename T>
void fromRawValue(
    const PropsParserContext &context,
    RawValue const &rawValue,
    T &result) {
  result = (T)rawValue;
}

template <typename T>
void fromRawValue(
    const PropsParserContext &context,
    RawValue const &rawValue,
    std::vector<T> &result) {
  if (rawValue.hasType<std::vector<RawValue>>()) {
    auto items = (std::vector<RawValue>)rawValue;
    auto length = items.size();
    result.clear();
    result.reserve(length);
    for (size_t i = 0; i < length; i++) {
      T itemResult;
      fromRawValue(context, items.at(i), itemResult);
      result.push_back(itemResult);
    }
    return;
  }

  // The case where `value` is not an array.
  result.clear();
  result.reserve(1);
  T itemResult;
  fromRawValue(context, rawValue, itemResult);
  result.push_back(itemResult);
}

template <typename T>
void fromRawValue(
    const PropsParserContext &context,
    RawValue const &rawValue,
    std::vector<std::vector<T>> &result) {
  if (rawValue.hasType<std::vector<std::vector<RawValue>>>()) {
    auto items = (std::vector<std::vector<RawValue>>)rawValue;
    auto length = items.size();
    result.clear();
    result.reserve(length);
    for (int i = 0; i < length; i++) {
      T itemResult;
      fromRawValue(context, items.at(i), itemResult);
      result.push_back(itemResult);
    }
    return;
  }

  // The case where `value` is not an array.
  result.clear();
  result.reserve(1);
  T itemResult;
  fromRawValue(context, rawValue, itemResult);
  result.push_back(itemResult);
}

template <typename T, typename U = T>
T convertRawProp(
    const PropsParserContext &context,
    RawProps const &rawProps,
    char const *name,
    T const &sourceValue,
    U const &defaultValue,
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
  fromRawValue(context, *rawValue, result);
  return result;
}

template <typename T>
static butter::optional<T> convertRawProp(
    const PropsParserContext &context,
    RawProps const &rawProps,
    char const *name,
    butter::optional<T> const &sourceValue,
    butter::optional<T> const &defaultValue,
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
  fromRawValue(context, *rawValue, result);
  return butter::optional<T>{result};
}

} // namespace react
} // namespace facebook
