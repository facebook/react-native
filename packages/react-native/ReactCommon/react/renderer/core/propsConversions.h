/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>

#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/RawPropsKey.h>
#include <react/renderer/core/graphicsConversions.h>

namespace facebook::react {

/**
 * Use this only when a prop update has definitely been sent from JS;
 * essentially, cases where rawValue is virtually guaranteed to not be a
 * nullptr.
 */
template <typename T>
void fromRawValue(
    const PropsParserContext& context,
    const RawValue& rawValue,
    T& result,
    T defaultValue) {
  if (!rawValue.hasValue()) {
    result = std::move(defaultValue);
    return;
  }

  fromRawValue(context, rawValue, result);
}

template <typename T>
void fromRawValue(
    const PropsParserContext& context,
    const RawValue& rawValue,
    T& result) {
  result = (T)rawValue;
}

template <typename T>
void fromRawValue(
    const PropsParserContext& context,
    const RawValue& rawValue,
    std::optional<T>& result) {
  T resultValue;
  fromRawValue(context, rawValue, resultValue);
  result = std::optional<T>{std::move(resultValue)};
}

template <typename T>
void fromRawValue(
    const PropsParserContext& context,
    const RawValue& rawValue,
    std::vector<T>& result) {
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
    const PropsParserContext& context,
    const RawValue& rawValue,
    std::vector<std::vector<T>>& result) {
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
    const PropsParserContext& context,
    const RawProps& rawProps,
    const char* name,
    T const& sourceValue,
    U const& defaultValue,
    const char* namePrefix = nullptr,
    const char* nameSuffix = nullptr) {
  const auto* rawValue = rawProps.at(name, namePrefix, nameSuffix);
  if (rawValue == nullptr) [[likely]] {
    return sourceValue;
  }

  // Special case: `null` always means "the prop was removed, use default
  // value".
  if (!rawValue->hasValue()) [[unlikely]] {
    return defaultValue;
  }

  try {
    T result;
    fromRawValue(context, *rawValue, result);
    return result;
  } catch (const std::exception& e) {
    // In case of errors, log the error and fall back to the default
    RawPropsKey key{namePrefix, name, nameSuffix};
    // TODO: report this using ErrorUtils so it's more visible to the user
    LOG(ERROR) << "Error while converting prop '"
               << static_cast<std::string>(key) << "': " << e.what();
    return defaultValue;
  }
}

} // namespace facebook::react
