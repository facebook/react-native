/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cassert>
#include <cstdint>

#include <yoga/numeric/FloatOptional.h>
#include <yoga/style/SmallValueBuffer.h>
#include <yoga/style/StyleLength.h>
#include <yoga/style/StyleValueHandle.h>

namespace facebook::yoga {

/**
 * StyleValuePool allows compact storage for a sparse collection of assigned
 * lengths and numbers. Values are referred to using StyleValueHandle. In most
 * cases StyleValueHandle can embed the value directly, but if not, the value is
 * stored within a buffer provided by the pool. The pool contains a fixed number
 * of inline slots before falling back to heap allocating additional slots.
 */
class StyleValuePool {
 public:
  void store(StyleValueHandle& handle, StyleLength length) {
    if (length.isUndefined()) {
      handle.setType(StyleValueHandle::Type::Undefined);
    } else if (length.isAuto()) {
      handle.setType(StyleValueHandle::Type::Auto);
    } else {
      auto type = length.unit() == Unit::Point
          ? StyleValueHandle::Type::Point
          : StyleValueHandle::Type::Percent;
      storeValue(handle, length.value().unwrap(), type);
    }
  }

  void store(StyleValueHandle& handle, FloatOptional number) {
    if (number.isUndefined()) {
      handle.setType(StyleValueHandle::Type::Undefined);
    } else {
      storeValue(handle, number.unwrap(), StyleValueHandle::Type::Number);
    }
  }

  StyleLength getLength(StyleValueHandle handle) const {
    if (handle.isUndefined()) {
      return value::undefined();
    } else if (handle.isAuto()) {
      return value::ofAuto();
    } else {
      assert(
          handle.type() == StyleValueHandle::Type::Point ||
          handle.type() == StyleValueHandle::Type::Percent);
      float value = (handle.isValueIndexed())
          ? std::bit_cast<float>(buffer_.get32(handle.value()))
          : unpackInlineInteger(handle.value());

      return handle.type() == StyleValueHandle::Type::Point
          ? value::points(value)
          : value::percent(value);
    }
  }

  FloatOptional getNumber(StyleValueHandle handle) const {
    if (handle.isUndefined()) {
      return FloatOptional{};
    } else {
      assert(handle.type() == StyleValueHandle::Type::Number);
      float value = (handle.isValueIndexed())
          ? std::bit_cast<float>(buffer_.get32(handle.value()))
          : unpackInlineInteger(handle.value());
      return FloatOptional{value};
    }
  }

 private:
  void storeValue(
      StyleValueHandle& handle,
      float value,
      StyleValueHandle::Type type) {
    handle.setType(type);

    if (handle.isValueIndexed()) {
      auto newIndex =
          buffer_.replace(handle.value(), std::bit_cast<uint32_t>(value));
      handle.setValue(newIndex);
    } else if (isIntegerPackable(value)) {
      handle.setValue(packInlineInteger(value));
    } else {
      auto newIndex = buffer_.push(std::bit_cast<uint32_t>(value));
      handle.setValue(newIndex);
      handle.setValueIsIndexed();
    }
  }

  static constexpr bool isIntegerPackable(float f) {
    constexpr uint16_t kMaxInlineAbsValue = (1 << 11) - 1;

    auto i = static_cast<int32_t>(f);
    return static_cast<float>(i) == f && i >= -kMaxInlineAbsValue &&
        i <= +kMaxInlineAbsValue;
  }

  static constexpr uint16_t packInlineInteger(float value) {
    uint16_t isNegative = value < 0 ? 1 : 0;
    return static_cast<uint16_t>(
        (isNegative << 11) |
        (static_cast<int32_t>(value) * (isNegative != 0u ? -1 : 1)));
  }

  static constexpr float unpackInlineInteger(uint16_t value) {
    constexpr uint16_t kValueSignMask = 0b0000'1000'0000'0000;
    constexpr uint16_t kValueMagnitudeMask = 0b0000'0111'1111'1111;
    const bool isNegative = (value & kValueSignMask) != 0;
    return static_cast<float>(
        (value & kValueMagnitudeMask) * (isNegative ? -1 : 1));
  }

  SmallValueBuffer<4> buffer_;
};

} // namespace facebook::yoga
