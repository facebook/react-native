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

#include <folly/Expected.h>
#include <folly/Portability.h>
#include <folly/portability/GTest.h>

#include <algorithm>
#include <iomanip>
#include <memory>
#include <string>
#include <type_traits>
#include <vector>

#include <glog/logging.h>

using std::shared_ptr;
using std::unique_ptr;

namespace folly {

enum class E { E1, E2 };

std::ostream& operator<<(std::ostream& os, E e) {
  switch (e) {
    case E::E1:
      return os << "E::E1";
    case E::E2:
      return os << "E::E2";
    default:;
  }
  return os;
}

template <class V, class E>
std::ostream& operator<<(std::ostream& os, const Expected<V, E>& e) {
  if (e) {
    os << "Expected(" << e.value() << ')';
  } else {
    os << "Unexpected(" << e.error() << ')';
  }
  return os;
}

struct NoDefault {
  NoDefault(int, int) {}
  char a, b, c;
};

TEST(Expected, NoDefault) {
  static_assert(
      std::is_default_constructible<Expected<NoDefault, int>>::value, "");
  Expected<NoDefault, int> x{in_place, 42, 42};
  EXPECT_TRUE(bool(x));
  x.emplace(4, 5);
  EXPECT_TRUE(bool(x));
  x = makeUnexpected(42);
  EXPECT_FALSE(bool(x));
  EXPECT_EQ(42, x.error());
}

TEST(Expected, String) {
  Expected<std::string, int> maybeString;
  EXPECT_FALSE(bool(maybeString));
  EXPECT_EQ(0, maybeString.error());
  maybeString = "hello";
  EXPECT_TRUE(bool(maybeString));
  EXPECT_EQ("hello", *maybeString);
}

TEST(Expected, Ambiguous) {
  // Potentially ambiguous and confusing construction and assignment disallowed:
  EXPECT_FALSE((std::is_constructible<Expected<int, int>, int>::value));
  EXPECT_FALSE((std::is_assignable<Expected<int, int>&, int>::value));
}

TEST(Expected, Const) {
  { // default construct
    Expected<const int, int> ex;
    EXPECT_FALSE(bool(ex));
    EXPECT_EQ(0, ex.error());
    ex.emplace(4);
    EXPECT_EQ(4, *ex);
    ex.emplace(5);
    EXPECT_EQ(5, *ex);
    ex = makeUnexpected(42);
    EXPECT_FALSE(bool(ex));
    EXPECT_EQ(42, ex.error());
  }
  { // copy-constructed
    const int x = 6;
    Expected<const int, int> ex{in_place, x};
    Expected<const int, int> ex2 = ex;
    EXPECT_EQ(6, *ex2);
  }
  { // move-constructed
    const int x = 7;
    Expected<const int, int> ex{in_place, std::move(x)};
    Expected<const int, int> ex2 = std::move(ex);
    EXPECT_EQ(7, *ex2);
  }
  // no assignment allowed
  EXPECT_FALSE((std::is_copy_assignable<Expected<const int, int>>::value));
}

TEST(Expected, Simple) {
  Expected<int, int> ex;
  EXPECT_FALSE(bool(ex));
  EXPECT_EQ(42, ex.value_or(42));
  ex.emplace(4);
  EXPECT_TRUE(bool(ex));
  EXPECT_EQ(4, *ex);
  EXPECT_EQ(4, ex.value_or(42));
  ex = makeUnexpected(-1);
  EXPECT_FALSE(bool(ex));
  EXPECT_EQ(-1, ex.error());
  EXPECT_EQ(42, ex.value_or(42));
}

class MoveTester {
 public:
  /* implicit */ MoveTester(const char* s) : s_(s) {}
  MoveTester(const MoveTester&) = default;
  MoveTester(MoveTester&& other) noexcept {
    s_ = std::move(other.s_);
    other.s_ = "";
  }
  MoveTester& operator=(const MoveTester&) = default;
  MoveTester& operator=(MoveTester&& other) noexcept {
    s_ = std::move(other.s_);
    other.s_ = "";
    return *this;
  }

 private:
  friend bool operator==(const MoveTester& o1, const MoveTester& o2);
  std::string s_;
};

bool operator==(const MoveTester& o1, const MoveTester& o2) {
  return o1.s_ == o2.s_;
}

TEST(Expected, value_or_rvalue_arg) {
  Expected<MoveTester, int> ex = makeUnexpected(-1);
  MoveTester dflt = "hello";
  EXPECT_EQ("hello", ex.value_or(dflt));
  EXPECT_EQ("hello", dflt);
  EXPECT_EQ("hello", ex.value_or(std::move(dflt)));
  EXPECT_EQ("", dflt);
  EXPECT_EQ("world", ex.value_or("world"));

  dflt = "hello";
  // Make sure that the const overload works on const objects
  const auto& exc = ex;
  EXPECT_EQ("hello", exc.value_or(dflt));
  EXPECT_EQ("hello", dflt);
  EXPECT_EQ("hello", exc.value_or(std::move(dflt)));
  EXPECT_EQ("", dflt);
  EXPECT_EQ("world", exc.value_or("world"));

  dflt = "hello";
  ex = "meow";
  EXPECT_EQ("meow", ex.value_or(dflt));
  EXPECT_EQ("hello", dflt);
  EXPECT_EQ("meow", ex.value_or(std::move(dflt)));
  EXPECT_EQ("hello", dflt); // only moved if used
}

TEST(Expected, value_or_noncopyable) {
  Expected<std::unique_ptr<int>, int> ex{unexpected, 42};
  std::unique_ptr<int> dflt(new int(42));
  EXPECT_EQ(42, *std::move(ex).value_or(std::move(dflt)));
}

struct ExpectingDeleter {
  explicit ExpectingDeleter(int expected_) : expected(expected_) {}
  int expected;
  void operator()(const int* ptr) {
    EXPECT_EQ(*ptr, expected);
    delete ptr;
  }
};

TEST(Expected, value_move) {
  auto ptr = Expected<std::unique_ptr<int, ExpectingDeleter>, int>(
                 in_place, new int(42), ExpectingDeleter{1337})
                 .value();
  *ptr = 1337;
}

TEST(Expected, dereference_move) {
  auto ptr = *Expected<std::unique_ptr<int, ExpectingDeleter>, int>(
      in_place, new int(42), ExpectingDeleter{1337});
  *ptr = 1337;
}

TEST(Expected, EmptyConstruct) {
  Expected<int, int> ex{unexpected, 42};
  EXPECT_FALSE(bool(ex));
  Expected<int, int> test1(ex);
  EXPECT_FALSE(bool(test1));
  Expected<int, int> test2(std::move(ex));
  EXPECT_FALSE(bool(test2));
  EXPECT_EQ(42, test2.error());
}

TEST(Expected, Unique) {
  Expected<unique_ptr<int>, int> ex;

  ex = makeUnexpected(-1);
  EXPECT_FALSE(bool(ex));
  // empty->emplaced
  ex.emplace(new int(5));
  EXPECT_TRUE(bool(ex));
  EXPECT_EQ(5, **ex);

  ex = makeUnexpected(-1);
  // empty->moved
  ex = std::make_unique<int>(6);
  EXPECT_EQ(6, **ex);
  // full->moved
  ex = std::make_unique<int>(7);
  EXPECT_EQ(7, **ex);

  // move it out by move construct
  Expected<unique_ptr<int>, int> moved(std::move(ex));
  EXPECT_TRUE(bool(moved));
  EXPECT_TRUE(bool(ex));
  EXPECT_EQ(nullptr, ex->get());
  EXPECT_EQ(7, **moved);

  EXPECT_TRUE(bool(moved));
  ex = std::move(moved); // move it back by move assign
  EXPECT_TRUE(bool(moved));
  EXPECT_EQ(nullptr, moved->get());
  EXPECT_TRUE(bool(ex));
  EXPECT_EQ(7, **ex);
}

TEST(Expected, Shared) {
  shared_ptr<int> ptr;
  Expected<shared_ptr<int>, int> ex{unexpected, -1};
  EXPECT_FALSE(bool(ex));
  // empty->emplaced
  ex.emplace(new int(5));
  EXPECT_TRUE(bool(ex));
  ptr = ex.value();
  EXPECT_EQ(ptr.get(), ex->get());
  EXPECT_EQ(2, ptr.use_count());
  ex = makeUnexpected(-1);
  EXPECT_EQ(1, ptr.use_count());
  // full->copied
  ex = ptr;
  EXPECT_EQ(2, ptr.use_count());
  EXPECT_EQ(ptr.get(), ex->get());
  ex = makeUnexpected(-1);
  EXPECT_EQ(1, ptr.use_count());
  // full->moved
  ex = std::move(ptr);
  EXPECT_EQ(1, ex->use_count());
  EXPECT_EQ(nullptr, ptr.get());
  {
    EXPECT_EQ(1, ex->use_count());
    Expected<shared_ptr<int>, int> copied(ex);
    EXPECT_EQ(2, ex->use_count());
    Expected<shared_ptr<int>, int> moved(std::move(ex));
    EXPECT_EQ(2, moved->use_count());
    moved.emplace(new int(6));
    EXPECT_EQ(1, moved->use_count());
    copied = moved;
    EXPECT_EQ(2, moved->use_count());
  }
}

TEST(Expected, Order) {
  std::vector<Expected<int, E>> vect{
      {unexpected, E::E1},
      {3},
      {1},
      {unexpected, E::E1},
      {2},
  };
  std::vector<Expected<int, E>> expected{
      {unexpected, E::E1},
      {unexpected, E::E1},
      {1},
      {2},
      {3},
  };
  std::sort(vect.begin(), vect.end());
  EXPECT_EQ(vect, expected);
}

TEST(Expected, SwapMethod) {
  Expected<std::string, E> a;
  Expected<std::string, E> b;

  a.swap(b);
  EXPECT_FALSE(a.hasValue());
  EXPECT_FALSE(b.hasValue());

  a = "hello";
  EXPECT_TRUE(a.hasValue());
  EXPECT_FALSE(b.hasValue());
  EXPECT_EQ("hello", a.value());

  b.swap(a);
  EXPECT_FALSE(a.hasValue());
  EXPECT_TRUE(b.hasValue());
  EXPECT_EQ("hello", b.value());

  a = "bye";
  EXPECT_TRUE(a.hasValue());
  EXPECT_EQ("bye", a.value());

  a.swap(b);
  EXPECT_EQ("hello", a.value());
  EXPECT_EQ("bye", b.value());
}

TEST(Expected, StdSwapFunction) {
  Expected<std::string, E> a;
  Expected<std::string, E> b;

  std::swap(a, b);
  EXPECT_FALSE(a.hasValue());
  EXPECT_FALSE(b.hasValue());

  a = "greeting";
  EXPECT_TRUE(a.hasValue());
  EXPECT_FALSE(b.hasValue());
  EXPECT_EQ("greeting", a.value());

  std::swap(a, b);
  EXPECT_FALSE(a.hasValue());
  EXPECT_TRUE(b.hasValue());
  EXPECT_EQ("greeting", b.value());

  a = "goodbye";
  EXPECT_TRUE(a.hasValue());
  EXPECT_EQ("goodbye", a.value());

  std::swap(a, b);
  EXPECT_EQ("greeting", a.value());
  EXPECT_EQ("goodbye", b.value());
}

TEST(Expected, FollySwapFunction) {
  Expected<std::string, E> a;
  Expected<std::string, E> b;

  folly::swap(a, b);
  EXPECT_FALSE(a.hasValue());
  EXPECT_FALSE(b.hasValue());

  a = "salute";
  EXPECT_TRUE(a.hasValue());
  EXPECT_FALSE(b.hasValue());
  EXPECT_EQ("salute", a.value());

  folly::swap(a, b);
  EXPECT_FALSE(a.hasValue());
  EXPECT_TRUE(b.hasValue());
  EXPECT_EQ("salute", b.value());

  a = "adieu";
  EXPECT_TRUE(a.hasValue());
  EXPECT_EQ("adieu", a.value());

  folly::swap(a, b);
  EXPECT_EQ("salute", a.value());
  EXPECT_EQ("adieu", b.value());
}

TEST(Expected, Comparisons) {
  Expected<int, E> o_;
  Expected<int, E> o1(1);
  Expected<int, E> o2(2);

  EXPECT_TRUE(o_ <= (o_));
  EXPECT_TRUE(o_ == (o_));
  EXPECT_TRUE(o_ >= (o_));

  EXPECT_TRUE(o1 < o2);
  EXPECT_TRUE(o1 <= o2);
  EXPECT_TRUE(o1 <= (o1));
  EXPECT_TRUE(o1 == (o1));
  EXPECT_TRUE(o1 != o2);
  EXPECT_TRUE(o1 >= (o1));
  EXPECT_TRUE(o2 >= o1);
  EXPECT_TRUE(o2 > o1);

  EXPECT_FALSE(o2 < o1);
  EXPECT_FALSE(o2 <= o1);
  EXPECT_FALSE(o2 <= o1);
  EXPECT_FALSE(o2 == o1);
  EXPECT_FALSE(o1 != (o1));
  EXPECT_FALSE(o1 >= o2);
  EXPECT_FALSE(o1 >= o2);
  EXPECT_FALSE(o1 > o2);

  /* folly::Expected explicitly doesn't support comparisons with contained value
  EXPECT_TRUE(1 < o2);
  EXPECT_TRUE(1 <= o2);
  EXPECT_TRUE(1 <= o1);
  EXPECT_TRUE(1 == o1);
  EXPECT_TRUE(2 != o1);
  EXPECT_TRUE(1 >= o1);
  EXPECT_TRUE(2 >= o1);
  EXPECT_TRUE(2 > o1);

  EXPECT_FALSE(o2 < 1);
  EXPECT_FALSE(o2 <= 1);
  EXPECT_FALSE(o2 <= 1);
  EXPECT_FALSE(o2 == 1);
  EXPECT_FALSE(o2 != 2);
  EXPECT_FALSE(o1 >= 2);
  EXPECT_FALSE(o1 >= 2);
  EXPECT_FALSE(o1 > 2);
  */
}

TEST(Expected, Conversions) {
  Expected<bool, E> mbool;
  Expected<short, E> mshort;
  Expected<char*, E> mstr;
  Expected<int, E> mint;

  EXPECT_FALSE((std::is_convertible<Expected<bool, E>&, bool>::value));
  EXPECT_FALSE((std::is_convertible<Expected<short, E>&, short>::value));
  EXPECT_FALSE((std::is_convertible<Expected<char*, E>&, char*>::value));
  EXPECT_FALSE((std::is_convertible<Expected<int, E>&, int>::value));

  // intended explicit operator bool, for if (ex).
  bool b(mbool);
  EXPECT_FALSE(b);

  // Truthy tests work and are not ambiguous
  if (mbool && mshort && mstr && mint) { // only checks not-empty
    if (*mbool && *mshort && *mstr && *mint) { // only checks value
      ;
    }
  }

  mbool = false;
  EXPECT_TRUE(bool(mbool));
  EXPECT_FALSE(*mbool);

  mbool = true;
  EXPECT_TRUE(bool(mbool));
  EXPECT_TRUE(*mbool);

  mbool = {unexpected, E::E1};
  EXPECT_FALSE(bool(mbool));

  // No conversion allowed; does not compile
  // mbool == false;
}

TEST(Expected, Pointee) {
  Expected<int, E> x;
  EXPECT_FALSE(get_pointer(x));
  x = 1;
  EXPECT_TRUE(get_pointer(x));
  *get_pointer(x) = 2;
  EXPECT_TRUE(*x == 2);
  x = {unexpected, E::E1};
  EXPECT_FALSE(get_pointer(x));
}

TEST(Expected, MakeOptional) {
  // const L-value version
  const std::string s("abc");
  auto exStr = makeExpected<E>(s);
  ASSERT_TRUE(exStr.hasValue());
  EXPECT_EQ(*exStr, "abc");
  *exStr = "cde";
  EXPECT_EQ(s, "abc");
  EXPECT_EQ(*exStr, "cde");

  // L-value version
  std::string s2("abc");
  auto exStr2 = makeExpected<E>(s2);
  ASSERT_TRUE(exStr2.hasValue());
  EXPECT_EQ(*exStr2, "abc");
  *exStr2 = "cde";
  // it's vital to check that s2 wasn't clobbered
  EXPECT_EQ(s2, "abc");

  // L-value reference version
  std::string& s3(s2);
  auto exStr3 = makeExpected<E>(s3);
  ASSERT_TRUE(exStr3.hasValue());
  EXPECT_EQ(*exStr3, "abc");
  *exStr3 = "cde";
  EXPECT_EQ(s3, "abc");

  // R-value ref version
  unique_ptr<int> pInt(new int(3));
  auto exIntPtr = makeExpected<E>(std::move(pInt));
  EXPECT_TRUE(pInt.get() == nullptr);
  ASSERT_TRUE(exIntPtr.hasValue());
  EXPECT_EQ(**exIntPtr, 3);
}

TEST(Expected, SelfAssignment) {
  Expected<std::string, E> a = "42";
  a = static_cast<decltype(a)&>(a); // suppress self-assign warning
  ASSERT_TRUE(a.hasValue() && a.value() == "42");

  Expected<std::string, E> b = "23333333";
  b = static_cast<decltype(b)&&>(b); // suppress self-move warning
  ASSERT_TRUE(b.hasValue() && b.value() == "23333333");
}

class ContainsExpected {
 public:
  ContainsExpected() {}
  explicit ContainsExpected(int x) : ex_(x) {}
  bool hasValue() const {
    return ex_.hasValue();
  }
  int value() const {
    return ex_.value();
  }

  ContainsExpected(const ContainsExpected& other) = default;
  ContainsExpected& operator=(const ContainsExpected& other) = default;
  ContainsExpected(ContainsExpected&& other) = default;
  ContainsExpected& operator=(ContainsExpected&& other) = default;

 private:
  Expected<int, E> ex_;
};

/**
 * Test that a class containing an Expected can be copy and move assigned.
 * This was broken under gcc 4.7 until assignment operators were explicitly
 * defined.
 */
TEST(Expected, AssignmentContained) {
  {
    ContainsExpected source(5), target;
    target = source;
    EXPECT_TRUE(target.hasValue());
    EXPECT_EQ(5, target.value());
  }

  {
    ContainsExpected source(5), target;
    target = std::move(source);
    EXPECT_TRUE(target.hasValue());
    EXPECT_EQ(5, target.value());
    EXPECT_TRUE(source.hasValue());
  }

  {
    ContainsExpected ex_uninit, target(10);
    target = ex_uninit;
    EXPECT_FALSE(target.hasValue());
  }
}

TEST(Expected, Exceptions) {
  Expected<int, E> empty;
  EXPECT_THROW(empty.value(), Unexpected<E>::BadExpectedAccess);
}

struct ThrowingBadness {
  ThrowingBadness() noexcept(false);
  ThrowingBadness(const ThrowingBadness&) noexcept(false);
  ThrowingBadness(ThrowingBadness&&) noexcept(false);
  ThrowingBadness& operator=(const ThrowingBadness&) noexcept(false);
  ThrowingBadness& operator=(ThrowingBadness&&) noexcept(false);
};

TEST(Expected, NoThrowDefaultConstructible) {
  EXPECT_TRUE(
      (std::is_nothrow_default_constructible<Expected<bool, E>>::value));
  EXPECT_TRUE(
      (std::is_nothrow_default_constructible<Expected<std::string, E>>::value));
  EXPECT_TRUE((std::is_nothrow_default_constructible<
               Expected<ThrowingBadness, E>>::value));
  EXPECT_FALSE((std::is_nothrow_default_constructible<
                Expected<int, ThrowingBadness>>::value));
}

TEST(Expected, NoThrowMoveConstructible) {
  EXPECT_TRUE((std::is_nothrow_move_constructible<Expected<bool, E>>::value));
  EXPECT_TRUE((std::is_nothrow_move_constructible<
               Expected<std::unique_ptr<int>, E>>::value));
  EXPECT_FALSE((
      std::is_nothrow_move_constructible<Expected<ThrowingBadness, E>>::value));
}

TEST(Expected, NoThrowMoveAssignable) {
  EXPECT_TRUE((std::is_nothrow_move_assignable<Expected<bool, E>>::value));
  EXPECT_TRUE((std::is_nothrow_move_assignable<
               Expected<std::unique_ptr<int>, E>>::value));
  EXPECT_FALSE(
      (std::is_nothrow_move_assignable<Expected<ThrowingBadness, E>>::value));
}

struct NoSelfAssign {
  NoSelfAssign() = default;
  NoSelfAssign(NoSelfAssign&&) = default;
  NoSelfAssign(const NoSelfAssign&) = default;
  NoSelfAssign& operator=(NoSelfAssign&& that) {
    EXPECT_NE(this, &that);
    return *this;
  }
  NoSelfAssign& operator=(const NoSelfAssign& that) {
    EXPECT_NE(this, &that);
    return *this;
  }
};

#ifdef __GNUC__
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wpragmas"
#endif

TEST(Expected, NoSelfAssign) {
  folly::Expected<NoSelfAssign, int> e{NoSelfAssign{}};
  e = static_cast<decltype(e)&>(e); // suppress self-assign warning
  e = static_cast<decltype(e)&&>(e); // @nolint suppress self-move warning
}

#ifdef __GNUC__
#pragma GCC diagnostic pop
#endif

struct NoDestructor {};

struct WithDestructor {
  ~WithDestructor();
};

TEST(Expected, TriviallyDestructible) {
  // These could all be static_asserts but EXPECT_* give much nicer output on
  // failure.
  EXPECT_TRUE(
      (std::is_trivially_destructible<Expected<NoDestructor, E>>::value));
  EXPECT_TRUE((std::is_trivially_destructible<Expected<int, E>>::value));
  EXPECT_FALSE(
      (std::is_trivially_destructible<Expected<WithDestructor, E>>::value));
}

struct NoConstructor {};

struct WithConstructor {
  WithConstructor();
};

// libstdc++ with GCC 4.x doesn't have std::is_trivially_copyable
#if (defined(__clang__) && !defined(_LIBCPP_VERSION)) || \
    !(defined(__GNUC__) && !defined(__clang__) && __GNUC__ < 5)
TEST(Expected, TriviallyCopyable) {
  // These could all be static_asserts but EXPECT_* give much nicer output on
  // failure.
  EXPECT_TRUE((is_trivially_copyable<Expected<int, E>>::value));
  EXPECT_TRUE((is_trivially_copyable<Expected<char*, E>>::value));
  EXPECT_TRUE((is_trivially_copyable<Expected<NoDestructor, E>>::value));
  EXPECT_FALSE((is_trivially_copyable<Expected<WithDestructor, E>>::value));
  EXPECT_TRUE((is_trivially_copyable<Expected<NoConstructor, E>>::value));
  EXPECT_FALSE((is_trivially_copyable<Expected<std::string, E>>::value));
  EXPECT_FALSE((is_trivially_copyable<Expected<int, std::string>>::value));
  EXPECT_TRUE((is_trivially_copyable<Expected<WithConstructor, E>>::value));
  EXPECT_TRUE((is_trivially_copyable<Expected<Expected<int, E>, E>>::value));
}
#endif

TEST(Expected, Then) {
  // Lifting
  {
    Expected<int, E> ex =
        Expected<std::unique_ptr<int>, E>{in_place, new int(42)}.then(
            [](std::unique_ptr<int> p) { return *p; });
    EXPECT_TRUE(bool(ex));
    EXPECT_EQ(42, *ex);
  }

  // Flattening
  {
    Expected<int, E> ex =
        Expected<std::unique_ptr<int>, E>{in_place, new int(42)}.then(
            [](std::unique_ptr<int> p) { return makeExpected<E>(*p); });
    EXPECT_TRUE(bool(ex));
    EXPECT_EQ(42, *ex);
  }

  // Void
  {
    Expected<Unit, E> ex =
        Expected<std::unique_ptr<int>, E>{in_place, new int(42)}.then(
            [](std::unique_ptr<int>) {});
    EXPECT_TRUE(bool(ex));
  }

  // Non-flattening (different error codes)
  {
    Expected<Expected<int, int>, E> ex =
        Expected<std::unique_ptr<int>, E>{in_place, new int(42)}.then(
            [](std::unique_ptr<int> p) { return makeExpected<int>(*p); });
    EXPECT_TRUE(bool(ex));
    EXPECT_TRUE(bool(*ex));
    EXPECT_EQ(42, **ex);
  }

  {
    // Error case:
    Expected<int, E> ex =
        Expected<std::unique_ptr<int>, E>{unexpected, E::E1}.then(
            [](std::unique_ptr<int> p) -> int {
              ADD_FAILURE();
              return *p;
            });
    EXPECT_FALSE(bool(ex));
    EXPECT_EQ(E::E1, ex.error());
  }

  // Chaining
  {
    Expected<std::string, E> ex =
        Expected<std::unique_ptr<int>, E>{in_place, new int(42)}.then(
            [](std::unique_ptr<int> p) { return makeExpected<E>(*p); },
            [](int i) { return i == 42 ? "yes" : "no"; });
    EXPECT_TRUE(bool(ex));
    EXPECT_EQ("yes", *ex);
  }

  // Chaining with errors
  {
    Expected<std::string, E> ex =
        Expected<std::unique_ptr<int>, E>{in_place, new int(42)}.then(
            [](std::unique_ptr<int>) {
              return Expected<int, E>(unexpected, E::E1);
            },
            [](int i) { return i == 42 ? "yes" : "no"; });
    EXPECT_FALSE(bool(ex));
    EXPECT_EQ(E::E1, ex.error());
  }
}

TEST(Expected, ThenOrThrow) {
  {
    int e =
        Expected<std::unique_ptr<int>, E>{in_place, new int(42)}.thenOrThrow(
            [](std::unique_ptr<int> p) { return *p; });
    EXPECT_EQ(42, e);
  }

  {
    EXPECT_THROW(
        (Expected<std::unique_ptr<int>, E>{unexpected, E::E1}.thenOrThrow(
            [](std::unique_ptr<int> p) { return *p; })),
        Unexpected<E>::BadExpectedAccess);
  }

  {
    EXPECT_THROW(
        (Expected<std::unique_ptr<int>, E>{unexpected, E::E1}.thenOrThrow(
            [](std::unique_ptr<int> p) { return *p; },
            [](E) { return std::runtime_error(""); })),
        std::runtime_error);
  }

  {
    EXPECT_THROW(
        (Expected<std::unique_ptr<int>, E>{unexpected, E::E1}.thenOrThrow(
            [](std::unique_ptr<int> p) { return *p; },
            [](E) { throw std::runtime_error(""); })),
        std::runtime_error);
  }

  {
    EXPECT_THROW(
        (Expected<std::unique_ptr<int>, E>{unexpected, E::E1}.thenOrThrow(
            [](std::unique_ptr<int> p) { return *p; }, [](E) {})),
        Unexpected<E>::BadExpectedAccess);
  }
}
} // namespace folly
