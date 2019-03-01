/*
 * Copyright 2017 Facebook, Inc.
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

#include <folly/detail/CachelinePaddedImpl.h>

namespace folly {

/**
 * Holds a type T, in addition to enough padding to round the size up to the
 * next multiple of the false sharing range used by folly.
 *
 * If T is standard-layout, then casting a T* you get from this class to a
 * CachelinePadded<T>* is safe.
 *
 * This class handles padding, but imperfectly handles alignment. (Note that
 * alignment matters for false-sharing: imagine a cacheline size of 64, and two
 * adjacent 64-byte objects, with the first starting at an offset of 32. The
 * last 32 bytes of the first object share a cacheline with the first 32 bytes
 * of the second.). We alignas this class to be at least cacheline-sized, but
 * it's implementation-defined what that means (since a cacheline is almost
 * certainly larger than the maximum natural alignment). The following should be
 * true for recent compilers on common architectures:
 *
 * For heap objects, alignment needs to be handled at the allocator level, such
 * as with posix_memalign (this isn't necessary with jemalloc, which aligns
 * objects that are a multiple of cacheline size to a cacheline).
 *
 * For static and stack objects, the alignment should be obeyed, and no specific
 * intervention is necessary.
 */
template <typename T>
class CachelinePadded {
 public:
  template <typename... Args>
  explicit CachelinePadded(Args&&... args)
      : impl_(std::forward<Args>(args)...) {}

  CachelinePadded() {}

  T* get() {
    return &impl_.item;
  }

  const T* get() const {
    return &impl_.item;
  }

  T* operator->() {
    return get();
  }

  const T* operator->() const {
    return get();
  }

  T& operator*() {
    return *get();
  }

  const T& operator*() const {
    return *get();
  }

 private:
  detail::CachelinePaddedImpl<T> impl_;
};
}
