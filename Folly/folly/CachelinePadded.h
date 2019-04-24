/*
 * Copyright 2016-present Facebook, Inc.
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

#include <cstddef>
#include <utility>

#include <folly/lang/Align.h>

namespace folly {

/**
 * Holds a type T, in addition to enough padding to ensure that it isn't subject
 * to false sharing within the range used by folly.
 *
 * If `sizeof(T) <= alignof(T)` then the inner `T` will be entirely within one
 * false sharing range (AKA cache line).
 */
template <typename T>
class CachelinePadded {
  static_assert(
      alignof(T) <= max_align_v,
      "CachelinePadded does not support over-aligned types.");

 public:
  template <typename... Args>
  explicit CachelinePadded(Args&&... args)
      : inner_(std::forward<Args>(args)...) {}

  T* get() {
    return &inner_;
  }

  const T* get() const {
    return &inner_;
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
  static constexpr size_t paddingSize() noexcept {
    return hardware_destructive_interference_size -
        (alignof(T) % hardware_destructive_interference_size);
  }
  char paddingPre_[paddingSize()];
  T inner_;
  char paddingPost_[paddingSize()];
};
} // namespace folly
