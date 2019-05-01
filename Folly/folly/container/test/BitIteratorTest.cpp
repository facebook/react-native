/*
 * Copyright 2011-present Facebook, Inc.
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

#include <folly/container/BitIterator.h>

#include <limits>
#include <type_traits>
#include <vector>

#include <folly/portability/GTest.h>

using namespace folly;
using namespace folly::bititerator_detail;

namespace {

template <class INT, class IT>
void checkIt(INT exp, IT& it) {
  typedef typename std::make_unsigned<INT>::type utype;
  size_t bits = std::numeric_limits<utype>::digits;
  utype uexp = exp;
  for (size_t i = 0; i < bits; ++i) {
    bool e = uexp & 1;
    EXPECT_EQ(e, *it++);
    uexp >>= 1;
  }
}

template <class INT, class IT>
void checkRange(INT exp, IT begin, IT end) {
  typedef typename std::make_unsigned<INT>::type utype;
  utype uexp = exp;
  size_t i = 0;
  auto bitEnd = makeBitIterator(end);
  for (BitIterator<IT> it = makeBitIterator(begin); it != bitEnd; ++it, ++i) {
    bool e = uexp & 1;
    EXPECT_EQ(e, *it);
    uexp >>= 1;
  }
}

} // namespace

TEST(BitIterator, Simple) {
  std::vector<int> v;
  v.push_back(0x10);
  v.push_back(0x42);
  auto bi(makeBitIterator(v.begin()));
  checkIt(0x10, bi);
  checkIt(0x42, bi);
  checkRange(0x0000004200000010ULL, v.begin(), v.end());

  v[0] = 0;
  bi = v.begin();
  *bi++ = true; // 1
  *bi++ = false;
  *bi++ = true; // 4
  *bi++ = false;
  *bi++ = false;
  *bi++ = true; // 32
  *++bi = true; // 128 (note pre-increment)

  EXPECT_EQ(165, v[0]);
}

TEST(BitIterator, Const) {
  std::vector<int> v;
  v.push_back(0x10);
  v.push_back(0x42);
  auto bi(makeBitIterator(v.cbegin()));
  checkIt(0x10, bi);
  checkIt(0x42, bi);
}
