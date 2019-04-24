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

#include <algorithm>
#include <string>

#include <glog/logging.h>

#include <folly/Likely.h>

namespace folly {

namespace detail {

/***
 *  The qfind_first_byte_of_* functions are declared here, before Range.h, so
 *  they cannot take StringPiece values. But they're there to operate on
 *  StringPiece values. Dependency cycles: fun.
 *
 *  StringPieceLite is here to break that dependency cycle.
 */
class StringPieceLite {
 public:
  StringPieceLite(const char* b, const char* e) : b_(b), e_(e) {}
  template <typename Range>
  /* implicit */ StringPieceLite(const Range& r)
      : StringPieceLite(r.data(), r.data() + r.size()) {}
  const char* data() const {
    return b_;
  }
  const char* begin() const {
    return b_;
  }
  const char* end() const {
    return e_;
  }
  size_t size() const {
    return size_t(e_ - b_);
  }
  bool empty() const {
    return size() == 0;
  }
  const char& operator[](size_t i) const {
    DCHECK_GT(size(), i);
    return b_[i];
  }
  template <typename Range>
  explicit operator Range() const {
    return Range(begin(), end());
  }

 private:
  const char* b_;
  const char* e_;
};

inline size_t qfind_first_byte_of_std(
    const StringPieceLite haystack,
    const StringPieceLite needles) {
  auto ret = std::find_first_of(
      haystack.begin(),
      haystack.end(),
      needles.begin(),
      needles.end(),
      [](char a, char b) { return a == b; });
  return ret == haystack.end() ? std::string::npos : ret - haystack.begin();
}

size_t qfind_first_byte_of_bitset(
    const StringPieceLite haystack,
    const StringPieceLite needles);

size_t qfind_first_byte_of_byteset(
    const StringPieceLite haystack,
    const StringPieceLite needles);

inline size_t qfind_first_byte_of_nosse(
    const StringPieceLite haystack,
    const StringPieceLite needles) {
  if (UNLIKELY(needles.empty() || haystack.empty())) {
    return std::string::npos;
  }
  // The thresholds below were empirically determined by benchmarking.
  // This is not an exact science since it depends on the CPU, the size of
  // needles, and the size of haystack.
  if ((needles.size() >= 4 && haystack.size() <= 10) ||
      (needles.size() >= 16 && haystack.size() <= 64) || needles.size() >= 32) {
    return qfind_first_byte_of_byteset(haystack, needles);
  }
  return qfind_first_byte_of_std(haystack, needles);
}
} // namespace detail
} // namespace folly
