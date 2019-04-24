/*
 * Copyright 2017-present Facebook, Inc.
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
#if defined(__GNUC__) && !defined(__clang__) && __GNUC__ < 5
#pragma message "Folly.Poly requires gcc-5 or greater"
#else
#include <folly/Poly.h>

#include <folly/Conv.h>
#include <folly/poly/Nullable.h>
#include <folly/poly/Regular.h>
#include <folly/portability/GTest.h>

#include <array>

using namespace folly;
using namespace folly::poly;

namespace {
template <class T>
struct Big_t {
 private:
  std::array<char, sizeof(Poly<ISemiRegular>) + 1> data_;
  T t_;

 public:
  Big_t() : data_{}, t_() {
    ++s_count;
  }
  explicit Big_t(T t) : data_{}, t_(t) {
    ++s_count;
  }
  Big_t(Big_t const& that) : data_(that.data_), t_(that.t_) {
    ++s_count;
  }
  ~Big_t() {
    --s_count;
  }
  Big_t& operator=(Big_t const&) = default;
  T value() const {
    return t_;
  }
  friend bool operator==(Big_t const& a, Big_t const& b) {
    return a.value() == b.value();
  }
  friend bool operator!=(Big_t const& a, Big_t const& b) {
    return !(a == b);
  }
  friend bool operator<(Big_t const& a, Big_t const& b) {
    return a.value() < b.value();
  }
  static std::ptrdiff_t s_count;
};
template <class T>
std::ptrdiff_t Big_t<T>::s_count = 0;

using Big = Big_t<int>;
using BigDouble = Big_t<double>;
} // namespace

TEST(Poly, SemiRegular) {
  {
    // A small object, storable in-situ:
    Poly<ISemiRegular> p = 42;
    EXPECT_EQ(typeid(int), poly_type(p));
    EXPECT_EQ(42, poly_cast<int>(p));
    EXPECT_THROW(poly_cast<short>(p), BadPolyCast);
    Poly<ISemiRegular> p2 = p;
    EXPECT_EQ(typeid(int), poly_type(p2));
    EXPECT_EQ(42, poly_cast<int>(p2));
    EXPECT_THROW(poly_cast<short>(p2), BadPolyCast);
  }

  EXPECT_EQ(0, Big::s_count);
  {
    // A big object, stored on the heap:
    Poly<ISemiRegular> p = Big(42);
    EXPECT_EQ(1, Big::s_count);
    EXPECT_EQ(typeid(Big), poly_type(p));
    EXPECT_EQ(42, poly_cast<Big>(p).value());
    EXPECT_THROW(poly_cast<short>(p), BadPolyCast);
    Poly<ISemiRegular> p2 = p;
    EXPECT_EQ(2, Big::s_count);
    EXPECT_EQ(typeid(Big), poly_type(p2));
    EXPECT_EQ(42, poly_cast<Big>(p2).value());
    EXPECT_THROW(poly_cast<short>(p2), BadPolyCast);
  }
  EXPECT_EQ(0, Big::s_count);

  // four swap cases
  //

  {
    // A small object, storable in-situ:
    Poly<ISemiRegular> p = 42;
    EXPECT_EQ(typeid(int), poly_type(p));
    EXPECT_EQ(42, poly_cast<int>(p));
    EXPECT_THROW(poly_cast<short>(p), BadPolyCast);
    // A small object, storable in-situ:
    Poly<ISemiRegular> p2 = 4.2;
    EXPECT_EQ(typeid(double), poly_type(p2));
    EXPECT_EQ(4.2, poly_cast<double>(p2));
    EXPECT_THROW(poly_cast<short>(p2), BadPolyCast);
    std::swap(p, p2);
    EXPECT_EQ(typeid(double), poly_type(p));
    EXPECT_EQ(4.2, poly_cast<double>(p));
    EXPECT_THROW(poly_cast<short>(p), BadPolyCast);
    EXPECT_EQ(typeid(int), poly_type(p2));
    EXPECT_EQ(42, poly_cast<int>(p2));
    EXPECT_THROW(poly_cast<short>(p2), BadPolyCast);
    using std::swap;
    swap(p, p2);
    EXPECT_EQ(typeid(int), poly_type(p));
    EXPECT_EQ(42, poly_cast<int>(p));
    EXPECT_THROW(poly_cast<short>(p), BadPolyCast);
    EXPECT_EQ(typeid(double), poly_type(p2));
    EXPECT_EQ(4.2, poly_cast<double>(p2));
    EXPECT_THROW(poly_cast<short>(p2), BadPolyCast);
  }

  EXPECT_EQ(0, Big::s_count);
  EXPECT_EQ(0, BigDouble::s_count);
  {
    // A big object, stored on the heap:
    Poly<ISemiRegular> p = Big(42);
    EXPECT_EQ(1, Big::s_count);
    EXPECT_EQ(typeid(Big), poly_type(p));
    EXPECT_EQ(42, poly_cast<Big>(p).value());
    EXPECT_THROW(poly_cast<short>(p), BadPolyCast);
    // A big object, stored on the heap:
    Poly<ISemiRegular> p2 = BigDouble(4.2);
    EXPECT_EQ(1, BigDouble::s_count);
    EXPECT_EQ(typeid(BigDouble), poly_type(p2));
    EXPECT_EQ(4.2, poly_cast<BigDouble>(p2).value());
    EXPECT_THROW(poly_cast<short>(p2), BadPolyCast);
    std::swap(p, p2);
    EXPECT_EQ(1, Big::s_count);
    EXPECT_EQ(1, BigDouble::s_count);
    EXPECT_EQ(typeid(BigDouble), poly_type(p));
    EXPECT_EQ(4.2, poly_cast<BigDouble>(p).value());
    EXPECT_THROW(poly_cast<short>(p), BadPolyCast);
    EXPECT_EQ(typeid(Big), poly_type(p2));
    EXPECT_EQ(42, poly_cast<Big>(p2).value());
    EXPECT_THROW(poly_cast<short>(p2), BadPolyCast);
    using std::swap;
    swap(p, p2);
    EXPECT_EQ(1, Big::s_count);
    EXPECT_EQ(1, BigDouble::s_count);
    EXPECT_EQ(typeid(Big), poly_type(p));
    EXPECT_EQ(42, poly_cast<Big>(p).value());
    EXPECT_THROW(poly_cast<short>(p), BadPolyCast);
    EXPECT_EQ(typeid(BigDouble), poly_type(p2));
    EXPECT_EQ(4.2, poly_cast<BigDouble>(p2).value());
    EXPECT_THROW(poly_cast<short>(p2), BadPolyCast);
  }
  EXPECT_EQ(0, BigDouble::s_count);
  EXPECT_EQ(0, Big::s_count);

  EXPECT_EQ(0, Big::s_count);
  {
    // A big object, stored on the heap:
    Poly<ISemiRegular> p = Big(42);
    EXPECT_EQ(1, Big::s_count);
    EXPECT_EQ(typeid(Big), poly_type(p));
    EXPECT_EQ(42, poly_cast<Big>(p).value());
    EXPECT_THROW(poly_cast<short>(p), BadPolyCast);
    // A small object, storable in-situ:
    Poly<ISemiRegular> p2 = 4.2;
    EXPECT_EQ(typeid(double), poly_type(p2));
    EXPECT_EQ(4.2, poly_cast<double>(p2));
    EXPECT_THROW(poly_cast<short>(p2), BadPolyCast);
    std::swap(p, p2);
    EXPECT_EQ(1, Big::s_count);
    EXPECT_EQ(typeid(double), poly_type(p));
    EXPECT_EQ(4.2, poly_cast<double>(p));
    EXPECT_THROW(poly_cast<short>(p), BadPolyCast);
    EXPECT_EQ(typeid(Big), poly_type(p2));
    EXPECT_EQ(42, poly_cast<Big>(p2).value());
    EXPECT_THROW(poly_cast<short>(p2), BadPolyCast);
    using std::swap;
    swap(p, p2);
    EXPECT_EQ(1, Big::s_count);
    EXPECT_EQ(typeid(Big), poly_type(p));
    EXPECT_EQ(42, poly_cast<Big>(p).value());
    EXPECT_THROW(poly_cast<short>(p), BadPolyCast);
    EXPECT_EQ(typeid(double), poly_type(p2));
    EXPECT_EQ(4.2, poly_cast<double>(p2));
    EXPECT_THROW(poly_cast<short>(p2), BadPolyCast);
  }
  EXPECT_EQ(0, Big::s_count);

  EXPECT_EQ(0, BigDouble::s_count);
  {
    // A small object, storable in-situ:
    Poly<ISemiRegular> p = 42;
    EXPECT_EQ(typeid(int), poly_type(p));
    EXPECT_EQ(42, poly_cast<int>(p));
    EXPECT_THROW(poly_cast<short>(p), BadPolyCast);
    // A big object, stored on the heap:
    Poly<ISemiRegular> p2 = BigDouble(4.2);
    EXPECT_EQ(1, BigDouble::s_count);
    EXPECT_EQ(typeid(BigDouble), poly_type(p2));
    EXPECT_EQ(4.2, poly_cast<BigDouble>(p2).value());
    EXPECT_THROW(poly_cast<short>(p2), BadPolyCast);
    std::swap(p, p2);
    EXPECT_EQ(1, BigDouble::s_count);
    EXPECT_EQ(typeid(BigDouble), poly_type(p));
    EXPECT_EQ(4.2, poly_cast<BigDouble>(p).value());
    EXPECT_THROW(poly_cast<short>(p), BadPolyCast);
    EXPECT_EQ(typeid(int), poly_type(p2));
    EXPECT_EQ(42, poly_cast<int>(p2));
    EXPECT_THROW(poly_cast<short>(p2), BadPolyCast);
    using std::swap;
    swap(p, p2);
    EXPECT_EQ(1, BigDouble::s_count);
    EXPECT_EQ(typeid(int), poly_type(p));
    EXPECT_EQ(42, poly_cast<int>(p));
    EXPECT_THROW(poly_cast<short>(p), BadPolyCast);
    EXPECT_EQ(typeid(BigDouble), poly_type(p2));
    EXPECT_EQ(4.2, poly_cast<BigDouble>(p2).value());
    EXPECT_THROW(poly_cast<short>(p2), BadPolyCast);
  }
  EXPECT_EQ(0, BigDouble::s_count);
}

TEST(Poly, EqualityComparable) {
  {
    Poly<IEqualityComparable> p = 42;
    Poly<IEqualityComparable> q = 42;
    EXPECT_TRUE(p == q);
    EXPECT_TRUE(q == p);
    EXPECT_FALSE(p != q);
    EXPECT_FALSE(q != p);
    p = 43;
    EXPECT_FALSE(p == q);
    EXPECT_FALSE(q == p);
    EXPECT_TRUE(p != q);
    EXPECT_TRUE(q != p);
  }
  {
    // empty not equal
    Poly<IEqualityComparable> p;
    Poly<IEqualityComparable> q = 42;
    EXPECT_FALSE(p == q);
    EXPECT_FALSE(q == p);
  }
  {
    // empty equal
    Poly<IEqualityComparable> p;
    Poly<IEqualityComparable> q;
    EXPECT_TRUE(p == q);
    EXPECT_TRUE(q == p);
  }
  {
    // mismatched types throws
    Poly<IEqualityComparable> p = 4.2;
    Poly<IEqualityComparable> q = 42;
    EXPECT_THROW((void)(q == p), BadPolyCast);
  }
}

TEST(Poly, StrictlyOrderable) {
  {
    // A small object, storable in-situ:
    Poly<IStrictlyOrderable> p = 42;
    Poly<IStrictlyOrderable> q = 43;
    EXPECT_TRUE(p < q);
    EXPECT_TRUE(p <= q);
    EXPECT_FALSE(p > q);
    EXPECT_FALSE(p >= q);
    EXPECT_TRUE(q > p);
    EXPECT_TRUE(q >= p);
    EXPECT_FALSE(q < p);
    EXPECT_FALSE(q <= p);
  }
  {
    // A big object, stored on the heap:
    Poly<IStrictlyOrderable> p = Big(42);
    Poly<IStrictlyOrderable> q = Big(43);
    EXPECT_TRUE(p < q);
  }
  {
    // if equal, no one is bigger
    Poly<IStrictlyOrderable> p = 42;
    Poly<IStrictlyOrderable> q = 42;
    EXPECT_FALSE(p < q);
    EXPECT_TRUE(p <= q);
    EXPECT_FALSE(p > q);
    EXPECT_TRUE(p >= q);
    EXPECT_FALSE(q < p);
    EXPECT_TRUE(q <= p);
    EXPECT_FALSE(q > p);
    EXPECT_TRUE(q >= p);
  }
  {
    // empty is always smaller
    Poly<IStrictlyOrderable> p;
    Poly<IStrictlyOrderable> q = 42;
    EXPECT_TRUE(p < q);
    EXPECT_FALSE(q < p);
  }
  {
    // mismatched types throws
    Poly<IStrictlyOrderable> p = 4.2;
    Poly<IStrictlyOrderable> q = 42;
    EXPECT_THROW((void)(p < q), BadPolyCast);
    EXPECT_THROW((void)(q < p), BadPolyCast);
  }
}

TEST(Poly, SemiRegularReference) {
  int i = 42;
  Poly<ISemiRegular&> p = i;
  EXPECT_EQ(42, i);
  EXPECT_EQ(typeid(int), poly_type(p));
  EXPECT_EQ(42, poly_cast<int>(p));
  EXPECT_EQ(&i, &poly_cast<int>(p));
  EXPECT_THROW(poly_cast<short>(p), BadPolyCast);
  Poly<ISemiRegular&> p2 = p;
  EXPECT_EQ(typeid(int), poly_type(p2));
  EXPECT_EQ(42, poly_cast<int>(p2));
  EXPECT_EQ(&i, &poly_cast<int>(p2));
  EXPECT_THROW(poly_cast<short>(p2), BadPolyCast);
  std::swap(p, p2);
  EXPECT_EQ(typeid(int), poly_type(p2));
  EXPECT_EQ(42, poly_cast<int>(p2));
  EXPECT_EQ(&i, &poly_cast<int>(p2));
  EXPECT_THROW(poly_cast<short>(p2), BadPolyCast);
  using std::swap;
  swap(p, p2);
  EXPECT_EQ(typeid(int), poly_type(p2));
  EXPECT_EQ(42, poly_cast<int>(p2));
  EXPECT_EQ(&i, &poly_cast<int>(p2));
  EXPECT_THROW(poly_cast<short>(p2), BadPolyCast);
  // Can't default-initialize reference-like Poly's:
  static_assert(!std::is_default_constructible<Poly<ISemiRegular&>>::value, "");
}

TEST(Poly, Conversions) {
  int i = 42;
  Poly<ISemiRegular> p1 = i;
  Poly<ISemiRegular&> p2 = p1;
  EXPECT_EQ(&poly_cast<int>(p1), &poly_cast<int>(p2));
  Poly<ISemiRegular const&> p3 = p1;
  Poly<ISemiRegular const&> p4 = p2;
  EXPECT_EQ(&poly_cast<int>(p3), &poly_cast<int>(p1));
  EXPECT_EQ(&poly_cast<int>(p4), &poly_cast<int>(p1));
  static_assert(
      !std::is_constructible<Poly<ISemiRegular&>, Poly<ISemiRegular const&>&>::
          value,
      "");
  static_assert(
      !std::is_constructible<Poly<ISemiRegular>, Poly<ISemiRegular const&>&>::
          value,
      "");
}

TEST(Poly, EqualityComparableReference) {
  int i = 42;
  int j = 42;
  Poly<IEqualityComparable&> p1 = i;
  Poly<IEqualityComparable&> p2 = j;
  EXPECT_EQ(&i, &poly_cast<int>(p1));
  EXPECT_EQ(&j, &poly_cast<int>(p2));
  EXPECT_TRUE(p1 == p2);
  EXPECT_FALSE(p1 != p2);
  j = 43;
  EXPECT_FALSE(p1 == p2);
  EXPECT_TRUE(p1 != p2);
  EXPECT_EQ(42, poly_cast<int>(p1));
  EXPECT_EQ(43, poly_cast<int>(p2));
}

namespace {
struct Foo {
  template <class Base>
  struct Interface : Base {
    void foo(int& i) {
      folly::poly_call<0>(*this, i);
    }
  };

  template <class T>
  using Members = FOLLY_POLY_MEMBERS(&T::foo);
};

struct foo_ {
  foo_() = default;
  explicit foo_(int i) : j_(i) {}
  void foo(int& i) {
    i += j_;
  }

 private:
  int j_ = 0;
};
} // namespace

TEST(Poly, Singular) {
  Poly<Foo> p = foo_{42};
  int i = 1;
  p.foo(i);
  EXPECT_EQ(43, i);
  EXPECT_EQ(typeid(foo_), poly_type(p));
}

namespace {
struct FooBar : PolyExtends<Foo> {
  template <class Base>
  struct Interface : Base {
    std::string bar(int i) const {
      return folly::poly_call<0>(*this, i);
    }
  };

  template <class T>
  using Members = FOLLY_POLY_MEMBERS(&T::bar);
};

struct foo_bar {
  foo_bar() = default;
  explicit foo_bar(int i) : j_(i) {}
  void foo(int& i) {
    i += j_;
  }
  std::string bar(int i) const {
    i += j_;
    return folly::to<std::string>(i);
  }

 private:
  int j_ = 0;
};
} // namespace

TEST(Poly, SingleInheritance) {
  Poly<FooBar> p = foo_bar{42};
  int i = 1;
  p.foo(i);
  EXPECT_EQ(43, i);
  EXPECT_EQ("43", p.bar(1));
  EXPECT_EQ(typeid(foo_bar), poly_type(p));

  Poly<Foo> q = p; // OK, conversion works.
  q.foo(i);
  EXPECT_EQ(85, i);

  Poly<Foo&> r = p;
  r->foo(i);
  EXPECT_EQ(127, i);
  const_cast<Poly<Foo&> const&>(r)->foo(i);
  EXPECT_EQ(169, i);

  Poly<FooBar const&> cr = p;
  // cr->foo(i); // ERROR: calls a non-const member through a const reference
  cr->bar(i); // OK
}

namespace {
struct Baz {
  template <class Base>
  struct Interface : Base {
    std::string baz(int i, int j) const {
      return folly::poly_call<0>(*this, i, j);
    }
  };

  template <class T>
  using Members = FOLLY_POLY_MEMBERS(&T::baz);
};

struct FooBarBazFizz : PolyExtends<FooBar, Baz> {
  template <class Base>
  struct Interface : Base {
    std::string fizz() const {
      return folly::poly_call<0>(*this);
    }
  };

  template <class T>
  using Members = FOLLY_POLY_MEMBERS(&T::fizz);
};

struct foo_bar_baz_fizz {
  foo_bar_baz_fizz() = default;
  explicit foo_bar_baz_fizz(int i) : j_(i) {}
  void foo(int& i) {
    i += j_;
  }
  std::string bar(int i) const {
    return folly::to<std::string>(i + j_);
  }
  std::string baz(int i, int j) const {
    return folly::to<std::string>(i + j);
  }
  std::string fizz() const {
    return "fizz";
  }

 private:
  int j_ = 0;
};
} // namespace

TEST(Poly, MultipleInheritance) {
  Poly<FooBarBazFizz> p = foo_bar_baz_fizz{42};
  int i = 1;
  p.foo(i);
  EXPECT_EQ(43, i);
  EXPECT_EQ("43", p.bar(1));
  EXPECT_EQ("3", p.baz(1, 2));
  EXPECT_EQ("fizz", p.fizz());
  EXPECT_EQ(typeid(foo_bar_baz_fizz), poly_type(p));
}

namespace {
struct Property {
  template <class Base>
  struct Interface : Base {
    int prop() const {
      return folly::poly_call<0>(*this);
    }
    void prop(int i) {
      folly::poly_call<1>(*this, i);
    }
  };

  template <class T>
  using Members = FOLLY_POLY_MEMBERS(
      FOLLY_POLY_MEMBER(int() const, &T::prop),
      FOLLY_POLY_MEMBER(void(int), &T::prop));
};

struct has_property {
  has_property() = default;
  explicit has_property(int i) : j(i) {}
  int prop() const {
    return j;
  }
  void prop(int i) {
    j = i;
  }

 private:
  int j = 0;
};
} // namespace

TEST(Poly, OverloadedMembers) {
  Poly<Property> p = has_property{42};
  EXPECT_EQ(typeid(has_property), poly_type(p));
  EXPECT_EQ(42, p.prop());
  p.prop(68);
  EXPECT_EQ(68, p.prop());
}

TEST(Poly, NullablePointer) {
  Poly<INullablePointer> p = nullptr;
  Poly<INullablePointer> q{};
  EXPECT_EQ(typeid(void), poly_type(p));
  EXPECT_TRUE(poly_empty(p));
  EXPECT_TRUE(p == q);
  EXPECT_FALSE(p != q);
  EXPECT_TRUE(p == nullptr);
  EXPECT_TRUE(nullptr == p);
  EXPECT_FALSE(p != nullptr);
  EXPECT_FALSE(nullptr != p);

  // No null references ever.
  Poly<INullablePointer> r = 42;
  Poly<INullablePointer&> s = r;
  static_assert(!poly_empty(s), "");
  EXPECT_THROW(Poly<INullablePointer&> r_(q), BadPolyAccess);
}

namespace {
struct MoveOnly_ {
  MoveOnly_() = default;
  MoveOnly_(MoveOnly_&&) = default;
  MoveOnly_(MoveOnly_ const&) = delete;
  MoveOnly_& operator=(MoveOnly_&&) = default;
  MoveOnly_& operator=(MoveOnly_ const&) = delete;
};
} // namespace

TEST(Poly, Move) {
  {
    int i = 42;
    Poly<IMoveOnly&> p = i;
    static_assert(
        !std::is_convertible<Poly<IMoveOnly&>, Poly<IMoveOnly&&>>::value, "");
    auto q = poly_move(p);
    static_assert(std::is_same<decltype(q), Poly<IMoveOnly&&>>::value, "");
    EXPECT_EQ(&poly_cast<int>(p), &poly_cast<int>(q));
  }
  {
    int i = 42;
    Poly<ISemiRegular const&> p = i;
    auto q = poly_move(p);
    static_assert(
        std::is_same<decltype(q), Poly<ISemiRegular const&>>::value, "");
    EXPECT_EQ(&poly_cast<int>(p), &poly_cast<int>(q));
  }
  {
    Poly<IMoveOnly> p = MoveOnly_{};
    static_assert(!std::is_copy_constructible<Poly<IMoveOnly>>::value, "");
    auto q = poly_move(p);
    static_assert(std::is_same<decltype(q), Poly<IMoveOnly>>::value, "");
  }
}

TEST(Poly, RValueRef) {
  int i = 42;
  Poly<ISemiRegular&&> p = std::move(i);
  static_assert(std::is_same<decltype(poly_cast<int>(p)), int&>::value, "");
  EXPECT_EQ(&i, &poly_cast<int>(p));
}

namespace {
template <class Fun>
struct IFunction;

template <class R, class... As>
struct IFunction<R(As...)> {
  template <class Base>
  struct Interface : Base {
    R operator()(As... as) const {
      return static_cast<R>(
          folly::poly_call<0>(*this, std::forward<As>(as)...));
    }
  };

  template <class T>
  using Members =
      FOLLY_POLY_MEMBERS(FOLLY_POLY_MEMBER(R(As...) const, &T::operator()));
};

template <class Fun>
using Function = Poly<IFunction<Fun>>;
} // namespace

TEST(Poly, Function) {
  Function<int(int, int)> fun = std::plus<int>{};
  EXPECT_EQ(42, fun(22, 20));
  fun = std::multiplies<int>{};
  EXPECT_EQ(22 * 20, fun(22, 20));
}

namespace {
// This multiply extends IEqualityComparable
struct IDiamond : PolyExtends<IRegular, INullablePointer> {};
} // namespace

TEST(Poly, DiamondInheritance) {
  {
    // A small object, storable in-situ:
    Poly<IDiamond> p = 42;
    EXPECT_EQ(typeid(int), poly_type(p));
    EXPECT_EQ(42, poly_cast<int>(p));
    EXPECT_THROW(poly_cast<short>(p), BadPolyCast);
    Poly<IDiamond> p2 = p;
    EXPECT_EQ(typeid(int), poly_type(p2));
    EXPECT_EQ(42, poly_cast<int>(p2));
    EXPECT_THROW(poly_cast<short>(p2), BadPolyCast);
    Poly<IEqualityComparable&> eq = p;
    EXPECT_EQ(&poly_cast<int>(p), &poly_cast<int>(eq));
  }

  EXPECT_EQ(0, Big::s_count);
  {
    // A big object, stored on the heap:
    Poly<IDiamond> p = Big(42);
    EXPECT_EQ(1, Big::s_count);
    EXPECT_EQ(typeid(Big), poly_type(p));
    EXPECT_EQ(42, poly_cast<Big>(p).value());
    EXPECT_THROW(poly_cast<short>(p), BadPolyCast);
    Poly<IDiamond> p2 = p;
    EXPECT_EQ(2, Big::s_count);
    EXPECT_EQ(typeid(Big), poly_type(p2));
    EXPECT_EQ(42, poly_cast<Big>(p2).value());
    EXPECT_THROW(poly_cast<short>(p2), BadPolyCast);
    Poly<IEqualityComparable&> eq = p;
    EXPECT_EQ(&poly_cast<Big>(p), &poly_cast<Big>(eq));
  }
  EXPECT_EQ(0, Big::s_count);
}

namespace {
struct Struct {
  int property() const {
    return 42;
  }
  void property(int) {}
};
struct Struct2 : Struct {
  int meow() {
    return 42;
  }

  int purr() {
    return 1;
  }
  int purr() const {
    return 2;
  }
};

int property(Struct const&) {
  return 42;
}
void property(Struct&, int) {}

int meow(Struct2&) {
  return 42;
}

int purr(Struct2&) {
  return 1;
}
int purr(Struct2 const&) {
  return 2;
}
} // namespace

TEST(Poly, Sig) {
  {
    auto m0 = folly::sig<int() const>(&Struct::property);
    EXPECT_EQ(static_cast<int (Struct::*)() const>(&Struct::property), m0);
    auto m1 = folly::sig<int()>(&Struct::property);
    EXPECT_EQ(static_cast<int (Struct::*)() const>(&Struct::property), m1);

    auto m2 = folly::sig<int() const>(&Struct2::property);
    EXPECT_EQ(static_cast<int (Struct2::*)() const>(&Struct2::property), m2);
    auto m3 = folly::sig<int()>(&Struct2::property);
    EXPECT_EQ(static_cast<int (Struct2::*)() const>(&Struct2::property), m3);

    auto m4 = folly::sig<long()>(&Struct2::meow);
    EXPECT_EQ(&Struct2::meow, m4);

    auto m5 = folly::sig<int()>(&Struct2::purr);
    EXPECT_EQ(static_cast<int (Struct2::*)()>(&Struct2::purr), m5);
    auto m6 = folly::sig<int() const>(&Struct2::purr);
    EXPECT_EQ(static_cast<int (Struct2::*)() const>(&Struct2::purr), m6);
  }
  {
    auto m0 = folly::sig<int(Struct const&)>(&::property);
    EXPECT_EQ(static_cast<int (*)(Struct const&)>(&::property), m0);
    auto m1 = folly::sig<int(Struct&)>(&::property);
    EXPECT_EQ(static_cast<int (*)(Struct const&)>(&::property), m1);

    auto m2 = folly::sig<long(Struct2&)>(&::meow);
    EXPECT_EQ(&::meow, m2);

    auto m3 = folly::sig<int(Struct2&)>(&::purr);
    EXPECT_EQ(static_cast<int (*)(Struct2&)>(&::purr), m3);
    auto m4 = folly::sig<int(Struct2 const&)>(&::purr);
    EXPECT_EQ(static_cast<int (*)(Struct2 const&)>(&::purr), m4);
  }
}

namespace {
struct IAddable {
  template <class Base>
  struct Interface : Base {
    friend PolySelf<Base, PolyDecay> operator+(
        PolySelf<Base> const& a,
        PolySelf<Base> const& b) {
      return folly::poly_call<0, IAddable>(a, b);
    }
  };
  template <class T>
  static auto plus_(T const& a, T const& b) -> decltype(a + b) {
    return a + b;
  }

  template <class T>
  using Members = FOLLY_POLY_MEMBERS(&plus_<std::decay_t<T>>);
};
} // namespace

TEST(Poly, Addable) {
  Poly<IAddable> a = 2, b = 3;
  Poly<IAddable> c = a + b;
  EXPECT_EQ(typeid(int), poly_type(c));
  EXPECT_EQ(5, poly_cast<int>(c));

  Poly<IAddable const&> aref = a, bref = b;
  auto cc = aref + bref;
  static_assert(std::is_same<decltype(cc), Poly<IAddable>>::value, "");
  EXPECT_EQ(typeid(int), poly_type(cc));
  EXPECT_EQ(5, poly_cast<int>(cc));
  b = 4;
  EXPECT_EQ(5, poly_cast<int>(cc));
  cc = aref + bref;
  EXPECT_EQ(6, poly_cast<int>(cc));
}

namespace {
struct IFrobnicator {
  template <class Base>
  struct Interface : Base {
    void frobnicate(folly::Poly<folly::poly::IRegular&> x) {
      folly::poly_call<0>(*this, x);
    }
  };
  template <class T>
  using Members = FOLLY_POLY_MEMBERS(&T::frobnicate);
};
using Frobnicator = folly::Poly<IFrobnicator>;

struct my_frobnicator {
  void frobnicate(folly::Poly<folly::poly::IRegular&>) {
    // no-op
  }
};
} // namespace

TEST(Poly, PolyRefAsArg) {
  folly::Poly<folly::poly::IRegular> x = 42;
  Frobnicator frob = my_frobnicator{};
  // should not throw:
  frob.frobnicate(x);
  // should not throw:
  frob.frobnicate(folly::Poly<folly::poly::IRegular&>(x));
}
#endif
