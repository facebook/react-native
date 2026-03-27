/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridging/Base.h>

#include <cstdint>
#include <variant>

namespace facebook::react {

class BigInt {
 public:
  BigInt(jsi::Runtime &rt, const jsi::BigInt &bigint)
  {
    if (bigint.isInt64(rt)) {
      value_ = bigint.asInt64(rt);
    } else if (bigint.isUint64(rt)) {
      value_ = bigint.asUint64(rt);
    } else {
      throw jsi::JSError(rt, "BigInt value cannot be losslessly represented as int64_t or uint64_t");
    }
  }

  /* implicit */ BigInt(int64_t value) : value_(value) {}
  /* implicit */ BigInt(uint64_t value) : value_(value) {}

  bool isInt64() const
  {
    return std::holds_alternative<int64_t>(value_);
  }

  bool isUint64() const
  {
    return std::holds_alternative<uint64_t>(value_);
  }

  int64_t asInt64() const
  {
    return std::get<int64_t>(value_);
  }

  uint64_t asUint64() const
  {
    return std::get<uint64_t>(value_);
  }

  jsi::BigInt toJSBigInt(jsi::Runtime &rt) const
  {
    if (isInt64()) {
      return jsi::BigInt::fromInt64(rt, asInt64());
    } else {
      return jsi::BigInt::fromUint64(rt, asUint64());
    }
  }

  bool operator==(const BigInt &other) const = default;

 private:
  std::variant<int64_t, uint64_t> value_;
};

template <>
struct Bridging<BigInt> {
  static BigInt fromJs(jsi::Runtime &rt, const jsi::Value &value)
  {
    return {rt, value.getBigInt(rt)};
  }

  static jsi::BigInt toJs(jsi::Runtime &rt, const BigInt &value)
  {
    return value.toJSBigInt(rt);
  }
};

} // namespace facebook::react
