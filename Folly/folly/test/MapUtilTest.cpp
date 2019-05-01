/*
 * Copyright 2012-present Facebook, Inc.
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

#include <folly/MapUtil.h>

#include <cstddef>
#include <map>
#include <unordered_map>

#include <folly/Traits.h>
#include <folly/portability/GTest.h>

using namespace folly;

TEST(MapUtil, get_default) {
  std::map<int, int> m;
  m[1] = 2;
  EXPECT_EQ(2, get_default(m, 1, 42));
  EXPECT_EQ(42, get_default(m, 2, 42));
  EXPECT_EQ(0, get_default(m, 3));
}

TEST(MapUtil, get_default_function) {
  std::map<int, int> m;
  m[1] = 2;
  EXPECT_EQ(2, get_default(m, 1, [] { return 42; }));
  EXPECT_EQ(42, get_default(m, 2, [] { return 42; }));
  EXPECT_EQ(0, get_default(m, 3));
}

TEST(MapUtil, get_or_throw) {
  std::map<int, int> m;
  m[1] = 2;
  EXPECT_EQ(2, get_or_throw(m, 1));
  EXPECT_THROW(get_or_throw(m, 2), std::out_of_range);
  EXPECT_EQ(&m[1], &get_or_throw(m, 1));
  get_or_throw(m, 1) = 3;
  EXPECT_EQ(3, get_or_throw(m, 1));
  const auto& cm = m;
  EXPECT_EQ(&m[1], &get_or_throw(cm, 1));
  EXPECT_EQ(3, get_or_throw(cm, 1));
  EXPECT_THROW(get_or_throw(cm, 2), std::out_of_range);
}

TEST(MapUtil, get_or_throw_specified) {
  std::map<int, int> m;
  m[1] = 2;
  EXPECT_EQ(2, get_or_throw<std::runtime_error>(m, 1));
  EXPECT_THROW(get_or_throw<std::runtime_error>(m, 2), std::runtime_error);
}

TEST(MapUtil, get_optional) {
  std::map<int, int> m;
  m[1] = 2;
  EXPECT_TRUE(get_optional(m, 1).hasValue());
  EXPECT_EQ(2, get_optional(m, 1).value());
  EXPECT_FALSE(get_optional(m, 2).hasValue());
}

TEST(MapUtil, get_optional_path_simple) {
  using std::map;
  map<int, map<int, map<int, map<int, int>>>> m{{1, {{2, {{3, {{4, 5}}}}}}}};
  EXPECT_EQ(folly::Optional<int>(5), get_optional(m, 1, 2, 3, 4));
  EXPECT_TRUE(get_optional(m, 1, 2, 3, 4));
  EXPECT_FALSE(get_optional(m, 1, 2, 3, 0));
  EXPECT_TRUE(get_optional(m, 1, 2, 3));
  EXPECT_FALSE(get_optional(m, 1, 2, 0));
  EXPECT_TRUE(get_optional(m, 1, 2));
  EXPECT_FALSE(get_optional(m, 1, 0));
  EXPECT_TRUE(get_optional(m, 1));
  EXPECT_FALSE(get_optional(m, 0));
}

TEST(MapUtil, get_optional_path_mixed) {
  using std::map;
  using std::string;
  using std::unordered_map;
  unordered_map<string, map<int, map<string, int>>> m{{"a", {{1, {{"b", 2}}}}}};
  EXPECT_EQ(folly::Optional<int>(2), get_optional(m, "a", 1, "b"));
  EXPECT_TRUE(get_optional(m, "a", 1, "b"));
  EXPECT_FALSE(get_optional(m, "b", 1, "b"));
  EXPECT_FALSE(get_optional(m, "a", 2, "b"));
  EXPECT_FALSE(get_optional(m, "a", 1, "c"));
  EXPECT_TRUE(get_optional(m, "a", 1));
  EXPECT_TRUE(get_optional(m, "a"));
}

TEST(MapUtil, get_ref_default) {
  std::map<int, int> m;
  m[1] = 2;
  const int i = 42;
  EXPECT_EQ(2, get_ref_default(m, 1, i));
  EXPECT_EQ(42, get_ref_default(m, 2, i));
  EXPECT_EQ(std::addressof(i), std::addressof(get_ref_default(m, 2, i)));
}

TEST(MapUtil, get_ref_default_function) {
  std::map<int, int> m;
  m[1] = 2;
  const int i = 42;
  EXPECT_EQ(2, get_ref_default(m, 1, [&i]() -> const int& { return i; }));
  EXPECT_EQ(42, get_ref_default(m, 2, [&i]() -> const int& { return i; }));
  EXPECT_EQ(
      std::addressof(i),
      std::addressof(
          get_ref_default(m, 2, [&i]() -> const int& { return i; })));
  // statically disallowed:
  // get_ref_default(m, 2, [] { return 7; });
}

TEST(MapUtil, get_ptr) {
  std::map<int, int> m;
  m[1] = 2;
  EXPECT_EQ(2, *get_ptr(m, 1));
  EXPECT_TRUE(get_ptr(m, 2) == nullptr);
  *get_ptr(m, 1) = 4;
  EXPECT_EQ(4, m.at(1));
}

TEST(MapUtil, get_ptr_path_simple) {
  using std::map;
  map<int, map<int, map<int, map<int, int>>>> m{{1, {{2, {{3, {{4, 5}}}}}}}};
  EXPECT_EQ(5, *get_ptr(m, 1, 2, 3, 4));
  EXPECT_TRUE(get_ptr(m, 1, 2, 3, 4));
  EXPECT_FALSE(get_ptr(m, 1, 2, 3, 0));
  EXPECT_TRUE(get_ptr(m, 1, 2, 3));
  EXPECT_FALSE(get_ptr(m, 1, 2, 0));
  EXPECT_TRUE(get_ptr(m, 1, 2));
  EXPECT_FALSE(get_ptr(m, 1, 0));
  EXPECT_TRUE(get_ptr(m, 1));
  EXPECT_FALSE(get_ptr(m, 0));
  const auto& cm = m;
  ++*get_ptr(m, 1, 2, 3, 4);
  EXPECT_EQ(6, *get_ptr(cm, 1, 2, 3, 4));
  EXPECT_TRUE(get_ptr(cm, 1, 2, 3, 4));
  EXPECT_FALSE(get_ptr(cm, 1, 2, 3, 0));
}

TEST(MapUtil, get_ptr_path_mixed) {
  using std::map;
  using std::string;
  using std::unordered_map;
  unordered_map<string, map<int, map<string, int>>> m{{"a", {{1, {{"b", 7}}}}}};
  EXPECT_EQ(7, *get_ptr(m, "a", 1, "b"));
  EXPECT_TRUE(get_ptr(m, "a", 1, "b"));
  EXPECT_FALSE(get_ptr(m, "b", 1, "b"));
  EXPECT_FALSE(get_ptr(m, "a", 2, "b"));
  EXPECT_FALSE(get_ptr(m, "a", 1, "c"));
  EXPECT_TRUE(get_ptr(m, "a", 1));
  EXPECT_TRUE(get_ptr(m, "a"));
  const auto& cm = m;
  ++*get_ptr(m, "a", 1, "b");
  EXPECT_EQ(8, *get_ptr(cm, "a", 1, "b"));
  EXPECT_TRUE(get_ptr(cm, "a", 1, "b"));
  EXPECT_FALSE(get_ptr(cm, "b", 1, "b"));
}

namespace {
template <typename T>
struct element_type {
  using type = typename std::decay<T>::type;
};

template <typename T>
struct element_type<T()> {
  using type = T;
};

template <typename T>
using element_type_t = typename element_type<T>::type;

template <typename T, typename = void>
struct Compiles : std::false_type {};

template <typename T>
struct Compiles<
    T,
    void_t<decltype(get_ref_default(
        std::declval<std::map<int, element_type_t<T>>>(),
        std::declval<int>(),
        std::declval<T>()))>> : std::true_type {};
} // namespace

TEST(MapUtil, get_default_temporary) {
  EXPECT_TRUE(Compiles<const int&>::value);
  EXPECT_TRUE(Compiles<int&>::value);
  EXPECT_FALSE(Compiles<const int&&>::value);
  EXPECT_FALSE(Compiles<int&&>::value);

  EXPECT_TRUE(Compiles<const int&()>::value);
  EXPECT_TRUE(Compiles<int&()>::value);
  EXPECT_FALSE(Compiles<int()>::value);
}

TEST(MapUtil, get_default_path) {
  using std::map;
  map<int, map<int, int>> m;
  m[4][2] = 42;
  EXPECT_EQ(42, get_default(m, 4, 2, 42));
  EXPECT_EQ(42, get_default(m, 1, 3, 42));
}

TEST(MapUtil, get_default_path_mixed) {
  using std::map;
  using std::string;
  using std::unordered_map;
  map<int, unordered_map<string, StringPiece>> m;
  int key1 = 42;
  const string key2 = "hello";
  constexpr StringPiece value = "world";
  constexpr StringPiece dflt = "default";
  m[key1][key2] = value;
  EXPECT_EQ(value, get_default(m, 42, key2, dflt));
  EXPECT_EQ(value, get_default(m, key1, "hello", dflt));
  EXPECT_EQ(dflt, get_default(m, 0, key2, dflt));
  EXPECT_EQ(dflt, get_default(m, key1, "bad", "default"));
}

TEST(MapUtil, get_ref_default_path) {
  using std::map;
  map<int, map<int, int>> m;
  m[4][2] = 42;
  const int dflt = 13;
  EXPECT_EQ(42, get_ref_default(m, 4, 2, dflt));
  EXPECT_EQ(dflt, get_ref_default(m, 1, 3, dflt));
}

TEST(MapUtil, get_ref_default_path_mixed) {
  using std::map;
  using std::string;
  using std::unordered_map;
  map<int, unordered_map<string, StringPiece>> m;
  int key1 = 42;
  const string key2 = "hello";
  constexpr StringPiece value = "world";
  constexpr StringPiece dflt = "default";
  m[key1][key2] = value;
  EXPECT_EQ(value, get_ref_default(m, 42, key2, dflt));
  EXPECT_EQ(value, get_ref_default(m, key1, "hello", dflt));
  EXPECT_EQ(dflt, get_ref_default(m, 0, key2, dflt));
  EXPECT_EQ(dflt, get_ref_default(m, key1, "bad", dflt));
}

namespace {
template <typename T, typename = void>
struct GetRefDefaultPathCompiles : std::false_type {};

template <typename T>
struct GetRefDefaultPathCompiles<
    T,
    void_t<decltype(get_ref_default(
        std::declval<std::map<int, std::map<int, element_type_t<T>>>>(),
        std::declval<int>(),
        std::declval<int>(),
        std::declval<T>()))>> : std::true_type {};
} // namespace

TEST(MapUtil, get_ref_default_path_temporary) {
  EXPECT_TRUE(GetRefDefaultPathCompiles<const int&>::value);
  EXPECT_TRUE(GetRefDefaultPathCompiles<int&>::value);
  EXPECT_FALSE(GetRefDefaultPathCompiles<const int&&>::value);
  EXPECT_FALSE(GetRefDefaultPathCompiles<int&&>::value);
}

namespace {

class TestConstruction {
 public:
  TestConstruction() {
    EXPECT_TRUE(false);
  }
  TestConstruction(TestConstruction&&) {
    EXPECT_TRUE(false);
  }
  TestConstruction(const TestConstruction&) {
    EXPECT_TRUE(false);
  }

  explicit TestConstruction(std::string&& string)
      : string_{std::move(string)} {}
  explicit TestConstruction(int&& integer) : integer_{integer} {}

  TestConstruction& operator=(const TestConstruction&) = delete;
  TestConstruction& operator=(TestConstruction&&) = delete;

  int integer_{};
  std::string string_{};
};

} // namespace

TEST(MapUtil, test_get_default_deferred_construction) {
  auto map = std::unordered_map<int, TestConstruction>{};
  map.emplace(
      std::piecewise_construct,
      std::forward_as_tuple(1),
      std::forward_as_tuple(1));

  EXPECT_EQ(map.at(1).integer_, 1);

  {
    auto val = get_default(map, 0, 1);
    EXPECT_EQ(val.integer_, 1);
    EXPECT_EQ(val.string_, "");
  }

  {
    auto val = get_default(map, 0, "something");
    EXPECT_EQ(val.integer_, 0);
    EXPECT_EQ(val.string_, "something");
  }
}
