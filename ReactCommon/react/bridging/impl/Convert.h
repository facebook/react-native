/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>

#include <type_traits>

namespace facebook::react::bridging {

// std::remove_cvref_t is not available until C++20.
template <typename T>
using remove_cvref_t = std::remove_cv_t<std::remove_reference_t<T>>;

template <typename T>
inline constexpr bool is_jsi_v =
    std::is_same_v<jsi::Value, remove_cvref_t<T>> ||
    std::is_same_v<jsi::String, remove_cvref_t<T>> ||
    std::is_base_of_v<jsi::Object, remove_cvref_t<T>>;

template <typename T>
struct ConverterBase {
  ConverterBase(jsi::Runtime &rt, T &&value)
      : rt_(rt), value_(std::forward<T>(value)) {}

  operator T() && {
    return std::forward<T>(this->value_);
  }

 protected:
  jsi::Runtime &rt_;
  T value_;
};

template <typename T>
struct Converter : public ConverterBase<T> {
  using ConverterBase<T>::ConverterBase;
};

template <>
struct Converter<jsi::Value> : public ConverterBase<jsi::Value> {
  using ConverterBase<jsi::Value>::ConverterBase;

  operator jsi::String() && {
    return std::move(value_).asString(rt_);
  }

  operator jsi::Object() && {
    return std::move(value_).asObject(rt_);
  }

  operator jsi::Array() && {
    return std::move(value_).asObject(rt_).asArray(rt_);
  }

  operator jsi::Function() && {
    return std::move(value_).asObject(rt_).asFunction(rt_);
  }
};

template <>
struct Converter<jsi::Object> : public ConverterBase<jsi::Object> {
  using ConverterBase<jsi::Object>::ConverterBase;

  operator jsi::Array() && {
    return std::move(value_).asArray(rt_);
  }

  operator jsi::Function() && {
    return std::move(value_).asFunction(rt_);
  }
};

template <typename T>
struct Converter<T &> {
  Converter(jsi::Runtime &rt, T &value) : rt_(rt), value_(value) {}

  operator T() && {
    // Copy the reference into a Value that then can be moved from.
    return Converter<jsi::Value>(rt_, jsi::Value(rt_, value_));
  }

  template <
      typename U,
      // Ensure the non-reference type can be converted to the desired type.
      std::enable_if_t<
          std::is_convertible_v<Converter<std::remove_cv_t<T>>, U>,
          int> = 0>
  operator U() && {
    return Converter<jsi::Value>(rt_, jsi::Value(rt_, value_));
  }

 private:
  jsi::Runtime &rt_;
  const T &value_;
};

template <typename T, std::enable_if_t<is_jsi_v<T>, int> = 0>
auto convert(jsi::Runtime &rt, T &&value) {
  return Converter<T>(rt, std::forward<T>(value));
}

template <typename T, std::enable_if_t<std::is_scalar_v<T>, int> = 0>
auto convert(jsi::Runtime &rt, T &&value) {
  return value;
}

template <typename T>
auto convert(jsi::Runtime &rt, Converter<T> &&converter) {
  return std::move(converter);
}

} // namespace facebook::react::bridging
