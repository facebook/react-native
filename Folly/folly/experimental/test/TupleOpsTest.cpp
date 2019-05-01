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

#include <folly/experimental/TupleOps.h>

#include <folly/Conv.h>
#include <folly/portability/GTest.h>

#include <glog/logging.h>

namespace folly {
namespace test {

TEST(TupleOps, Copiable) {
  auto t = std::make_tuple(10, std::string("hello"), 30);

  EXPECT_EQ(10, std::get<0>(t));
  auto t1 = tupleRange<1>(t);
  EXPECT_EQ("hello", std::get<0>(t1));
  EXPECT_EQ(2, std::tuple_size<decltype(t1)>::value);
  auto t2 = tupleRange<1, 1>(t);
  EXPECT_EQ(1, std::tuple_size<decltype(t2)>::value);
  EXPECT_EQ("hello", std::get<0>(t2));
  EXPECT_EQ(30, std::get<0>(tupleRange<1>(tupleRange<1>(t))));

  EXPECT_TRUE(t == tuplePrepend(std::get<0>(t), tupleRange<1>(t)));
}

class MovableInt {
 public:
  explicit MovableInt(int value) : value_(value) {}
  int value() const {
    return value_;
  }

  MovableInt(MovableInt&&) = default;
  MovableInt& operator=(MovableInt&&) = default;
  MovableInt(const MovableInt&) = delete;
  MovableInt& operator=(const MovableInt&) = delete;

 private:
  int value_;
};

bool operator==(const MovableInt& a, const MovableInt& b) {
  return a.value() == b.value();
}

TEST(TupleOps, Movable) {
  auto t1 = std::make_tuple(MovableInt(10), std::string("hello"), 30);
  auto t2 = std::make_tuple(MovableInt(10), std::string("hello"), 30);
  auto t3 = std::make_tuple(MovableInt(10), std::string("hello"), 30);

  auto t1car = std::get<0>(std::move(t1));
  auto t2cdr = tupleRange<1>(std::move(t2));

  EXPECT_TRUE(t3 == tuplePrepend(std::move(t1car), std::move(t2cdr)));
}

// Given a tuple of As, convert to a tuple of Bs (of the same size)
// by calling folly::to on matching types.
//
// There are two example implementation: tupleTo (using tail recursion), which
// may create a lot of intermediate tuples, and tupleTo2, using
// TemplateTupleRange directly (below).
template <class U, class T>
U tupleTo(const T& input);

template <class U, class T>
struct TupleTo;

// Base case: empty typle -> empty tuple
template <>
struct TupleTo<std::tuple<>, std::tuple<>> {
  static std::tuple<> convert(const std::tuple<>& /* input */) {
    return std::make_tuple();
  }
};

// Induction case: split off head element and convert it, then call tupleTo on
// the tail.
template <class U, class... Us, class T>
struct TupleTo<std::tuple<U, Us...>, T> {
  static std::tuple<U, Us...> convert(const T& input) {
    return tuplePrepend(
        folly::to<U>(std::get<0>(input)),
        tupleTo<std::tuple<Us...>>(tupleRange<1>(input)));
  }
};

template <class U, class T>
U tupleTo(const T& input) {
  return TupleTo<U, T>::convert(input);
}

template <class S>
struct TupleTo2;

// Destructure all indexes into Ns... and use parameter pack expansion
// to repeat the conversion for each individual element, then wrap
// all results with make_tuple.
template <std::size_t... Ns>
struct TupleTo2<TemplateSeq<std::size_t, Ns...>> {
  template <class U, class T>
  static U convert(const T& input) {
    return std::make_tuple(folly::to<typename std::tuple_element<Ns, U>::type>(
        std::get<Ns>(input))...);
  }
};

template <
    class U,
    class T,
    class Seq = typename TemplateTupleRange<U>::type,
    class Enable = typename std::enable_if<
        (std::tuple_size<U>::value == std::tuple_size<T>::value)>::type>
U tupleTo2(const T& input) {
  return TupleTo2<Seq>::template convert<U>(input);
}

#define CHECK_TUPLE_TO(converter)                                  \
  do {                                                             \
    auto src = std::make_tuple(42, "50", 10);                      \
    auto dest = converter<std::tuple<std::string, int, int>>(src); \
    EXPECT_EQ("42", std::get<0>(dest));                            \
    EXPECT_EQ(50, std::get<1>(dest));                              \
    EXPECT_EQ(10, std::get<2>(dest));                              \
  } while (false)

TEST(TupleOps, TupleTo) {
  CHECK_TUPLE_TO(tupleTo);
}

TEST(TupleOps, TupleTo2) {
  CHECK_TUPLE_TO(tupleTo2);
}

#undef CHECK_TUPLE_TO

} // namespace test
} // namespace folly
