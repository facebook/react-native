/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <array>
#include <bitset>
#include <cassert>
#include <cstdint>
#include <memory>
#include <vector>

namespace facebook::yoga {

// Container which allows storing 32 or 64 bit integer values, whose index may
// never change. Values are first stored in a fixed buffer of `BufferSize`
// 32-bit chunks, before falling back to heap allocation.
template <size_t BufferSize>
class SmallValueBuffer {
 public:
  SmallValueBuffer() = default;
  SmallValueBuffer(const SmallValueBuffer& other) {
    *this = other;
  }
  SmallValueBuffer(SmallValueBuffer&& other) = default;

  // Add a new element to the buffer, returning the index of the element
  uint16_t push(uint32_t value) {
    const auto index = count_++;
    assert(index < 4096 && "SmallValueBuffer can only hold up to 4096 chunks");
    if (index < buffer_.size()) {
      buffer_[index] = value;
      return index;
    }

    if (overflow_ == nullptr) {
      overflow_ = std::make_unique<SmallValueBuffer::Overflow>();
    }

    overflow_->buffer_.push_back(value);
    overflow_->wideElements_.push_back(false);
    return index;
  }

  uint16_t push(uint64_t value) {
    const auto lsb = static_cast<uint32_t>(value & 0xFFFFFFFF);
    const auto msb = static_cast<uint32_t>(value >> 32);

    const auto lsbIndex = push(lsb);
    [[maybe_unused]] const auto msbIndex = push(msb);
    assert(
        msbIndex < 4096 && "SmallValueBuffer can only hold up to 4096 chunks");

    if (lsbIndex < buffer_.size()) {
      wideElements_[lsbIndex] = true;
    } else {
      overflow_->wideElements_[lsbIndex - buffer_.size()] = true;
    }
    return lsbIndex;
  }

  // Replace an existing element in the buffer with a new value. A new index
  // may be returned, e.g. if a new value is wider than the previous.
  [[nodiscard]] uint16_t replace(uint16_t index, uint32_t value) {
    if (index < buffer_.size()) {
      buffer_[index] = value;
    } else {
      overflow_->buffer_.at(index - buffer_.size()) = value;
    }

    return index;
  }

  [[nodiscard]] uint16_t replace(uint16_t index, uint64_t value) {
    const bool isWide = index < wideElements_.size()
        ? wideElements_[index]
        : overflow_->wideElements_.at(index - buffer_.size());

    if (isWide) {
      const auto lsb = static_cast<uint32_t>(value & 0xFFFFFFFF);
      const auto msb = static_cast<uint32_t>(value >> 32);

      [[maybe_unused]] auto lsbIndex = replace(index, lsb);
      [[maybe_unused]] auto msbIndex = replace(index + 1, msb);
      return index;
    } else {
      return push(value);
    }
  }

  // Get a value of a given width
  uint32_t get32(uint16_t index) const {
    if (index < buffer_.size()) {
      return buffer_[index];
    } else {
      return overflow_->buffer_.at(index - buffer_.size());
    }
  }

  uint64_t get64(uint16_t index) const {
    const auto lsb = get32(index);
    const auto msb = get32(index + 1);
    return (static_cast<uint64_t>(msb) << 32) | lsb;
  }

  SmallValueBuffer& operator=(const SmallValueBuffer& other) {
    count_ = other.count_;
    buffer_ = other.buffer_;
    wideElements_ = other.wideElements_;
    overflow_ = other.overflow_ ? std::make_unique<Overflow>(*other.overflow_)
                                : nullptr;
    return *this;
  }

  SmallValueBuffer& operator=(SmallValueBuffer&& other) = default;

 private:
  struct Overflow {
    std::vector<uint32_t> buffer_;
    std::vector<bool> wideElements_;
  };

  uint16_t count_{0};
  std::array<uint32_t, BufferSize> buffer_;
  std::bitset<BufferSize> wideElements_;
  std::unique_ptr<Overflow> overflow_;
};

} // namespace facebook::yoga
