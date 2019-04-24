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

#include <folly/detail/RangeCommon.h>

#include <bitset>

#include <folly/container/SparseByteSet.h>

namespace folly {

namespace detail {

size_t qfind_first_byte_of_bitset(
    const StringPieceLite haystack,
    const StringPieceLite needles) {
  std::bitset<256> s;
  for (auto needle : needles) {
    s[(uint8_t)needle] = true;
  }
  for (size_t index = 0; index < haystack.size(); ++index) {
    if (s[(uint8_t)haystack[index]]) {
      return index;
    }
  }
  return std::string::npos;
}

size_t qfind_first_byte_of_byteset(
    const StringPieceLite haystack,
    const StringPieceLite needles) {
  SparseByteSet s;
  for (auto needle : needles) {
    s.add(uint8_t(needle));
  }
  for (size_t index = 0; index < haystack.size(); ++index) {
    if (s.contains(uint8_t(haystack[index]))) {
      return index;
    }
  }
  return std::string::npos;
}
} // namespace detail
} // namespace folly
