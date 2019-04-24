/*
 * Copyright 2015-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <cstdlib>
#include <limits>
#include <type_traits>

#include <folly/Likely.h>
#include <folly/Portability.h>
#include <folly/Range.h>
#include <folly/experimental/Bits.h>
#include <folly/experimental/CodingDetail.h>
#include <folly/experimental/Instructions.h>
#include <folly/experimental/Select64.h>
#include <folly/lang/Bits.h>
#include <glog/logging.h>

#if !FOLLY_X64
#error BitVectorCoding.h requires x86_64
#endif

namespace folly {
namespace compression {

static_assert(kIsLittleEndian, "BitVectorCoding.h requires little endianness");

template <class Pointer>
struct BitVectorCompressedListBase {
  BitVectorCompressedListBase() = default;

  template <class OtherPointer>
  BitVectorCompressedListBase(
      const BitVectorCompressedListBase<OtherPointer>& other)
      : size(other.size),
        upperBound(other.upperBound),
        data(other.data),
        bits(reinterpret_cast<Pointer>(other.bits)),
        skipPointers(reinterpret_cast<Pointer>(other.skipPointers)),
        forwardPointers(reinterpret_cast<Pointer>(other.forwardPointers)) {}

  template <class T = Pointer>
  auto free() -> decltype(::free(T(nullptr))) {
    return ::free(data.data());
  }

  size_t size = 0;
  size_t upperBound = 0;

  folly::Range<Pointer> data;

  Pointer bits = nullptr;
  Pointer skipPointers = nullptr;
  Pointer forwardPointers = nullptr;
};

typedef BitVectorCompressedListBase<const uint8_t*> BitVectorCompressedList;
typedef BitVectorCompressedListBase<uint8_t*> MutableBitVectorCompressedList;

template <
    class Value,
    class SkipValue,
    size_t kSkipQuantum = 0,
    size_t kForwardQuantum = 0>
struct BitVectorEncoder {
  static_assert(
      std::is_integral<Value>::value && std::is_unsigned<Value>::value,
      "Value should be unsigned integral");

  typedef BitVectorCompressedList CompressedList;
  typedef MutableBitVectorCompressedList MutableCompressedList;

  typedef Value ValueType;
  typedef SkipValue SkipValueType;
  struct Layout;

  static constexpr size_t skipQuantum = kSkipQuantum;
  static constexpr size_t forwardQuantum = kForwardQuantum;

  template <class RandomAccessIterator>
  static MutableCompressedList encode(
      RandomAccessIterator begin,
      RandomAccessIterator end) {
    if (begin == end) {
      return MutableCompressedList();
    }
    BitVectorEncoder encoder(size_t(end - begin), *(end - 1));
    for (; begin != end; ++begin) {
      encoder.add(*begin);
    }
    return encoder.finish();
  }

  explicit BitVectorEncoder(const MutableCompressedList& result)
      : bits_(result.bits),
        skipPointers_(result.skipPointers),
        forwardPointers_(result.forwardPointers),
        result_(result) {
    memset(result.data.data(), 0, result.data.size());
  }

  BitVectorEncoder(size_t size, ValueType upperBound)
      : BitVectorEncoder(
            Layout::fromUpperBoundAndSize(upperBound, size).allocList()) {}

  void add(ValueType value) {
    CHECK_LT(value, std::numeric_limits<ValueType>::max());
    // Also works when lastValue_ == -1.
    CHECK_GT(value + 1, lastValue_ + 1)
        << "BitVectorCoding only supports stricly monotone lists";

    auto block = bits_ + (value / 64) * sizeof(uint64_t);
    size_t inner = value % 64;
    folly::Bits<folly::Unaligned<uint64_t>>::set(
        reinterpret_cast<folly::Unaligned<uint64_t>*>(block), inner);

    if (skipQuantum != 0) {
      size_t nextSkipPointerSize = value / skipQuantum;
      while (skipPointersSize_ < nextSkipPointerSize) {
        auto pos = skipPointersSize_++;
        folly::storeUnaligned<SkipValueType>(
            skipPointers_ + pos * sizeof(SkipValueType), size_);
      }
    }

    if (forwardQuantum != 0) {
      if (size_ != 0 && (size_ % forwardQuantum == 0)) {
        const auto pos = size_ / forwardQuantum - 1;
        folly::storeUnaligned<SkipValueType>(
            forwardPointers_ + pos * sizeof(SkipValueType), value);
      }
    }

    lastValue_ = value;
    ++size_;
  }

  const MutableCompressedList& finish() const {
    CHECK_EQ(size_, result_.size);
    // TODO(ott): Relax this assumption.
    CHECK_EQ(result_.upperBound, lastValue_);
    return result_;
  }

 private:
  uint8_t* const bits_ = nullptr;
  uint8_t* const skipPointers_ = nullptr;
  uint8_t* const forwardPointers_ = nullptr;

  ValueType lastValue_ = -1;
  size_t size_ = 0;
  size_t skipPointersSize_ = 0;

  MutableCompressedList result_;
};

template <
    class Value,
    class SkipValue,
    size_t kSkipQuantum,
    size_t kForwardQuantum>
struct BitVectorEncoder<Value, SkipValue, kSkipQuantum, kForwardQuantum>::
    Layout {
  static Layout fromUpperBoundAndSize(size_t upperBound, size_t size) {
    Layout layout;
    layout.size = size;
    layout.upperBound = upperBound;

    size_t bitVectorSizeInBytes = (upperBound / 8) + 1;
    layout.bits = bitVectorSizeInBytes;

    if (skipQuantum != 0) {
      size_t numSkipPointers = upperBound / skipQuantum;
      layout.skipPointers = numSkipPointers * sizeof(SkipValueType);
    }
    if (forwardQuantum != 0) {
      size_t numForwardPointers = size / forwardQuantum;
      layout.forwardPointers = numForwardPointers * sizeof(SkipValueType);
    }

    CHECK_LT(size, std::numeric_limits<SkipValueType>::max());

    return layout;
  }

  size_t bytes() const {
    return bits + skipPointers + forwardPointers;
  }

  template <class Range>
  BitVectorCompressedListBase<typename Range::iterator> openList(
      Range& buf) const {
    BitVectorCompressedListBase<typename Range::iterator> result;
    result.size = size;
    result.upperBound = upperBound;
    result.data = buf.subpiece(0, bytes());
    auto advance = [&](size_t n) {
      auto begin = buf.data();
      buf.advance(n);
      return begin;
    };

    result.bits = advance(bits);
    result.skipPointers = advance(skipPointers);
    result.forwardPointers = advance(forwardPointers);
    CHECK_EQ(buf.data() - result.data.data(), bytes());

    return result;
  }

  MutableCompressedList allocList() const {
    uint8_t* buf = nullptr;
    if (size > 0) {
      buf = static_cast<uint8_t*>(malloc(bytes() + 7));
    }
    folly::MutableByteRange bufRange(buf, bytes());
    return openList(bufRange);
  }

  size_t size = 0;
  size_t upperBound = 0;

  // Sizes in bytes.
  size_t bits = 0;
  size_t skipPointers = 0;
  size_t forwardPointers = 0;
};

template <
    class Encoder,
    class Instructions = instructions::Default,
    bool kUnchecked = false>
class BitVectorReader : detail::ForwardPointers<Encoder::forwardQuantum>,
                        detail::SkipPointers<Encoder::skipQuantum> {
 public:
  typedef Encoder EncoderType;
  typedef typename Encoder::ValueType ValueType;
  // A bitvector can only be as large as its largest value.
  typedef typename Encoder::ValueType SizeType;
  typedef typename Encoder::SkipValueType SkipValueType;

  explicit BitVectorReader(const typename Encoder::CompressedList& list)
      : detail::ForwardPointers<Encoder::forwardQuantum>(list.forwardPointers),
        detail::SkipPointers<Encoder::skipQuantum>(list.skipPointers),
        bits_(list.bits),
        size_(list.size),
        upperBound_(
            (kUnchecked || UNLIKELY(list.size == 0)) ? 0 : list.upperBound) {
    reset();
  }

  void reset() {
    block_ = (bits_ != nullptr) ? folly::loadUnaligned<uint64_t>(bits_) : 0;
    outer_ = 0;
    position_ = -1;
    value_ = kInvalidValue;
  }

  bool next() {
    if (!kUnchecked && UNLIKELY(position() + 1 >= size_)) {
      return setDone();
    }

    while (block_ == 0) {
      outer_ += sizeof(uint64_t);
      block_ = folly::loadUnaligned<uint64_t>(bits_ + outer_);
    }

    ++position_;
    auto inner = Instructions::ctz(block_);
    block_ = Instructions::blsr(block_);

    return setValue(inner);
  }

  bool skip(SizeType n) {
    CHECK_GT(n, 0);

    if (!kUnchecked && position() + n >= size_) {
      return setDone();
    }
    // Small skip optimization.
    if (LIKELY(n < kLinearScanThreshold)) {
      for (size_t i = 0; i < n; ++i) {
        next();
      }
      return true;
    }

    position_ += n;

    // Use forward pointer.
    if (Encoder::forwardQuantum > 0 && n > Encoder::forwardQuantum) {
      const size_t steps = position_ / Encoder::forwardQuantum;
      const size_t dest = folly::loadUnaligned<SkipValueType>(
          this->forwardPointers_ + (steps - 1) * sizeof(SkipValueType));

      reposition(dest);
      n = position_ + 1 - steps * Encoder::forwardQuantum;
    }

    size_t cnt;
    // Find necessary block.
    while ((cnt = Instructions::popcount(block_)) < n) {
      n -= cnt;
      outer_ += sizeof(uint64_t);
      block_ = folly::loadUnaligned<uint64_t>(bits_ + outer_);
    }

    // Skip to the n-th one in the block.
    DCHECK_GT(n, 0);
    auto inner = select64<Instructions>(block_, n - 1);
    block_ &= (uint64_t(-1) << inner) << 1;

    return setValue(inner);
  }

  bool skipTo(ValueType v) {
    // Also works when value_ == kInvalidValue.
    if (v != kInvalidValue) {
      DCHECK_GE(v + 1, value_ + 1);
    }

    if (!kUnchecked && v > upperBound_) {
      return setDone();
    } else if (v == value_) {
      return true;
    }

    // Small skip optimization.
    if (v - value_ < kLinearScanThreshold) {
      do {
        next();
      } while (value() < v);

      return true;
    }

    if (Encoder::skipQuantum > 0 && v - value_ > Encoder::skipQuantum) {
      size_t q = v / Encoder::skipQuantum;
      auto skipPointer = folly::loadUnaligned<SkipValueType>(
          this->skipPointers_ + (q - 1) * sizeof(SkipValueType));
      position_ = static_cast<SizeType>(skipPointer) - 1;

      reposition(q * Encoder::skipQuantum);
    }

    // Find the value.
    size_t outer = v / 64 * 8;

    while (outer_ < outer) {
      position_ += Instructions::popcount(block_);
      outer_ += sizeof(uint64_t);
      block_ = folly::loadUnaligned<uint64_t>(bits_ + outer_);
    }

    DCHECK_EQ(outer_, outer);
    uint64_t mask = ~((uint64_t(1) << (v % 64)) - 1);
    position_ += Instructions::popcount(block_ & ~mask) + 1;
    block_ &= mask;

    while (block_ == 0) {
      outer_ += sizeof(uint64_t);
      block_ = folly::loadUnaligned<uint64_t>(bits_ + outer_);
    }

    auto inner = Instructions::ctz(block_);
    block_ = Instructions::blsr(block_);

    setValue(inner);
    return true;
  }

  SizeType size() const {
    return size_;
  }

  bool valid() const {
    return position() < size(); // Also checks that position() != -1.
  }

  SizeType position() const {
    return position_;
  }
  ValueType value() const {
    DCHECK(valid());
    return value_;
  }

  bool jump(SizeType n) {
    reset();
    return skip(n + 1);
  }

  bool jumpTo(ValueType v) {
    reset();
    return skipTo(v);
  }

  bool setDone() {
    value_ = kInvalidValue;
    position_ = size_;
    return false;
  }

 private:
  constexpr static ValueType kInvalidValue =
      std::numeric_limits<ValueType>::max(); // Must hold kInvalidValue + 1 ==
                                             // 0.

  bool setValue(size_t inner) {
    value_ = static_cast<ValueType>(8 * outer_ + inner);
    return true;
  }

  void reposition(size_t dest) {
    outer_ = dest / 64 * 8;
    // We maintain the invariant that outer_ is divisible by 8.
    block_ = folly::loadUnaligned<uint64_t>(bits_ + outer_);
    block_ &= ~((uint64_t(1) << (dest % 64)) - 1);
  }

  constexpr static size_t kLinearScanThreshold = 4;

  const uint8_t* const bits_;
  uint64_t block_;
  SizeType outer_;
  SizeType position_;
  ValueType value_;

  const SizeType size_;
  const ValueType upperBound_;
};

} // namespace compression
} // namespace folly
