/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridging/Base.h>

#include <cstring>
#include <iterator>
#include <vector>

namespace facebook::react {

/**
 * A concrete implementation of jsi::MutableBuffer that owns a copy of the data.
 * Used when creating jsi::ArrayBuffer from native data (e.g., NSData,
 * ByteBuffer) where we need to copy the data to ensure proper memory
 * ownership.
 */
class OwnedMutableBuffer : public jsi::MutableBuffer {
 public:
  OwnedMutableBuffer(const uint8_t *data, size_t size) : data_(data, std::next(data, static_cast<std::ptrdiff_t>(size)))
  {
  }

  explicit OwnedMutableBuffer(size_t size) : data_(size, 0) {}

  explicit OwnedMutableBuffer(std::vector<uint8_t> data) : data_(std::move(data)) {}

  size_t size() const override
  {
    return data_.size();
  }

  uint8_t *data() override
  {
    return data_.data();
  }

 private:
  std::vector<uint8_t> data_;
};

template <>
struct Bridging<std::vector<uint8_t>> {
  static std::vector<uint8_t> fromJs(jsi::Runtime &rt, const jsi::ArrayBuffer &buffer)
  {
    auto size = buffer.size(rt);
    auto data = buffer.data(rt);
    return {data, std::next(data, static_cast<std::ptrdiff_t>(size))};
  }

  static jsi::ArrayBuffer toJs(jsi::Runtime &rt, const std::vector<uint8_t> &data)
  {
    auto buffer = std::make_shared<OwnedMutableBuffer>(data.data(), data.size());
    return {rt, std::move(buffer)};
  }
};

} // namespace facebook::react
