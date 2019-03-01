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

// @author Mark Rabkin (mrabkin@fb.com)
// @author Andrei Alexandrescu (andrei.alexandrescu@fb.com)

#pragma once

#include <folly/FBString.h>
#include <folly/Portability.h>
#include <folly/SpookyHashV2.h>
#include <folly/portability/BitsFunctexcept.h>
#include <folly/portability/Constexpr.h>
#include <folly/portability/String.h>

#include <boost/operators.hpp>
#include <glog/logging.h>
#include <algorithm>
#include <array>
#include <climits>
#include <cstddef>
#include <cstring>
#include <iosfwd>
#include <stdexcept>
#include <string>
#include <type_traits>

// libc++ doesn't provide this header, nor does msvc
#ifdef FOLLY_HAVE_BITS_CXXCONFIG_H
// This file appears in two locations: inside fbcode and in the
// libstdc++ source code (when embedding fbstring as std::string).
// To aid in this schizophrenic use, two macros are defined in
// c++config.h:
//   _LIBSTDCXX_FBSTRING - Set inside libstdc++.  This is useful to
//      gate use inside fbcode v. libstdc++
#include <bits/c++config.h>
#endif

#include <folly/CpuId.h>
#include <folly/Traits.h>
#include <folly/Likely.h>
#include <folly/detail/RangeCommon.h>
#include <folly/detail/RangeSse42.h>

// Ignore shadowing warnings within this file, so includers can use -Wshadow.
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wshadow"

namespace folly {

template <class Iter> class Range;

/**
 * Finds the first occurrence of needle in haystack. The algorithm is on
 * average faster than O(haystack.size() * needle.size()) but not as fast
 * as Boyer-Moore. On the upside, it does not do any upfront
 * preprocessing and does not allocate memory.
 */
template <class Iter,
          class Comp = std::equal_to<typename Range<Iter>::value_type>>
inline size_t qfind(const Range<Iter> & haystack,
                    const Range<Iter> & needle,
                    Comp eq = Comp());

/**
 * Finds the first occurrence of needle in haystack. The result is the
 * offset reported to the beginning of haystack, or string::npos if
 * needle wasn't found.
 */
template <class Iter>
size_t qfind(const Range<Iter> & haystack,
             const typename Range<Iter>::value_type& needle);

/**
 * Finds the last occurrence of needle in haystack. The result is the
 * offset reported to the beginning of haystack, or string::npos if
 * needle wasn't found.
 */
template <class Iter>
size_t rfind(const Range<Iter> & haystack,
             const typename Range<Iter>::value_type& needle);


/**
 * Finds the first occurrence of any element of needle in
 * haystack. The algorithm is O(haystack.size() * needle.size()).
 */
template <class Iter>
inline size_t qfind_first_of(const Range<Iter> & haystack,
                             const Range<Iter> & needle);

/**
 * Small internal helper - returns the value just before an iterator.
 */
namespace detail {

/**
 * For random-access iterators, the value before is simply i[-1].
 */
template <class Iter>
typename std::enable_if<
  std::is_same<typename std::iterator_traits<Iter>::iterator_category,
               std::random_access_iterator_tag>::value,
  typename std::iterator_traits<Iter>::reference>::type
value_before(Iter i) {
  return i[-1];
}

/**
 * For all other iterators, we need to use the decrement operator.
 */
template <class Iter>
typename std::enable_if<
  !std::is_same<typename std::iterator_traits<Iter>::iterator_category,
                std::random_access_iterator_tag>::value,
  typename std::iterator_traits<Iter>::reference>::type
value_before(Iter i) {
  return *--i;
}

/*
 * Use IsCharPointer<T>::type to enable const char* or char*.
 * Use IsCharPointer<T>::const_type to enable only const char*.
 */
template <class T> struct IsCharPointer {};

template <>
struct IsCharPointer<char*> {
  typedef int type;
};

template <>
struct IsCharPointer<const char*> {
  typedef int const_type;
  typedef int type;
};

} // namespace detail

/**
 * Range abstraction keeping a pair of iterators. We couldn't use
 * boost's similar range abstraction because we need an API identical
 * with the former StringPiece class, which is used by a lot of other
 * code. This abstraction does fulfill the needs of boost's
 * range-oriented algorithms though.
 *
 * (Keep memory lifetime in mind when using this class, since it
 * doesn't manage the data it refers to - just like an iterator
 * wouldn't.)
 */
template <class Iter>
class Range : private boost::totally_ordered<Range<Iter> > {
public:
  typedef std::size_t size_type;
  typedef Iter iterator;
  typedef Iter const_iterator;
  typedef typename std::remove_reference<
    typename std::iterator_traits<Iter>::reference>::type
  value_type;
  using difference_type = typename std::iterator_traits<Iter>::difference_type;
  typedef typename std::iterator_traits<Iter>::reference reference;

  /**
   * For MutableStringPiece and MutableByteRange we define StringPiece
   * and ByteRange as const_range_type (for everything else its just
   * identity). We do that to enable operations such as find with
   * args which are const.
   */
  typedef typename std::conditional<
    std::is_same<Iter, char*>::value
      || std::is_same<Iter, unsigned char*>::value,
    Range<const value_type*>,
    Range<Iter>>::type const_range_type;

  typedef std::char_traits<typename std::remove_const<value_type>::type>
    traits_type;

  static const size_type npos;

  // Works for all iterators
  constexpr Range() : b_(), e_() {
  }

  constexpr Range(const Range&) = default;
  constexpr Range(Range&&) = default;

public:
  // Works for all iterators
  constexpr Range(Iter start, Iter end) : b_(start), e_(end) {
  }

  // Works only for random-access iterators
  constexpr Range(Iter start, size_t size)
      : b_(start), e_(start + size) { }

  /* implicit */ Range(std::nullptr_t) = delete;

  template <class T = Iter, typename detail::IsCharPointer<T>::type = 0>
  constexpr /* implicit */ Range(Iter str)
      : b_(str), e_(str + constexpr_strlen(str)) {}

  template <class T = Iter, typename detail::IsCharPointer<T>::const_type = 0>
  /* implicit */ Range(const std::string& str)
      : b_(str.data()), e_(b_ + str.size()) {}

  template <class T = Iter, typename detail::IsCharPointer<T>::const_type = 0>
  Range(const std::string& str, std::string::size_type startFrom) {
    if (UNLIKELY(startFrom > str.size())) {
      std::__throw_out_of_range("index out of range");
    }
    b_ = str.data() + startFrom;
    e_ = str.data() + str.size();
  }

  template <class T = Iter, typename detail::IsCharPointer<T>::const_type = 0>
  Range(const std::string& str,
        std::string::size_type startFrom,
        std::string::size_type size) {
    if (UNLIKELY(startFrom > str.size())) {
      std::__throw_out_of_range("index out of range");
    }
    b_ = str.data() + startFrom;
    if (str.size() - startFrom < size) {
      e_ = str.data() + str.size();
    } else {
      e_ = b_ + size;
    }
  }

  Range(const Range& other,
        size_type first,
        size_type length = npos)
      : Range(other.subpiece(first, length))
    { }

  template <class T = Iter, typename detail::IsCharPointer<T>::const_type = 0>
  /* implicit */ Range(const fbstring& str)
    : b_(str.data()), e_(b_ + str.size()) { }

  template <class T = Iter, typename detail::IsCharPointer<T>::const_type = 0>
  Range(const fbstring& str, fbstring::size_type startFrom) {
    if (UNLIKELY(startFrom > str.size())) {
      std::__throw_out_of_range("index out of range");
    }
    b_ = str.data() + startFrom;
    e_ = str.data() + str.size();
  }

  template <class T = Iter, typename detail::IsCharPointer<T>::const_type = 0>
  Range(const fbstring& str, fbstring::size_type startFrom,
        fbstring::size_type size) {
    if (UNLIKELY(startFrom > str.size())) {
      std::__throw_out_of_range("index out of range");
    }
    b_ = str.data() + startFrom;
    if (str.size() - startFrom < size) {
      e_ = str.data() + str.size();
    } else {
      e_ = b_ + size;
    }
  }

  // Allow implicit conversion from Range<const char*> (aka StringPiece) to
  // Range<const unsigned char*> (aka ByteRange), as they're both frequently
  // used to represent ranges of bytes.  Allow explicit conversion in the other
  // direction.
  template <class OtherIter, typename std::enable_if<
      (std::is_same<Iter, const unsigned char*>::value &&
       (std::is_same<OtherIter, const char*>::value ||
        std::is_same<OtherIter, char*>::value)), int>::type = 0>
  /* implicit */ Range(const Range<OtherIter>& other)
    : b_(reinterpret_cast<const unsigned char*>(other.begin())),
      e_(reinterpret_cast<const unsigned char*>(other.end())) {
  }

  template <class OtherIter, typename std::enable_if<
      (std::is_same<Iter, unsigned char*>::value &&
       std::is_same<OtherIter, char*>::value), int>::type = 0>
  /* implicit */ Range(const Range<OtherIter>& other)
    : b_(reinterpret_cast<unsigned char*>(other.begin())),
      e_(reinterpret_cast<unsigned char*>(other.end())) {
  }

  template <class OtherIter, typename std::enable_if<
      (std::is_same<Iter, const char*>::value &&
       (std::is_same<OtherIter, const unsigned char*>::value ||
        std::is_same<OtherIter, unsigned char*>::value)), int>::type = 0>
  explicit Range(const Range<OtherIter>& other)
    : b_(reinterpret_cast<const char*>(other.begin())),
      e_(reinterpret_cast<const char*>(other.end())) {
  }

  template <class OtherIter, typename std::enable_if<
      (std::is_same<Iter, char*>::value &&
       std::is_same<OtherIter, unsigned char*>::value), int>::type = 0>
  explicit Range(const Range<OtherIter>& other)
    : b_(reinterpret_cast<char*>(other.begin())),
      e_(reinterpret_cast<char*>(other.end())) {
  }

  // Allow implicit conversion from Range<From> to Range<To> if From is
  // implicitly convertible to To.
  template <class OtherIter, typename std::enable_if<
     (!std::is_same<Iter, OtherIter>::value &&
      std::is_convertible<OtherIter, Iter>::value), int>::type = 0>
  constexpr /* implicit */ Range(const Range<OtherIter>& other)
    : b_(other.begin()),
      e_(other.end()) {
  }

  // Allow explicit conversion from Range<From> to Range<To> if From is
  // explicitly convertible to To.
  template <class OtherIter, typename std::enable_if<
    (!std::is_same<Iter, OtherIter>::value &&
     !std::is_convertible<OtherIter, Iter>::value &&
     std::is_constructible<Iter, const OtherIter&>::value), int>::type = 0>
  constexpr explicit Range(const Range<OtherIter>& other)
    : b_(other.begin()),
      e_(other.end()) {
  }

  /**
   * Allow explicit construction of Range() from a std::array of a
   * convertible type.
   *
   * For instance, this allows constructing StringPiece from a
   * std::array<char, N> or a std::array<const char, N>
   */
  template <
      class T,
      size_t N,
      typename = typename std::enable_if<
          std::is_convertible<const T*, Iter>::value>::type>
  constexpr explicit Range(const std::array<T, N>& array)
      : b_{array.empty() ? nullptr : &array.at(0)},
        e_{array.empty() ? nullptr : &array.at(0) + N} {}
  template <
      class T,
      size_t N,
      typename =
          typename std::enable_if<std::is_convertible<T*, Iter>::value>::type>
  constexpr explicit Range(std::array<T, N>& array)
      : b_{array.empty() ? nullptr : &array.at(0)},
        e_{array.empty() ? nullptr : &array.at(0) + N} {}

  Range& operator=(const Range& rhs) & = default;
  Range& operator=(Range&& rhs) & = default;

  void clear() {
    b_ = Iter();
    e_ = Iter();
  }

  void assign(Iter start, Iter end) {
    b_ = start;
    e_ = end;
  }

  void reset(Iter start, size_type size) {
    b_ = start;
    e_ = start + size;
  }

  // Works only for Range<const char*>
  void reset(const std::string& str) {
    reset(str.data(), str.size());
  }

  constexpr size_type size() const {
    // It would be nice to assert(b_ <= e_) here.  This can be achieved even
    // in a C++11 compatible constexpr function:
    // http://ericniebler.com/2014/09/27/assert-and-constexpr-in-cxx11/
    // Unfortunately current gcc versions have a bug causing it to reject
    // this check in a constexpr function:
    // https://gcc.gnu.org/bugzilla/show_bug.cgi?id=71448
    return size_type(e_ - b_);
  }
  constexpr size_type walk_size() const {
    return size_type(std::distance(b_, e_));
  }
  constexpr bool empty() const {
    return b_ == e_;
  }
  constexpr Iter data() const {
    return b_;
  }
  constexpr Iter start() const {
    return b_;
  }
  constexpr Iter begin() const {
    return b_;
  }
  constexpr Iter end() const {
    return e_;
  }
  constexpr Iter cbegin() const {
    return b_;
  }
  constexpr Iter cend() const {
    return e_;
  }
  value_type& front() {
    assert(b_ < e_);
    return *b_;
  }
  value_type& back() {
    assert(b_ < e_);
    return detail::value_before(e_);
  }
  const value_type& front() const {
    assert(b_ < e_);
    return *b_;
  }
  const value_type& back() const {
    assert(b_ < e_);
    return detail::value_before(e_);
  }
  // Works only for Range<const char*> and Range<char*>
  std::string str() const { return std::string(b_, size()); }
  std::string toString() const { return str(); }
  // Works only for Range<const char*> and Range<char*>
  fbstring fbstr() const { return fbstring(b_, size()); }
  fbstring toFbstring() const { return fbstr(); }

  const_range_type castToConst() const {
    return const_range_type(*this);
  }

  // Works only for Range<const char*> and Range<char*>
  int compare(const const_range_type& o) const {
    const size_type tsize = this->size();
    const size_type osize = o.size();
    const size_type msize = std::min(tsize, osize);
    int r = traits_type::compare(data(), o.data(), msize);
    if (r == 0 && tsize != osize) {
      // We check the signed bit of the subtraction and bit shift it
      // to produce either 0 or 2. The subtraction yields the
      // comparison values of either -1 or 1.
      r = (static_cast<int>(
             (osize - tsize) >> (CHAR_BIT * sizeof(size_t) - 1)) << 1) - 1;
    }
    return r;
  }

  value_type& operator[](size_t i) {
    DCHECK_GT(size(), i);
    return b_[i];
  }

  const value_type& operator[](size_t i) const {
    DCHECK_GT(size(), i);
    return b_[i];
  }

  value_type& at(size_t i) {
    if (i >= size()) std::__throw_out_of_range("index out of range");
    return b_[i];
  }

  const value_type& at(size_t i) const {
    if (i >= size()) std::__throw_out_of_range("index out of range");
    return b_[i];
  }

  // Do NOT use this function, which was left behind for backwards
  // compatibility.  Use SpookyHashV2 instead -- it is faster, and produces
  // a 64-bit hash, which means dramatically fewer collisions in large maps.
  // (The above advice does not apply if you are targeting a 32-bit system.)
  //
  // Works only for Range<const char*> and Range<char*>
  //
  //
  //         ** WANT TO GET RID OF THIS LINT? **
  //
  // A) Use a better hash function (*cough*folly::Hash*cough*), but
  //    only if you don't serialize data in a format that depends on
  //    this formula (ie the writer and reader assume this exact hash
  //    function is used).
  //
  // B) If you have to use this exact function then make your own hasher
  //    object and copy the body over (see thrift example: D3972362).
  //    https://github.com/facebook/fbthrift/commit/f8ed502e24ab4a32a9d5f266580
  FOLLY_DEPRECATED("Replace with folly::Hash if the hash is not serialized")
  uint32_t hash() const {
    // Taken from fbi/nstring.h:
    //    Quick and dirty bernstein hash...fine for short ascii strings
    uint32_t hash = 5381;
    for (size_t ix = 0; ix < size(); ix++) {
      hash = ((hash << 5) + hash) + b_[ix];
    }
    return hash;
  }

  void advance(size_type n) {
    if (UNLIKELY(n > size())) {
      std::__throw_out_of_range("index out of range");
    }
    b_ += n;
  }

  void subtract(size_type n) {
    if (UNLIKELY(n > size())) {
      std::__throw_out_of_range("index out of range");
    }
    e_ -= n;
  }

  Range subpiece(size_type first, size_type length = npos) const {
    if (UNLIKELY(first > size())) {
      std::__throw_out_of_range("index out of range");
    }

    return Range(b_ + first, std::min(length, size() - first));
  }

  // unchecked versions
  void uncheckedAdvance(size_type n) {
    DCHECK_LE(n, size());
    b_ += n;
  }

  void uncheckedSubtract(size_type n) {
    DCHECK_LE(n, size());
    e_ -= n;
  }

  Range uncheckedSubpiece(size_type first, size_type length = npos) const {
    DCHECK_LE(first, size());
    return Range(b_ + first, std::min(length, size() - first));
  }

  void pop_front() {
    assert(b_ < e_);
    ++b_;
  }

  void pop_back() {
    assert(b_ < e_);
    --e_;
  }

  // string work-alike functions
  size_type find(const_range_type str) const {
    return qfind(castToConst(), str);
  }

  size_type find(const_range_type str, size_t pos) const {
    if (pos > size()) return std::string::npos;
    size_t ret = qfind(castToConst().subpiece(pos), str);
    return ret == npos ? ret : ret + pos;
  }

  size_type find(Iter s, size_t pos, size_t n) const {
    if (pos > size()) return std::string::npos;
    auto forFinding = castToConst();
    size_t ret = qfind(
        pos ? forFinding.subpiece(pos) : forFinding, const_range_type(s, n));
    return ret == npos ? ret : ret + pos;
  }

  // Works only for Range<(const) (unsigned) char*> which have Range(Iter) ctor
  size_type find(const Iter s) const {
    return qfind(castToConst(), const_range_type(s));
  }

  // Works only for Range<(const) (unsigned) char*> which have Range(Iter) ctor
  size_type find(const Iter s, size_t pos) const {
    if (pos > size()) return std::string::npos;
    size_type ret = qfind(castToConst().subpiece(pos), const_range_type(s));
    return ret == npos ? ret : ret + pos;
  }

  size_type find(value_type c) const {
    return qfind(castToConst(), c);
  }

  size_type rfind(value_type c) const {
    return folly::rfind(castToConst(), c);
  }

  size_type find(value_type c, size_t pos) const {
    if (pos > size()) return std::string::npos;
    size_type ret = qfind(castToConst().subpiece(pos), c);
    return ret == npos ? ret : ret + pos;
  }

  size_type find_first_of(const_range_type needles) const {
    return qfind_first_of(castToConst(), needles);
  }

  size_type find_first_of(const_range_type needles, size_t pos) const {
    if (pos > size()) return std::string::npos;
    size_type ret = qfind_first_of(castToConst().subpiece(pos), needles);
    return ret == npos ? ret : ret + pos;
  }

  // Works only for Range<(const) (unsigned) char*> which have Range(Iter) ctor
  size_type find_first_of(Iter needles) const {
    return find_first_of(const_range_type(needles));
  }

  // Works only for Range<(const) (unsigned) char*> which have Range(Iter) ctor
  size_type find_first_of(Iter needles, size_t pos) const {
    return find_first_of(const_range_type(needles), pos);
  }

  size_type find_first_of(Iter needles, size_t pos, size_t n) const {
    return find_first_of(const_range_type(needles, n), pos);
  }

  size_type find_first_of(value_type c) const {
    return find(c);
  }

  size_type find_first_of(value_type c, size_t pos) const {
    return find(c, pos);
  }

  /**
   * Determine whether the range contains the given subrange or item.
   *
   * Note: Call find() directly if the index is needed.
   */
  bool contains(const const_range_type& other) const {
    return find(other) != std::string::npos;
  }

  bool contains(const value_type& other) const {
    return find(other) != std::string::npos;
  }

  void swap(Range& rhs) {
    std::swap(b_, rhs.b_);
    std::swap(e_, rhs.e_);
  }

  /**
   * Does this Range start with another range?
   */
  bool startsWith(const const_range_type& other) const {
    return size() >= other.size()
      && castToConst().subpiece(0, other.size()) == other;
  }
  bool startsWith(value_type c) const {
    return !empty() && front() == c;
  }

  template <class Comp>
  bool startsWith(const const_range_type& other, Comp&& eq) const {
    if (size() < other.size()) {
      return false;
    }
    auto const trunc = subpiece(0, other.size());
    return std::equal(
        trunc.begin(), trunc.end(), other.begin(), std::forward<Comp>(eq));
  }

  /**
   * Does this Range end with another range?
   */
  bool endsWith(const const_range_type& other) const {
    return size() >= other.size()
      && castToConst().subpiece(size() - other.size()) == other;
  }
  bool endsWith(value_type c) const {
    return !empty() && back() == c;
  }

  template <class Comp>
  bool endsWith(const const_range_type& other, Comp&& eq) const {
    if (size() < other.size()) {
      return false;
    }
    auto const trunc = subpiece(size() - other.size());
    return std::equal(
        trunc.begin(), trunc.end(), other.begin(), std::forward<Comp>(eq));
  }

  /**
   * Remove the items in [b, e), as long as this subrange is at the beginning
   * or end of the Range.
   *
   * Required for boost::algorithm::trim()
   */
  void erase(Iter b, Iter e) {
    if (b == b_) {
      b_ = e;
    } else if (e == e_) {
      e_ = b;
    } else {
      std::__throw_out_of_range("index out of range");
    }
  }

  /**
   * Remove the given prefix and return true if the range starts with the given
   * prefix; return false otherwise.
   */
  bool removePrefix(const const_range_type& prefix) {
    return startsWith(prefix) && (b_ += prefix.size(), true);
  }
  bool removePrefix(value_type prefix) {
    return startsWith(prefix) && (++b_, true);
  }

  /**
   * Remove the given suffix and return true if the range ends with the given
   * suffix; return false otherwise.
   */
  bool removeSuffix(const const_range_type& suffix) {
    return endsWith(suffix) && (e_ -= suffix.size(), true);
  }
  bool removeSuffix(value_type suffix) {
    return endsWith(suffix) && (--e_, true);
  }

  /**
   * Replaces the content of the range, starting at position 'pos', with
   * contents of 'replacement'. Entire 'replacement' must fit into the
   * range. Returns false if 'replacements' does not fit. Example use:
   *
   * char in[] = "buffer";
   * auto msp = MutablesStringPiece(input);
   * EXPECT_TRUE(msp.replaceAt(2, "tt"));
   * EXPECT_EQ(msp, "butter");
   *
   * // not enough space
   * EXPECT_FALSE(msp.replace(msp.size() - 1, "rr"));
   * EXPECT_EQ(msp, "butter"); // unchanged
   */
  bool replaceAt(size_t pos, const_range_type replacement) {
    if (size() < pos + replacement.size()) {
      return false;
    }

    std::copy(replacement.begin(), replacement.end(), begin() + pos);

    return true;
  }

  /**
   * Replaces all occurences of 'source' with 'dest'. Returns number
   * of replacements made. Source and dest have to have the same
   * length. Throws if the lengths are different. If 'source' is a
   * pattern that is overlapping with itself, we perform sequential
   * replacement: "aaaaaaa".replaceAll("aa", "ba") --> "bababaa"
   *
   * Example use:
   *
   * char in[] = "buffer";
   * auto msp = MutablesStringPiece(input);
   * EXPECT_EQ(msp.replaceAll("ff","tt"), 1);
   * EXPECT_EQ(msp, "butter");
   */
  size_t replaceAll(const_range_type source, const_range_type dest) {
    if (source.size() != dest.size()) {
      throw std::invalid_argument(
          "replacement must have the same size as source");
    }

    if (dest.empty()) {
      return 0;
    }

    size_t pos = 0;
    size_t num_replaced = 0;
    size_type found = std::string::npos;
    while ((found = find(source, pos)) != std::string::npos) {
      replaceAt(found, dest);
      pos += source.size();
      ++num_replaced;
    }

    return num_replaced;
  }

  /**
   * Splits this `Range` `[b, e)` in the position `i` dictated by the next
   * occurence of `delimiter`.
   *
   * Returns a new `Range` `[b, i)` and adjusts this range to start right after
   * the delimiter's position. This range will be empty if the delimiter is not
   * found. If called on an empty `Range`, both this and the returned `Range`
   * will be empty.
   *
   * Example:
   *
   *  folly::StringPiece s("sample string for split_next");
   *  auto p = s.split_step(' ');
   *
   *  // prints "string for split_next"
   *  cout << s << endl;
   *
   *  // prints "sample"
   *  cout << p << endl;
   *
   * Example 2:
   *
   *  void tokenize(StringPiece s, char delimiter) {
   *    while (!s.empty()) {
   *      cout << s.split_step(delimiter);
   *    }
   *  }
   *
   * @author: Marcelo Juchem <marcelo@fb.com>
   */
  Range split_step(value_type delimiter) {
    auto i = std::find(b_, e_, delimiter);
    Range result(b_, i);

    b_ = i == e_ ? e_ : std::next(i);

    return result;
  }

  Range split_step(Range delimiter) {
    auto i = find(delimiter);
    Range result(b_, i == std::string::npos ? size() : i);

    b_ = result.end() == e_
        ? e_
        : std::next(
              result.end(),
              typename std::iterator_traits<Iter>::difference_type(
                  delimiter.size()));

    return result;
  }

  /**
   * Convenience method that calls `split_step()` and passes the result to a
   * functor, returning whatever the functor does. Any additional arguments
   * `args` passed to this function are perfectly forwarded to the functor.
   *
   * Say you have a functor with this signature:
   *
   *  Foo fn(Range r) { }
   *
   * `split_step()`'s return type will be `Foo`. It works just like:
   *
   *  auto result = fn(myRange.split_step(' '));
   *
   * A functor returning `void` is also supported.
   *
   * Example:
   *
   *  void do_some_parsing(folly::StringPiece s) {
   *    auto version = s.split_step(' ', [&](folly::StringPiece x) {
   *      if (x.empty()) {
   *        throw std::invalid_argument("empty string");
   *      }
   *      return std::strtoull(x.begin(), x.end(), 16);
   *    });
   *
   *    // ...
   *  }
   *
   *  struct Foo {
   *    void parse(folly::StringPiece s) {
   *      s.split_step(' ', parse_field, bar, 10);
   *      s.split_step('\t', parse_field, baz, 20);
   *
   *      auto const kludge = [](folly::StringPiece x, int &out, int def) {
   *        if (x == "null") {
   *          out = 0;
   *        } else {
   *          parse_field(x, out, def);
   *        }
   *      };
   *
   *      s.split_step('\t', kludge, gaz);
   *      s.split_step(' ', kludge, foo);
   *    }
   *
   *  private:
   *    int bar;
   *    int baz;
   *    int gaz;
   *    int foo;
   *
   *    static parse_field(folly::StringPiece s, int &out, int def) {
   *      try {
   *        out = folly::to<int>(s);
   *      } catch (std::exception const &) {
   *        value = def;
   *      }
   *    }
   *  };
   *
   * @author: Marcelo Juchem <marcelo@fb.com>
   */
  template <typename TProcess, typename... Args>
  auto split_step(value_type delimiter, TProcess &&process, Args &&...args)
    -> decltype(process(std::declval<Range>(), std::forward<Args>(args)...))
  { return process(split_step(delimiter), std::forward<Args>(args)...); }

  template <typename TProcess, typename... Args>
  auto split_step(Range delimiter, TProcess &&process, Args &&...args)
    -> decltype(process(std::declval<Range>(), std::forward<Args>(args)...))
  { return process(split_step(delimiter), std::forward<Args>(args)...); }

private:
  Iter b_, e_;
};

template <class Iter>
const typename Range<Iter>::size_type Range<Iter>::npos = std::string::npos;

template <class Iter>
void swap(Range<Iter>& lhs, Range<Iter>& rhs) {
  lhs.swap(rhs);
}

/**
 * Create a range from two iterators, with type deduction.
 */
template <class Iter>
constexpr Range<Iter> range(Iter first, Iter last) {
  return Range<Iter>(first, last);
}

/*
 * Creates a range to reference the contents of a contiguous-storage container.
 */
// Use pointers for types with '.data()' member
template <
    class Collection,
    class T = typename std::remove_pointer<
        decltype(std::declval<Collection>().data())>::type>
constexpr Range<T*> range(Collection&& v) {
  return Range<T*>(v.data(), v.data() + v.size());
}

template <class T, size_t n>
constexpr Range<T*> range(T (&array)[n]) {
  return Range<T*>(array, array + n);
}

template <class T, size_t n>
constexpr Range<const T*> range(const std::array<T, n>& array) {
  return Range<const T*>{array};
}

typedef Range<const char*> StringPiece;
typedef Range<char*> MutableStringPiece;
typedef Range<const unsigned char*> ByteRange;
typedef Range<unsigned char*> MutableByteRange;

inline std::ostream& operator<<(std::ostream& os,
                                const StringPiece piece) {
  os.write(piece.start(), std::streamsize(piece.size()));
  return os;
}

inline std::ostream& operator<<(std::ostream& os,
                                const MutableStringPiece piece) {
  os.write(piece.start(), std::streamsize(piece.size()));
  return os;
}

/**
 * Templated comparison operators
 */

template <class Iter>
inline bool operator==(const Range<Iter>& lhs, const Range<Iter>& rhs) {
  return lhs.size() == rhs.size() && lhs.compare(rhs) == 0;
}

template <class Iter>
inline bool operator<(const Range<Iter>& lhs, const Range<Iter>& rhs) {
  return lhs.compare(rhs) < 0;
}

/**
 * Specializations of comparison operators for StringPiece
 */

namespace detail {

template <class A, class B>
struct ComparableAsStringPiece {
  enum {
    value =
    (std::is_convertible<A, StringPiece>::value
     && std::is_same<B, StringPiece>::value)
    ||
    (std::is_convertible<B, StringPiece>::value
     && std::is_same<A, StringPiece>::value)
  };
};

} // namespace detail

/**
 * operator== through conversion for Range<const char*>
 */
template <class T, class U>
typename
std::enable_if<detail::ComparableAsStringPiece<T, U>::value, bool>::type
operator==(const T& lhs, const U& rhs) {
  return StringPiece(lhs) == StringPiece(rhs);
}

/**
 * operator< through conversion for Range<const char*>
 */
template <class T, class U>
typename
std::enable_if<detail::ComparableAsStringPiece<T, U>::value, bool>::type
operator<(const T& lhs, const U& rhs) {
  return StringPiece(lhs) < StringPiece(rhs);
}

/**
 * operator> through conversion for Range<const char*>
 */
template <class T, class U>
typename
std::enable_if<detail::ComparableAsStringPiece<T, U>::value, bool>::type
operator>(const T& lhs, const U& rhs) {
  return StringPiece(lhs) > StringPiece(rhs);
}

/**
 * operator< through conversion for Range<const char*>
 */
template <class T, class U>
typename
std::enable_if<detail::ComparableAsStringPiece<T, U>::value, bool>::type
operator<=(const T& lhs, const U& rhs) {
  return StringPiece(lhs) <= StringPiece(rhs);
}

/**
 * operator> through conversion for Range<const char*>
 */
template <class T, class U>
typename
std::enable_if<detail::ComparableAsStringPiece<T, U>::value, bool>::type
operator>=(const T& lhs, const U& rhs) {
  return StringPiece(lhs) >= StringPiece(rhs);
}

/**
 * Finds substrings faster than brute force by borrowing from Boyer-Moore
 */
template <class Iter, class Comp>
size_t qfind(const Range<Iter>& haystack,
             const Range<Iter>& needle,
             Comp eq) {
  // Don't use std::search, use a Boyer-Moore-like trick by comparing
  // the last characters first
  auto const nsize = needle.size();
  if (haystack.size() < nsize) {
    return std::string::npos;
  }
  if (!nsize) return 0;
  auto const nsize_1 = nsize - 1;
  auto const lastNeedle = needle[nsize_1];

  // Boyer-Moore skip value for the last char in the needle. Zero is
  // not a valid value; skip will be computed the first time it's
  // needed.
  std::string::size_type skip = 0;

  auto i = haystack.begin();
  auto iEnd = haystack.end() - nsize_1;

  while (i < iEnd) {
    // Boyer-Moore: match the last element in the needle
    while (!eq(i[nsize_1], lastNeedle)) {
      if (++i == iEnd) {
        // not found
        return std::string::npos;
      }
    }
    // Here we know that the last char matches
    // Continue in pedestrian mode
    for (size_t j = 0; ; ) {
      assert(j < nsize);
      if (!eq(i[j], needle[j])) {
        // Not found, we can skip
        // Compute the skip value lazily
        if (skip == 0) {
          skip = 1;
          while (skip <= nsize_1 && !eq(needle[nsize_1 - skip], lastNeedle)) {
            ++skip;
          }
        }
        i += skip;
        break;
      }
      // Check if done searching
      if (++j == nsize) {
        // Yay
        return size_t(i - haystack.begin());
      }
    }
  }
  return std::string::npos;
}

namespace detail {

inline size_t qfind_first_byte_of(const StringPiece haystack,
                                  const StringPiece needles) {
  static auto const qfind_first_byte_of_fn =
    folly::CpuId().sse42() ? qfind_first_byte_of_sse42
                           : qfind_first_byte_of_nosse;
  return qfind_first_byte_of_fn(haystack, needles);
}

} // namespace detail

template <class Iter, class Comp>
size_t qfind_first_of(const Range<Iter> & haystack,
                      const Range<Iter> & needles,
                      Comp eq) {
  auto ret = std::find_first_of(haystack.begin(), haystack.end(),
                                needles.begin(), needles.end(),
                                eq);
  return ret == haystack.end() ? std::string::npos : ret - haystack.begin();
}

struct AsciiCaseSensitive {
  bool operator()(char lhs, char rhs) const {
    return lhs == rhs;
  }
};

/**
 * Check if two ascii characters are case insensitive equal.
 * The difference between the lower/upper case characters are the 6-th bit.
 * We also check they are alpha chars, in case of xor = 32.
 */
struct AsciiCaseInsensitive {
  bool operator()(char lhs, char rhs) const {
    char k = lhs ^ rhs;
    if (k == 0) return true;
    if (k != 32) return false;
    k = lhs | rhs;
    return (k >= 'a' && k <= 'z');
  }
};

template <class Iter>
size_t qfind(const Range<Iter>& haystack,
             const typename Range<Iter>::value_type& needle) {
  auto pos = std::find(haystack.begin(), haystack.end(), needle);
  return pos == haystack.end() ? std::string::npos : pos - haystack.data();
}

template <class Iter>
size_t rfind(const Range<Iter>& haystack,
             const typename Range<Iter>::value_type& needle) {
  for (auto i = haystack.size(); i-- > 0; ) {
    if (haystack[i] == needle) {
      return i;
    }
  }
  return std::string::npos;
}

// specialization for StringPiece
template <>
inline size_t qfind(const Range<const char*>& haystack, const char& needle) {
  // memchr expects a not-null pointer, early return if the range is empty.
  if (haystack.empty()) {
    return std::string::npos;
  }
  auto pos = static_cast<const char*>(
    ::memchr(haystack.data(), needle, haystack.size()));
  return pos == nullptr ? std::string::npos : pos - haystack.data();
}

template <>
inline size_t rfind(const Range<const char*>& haystack, const char& needle) {
  // memchr expects a not-null pointer, early return if the range is empty.
  if (haystack.empty()) {
    return std::string::npos;
  }
  auto pos = static_cast<const char*>(
    ::memrchr(haystack.data(), needle, haystack.size()));
  return pos == nullptr ? std::string::npos : pos - haystack.data();
}

// specialization for ByteRange
template <>
inline size_t qfind(const Range<const unsigned char*>& haystack,
                    const unsigned char& needle) {
  // memchr expects a not-null pointer, early return if the range is empty.
  if (haystack.empty()) {
    return std::string::npos;
  }
  auto pos = static_cast<const unsigned char*>(
    ::memchr(haystack.data(), needle, haystack.size()));
  return pos == nullptr ? std::string::npos : pos - haystack.data();
}

template <>
inline size_t rfind(const Range<const unsigned char*>& haystack,
                    const unsigned char& needle) {
  // memchr expects a not-null pointer, early return if the range is empty.
  if (haystack.empty()) {
    return std::string::npos;
  }
  auto pos = static_cast<const unsigned char*>(
    ::memrchr(haystack.data(), needle, haystack.size()));
  return pos == nullptr ? std::string::npos : pos - haystack.data();
}

template <class Iter>
size_t qfind_first_of(const Range<Iter>& haystack,
                      const Range<Iter>& needles) {
  return qfind_first_of(haystack, needles, AsciiCaseSensitive());
}

// specialization for StringPiece
template <>
inline size_t qfind_first_of(const Range<const char*>& haystack,
                             const Range<const char*>& needles) {
  return detail::qfind_first_byte_of(haystack, needles);
}

// specialization for ByteRange
template <>
inline size_t qfind_first_of(const Range<const unsigned char*>& haystack,
                             const Range<const unsigned char*>& needles) {
  return detail::qfind_first_byte_of(StringPiece(haystack),
                                     StringPiece(needles));
}

template<class Key, class Enable>
struct hasher;

template <class T>
struct hasher<folly::Range<T*>,
              typename std::enable_if<std::is_pod<T>::value, void>::type> {
  size_t operator()(folly::Range<T*> r) const {
    return hash::SpookyHashV2::Hash64(r.begin(), r.size() * sizeof(T), 0);
  }
};

/**
 * Ubiquitous helper template for knowing what's a string
 */
template <class T> struct IsSomeString {
  enum { value = std::is_same<T, std::string>::value
         || std::is_same<T, fbstring>::value };
};

}  // !namespace folly

#pragma GCC diagnostic pop

FOLLY_ASSUME_FBVECTOR_COMPATIBLE_1(folly::Range);
