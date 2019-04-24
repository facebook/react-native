/*
 * Copyright 2017-present Facebook, Inc.
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
 * @author Giuseppe Ottaviano <ott@fb.com>
 *
 * Shared utils for BitVectorCoding.h and EliasFanoCoding.h.
 */

#pragma once

#include <stddef.h>

namespace folly {
namespace compression {
namespace detail {

/**
 * Helpers to store pointers to forward and skip pointer arrays only
 * if they are used, that is, the quantum is nonzero. If it is 0, the
 * class is empty, and the member is static to keep the syntax valid,
 * thus it will take no space in a derived class thanks to empty base
 * class optimization.
 */
template <size_t>
class ForwardPointers {
 protected:
  explicit ForwardPointers(const unsigned char* ptr) : forwardPointers_(ptr) {}
  const unsigned char* const forwardPointers_;
};
template <>
class ForwardPointers<0> {
 protected:
  explicit ForwardPointers(const unsigned char*) {}
  constexpr static const unsigned char* const forwardPointers_{};
};

template <size_t>
class SkipPointers {
 protected:
  explicit SkipPointers(const unsigned char* ptr) : skipPointers_(ptr) {}
  const unsigned char* const skipPointers_;
};
template <>
class SkipPointers<0> {
 protected:
  explicit SkipPointers(const unsigned char*) {}
  constexpr static const unsigned char* const skipPointers_{};
};
} // namespace detail
} // namespace compression
} // namespace folly
