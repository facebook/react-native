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

#include <array>
#include <string>
#include <vector>

#include <folly/Range.h>
#include <folly/container/Enumerate.h>
#include <folly/portability/GTest.h>

namespace {

template <class T>
struct IsConstReference {
  constexpr static bool value = false;
};
template <class T>
struct IsConstReference<const T&> {
  constexpr static bool value = true;
};

} // namespace

#define ENUMERATE_TEST_BASIC(DECL, NAME)             \
  TEST(Enumerate, NAME) {                            \
    std::vector<std::string> v = {"abc", "a", "ab"}; \
    size_t i = 0;                                    \
    for (DECL it : folly::enumerate(v)) {            \
      EXPECT_EQ(it.index, i);                        \
      EXPECT_EQ(*it, v[i]);                          \
      EXPECT_EQ(it->size(), v[i].size());            \
                                                     \
      /* Test mutability. */                         \
      std::string newValue = "x";                    \
      *it = newValue;                                \
      EXPECT_EQ(newValue, v[i]);                     \
                                                     \
      ++i;                                           \
    }                                                \
                                                     \
    EXPECT_EQ(i, v.size());                          \
  }

ENUMERATE_TEST_BASIC(auto, Basic)
ENUMERATE_TEST_BASIC(auto&&, BasicRRef)

#undef ENUMERATE_TEST_BASIC

#define ENUMERATE_TEST_BASIC_CONST(DECL, NAME)                          \
  TEST(Enumerate, NAME) {                                               \
    std::vector<std::string> v = {"abc", "a", "ab"};                    \
    size_t i = 0;                                                       \
    for (DECL it : folly::enumerate(v)) {                               \
      static_assert(                                                    \
          IsConstReference<decltype(*it)>::value, "Const enumeration"); \
      EXPECT_EQ(it.index, i);                                           \
      EXPECT_EQ(*it, v[i]);                                             \
      EXPECT_EQ(it->size(), v[i].size());                               \
      ++i;                                                              \
    }                                                                   \
                                                                        \
    EXPECT_EQ(i, v.size());                                             \
  }

ENUMERATE_TEST_BASIC_CONST(const auto, BasicConst)
ENUMERATE_TEST_BASIC_CONST(const auto&, BasicConstRef)
ENUMERATE_TEST_BASIC_CONST(const auto&&, BasicConstRRef)

#undef ENUMERATE_TEST_BASIC_CONST

TEST(Enumerate, Temporary) {
  std::vector<std::string> v = {"abc", "a", "ab"};
  size_t i = 0;
  for (auto&& it : folly::enumerate(decltype(v)(v))) { // Copy v.
    EXPECT_EQ(it.index, i);
    EXPECT_EQ(*it, v[i]);
    EXPECT_EQ(it->size(), v[i].size());
    ++i;
  }

  EXPECT_EQ(i, v.size());
}

TEST(Enumerate, BasicConstArg) {
  const std::vector<std::string> v = {"abc", "a", "ab"};
  size_t i = 0;
  for (auto&& it : folly::enumerate(v)) {
    static_assert(
        IsConstReference<decltype(*it)>::value, "Enumerating a const vector");
    EXPECT_EQ(it.index, i);
    EXPECT_EQ(*it, v[i]);
    EXPECT_EQ(it->size(), v[i].size());
    ++i;
  }

  EXPECT_EQ(i, v.size());
}

TEST(Enumerate, TemporaryConstEnumerate) {
  std::vector<std::string> v = {"abc", "a", "ab"};
  size_t i = 0;
  for (const auto&& it : folly::enumerate(decltype(v)(v))) { // Copy v.
    static_assert(IsConstReference<decltype(*it)>::value, "Const enumeration");
    EXPECT_EQ(it.index, i);
    EXPECT_EQ(*it, v[i]);
    EXPECT_EQ(it->size(), v[i].size());
    ++i;
  }

  EXPECT_EQ(i, v.size());
}

TEST(Enumerate, RangeSupport) {
  std::vector<std::string> v = {"abc", "a", "ab"};
  size_t i = 0;
  for (const auto&& it : folly::enumerate(folly::range(v))) {
    EXPECT_EQ(it.index, i);
    EXPECT_EQ(*it, v[i]);
    EXPECT_EQ(it->size(), v[i].size());
    ++i;
  }

  EXPECT_EQ(i, v.size());
}

TEST(Enumerate, EmptyRange) {
  std::vector<std::string> v;
  for (auto&& it : folly::enumerate(v)) {
    (void)it; // Silence warnings.
    ADD_FAILURE();
  }
}

class CStringRange {
  const char* cstr;

 public:
  struct Sentinel {};

  explicit CStringRange(const char* cstr_) : cstr(cstr_) {}

  const char* begin() const {
    return cstr;
  }
  Sentinel end() const {
    return Sentinel{};
  }
};

bool operator==(const char* c, CStringRange::Sentinel) {
  return *c == 0;
}

TEST(Enumerate, Cpp17Support) {
  std::array<char, 5> test = {"test"};
  // Can't use range based for loop until C++17, so test manually
  // Equivalent to:
  // for (const auto&& it : folly::enumerate(CStringRange{test.data()})) { ... }
  {
    auto&& enumerate = folly::enumerate(CStringRange{test.data()});
    auto begin = enumerate.begin();
    auto end = enumerate.end();
    for (; begin != end; ++begin) {
      const auto&& it = *begin;

      ASSERT_LT(it.index, test.size());
      EXPECT_EQ(*it, test[it.index]);
    }
  }
}
