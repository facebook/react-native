/*
 * Copyright 2012-present Facebook, Inc.
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

#include <stddef.h>
#include <stdint.h>

namespace folly {

template <typename T>
class GroupVarint;

namespace detail {

template <typename T>
struct GroupVarintTraits;

template <>
struct GroupVarintTraits<uint32_t> {
  enum : uint32_t {
    kGroupSize = 4,
    kHeaderSize = 1,
  };
};

template <>
struct GroupVarintTraits<uint64_t> {
  enum : uint32_t {
    kGroupSize = 5,
    kHeaderSize = 2,
  };
};

template <typename T>
class GroupVarintBase {
 protected:
  typedef GroupVarintTraits<T> Traits;
  enum : uint32_t { kHeaderSize = Traits::kHeaderSize };

 public:
  typedef T type;

  /**
   * Number of integers encoded / decoded in one pass.
   */
  enum : uint32_t { kGroupSize = Traits::kGroupSize };

  /**
   * Maximum encoded size.
   */
  enum : uint32_t { kMaxSize = kHeaderSize + sizeof(type) * kGroupSize };

  /**
   * Maximum size for n values.
   */
  static size_t maxSize(size_t n) {
    // Full groups
    size_t total = (n / kGroupSize) * kFullGroupSize;
    // Incomplete last group, if any
    n %= kGroupSize;
    if (n) {
      total += kHeaderSize + n * sizeof(type);
    }
    return total;
  }

  /**
   * Size of n values starting at p.
   */
  static size_t totalSize(const T* p, size_t n) {
    size_t size = 0;
    for (; n >= kGroupSize; n -= kGroupSize, p += kGroupSize) {
      size += Derived::size(p);
    }
    if (n) {
      size += Derived::partialSize(p, n);
    }
    return size;
  }

 private:
  typedef GroupVarint<T> Derived;
  enum { kFullGroupSize = kHeaderSize + kGroupSize * sizeof(type) };
};

} // namespace detail
} // namespace folly
