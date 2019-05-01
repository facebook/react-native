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

#include <folly/Range.h>
#include <folly/container/F14Map.h>

namespace folly {

template <
    class Mapped,
    class Hash = hasher<StringPiece>,
    class Eq = std::equal_to<StringPiece>,
    class Alloc = f14::DefaultAlloc<std::pair<std::string const, Mapped>>>
struct StringKeyedUnorderedMap : public F14NodeMap<
                                     std::string,
                                     Mapped,
                                     transparent<Hash>,
                                     transparent<Eq>,
                                     Alloc> {
  using Super = F14NodeMap<
      std::string,
      Mapped,
      transparent<Hash>,
      transparent<Eq>,
      Alloc>;

 public:
  using Super::Super;
  StringKeyedUnorderedMap() : Super() {}

  // TODO(T31574848): Work around libstdc++ versions (e.g., GCC < 6) with no
  // implementation of N4387 ("perfect initialization" for pairs and tuples) to
  // support existing callsites that list-initialize:
  //   m.insert({sp, x});
  std::pair<typename Super::iterator, bool> insert(
      std::pair<StringPiece, Mapped> const& p) {
    return this->emplace(p.first, p.second);
  }
  std::pair<typename Super::iterator, bool> insert(
      std::pair<StringPiece, Mapped>&& p) {
    return this->emplace(std::move(p));
  }
};

} // namespace folly
