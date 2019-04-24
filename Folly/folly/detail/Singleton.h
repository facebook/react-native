/*
 * Copyright 2018-present Facebook, Inc.
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

namespace folly {
namespace detail {

struct DefaultTag {};

template <typename T>
struct DefaultMake {
  // Required form until C++17, which permits returning objects of types which
  // are neither copy-constructible nor move-constructible.
  T* operator()(unsigned char (&buf)[sizeof(T)]) const {
    return new (buf) T();
  }
};

} // namespace detail
} // namespace folly
