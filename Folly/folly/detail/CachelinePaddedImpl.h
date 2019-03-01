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

#include <folly/detail/CacheLocality.h>

namespace folly {

template <typename T>
class CachelinePadded;

namespace detail {

template <
    typename T,
    bool needsPadding = (sizeof(T) % CacheLocality::kFalseSharingRange != 0)>
struct CachelinePaddedImpl;

// We need alignas(T) alignas(kFalseSharingRange) for the case where alignof(T)
// > alignof(kFalseSharingRange).
template <typename T>
struct alignas(T) alignas(detail::CacheLocality::kFalseSharingRange)
    CachelinePaddedImpl<T, /* needsPadding = */ false> {
  template <typename... Args>
  explicit CachelinePaddedImpl(Args&&... args)
      : item(std::forward<Args>(args)...) {}
  T item;
};

template <typename T>
struct alignas(T) alignas(detail::CacheLocality::kFalseSharingRange)
    CachelinePaddedImpl<T, /* needsPadding = */ true> {
  template <typename... Args>
  explicit CachelinePaddedImpl(Args&&... args)
      : item(std::forward<Args>(args)...) {}

  T item;
  char padding
      [CacheLocality::kFalseSharingRange -
       sizeof(T) % CacheLocality::kFalseSharingRange];
};
} // namespace detail
} // namespace folly
