/*
 * Copyright 2013-present Facebook, Inc.
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

#include <algorithm>
#include <iterator>
#include <type_traits>

#include <folly/io/IOBuf.h>
#include <folly/memory/Malloc.h>

namespace folly {

/**
 * Wrapper class to handle a IOBuf as a typed buffer (to a standard layout
 * class).
 *
 * This class punts on alignment, and assumes that you know what you're doing.
 *
 * All methods are wrappers around the corresponding IOBuf methods.  The
 * TypedIOBuf object is stateless, so it's perfectly okay to access the
 * underlying IOBuf in between TypedIOBuf method calls.
 */
template <class T>
class TypedIOBuf {
  static_assert(std::is_standard_layout<T>::value, "must be standard layout");

 public:
  typedef T value_type;
  typedef value_type& reference;
  typedef const value_type& const_reference;
  typedef uint32_t size_type;
  typedef value_type* iterator;
  typedef const value_type* const_iterator;

  explicit TypedIOBuf(IOBuf* buf) : buf_(buf) {}

  IOBuf* ioBuf() {
    return buf_;
  }
  const IOBuf* ioBuf() const {
    return buf_;
  }

  bool empty() const {
    return buf_->empty();
  }
  const T* data() const {
    return cast(buf_->data());
  }
  T* writableData() {
    return cast(buf_->writableData());
  }
  const T* tail() const {
    return cast(buf_->tail());
  }
  T* writableTail() {
    return cast(buf_->writableTail());
  }
  uint32_t length() const {
    return sdiv(buf_->length());
  }
  uint32_t size() const {
    return length();
  }

  uint32_t headroom() const {
    return sdiv(buf_->headroom());
  }
  uint32_t tailroom() const {
    return sdiv(buf_->tailroom());
  }
  const T* buffer() const {
    return cast(buf_->buffer());
  }
  T* writableBuffer() {
    return cast(buf_->writableBuffer());
  }
  const T* bufferEnd() const {
    return cast(buf_->bufferEnd());
  }
  uint32_t capacity() const {
    return sdiv(buf_->capacity());
  }
  void advance(uint32_t n) {
    buf_->advance(smul(n));
  }
  void retreat(uint32_t n) {
    buf_->retreat(smul(n));
  }
  void prepend(uint32_t n) {
    buf_->prepend(smul(n));
  }
  void append(uint32_t n) {
    buf_->append(smul(n));
  }
  void trimStart(uint32_t n) {
    buf_->trimStart(smul(n));
  }
  void trimEnd(uint32_t n) {
    buf_->trimEnd(smul(n));
  }
  void clear() {
    buf_->clear();
  }
  void reserve(uint32_t minHeadroom, uint32_t minTailroom) {
    buf_->reserve(smul(minHeadroom), smul(minTailroom));
  }
  void reserve(uint32_t minTailroom) {
    reserve(0, minTailroom);
  }

  const T* cbegin() const {
    return data();
  }
  const T* cend() const {
    return tail();
  }
  const T* begin() const {
    return cbegin();
  }
  const T* end() const {
    return cend();
  }
  T* begin() {
    return writableData();
  }
  T* end() {
    return writableTail();
  }

  const T& front() const {
    assert(!empty());
    return *begin();
  }
  T& front() {
    assert(!empty());
    return *begin();
  }
  const T& back() const {
    assert(!empty());
    return end()[-1];
  }
  T& back() {
    assert(!empty());
    return end()[-1];
  }

  /**
   * Simple wrapper to make it easier to treat this TypedIOBuf as an array of
   * T.
   */
  const T& operator[](ssize_t idx) const {
    assert(idx >= 0 && idx < length());
    return data()[idx];
  }

  T& operator[](ssize_t idx) {
    assert(idx >= 0 && idx < length());
    return writableData()[idx];
  }

  /**
   * Append one element.
   */
  void push(const T& data) {
    push(&data, &data + 1);
  }
  void push_back(const T& data) {
    push(data);
  }

  /**
   * Append multiple elements in a sequence; will call distance().
   */
  template <class IT>
  void push(IT begin, IT end) {
    uint32_t n = std::distance(begin, end);
    if (usingJEMalloc()) {
      // Rely on xallocx() and avoid exponential growth to limit
      // amount of memory wasted.
      reserve(headroom(), n);
    } else if (tailroom() < n) {
      reserve(headroom(), std::max(n, 3 + size() / 2));
    }
    std::copy(begin, end, writableTail());
    append(n);
  }

  // Movable
  TypedIOBuf(TypedIOBuf&&) = default;
  TypedIOBuf& operator=(TypedIOBuf&&) = default;

 private:
  // Non-copyable
  TypedIOBuf(const TypedIOBuf&) = delete;
  TypedIOBuf& operator=(const TypedIOBuf&) = delete;

  // cast to T*
  static T* cast(uint8_t* p) {
    return reinterpret_cast<T*>(p);
  }
  static const T* cast(const uint8_t* p) {
    return reinterpret_cast<const T*>(p);
  }
  // divide by size
  static uint32_t sdiv(uint32_t n) {
    return n / sizeof(T);
  }
  // multiply by size
  static uint32_t smul(uint32_t n) {
    // In debug mode, check for overflow
    assert((uint64_t(n) * sizeof(T)) < (uint64_t(1) << 32));
    return n * sizeof(T);
  }

  IOBuf* buf_;
};

} // namespace folly
