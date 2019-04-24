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

/**
 * Some arithmetic functions that seem to pop up or get hand-rolled a lot.
 * So far they are all focused on integer division.
 */

#pragma once

#include <stdint.h>

#include <limits>
#include <type_traits>

namespace folly {

namespace detail {

template <typename T>
inline constexpr T divFloorBranchless(T num, T denom) {
  // floor != trunc when the answer isn't exact and truncation went the
  // wrong way (truncation went toward positive infinity).  That happens
  // when the true answer is negative, which happens when num and denom
  // have different signs.  The following code compiles branch-free on
  // many platforms.
  return (num / denom) +
      ((num % denom) != 0 ? 1 : 0) *
      (std::is_signed<T>::value && (num ^ denom) < 0 ? -1 : 0);
}

template <typename T>
inline constexpr T divFloorBranchful(T num, T denom) {
  // First case handles negative result by preconditioning numerator.
  // Preconditioning decreases the magnitude of the numerator, which is
  // itself sign-dependent.  Second case handles zero or positive rational
  // result, where trunc and floor are the same.
  return std::is_signed<T>::value && (num ^ denom) < 0 && num != 0
      ? (num + (num > 0 ? -1 : 1)) / denom - 1
      : num / denom;
}

template <typename T>
inline constexpr T divCeilBranchless(T num, T denom) {
  // ceil != trunc when the answer isn't exact (truncation occurred)
  // and truncation went away from positive infinity.  That happens when
  // the true answer is positive, which happens when num and denom have
  // the same sign.
  return (num / denom) +
      ((num % denom) != 0 ? 1 : 0) *
      (std::is_signed<T>::value && (num ^ denom) < 0 ? 0 : 1);
}

template <typename T>
inline constexpr T divCeilBranchful(T num, T denom) {
  // First case handles negative or zero rational result, where trunc and ceil
  // are the same.
  // Second case handles positive result by preconditioning numerator.
  // Preconditioning decreases the magnitude of the numerator, which is
  // itself sign-dependent.
  return (std::is_signed<T>::value && (num ^ denom) < 0) || num == 0
      ? num / denom
      : (num + (num > 0 ? -1 : 1)) / denom + 1;
}

template <typename T>
inline constexpr T divRoundAwayBranchless(T num, T denom) {
  // away != trunc whenever truncation actually occurred, which is when
  // there is a non-zero remainder.  If the unrounded result is negative
  // then fixup moves it toward negative infinity.  If the unrounded
  // result is positive then adjustment makes it larger.
  return (num / denom) +
      ((num % denom) != 0 ? 1 : 0) *
      (std::is_signed<T>::value && (num ^ denom) < 0 ? -1 : 1);
}

template <typename T>
inline constexpr T divRoundAwayBranchful(T num, T denom) {
  // First case of second ternary operator handles negative rational
  // result, which is the same as divFloor.  Second case of second ternary
  // operator handles positive result, which is the same as divCeil.
  // Zero case is separated for simplicity.
  return num == 0 ? 0
                  : (num + (num > 0 ? -1 : 1)) / denom +
          (std::is_signed<T>::value && (num ^ denom) < 0 ? -1 : 1);
}

template <typename N, typename D>
using IdivResultType = typename std::enable_if<
    std::is_integral<N>::value && std::is_integral<D>::value &&
        !std::is_same<N, bool>::value && !std::is_same<D, bool>::value,
    decltype(N{1} / D{1})>::type;
} // namespace detail

#if defined(__arm__) && !FOLLY_AARCH64
constexpr auto kIntegerDivisionGivesRemainder = false;
#else
constexpr auto kIntegerDivisionGivesRemainder = true;
#endif

/**
 * Returns num/denom, rounded toward negative infinity.  Put another way,
 * returns the largest integral value that is less than or equal to the
 * exact (not rounded) fraction num/denom.
 *
 * The matching remainder (num - divFloor(num, denom) * denom) can be
 * negative only if denom is negative, unlike in truncating division.
 * Note that for unsigned types this is the same as the normal integer
 * division operator.  divFloor is equivalent to python's integral division
 * operator //.
 *
 * This function undergoes the same integer promotion rules as a
 * built-in operator, except that we don't allow bool -> int promotion.
 * This function is undefined if denom == 0.  It is also undefined if the
 * result type T is a signed type, num is std::numeric_limits<T>::min(),
 * and denom is equal to -1 after conversion to the result type.
 */
template <typename N, typename D>
inline constexpr detail::IdivResultType<N, D> divFloor(N num, D denom) {
  using R = decltype(num / denom);
  return detail::IdivResultType<N, D>(
      kIntegerDivisionGivesRemainder && std::is_signed<R>::value
          ? detail::divFloorBranchless<R>(num, denom)
          : detail::divFloorBranchful<R>(num, denom));
}

/**
 * Returns num/denom, rounded toward positive infinity.  Put another way,
 * returns the smallest integral value that is greater than or equal to
 * the exact (not rounded) fraction num/denom.
 *
 * This function undergoes the same integer promotion rules as a
 * built-in operator, except that we don't allow bool -> int promotion.
 * This function is undefined if denom == 0.  It is also undefined if the
 * result type T is a signed type, num is std::numeric_limits<T>::min(),
 * and denom is equal to -1 after conversion to the result type.
 */
template <typename N, typename D>
inline constexpr detail::IdivResultType<N, D> divCeil(N num, D denom) {
  using R = decltype(num / denom);
  return detail::IdivResultType<N, D>(
      kIntegerDivisionGivesRemainder && std::is_signed<R>::value
          ? detail::divCeilBranchless<R>(num, denom)
          : detail::divCeilBranchful<R>(num, denom));
}

/**
 * Returns num/denom, rounded toward zero.  If num and denom are non-zero
 * and have different signs (so the unrounded fraction num/denom is
 * negative), returns divCeil, otherwise returns divFloor.  If T is an
 * unsigned type then this is always equal to divFloor.
 *
 * Note that this is the same as the normal integer division operator,
 * at least since C99 (before then the rounding for negative results was
 * implementation defined).  This function is here for completeness and
 * as a place to hang this comment.
 *
 * This function undergoes the same integer promotion rules as a
 * built-in operator, except that we don't allow bool -> int promotion.
 * This function is undefined if denom == 0.  It is also undefined if the
 * result type T is a signed type, num is std::numeric_limits<T>::min(),
 * and denom is equal to -1 after conversion to the result type.
 */
template <typename N, typename D>
inline constexpr detail::IdivResultType<N, D> divTrunc(N num, D denom) {
  return detail::IdivResultType<N, D>(num / denom);
}

/**
 * Returns num/denom, rounded away from zero.  If num and denom are
 * non-zero and have different signs (so the unrounded fraction num/denom
 * is negative), returns divFloor, otherwise returns divCeil.  If T is
 * an unsigned type then this is always equal to divCeil.
 *
 * This function undergoes the same integer promotion rules as a
 * built-in operator, except that we don't allow bool -> int promotion.
 * This function is undefined if denom == 0.  It is also undefined if the
 * result type T is a signed type, num is std::numeric_limits<T>::min(),
 * and denom is equal to -1 after conversion to the result type.
 */
template <typename N, typename D>
inline constexpr detail::IdivResultType<N, D> divRoundAway(N num, D denom) {
  using R = decltype(num / denom);
  return detail::IdivResultType<N, D>(
      kIntegerDivisionGivesRemainder && std::is_signed<R>::value
          ? detail::divRoundAwayBranchless<R>(num, denom)
          : detail::divRoundAwayBranchful<R>(num, denom));
}

} // namespace folly
