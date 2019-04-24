/*
 * Copyright 2014-present Facebook, Inc.
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
#define FOLLY_GEN_COMBINE_H_

#include <folly/gen/Base.h>

namespace folly {
namespace gen {
namespace detail {

template <class Container>
class Interleave;

template <class Container>
class Zip;

} // namespace detail

template <
    class Source2,
    class Source2Decayed = typename std::decay<Source2>::type,
    class Interleave = detail::Interleave<Source2Decayed>>
Interleave interleave(Source2&& source2) {
  return Interleave(std::forward<Source2>(source2));
}

} // namespace gen
} // namespace folly

#include <folly/gen/Combine-inl.h>
