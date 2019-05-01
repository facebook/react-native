/*
 * Copyright 2011-present Facebook, Inc.
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

/**
 * BitIterator
 *    Wrapper around an iterator over an integral type that iterates
 *    over its underlying bits in MSb to LSb order
 *
 * findFirstSet(BitIterator begin, BitIterator end)
 *    return a BitIterator pointing to the first 1 bit in [begin, end), or
 *    end if all bits in [begin, end) are 0
 *
 * @author Tudor Bosman (tudorb@fb.com)
 */

#pragma once

#include <cassert>
#include <cinttypes>
#include <cstdint>
#include <cstring>
#include <iterator>
#include <limits>
#include <type_traits>

#include <boost/iterator/iterator_adaptor.hpp>

#include <folly/Portability.h>
#include <folly/container/detail/BitIteratorDetail.h>
#include <folly/lang/Bits.h>

namespace folly {

/**
 * Fast bit iteration facility.
 */

template <class BaseIter>
class BitIterator;
template <class BaseIter>
BitIterator<BaseIter> findFirstSet(
    BitIterator<BaseIter>,
    BitIterator<BaseIter>);
/**
 * Wrapper around an iterator over an integer type that iterates
 * over its underlying bits in LSb to MSb order.
 *
 * BitIterator models the same iterator concepts as the base iterator.
 */
template <class BaseIter>
class BitIterator : public bititerator_detail::BitIteratorBase<BaseIter>::type {
 public:
  /**
   * Return the number of bits in an element of the underlying iterator.
   */
  static unsigned int bitsPerBlock() {
    return std::numeric_limits<typename std::make_unsigned<
        typename std::iterator_traits<BaseIter>::value_type>::type>::digits;
  }

  /**
   * Construct a BitIterator that points at a given bit offset (default 0)
   * in iter.
   */
  explicit BitIterator(const BaseIter& iter, size_t bitOff = 0)
      : bititerator_detail::BitIteratorBase<BaseIter>::type(iter),
        bitOffset_(bitOff) {
    assert(bitOffset_ < bitsPerBlock());
  }

  size_t bitOffset() const {
    return bitOffset_;
  }

  void advanceToNextBlock() {
    bitOffset_ = 0;
    ++this->base_reference();
  }

  BitIterator& operator=(const BaseIter& other) {
    this->~BitIterator();
    new (this) BitIterator(other);
    return *this;
  }

 private:
  friend class boost::iterator_core_access;
  friend BitIterator findFirstSet<>(BitIterator, BitIterator);

  typedef bititerator_detail::BitReference<
      typename std::iterator_traits<BaseIter>::reference,
      typename std::iterator_traits<BaseIter>::value_type>
      BitRef;

  void advanceInBlock(size_t n) {
    bitOffset_ += n;
    assert(bitOffset_ < bitsPerBlock());
  }

  BitRef dereference() const {
    return BitRef(*this->base_reference(), bitOffset_);
  }

  void advance(ssize_t n) {
    size_t bpb = bitsPerBlock();
    ssize_t blocks = n / ssize_t(bpb);
    bitOffset_ += n % bpb;
    if (bitOffset_ >= bpb) {
      bitOffset_ -= bpb;
      ++blocks;
    }
    this->base_reference() += blocks;
  }

  void increment() {
    if (++bitOffset_ == bitsPerBlock()) {
      advanceToNextBlock();
    }
  }

  void decrement() {
    if (bitOffset_-- == 0) {
      bitOffset_ = bitsPerBlock() - 1;
      --this->base_reference();
    }
  }

  bool equal(const BitIterator& other) const {
    return (
        bitOffset_ == other.bitOffset_ &&
        this->base_reference() == other.base_reference());
  }

  ssize_t distance_to(const BitIterator& other) const {
    return ssize_t(
        (other.base_reference() - this->base_reference()) * bitsPerBlock() +
        other.bitOffset_ - bitOffset_);
  }

  size_t bitOffset_;
};

/**
 * Helper function, so you can write
 * auto bi = makeBitIterator(container.begin());
 */
template <class BaseIter>
BitIterator<BaseIter> makeBitIterator(const BaseIter& iter) {
  return BitIterator<BaseIter>(iter);
}

/**
 * Find first bit set in a range of bit iterators.
 * 4.5x faster than the obvious std::find(begin, end, true);
 */
template <class BaseIter>
BitIterator<BaseIter> findFirstSet(
    BitIterator<BaseIter> begin,
    BitIterator<BaseIter> end) {
  // shortcut to avoid ugly static_cast<>
  static const typename std::iterator_traits<BaseIter>::value_type one = 1;

  while (begin.base() != end.base()) {
    typename std::iterator_traits<BaseIter>::value_type v = *begin.base();
    // mask out the bits that don't matter (< begin.bitOffset)
    v &= ~((one << begin.bitOffset()) - 1);
    size_t firstSet = findFirstSet(v);
    if (firstSet) {
      --firstSet; // now it's 0-based
      assert(firstSet >= begin.bitOffset());
      begin.advanceInBlock(firstSet - begin.bitOffset());
      return begin;
    }
    begin.advanceToNextBlock();
  }

  // now begin points to the same block as end
  if (end.bitOffset() != 0) { // assume end is dereferenceable
    typename std::iterator_traits<BaseIter>::value_type v = *begin.base();
    // mask out the bits that don't matter (< begin.bitOffset)
    v &= ~((one << begin.bitOffset()) - 1);
    // mask out the bits that don't matter (>= end.bitOffset)
    v &= (one << end.bitOffset()) - 1;
    size_t firstSet = findFirstSet(v);
    if (firstSet) {
      --firstSet; // now it's 0-based
      assert(firstSet >= begin.bitOffset());
      begin.advanceInBlock(firstSet - begin.bitOffset());
      return begin;
    }
  }

  return end;
}

} // namespace folly
