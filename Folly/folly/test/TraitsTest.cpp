/*
 * Copyright 2017 Facebook, Inc.
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

#include <folly/Traits.h>

#include <cstring>
#include <string>
#include <type_traits>
#include <utility>

#include <folly/ScopeGuard.h>
#include <folly/portability/GTest.h>

using namespace folly;
using namespace std;

namespace {

FOLLY_CREATE_HAS_MEMBER_TYPE_TRAITS(has_member_type_x, x);
}

TEST(Traits, has_member_type) {
  struct membership_no {};
  struct membership_yes {
    using x = void;
  };

  EXPECT_TRUE((is_same<false_type, has_member_type_x<membership_no>>::value));
  EXPECT_TRUE((is_same<true_type, has_member_type_x<membership_yes>>::value));
}

//  Note: FOLLY_CREATE_HAS_MEMBER_FN_TRAITS tests are in
//  folly/test/HasMemberFnTraitsTest.cpp.

struct T1 {}; // old-style IsRelocatable, below
struct T2 {}; // old-style IsRelocatable, below
struct T3 { typedef std::true_type IsRelocatable; };
struct T4 { typedef std::true_type IsTriviallyCopyable; };
struct T5 : T3 {};

struct F1 {};
struct F2 { typedef int IsRelocatable; };
struct F3 : T3 { typedef std::false_type IsRelocatable; };
struct F4 : T1 {};

namespace folly {
  template <> struct IsRelocatable<T1> : std::true_type {};
  template <> FOLLY_ASSUME_RELOCATABLE(T2);
}

TEST(Traits, scalars) {
  EXPECT_TRUE(IsRelocatable<int>::value);
  EXPECT_TRUE(IsRelocatable<bool>::value);
  EXPECT_TRUE(IsRelocatable<double>::value);
  EXPECT_TRUE(IsRelocatable<void*>::value);
}

TEST(Traits, containers) {
  EXPECT_TRUE  (IsRelocatable<vector<F1>>::value);
  EXPECT_TRUE((IsRelocatable<pair<F1, F1>>::value));
  EXPECT_TRUE ((IsRelocatable<pair<T1, T2>>::value));
}

TEST(Traits, original) {
  EXPECT_TRUE(IsRelocatable<T1>::value);
  EXPECT_TRUE(IsRelocatable<T2>::value);
}

TEST(Traits, typedefd) {
  EXPECT_TRUE (IsRelocatable<T3>::value);
  EXPECT_TRUE (IsRelocatable<T5>::value);
  EXPECT_FALSE(IsRelocatable<F2>::value);
  EXPECT_FALSE(IsRelocatable<F3>::value);
}

TEST(Traits, unset) {
  EXPECT_TRUE(IsRelocatable<F1>::value);
  EXPECT_TRUE(IsRelocatable<F4>::value);
}

TEST(Traits, bitprop) {
  EXPECT_TRUE(IsTriviallyCopyable<T4>::value);
  EXPECT_TRUE(IsRelocatable<T4>::value);
}

TEST(Traits, bitAndInit) {
  EXPECT_TRUE (IsTriviallyCopyable<int>::value);
  EXPECT_FALSE(IsTriviallyCopyable<vector<int>>::value);
  EXPECT_TRUE (IsZeroInitializable<int>::value);
  EXPECT_FALSE(IsZeroInitializable<vector<int>>::value);
}

TEST(Trait, logicOperators) {
  static_assert(Conjunction<true_type>::value, "");
  static_assert(!Conjunction<false_type>::value, "");
  static_assert(is_same<Conjunction<true_type>::type, true_type>::value, "");
  static_assert(is_same<Conjunction<false_type>::type, false_type>::value, "");
  static_assert(Conjunction<true_type, true_type>::value, "");
  static_assert(!Conjunction<true_type, false_type>::value, "");

  static_assert(Disjunction<true_type>::value, "");
  static_assert(!Disjunction<false_type>::value, "");
  static_assert(is_same<Disjunction<true_type>::type, true_type>::value, "");
  static_assert(is_same<Disjunction<false_type>::type, false_type>::value, "");
  static_assert(Disjunction<true_type, true_type>::value, "");
  static_assert(Disjunction<true_type, false_type>::value, "");

  static_assert(!Negation<true_type>::value, "");
  static_assert(Negation<false_type>::value, "");
}

TEST(Traits, is_negative) {
  EXPECT_TRUE(folly::is_negative(-1));
  EXPECT_FALSE(folly::is_negative(0));
  EXPECT_FALSE(folly::is_negative(1));
  EXPECT_FALSE(folly::is_negative(0u));
  EXPECT_FALSE(folly::is_negative(1u));

  EXPECT_TRUE(folly::is_non_positive(-1));
  EXPECT_TRUE(folly::is_non_positive(0));
  EXPECT_FALSE(folly::is_non_positive(1));
  EXPECT_TRUE(folly::is_non_positive(0u));
  EXPECT_FALSE(folly::is_non_positive(1u));
}

TEST(Traits, relational) {
  // We test, especially, the edge cases to make sure we don't
  // trip -Wtautological-comparisons

  EXPECT_FALSE((folly::less_than<uint8_t, 0u,   uint8_t>(0u)));
  EXPECT_FALSE((folly::less_than<uint8_t, 0u,   uint8_t>(254u)));
  EXPECT_FALSE((folly::less_than<uint8_t, 255u, uint8_t>(255u)));
  EXPECT_TRUE( (folly::less_than<uint8_t, 255u, uint8_t>(254u)));

  EXPECT_FALSE((folly::greater_than<uint8_t, 0u,   uint8_t>(0u)));
  EXPECT_TRUE( (folly::greater_than<uint8_t, 0u,   uint8_t>(254u)));
  EXPECT_FALSE((folly::greater_than<uint8_t, 255u, uint8_t>(255u)));
  EXPECT_FALSE((folly::greater_than<uint8_t, 255u, uint8_t>(254u)));
}

#if FOLLY_HAVE_INT128_T

TEST(Traits, int128) {
  EXPECT_TRUE(
      (::std::is_same<::std::make_unsigned<__int128_t>::type, __uint128_t>::
           value));
  EXPECT_TRUE((
      ::std::is_same<::std::make_signed<__int128_t>::type, __int128_t>::value));
  EXPECT_TRUE(
      (::std::is_same<::std::make_unsigned<__uint128_t>::type, __uint128_t>::
           value));
  EXPECT_TRUE(
      (::std::is_same<::std::make_signed<__uint128_t>::type, __int128_t>::
           value));
  EXPECT_TRUE((::std::is_arithmetic<__int128_t>::value));
  EXPECT_TRUE((::std::is_arithmetic<__uint128_t>::value));
  EXPECT_TRUE((::std::is_integral<__int128_t>::value));
  EXPECT_TRUE((::std::is_integral<__uint128_t>::value));
  EXPECT_FALSE((::std::is_unsigned<__int128_t>::value));
  EXPECT_TRUE((::std::is_signed<__int128_t>::value));
  EXPECT_TRUE((::std::is_unsigned<__uint128_t>::value));
  EXPECT_FALSE((::std::is_signed<__uint128_t>::value));
  EXPECT_TRUE((::std::is_fundamental<__int128_t>::value));
  EXPECT_TRUE((::std::is_fundamental<__uint128_t>::value));
  EXPECT_TRUE((::std::is_scalar<__int128_t>::value));
  EXPECT_TRUE((::std::is_scalar<__uint128_t>::value));
}

#endif // FOLLY_HAVE_INT128_T

template <typename T, typename... Args>
void testIsRelocatable(Args&&... args) {
  if (!IsRelocatable<T>::value) return;

  // We use placement new on zeroed memory to avoid garbage subsections
  char vsrc[sizeof(T)] = { 0 };
  char vdst[sizeof(T)] = { 0 };
  char vcpy[sizeof(T)];

  T* src = new (vsrc) T(std::forward<Args>(args)...);
  SCOPE_EXIT { src->~T(); };
  std::memcpy(vcpy, vsrc, sizeof(T));
  T deep(*src);
  T* dst = new (vdst) T(std::move(*src));
  SCOPE_EXIT { dst->~T(); };

  EXPECT_EQ(deep, *dst);
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wstrict-aliasing"
  EXPECT_EQ(deep, *reinterpret_cast<T*>(vcpy));
#pragma GCC diagnostic pop

  // This test could technically fail; however, this is what relocation
  // almost always means, so it's a good test to have
  EXPECT_EQ(std::memcmp(vcpy, vdst, sizeof(T)), 0);
}

TEST(Traits, actuallyRelocatable) {
  // Ensure that we test stack and heap allocation for strings with in-situ
  // capacity
  testIsRelocatable<std::string>("1");
  testIsRelocatable<std::string>(sizeof(std::string) + 1, 'x');

  testIsRelocatable<std::vector<char>>(5, 'g');
}

namespace {
// has_value_type<T>::value is true if T has a nested type `value_type`
template <class T, class = void>
struct has_value_type : std::false_type {};

template <class T>
struct has_value_type<T, folly::void_t<typename T::value_type>>
    : std::true_type {};
}

TEST(Traits, void_t) {
  EXPECT_TRUE((::std::is_same<folly::void_t<>, void>::value));
  EXPECT_TRUE((::std::is_same<folly::void_t<int>, void>::value));
  EXPECT_TRUE((::std::is_same<folly::void_t<int, short>, void>::value));
  EXPECT_TRUE(
      (::std::is_same<folly::void_t<int, short, std::string>, void>::value));
  EXPECT_TRUE((::has_value_type<std::string>::value));
  EXPECT_FALSE((::has_value_type<int>::value));
}
