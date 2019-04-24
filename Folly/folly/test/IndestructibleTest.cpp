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

#include <folly/Indestructible.h>

#include <functional>
#include <map>
#include <memory>
#include <string>
#include <tuple>

#include <folly/Memory.h>
#include <folly/portability/GTest.h>

using namespace std;
using namespace folly;

namespace {

struct Magic {
  function<void()> dtor_;
  function<void()> move_;
  Magic(function<void()> ctor, function<void()> dtor, function<void()> move)
      : dtor_(std::move(dtor)), move_(std::move(move)) {
    ctor();
  }
  Magic(Magic&& other) /* may throw */ {
    *this = std::move(other);
  }
  Magic& operator=(Magic&& other) {
    dtor_ = std::move(other.dtor_);
    move_ = std::move(other.move_);
    move_();
    return *this;
  }
  ~Magic() {
    dtor_();
  }
};

class IndestructibleTest : public testing::Test {};
} // namespace

TEST_F(IndestructibleTest, access) {
  static const Indestructible<map<string, int>> data{
      map<string, int>{{"key1", 17}, {"key2", 19}, {"key3", 23}}};

  auto& m = *data;
  EXPECT_EQ(19, m.at("key2"));
}

TEST_F(IndestructibleTest, no_destruction) {
  int state = 0;
  int value = 0;

  static Indestructible<Magic> sing(
      [&] {
        ++state;
        value = 7;
      },
      [&] { state = -1; },
      [] {});
  EXPECT_EQ(1, state);
  EXPECT_EQ(7, value);

  sing.~Indestructible();
  EXPECT_EQ(1, state);
}

TEST_F(IndestructibleTest, empty) {
  static const Indestructible<map<string, int>> data;
  auto& m = *data;
  EXPECT_EQ(0, m.size());
}

TEST_F(IndestructibleTest, move) {
  int state = 0;
  int value = 0;
  int moves = 0;

  static Indestructible<Magic> sing( // move assignment
      [&] {
        ++state;
        value = 7;
      },
      [&] { state = -1; },
      [&] { ++moves; });

  EXPECT_EQ(1, state);
  EXPECT_EQ(7, value);
  EXPECT_EQ(0, moves);

  // move constructor
  static Indestructible<Magic> move_ctor(std::move(sing));
  EXPECT_EQ(1, state);
  EXPECT_EQ(1, moves);

  // move assignment
  static Indestructible<Magic> move_assign = std::move(move_ctor);
  EXPECT_EQ(1, state);
  EXPECT_EQ(2, moves);
}

TEST_F(IndestructibleTest, disabled_default_ctor) {
  EXPECT_TRUE((std::is_constructible<Indestructible<int>>::value)) << "sanity";

  struct Foo {
    Foo(int) {}
  };
  EXPECT_FALSE((std::is_constructible<Indestructible<Foo>>::value));
  EXPECT_FALSE((std::is_constructible<Indestructible<Foo>, Magic>::value));
  EXPECT_TRUE((std::is_constructible<Indestructible<Foo>, int>::value));
}

TEST_F(IndestructibleTest, list_initialization) {
  auto map = folly::Indestructible<std::map<int, int>>{{{1, 2}}};
  EXPECT_EQ(map->at(1), 2);
}

namespace {
class InitializerListConstructible {
 public:
  InitializerListConstructible(InitializerListConstructible&&) = default;
  explicit InitializerListConstructible(std::initializer_list<int>) {}
  InitializerListConstructible(std::initializer_list<double>, double) {}
};
} // namespace

TEST_F(IndestructibleTest, initializer_list_in_place_initialization) {
  using I = InitializerListConstructible;
  std::ignore = Indestructible<I>{{1, 2, 3, 4}};
  std::ignore = Indestructible<I>{{1.2}, 4.2};
}

namespace {
class ExplicitlyMoveConstructible {
 public:
  ExplicitlyMoveConstructible() = default;
  explicit ExplicitlyMoveConstructible(ExplicitlyMoveConstructible&&) = default;
};
} // namespace

TEST_F(IndestructibleTest, list_initialization_explicit_implicit) {
  using E = ExplicitlyMoveConstructible;
  using I = std::map<int, int>;
  EXPECT_TRUE((!std::is_convertible<E, Indestructible<E>>::value));
  EXPECT_TRUE((std::is_convertible<I, Indestructible<I>>::value));
}
