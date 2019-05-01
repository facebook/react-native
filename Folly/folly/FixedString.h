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

// @author: Eric Niebler (eniebler)
// Fixed-size string type, for constexpr string handling.

#pragma once

#include <cassert>
#include <cstddef>
#include <initializer_list>
#include <iosfwd>
#include <stdexcept>
#include <string>
#include <type_traits>
#include <utility>

#include <folly/ConstexprMath.h>
#include <folly/Portability.h>
#include <folly/Range.h>
#include <folly/Utility.h>
#include <folly/lang/Exception.h>
#include <folly/lang/Ordering.h>
#include <folly/portability/Constexpr.h>

namespace folly {

template <class Char, std::size_t N>
class BasicFixedString;

template <std::size_t N>
using FixedString = BasicFixedString<char, N>;

namespace detail {
namespace fixedstring {

// This is a template so that the class static npos can be defined in the
// header.
template <class = void>
struct FixedStringBase_ {
  static constexpr std::size_t npos = static_cast<std::size_t>(-1);
};

template <class Void>
constexpr std::size_t FixedStringBase_<Void>::npos;

using FixedStringBase = FixedStringBase_<>;

// Intentionally NOT constexpr. By making this not constexpr, we make
// checkOverflow below ill-formed in a constexpr context when the condition
// it's testing for fails. In this way, precondition violations are reported
// at compile-time instead of at runtime.
[[noreturn]] inline void assertOutOfBounds() {
  assert(!"Array index out of bounds in BasicFixedString");
  throw_exception<std::out_of_range>(
      "Array index out of bounds in BasicFixedString");
}

constexpr std::size_t checkOverflow(std::size_t i, std::size_t max) {
  return i <= max ? i : (void(assertOutOfBounds()), max);
}

constexpr std::size_t checkOverflowOrNpos(std::size_t i, std::size_t max) {
  return i == FixedStringBase::npos
      ? max
      : (i <= max ? i : (void(assertOutOfBounds()), max));
}

// Intentionally NOT constexpr. See note above for assertOutOfBounds
[[noreturn]] inline void assertNotNullTerminated() noexcept {
  assert(!"Non-null terminated string used to initialize a BasicFixedString");
  std::terminate(); // Fail hard, fail fast.
}

// Parsing help for human readers: the following is a constexpr noexcept
// function that accepts a reference to an array as a parameter and returns
// a reference to the same array.
template <class Char, std::size_t N>
constexpr const Char (&checkNullTerminated(const Char (&a)[N]) noexcept)[N] {
  // Strange decltype(a)(a) used to make MSVC happy.
  return a[N - 1u] == Char(0)
#ifndef NDEBUG
          // In Debug mode, guard against embedded nulls:
          && N - 1u == folly::detail::constexpr_strlen_internal(a, 0u)
#endif
      ? decltype(a)(a)
      : (assertNotNullTerminated(), decltype(a)(a));
}

// Rather annoyingly, GCC's -Warray-bounds warning issues false positives for
// this code. See https://gcc.gnu.org/bugzilla/show_bug.cgi?id=61971
#if defined(__GNUC__) && !defined(__clang__) && __GNUC__ <= 5
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Warray-bounds"
#endif

template <class Left, class Right>
constexpr ordering compare_(
    const Left& left,
    std::size_t left_pos,
    std::size_t left_size,
    const Right& right,
    std::size_t right_pos,
    std::size_t right_size) noexcept {
  return left_pos == left_size
      ? (right_pos == right_size ? ordering::eq : ordering::lt)
      : (right_pos == right_size ? ordering::gt
                                 : (left[left_pos] < right[right_pos]
                                        ? ordering::lt
                                        : (left[left_pos] > right[right_pos]
                                               ? ordering::gt
                                               : fixedstring::compare_(
                                                     left,
                                                     left_pos + 1u,
                                                     left_size,
                                                     right,
                                                     right_pos + 1u,
                                                     right_size))));
}

template <class Left, class Right>
constexpr bool equal_(
    const Left& left,
    std::size_t left_size,
    const Right& right,
    std::size_t right_size) noexcept {
  return left_size == right_size &&
      ordering::eq == compare_(left, 0u, left_size, right, 0u, right_size);
}

template <class Char, class Left, class Right>
constexpr Char char_at_(
    const Left& left,
    std::size_t left_count,
    const Right& right,
    std::size_t right_count,
    std::size_t i) noexcept {
  return i < left_count
      ? left[i]
      : i < (left_count + right_count) ? right[i - left_count] : Char(0);
}

template <class Char, class Left, class Right>
constexpr Char char_at_(
    const Left& left,
    std::size_t left_size,
    std::size_t left_pos,
    std::size_t left_count,
    const Right& right,
    std::size_t right_pos,
    std::size_t right_count,
    std::size_t i) noexcept {
  return i < left_pos
      ? left[i]
      : (i < right_count + left_pos ? right[i - left_pos + right_pos]
                                    : (i < left_size - left_count + right_count
                                           ? left[i - right_count + left_count]
                                           : Char(0)));
}

template <class Left, class Right>
constexpr bool find_at_(
    const Left& left,
    const Right& right,
    std::size_t pos,
    std::size_t count) noexcept {
  return 0u == count ||
      (left[pos + count - 1u] == right[count - 1u] &&
       find_at_(left, right, pos, count - 1u));
}

template <class Char, class Right>
constexpr bool
find_one_of_at_(Char ch, const Right& right, std::size_t pos) noexcept {
  return 0u != pos &&
      (ch == right[pos - 1u] || find_one_of_at_(ch, right, pos - 1u));
}

template <class Left, class Right>
constexpr std::size_t find_(
    const Left& left,
    std::size_t left_size,
    const Right& right,
    std::size_t pos,
    std::size_t count) noexcept {
  return find_at_(left, right, pos, count) ? pos
                                           : left_size <= pos + count
          ? FixedStringBase::npos
          : find_(left, left_size, right, pos + 1u, count);
}

template <class Left, class Right>
constexpr std::size_t rfind_(
    const Left& left,
    const Right& right,
    std::size_t pos,
    std::size_t count) noexcept {
  return find_at_(left, right, pos, count)
      ? pos
      : 0u == pos ? FixedStringBase::npos
                  : rfind_(left, right, pos - 1u, count);
}

template <class Left, class Right>
constexpr std::size_t find_first_of_(
    const Left& left,
    std::size_t left_size,
    const Right& right,
    std::size_t pos,
    std::size_t count) noexcept {
  return find_one_of_at_(left[pos], right, count) ? pos
                                                  : left_size <= pos + 1u
          ? FixedStringBase::npos
          : find_first_of_(left, left_size, right, pos + 1u, count);
}

template <class Left, class Right>
constexpr std::size_t find_first_not_of_(
    const Left& left,
    std::size_t left_size,
    const Right& right,
    std::size_t pos,
    std::size_t count) noexcept {
  return !find_one_of_at_(left[pos], right, count) ? pos
                                                   : left_size <= pos + 1u
          ? FixedStringBase::npos
          : find_first_not_of_(left, left_size, right, pos + 1u, count);
}

template <class Left, class Right>
constexpr std::size_t find_last_of_(
    const Left& left,
    const Right& right,
    std::size_t pos,
    std::size_t count) noexcept {
  return find_one_of_at_(left[pos], right, count)
      ? pos
      : 0u == pos ? FixedStringBase::npos
                  : find_last_of_(left, right, pos - 1u, count);
}

template <class Left, class Right>
constexpr std::size_t find_last_not_of_(
    const Left& left,
    const Right& right,
    std::size_t pos,
    std::size_t count) noexcept {
  return !find_one_of_at_(left[pos], right, count)
      ? pos
      : 0u == pos ? FixedStringBase::npos
                  : find_last_not_of_(left, right, pos - 1u, count);
}

struct Helper {
  template <class Char, class Left, class Right, std::size_t... Is>
  static constexpr BasicFixedString<Char, sizeof...(Is)> concat_(
      const Left& left,
      std::size_t left_count,
      const Right& right,
      std::size_t right_count,
      folly::index_sequence<Is...> is) noexcept {
    return {left, left_count, right, right_count, is};
  }

  template <class Char, class Left, class Right, std::size_t... Is>
  static constexpr BasicFixedString<Char, sizeof...(Is)> replace_(
      const Left& left,
      std::size_t left_size,
      std::size_t left_pos,
      std::size_t left_count,
      const Right& right,
      std::size_t right_pos,
      std::size_t right_count,
      folly::index_sequence<Is...> is) noexcept {
    return {left,
            left_size,
            left_pos,
            left_count,
            right,
            right_pos,
            right_count,
            is};
  }

  template <class Char, std::size_t N>
  static constexpr const Char (
      &data_(const BasicFixedString<Char, N>& that) noexcept)[N + 1u] {
    return that.data_;
  }
};

#if defined(__GNUC__) && !defined(__clang__) && __GNUC__ <= 4
#pragma GCC diagnostic pop
#endif

template <class T>
FOLLY_CPP14_CONSTEXPR void constexpr_swap(T& a, T& b) noexcept(
    noexcept(a = T(std::move(a)))) {
  T tmp((std::move(a)));
  a = std::move(b);
  b = std::move(tmp);
}

// For constexpr reverse iteration over a BasicFixedString
template <class T>
struct ReverseIterator {
 private:
  T* p_ = nullptr;
  struct dummy_ {
    T* p_ = nullptr;
  };
  using other = typename std::conditional<
      std::is_const<T>::value,
      ReverseIterator<typename std::remove_const<T>::type>,
      dummy_>::type;

 public:
  using value_type = typename std::remove_const<T>::type;
  using reference = T&;
  using pointer = T*;
  using difference_type = std::ptrdiff_t;
  using iterator_category = std::random_access_iterator_tag;

  constexpr ReverseIterator() = default;
  constexpr ReverseIterator(const ReverseIterator&) = default;
  FOLLY_CPP14_CONSTEXPR ReverseIterator& operator=(const ReverseIterator&) =
      default;
  constexpr explicit ReverseIterator(T* p) noexcept : p_(p) {}
  constexpr /* implicit */ ReverseIterator(const other& that) noexcept
      : p_(that.p_) {}
  friend constexpr bool operator==(
      ReverseIterator a,
      ReverseIterator b) noexcept {
    return a.p_ == b.p_;
  }
  friend constexpr bool operator!=(
      ReverseIterator a,
      ReverseIterator b) noexcept {
    return !(a == b);
  }
  constexpr reference operator*() const {
    return *(p_ - 1);
  }
  FOLLY_CPP14_CONSTEXPR ReverseIterator& operator++() noexcept {
    --p_;
    return *this;
  }
  FOLLY_CPP14_CONSTEXPR ReverseIterator operator++(int) noexcept {
    auto tmp(*this);
    --p_;
    return tmp;
  }
  FOLLY_CPP14_CONSTEXPR ReverseIterator& operator--() noexcept {
    ++p_;
    return *this;
  }
  FOLLY_CPP14_CONSTEXPR ReverseIterator operator--(int) noexcept {
    auto tmp(*this);
    ++p_;
    return tmp;
  }
  FOLLY_CPP14_CONSTEXPR ReverseIterator& operator+=(std::ptrdiff_t i) noexcept {
    p_ -= i;
    return *this;
  }
  friend constexpr ReverseIterator operator+(
      std::ptrdiff_t i,
      ReverseIterator that) noexcept {
    return ReverseIterator{that.p_ - i};
  }
  friend constexpr ReverseIterator operator+(
      ReverseIterator that,
      std::ptrdiff_t i) noexcept {
    return ReverseIterator{that.p_ - i};
  }
  FOLLY_CPP14_CONSTEXPR ReverseIterator& operator-=(std::ptrdiff_t i) noexcept {
    p_ += i;
    return *this;
  }
  friend constexpr ReverseIterator operator-(
      ReverseIterator that,
      std::ptrdiff_t i) noexcept {
    return ReverseIterator{that.p_ + i};
  }
  friend constexpr std::ptrdiff_t operator-(
      ReverseIterator a,
      ReverseIterator b) noexcept {
    return b.p_ - a.p_;
  }
  constexpr reference operator[](std::ptrdiff_t i) const noexcept {
    return *(*this + i);
  }
};

} // namespace fixedstring
} // namespace detail

// Defined in folly/hash/Hash.h
std::uint32_t hsieh_hash32_buf(const void* buf, std::size_t len);

/** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** *
 * \class BasicFixedString
 *
 * \tparam Char The character type. Must be a scalar type.
 * \tparam N The capacity and max size of string instances of this type.
 *
 * \brief A class for holding up to `N` characters of type `Char` that is
 *        amenable to `constexpr` string manipulation. It is guaranteed to not
 *        perform any dynamic allocation.
 *
 * `BasicFixedString` is a `std::string` work-alike that stores characters in an
 * internal buffer. It has minor interface differences that make it easy to work
 * with strings in a `constexpr` context.
 *
 * \par Example:
 * \par
 * \code
 * constexpr auto hello = makeFixedString("hello");         // a FixedString<5>
 * constexpr auto world = makeFixedString("world");         // a FixedString<5>
 * constexpr auto hello_world = hello + ' ' + world + '!';  // a FixedString<12>
 * static_assert(hello_world == "hello world!", "neato!");
 * \endcode
 * \par
 * `FixedString<N>` is an alias for `BasicFixedString<char, N>`.
 *
 * \par Constexpr and In-place Mutation
 * \par
 * On a C++14 compiler, `BasicFixedString` supports the full `std::string`
 * interface as `constexpr` member functions. On a C++11 compiler, the mutating
 * members are not `constexpr`, but non-mutating alternatives, which create a
 * new string, can be used instead. For example, instead of this:
 * \par
 * \code
 * constexpr FixedString<10> replace_example_cpp14() {
 *   FixedString<10> test{"****"};
 *   test.replace(1, 2, "!!!!");
 *   return test; // returns "*!!!!*"
 * }
 * \endcode
 * \par
 * You might write this instead:
 * \par
 * \code
 * constexpr FixedString<10> replace_example_cpp11() {
 *   // GNU compilers have an extension that make it possible to create
 *   // FixedString objects with a `""_fs` user-defined literal.
 *   using namespace folly;
 *   return makeFixedString("****").creplace(1, 2, "!!!!"); // "*!!!!*"
 * }
 * \endcode
 *
 * \par User-defined Literals
 * Instead of using the `folly::makeFixedString` helper function, you can use
 * a user-defined literal to make `FixedString` instances. The UDL feature of
 * C++ has some limitations that make this less than ideal; you must tell the
 * compiler roughly how many characters are in the string. The suffixes `_fs4`,
 * `_fs8`, `_fs16`, `_fs32`, `_fs64`, and `_fs128` exist to create instances
 * of types `FixedString<4>`, `FixedString<8>`, etc. For example:
 * \par
 * \code
 * using namespace folly::string_literals;
 * constexpr auto hello = "hello"_fs8; // A FixedString<8> containing "hello"
 * \endcode
 * \par
 * See Error Handling below for what to expect when you try to exceed the
 * capacity of a `FixedString` by storing too many characters in it.
 * \par
 * If your compiler supports GNU extensions, there is one additional suffix you
 * can use: `_fs`. This suffix always creates `FixedString` objects of exactly
 * the right size. For example:
 * \par
 * \code
 * using namespace folly::string_literals;
 * // NOTE: Only works on compilers with GNU extensions enabled. Clang and
 * // gcc support this (-Wgnu-string-literal-operator-template):
 * constexpr auto hello = "hello"_fs; // A FixedString<5> containing "hello"
 * \endcode
 *
 * \par Error Handling:
 * The capacity of a `BasicFixedString` is set at compile time. When the user
 * asks the string to exceed its capacity, one of three things will happen,
 * depending on the context:
 *\par
 *  -# If the attempt is made while evaluating a constant expression, the
 *     program will fail to compile.
 *  -# Otherwise, if the program is being run in debug mode, it will `assert`.
 *  -# Otherwise, the failed operation will throw a `std::out_of_range`
 *     exception.
 *\par
 * This is also the case if an invalid offset is passed to any member function,
 * or if `pop_back` or `cpop_back` is called on an empty `BasicFixedString`.
 *
 * Member functions documented as having preconditions will assert in Debug
 * mode (`!defined(NDEBUG)`) on precondition failures. Those documented with
 * \b Throws clauses will throw the specified exception on failure. Those with
 * both a precondition and a \b Throws clause will assert in Debug and throw
 * in Release mode.
 */
template <class Char, std::size_t N>
class BasicFixedString : private detail::fixedstring::FixedStringBase {
 private:
  template <class, std::size_t>
  friend class BasicFixedString;
  friend struct detail::fixedstring::Helper;

  // FUTURE: use constexpr_log2 to fold instantiations of BasicFixedString
  // together. All BasicFixedString<C, N> instantiations could share the
  // implementation of BasicFixedString<C, M>, where M is the next highest power
  // of 2 after N.
  //
  // Also, because of alignment of the data_ and size_ members, N should never
  // be smaller than `(alignof(std::size_t)/sizeof(C))-1` (-1 because of the
  // null terminator). OR, create a specialization for BasicFixedString<C, 0u>
  // that does not have a size_ member, since it is unnecessary.
  Char data_[N + 1u]; // +1 for the null terminator
  std::size_t size_; // Nbr of chars, not incl. null terminator. size_ <= N.

  using Indices = folly::make_index_sequence<N>;

  template <class That, std::size_t... Is>
  constexpr BasicFixedString(
      const That& that,
      std::size_t size,
      folly::index_sequence<Is...>,
      std::size_t pos = 0,
      std::size_t count = npos) noexcept
      : data_{(Is < (size - pos) && Is < count ? that[Is + pos] : Char(0))...,
              Char(0)},
        size_{folly::constexpr_min(size - pos, count)} {}

  template <std::size_t... Is>
  constexpr BasicFixedString(
      std::size_t count,
      Char ch,
      folly::index_sequence<Is...>) noexcept
      : data_{((Is < count) ? ch : Char(0))..., Char(0)}, size_{count} {}

  // Concatenation constructor
  template <class Left, class Right, std::size_t... Is>
  constexpr BasicFixedString(
      const Left& left,
      std::size_t left_size,
      const Right& right,
      std::size_t right_size,
      folly::index_sequence<Is...>) noexcept
      : data_{detail::fixedstring::char_at_<Char>(
                  left,
                  left_size,
                  right,
                  right_size,
                  Is)...,
              Char(0)},
        size_{left_size + right_size} {}

  // Replace constructor
  template <class Left, class Right, std::size_t... Is>
  constexpr BasicFixedString(
      const Left& left,
      std::size_t left_size,
      std::size_t left_pos,
      std::size_t left_count,
      const Right& right,
      std::size_t right_pos,
      std::size_t right_count,
      folly::index_sequence<Is...>) noexcept
      : data_{detail::fixedstring::char_at_<Char>(
                  left,
                  left_size,
                  left_pos,
                  left_count,
                  right,
                  right_pos,
                  right_count,
                  Is)...,
              Char(0)},
        size_{left_size - left_count + right_count} {}

 public:
  using size_type = std::size_t;
  using difference_type = std::ptrdiff_t;
  using reference = Char&;
  using const_reference = const Char&;
  using pointer = Char*;
  using const_pointer = const Char*;
  using iterator = Char*;
  using const_iterator = const Char*;
  using reverse_iterator = detail::fixedstring::ReverseIterator<Char>;
  using const_reverse_iterator =
      detail::fixedstring::ReverseIterator<const Char>;

  using detail::fixedstring::FixedStringBase::npos;

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Default construct
   * \post `size() == 0`
   * \post `at(0) == Char(0)`
   */
  constexpr BasicFixedString() : data_{}, size_{} {}

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Copy construct
   * \post `size() == that.size()`
   * \post `0 == strncmp(data(), that.data(), size())`
   * \post `at(size()) == Char(0)`
   */
  constexpr BasicFixedString(const BasicFixedString& /*that*/) = default;

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Construct from a differently-sized BasicFixedString
   * \pre `that.size() <= N`
   * \post `size() == that.size()`
   * \post `0 == strncmp(data(), that.data(), size())`
   * \post `at(size()) == Char(0)`
   * \throw std::out_of_range when that.size() > N. When M <= N, this
   *   constructor will never throw.
   * \note Conversions from larger-capacity BasicFixedString objects to smaller
   *   ones (`M > N`) are allowed as long as the *size()* of the source string
   *   is small enough.
   */
  template <std::size_t M>
  constexpr /* implicit */ BasicFixedString(
      const BasicFixedString<Char, M>& that) noexcept(M <= N)
      : BasicFixedString{that, 0u, that.size_} {}

  // Why is this deleted? To avoid confusion with the constructor that takes
  // a const Char* and a count.
  template <std::size_t M>
  constexpr BasicFixedString(
      const BasicFixedString<Char, M>& that,
      std::size_t pos) noexcept(false) = delete;

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Construct from an BasicFixedString, an offset, and a count
   * \param that The source string
   * \param pos The starting position in `that`
   * \param count The number of characters to copy. If `npos`, `count` is taken
   *              to be `that.size()-pos`.
   * \pre `pos <= that.size()`
   * \pre `count <= that.size()-pos && count <= N`
   * \post `size() == count`
   * \post `0 == strncmp(data(), that.data()+pos, size())`
   * \post `at(size()) == Char(0)`
   * \throw std::out_of_range when pos+count > that.size(), or when
   *        `count > N`
   */
  template <std::size_t M>
  constexpr BasicFixedString(
      const BasicFixedString<Char, M>& that,
      std::size_t pos,
      std::size_t count) noexcept(false)
      : BasicFixedString{
            that.data_,
            that.size_,
            folly::make_index_sequence<(M < N ? M : N)>{},
            pos,
            detail::fixedstring::checkOverflow(
                detail::fixedstring::checkOverflowOrNpos(
                    count,
                    that.size_ -
                        detail::fixedstring::checkOverflow(pos, that.size_)),
                N)} {}

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Construct from a string literal
   * \pre `M-1 <= N`
   * \pre `that[M-1] == Char(0)`
   * \post `0 == strncmp(data(), that, M-1)`
   * \post `size() == M-1`
   * \post `at(size()) == Char(0)`
   */
  template <std::size_t M, class = typename std::enable_if<(M - 1u <= N)>::type>
  constexpr /* implicit */ BasicFixedString(const Char (&that)[M]) noexcept
      : BasicFixedString{detail::fixedstring::checkNullTerminated(that),
                         M - 1u,
                         folly::make_index_sequence<M - 1u>{}} {}

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Construct from a `const Char*` and count
   * \pre `that` points to an array of at least `count` characters.
   * \pre `count <= N`
   * \post `size() == count`
   * \post `0 == strncmp(data(), that, size())`
   * \post `at(size()) == Char(0)`
   * \throw std::out_of_range when count > N
   */
  constexpr BasicFixedString(const Char* that, std::size_t count) noexcept(
      false)
      : BasicFixedString{that,
                         detail::fixedstring::checkOverflow(count, N),
                         Indices{}} {}

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Construct an BasicFixedString that contains `count` characters, all
   *   of which are `ch`.
   * \pre `count <= N`
   * \post `size() == count`
   * \post `npos == find_first_not_of(ch)`
   * \post `at(size()) == Char(0)`
   * \throw std::out_of_range when count > N
   */
  constexpr BasicFixedString(std::size_t count, Char ch) noexcept(false)
      : BasicFixedString{detail::fixedstring::checkOverflow(count, N),
                         ch,
                         Indices{}} {}

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Construct an BasicFixedString from a `std::initializer_list` of
   *   characters.
   * \pre `il.size() <= N`
   * \post `size() == count`
   * \post `0 == strncmp(data(), il.begin(), size())`
   * \post `at(size()) == Char(0)`
   * \throw std::out_of_range when il.size() > N
   */
  constexpr BasicFixedString(std::initializer_list<Char> il) noexcept(false)
      : BasicFixedString{il.begin(), il.size()} {}

  FOLLY_CPP14_CONSTEXPR BasicFixedString& operator=(
      const BasicFixedString&) noexcept = default;

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Assign from a `BasicFixedString<Char, M>`.
   * \pre `that.size() <= N`
   * \post `size() == that.size()`
   * \post `0 == strncmp(data(), that.begin(), size())`
   * \post `at(size()) == Char(0)`
   * \throw std::out_of_range when that.size() > N. When M <= N, this
   *   assignment operator will never throw.
   * \note Assignments from larger-capacity BasicFixedString objects to smaller
   *   ones (`M > N`) are allowed as long as the *size* of the source string is
   *   small enough.
   * \return `*this`
   */
  template <std::size_t M>
  FOLLY_CPP14_CONSTEXPR BasicFixedString& operator=(
      const BasicFixedString<Char, M>& that) noexcept(M <= N) {
    detail::fixedstring::checkOverflow(that.size_, N);
    size_ = that.copy(data_, that.size_);
    data_[size_] = Char(0);
    return *this;
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Assign from a null-terminated array of characters.
   * \pre `M < N`
   * \pre `that` has no embedded null characters
   * \pre `that[M-1]==Char(0)`
   * \post `size() == M-1`
   * \post `0 == strncmp(data(), that, size())`
   * \post `at(size()) == Char(0)`
   * \return `*this`
   */
  template <std::size_t M, class = typename std::enable_if<(M - 1u <= N)>::type>
  FOLLY_CPP14_CONSTEXPR BasicFixedString& operator=(
      const Char (&that)[M]) noexcept {
    return assign(detail::fixedstring::checkNullTerminated(that), M - 1u);
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Assign from an `initializer_list` of characters.
   * \pre `il.size() <= N`
   * \post `size() == il.size()`
   * \post `0 == strncmp(data(), il.begin(), size())`
   * \post `at(size()) == Char(0)`
   * \throw std::out_of_range when il.size() > N
   * \return `*this`
   */
  FOLLY_CPP14_CONSTEXPR BasicFixedString& operator=(
      std::initializer_list<Char> il) noexcept(false) {
    detail::fixedstring::checkOverflow(il.size(), N);
    for (std::size_t i = 0u; i < il.size(); ++i) {
      data_[i] = il.begin()[i];
    }
    size_ = il.size();
    data_[size_] = Char(0);
    return *this;
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Conversion to folly::Range
   * \return `Range<Char*>{begin(), end()}`
   */
  FOLLY_CPP14_CONSTEXPR Range<Char*> toRange() noexcept {
    return {begin(), end()};
  }

  /**
   * \overload
   */
  constexpr Range<const Char*> toRange() const noexcept {
    return {begin(), end()};
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Conversion to std::basic_string<Char>
   * \return `std::basic_string<Char>{begin(), end()}`
   */
  /* implicit */ operator std::basic_string<Char>() const noexcept(false) {
    return std::basic_string<Char>{begin(), end()};
  }

  std::basic_string<Char> toStdString() const noexcept(false) {
    return std::basic_string<Char>{begin(), end()};
  }

  // Think hard about whether this is a good idea. It's certainly better than
  // an implicit conversion to `const Char*` since `delete "hi"_fs` will fail
  // to compile. But it creates ambiguities when passing a FixedString to an
  // API that has overloads for `const char*` and `folly::Range`, for instance.
  // using ArrayType = Char[N];
  // FOLLY_CPP14_CONSTEXPR /* implicit */ operator ArrayType&() noexcept {
  //   return data_;
  // }

  // using ConstArrayType = const Char[N];
  // constexpr /* implicit */ operator ConstArrayType&() const noexcept {
  //   return data_;
  // }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Assigns a sequence of `count` characters of value `ch`.
   * \param count The count of characters.
   * \param ch
   * \pre `count <= N`
   * \post `size() == count`
   * \post `npos == find_first_not_of(ch)`
   * \post `at(size()) == Char(0)`
   * \throw std::out_of_range when count > N
   * \return `*this`
   */
  FOLLY_CPP14_CONSTEXPR BasicFixedString& assign(
      std::size_t count,
      Char ch) noexcept(false) {
    detail::fixedstring::checkOverflow(count, N);
    for (std::size_t i = 0u; i < count; ++i) {
      data_[i] = ch;
    }
    size_ = count;
    data_[size_] = Char(0);
    return *this;
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Assigns characters from an `BasicFixedString` to this object.
   * \note Equivalent to `assign(that, 0, that.size())`
   */
  template <std::size_t M>
  FOLLY_CPP14_CONSTEXPR BasicFixedString& assign(
      const BasicFixedString<Char, M>& that) noexcept(M <= N) {
    return *this = that;
  }

  // Why is this overload deleted? So users aren't confused by the difference
  // between str.assign("foo", N) and str.assign("foo"_fs, N). In the former,
  // N is a count of characters. In the latter, it would be a position, which
  // totally changes the meaning of the code.
  template <std::size_t M>
  FOLLY_CPP14_CONSTEXPR BasicFixedString& assign(
      const BasicFixedString<Char, M>& that,
      std::size_t pos) noexcept(false) = delete;

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Assigns `count` characters from an `BasicFixedString` to this object,
   *   starting at position `pos` in the source object.
   * \param that The source string.
   * \param pos The starting position in the source string.
   * \param count The number of characters to copy. If `npos`, `count` is taken
   *              to be `that.size()-pos`.
   * \pre `pos <= that.size()`
   * \pre `count <= that.size()-pos`
   * \pre `count <= N`
   * \post `size() == count`
   * \post `0 == strncmp(data(), that.begin() + pos, count)`
   * \post `at(size()) == Char(0)`
   * \throw std::out_of_range when pos > that.size() or count > that.size()-pos
   *        or count > N.
   * \return `*this`
   */
  template <std::size_t M>
  FOLLY_CPP14_CONSTEXPR BasicFixedString& assign(
      const BasicFixedString<Char, M>& that,
      std::size_t pos,
      std::size_t count) noexcept(false) {
    detail::fixedstring::checkOverflow(pos, that.size_);
    return assign(
        that.data_ + pos,
        detail::fixedstring::checkOverflowOrNpos(count, that.size_ - pos));
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Assigns characters from an `BasicFixedString` to this object.
   * \pre `that` contains no embedded nulls.
   * \pre `that[M-1] == Char(0)`
   * \note Equivalent to `assign(that, M - 1)`
   */
  template <std::size_t M, class = typename std::enable_if<(M - 1u <= N)>::type>
  FOLLY_CPP14_CONSTEXPR BasicFixedString& assign(
      const Char (&that)[M]) noexcept {
    return assign(detail::fixedstring::checkNullTerminated(that), M - 1u);
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Assigns `count` characters from a range of characters to this object.
   * \param that A pointer to a range of characters.
   * \param count The number of characters to copy.
   * \pre `that` points to at least `count` characters.
   * \pre `count <= N`
   * \post `size() == count`
   * \post `0 == strncmp(data(), that, count)`
   * \post `at(size()) == Char(0)`
   * \throw std::out_of_range when count > N
   * \return `*this`
   */
  FOLLY_CPP14_CONSTEXPR BasicFixedString& assign(
      const Char* that,
      std::size_t count) noexcept(false) {
    detail::fixedstring::checkOverflow(count, N);
    for (std::size_t i = 0u; i < count; ++i) {
      data_[i] = that[i];
    }
    size_ = count;
    data_[size_] = Char(0);
    return *this;
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Swap the contents of this string with `that`.
   */
  FOLLY_CPP14_CONSTEXPR void swap(BasicFixedString& that) noexcept {
    // less-than-or-equal here to copy the null terminator:
    for (std::size_t i = 0u; i <= folly::constexpr_max(size_, that.size_);
         ++i) {
      detail::fixedstring::constexpr_swap(data_[i], that.data_[i]);
    }
    detail::fixedstring::constexpr_swap(size_, that.size_);
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Return a pointer to a range of `size()+1` characters, the last of which
   * is `Char(0)`.
   */
  FOLLY_CPP14_CONSTEXPR Char* data() noexcept {
    return data_;
  }

  /**
   * \overload
   */
  constexpr const Char* data() const noexcept {
    return data_;
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * \return `data()`.
   */
  constexpr const Char* c_str() const noexcept {
    return data_;
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * \return `data()`.
   */
  FOLLY_CPP14_CONSTEXPR Char* begin() noexcept {
    return data_;
  }

  /**
   * \overload
   */
  constexpr const Char* begin() const noexcept {
    return data_;
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * \return `data()`.
   */
  constexpr const Char* cbegin() const noexcept {
    return begin();
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * \return `data() + size()`.
   */
  FOLLY_CPP14_CONSTEXPR Char* end() noexcept {
    return data_ + size_;
  }

  /**
   * \overload
   */
  constexpr const Char* end() const noexcept {
    return data_ + size_;
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * \return `data() + size()`.
   */
  constexpr const Char* cend() const noexcept {
    return end();
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Returns a reverse iterator to the first character of the reversed string.
   * It corresponds to the last + 1 character of the non-reversed string.
   */
  FOLLY_CPP14_CONSTEXPR reverse_iterator rbegin() noexcept {
    return reverse_iterator{data_ + size_};
  }

  /**
   * \overload
   */
  constexpr const_reverse_iterator rbegin() const noexcept {
    return const_reverse_iterator{data_ + size_};
  }

  /**
   * \note Equivalent to `rbegin()` on a const-qualified reference to `*this`.
   */
  constexpr const_reverse_iterator crbegin() const noexcept {
    return rbegin();
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Returns a reverse iterator to the last + 1 character of the reversed
   * string. It corresponds to the first character of the non-reversed string.
   */
  FOLLY_CPP14_CONSTEXPR reverse_iterator rend() noexcept {
    return reverse_iterator{data_};
  }

  /**
   * \overload
   */
  constexpr const_reverse_iterator rend() const noexcept {
    return const_reverse_iterator{data_};
  }

  /**
   * \note Equivalent to `rend()` on a const-qualified reference to `*this`.
   */
  constexpr const_reverse_iterator crend() const noexcept {
    return rend();
  }

  /**
   * \return The number of `Char` elements in the string.
   */
  constexpr std::size_t size() const noexcept {
    return size_;
  }

  /**
   * \return The number of `Char` elements in the string.
   */
  constexpr std::size_t length() const noexcept {
    return size_;
  }

  /**
   * \return True if and only if `size() == 0`.
   */
  constexpr bool empty() const noexcept {
    return 0u == size_;
  }

  /**
   * \return `N`.
   */
  static constexpr std::size_t capacity() noexcept {
    return N;
  }

  /**
   * \return `N`.
   */
  static constexpr std::size_t max_size() noexcept {
    return N;
  }

  // We would need to reimplement folly::Hash to make this
  // constexpr. :-(
  std::uint32_t hash() const noexcept {
    return folly::hsieh_hash32_buf(data_, size_);
  }

  /**
   * \note `at(size())` is allowed will return `Char(0)`.
   * \return `*(data() + i)`
   * \throw std::out_of_range when i > size()
   */
  FOLLY_CPP14_CONSTEXPR Char& at(std::size_t i) noexcept(false) {
    return i <= size_ ? data_[i]
                      : (throw_exception<std::out_of_range>(
                             "Out of range in BasicFixedString::at"),
                         data_[size_]);
  }

  /**
   * \overload
   */
  constexpr const Char& at(std::size_t i) const noexcept(false) {
    return i <= size_ ? data_[i]
                      : (throw_exception<std::out_of_range>(
                             "Out of range in BasicFixedString::at"),
                         data_[size_]);
  }

  /**
   * \pre `i <= size()`
   * \note `(*this)[size()]` is allowed will return `Char(0)`.
   * \return `*(data() + i)`
   */
  FOLLY_CPP14_CONSTEXPR Char& operator[](std::size_t i) noexcept {
#ifdef NDEBUG
    return data_[i];
#else
    return data_[detail::fixedstring::checkOverflow(i, size_)];
#endif
  }

  /**
   * \overload
   */
  constexpr const Char& operator[](std::size_t i) const noexcept {
#ifdef NDEBUG
    return data_[i];
#else
    return data_[detail::fixedstring::checkOverflow(i, size_)];
#endif
  }

  /**
   * \note Equivalent to `(*this)[0]`
   */
  FOLLY_CPP14_CONSTEXPR Char& front() noexcept {
    return (*this)[0u];
  }

  /**
   * \overload
   */
  constexpr const Char& front() const noexcept {
    return (*this)[0u];
  }

  /**
   * \note Equivalent to `at(size()-1)`
   * \pre `!empty()`
   */
  FOLLY_CPP14_CONSTEXPR Char& back() noexcept {
#ifdef NDEBUG
    return data_[size_ - 1u];
#else
    return data_[size_ - detail::fixedstring::checkOverflow(1u, size_)];
#endif
  }

  /**
   * \overload
   */
  constexpr const Char& back() const noexcept {
#ifdef NDEBUG
    return data_[size_ - 1u];
#else
    return data_[size_ - detail::fixedstring::checkOverflow(1u, size_)];
#endif
  }

  /**
   * Clears the contents of this string.
   * \post `size() == 0u`
   * \post `at(size()) == Char(0)`
   */
  FOLLY_CPP14_CONSTEXPR void clear() noexcept {
    data_[0u] = Char(0);
    size_ = 0u;
  }

  /**
   * \note Equivalent to `append(1u, ch)`.
   */
  FOLLY_CPP14_CONSTEXPR void push_back(Char ch) noexcept(false) {
    detail::fixedstring::checkOverflow(1u, N - size_);
    data_[size_] = ch;
    data_[++size_] = Char(0);
  }

  /**
   * \note Equivalent to `cappend(1u, ch)`.
   */
  constexpr BasicFixedString<Char, N + 1u> cpush_back(Char ch) const noexcept {
    return cappend(ch);
  }

  /**
   * Removes the last character from the string.
   * \pre `!empty()`
   * \post `size()` is one fewer than before calling `pop_back()`.
   * \post `at(size()) == Char(0)`
   * \post The characters in the half-open range `[0,size()-1)` are unmodified.
   * \throw std::out_of_range if empty().
   */
  FOLLY_CPP14_CONSTEXPR void pop_back() noexcept(false) {
    detail::fixedstring::checkOverflow(1u, size_);
    --size_;
    data_[size_] = Char(0);
  }

  /**
   * Returns a new string with the first `size()-1` characters from this string.
   * \pre `!empty()`
   * \note Equivalent to `BasicFixedString<Char, N-1u>{*this, 0u, size()-1u}`
   * \throw std::out_of_range if empty().
   */
  constexpr BasicFixedString<Char, N - 1u> cpop_back() const noexcept(false) {
    return {*this, 0u, size_ - detail::fixedstring::checkOverflow(1u, size_)};
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Appends `count` copies of `ch` to this string.
   * \pre `count + old_size <= N`
   * \post The first `old_size` characters of the string are unmodified.
   * \post `size() == old_size + count`
   * \throw std::out_of_range if count > N - size().
   */
  FOLLY_CPP14_CONSTEXPR BasicFixedString& append(
      std::size_t count,
      Char ch) noexcept(false) {
    detail::fixedstring::checkOverflow(count, N - size_);
    for (std::size_t i = 0u; i < count; ++i) {
      data_[size_ + i] = ch;
    }
    size_ += count;
    data_[size_] = Char(0);
    return *this;
  }

  /**
   * \note Equivalent to `append(*this, 0, that.size())`.
   */
  template <std::size_t M>
  FOLLY_CPP14_CONSTEXPR BasicFixedString& append(
      const BasicFixedString<Char, M>& that) noexcept(false) {
    return append(that, 0u, that.size_);
  }

  // Why is this overload deleted? So as not to get confused with
  // append("null-terminated", N), where N would be a count instead
  // of a position.
  template <std::size_t M>
  FOLLY_CPP14_CONSTEXPR BasicFixedString& append(
      const BasicFixedString<Char, M>& that,
      std::size_t pos) noexcept(false) = delete;

  /**
   * Appends `count` characters from another string to this one, starting at a
   * given offset, `pos`.
   * \param that The source string.
   * \param pos The starting position in the source string.
   * \param count The number of characters to append. If `npos`, `count` is
   *              taken to be `that.size()-pos`.
   * \pre `pos <= that.size()`
   * \pre `count <= that.size() - pos`
   * \pre `old_size + count <= N`
   * \post The first `old_size` characters of the string are unmodified.
   * \post `size() == old_size + count`
   * \post `at(size()) == Char(0)`
   * \throw std::out_of_range if pos + count > that.size() or if
   *        `old_size + count > N`.
   */
  template <std::size_t M>
  FOLLY_CPP14_CONSTEXPR BasicFixedString& append(
      const BasicFixedString<Char, M>& that,
      std::size_t pos,
      std::size_t count) noexcept(false) {
    detail::fixedstring::checkOverflow(pos, that.size_);
    count = detail::fixedstring::checkOverflowOrNpos(count, that.size_ - pos);
    detail::fixedstring::checkOverflow(count, N - size_);
    for (std::size_t i = 0u; i < count; ++i) {
      data_[size_ + i] = that.data_[pos + i];
    }
    size_ += count;
    data_[size_] = Char(0);
    return *this;
  }

  /**
   * \note Equivalent to `append(that, strlen(that))`.
   */
  FOLLY_CPP14_CONSTEXPR BasicFixedString& append(const Char* that) noexcept(
      false) {
    return append(that, folly::constexpr_strlen(that));
  }

  /**
   * Appends `count` characters from the specified character array.
   * \pre `that` points to a range of at least `count` characters.
   * \pre `count + old_size <= N`
   * \post The first `old_size` characters of the string are unmodified.
   * \post `size() == old_size + count`
   * \post `at(size()) == Char(0)`
   * \throw std::out_of_range if old_size + count > N.
   */
  FOLLY_CPP14_CONSTEXPR BasicFixedString& append(
      const Char* that,
      std::size_t count) noexcept(false) {
    detail::fixedstring::checkOverflow(count, N - size_);
    for (std::size_t i = 0u; i < count; ++i) {
      data_[size_ + i] = that[i];
    }
    size_ += count;
    data_[size_] = Char(0);
    return *this;
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Creates a new string by appending a character to an existing string, which
   *   is left unmodified.
   * \note Equivalent to `*this + ch`
   */
  constexpr BasicFixedString<Char, N + 1u> cappend(Char ch) const noexcept {
    return *this + ch;
  }

  /**
   * Creates a new string by appending a string to an existing string, which
   *   is left unmodified.
   * \note Equivalent to `*this + ch`
   */
  template <std::size_t M>
  constexpr BasicFixedString<Char, N + M> cappend(
      const BasicFixedString<Char, M>& that) const noexcept {
    return *this + that;
  }

  // Deleted to avoid confusion with append("char*", N), where N is a count
  // instead of a position.
  template <std::size_t M>
  constexpr BasicFixedString<Char, N + M> cappend(
      const BasicFixedString<Char, M>& that,
      std::size_t pos) const noexcept(false) = delete;

  /**
   * Creates a new string by appending characters from one string to another,
   *   which is left unmodified.
   * \note Equivalent to `*this + that.substr(pos, count)`
   */
  template <std::size_t M>
  constexpr BasicFixedString<Char, N + M> cappend(
      const BasicFixedString<Char, M>& that,
      std::size_t pos,
      std::size_t count) const noexcept(false) {
    return creplace(size_, 0u, that, pos, count);
  }

  /**
   * Creates a new string by appending a string literal to a string,
   *   which is left unmodified.
   * \note Equivalent to `*this + that`
   */
  template <std::size_t M>
  constexpr BasicFixedString<Char, N + M - 1u> cappend(
      const Char (&that)[M]) const noexcept {
    return creplace(size_, 0u, that);
  }

  // Deleted to avoid confusion with append("char*", N), where N is a count
  // instead of a position
  template <std::size_t M>
  constexpr BasicFixedString<Char, N + M - 1u> cappend(
      const Char (&that)[M],
      std::size_t pos) const noexcept(false) = delete;

  /**
   * Creates a new string by appending characters from one string to another,
   *   which is left unmodified.
   * \note Equivalent to `*this + makeFixedString(that).substr(pos, count)`
   */
  template <std::size_t M>
  constexpr BasicFixedString<Char, N + M - 1u>
  cappend(const Char (&that)[M], std::size_t pos, std::size_t count) const
      noexcept(false) {
    return creplace(size_, 0u, that, pos, count);
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Appends characters from a null-terminated string literal to this string.
   * \note Equivalent to `append(that)`.
   */
  FOLLY_CPP14_CONSTEXPR BasicFixedString& operator+=(const Char* that) noexcept(
      false) {
    return append(that);
  }

  /**
   * Appends characters from another string to this one.
   * \note Equivalent to `append(that)`.
   */
  template <std::size_t M>
  FOLLY_CPP14_CONSTEXPR BasicFixedString& operator+=(
      const BasicFixedString<Char, M>& that) noexcept(false) {
    return append(that, 0u, that.size_);
  }

  /**
   * Appends a character to this string.
   * \note Equivalent to `push_back(ch)`.
   */
  FOLLY_CPP14_CONSTEXPR BasicFixedString& operator+=(Char ch) noexcept(false) {
    push_back(ch);
    return *this;
  }

  /**
   * Appends characters from an `initializer_list` to this string.
   * \note Equivalent to `append(il.begin(), il.size())`.
   */
  FOLLY_CPP14_CONSTEXPR BasicFixedString& operator+=(
      std::initializer_list<Char> il) noexcept(false) {
    return append(il.begin(), il.size());
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Erase all characters from this string.
   * \note Equivalent to `clear()`
   * \return *this;
   */
  FOLLY_CPP14_CONSTEXPR BasicFixedString& erase() noexcept {
    clear();
    return *this;
  }

  /**
   * Erases `count` characters from position `pos`. If `count` is `npos`,
   *   erases from `pos` to the end of the string.
   * \pre `pos <= size()`
   * \pre `count <= size() - pos || count == npos`
   * \post `size() == old_size - min(count, old_size - pos)`
   * \post `at(size()) == Char(0)`
   * \return *this;
   * \throw std::out_of_range when pos > size().
   */
  FOLLY_CPP14_CONSTEXPR BasicFixedString& erase(
      std::size_t pos,
      std::size_t count = npos) noexcept(false) {
    using A = const Char[1];
    return replace(
        pos,
        detail::fixedstring::checkOverflowOrNpos(
            count, size_ - detail::fixedstring::checkOverflow(pos, size_)),
        A{Char(0)},
        0u);
  }

  /**
   * \note Equivalent to `erase(first - data(), 1)`
   * \return A pointer to the first character after the erased character.
   */
  FOLLY_CPP14_CONSTEXPR Char* erase(const Char* first) noexcept(false) {
    erase(first - data_, 1u);
    return data_ + (first - data_);
  }

  /**
   * \note Equivalent to `erase(first - data(), last - first)`
   * \return A pointer to the first character after the erased characters.
   */
  FOLLY_CPP14_CONSTEXPR Char* erase(
      const Char* first,
      const Char* last) noexcept(false) {
    erase(first - data_, last - first);
    return data_ + (first - data_);
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Create a new string by erasing all the characters from this string.
   * \note Equivalent to `BasicFixedString<Char, 0>{}`
   */
  constexpr BasicFixedString<Char, 0u> cerase() const noexcept {
    return {};
  }

  /**
   * Create a new string by erasing all the characters after position `pos` from
   *   this string.
   * \note Equivalent to `creplace(pos, min(count, pos - size()), "")`
   */
  constexpr BasicFixedString cerase(std::size_t pos, std::size_t count = npos)
      const noexcept(false) {
    using A = const Char[1];
    return creplace(
        pos,
        detail::fixedstring::checkOverflowOrNpos(
            count, size_ - detail::fixedstring::checkOverflow(pos, size_)),
        A{Char(0)});
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Compare two strings for lexicographical ordering.
   * \note Equivalent to
   * `compare(0, size(), that.data(), that.size())`
   */
  template <std::size_t M>
  constexpr int compare(const BasicFixedString<Char, M>& that) const noexcept {
    return compare(0u, size_, that, 0u, that.size_);
  }

  /**
   * Compare two strings for lexicographical ordering.
   * \note Equivalent to
   * `compare(this_pos, this_count, that.data(), that.size())`
   */
  template <std::size_t M>
  constexpr int compare(
      std::size_t this_pos,
      std::size_t this_count,
      const BasicFixedString<Char, M>& that) const noexcept(false) {
    return compare(this_pos, this_count, that, 0u, that.size_);
  }

  /**
   * Compare two strings for lexicographical ordering.
   * \note Equivalent to
   * `compare(this_pos, this_count, that.data() + that_pos, that_count)`
   */
  template <std::size_t M>
  constexpr int compare(
      std::size_t this_pos,
      std::size_t this_count,
      const BasicFixedString<Char, M>& that,
      std::size_t that_pos,
      std::size_t that_count) const noexcept(false) {
    return static_cast<int>(detail::fixedstring::compare_(
        data_,
        detail::fixedstring::checkOverflow(this_pos, size_),
        detail::fixedstring::checkOverflow(this_count, size_ - this_pos) +
            this_pos,
        that.data_,
        detail::fixedstring::checkOverflow(that_pos, that.size_),
        detail::fixedstring::checkOverflow(that_count, that.size_ - that_pos) +
            that_pos));
  }

  /**
   * Compare two strings for lexicographical ordering.
   * \note Equivalent to `compare(0, size(), that, strlen(that))`
   */
  constexpr int compare(const Char* that) const noexcept {
    return compare(0u, size_, that, folly::constexpr_strlen(that));
  }

  /**
   * \overload
   */
  constexpr int compare(Range<const Char*> that) const noexcept {
    return compare(0u, size_, that.begin(), that.size());
  }

  /**
   * Compare two strings for lexicographical ordering.
   * \note Equivalent to
   *   `compare(this_pos, this_count, that, strlen(that))`
   */
  constexpr int compare(
      std::size_t this_pos,
      std::size_t this_count,
      const Char* that) const noexcept(false) {
    return compare(this_pos, this_count, that, folly::constexpr_strlen(that));
  }

  /**
   * \overload
   */
  constexpr int compare(
      std::size_t this_pos,
      std::size_t this_count,
      Range<const Char*> that) const noexcept(false) {
    return compare(this_pos, this_count, that.begin(), that.size());
  }

  /**
   * Compare two strings for lexicographical ordering.
   *
   * Let `A` be the the
   *   character sequence {`(*this)[this_pos]`, ...
   *   `(*this)[this_pos + this_count - 1]`}. Let `B` be the character sequence
   *   {`that[0]`, ...`that[count - 1]`}. Then...
   *
   * \return
   *   - `< 0` if `A` is ordered before the `B`
   *   - `> 0` if `B` is ordered before `A`
   *   - `0` if `A` equals `B`.
   *
   * \throw std::out_of_range if this_pos + this_count > size().
   */
  constexpr int compare(
      std::size_t this_pos,
      std::size_t this_count,
      const Char* that,
      std::size_t that_count) const noexcept(false) {
    return static_cast<int>(detail::fixedstring::compare_(
        data_,
        detail::fixedstring::checkOverflow(this_pos, size_),
        detail::fixedstring::checkOverflowOrNpos(this_count, size_ - this_pos) +
            this_pos,
        that,
        0u,
        that_count));
  }

  constexpr int compare(
      std::size_t this_pos,
      std::size_t this_count,
      Range<const Char*> that,
      std::size_t that_count) const noexcept(false) {
    return compare(
        this_pos,
        this_count,
        that.begin(),
        detail::fixedstring::checkOverflow(that_count, that.size()));
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Return a substring from `pos` to the end of the string.
   * \note Equivalent to `BasicFixedString{*this, pos}`
   */
  constexpr BasicFixedString substr(std::size_t pos) const noexcept(false) {
    return {*this, pos};
  }

  /**
   * Return a substring from `pos` to the end of the string.
   * \note Equivalent to `BasicFixedString{*this, pos, count}`
   */
  constexpr BasicFixedString substr(std::size_t pos, std::size_t count) const
      noexcept(false) {
    return {*this, pos, count};
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Replace the characters in the range denoted by the half-open range
   *   [`first`, `last`) with the string `that`.
   * \pre `first` and `last` point to characters within this string (including
   *   the terminating null).
   * \note Equivalent to
   *   `replace(first - data(), last - first, that.data(), that.size())`
   */
  template <std::size_t M>
  FOLLY_CPP14_CONSTEXPR BasicFixedString& replace(
      const Char* first,
      const Char* last,
      const BasicFixedString<Char, M>& that) noexcept(false) {
    return replace(first - data_, last - first, that, 0u, that.size_);
  }

  /**
   * Replace `this_count` characters starting from position `this_pos` with the
   *   characters from string `that` starting at position `that_pos`.
   * \pre `that_pos <= that.size()`
   * \note Equivalent to
   *   <tt>replace(this_pos, this_count, that.data() + that_pos,
   *   that.size() - that_pos)</tt>
   */
  template <std::size_t M>
  FOLLY_CPP14_CONSTEXPR BasicFixedString& replace(
      std::size_t this_pos,
      std::size_t this_count,
      const BasicFixedString<Char, M>& that,
      std::size_t that_pos = 0u) noexcept(false) {
    return replace(this_pos, this_count, that, that_pos, that.size_ - that_pos);
  }

  /**
   * Replace `this_count` characters starting from position `this_pos` with
   *   `that_count` characters from string `that` starting at position
   *   `that_pos`.
   * \pre `that_pos <= that.size() && that_count <= that.size() - that_pos`
   * \note Equivalent to
   *   `replace(this_pos, this_count, that.data() + that_pos, that_count)`
   */
  template <std::size_t M>
  FOLLY_CPP14_CONSTEXPR BasicFixedString& replace(
      std::size_t this_pos,
      std::size_t this_count,
      const BasicFixedString<Char, M>& that,
      std::size_t that_pos,
      std::size_t that_count) noexcept(false) {
    return *this = creplace(this_pos, this_count, that, that_pos, that_count);
  }

  /**
   * Replace `this_count` characters starting from position `this_pos` with
   *   the characters from the string literal `that`.
   * \note Equivalent to
   *   `replace(this_pos, this_count, that, strlen(that))`
   */
  FOLLY_CPP14_CONSTEXPR BasicFixedString& replace(
      std::size_t this_pos,
      std::size_t this_count,
      const Char* that) noexcept(false) {
    return replace(this_pos, this_count, that, folly::constexpr_strlen(that));
  }

  /**
   * Replace the characters denoted by the half-open range [`first`,`last`) with
   *   the characters from the string literal `that`.
   * \pre `first` and `last` point to characters within this string (including
   *   the terminating null).
   * \note Equivalent to
   *   `replace(first - data(), last - first, that, strlen(that))`
   */
  FOLLY_CPP14_CONSTEXPR BasicFixedString& replace(
      const Char* first,
      const Char* last,
      const Char* that) noexcept(false) {
    return replace(
        first - data_, last - first, that, folly::constexpr_strlen(that));
  }

  /**
   * Replace `this_count` characters starting from position `this_pos` with
   *   `that_count` characters from the character sequence pointed to by `that`.
   * \param this_pos The starting offset within `*this` of the first character
   *   to be replaced.
   * \param this_count The number of characters to be replaced. If `npos`,
   *   it is treated as if `this_count` were `size() - this_pos`.
   * \param that A pointer to the replacement string.
   * \param that_count The number of characters in the replacement string.
   * \pre `this_pos <= size() && this_count <= size() - this_pos`
   * \pre `that` points to a contiguous sequence of at least `that_count`
   *   characters
   * \throw std::out_of_range on any of the following conditions:
   *   - `this_pos > size()`
   *   - `this_count > size() - this_pos`
   *   - `size() - this_count + that_count > N`
   */
  FOLLY_CPP14_CONSTEXPR BasicFixedString& replace(
      std::size_t this_pos,
      std::size_t this_count,
      const Char* that,
      std::size_t that_count) noexcept(false) {
    return *this = detail::fixedstring::Helper::replace_<Char>(
               data_,
               size_,
               detail::fixedstring::checkOverflow(this_pos, size_),
               detail::fixedstring::checkOverflowOrNpos(
                   this_count, size_ - this_pos),
               that,
               0u,
               that_count,
               Indices{});
  }

  /**
   * Replace `this_count` characters starting from position `this_pos` with
   *   `that_count` characters `ch`.
   * \note Equivalent to
   *   `replace(this_pos, this_count, BasicFixedString{that_count, ch})`
   */
  FOLLY_CPP14_CONSTEXPR BasicFixedString& replace(
      std::size_t this_pos,
      std::size_t this_count,
      std::size_t that_count,
      Char ch) noexcept(false) {
    return replace(this_pos, this_count, BasicFixedString{that_count, ch});
  }

  /**
   * Replace the characters denoted by the half-open range [`first`,`last`)
   *   with `that_count` characters `ch`.
   * \note Equivalent to
   *   `replace(first - data(), last - first, BasicFixedString{that_count, ch})`
   */
  FOLLY_CPP14_CONSTEXPR BasicFixedString& replace(
      const Char* first,
      const Char* last,
      std::size_t that_count,
      Char ch) noexcept(false) {
    return replace(
        first - data_, last - first, BasicFixedString{that_count, ch});
  }

  /**
   * Replace the characters denoted by the half-open range [`first`,`last`) with
   *   the characters from the string literal `that`.
   * \pre `first` and `last` point to characters within this string (including
   *   the terminating null).
   * \note Equivalent to
   *   `replace(this_pos, this_count, il.begin(), il.size())`
   */
  FOLLY_CPP14_CONSTEXPR BasicFixedString& replace(
      const Char* first,
      const Char* last,
      std::initializer_list<Char> il) noexcept(false) {
    return replace(first - data_, last - first, il.begin(), il.size());
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Construct a new string by replacing `this_count` characters starting from
   *   position `this_pos` within this string with the characters from string
   *   `that` starting at position `that_pos`.
   * \pre `that_pos <= that.size()`
   * \note Equivalent to
   *   <tt>creplace(this_pos, this_count, that, that_pos,
   *   that.size() - that_pos)</tt>
   */
  template <std::size_t M>
  constexpr BasicFixedString<Char, N + M> creplace(
      std::size_t this_pos,
      std::size_t this_count,
      const BasicFixedString<Char, M>& that,
      std::size_t that_pos = 0u) const noexcept(false) {
    return creplace(
        this_pos,
        this_count,
        that,
        that_pos,
        that.size_ - detail::fixedstring::checkOverflow(that_pos, that.size_));
  }

  /**
   * Construct a new string by replacing `this_count` characters starting from
   *   position `this_pos` within this string with `that_count` characters from
   *   string `that` starting at position `that_pos`.
   * \param this_pos The starting offset within `*this` of the first character
   *   to be replaced.
   * \param this_count The number of characters to be replaced. If `npos`,
   *   it is treated as if `this_count` were `size() - this_pos`.
   * \param that A string that contains the replacement string.
   * \param that_pos The offset to the first character in the replacement
   *   string.
   * \param that_count The number of characters in the replacement string.
   * \pre `this_pos <= size() && this_count <= size() - this_pos`
   * \pre `that_pos <= that.size() && that_count <= that.size() - that_pos`
   * \post The size of the returned string is `size() - this_count + that_count`
   * \note Equivalent to <tt>BasicFixedString<Char, N + M>{substr(0, this_pos) +
   *    that.substr(that_pos, that_count) + substr(this_pos + this_count)}</tt>
   * \throw std::out_of_range on any of the following conditions:
   *   - `this_pos > size()`
   *   - `this_count > size() - this_pos`
   *   - `that_pos > that.size()`
   *   - `that_count > that.size() - that_pos`
   */
  template <std::size_t M>
  constexpr BasicFixedString<Char, N + M> creplace(
      std::size_t this_pos,
      std::size_t this_count,
      const BasicFixedString<Char, M>& that,
      std::size_t that_pos,
      std::size_t that_count) const noexcept(false) {
    return detail::fixedstring::Helper::replace_<Char>(
        data_,
        size_,
        detail::fixedstring::checkOverflow(this_pos, size_),
        detail::fixedstring::checkOverflowOrNpos(this_count, size_ - this_pos),
        that.data_,
        detail::fixedstring::checkOverflow(that_pos, that.size_),
        detail::fixedstring::checkOverflowOrNpos(
            that_count, that.size_ - that_pos),
        folly::make_index_sequence<N + M>{});
  }

  /**
   * Construct a new string by replacing the characters denoted by the half-open
   *   range [`first`,`last`) within this string with the characters from string
   *   `that` starting at position `that_pos`.
   * \pre `that_pos <= that.size()`
   * \note Equivalent to
   *   <tt>creplace(first - data(), last - first, that, that_pos,
   *   that.size() - that_pos)</tt>
   */
  template <std::size_t M>
  constexpr BasicFixedString<Char, N + M> creplace(
      const Char* first,
      const Char* last,
      const BasicFixedString<Char, M>& that,
      std::size_t that_pos = 0u) const noexcept(false) {
    return creplace(
        first - data_,
        last - first,
        that,
        that_pos,
        that.size_ - detail::fixedstring::checkOverflow(that_pos, that.size_));
  }

  /**
   * Construct a new string by replacing the characters denoted by the half-open
   *   range [`first`,`last`) within this string with the `that_count`
   *   characters from string `that` starting at position `that_pos`.
   * \note Equivalent to
   *   <tt>creplace(first - data(), last - first, that, that_pos,
   *   that_count)</tt>
   */
  template <std::size_t M>
  constexpr BasicFixedString<Char, N + M> creplace(
      const Char* first,
      const Char* last,
      const BasicFixedString<Char, M>& that,
      std::size_t that_pos,
      std::size_t that_count) const noexcept(false) {
    return creplace(first - data_, last - first, that, that_pos, that_count);
  }

  /**
   * Construct a new string by replacing `this_count` characters starting from
   *   position `this_pos` within this string with `M-1` characters from
   *   character array `that`.
   * \pre `strlen(that) == M-1`
   * \note Equivalent to
   *   <tt>creplace(this_pos, this_count, that, 0, M - 1)</tt>
   */
  template <std::size_t M>
  constexpr BasicFixedString<Char, N + M - 1u> creplace(
      std::size_t this_pos,
      std::size_t this_count,
      const Char (&that)[M]) const noexcept(false) {
    return creplace(this_pos, this_count, that, 0u, M - 1u);
  }

  /**
   * Replace `this_count` characters starting from position `this_pos` with
   *   `that_count` characters from the character array `that` starting at
   *   position `that_pos`.
   * \param this_pos The starting offset within `*this` of the first character
   *   to be replaced.
   * \param this_count The number of characters to be replaced. If `npos`,
   *   it is treated as if `this_count` were `size() - this_pos`.
   * \param that An array of characters containing the replacement string.
   * \param that_pos The starting offset of the replacement string.
   * \param that_count The number of characters in the replacement string.  If
   *   `npos`, it is treated as if `that_count` were `M - 1 - that_pos`
   * \pre `this_pos <= size() && this_count <= size() - this_pos`
   * \pre `that_pos <= M - 1 && that_count <= M - 1 - that_pos`
   * \post The size of the returned string is `size() - this_count + that_count`
   * \note Equivalent to <tt>BasicFixedString<Char, N + M - 1>{
   *    substr(0, this_pos) +
   *    makeFixedString(that).substr(that_pos, that_count) +
   *    substr(this_pos + this_count)}</tt>
   * \throw std::out_of_range on any of the following conditions:
   *   - `this_pos > size()`
   *   - `this_count > size() - this_pos`
   *   - `that_pos >= M`
   *   - `that_count >= M - that_pos`
   */
  template <std::size_t M>
  constexpr BasicFixedString<Char, N + M - 1u> creplace(
      std::size_t this_pos,
      std::size_t this_count,
      const Char (&that)[M],
      std::size_t that_pos,
      std::size_t that_count) const noexcept(false) {
    return detail::fixedstring::Helper::replace_<Char>(
        data_,
        size_,
        detail::fixedstring::checkOverflow(this_pos, size_),
        detail::fixedstring::checkOverflowOrNpos(this_count, size_ - this_pos),
        detail::fixedstring::checkNullTerminated(that),
        detail::fixedstring::checkOverflow(that_pos, M - 1u),
        detail::fixedstring::checkOverflowOrNpos(that_count, M - 1u - that_pos),
        folly::make_index_sequence<N + M - 1u>{});
  }

  /**
   * Construct a new string by replacing the characters denoted by the half-open
   *   range [`first`,`last`) within this string with the first `M-1`
   *   characters from the character array `that`.
   * \pre `strlen(that) == M-1`
   * \note Equivalent to
   *   <tt>creplace(first - data(), last - first, that, 0, M-1)</tt>
   */
  template <std::size_t M>
  constexpr BasicFixedString<Char, N + M - 1u>
  creplace(const Char* first, const Char* last, const Char (&that)[M]) const
      noexcept(false) {
    return creplace(first - data_, last - first, that, 0u, M - 1u);
  }

  /**
   * Construct a new string by replacing the characters denoted by the half-open
   *   range [`first`,`last`) within this string with the `that_count`
   *   characters from the character array `that` starting at position
   *   `that_pos`.
   * \pre `strlen(that) == M-1`
   * \note Equivalent to
   *   `creplace(first - data(), last - first, that, that_pos, that_count)`
   */
  template <std::size_t M>
  constexpr BasicFixedString<Char, N + M - 1u> creplace(
      const Char* first,
      const Char* last,
      const Char (&that)[M],
      std::size_t that_pos,
      std::size_t that_count) const noexcept(false) {
    return creplace(first - data_, last - first, that, that_pos, that_count);
  }

  /**
   * Copies `min(count, size())` characters starting from offset `0`
   *   from this string into the buffer pointed to by `dest`.
   * \return The number of characters copied.
   */
  FOLLY_CPP14_CONSTEXPR std::size_t copy(Char* dest, std::size_t count) const
      noexcept {
    return copy(dest, count, 0u);
  }

  /**
   * Copies `min(count, size() - pos)` characters starting from offset `pos`
   *   from this string into the buffer pointed to by `dest`.
   * \pre `pos <= size()`
   * \return The number of characters copied.
   * \throw std::out_of_range if `pos > size()`
   */
  FOLLY_CPP14_CONSTEXPR std::size_t
  copy(Char* dest, std::size_t count, std::size_t pos) const noexcept(false) {
    detail::fixedstring::checkOverflow(pos, size_);
    for (std::size_t i = 0u; i < count; ++i) {
      if (i + pos == size_) {
        return size_;
      }
      dest[i] = data_[i + pos];
    }
    return count;
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Resizes the current string.
   * \note Equivalent to `resize(count, Char(0))`
   */
  FOLLY_CPP14_CONSTEXPR void resize(std::size_t count) noexcept(false) {
    resize(count, Char(0));
  }

  /**
   * Resizes the current string by setting the size to `count` and setting
   *   `data()[count]` to `Char(0)`. If `count > old_size`, the characters
   *   in the range [`old_size`,`count`) are set to `ch`.
   */
  FOLLY_CPP14_CONSTEXPR void resize(std::size_t count, Char ch) noexcept(
      false) {
    detail::fixedstring::checkOverflow(count, N);
    if (count == size_) {
    } else if (count < size_) {
      size_ = count;
      data_[size_] = Char(0);
    } else {
      for (; size_ < count; ++size_) {
        data_[size_] = ch;
      }
      data_[size_] = Char(0);
    }
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Finds the first occurrence of the character sequence `that` in this string.
   * \note Equivalent to `find(that.data(), 0, that.size())`
   */
  template <std::size_t M>
  constexpr std::size_t find(const BasicFixedString<Char, M>& that) const
      noexcept {
    return find(that, 0u);
  }

  /**
   * Finds the first occurrence of the character sequence `that` in this string,
   *   starting at offset `pos`.
   * \pre `pos <= size()`
   * \note Equivalent to `find(that.data(), pos, that.size())`
   */
  template <std::size_t M>
  constexpr std::size_t find(
      const BasicFixedString<Char, M>& that,
      std::size_t pos) const noexcept(false) {
    return that.size_ <= size_ - detail::fixedstring::checkOverflow(pos, size_)
        ? detail::fixedstring::find_(data_, size_, that.data_, pos, that.size_)
        : npos;
  }

  /**
   * Finds the first occurrence of the character sequence `that` in this string.
   * \note Equivalent to `find(that.data(), 0, strlen(that))`
   */
  constexpr std::size_t find(const Char* that) const noexcept {
    return find(that, 0u, folly::constexpr_strlen(that));
  }

  /**
   * Finds the first occurrence of the character sequence `that` in this string,
   *   starting at offset `pos`.
   * \pre `pos <= size()`
   * \note Equivalent to `find(that.data(), pos, strlen(that))`
   */
  constexpr std::size_t find(const Char* that, std::size_t pos) const
      noexcept(false) {
    return find(that, pos, folly::constexpr_strlen(that));
  }

  /**
   * Finds the first occurrence of the first `count` characters in the buffer
   *   pointed to by `that` in this string, starting at offset `pos`.
   * \pre `pos <= size()`
   * \pre `that` points to a buffer containing at least `count` contiguous
   *   characters.
   * \return The lowest offset `i` such that `i >= pos` and
   *   `0 == strncmp(data() + i, that, count)`; or `npos` if there is no such
   *   offset `i`.
   * \throw std::out_of_range when `pos > size()`
   */
  constexpr std::size_t find(
      const Char* that,
      std::size_t pos,
      std::size_t count) const noexcept(false) {
    return count <= size_ - detail::fixedstring::checkOverflow(pos, size_)
        ? detail::fixedstring::find_(data_, size_, that, pos, count)
        : npos;
  }

  /**
   * Finds the first occurrence of the character `ch` in this string.
   * \note Equivalent to `find(&ch, 0, 1)`
   */
  constexpr std::size_t find(Char ch) const noexcept {
    return find(ch, 0u);
  }

  /**
   * Finds the first occurrence of the character character `c` in this string,
   *   starting at offset `pos`.
   * \pre `pos <= size()`
   * \note Equivalent to `find(&ch, pos, 1)`
   */
  constexpr std::size_t find(Char ch, std::size_t pos) const noexcept(false) {
    using A = const Char[1u];
    return 0u == size_ - detail::fixedstring::checkOverflow(pos, size_)
        ? npos
        : detail::fixedstring::find_(data_, size_, A{ch}, pos, 1u);
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Finds the last occurrence of characters in the string
   *   `that` in this string.
   * \note Equivalent to `rfind(that.data(), size(), that.size())`
   */
  template <std::size_t M>
  constexpr std::size_t rfind(const BasicFixedString<Char, M>& that) const
      noexcept {
    return rfind(that, size_);
  }

  /**
   * Finds the last occurrence of characters in the string
   *   `that` in this string, starting at offset `pos`.
   * \note Equivalent to `rfind(that.data(), pos, that.size())`
   */
  template <std::size_t M>
  constexpr std::size_t rfind(
      const BasicFixedString<Char, M>& that,
      std::size_t pos) const noexcept(false) {
    return that.size_ <= size_
        ? detail::fixedstring::rfind_(
              data_,
              that.data_,
              folly::constexpr_min(
                  detail::fixedstring::checkOverflow(pos, size_),
                  size_ - that.size_),
              that.size_)
        : npos;
  }

  /**
   * Finds the last occurrence of characters in the buffer
   *   pointed to by `that` in this string.
   * \note Equivalent to `rfind(that, size(), strlen(that))`
   */
  constexpr std::size_t rfind(const Char* that) const noexcept {
    return rfind(that, size_, folly::constexpr_strlen(that));
  }

  /**
   * Finds the last occurrence of characters in the buffer
   *   pointed to by `that` in this string, starting at offset `pos`.
   * \note Equivalent to `rfind(that, pos, strlen(that))`
   */
  constexpr std::size_t rfind(const Char* that, std::size_t pos) const
      noexcept(false) {
    return rfind(that, pos, folly::constexpr_strlen(that));
  }

  /**
   * Finds the last occurrence of the first `count` characters in the buffer
   *   pointed to by `that` in this string, starting at offset `pos`.
   * \pre `pos <= size()`
   * \pre `that` points to a buffer containing at least `count` contiguous
   *   characters.
   * \return The largest offset `i` such that `i <= pos` and
   *   `i + count <= size()` and `0 == strncmp(data() + i, that, count)`; or
   *   `npos` if there is no such offset `i`.
   * \throw std::out_of_range when `pos > size()`
   */
  constexpr std::size_t rfind(
      const Char* that,
      std::size_t pos,
      std::size_t count) const noexcept(false) {
    return count <= size_
        ? detail::fixedstring::rfind_(
              data_,
              that,
              folly::constexpr_min(
                  detail::fixedstring::checkOverflow(pos, size_),
                  size_ - count),
              count)
        : npos;
  }

  /**
   * Finds the last occurrence of the character character `ch` in this string.
   * \note Equivalent to `rfind(&ch, size(), 1)`
   */
  constexpr std::size_t rfind(Char ch) const noexcept {
    return rfind(ch, size_);
  }

  /**
   * Finds the last occurrence of the character character `ch` in this string,
   *   starting at offset `pos`.
   * \pre `pos <= size()`
   * \note Equivalent to `rfind(&ch, pos, 1)`
   */
  constexpr std::size_t rfind(Char ch, std::size_t pos) const noexcept(false) {
    using A = const Char[1u];
    return 0u == size_
        ? npos
        : detail::fixedstring::rfind_(
              data_,
              A{ch},
              folly::constexpr_min(
                  detail::fixedstring::checkOverflow(pos, size_), size_ - 1u),
              1u);
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Finds the first occurrence of any character in `that` in this string.
   * \note Equivalent to `find_first_of(that.data(), 0, that.size())`
   */
  template <std::size_t M>
  constexpr std::size_t find_first_of(
      const BasicFixedString<Char, M>& that) const noexcept {
    return find_first_of(that, 0u);
  }

  /**
   * Finds the first occurrence of any character in `that` in this string,
   *   starting at offset `pos`
   * \note Equivalent to `find_first_of(that.data(), pos, that.size())`
   */
  template <std::size_t M>
  constexpr std::size_t find_first_of(
      const BasicFixedString<Char, M>& that,
      std::size_t pos) const noexcept(false) {
    return size_ == detail::fixedstring::checkOverflow(pos, size_)
        ? npos
        : detail::fixedstring::find_first_of_(
              data_, size_, that.data_, pos, that.size_);
  }

  /**
   * Finds the first occurrence of any character in the null-terminated
   *   character sequence pointed to by `that` in this string.
   * \note Equivalent to `find_first_of(that, 0, strlen(that))`
   */
  constexpr std::size_t find_first_of(const Char* that) const noexcept {
    return find_first_of(that, 0u, folly::constexpr_strlen(that));
  }

  /**
   * Finds the first occurrence of any character in the null-terminated
   *   character sequence pointed to by `that` in this string,
   *   starting at offset `pos`
   * \note Equivalent to `find_first_of(that, pos, strlen(that))`
   */
  constexpr std::size_t find_first_of(const Char* that, std::size_t pos) const
      noexcept(false) {
    return find_first_of(that, pos, folly::constexpr_strlen(that));
  }

  /**
   * Finds the first occurrence of any character in the first `count` characters
   *   in the buffer pointed to by `that` in this string, starting at offset
   *  `pos`.
   * \pre `pos <= size()`
   * \pre `that` points to a buffer containing at least `count` contiguous
   *   characters.
   * \return The smallest offset `i` such that `i >= pos` and
   *   `std::find(that, that+count, at(i)) != that+count`; or
   *   `npos` if there is no such offset `i`.
   * \throw std::out_of_range when `pos > size()`
   */
  constexpr std::size_t find_first_of(
      const Char* that,
      std::size_t pos,
      std::size_t count) const noexcept(false) {
    return size_ == detail::fixedstring::checkOverflow(pos, size_)
        ? npos
        : detail::fixedstring::find_first_of_(data_, size_, that, pos, count);
  }

  /**
   * Finds the first occurrence of `ch` in this string.
   * \note Equivalent to `find_first_of(&ch, 0, 1)`
   */
  constexpr std::size_t find_first_of(Char ch) const noexcept {
    return find_first_of(ch, 0u);
  }

  /**
   * Finds the first occurrence of `ch` in this string,
   *   starting at offset `pos`.
   * \note Equivalent to `find_first_of(&ch, pos, 1)`
   */
  constexpr std::size_t find_first_of(Char ch, std::size_t pos) const
      noexcept(false) {
    using A = const Char[1u];
    return size_ == detail::fixedstring::checkOverflow(pos, size_)
        ? npos
        : detail::fixedstring::find_first_of_(data_, size_, A{ch}, pos, 1u);
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Finds the first occurrence of any character not in `that` in this string.
   * \note Equivalent to `find_first_not_of(that.data(), 0, that.size())`
   */
  template <std::size_t M>
  constexpr std::size_t find_first_not_of(
      const BasicFixedString<Char, M>& that) const noexcept {
    return find_first_not_of(that, 0u);
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Finds the first occurrence of any character not in `that` in this string.
   * \note Equivalent to `find_first_not_of(that.data(), 0, that.size())`
   */
  template <std::size_t M>
  constexpr std::size_t find_first_not_of(
      const BasicFixedString<Char, M>& that,
      std::size_t pos) const noexcept(false) {
    return size_ == detail::fixedstring::checkOverflow(pos, size_)
        ? npos
        : detail::fixedstring::find_first_not_of_(
              data_, size_, that.data_, pos, that.size_);
  }

  /**
   * Finds the first occurrence of any character not in the null-terminated
   *   character sequence pointed to by `that` in this string.
   * \note Equivalent to `find_first_not_of(that, 0, strlen(that))`
   */
  constexpr std::size_t find_first_not_of(const Char* that) const noexcept {
    return find_first_not_of(that, 0u, folly::constexpr_strlen(that));
  }

  /**
   * Finds the first occurrence of any character not in the null-terminated
   *   character sequence pointed to by `that` in this string,
   *   starting at offset `pos`
   * \note Equivalent to `find_first_not_of(that, pos, strlen(that))`
   */
  constexpr std::size_t find_first_not_of(const Char* that, std::size_t pos)
      const noexcept(false) {
    return find_first_not_of(that, pos, folly::constexpr_strlen(that));
  }

  /**
   * Finds the first occurrence of any character not in the first `count`
   *   characters in the buffer pointed to by `that` in this string, starting at
   *   offset `pos`.
   * \pre `pos <= size()`
   * \pre `that` points to a buffer containing at least `count` contiguous
   *   characters.
   * \return The smallest offset `i` such that `i >= pos` and
   *   `std::find(that, that+count, at(i)) == that+count`; or
   *   `npos` if there is no such offset `i`.
   * \throw std::out_of_range when `pos > size()`
   */
  constexpr std::size_t find_first_not_of(
      const Char* that,
      std::size_t pos,
      std::size_t count) const noexcept(false) {
    return size_ == detail::fixedstring::checkOverflow(pos, size_)
        ? npos
        : detail::fixedstring::find_first_not_of_(
              data_, size_, that, pos, count);
  }

  /**
   * Finds the first occurrence of any character other than `ch` in this string.
   * \note Equivalent to `find_first_not_of(&ch, 0, 1)`
   */
  constexpr std::size_t find_first_not_of(Char ch) const noexcept {
    return find_first_not_of(ch, 0u);
  }

  /**
   * Finds the first occurrence of any character other than `ch` in this string,
   *   starting at offset `pos`.
   * \note Equivalent to `find_first_not_of(&ch, pos, 1)`
   */
  constexpr std::size_t find_first_not_of(Char ch, std::size_t pos) const
      noexcept(false) {
    using A = const Char[1u];
    return 1u <= size_ - detail::fixedstring::checkOverflow(pos, size_)
        ? detail::fixedstring::find_first_not_of_(data_, size_, A{ch}, pos, 1u)
        : npos;
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Finds the last occurrence of any character in `that` in this string.
   * \note Equivalent to `find_last_of(that.data(), size(), that.size())`
   */
  template <std::size_t M>
  constexpr std::size_t find_last_of(
      const BasicFixedString<Char, M>& that) const noexcept {
    return find_last_of(that, size_);
  }

  /**
   * Finds the last occurrence of any character in `that` in this string,
   *   starting at offset `pos`
   * \note Equivalent to `find_last_of(that.data(), pos, that.size())`
   */
  template <std::size_t M>
  constexpr std::size_t find_last_of(
      const BasicFixedString<Char, M>& that,
      std::size_t pos) const noexcept(false) {
    return 0u == size_
        ? npos
        : detail::fixedstring::find_last_of_(
              data_,
              that.data_,
              folly::constexpr_min(
                  detail::fixedstring::checkOverflow(pos, size_), size_ - 1u),
              that.size_);
  }

  /**
   * Finds the last occurrence of any character in the null-terminated
   *   character sequence pointed to by `that` in this string.
   * \note Equivalent to `find_last_of(that, size(), strlen(that))`
   */
  constexpr std::size_t find_last_of(const Char* that) const noexcept {
    return find_last_of(that, size_, folly::constexpr_strlen(that));
  }

  /**
   * Finds the last occurrence of any character in the null-terminated
   *   character sequence pointed to by `that` in this string,
   *   starting at offset `pos`
   * \note Equivalent to `find_last_of(that, pos, strlen(that))`
   */
  constexpr std::size_t find_last_of(const Char* that, std::size_t pos) const
      noexcept(false) {
    return find_last_of(that, pos, folly::constexpr_strlen(that));
  }

  /**
   * Finds the last occurrence of any character in the first `count` characters
   *   in the buffer pointed to by `that` in this string, starting at offset
   *  `pos`.
   * \pre `pos <= size()`
   * \pre `that` points to a buffer containing at least `count` contiguous
   *   characters.
   * \return The largest offset `i` such that `i <= pos` and
   *   `i < size()` and `std::find(that, that+count, at(i)) != that+count`; or
   *   `npos` if there is no such offset `i`.
   * \throw std::out_of_range when `pos > size()`
   */
  constexpr std::size_t find_last_of(
      const Char* that,
      std::size_t pos,
      std::size_t count) const noexcept(false) {
    return 0u == size_
        ? npos
        : detail::fixedstring::find_last_of_(
              data_,
              that,
              folly::constexpr_min(
                  detail::fixedstring::checkOverflow(pos, size_), size_ - 1u),
              count);
  }

  /**
   * Finds the last occurrence of `ch` in this string.
   * \note Equivalent to `find_last_of(&ch, size(), 1)`
   */
  constexpr std::size_t find_last_of(Char ch) const noexcept {
    return find_last_of(ch, size_);
  }

  /**
   * Finds the last occurrence of `ch` in this string,
   *   starting at offset `pos`.
   * \note Equivalent to `find_last_of(&ch, pos, 1)`
   */
  constexpr std::size_t find_last_of(Char ch, std::size_t pos) const
      noexcept(false) {
    using A = const Char[1u];
    return 0u == size_
        ? npos
        : detail::fixedstring::find_last_of_(
              data_,
              A{ch},
              folly::constexpr_min(
                  detail::fixedstring::checkOverflow(pos, size_), size_ - 1u),
              1u);
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Finds the last occurrence of any character not in `that` in this string.
   * \note Equivalent to `find_last_not_of(that.data(), size(), that.size())`
   */
  template <std::size_t M>
  constexpr std::size_t find_last_not_of(
      const BasicFixedString<Char, M>& that) const noexcept {
    return find_last_not_of(that, size_);
  }

  /**
   * Finds the last occurrence of any character not in `that` in this string,
   *   starting at offset `pos`
   * \note Equivalent to `find_last_not_of(that.data(), pos, that.size())`
   */
  template <std::size_t M>
  constexpr std::size_t find_last_not_of(
      const BasicFixedString<Char, M>& that,
      std::size_t pos) const noexcept(false) {
    return 0u == size_
        ? npos
        : detail::fixedstring::find_last_not_of_(
              data_,
              that.data_,
              folly::constexpr_min(
                  detail::fixedstring::checkOverflow(pos, size_), size_ - 1u),
              that.size_);
  }

  /**
   * Finds the last occurrence of any character not in the null-terminated
   *   character sequence pointed to by `that` in this string.
   * \note Equivalent to `find_last_not_of(that, size(), strlen(that))`
   */
  constexpr std::size_t find_last_not_of(const Char* that) const noexcept {
    return find_last_not_of(that, size_, folly::constexpr_strlen(that));
  }

  /**
   * Finds the last occurrence of any character not in the null-terminated
   *   character sequence pointed to by `that` in this string,
   *   starting at offset `pos`
   * \note Equivalent to `find_last_not_of(that, pos, strlen(that))`
   */
  constexpr std::size_t find_last_not_of(const Char* that, std::size_t pos)
      const noexcept(false) {
    return find_last_not_of(that, pos, folly::constexpr_strlen(that));
  }

  /**
   * Finds the last occurrence of any character not in the first `count`
   *   characters in the buffer pointed to by `that` in this string, starting at
   *   offset `pos`.
   * \pre `pos <= size()`
   * \pre `that` points to a buffer containing at least `count` contiguous
   *   characters.
   * \return The largest offset `i` such that `i <= pos` and
   *   `i < size()` and `std::find(that, that+count, at(i)) == that+count`; or
   *   `npos` if there is no such offset `i`.
   * \throw std::out_of_range when `pos > size()`
   */
  constexpr std::size_t find_last_not_of(
      const Char* that,
      std::size_t pos,
      std::size_t count) const noexcept(false) {
    return 0u == size_
        ? npos
        : detail::fixedstring::find_last_not_of_(
              data_,
              that,
              folly::constexpr_min(
                  detail::fixedstring::checkOverflow(pos, size_), size_ - 1u),
              count);
  }

  /**
   * Finds the last occurrence of any character other than `ch` in this string.
   * \note Equivalent to `find_last_not_of(&ch, size(), 1)`
   */
  constexpr std::size_t find_last_not_of(Char ch) const noexcept {
    return find_last_not_of(ch, size_);
  }

  /**
   * Finds the last occurrence of any character other than `ch` in this string,
   *   starting at offset `pos`.
   * \note Equivalent to `find_last_not_of(&ch, pos, 1)`
   */
  constexpr std::size_t find_last_not_of(Char ch, std::size_t pos) const
      noexcept(false) {
    using A = const Char[1u];
    return 0u == size_
        ? npos
        : detail::fixedstring::find_last_not_of_(
              data_,
              A{ch},
              folly::constexpr_min(
                  detail::fixedstring::checkOverflow(pos, size_), size_ - 1u),
              1u);
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Asymmetric relational operators
   */
  friend constexpr bool operator==(
      const Char* a,
      const BasicFixedString& b) noexcept {
    return detail::fixedstring::equal_(
        a, folly::constexpr_strlen(a), b.data_, b.size_);
  }

  /**
   * \overload
   */
  friend constexpr bool operator==(
      const BasicFixedString& a,
      const Char* b) noexcept {
    return b == a;
  }

  /**
   * \overload
   */
  friend constexpr bool operator==(
      Range<const Char*> a,
      const BasicFixedString& b) noexcept {
    return detail::fixedstring::equal_(a.begin(), a.size(), b.data_, b.size_);
  }

  /**
   * \overload
   */
  friend constexpr bool operator==(
      const BasicFixedString& a,
      Range<const Char*> b) noexcept {
    return b == a;
  }

  friend constexpr bool operator!=(
      const Char* a,
      const BasicFixedString& b) noexcept {
    return !(a == b);
  }

  /**
   * \overload
   */
  friend constexpr bool operator!=(
      const BasicFixedString& a,
      const Char* b) noexcept {
    return !(b == a);
  }

  /**
   * \overload
   */
  friend constexpr bool operator!=(
      Range<const Char*> a,
      const BasicFixedString& b) noexcept {
    return !(a == b);
  }

  /**
   * \overload
   */
  friend constexpr bool operator!=(
      const BasicFixedString& a,
      Range<const Char*> b) noexcept {
    return !(a == b);
  }

  friend constexpr bool operator<(
      const Char* a,
      const BasicFixedString& b) noexcept {
    return ordering::lt ==
        detail::fixedstring::compare_(
               a, 0u, folly::constexpr_strlen(a), b.data_, 0u, b.size_);
  }

  /**
   * \overload
   */
  friend constexpr bool operator<(
      const BasicFixedString& a,
      const Char* b) noexcept {
    return ordering::lt ==
        detail::fixedstring::compare_(
               a.data_, 0u, a.size_, b, 0u, folly::constexpr_strlen(b));
  }

  /**
   * \overload
   */
  friend constexpr bool operator<(
      Range<const Char*> a,
      const BasicFixedString& b) noexcept {
    return ordering::lt ==
        detail::fixedstring::compare_(
               a.begin(), 0u, a.size(), b.data_, 0u, b.size_);
  }

  /**
   * \overload
   */
  friend constexpr bool operator<(
      const BasicFixedString& a,
      Range<const Char*> b) noexcept {
    return ordering::lt ==
        detail::fixedstring::compare_(
               a.data_, 0u, a.size_, b.begin(), 0u, b.size());
  }

  friend constexpr bool operator>(
      const Char* a,
      const BasicFixedString& b) noexcept {
    return b < a;
  }

  /**
   * \overload
   */
  friend constexpr bool operator>(
      const BasicFixedString& a,
      const Char* b) noexcept {
    return b < a;
  }

  /**
   * \overload
   */
  friend constexpr bool operator>(
      Range<const Char*> a,
      const BasicFixedString& b) noexcept {
    return b < a;
  }

  /**
   * \overload
   */
  friend constexpr bool operator>(
      const BasicFixedString& a,
      Range<const Char*> b) noexcept {
    return b < a;
  }

  friend constexpr bool operator<=(
      const Char* a,
      const BasicFixedString& b) noexcept {
    return !(b < a);
  }

  /**
   * \overload
   */
  friend constexpr bool operator<=(
      const BasicFixedString& a,
      const Char* b) noexcept {
    return !(b < a);
  }

  /**
   * \overload
   */
  friend constexpr bool operator<=(
      Range<const Char*> const& a,
      const BasicFixedString& b) noexcept {
    return !(b < a);
  }

  /**
   * \overload
   */
  friend constexpr bool operator<=(
      const BasicFixedString& a,
      Range<const Char*> b) noexcept {
    return !(b < a);
  }

  friend constexpr bool operator>=(
      const Char* a,
      const BasicFixedString& b) noexcept {
    return !(a < b);
  }

  /**
   * \overload
   */
  friend constexpr bool operator>=(
      const BasicFixedString& a,
      const Char* b) noexcept {
    return !(a < b);
  }

  /**
   * \overload
   */
  friend constexpr bool operator>=(
      Range<const Char*> a,
      const BasicFixedString& b) noexcept {
    return !(a < b);
  }

  /**
   * \overload
   */
  friend constexpr bool operator>=(
      const BasicFixedString& a,
      Range<const Char*> const& b) noexcept {
    return !(a < b);
  }

  /** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
   * Asymmetric concatenation
   */
  template <std::size_t M>
  friend constexpr BasicFixedString<Char, N + M - 1u> operator+(
      const Char (&a)[M],
      const BasicFixedString& b) noexcept {
    return detail::fixedstring::Helper::concat_<Char>(
        detail::fixedstring::checkNullTerminated(a),
        M - 1u,
        b.data_,
        b.size_,
        folly::make_index_sequence<N + M - 1u>{});
  }

  /**
   * \overload
   */
  template <std::size_t M>
  friend constexpr BasicFixedString<Char, N + M - 1u> operator+(
      const BasicFixedString& a,
      const Char (&b)[M]) noexcept {
    return detail::fixedstring::Helper::concat_<Char>(
        a.data_,
        a.size_,
        detail::fixedstring::checkNullTerminated(b),
        M - 1u,
        folly::make_index_sequence<N + M - 1u>{});
  }

  /**
   * \overload
   */
  friend constexpr BasicFixedString<Char, N + 1u> operator+(
      Char a,
      const BasicFixedString& b) noexcept {
    using A = const Char[2u];
    return detail::fixedstring::Helper::concat_<Char>(
        A{a, Char(0)},
        1u,
        b.data_,
        b.size_,
        folly::make_index_sequence<N + 1u>{});
  }

  /**
   * \overload
   */
  friend constexpr BasicFixedString<Char, N + 1u> operator+(
      const BasicFixedString& a,
      Char b) noexcept {
    using A = const Char[2u];
    return detail::fixedstring::Helper::concat_<Char>(
        a.data_,
        a.size_,
        A{b, Char(0)},
        1u,
        folly::make_index_sequence<N + 1u>{});
  }
};

template <class C, std::size_t N>
inline std::basic_ostream<C>& operator<<(
    std::basic_ostream<C>& os,
    const BasicFixedString<C, N>& string) {
  using StreamSize = decltype(os.width());
  os.write(string.begin(), static_cast<StreamSize>(string.size()));
  return os;
}

/** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
 * Symmetric relational operators
 */
template <class Char, std::size_t A, std::size_t B>
constexpr bool operator==(
    const BasicFixedString<Char, A>& a,
    const BasicFixedString<Char, B>& b) noexcept {
  return detail::fixedstring::equal_(
      detail::fixedstring::Helper::data_(a),
      a.size(),
      detail::fixedstring::Helper::data_(b),
      b.size());
}

template <class Char, std::size_t A, std::size_t B>
constexpr bool operator!=(
    const BasicFixedString<Char, A>& a,
    const BasicFixedString<Char, B>& b) {
  return !(a == b);
}

template <class Char, std::size_t A, std::size_t B>
constexpr bool operator<(
    const BasicFixedString<Char, A>& a,
    const BasicFixedString<Char, B>& b) noexcept {
  return ordering::lt ==
      detail::fixedstring::compare_(
             detail::fixedstring::Helper::data_(a),
             0u,
             a.size(),
             detail::fixedstring::Helper::data_(b),
             0u,
             b.size());
}

template <class Char, std::size_t A, std::size_t B>
constexpr bool operator>(
    const BasicFixedString<Char, A>& a,
    const BasicFixedString<Char, B>& b) noexcept {
  return b < a;
}

template <class Char, std::size_t A, std::size_t B>
constexpr bool operator<=(
    const BasicFixedString<Char, A>& a,
    const BasicFixedString<Char, B>& b) noexcept {
  return !(b < a);
}

template <class Char, std::size_t A, std::size_t B>
constexpr bool operator>=(
    const BasicFixedString<Char, A>& a,
    const BasicFixedString<Char, B>& b) noexcept {
  return !(a < b);
}

/** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
 * Symmetric concatenation
 */
template <class Char, std::size_t N, std::size_t M>
constexpr BasicFixedString<Char, N + M> operator+(
    const BasicFixedString<Char, N>& a,
    const BasicFixedString<Char, M>& b) noexcept {
  return detail::fixedstring::Helper::concat_<Char>(
      detail::fixedstring::Helper::data_(a),
      a.size(),
      detail::fixedstring::Helper::data_(b),
      b.size(),
      folly::make_index_sequence<N + M>{});
}

/** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
 * Construct a `BasicFixedString` object from a null-terminated array of
 * characters. The capacity and size of the string will be equal to one less
 * than the size of the array.
 * \pre `a` contains no embedded null characters.
 * \pre `a[N-1] == Char(0)`
 * \post For a returned string `s`, `s[i]==a[i]` for every `i` in [`0`,`N-1`].
 */
template <class Char, std::size_t N>
constexpr BasicFixedString<Char, N - 1u> makeFixedString(
    const Char (&a)[N]) noexcept {
  return {a};
}

/** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** **
 * Swap function
 */
template <class Char, std::size_t N>
FOLLY_CPP14_CONSTEXPR void swap(
    BasicFixedString<Char, N>& a,
    BasicFixedString<Char, N>& b) noexcept {
  a.swap(b);
}

inline namespace literals {
inline namespace string_literals {
inline namespace {
// "const std::size_t&" is so that folly::npos has the same address in every
// translation unit. This is to avoid potential violations of the ODR.
constexpr const std::size_t& npos = detail::fixedstring::FixedStringBase::npos;
} // namespace

#if defined(__GNUC__) && !defined(__ICC)
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wpragmas"
#pragma GCC diagnostic ignored "-Wgnu-string-literal-operator-template"

/** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** ** *
 * User-defined literals for creating FixedString objects from string literals
 * on the compilers that support it.
 *
 * \par Example:
 * \par
 * \code
 * using namespace folly::string_literals;
 * constexpr auto hello = "hello world!"_fs;
 * \endcode
 *
 * \note This requires a GNU compiler extension
 *   (-Wgnu-string-literal-operator-template) supported by clang and gcc,
 *   proposed for standardization in
 *   <http://www.open-std.org/jtc1/sc22/wg21/docs/papers/2016/p0424r0.pdf>.
 *   \par
 *   For portable code, prefer the suffixes `_fs4`, `_fs8`, `_fs16`, `_fs32`,
 *   `_fs64`, and `_fs128` for creating instances of types `FixedString<4>`,
 *   `FixedString<8>`, `FixedString<16>`, etc.
 */
template <class Char, Char... Cs>
constexpr BasicFixedString<Char, sizeof...(Cs)> operator"" _fs() noexcept {
#if __cplusplus >= 201402L
  const Char a[] = {Cs..., Char(0)};
  return {+a, sizeof...(Cs)};
#else
  using A = const Char[sizeof...(Cs) + 1u];
  // The `+` in `+A{etc}` forces the array type to decay to a pointer
  return {+A{Cs..., Char(0)}, sizeof...(Cs)};
#endif
}

#pragma GCC diagnostic pop
#endif

#define FOLLY_DEFINE_FIXED_STRING_UDL(N)                     \
  constexpr FixedString<N> operator"" _fs##N(                \
      const char* that, std::size_t count) noexcept(false) { \
    return {that, count};                                    \
  }                                                          \
/**/

// Define UDLs _fs4, _fs8, _fs16, etc for FixedString<[4, 8, 16, ...]>
FOLLY_DEFINE_FIXED_STRING_UDL(4)
FOLLY_DEFINE_FIXED_STRING_UDL(8)
FOLLY_DEFINE_FIXED_STRING_UDL(16)
FOLLY_DEFINE_FIXED_STRING_UDL(32)
FOLLY_DEFINE_FIXED_STRING_UDL(64)
FOLLY_DEFINE_FIXED_STRING_UDL(128)

#undef FOLLY_DEFINE_FIXED_STRING_UDL
} // namespace string_literals
} // namespace literals

// TODO:
// // numeric conversions:
// template <std::size_t N>
// constexpr int stoi(const FixedString<N>& str, int base = 10);
// template <std::size_t N>
// constexpr unsigned stou(const FixedString<N>& str, int base = 10);
// template <std::size_t N>
// constexpr long stol(const FixedString<N>& str, int base = 10);
// template <std::size_t N>
// constexpr unsigned long stoul(const FixedString<N>& str, int base = 10;
// template <std::size_t N>
// constexpr long long stoll(const FixedString<N>& str, int base = 10);
// template <std::size_t N>
// constexpr unsigned long long stoull(const FixedString<N>& str,
// int base = 10);
// template <std::size_t N>
// constexpr float stof(const FixedString<N>& str);
// template <std::size_t N>
// constexpr double stod(const FixedString<N>& str);
// template <std::size_t N>
// constexpr long double stold(const FixedString<N>& str);
// template <int val>
// constexpr FixedString</*...*/> to_fixed_string_i() noexcept;
// template <unsigned val>
// constexpr FixedString</*...*/> to_fixed_string_u() noexcept;
// template <long val>
// constexpr FixedString</*...*/> to_fixed_string_l() noexcept;
// template <unsigned long val>
// constexpr FixedString</*...*/> to_fixed_string_ul() noexcept;
// template <long long val>
// constexpr FixedString</*...*/> to_fixed_string_ll() noexcept
// template <unsigned long long val>
// constexpr FixedString</*...*/> to_fixed_string_ull() noexcept;
} // namespace folly
