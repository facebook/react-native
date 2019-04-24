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

#pragma once

#include <cstdint>
#include <limits>
#include <type_traits>

namespace folly {

// TODO: Replace with std::equal_to, etc., after upgrading to C++14.
template <typename T>
struct constexpr_equal_to {
  constexpr bool operator()(T const& a, T const& b) const {
    return a == b;
  }
};
template <typename T>
struct constexpr_not_equal_to {
  constexpr bool operator()(T const& a, T const& b) const {
    return a != b;
  }
};
template <typename T>
struct constexpr_less {
  constexpr bool operator()(T const& a, T const& b) const {
    return a < b;
  }
};
template <typename T>
struct constexpr_less_equal {
  constexpr bool operator()(T const& a, T const& b) const {
    return a <= b;
  }
};
template <typename T>
struct constexpr_greater {
  constexpr bool operator()(T const& a, T const& b) const {
    return a > b;
  }
};
template <typename T>
struct constexpr_greater_equal {
  constexpr bool operator()(T const& a, T const& b) const {
    return a >= b;
  }
};

// TLDR: Prefer using operator< for ordering. And when
// a and b are equivalent objects, we return b to make
// sorting stable.
// See http://stepanovpapers.com/notes.pdf for details.
template <typename T>
constexpr T constexpr_max(T a) {
  return a;
}
template <typename T, typename... Ts>
constexpr T constexpr_max(T a, T b, Ts... ts) {
  return b < a ? constexpr_max(a, ts...) : constexpr_max(b, ts...);
}

// When a and b are equivalent objects, we return a to
// make sorting stable.
template <typename T>
constexpr T constexpr_min(T a) {
  return a;
}
template <typename T, typename... Ts>
constexpr T constexpr_min(T a, T b, Ts... ts) {
  return b < a ? constexpr_min(b, ts...) : constexpr_min(a, ts...);
}

template <typename T, typename Less>
constexpr T const&
constexpr_clamp(T const& v, T const& lo, T const& hi, Less less) {
  return less(v, lo) ? lo : less(hi, v) ? hi : v;
}
template <typename T>
constexpr T const& constexpr_clamp(T const& v, T const& lo, T const& hi) {
  return constexpr_clamp(v, lo, hi, constexpr_less<T>{});
}

namespace detail {

template <typename T, typename = void>
struct constexpr_abs_helper {};

template <typename T>
struct constexpr_abs_helper<
    T,
    typename std::enable_if<std::is_floating_point<T>::value>::type> {
  static constexpr T go(T t) {
    return t < static_cast<T>(0) ? -t : t;
  }
};

template <typename T>
struct constexpr_abs_helper<
    T,
    typename std::enable_if<
        std::is_integral<T>::value && !std::is_same<T, bool>::value &&
        std::is_unsigned<T>::value>::type> {
  static constexpr T go(T t) {
    return t;
  }
};

template <typename T>
struct constexpr_abs_helper<
    T,
    typename std::enable_if<
        std::is_integral<T>::value && !std::is_same<T, bool>::value &&
        std::is_signed<T>::value>::type> {
  static constexpr typename std::make_unsigned<T>::type go(T t) {
    return typename std::make_unsigned<T>::type(t < static_cast<T>(0) ? -t : t);
  }
};
} // namespace detail

template <typename T>
constexpr auto constexpr_abs(T t)
    -> decltype(detail::constexpr_abs_helper<T>::go(t)) {
  return detail::constexpr_abs_helper<T>::go(t);
}

namespace detail {
template <typename T>
constexpr T constexpr_log2_(T a, T e) {
  return e == T(1) ? a : constexpr_log2_(a + T(1), e / T(2));
}

template <typename T>
constexpr T constexpr_log2_ceil_(T l2, T t) {
  return l2 + T(T(1) << l2 < t ? 1 : 0);
}

template <typename T>
constexpr T constexpr_square_(T t) {
  return t * t;
}
} // namespace detail

template <typename T>
constexpr T constexpr_log2(T t) {
  return detail::constexpr_log2_(T(0), t);
}

template <typename T>
constexpr T constexpr_log2_ceil(T t) {
  return detail::constexpr_log2_ceil_(constexpr_log2(t), t);
}

template <typename T>
constexpr T constexpr_ceil(T t, T round) {
  return round == T(0)
      ? t
      : ((t + (t < T(0) ? T(0) : round - T(1))) / round) * round;
}

template <typename T>
constexpr T constexpr_pow(T base, std::size_t exp) {
  return exp == 0
      ? T(1)
      : exp == 1 ? base
                 : detail::constexpr_square_(constexpr_pow(base, exp / 2)) *
              (exp % 2 ? base : T(1));
}

/// constexpr_find_last_set
///
/// Return the 1-based index of the most significant bit which is set.
/// For x > 0, constexpr_find_last_set(x) == 1 + floor(log2(x)).
template <typename T>
constexpr std::size_t constexpr_find_last_set(T const t) {
  using U = std::make_unsigned_t<T>;
  return t == T(0) ? 0 : 1 + constexpr_log2(static_cast<U>(t));
}

namespace detail {
template <typename U>
constexpr std::size_t
constexpr_find_first_set_(std::size_t s, std::size_t a, U const u) {
  return s == 0 ? a
                : constexpr_find_first_set_(
                      s / 2, a + s * bool((u >> a) % (U(1) << s) == U(0)), u);
}
} // namespace detail

/// constexpr_find_first_set
///
/// Return the 1-based index of the least significant bit which is set.
/// For x > 0, the exponent in the largest power of two which does not divide x.
template <typename T>
constexpr std::size_t constexpr_find_first_set(T t) {
  using U = std::make_unsigned_t<T>;
  using size = std::integral_constant<std::size_t, sizeof(T) * 4>;
  return t == T(0)
      ? 0
      : 1 + detail::constexpr_find_first_set_(size{}, 0, static_cast<U>(t));
}

template <typename T>
constexpr T constexpr_add_overflow_clamped(T a, T b) {
  using L = std::numeric_limits<T>;
  using M = std::intmax_t;
  static_assert(
      !std::is_integral<T>::value || sizeof(T) <= sizeof(M),
      "Integral type too large!");
  // clang-format off
  return
    // don't do anything special for non-integral types.
    !std::is_integral<T>::value ? a + b :
    // for narrow integral types, just convert to intmax_t.
    sizeof(T) < sizeof(M)
      ? T(constexpr_clamp(M(a) + M(b), M(L::min()), M(L::max()))) :
    // when a >= 0, cannot add more than `MAX - a` onto a.
    !(a < 0) ? a + constexpr_min(b, T(L::max() - a)) :
    // a < 0 && b >= 0, `a + b` will always be in valid range of type T.
    !(b < 0) ? a + b :
    // a < 0 && b < 0, keep the result >= MIN.
               a + constexpr_max(b, T(L::min() - a));
  // clang-format on
}

template <typename T>
constexpr T constexpr_sub_overflow_clamped(T a, T b) {
  using L = std::numeric_limits<T>;
  using M = std::intmax_t;
  static_assert(
      !std::is_integral<T>::value || sizeof(T) <= sizeof(M),
      "Integral type too large!");
  // clang-format off
  return
    // don't do anything special for non-integral types.
    !std::is_integral<T>::value ? a - b :
    // for unsigned type, keep result >= 0.
    std::is_unsigned<T>::value ? (a < b ? 0 : a - b) :
    // for narrow signed integral types, just convert to intmax_t.
    sizeof(T) < sizeof(M)
      ? T(constexpr_clamp(M(a) - M(b), M(L::min()), M(L::max()))) :
    // (a >= 0 && b >= 0) || (a < 0 && b < 0), `a - b` will always be valid.
    (a < 0) == (b < 0) ? a - b :
    // MIN < b, so `-b` should be in valid range (-MAX <= -b <= MAX),
    // convert subtraction to addition.
    L::min() < b ? constexpr_add_overflow_clamped(a, T(-b)) :
    // -b = -MIN = (MAX + 1) and a <= -1, result is in valid range.
    a < 0 ? a - b :
    // -b = -MIN = (MAX + 1) and a >= 0, result > MAX.
            L::max();
  // clang-format on
}

// clamp_cast<> provides sane numeric conversions from float point numbers to
// integral numbers, and between different types of integral numbers. It helps
// to avoid unexpected bugs introduced by bad conversion, and undefined behavior
// like overflow when casting float point numbers to integral numbers.
//
// When doing clamp_cast<Dst>(value), if `value` is in valid range of Dst,
// it will give correct result in Dst, equal to `value`.
//
// If `value` is outside the representable range of Dst, it will be clamped to
// MAX or MIN in Dst, instead of being undefined behavior.
//
// Float NaNs are converted to 0 in integral type.
//
// Here's some comparision with static_cast<>:
// (with FB-internal gcc-5-glibc-2.23 toolchain)
//
// static_cast<int32_t>(NaN) = 6
// clamp_cast<int32_t>(NaN) = 0
//
// static_cast<int32_t>(9999999999.0f) = -348639895
// clamp_cast<int32_t>(9999999999.0f) = 2147483647
//
// static_cast<int32_t>(2147483647.0f) = -348639895
// clamp_cast<int32_t>(2147483647.0f) = 2147483647
//
// static_cast<uint32_t>(4294967295.0f) = 0
// clamp_cast<uint32_t>(4294967295.0f) = 4294967295
//
// static_cast<uint32_t>(-1) = 4294967295
// clamp_cast<uint32_t>(-1) = 0
//
// static_cast<int16_t>(32768u) = -32768
// clamp_cast<int16_t>(32768u) = 32767

template <typename Dst, typename Src>
constexpr typename std::enable_if<std::is_integral<Src>::value, Dst>::type
constexpr_clamp_cast(Src src) {
  static_assert(
      std::is_integral<Dst>::value && sizeof(Dst) <= sizeof(int64_t),
      "constexpr_clamp_cast can only cast into integral type (up to 64bit)");

  using L = std::numeric_limits<Dst>;
  // clang-format off
  return
    // Check if Src and Dst have same signedness.
    std::is_signed<Src>::value == std::is_signed<Dst>::value
    ? (
      // Src and Dst have same signedness. If sizeof(Src) <= sizeof(Dst),
      // we can safely convert Src to Dst without any loss of accuracy.
      sizeof(Src) <= sizeof(Dst) ? Dst(src) :
      // If Src is larger in size, we need to clamp it to valid range in Dst.
      Dst(constexpr_clamp(src, Src(L::min()), Src(L::max()))))
    // Src and Dst have different signedness.
    // Check if it's signed -> unsigend cast.
    : std::is_signed<Src>::value && std::is_unsigned<Dst>::value
    ? (
      // If src < 0, the result should be 0.
      src < 0 ? Dst(0) :
      // Otherwise, src >= 0. If src can fit into Dst, we can safely cast it
      // without loss of accuracy.
      sizeof(Src) <= sizeof(Dst) ? Dst(src) :
      // If Src is larger in size than Dst, we need to ensure the result is
      // at most Dst MAX.
      Dst(constexpr_min(src, Src(L::max()))))
    // It's unsigned -> signed cast.
    : (
      // Since Src is unsigned, and Dst is signed, Src can fit into Dst only
      // when sizeof(Src) < sizeof(Dst).
      sizeof(Src) < sizeof(Dst) ? Dst(src) :
      // If Src does not fit into Dst, we need to ensure the result is at most
      // Dst MAX.
      Dst(constexpr_min(src, Src(L::max()))));
  // clang-format on
}

namespace detail {
// Upper/lower bound values that could be accurately represented in both
// integral and float point types.
constexpr double kClampCastLowerBoundDoubleToInt64F = -9223372036854774784.0;
constexpr double kClampCastUpperBoundDoubleToInt64F = 9223372036854774784.0;
constexpr double kClampCastUpperBoundDoubleToUInt64F = 18446744073709549568.0;

constexpr float kClampCastLowerBoundFloatToInt32F = -2147483520.0f;
constexpr float kClampCastUpperBoundFloatToInt32F = 2147483520.0f;
constexpr float kClampCastUpperBoundFloatToUInt32F = 4294967040.0f;

// This works the same as constexpr_clamp, but the comparision are done in Src
// to prevent any implicit promotions.
template <typename D, typename S>
constexpr D constexpr_clamp_cast_helper(S src, S sl, S su, D dl, D du) {
  return src < sl ? dl : (src > su ? du : D(src));
}
} // namespace detail

template <typename Dst, typename Src>
constexpr typename std::enable_if<std::is_floating_point<Src>::value, Dst>::type
constexpr_clamp_cast(Src src) {
  static_assert(
      std::is_integral<Dst>::value && sizeof(Dst) <= sizeof(int64_t),
      "constexpr_clamp_cast can only cast into integral type (up to 64bit)");

  using L = std::numeric_limits<Dst>;
  // clang-format off
  return
    // Special case: cast NaN into 0.
    // Using a trick here to portably check for NaN: f != f only if f is NaN.
    // see: https://stackoverflow.com/a/570694
    (src != src) ? Dst(0) :
    // using `sizeof(Src) > sizeof(Dst)` as a heuristic that Dst can be
    // represented in Src without loss of accuracy.
    // see: https://en.wikipedia.org/wiki/Floating-point_arithmetic
    sizeof(Src) > sizeof(Dst) ?
      detail::constexpr_clamp_cast_helper(
          src, Src(L::min()), Src(L::max()), L::min(), L::max()) :
    // sizeof(Src) < sizeof(Dst) only happens when doing cast of
    // 32bit float -> u/int64_t.
    // Losslessly promote float into double, change into double -> u/int64_t.
    sizeof(Src) < sizeof(Dst) ? (
      src >= 0.0
      ? constexpr_clamp_cast<Dst>(
            constexpr_clamp_cast<std::uint64_t>(double(src)))
      : constexpr_clamp_cast<Dst>(
            constexpr_clamp_cast<std::int64_t>(double(src)))) :
    // The following are for sizeof(Src) == sizeof(Dst).
    std::is_same<Src, double>::value && std::is_same<Dst, int64_t>::value ?
      detail::constexpr_clamp_cast_helper(
          double(src),
          detail::kClampCastLowerBoundDoubleToInt64F,
          detail::kClampCastUpperBoundDoubleToInt64F,
          L::min(),
          L::max()) :
    std::is_same<Src, double>::value && std::is_same<Dst, uint64_t>::value ?
      detail::constexpr_clamp_cast_helper(
          double(src),
          0.0,
          detail::kClampCastUpperBoundDoubleToUInt64F,
          L::min(),
          L::max()) :
    std::is_same<Src, float>::value && std::is_same<Dst, int32_t>::value ?
      detail::constexpr_clamp_cast_helper(
          float(src),
          detail::kClampCastLowerBoundFloatToInt32F,
          detail::kClampCastUpperBoundFloatToInt32F,
          L::min(),
          L::max()) :
      detail::constexpr_clamp_cast_helper(
          float(src),
          0.0f,
          detail::kClampCastUpperBoundFloatToUInt32F,
          L::min(),
          L::max());
  // clang-format on
}

} // namespace folly
