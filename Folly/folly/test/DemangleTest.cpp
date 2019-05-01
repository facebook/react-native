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

#include <folly/Demangle.h>

#include <folly/detail/Demangle.h>
#include <folly/portability/GTest.h>

using folly::demangle;

namespace folly_test {
struct ThisIsAVeryLongStructureName {};
} // namespace folly_test

#if FOLLY_DETAIL_HAVE_DEMANGLE_H
TEST(Demangle, demangle) {
  char expected[] = "folly_test::ThisIsAVeryLongStructureName";
  EXPECT_STREQ(
      expected,
      demangle(typeid(folly_test::ThisIsAVeryLongStructureName)).c_str());

  {
    char buf[sizeof(expected)];
    EXPECT_EQ(
        sizeof(expected) - 1,
        demangle(
            typeid(folly_test::ThisIsAVeryLongStructureName),
            buf,
            sizeof(buf)));
    EXPECT_STREQ(expected, buf);

    EXPECT_EQ(
        sizeof(expected) - 1,
        demangle(typeid(folly_test::ThisIsAVeryLongStructureName), buf, 11));
    EXPECT_STREQ("folly_test", buf);
  }
}

#if defined(FOLLY_DEMANGLE_MAX_SYMBOL_SIZE)
namespace {

template <int I, class T1, class T2>
struct Node {};

template <int N, int I = 1>
struct LongSymbol {
  using arg1 = typename LongSymbol<N / 2, 2 * I>::type;
  using arg2 = typename LongSymbol<N / 2, 2 * I + 1>::type;
  using type = Node<I, arg1, arg2>;
};

template <int I>
struct LongSymbol<0, I> {
  using type = void;
};

} // namespace

TEST(Demangle, LongSymbolFallback) {
  // The symbol must be at least FOLLY_DEMANGLE_MAX_SYMBOL_SIZE long.
  using Symbol = LongSymbol<FOLLY_DEMANGLE_MAX_SYMBOL_SIZE>::type;
  auto name = typeid(Symbol).name();

  EXPECT_STREQ(name, demangle(name).c_str());

  char buf[16];
  char expected[16];
  folly::demangle(name, buf, 16);
  folly::strlcpy(expected, name, 16);
  EXPECT_STREQ(expected, buf);
}
#endif // defined(FOLLY_DEMANGLE_MAX_SYMBOL_SIZE)

#endif // FOLLY_DETAIL_HAVE_DEMANGLE_H

TEST(Demangle, strlcpy) {
  char buf[6];

  EXPECT_EQ(3, folly::strlcpy(buf, "abc", 6));
  EXPECT_EQ('\0', buf[3]);
  EXPECT_EQ("abc", std::string(buf));

  EXPECT_EQ(7, folly::strlcpy(buf, "abcdefg", 3));
  EXPECT_EQ('\0', buf[2]);
  EXPECT_EQ("ab", std::string(buf));

  const char* big_string = "abcdefghijklmnop";

  EXPECT_EQ(strlen(big_string), folly::strlcpy(buf, big_string, sizeof(buf)));
  EXPECT_EQ('\0', buf[5]);
  EXPECT_EQ("abcde", std::string(buf));

  buf[0] = 'z';
  EXPECT_EQ(strlen(big_string), folly::strlcpy(buf, big_string, 0));
  EXPECT_EQ('z', buf[0]); // unchanged, size = 0
}
