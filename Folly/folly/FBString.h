/*
 * Copyright 2011-present Facebook, Inc.
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

// @author: Andrei Alexandrescu (aalexandre)
// String type.

#pragma once

#include <atomic>
#include <cstddef>
#include <iosfwd>
#include <limits>
#include <stdexcept>
#include <type_traits>

// This file appears in two locations: inside fbcode and in the
// libstdc++ source code (when embedding fbstring as std::string).
// To aid in this schizophrenic use, _LIBSTDCXX_FBSTRING is defined in
// libstdc++'s c++config.h, to gate use inside fbcode v. libstdc++.
#ifdef _LIBSTDCXX_FBSTRING

#pragma GCC system_header

#include <basic_fbstring_malloc.h> // @manual

// When used as std::string replacement always disable assertions.
#define FBSTRING_ASSERT(expr) /* empty */

#else // !_LIBSTDCXX_FBSTRING

#include <folly/CppAttributes.h>
#include <folly/Portability.h>

// libc++ doesn't provide this header, nor does msvc
#if __has_include(<bits/c++config.h>)
#include <bits/c++config.h>
#endif

#include <algorithm>
#include <cassert>
#include <cstring>
#include <string>
#include <utility>

#include <folly/Traits.h>
#include <folly/hash/Hash.h>
#include <folly/lang/Exception.h>
#include <folly/memory/Malloc.h>

// When used in folly, assertions are not disabled.
#define FBSTRING_ASSERT(expr) assert(expr)

#endif

// We defined these here rather than including Likely.h to avoid
// redefinition errors when fbstring is imported into libstdc++.
#if defined(__GNUC__) && __GNUC__ >= 4
#define FBSTRING_LIKELY(x) (__builtin_expect((x), 1))
#define FBSTRING_UNLIKELY(x) (__builtin_expect((x), 0))
#else
#define FBSTRING_LIKELY(x) (x)
#define FBSTRING_UNLIKELY(x) (x)
#endif

FOLLY_PUSH_WARNING
// Ignore shadowing warnings within this file, so includers can use -Wshadow.
FOLLY_GNU_DISABLE_WARNING("-Wshadow")
// GCC 4.9 has a false positive in setSmallSize (probably
// https://gcc.gnu.org/bugzilla/show_bug.cgi?id=59124), disable
// compile-time array bound checking.
FOLLY_GNU_DISABLE_WARNING("-Warray-bounds")

// FBString cannot use throw when replacing std::string, though it may still
// use folly::throw_exception
// nolint
#define throw FOLLY_FBSTRING_MAY_NOT_USE_THROW

#ifdef _LIBSTDCXX_FBSTRING
#define FOLLY_FBSTRING_BEGIN_NAMESPACE         \
  namespace std _GLIBCXX_VISIBILITY(default) { \
    _GLIBCXX_BEGIN_NAMESPACE_VERSION
#define FOLLY_FBSTRING_END_NAMESPACE \
  _GLIBCXX_END_NAMESPACE_VERSION     \
  } // namespace std
#else
#define FOLLY_FBSTRING_BEGIN_NAMESPACE namespace folly {
#define FOLLY_FBSTRING_END_NAMESPACE } // namespace folly
#endif

FOLLY_FBSTRING_BEGIN_NAMESPACE

#if defined(__clang__)
#if __has_feature(address_sanitizer)
#define FBSTRING_SANITIZE_ADDRESS
#endif
#elif defined(__GNUC__) &&                                             \
    (((__GNUC__ == 4) && (__GNUC_MINOR__ >= 8)) || (__GNUC__ >= 5)) && \
    __SANITIZE_ADDRESS__
#define FBSTRING_SANITIZE_ADDRESS
#endif

// When compiling with ASan, always heap-allocate the string even if
// it would fit in-situ, so that ASan can detect access to the string
// buffer after it has been invalidated (destroyed, resized, etc.).
// Note that this flag doesn't remove support for in-situ strings, as
// that would break ABI-compatibility and wouldn't allow linking code
// compiled with this flag with code compiled without.
#ifdef FBSTRING_SANITIZE_ADDRESS
#define FBSTRING_DISABLE_SSO true
#else
#define FBSTRING_DISABLE_SSO false
#endif

namespace fbstring_detail {

template <class InIt, class OutIt>
inline std::pair<InIt, OutIt> copy_n(
    InIt b,
    typename std::iterator_traits<InIt>::difference_type n,
    OutIt d) {
  for (; n != 0; --n, ++b, ++d) {
    *d = *b;
  }
  return std::make_pair(b, d);
}

template <class Pod, class T>
inline void podFill(Pod* b, Pod* e, T c) {
  FBSTRING_ASSERT(b && e && b <= e);
  constexpr auto kUseMemset = sizeof(T) == 1;
  if /* constexpr */ (kUseMemset) {
    memset(b, c, size_t(e - b));
  } else {
    auto const ee = b + ((e - b) & ~7u);
    for (; b != ee; b += 8) {
      b[0] = c;
      b[1] = c;
      b[2] = c;
      b[3] = c;
      b[4] = c;
      b[5] = c;
      b[6] = c;
      b[7] = c;
    }
    // Leftovers
    for (; b != e; ++b) {
      *b = c;
    }
  }
}

/*
 * Lightly structured memcpy, simplifies copying PODs and introduces
 * some asserts. Unfortunately using this function may cause
 * measurable overhead (presumably because it adjusts from a begin/end
 * convention to a pointer/size convention, so it does some extra
 * arithmetic even though the caller might have done the inverse
 * adaptation outside).
 */
template <class Pod>
inline void podCopy(const Pod* b, const Pod* e, Pod* d) {
  FBSTRING_ASSERT(b != nullptr);
  FBSTRING_ASSERT(e != nullptr);
  FBSTRING_ASSERT(d != nullptr);
  FBSTRING_ASSERT(e >= b);
  FBSTRING_ASSERT(d >= e || d + (e - b) <= b);
  memcpy(d, b, (e - b) * sizeof(Pod));
}

/*
 * Lightly structured memmove, simplifies copying PODs and introduces
 * some asserts
 */
template <class Pod>
inline void podMove(const Pod* b, const Pod* e, Pod* d) {
  FBSTRING_ASSERT(e >= b);
  memmove(d, b, (e - b) * sizeof(*b));
}

// always inline
#if defined(__GNUC__) // Clang also defines __GNUC__
#define FBSTRING_ALWAYS_INLINE inline __attribute__((__always_inline__))
#elif defined(_MSC_VER)
#define FBSTRING_ALWAYS_INLINE __forceinline
#else
#define FBSTRING_ALWAYS_INLINE inline
#endif

[[noreturn]] FBSTRING_ALWAYS_INLINE void assume_unreachable() {
#if defined(__GNUC__) // Clang also defines __GNUC__
  __builtin_unreachable();
#elif defined(_MSC_VER)
  __assume(0);
#else
  // Well, it's better than nothing.
  std::abort();
#endif
}

} // namespace fbstring_detail

/**
 * Defines a special acquisition method for constructing fbstring
 * objects. AcquireMallocatedString means that the user passes a
 * pointer to a malloc-allocated string that the fbstring object will
 * take into custody.
 */
enum class AcquireMallocatedString {};

/*
 * fbstring_core_model is a mock-up type that defines all required
 * signatures of a fbstring core. The fbstring class itself uses such
 * a core object to implement all of the numerous member functions
 * required by the standard.
 *
 * If you want to define a new core, copy the definition below and
 * implement the primitives. Then plug the core into basic_fbstring as
 * a template argument.

template <class Char>
class fbstring_core_model {
 public:
  fbstring_core_model();
  fbstring_core_model(const fbstring_core_model &);
  ~fbstring_core_model();
  // Returns a pointer to string's buffer (currently only contiguous
  // strings are supported). The pointer is guaranteed to be valid
  // until the next call to a non-const member function.
  const Char * data() const;
  // Much like data(), except the string is prepared to support
  // character-level changes. This call is a signal for
  // e.g. reference-counted implementation to fork the data. The
  // pointer is guaranteed to be valid until the next call to a
  // non-const member function.
  Char* mutableData();
  // Returns a pointer to string's buffer and guarantees that a
  // readable '\0' lies right after the buffer. The pointer is
  // guaranteed to be valid until the next call to a non-const member
  // function.
  const Char * c_str() const;
  // Shrinks the string by delta characters. Asserts that delta <=
  // size().
  void shrink(size_t delta);
  // Expands the string by delta characters (i.e. after this call
  // size() will report the old size() plus delta) but without
  // initializing the expanded region. The expanded region is
  // zero-terminated. Returns a pointer to the memory to be
  // initialized (the beginning of the expanded portion). The caller
  // is expected to fill the expanded area appropriately.
  // If expGrowth is true, exponential growth is guaranteed.
  // It is not guaranteed not to reallocate even if size() + delta <
  // capacity(), so all references to the buffer are invalidated.
  Char* expandNoinit(size_t delta, bool expGrowth);
  // Expands the string by one character and sets the last character
  // to c.
  void push_back(Char c);
  // Returns the string's size.
  size_t size() const;
  // Returns the string's capacity, i.e. maximum size that the string
  // can grow to without reallocation. Note that for reference counted
  // strings that's technically a lie - even assigning characters
  // within the existing size would cause a reallocation.
  size_t capacity() const;
  // Returns true if the data underlying the string is actually shared
  // across multiple strings (in a refcounted fashion).
  bool isShared() const;
  // Makes sure that at least minCapacity characters are available for
  // the string without reallocation. For reference-counted strings,
  // it should fork the data even if minCapacity < size().
  void reserve(size_t minCapacity);
 private:
  // Do not implement
  fbstring_core_model& operator=(const fbstring_core_model &);
};
*/

/**
 * This is the core of the string. The code should work on 32- and
 * 64-bit and both big- and little-endianan architectures with any
 * Char size.
 *
 * The storage is selected as follows (assuming we store one-byte
 * characters on a 64-bit machine): (a) "small" strings between 0 and
 * 23 chars are stored in-situ without allocation (the rightmost byte
 * stores the size); (b) "medium" strings from 24 through 254 chars
 * are stored in malloc-allocated memory that is copied eagerly; (c)
 * "large" strings of 255 chars and above are stored in a similar
 * structure as medium arrays, except that the string is
 * reference-counted and copied lazily. the reference count is
 * allocated right before the character array.
 *
 * The discriminator between these three strategies sits in two
 * bits of the rightmost char of the storage:
 * - If neither is set, then the string is small. Its length is represented by
 *   the lower-order bits on little-endian or the high-order bits on big-endian
 *   of that rightmost character. The value of these six bits is
 *   `maxSmallSize - size`, so this quantity must be subtracted from
 *   `maxSmallSize` to compute the `size` of the string (see `smallSize()`).
 *   This scheme ensures that when `size == `maxSmallSize`, the last byte in the
 *   storage is \0. This way, storage will be a null-terminated sequence of
 *   bytes, even if all 23 bytes of data are used on a 64-bit architecture.
 *   This enables `c_str()` and `data()` to simply return a pointer to the
 *   storage.
 *
 * - If the MSb is set, the string is medium width.
 *
 * - If the second MSb is set, then the string is large. On little-endian,
 *   these 2 bits are the 2 MSbs of MediumLarge::capacity_, while on
 *   big-endian, these 2 bits are the 2 LSbs. This keeps both little-endian
 *   and big-endian fbstring_core equivalent with merely different ops used
 *   to extract capacity/category.
 */
template <class Char>
class fbstring_core {
 protected:
// It's MSVC, so we just have to guess ... and allow an override
#ifdef _MSC_VER
#ifdef FOLLY_ENDIAN_BE
  static constexpr auto kIsLittleEndian = false;
#else
  static constexpr auto kIsLittleEndian = true;
#endif
#else
  static constexpr auto kIsLittleEndian =
      __BYTE_ORDER__ == __ORDER_LITTLE_ENDIAN__;
#endif
 public:
  fbstring_core() noexcept {
    reset();
  }

  fbstring_core(const fbstring_core& rhs) {
    FBSTRING_ASSERT(&rhs != this);
    switch (rhs.category()) {
      case Category::isSmall:
        copySmall(rhs);
        break;
      case Category::isMedium:
        copyMedium(rhs);
        break;
      case Category::isLarge:
        copyLarge(rhs);
        break;
      default:
        fbstring_detail::assume_unreachable();
    }
    FBSTRING_ASSERT(size() == rhs.size());
    FBSTRING_ASSERT(memcmp(data(), rhs.data(), size() * sizeof(Char)) == 0);
  }

  fbstring_core(fbstring_core&& goner) noexcept {
    // Take goner's guts
    ml_ = goner.ml_;
    // Clean goner's carcass
    goner.reset();
  }

  fbstring_core(
      const Char* const data,
      const size_t size,
      bool disableSSO = FBSTRING_DISABLE_SSO) {
    if (!disableSSO && size <= maxSmallSize) {
      initSmall(data, size);
    } else if (size <= maxMediumSize) {
      initMedium(data, size);
    } else {
      initLarge(data, size);
    }
    FBSTRING_ASSERT(this->size() == size);
    FBSTRING_ASSERT(
        size == 0 || memcmp(this->data(), data, size * sizeof(Char)) == 0);
  }

  ~fbstring_core() noexcept {
    if (category() == Category::isSmall) {
      return;
    }
    destroyMediumLarge();
  }

  // Snatches a previously mallocated string. The parameter "size"
  // is the size of the string, and the parameter "allocatedSize"
  // is the size of the mallocated block.  The string must be
  // \0-terminated, so allocatedSize >= size + 1 and data[size] == '\0'.
  //
  // So if you want a 2-character string, pass malloc(3) as "data",
  // pass 2 as "size", and pass 3 as "allocatedSize".
  fbstring_core(
      Char* const data,
      const size_t size,
      const size_t allocatedSize,
      AcquireMallocatedString) {
    if (size > 0) {
      FBSTRING_ASSERT(allocatedSize >= size + 1);
      FBSTRING_ASSERT(data[size] == '\0');
      // Use the medium string storage
      ml_.data_ = data;
      ml_.size_ = size;
      // Don't forget about null terminator
      ml_.setCapacity(allocatedSize - 1, Category::isMedium);
    } else {
      // No need for the memory
      free(data);
      reset();
    }
  }

  // swap below doesn't test whether &rhs == this (and instead
  // potentially does extra work) on the premise that the rarity of
  // that situation actually makes the check more expensive than is
  // worth.
  void swap(fbstring_core& rhs) {
    auto const t = ml_;
    ml_ = rhs.ml_;
    rhs.ml_ = t;
  }

  // In C++11 data() and c_str() are 100% equivalent.
  const Char* data() const {
    return c_str();
  }

  Char* mutableData() {
    switch (category()) {
      case Category::isSmall:
        return small_;
      case Category::isMedium:
        return ml_.data_;
      case Category::isLarge:
        return mutableDataLarge();
    }
    fbstring_detail::assume_unreachable();
  }

  const Char* c_str() const {
    const Char* ptr = ml_.data_;
    // With this syntax, GCC and Clang generate a CMOV instead of a branch.
    ptr = (category() == Category::isSmall) ? small_ : ptr;
    return ptr;
  }

  void shrink(const size_t delta) {
    if (category() == Category::isSmall) {
      shrinkSmall(delta);
    } else if (
        category() == Category::isMedium || RefCounted::refs(ml_.data_) == 1) {
      shrinkMedium(delta);
    } else {
      shrinkLarge(delta);
    }
  }

  FOLLY_MALLOC_NOINLINE
  void reserve(size_t minCapacity, bool disableSSO = FBSTRING_DISABLE_SSO) {
    switch (category()) {
      case Category::isSmall:
        reserveSmall(minCapacity, disableSSO);
        break;
      case Category::isMedium:
        reserveMedium(minCapacity);
        break;
      case Category::isLarge:
        reserveLarge(minCapacity);
        break;
      default:
        fbstring_detail::assume_unreachable();
    }
    FBSTRING_ASSERT(capacity() >= minCapacity);
  }

  Char* expandNoinit(
      const size_t delta,
      bool expGrowth = false,
      bool disableSSO = FBSTRING_DISABLE_SSO);

  void push_back(Char c) {
    *expandNoinit(1, /* expGrowth = */ true) = c;
  }

  size_t size() const {
    size_t ret = ml_.size_;
    if /* constexpr */ (kIsLittleEndian) {
      // We can save a couple instructions, because the category is
      // small iff the last char, as unsigned, is <= maxSmallSize.
      typedef typename std::make_unsigned<Char>::type UChar;
      auto maybeSmallSize = size_t(maxSmallSize) -
          size_t(static_cast<UChar>(small_[maxSmallSize]));
      // With this syntax, GCC and Clang generate a CMOV instead of a branch.
      ret = (static_cast<ssize_t>(maybeSmallSize) >= 0) ? maybeSmallSize : ret;
    } else {
      ret = (category() == Category::isSmall) ? smallSize() : ret;
    }
    return ret;
  }

  size_t capacity() const {
    switch (category()) {
      case Category::isSmall:
        return maxSmallSize;
      case Category::isLarge:
        // For large-sized strings, a multi-referenced chunk has no
        // available capacity. This is because any attempt to append
        // data would trigger a new allocation.
        if (RefCounted::refs(ml_.data_) > 1) {
          return ml_.size_;
        }
        break;
      default:
        break;
    }
    return ml_.capacity();
  }

  bool isShared() const {
    return category() == Category::isLarge && RefCounted::refs(ml_.data_) > 1;
  }

 private:
  // Disabled
  fbstring_core& operator=(const fbstring_core& rhs);

  void reset() {
    setSmallSize(0);
  }

  FOLLY_MALLOC_NOINLINE void destroyMediumLarge() noexcept {
    auto const c = category();
    FBSTRING_ASSERT(c != Category::isSmall);
    if (c == Category::isMedium) {
      free(ml_.data_);
    } else {
      RefCounted::decrementRefs(ml_.data_);
    }
  }

  struct RefCounted {
    std::atomic<size_t> refCount_;
    Char data_[1];

    constexpr static size_t getDataOffset() {
      return offsetof(RefCounted, data_);
    }

    static RefCounted* fromData(Char* p) {
      return static_cast<RefCounted*>(static_cast<void*>(
          static_cast<unsigned char*>(static_cast<void*>(p)) -
          getDataOffset()));
    }

    static size_t refs(Char* p) {
      return fromData(p)->refCount_.load(std::memory_order_acquire);
    }

    static void incrementRefs(Char* p) {
      fromData(p)->refCount_.fetch_add(1, std::memory_order_acq_rel);
    }

    static void decrementRefs(Char* p) {
      auto const dis = fromData(p);
      size_t oldcnt = dis->refCount_.fetch_sub(1, std::memory_order_acq_rel);
      FBSTRING_ASSERT(oldcnt > 0);
      if (oldcnt == 1) {
        free(dis);
      }
    }

    static RefCounted* create(size_t* size) {
      const size_t allocSize =
          goodMallocSize(getDataOffset() + (*size + 1) * sizeof(Char));
      auto result = static_cast<RefCounted*>(checkedMalloc(allocSize));
      result->refCount_.store(1, std::memory_order_release);
      *size = (allocSize - getDataOffset()) / sizeof(Char) - 1;
      return result;
    }

    static RefCounted* create(const Char* data, size_t* size) {
      const size_t effectiveSize = *size;
      auto result = create(size);
      if (FBSTRING_LIKELY(effectiveSize > 0)) {
        fbstring_detail::podCopy(data, data + effectiveSize, result->data_);
      }
      return result;
    }

    static RefCounted* reallocate(
        Char* const data,
        const size_t currentSize,
        const size_t currentCapacity,
        size_t* newCapacity) {
      FBSTRING_ASSERT(*newCapacity > 0 && *newCapacity > currentSize);
      const size_t allocNewCapacity =
          goodMallocSize(getDataOffset() + (*newCapacity + 1) * sizeof(Char));
      auto const dis = fromData(data);
      FBSTRING_ASSERT(dis->refCount_.load(std::memory_order_acquire) == 1);
      auto result = static_cast<RefCounted*>(smartRealloc(
          dis,
          getDataOffset() + (currentSize + 1) * sizeof(Char),
          getDataOffset() + (currentCapacity + 1) * sizeof(Char),
          allocNewCapacity));
      FBSTRING_ASSERT(result->refCount_.load(std::memory_order_acquire) == 1);
      *newCapacity = (allocNewCapacity - getDataOffset()) / sizeof(Char) - 1;
      return result;
    }
  };

  typedef uint8_t category_type;

  enum class Category : category_type {
    isSmall = 0,
    isMedium = kIsLittleEndian ? 0x80 : 0x2,
    isLarge = kIsLittleEndian ? 0x40 : 0x1,
  };

  Category category() const {
    // works for both big-endian and little-endian
    return static_cast<Category>(bytes_[lastChar] & categoryExtractMask);
  }

  struct MediumLarge {
    Char* data_;
    size_t size_;
    size_t capacity_;

    size_t capacity() const {
      return kIsLittleEndian ? capacity_ & capacityExtractMask : capacity_ >> 2;
    }

    void setCapacity(size_t cap, Category cat) {
      capacity_ = kIsLittleEndian
          ? cap | (static_cast<size_t>(cat) << kCategoryShift)
          : (cap << 2) | static_cast<size_t>(cat);
    }
  };

  union {
    uint8_t bytes_[sizeof(MediumLarge)]; // For accessing the last byte.
    Char small_[sizeof(MediumLarge) / sizeof(Char)];
    MediumLarge ml_;
  };

  constexpr static size_t lastChar = sizeof(MediumLarge) - 1;
  constexpr static size_t maxSmallSize = lastChar / sizeof(Char);
  constexpr static size_t maxMediumSize = 254 / sizeof(Char);
  constexpr static uint8_t categoryExtractMask = kIsLittleEndian ? 0xC0 : 0x3;
  constexpr static size_t kCategoryShift = (sizeof(size_t) - 1) * 8;
  constexpr static size_t capacityExtractMask = kIsLittleEndian
      ? ~(size_t(categoryExtractMask) << kCategoryShift)
      : 0x0 /* unused */;

  static_assert(
      !(sizeof(MediumLarge) % sizeof(Char)),
      "Corrupt memory layout for fbstring.");

  size_t smallSize() const {
    FBSTRING_ASSERT(category() == Category::isSmall);
    constexpr auto shift = kIsLittleEndian ? 0 : 2;
    auto smallShifted = static_cast<size_t>(small_[maxSmallSize]) >> shift;
    FBSTRING_ASSERT(static_cast<size_t>(maxSmallSize) >= smallShifted);
    return static_cast<size_t>(maxSmallSize) - smallShifted;
  }

  void setSmallSize(size_t s) {
    // Warning: this should work with uninitialized strings too,
    // so don't assume anything about the previous value of
    // small_[maxSmallSize].
    FBSTRING_ASSERT(s <= maxSmallSize);
    constexpr auto shift = kIsLittleEndian ? 0 : 2;
    small_[maxSmallSize] = char((maxSmallSize - s) << shift);
    small_[s] = '\0';
    FBSTRING_ASSERT(category() == Category::isSmall && size() == s);
  }

  void copySmall(const fbstring_core&);
  void copyMedium(const fbstring_core&);
  void copyLarge(const fbstring_core&);

  void initSmall(const Char* data, size_t size);
  void initMedium(const Char* data, size_t size);
  void initLarge(const Char* data, size_t size);

  void reserveSmall(size_t minCapacity, bool disableSSO);
  void reserveMedium(size_t minCapacity);
  void reserveLarge(size_t minCapacity);

  void shrinkSmall(size_t delta);
  void shrinkMedium(size_t delta);
  void shrinkLarge(size_t delta);

  void unshare(size_t minCapacity = 0);
  Char* mutableDataLarge();
};

template <class Char>
inline void fbstring_core<Char>::copySmall(const fbstring_core& rhs) {
  static_assert(offsetof(MediumLarge, data_) == 0, "fbstring layout failure");
  static_assert(
      offsetof(MediumLarge, size_) == sizeof(ml_.data_),
      "fbstring layout failure");
  static_assert(
      offsetof(MediumLarge, capacity_) == 2 * sizeof(ml_.data_),
      "fbstring layout failure");
  // Just write the whole thing, don't look at details. In
  // particular we need to copy capacity anyway because we want
  // to set the size (don't forget that the last character,
  // which stores a short string's length, is shared with the
  // ml_.capacity field).
  ml_ = rhs.ml_;
  FBSTRING_ASSERT(
      category() == Category::isSmall && this->size() == rhs.size());
}

template <class Char>
FOLLY_MALLOC_NOINLINE inline void fbstring_core<Char>::copyMedium(
    const fbstring_core& rhs) {
  // Medium strings are copied eagerly. Don't forget to allocate
  // one extra Char for the null terminator.
  auto const allocSize = goodMallocSize((1 + rhs.ml_.size_) * sizeof(Char));
  ml_.data_ = static_cast<Char*>(checkedMalloc(allocSize));
  // Also copies terminator.
  fbstring_detail::podCopy(
      rhs.ml_.data_, rhs.ml_.data_ + rhs.ml_.size_ + 1, ml_.data_);
  ml_.size_ = rhs.ml_.size_;
  ml_.setCapacity(allocSize / sizeof(Char) - 1, Category::isMedium);
  FBSTRING_ASSERT(category() == Category::isMedium);
}

template <class Char>
FOLLY_MALLOC_NOINLINE inline void fbstring_core<Char>::copyLarge(
    const fbstring_core& rhs) {
  // Large strings are just refcounted
  ml_ = rhs.ml_;
  RefCounted::incrementRefs(ml_.data_);
  FBSTRING_ASSERT(category() == Category::isLarge && size() == rhs.size());
}

// Small strings are bitblitted
template <class Char>
inline void fbstring_core<Char>::initSmall(
    const Char* const data,
    const size_t size) {
  // Layout is: Char* data_, size_t size_, size_t capacity_
  static_assert(
      sizeof(*this) == sizeof(Char*) + 2 * sizeof(size_t),
      "fbstring has unexpected size");
  static_assert(
      sizeof(Char*) == sizeof(size_t), "fbstring size assumption violation");
  // sizeof(size_t) must be a power of 2
  static_assert(
      (sizeof(size_t) & (sizeof(size_t) - 1)) == 0,
      "fbstring size assumption violation");

// If data is aligned, use fast word-wise copying. Otherwise,
// use conservative memcpy.
// The word-wise path reads bytes which are outside the range of
// the string, and makes ASan unhappy, so we disable it when
// compiling with ASan.
#ifndef FBSTRING_SANITIZE_ADDRESS
  if ((reinterpret_cast<size_t>(data) & (sizeof(size_t) - 1)) == 0) {
    const size_t byteSize = size * sizeof(Char);
    constexpr size_t wordWidth = sizeof(size_t);
    switch ((byteSize + wordWidth - 1) / wordWidth) { // Number of words.
      case 3:
        ml_.capacity_ = reinterpret_cast<const size_t*>(data)[2];
        FOLLY_FALLTHROUGH;
      case 2:
        ml_.size_ = reinterpret_cast<const size_t*>(data)[1];
        FOLLY_FALLTHROUGH;
      case 1:
        ml_.data_ = *reinterpret_cast<Char**>(const_cast<Char*>(data));
        FOLLY_FALLTHROUGH;
      case 0:
        break;
    }
  } else
#endif
  {
    if (size != 0) {
      fbstring_detail::podCopy(data, data + size, small_);
    }
  }
  setSmallSize(size);
}

template <class Char>
FOLLY_MALLOC_NOINLINE inline void fbstring_core<Char>::initMedium(
    const Char* const data,
    const size_t size) {
  // Medium strings are allocated normally. Don't forget to
  // allocate one extra Char for the terminating null.
  auto const allocSize = goodMallocSize((1 + size) * sizeof(Char));
  ml_.data_ = static_cast<Char*>(checkedMalloc(allocSize));
  if (FBSTRING_LIKELY(size > 0)) {
    fbstring_detail::podCopy(data, data + size, ml_.data_);
  }
  ml_.size_ = size;
  ml_.setCapacity(allocSize / sizeof(Char) - 1, Category::isMedium);
  ml_.data_[size] = '\0';
}

template <class Char>
FOLLY_MALLOC_NOINLINE inline void fbstring_core<Char>::initLarge(
    const Char* const data,
    const size_t size) {
  // Large strings are allocated differently
  size_t effectiveCapacity = size;
  auto const newRC = RefCounted::create(data, &effectiveCapacity);
  ml_.data_ = newRC->data_;
  ml_.size_ = size;
  ml_.setCapacity(effectiveCapacity, Category::isLarge);
  ml_.data_[size] = '\0';
}

template <class Char>
FOLLY_MALLOC_NOINLINE inline void fbstring_core<Char>::unshare(
    size_t minCapacity) {
  FBSTRING_ASSERT(category() == Category::isLarge);
  size_t effectiveCapacity = std::max(minCapacity, ml_.capacity());
  auto const newRC = RefCounted::create(&effectiveCapacity);
  // If this fails, someone placed the wrong capacity in an
  // fbstring.
  FBSTRING_ASSERT(effectiveCapacity >= ml_.capacity());
  // Also copies terminator.
  fbstring_detail::podCopy(ml_.data_, ml_.data_ + ml_.size_ + 1, newRC->data_);
  RefCounted::decrementRefs(ml_.data_);
  ml_.data_ = newRC->data_;
  ml_.setCapacity(effectiveCapacity, Category::isLarge);
  // size_ remains unchanged.
}

template <class Char>
inline Char* fbstring_core<Char>::mutableDataLarge() {
  FBSTRING_ASSERT(category() == Category::isLarge);
  if (RefCounted::refs(ml_.data_) > 1) { // Ensure unique.
    unshare();
  }
  return ml_.data_;
}

template <class Char>
FOLLY_MALLOC_NOINLINE inline void fbstring_core<Char>::reserveLarge(
    size_t minCapacity) {
  FBSTRING_ASSERT(category() == Category::isLarge);
  if (RefCounted::refs(ml_.data_) > 1) { // Ensure unique
    // We must make it unique regardless; in-place reallocation is
    // useless if the string is shared. In order to not surprise
    // people, reserve the new block at current capacity or
    // more. That way, a string's capacity never shrinks after a
    // call to reserve.
    unshare(minCapacity);
  } else {
    // String is not shared, so let's try to realloc (if needed)
    if (minCapacity > ml_.capacity()) {
      // Asking for more memory
      auto const newRC = RefCounted::reallocate(
          ml_.data_, ml_.size_, ml_.capacity(), &minCapacity);
      ml_.data_ = newRC->data_;
      ml_.setCapacity(minCapacity, Category::isLarge);
    }
    FBSTRING_ASSERT(capacity() >= minCapacity);
  }
}

template <class Char>
FOLLY_MALLOC_NOINLINE inline void fbstring_core<Char>::reserveMedium(
    const size_t minCapacity) {
  FBSTRING_ASSERT(category() == Category::isMedium);
  // String is not shared
  if (minCapacity <= ml_.capacity()) {
    return; // nothing to do, there's enough room
  }
  if (minCapacity <= maxMediumSize) {
    // Keep the string at medium size. Don't forget to allocate
    // one extra Char for the terminating null.
    size_t capacityBytes = goodMallocSize((1 + minCapacity) * sizeof(Char));
    // Also copies terminator.
    ml_.data_ = static_cast<Char*>(smartRealloc(
        ml_.data_,
        (ml_.size_ + 1) * sizeof(Char),
        (ml_.capacity() + 1) * sizeof(Char),
        capacityBytes));
    ml_.setCapacity(capacityBytes / sizeof(Char) - 1, Category::isMedium);
  } else {
    // Conversion from medium to large string
    fbstring_core nascent;
    // Will recurse to another branch of this function
    nascent.reserve(minCapacity);
    nascent.ml_.size_ = ml_.size_;
    // Also copies terminator.
    fbstring_detail::podCopy(
        ml_.data_, ml_.data_ + ml_.size_ + 1, nascent.ml_.data_);
    nascent.swap(*this);
    FBSTRING_ASSERT(capacity() >= minCapacity);
  }
}

template <class Char>
FOLLY_MALLOC_NOINLINE inline void fbstring_core<Char>::reserveSmall(
    size_t minCapacity,
    const bool disableSSO) {
  FBSTRING_ASSERT(category() == Category::isSmall);
  if (!disableSSO && minCapacity <= maxSmallSize) {
    // small
    // Nothing to do, everything stays put
  } else if (minCapacity <= maxMediumSize) {
    // medium
    // Don't forget to allocate one extra Char for the terminating null
    auto const allocSizeBytes =
        goodMallocSize((1 + minCapacity) * sizeof(Char));
    auto const pData = static_cast<Char*>(checkedMalloc(allocSizeBytes));
    auto const size = smallSize();
    // Also copies terminator.
    fbstring_detail::podCopy(small_, small_ + size + 1, pData);
    ml_.data_ = pData;
    ml_.size_ = size;
    ml_.setCapacity(allocSizeBytes / sizeof(Char) - 1, Category::isMedium);
  } else {
    // large
    auto const newRC = RefCounted::create(&minCapacity);
    auto const size = smallSize();
    // Also copies terminator.
    fbstring_detail::podCopy(small_, small_ + size + 1, newRC->data_);
    ml_.data_ = newRC->data_;
    ml_.size_ = size;
    ml_.setCapacity(minCapacity, Category::isLarge);
    FBSTRING_ASSERT(capacity() >= minCapacity);
  }
}

template <class Char>
inline Char* fbstring_core<Char>::expandNoinit(
    const size_t delta,
    bool expGrowth, /* = false */
    bool disableSSO /* = FBSTRING_DISABLE_SSO */) {
  // Strategy is simple: make room, then change size
  FBSTRING_ASSERT(capacity() >= size());
  size_t sz, newSz;
  if (category() == Category::isSmall) {
    sz = smallSize();
    newSz = sz + delta;
    if (!disableSSO && FBSTRING_LIKELY(newSz <= maxSmallSize)) {
      setSmallSize(newSz);
      return small_ + sz;
    }
    reserveSmall(
        expGrowth ? std::max(newSz, 2 * maxSmallSize) : newSz, disableSSO);
  } else {
    sz = ml_.size_;
    newSz = sz + delta;
    if (FBSTRING_UNLIKELY(newSz > capacity())) {
      // ensures not shared
      reserve(expGrowth ? std::max(newSz, 1 + capacity() * 3 / 2) : newSz);
    }
  }
  FBSTRING_ASSERT(capacity() >= newSz);
  // Category can't be small - we took care of that above
  FBSTRING_ASSERT(
      category() == Category::isMedium || category() == Category::isLarge);
  ml_.size_ = newSz;
  ml_.data_[newSz] = '\0';
  FBSTRING_ASSERT(size() == newSz);
  return ml_.data_ + sz;
}

template <class Char>
inline void fbstring_core<Char>::shrinkSmall(const size_t delta) {
  // Check for underflow
  FBSTRING_ASSERT(delta <= smallSize());
  setSmallSize(smallSize() - delta);
}

template <class Char>
inline void fbstring_core<Char>::shrinkMedium(const size_t delta) {
  // Medium strings and unique large strings need no special
  // handling.
  FBSTRING_ASSERT(ml_.size_ >= delta);
  ml_.size_ -= delta;
  ml_.data_[ml_.size_] = '\0';
}

template <class Char>
inline void fbstring_core<Char>::shrinkLarge(const size_t delta) {
  FBSTRING_ASSERT(ml_.size_ >= delta);
  // Shared large string, must make unique. This is because of the
  // durn terminator must be written, which may trample the shared
  // data.
  if (delta) {
    fbstring_core(ml_.data_, ml_.size_ - delta).swap(*this);
  }
  // No need to write the terminator.
}

#ifndef _LIBSTDCXX_FBSTRING
/**
 * Dummy fbstring core that uses an actual std::string. This doesn't
 * make any sense - it's just for testing purposes.
 */
template <class Char>
class dummy_fbstring_core {
 public:
  dummy_fbstring_core() {}
  dummy_fbstring_core(const dummy_fbstring_core& another)
      : backend_(another.backend_) {}
  dummy_fbstring_core(const Char* s, size_t n) : backend_(s, n) {}
  void swap(dummy_fbstring_core& rhs) {
    backend_.swap(rhs.backend_);
  }
  const Char* data() const {
    return backend_.data();
  }
  Char* mutableData() {
    return const_cast<Char*>(backend_.data());
  }
  void shrink(size_t delta) {
    FBSTRING_ASSERT(delta <= size());
    backend_.resize(size() - delta);
  }
  Char* expandNoinit(size_t delta) {
    auto const sz = size();
    backend_.resize(size() + delta);
    return backend_.data() + sz;
  }
  void push_back(Char c) {
    backend_.push_back(c);
  }
  size_t size() const {
    return backend_.size();
  }
  size_t capacity() const {
    return backend_.capacity();
  }
  bool isShared() const {
    return false;
  }
  void reserve(size_t minCapacity) {
    backend_.reserve(minCapacity);
  }

 private:
  std::basic_string<Char> backend_;
};
#endif // !_LIBSTDCXX_FBSTRING

/**
 * This is the basic_string replacement. For conformity,
 * basic_fbstring takes the same template parameters, plus the last
 * one which is the core.
 */
#ifdef _LIBSTDCXX_FBSTRING
template <typename E, class T, class A, class Storage>
#else
template <
    typename E,
    class T = std::char_traits<E>,
    class A = std::allocator<E>,
    class Storage = fbstring_core<E>>
#endif
class basic_fbstring {
  template <typename Ex, typename... Args>
  FOLLY_ALWAYS_INLINE static void enforce(bool condition, Args&&... args) {
    if (!condition) {
      throw_exception<Ex>(static_cast<Args&&>(args)...);
    }
  }

  bool isSane() const {
    return begin() <= end() && empty() == (size() == 0) &&
        empty() == (begin() == end()) && size() <= max_size() &&
        capacity() <= max_size() && size() <= capacity() &&
        begin()[size()] == '\0';
  }

  struct Invariant {
    Invariant& operator=(const Invariant&) = delete;
    explicit Invariant(const basic_fbstring& s) noexcept : s_(s) {
      FBSTRING_ASSERT(s_.isSane());
    }
    ~Invariant() noexcept {
      FBSTRING_ASSERT(s_.isSane());
    }

   private:
    const basic_fbstring& s_;
  };

 public:
  // types
  typedef T traits_type;
  typedef typename traits_type::char_type value_type;
  typedef A allocator_type;
  typedef typename A::size_type size_type;
  typedef typename A::difference_type difference_type;

  typedef typename A::reference reference;
  typedef typename A::const_reference const_reference;
  typedef typename A::pointer pointer;
  typedef typename A::const_pointer const_pointer;

  typedef E* iterator;
  typedef const E* const_iterator;
  typedef std::reverse_iterator<iterator> reverse_iterator;
  typedef std::reverse_iterator<const_iterator> const_reverse_iterator;

  static constexpr size_type npos = size_type(-1);
  typedef std::true_type IsRelocatable;

 private:
  static void procrustes(size_type& n, size_type nmax) {
    if (n > nmax) {
      n = nmax;
    }
  }

  static size_type traitsLength(const value_type* s);

 public:
  // C++11 21.4.2 construct/copy/destroy

  // Note: while the following two constructors can be (and previously were)
  // collapsed into one constructor written this way:
  //
  //   explicit basic_fbstring(const A& a = A()) noexcept { }
  //
  // This can cause Clang (at least version 3.7) to fail with the error:
  //   "chosen constructor is explicit in copy-initialization ...
  //   in implicit initialization of field '(x)' with omitted initializer"
  //
  // if used in a struct which is default-initialized.  Hence the split into
  // these two separate constructors.

  basic_fbstring() noexcept : basic_fbstring(A()) {}

  explicit basic_fbstring(const A&) noexcept {}

  basic_fbstring(const basic_fbstring& str) : store_(str.store_) {}

  // Move constructor
  basic_fbstring(basic_fbstring&& goner) noexcept
      : store_(std::move(goner.store_)) {}

#ifndef _LIBSTDCXX_FBSTRING
  // This is defined for compatibility with std::string
  template <typename A2>
  /* implicit */ basic_fbstring(const std::basic_string<E, T, A2>& str)
      : store_(str.data(), str.size()) {}
#endif

  basic_fbstring(
      const basic_fbstring& str,
      size_type pos,
      size_type n = npos,
      const A& /* a */ = A()) {
    assign(str, pos, n);
  }

  FOLLY_MALLOC_NOINLINE
  /* implicit */ basic_fbstring(const value_type* s, const A& /*a*/ = A())
      : store_(s, traitsLength(s)) {}

  FOLLY_MALLOC_NOINLINE
  basic_fbstring(const value_type* s, size_type n, const A& /*a*/ = A())
      : store_(s, n) {}

  FOLLY_MALLOC_NOINLINE
  basic_fbstring(size_type n, value_type c, const A& /*a*/ = A()) {
    auto const pData = store_.expandNoinit(n);
    fbstring_detail::podFill(pData, pData + n, c);
  }

  template <class InIt>
  FOLLY_MALLOC_NOINLINE basic_fbstring(
      InIt begin,
      InIt end,
      typename std::enable_if<
          !std::is_same<InIt, value_type*>::value,
          const A>::type& /*a*/
      = A()) {
    assign(begin, end);
  }

  // Specialization for const char*, const char*
  FOLLY_MALLOC_NOINLINE
  basic_fbstring(const value_type* b, const value_type* e, const A& /*a*/ = A())
      : store_(b, size_type(e - b)) {}

  // Nonstandard constructor
  basic_fbstring(
      value_type* s,
      size_type n,
      size_type c,
      AcquireMallocatedString a)
      : store_(s, n, c, a) {}

  // Construction from initialization list
  FOLLY_MALLOC_NOINLINE
  basic_fbstring(std::initializer_list<value_type> il) {
    assign(il.begin(), il.end());
  }

  ~basic_fbstring() noexcept {}

  basic_fbstring& operator=(const basic_fbstring& lhs);

  // Move assignment
  basic_fbstring& operator=(basic_fbstring&& goner) noexcept;

#ifndef _LIBSTDCXX_FBSTRING
  // Compatibility with std::string
  template <typename A2>
  basic_fbstring& operator=(const std::basic_string<E, T, A2>& rhs) {
    return assign(rhs.data(), rhs.size());
  }

  // Compatibility with std::string
  std::basic_string<E, T, A> toStdString() const {
    return std::basic_string<E, T, A>(data(), size());
  }
#else
  // A lot of code in fbcode still uses this method, so keep it here for now.
  const basic_fbstring& toStdString() const {
    return *this;
  }
#endif

  basic_fbstring& operator=(const value_type* s) {
    return assign(s);
  }

  // This actually goes directly against the C++ spec, but the
  // value_type overload is dangerous, so we're explicitly deleting
  // any overloads of operator= that could implicitly convert to
  // value_type.
  // Note that we do need to explicitly specify the template types because
  // otherwise MSVC 2017 will aggressively pre-resolve value_type to
  // traits_type::char_type, which won't compare as equal when determining
  // which overload the implementation is referring to.
  // Also note that MSVC 2015 Update 3 requires us to explicitly specify the
  // namespace in-which to search for basic_fbstring, otherwise it tries to
  // look for basic_fbstring::basic_fbstring, which is just plain wrong.
  template <typename TP>
  typename std::enable_if<
      std::is_same<
          typename std::decay<TP>::type,
          typename folly::basic_fbstring<E, T, A, Storage>::value_type>::value,
      basic_fbstring<E, T, A, Storage>&>::type
  operator=(TP c);

  basic_fbstring& operator=(std::initializer_list<value_type> il) {
    return assign(il.begin(), il.end());
  }

  // C++11 21.4.3 iterators:
  iterator begin() {
    return store_.mutableData();
  }

  const_iterator begin() const {
    return store_.data();
  }

  const_iterator cbegin() const {
    return begin();
  }

  iterator end() {
    return store_.mutableData() + store_.size();
  }

  const_iterator end() const {
    return store_.data() + store_.size();
  }

  const_iterator cend() const {
    return end();
  }

  reverse_iterator rbegin() {
    return reverse_iterator(end());
  }

  const_reverse_iterator rbegin() const {
    return const_reverse_iterator(end());
  }

  const_reverse_iterator crbegin() const {
    return rbegin();
  }

  reverse_iterator rend() {
    return reverse_iterator(begin());
  }

  const_reverse_iterator rend() const {
    return const_reverse_iterator(begin());
  }

  const_reverse_iterator crend() const {
    return rend();
  }

  // Added by C++11
  // C++11 21.4.5, element access:
  const value_type& front() const {
    return *begin();
  }
  const value_type& back() const {
    FBSTRING_ASSERT(!empty());
    // Should be begin()[size() - 1], but that branches twice
    return *(end() - 1);
  }
  value_type& front() {
    return *begin();
  }
  value_type& back() {
    FBSTRING_ASSERT(!empty());
    // Should be begin()[size() - 1], but that branches twice
    return *(end() - 1);
  }
  void pop_back() {
    FBSTRING_ASSERT(!empty());
    store_.shrink(1);
  }

  // C++11 21.4.4 capacity:
  size_type size() const {
    return store_.size();
  }

  size_type length() const {
    return size();
  }

  size_type max_size() const {
    return std::numeric_limits<size_type>::max();
  }

  void resize(size_type n, value_type c = value_type());

  size_type capacity() const {
    return store_.capacity();
  }

  void reserve(size_type res_arg = 0) {
    enforce<std::length_error>(res_arg <= max_size(), "");
    store_.reserve(res_arg);
  }

  void shrink_to_fit() {
    // Shrink only if slack memory is sufficiently large
    if (capacity() < size() * 3 / 2) {
      return;
    }
    basic_fbstring(cbegin(), cend()).swap(*this);
  }

  void clear() {
    resize(0);
  }

  bool empty() const {
    return size() == 0;
  }

  // C++11 21.4.5 element access:
  const_reference operator[](size_type pos) const {
    return *(begin() + pos);
  }

  reference operator[](size_type pos) {
    return *(begin() + pos);
  }

  const_reference at(size_type n) const {
    enforce<std::out_of_range>(n < size(), "");
    return (*this)[n];
  }

  reference at(size_type n) {
    enforce<std::out_of_range>(n < size(), "");
    return (*this)[n];
  }

  // C++11 21.4.6 modifiers:
  basic_fbstring& operator+=(const basic_fbstring& str) {
    return append(str);
  }

  basic_fbstring& operator+=(const value_type* s) {
    return append(s);
  }

  basic_fbstring& operator+=(const value_type c) {
    push_back(c);
    return *this;
  }

  basic_fbstring& operator+=(std::initializer_list<value_type> il) {
    append(il);
    return *this;
  }

  basic_fbstring& append(const basic_fbstring& str);

  basic_fbstring&
  append(const basic_fbstring& str, const size_type pos, size_type n);

  basic_fbstring& append(const value_type* s, size_type n);

  basic_fbstring& append(const value_type* s) {
    return append(s, traitsLength(s));
  }

  basic_fbstring& append(size_type n, value_type c);

  template <class InputIterator>
  basic_fbstring& append(InputIterator first, InputIterator last) {
    insert(end(), first, last);
    return *this;
  }

  basic_fbstring& append(std::initializer_list<value_type> il) {
    return append(il.begin(), il.end());
  }

  void push_back(const value_type c) { // primitive
    store_.push_back(c);
  }

  basic_fbstring& assign(const basic_fbstring& str) {
    if (&str == this) {
      return *this;
    }
    return assign(str.data(), str.size());
  }

  basic_fbstring& assign(basic_fbstring&& str) {
    return *this = std::move(str);
  }

  basic_fbstring&
  assign(const basic_fbstring& str, const size_type pos, size_type n);

  basic_fbstring& assign(const value_type* s, const size_type n);

  basic_fbstring& assign(const value_type* s) {
    return assign(s, traitsLength(s));
  }

  basic_fbstring& assign(std::initializer_list<value_type> il) {
    return assign(il.begin(), il.end());
  }

  template <class ItOrLength, class ItOrChar>
  basic_fbstring& assign(ItOrLength first_or_n, ItOrChar last_or_c) {
    return replace(begin(), end(), first_or_n, last_or_c);
  }

  basic_fbstring& insert(size_type pos1, const basic_fbstring& str) {
    return insert(pos1, str.data(), str.size());
  }

  basic_fbstring& insert(
      size_type pos1,
      const basic_fbstring& str,
      size_type pos2,
      size_type n) {
    enforce<std::out_of_range>(pos2 <= str.length(), "");
    procrustes(n, str.length() - pos2);
    return insert(pos1, str.data() + pos2, n);
  }

  basic_fbstring& insert(size_type pos, const value_type* s, size_type n) {
    enforce<std::out_of_range>(pos <= length(), "");
    insert(begin() + pos, s, s + n);
    return *this;
  }

  basic_fbstring& insert(size_type pos, const value_type* s) {
    return insert(pos, s, traitsLength(s));
  }

  basic_fbstring& insert(size_type pos, size_type n, value_type c) {
    enforce<std::out_of_range>(pos <= length(), "");
    insert(begin() + pos, n, c);
    return *this;
  }

  iterator insert(const_iterator p, const value_type c) {
    const size_type pos = p - cbegin();
    insert(p, 1, c);
    return begin() + pos;
  }

#ifndef _LIBSTDCXX_FBSTRING
 private:
  typedef std::basic_istream<value_type, traits_type> istream_type;
  istream_type& getlineImpl(istream_type& is, value_type delim);

 public:
  friend inline istream_type&
  getline(istream_type& is, basic_fbstring& str, value_type delim) {
    return str.getlineImpl(is, delim);
  }

  friend inline istream_type& getline(istream_type& is, basic_fbstring& str) {
    return getline(is, str, '\n');
  }
#endif

 private:
  iterator
  insertImplDiscr(const_iterator i, size_type n, value_type c, std::true_type);

  template <class InputIter>
  iterator
  insertImplDiscr(const_iterator i, InputIter b, InputIter e, std::false_type);

  template <class FwdIterator>
  iterator insertImpl(
      const_iterator i,
      FwdIterator s1,
      FwdIterator s2,
      std::forward_iterator_tag);

  template <class InputIterator>
  iterator insertImpl(
      const_iterator i,
      InputIterator b,
      InputIterator e,
      std::input_iterator_tag);

 public:
  template <class ItOrLength, class ItOrChar>
  iterator insert(const_iterator p, ItOrLength first_or_n, ItOrChar last_or_c) {
    using Sel = bool_constant<std::numeric_limits<ItOrLength>::is_specialized>;
    return insertImplDiscr(p, first_or_n, last_or_c, Sel());
  }

  iterator insert(const_iterator p, std::initializer_list<value_type> il) {
    return insert(p, il.begin(), il.end());
  }

  basic_fbstring& erase(size_type pos = 0, size_type n = npos) {
    Invariant checker(*this);

    enforce<std::out_of_range>(pos <= length(), "");
    procrustes(n, length() - pos);
    std::copy(begin() + pos + n, end(), begin() + pos);
    resize(length() - n);
    return *this;
  }

  iterator erase(iterator position) {
    const size_type pos(position - begin());
    enforce<std::out_of_range>(pos <= size(), "");
    erase(pos, 1);
    return begin() + pos;
  }

  iterator erase(iterator first, iterator last) {
    const size_type pos(first - begin());
    erase(pos, last - first);
    return begin() + pos;
  }

  // Replaces at most n1 chars of *this, starting with pos1 with the
  // content of str
  basic_fbstring&
  replace(size_type pos1, size_type n1, const basic_fbstring& str) {
    return replace(pos1, n1, str.data(), str.size());
  }

  // Replaces at most n1 chars of *this, starting with pos1,
  // with at most n2 chars of str starting with pos2
  basic_fbstring& replace(
      size_type pos1,
      size_type n1,
      const basic_fbstring& str,
      size_type pos2,
      size_type n2) {
    enforce<std::out_of_range>(pos2 <= str.length(), "");
    return replace(
        pos1, n1, str.data() + pos2, std::min(n2, str.size() - pos2));
  }

  // Replaces at most n1 chars of *this, starting with pos, with chars from s
  basic_fbstring& replace(size_type pos, size_type n1, const value_type* s) {
    return replace(pos, n1, s, traitsLength(s));
  }

  // Replaces at most n1 chars of *this, starting with pos, with n2
  // occurrences of c
  //
  // consolidated with
  //
  // Replaces at most n1 chars of *this, starting with pos, with at
  // most n2 chars of str.  str must have at least n2 chars.
  template <class StrOrLength, class NumOrChar>
  basic_fbstring&
  replace(size_type pos, size_type n1, StrOrLength s_or_n2, NumOrChar n_or_c) {
    Invariant checker(*this);

    enforce<std::out_of_range>(pos <= size(), "");
    procrustes(n1, length() - pos);
    const iterator b = begin() + pos;
    return replace(b, b + n1, s_or_n2, n_or_c);
  }

  basic_fbstring& replace(iterator i1, iterator i2, const basic_fbstring& str) {
    return replace(i1, i2, str.data(), str.length());
  }

  basic_fbstring& replace(iterator i1, iterator i2, const value_type* s) {
    return replace(i1, i2, s, traitsLength(s));
  }

 private:
  basic_fbstring& replaceImplDiscr(
      iterator i1,
      iterator i2,
      const value_type* s,
      size_type n,
      std::integral_constant<int, 2>);

  basic_fbstring& replaceImplDiscr(
      iterator i1,
      iterator i2,
      size_type n2,
      value_type c,
      std::integral_constant<int, 1>);

  template <class InputIter>
  basic_fbstring& replaceImplDiscr(
      iterator i1,
      iterator i2,
      InputIter b,
      InputIter e,
      std::integral_constant<int, 0>);

 private:
  template <class FwdIterator>
  bool replaceAliased(
      iterator /* i1 */,
      iterator /* i2 */,
      FwdIterator /* s1 */,
      FwdIterator /* s2 */,
      std::false_type) {
    return false;
  }

  template <class FwdIterator>
  bool replaceAliased(
      iterator i1,
      iterator i2,
      FwdIterator s1,
      FwdIterator s2,
      std::true_type);

  template <class FwdIterator>
  void replaceImpl(
      iterator i1,
      iterator i2,
      FwdIterator s1,
      FwdIterator s2,
      std::forward_iterator_tag);

  template <class InputIterator>
  void replaceImpl(
      iterator i1,
      iterator i2,
      InputIterator b,
      InputIterator e,
      std::input_iterator_tag);

 public:
  template <class T1, class T2>
  basic_fbstring&
  replace(iterator i1, iterator i2, T1 first_or_n_or_s, T2 last_or_c_or_n) {
    constexpr bool num1 = std::numeric_limits<T1>::is_specialized,
                   num2 = std::numeric_limits<T2>::is_specialized;
    using Sel =
        std::integral_constant<int, num1 ? (num2 ? 1 : -1) : (num2 ? 2 : 0)>;
    return replaceImplDiscr(i1, i2, first_or_n_or_s, last_or_c_or_n, Sel());
  }

  size_type copy(value_type* s, size_type n, size_type pos = 0) const {
    enforce<std::out_of_range>(pos <= size(), "");
    procrustes(n, size() - pos);

    if (n != 0) {
      fbstring_detail::podCopy(data() + pos, data() + pos + n, s);
    }
    return n;
  }

  void swap(basic_fbstring& rhs) {
    store_.swap(rhs.store_);
  }

  const value_type* c_str() const {
    return store_.c_str();
  }

  const value_type* data() const {
    return c_str();
  }

  allocator_type get_allocator() const {
    return allocator_type();
  }

  size_type find(const basic_fbstring& str, size_type pos = 0) const {
    return find(str.data(), pos, str.length());
  }

  size_type find(const value_type* needle, size_type pos, size_type nsize)
      const;

  size_type find(const value_type* s, size_type pos = 0) const {
    return find(s, pos, traitsLength(s));
  }

  size_type find(value_type c, size_type pos = 0) const {
    return find(&c, pos, 1);
  }

  size_type rfind(const basic_fbstring& str, size_type pos = npos) const {
    return rfind(str.data(), pos, str.length());
  }

  size_type rfind(const value_type* s, size_type pos, size_type n) const;

  size_type rfind(const value_type* s, size_type pos = npos) const {
    return rfind(s, pos, traitsLength(s));
  }

  size_type rfind(value_type c, size_type pos = npos) const {
    return rfind(&c, pos, 1);
  }

  size_type find_first_of(const basic_fbstring& str, size_type pos = 0) const {
    return find_first_of(str.data(), pos, str.length());
  }

  size_type find_first_of(const value_type* s, size_type pos, size_type n)
      const;

  size_type find_first_of(const value_type* s, size_type pos = 0) const {
    return find_first_of(s, pos, traitsLength(s));
  }

  size_type find_first_of(value_type c, size_type pos = 0) const {
    return find_first_of(&c, pos, 1);
  }

  size_type find_last_of(const basic_fbstring& str, size_type pos = npos)
      const {
    return find_last_of(str.data(), pos, str.length());
  }

  size_type find_last_of(const value_type* s, size_type pos, size_type n) const;

  size_type find_last_of(const value_type* s, size_type pos = npos) const {
    return find_last_of(s, pos, traitsLength(s));
  }

  size_type find_last_of(value_type c, size_type pos = npos) const {
    return find_last_of(&c, pos, 1);
  }

  size_type find_first_not_of(const basic_fbstring& str, size_type pos = 0)
      const {
    return find_first_not_of(str.data(), pos, str.size());
  }

  size_type find_first_not_of(const value_type* s, size_type pos, size_type n)
      const;

  size_type find_first_not_of(const value_type* s, size_type pos = 0) const {
    return find_first_not_of(s, pos, traitsLength(s));
  }

  size_type find_first_not_of(value_type c, size_type pos = 0) const {
    return find_first_not_of(&c, pos, 1);
  }

  size_type find_last_not_of(const basic_fbstring& str, size_type pos = npos)
      const {
    return find_last_not_of(str.data(), pos, str.length());
  }

  size_type find_last_not_of(const value_type* s, size_type pos, size_type n)
      const;

  size_type find_last_not_of(const value_type* s, size_type pos = npos) const {
    return find_last_not_of(s, pos, traitsLength(s));
  }

  size_type find_last_not_of(value_type c, size_type pos = npos) const {
    return find_last_not_of(&c, pos, 1);
  }

  basic_fbstring substr(size_type pos = 0, size_type n = npos) const& {
    enforce<std::out_of_range>(pos <= size(), "");
    return basic_fbstring(data() + pos, std::min(n, size() - pos));
  }

  basic_fbstring substr(size_type pos = 0, size_type n = npos) && {
    enforce<std::out_of_range>(pos <= size(), "");
    erase(0, pos);
    if (n < size()) {
      resize(n);
    }
    return std::move(*this);
  }

  int compare(const basic_fbstring& str) const {
    // FIX due to Goncalo N M de Carvalho July 18, 2005
    return compare(0, size(), str);
  }

  int compare(size_type pos1, size_type n1, const basic_fbstring& str) const {
    return compare(pos1, n1, str.data(), str.size());
  }

  int compare(size_type pos1, size_type n1, const value_type* s) const {
    return compare(pos1, n1, s, traitsLength(s));
  }

  int compare(size_type pos1, size_type n1, const value_type* s, size_type n2)
      const {
    enforce<std::out_of_range>(pos1 <= size(), "");
    procrustes(n1, size() - pos1);
    // The line below fixed by Jean-Francois Bastien, 04-23-2007. Thanks!
    const int r = traits_type::compare(pos1 + data(), s, std::min(n1, n2));
    return r != 0 ? r : n1 > n2 ? 1 : n1 < n2 ? -1 : 0;
  }

  int compare(
      size_type pos1,
      size_type n1,
      const basic_fbstring& str,
      size_type pos2,
      size_type n2) const {
    enforce<std::out_of_range>(pos2 <= str.size(), "");
    return compare(
        pos1, n1, str.data() + pos2, std::min(n2, str.size() - pos2));
  }

  // Code from Jean-Francois Bastien (03/26/2007)
  int compare(const value_type* s) const {
    // Could forward to compare(0, size(), s, traitsLength(s))
    // but that does two extra checks
    const size_type n1(size()), n2(traitsLength(s));
    const int r = traits_type::compare(data(), s, std::min(n1, n2));
    return r != 0 ? r : n1 > n2 ? 1 : n1 < n2 ? -1 : 0;
  }

 private:
  // Data
  Storage store_;
};

template <typename E, class T, class A, class S>
FOLLY_MALLOC_NOINLINE inline typename basic_fbstring<E, T, A, S>::size_type
basic_fbstring<E, T, A, S>::traitsLength(const value_type* s) {
  return s ? traits_type::length(s)
           : (throw_exception<std::logic_error>(
                  "basic_fbstring: null pointer initializer not valid"),
              0);
}

template <typename E, class T, class A, class S>
inline basic_fbstring<E, T, A, S>& basic_fbstring<E, T, A, S>::operator=(
    const basic_fbstring& lhs) {
  Invariant checker(*this);

  if (FBSTRING_UNLIKELY(&lhs == this)) {
    return *this;
  }

  return assign(lhs.data(), lhs.size());
}

// Move assignment
template <typename E, class T, class A, class S>
inline basic_fbstring<E, T, A, S>& basic_fbstring<E, T, A, S>::operator=(
    basic_fbstring&& goner) noexcept {
  if (FBSTRING_UNLIKELY(&goner == this)) {
    // Compatibility with std::basic_string<>,
    // C++11 21.4.2 [string.cons] / 23 requires self-move-assignment support.
    return *this;
  }
  // No need of this anymore
  this->~basic_fbstring();
  // Move the goner into this
  new (&store_) S(std::move(goner.store_));
  return *this;
}

template <typename E, class T, class A, class S>
template <typename TP>
inline typename std::enable_if<
    std::is_same<
        typename std::decay<TP>::type,
        typename folly::basic_fbstring<E, T, A, S>::value_type>::value,
    basic_fbstring<E, T, A, S>&>::type
basic_fbstring<E, T, A, S>::operator=(TP c) {
  Invariant checker(*this);

  if (empty()) {
    store_.expandNoinit(1);
  } else if (store_.isShared()) {
    basic_fbstring(1, c).swap(*this);
    return *this;
  } else {
    store_.shrink(size() - 1);
  }
  front() = c;
  return *this;
}

template <typename E, class T, class A, class S>
inline void basic_fbstring<E, T, A, S>::resize(
    const size_type n,
    const value_type c /*= value_type()*/) {
  Invariant checker(*this);

  auto size = this->size();
  if (n <= size) {
    store_.shrink(size - n);
  } else {
    auto const delta = n - size;
    auto pData = store_.expandNoinit(delta);
    fbstring_detail::podFill(pData, pData + delta, c);
  }
  FBSTRING_ASSERT(this->size() == n);
}

template <typename E, class T, class A, class S>
inline basic_fbstring<E, T, A, S>& basic_fbstring<E, T, A, S>::append(
    const basic_fbstring& str) {
#ifndef NDEBUG
  auto desiredSize = size() + str.size();
#endif
  append(str.data(), str.size());
  FBSTRING_ASSERT(size() == desiredSize);
  return *this;
}

template <typename E, class T, class A, class S>
inline basic_fbstring<E, T, A, S>& basic_fbstring<E, T, A, S>::append(
    const basic_fbstring& str,
    const size_type pos,
    size_type n) {
  const size_type sz = str.size();
  enforce<std::out_of_range>(pos <= sz, "");
  procrustes(n, sz - pos);
  return append(str.data() + pos, n);
}

template <typename E, class T, class A, class S>
FOLLY_MALLOC_NOINLINE inline basic_fbstring<E, T, A, S>&
basic_fbstring<E, T, A, S>::append(const value_type* s, size_type n) {
  Invariant checker(*this);

  if (FBSTRING_UNLIKELY(!n)) {
    // Unlikely but must be done
    return *this;
  }
  auto const oldSize = size();
  auto const oldData = data();
  auto pData = store_.expandNoinit(n, /* expGrowth = */ true);

  // Check for aliasing (rare). We could use "<=" here but in theory
  // those do not work for pointers unless the pointers point to
  // elements in the same array. For that reason we use
  // std::less_equal, which is guaranteed to offer a total order
  // over pointers. See discussion at http://goo.gl/Cy2ya for more
  // info.
  std::less_equal<const value_type*> le;
  if (FBSTRING_UNLIKELY(le(oldData, s) && !le(oldData + oldSize, s))) {
    FBSTRING_ASSERT(le(s + n, oldData + oldSize));
    // expandNoinit() could have moved the storage, restore the source.
    s = data() + (s - oldData);
    fbstring_detail::podMove(s, s + n, pData);
  } else {
    fbstring_detail::podCopy(s, s + n, pData);
  }

  FBSTRING_ASSERT(size() == oldSize + n);
  return *this;
}

template <typename E, class T, class A, class S>
inline basic_fbstring<E, T, A, S>& basic_fbstring<E, T, A, S>::append(
    size_type n,
    value_type c) {
  Invariant checker(*this);
  auto pData = store_.expandNoinit(n, /* expGrowth = */ true);
  fbstring_detail::podFill(pData, pData + n, c);
  return *this;
}

template <typename E, class T, class A, class S>
inline basic_fbstring<E, T, A, S>& basic_fbstring<E, T, A, S>::assign(
    const basic_fbstring& str,
    const size_type pos,
    size_type n) {
  const size_type sz = str.size();
  enforce<std::out_of_range>(pos <= sz, "");
  procrustes(n, sz - pos);
  return assign(str.data() + pos, n);
}

template <typename E, class T, class A, class S>
FOLLY_MALLOC_NOINLINE inline basic_fbstring<E, T, A, S>&
basic_fbstring<E, T, A, S>::assign(const value_type* s, const size_type n) {
  Invariant checker(*this);

  if (n == 0) {
    resize(0);
  } else if (size() >= n) {
    // s can alias this, we need to use podMove.
    fbstring_detail::podMove(s, s + n, store_.mutableData());
    store_.shrink(size() - n);
    FBSTRING_ASSERT(size() == n);
  } else {
    // If n is larger than size(), s cannot alias this string's
    // storage.
    resize(0);
    // Do not use exponential growth here: assign() should be tight,
    // to mirror the behavior of the equivalent constructor.
    fbstring_detail::podCopy(s, s + n, store_.expandNoinit(n));
  }

  FBSTRING_ASSERT(size() == n);
  return *this;
}

#ifndef _LIBSTDCXX_FBSTRING
template <typename E, class T, class A, class S>
inline typename basic_fbstring<E, T, A, S>::istream_type&
basic_fbstring<E, T, A, S>::getlineImpl(istream_type& is, value_type delim) {
  Invariant checker(*this);

  clear();
  size_t size = 0;
  while (true) {
    size_t avail = capacity() - size;
    // fbstring has 1 byte extra capacity for the null terminator,
    // and getline null-terminates the read string.
    is.getline(store_.expandNoinit(avail), avail + 1, delim);
    size += is.gcount();

    if (is.bad() || is.eof() || !is.fail()) {
      // Done by either failure, end of file, or normal read.
      if (!is.bad() && !is.eof()) {
        --size; // gcount() also accounts for the delimiter.
      }
      resize(size);
      break;
    }

    FBSTRING_ASSERT(size == this->size());
    FBSTRING_ASSERT(size == capacity());
    // Start at minimum allocation 63 + terminator = 64.
    reserve(std::max<size_t>(63, 3 * size / 2));
    // Clear the error so we can continue reading.
    is.clear();
  }
  return is;
}
#endif

template <typename E, class T, class A, class S>
inline typename basic_fbstring<E, T, A, S>::size_type
basic_fbstring<E, T, A, S>::find(
    const value_type* needle,
    const size_type pos,
    const size_type nsize) const {
  auto const size = this->size();
  // nsize + pos can overflow (eg pos == npos), guard against that by checking
  // that nsize + pos does not wrap around.
  if (nsize + pos > size || nsize + pos < pos) {
    return npos;
  }

  if (nsize == 0) {
    return pos;
  }
  // Don't use std::search, use a Boyer-Moore-like trick by comparing
  // the last characters first
  auto const haystack = data();
  auto const nsize_1 = nsize - 1;
  auto const lastNeedle = needle[nsize_1];

  // Boyer-Moore skip value for the last char in the needle. Zero is
  // not a valid value; skip will be computed the first time it's
  // needed.
  size_type skip = 0;

  const E* i = haystack + pos;
  auto iEnd = haystack + size - nsize_1;

  while (i < iEnd) {
    // Boyer-Moore: match the last element in the needle
    while (i[nsize_1] != lastNeedle) {
      if (++i == iEnd) {
        // not found
        return npos;
      }
    }
    // Here we know that the last char matches
    // Continue in pedestrian mode
    for (size_t j = 0;;) {
      FBSTRING_ASSERT(j < nsize);
      if (i[j] != needle[j]) {
        // Not found, we can skip
        // Compute the skip value lazily
        if (skip == 0) {
          skip = 1;
          while (skip <= nsize_1 && needle[nsize_1 - skip] != lastNeedle) {
            ++skip;
          }
        }
        i += skip;
        break;
      }
      // Check if done searching
      if (++j == nsize) {
        // Yay
        return i - haystack;
      }
    }
  }
  return npos;
}

template <typename E, class T, class A, class S>
inline typename basic_fbstring<E, T, A, S>::iterator
basic_fbstring<E, T, A, S>::insertImplDiscr(
    const_iterator i,
    size_type n,
    value_type c,
    std::true_type) {
  Invariant checker(*this);

  FBSTRING_ASSERT(i >= cbegin() && i <= cend());
  const size_type pos = i - cbegin();

  auto oldSize = size();
  store_.expandNoinit(n, /* expGrowth = */ true);
  auto b = begin();
  fbstring_detail::podMove(b + pos, b + oldSize, b + pos + n);
  fbstring_detail::podFill(b + pos, b + pos + n, c);

  return b + pos;
}

template <typename E, class T, class A, class S>
template <class InputIter>
inline typename basic_fbstring<E, T, A, S>::iterator
basic_fbstring<E, T, A, S>::insertImplDiscr(
    const_iterator i,
    InputIter b,
    InputIter e,
    std::false_type) {
  return insertImpl(
      i, b, e, typename std::iterator_traits<InputIter>::iterator_category());
}

template <typename E, class T, class A, class S>
template <class FwdIterator>
inline typename basic_fbstring<E, T, A, S>::iterator
basic_fbstring<E, T, A, S>::insertImpl(
    const_iterator i,
    FwdIterator s1,
    FwdIterator s2,
    std::forward_iterator_tag) {
  Invariant checker(*this);

  FBSTRING_ASSERT(i >= cbegin() && i <= cend());
  const size_type pos = i - cbegin();
  auto n = std::distance(s1, s2);
  FBSTRING_ASSERT(n >= 0);

  auto oldSize = size();
  store_.expandNoinit(n, /* expGrowth = */ true);
  auto b = begin();
  fbstring_detail::podMove(b + pos, b + oldSize, b + pos + n);
  std::copy(s1, s2, b + pos);

  return b + pos;
}

template <typename E, class T, class A, class S>
template <class InputIterator>
inline typename basic_fbstring<E, T, A, S>::iterator
basic_fbstring<E, T, A, S>::insertImpl(
    const_iterator i,
    InputIterator b,
    InputIterator e,
    std::input_iterator_tag) {
  const auto pos = i - cbegin();
  basic_fbstring temp(cbegin(), i);
  for (; b != e; ++b) {
    temp.push_back(*b);
  }
  temp.append(i, cend());
  swap(temp);
  return begin() + pos;
}

template <typename E, class T, class A, class S>
inline basic_fbstring<E, T, A, S>& basic_fbstring<E, T, A, S>::replaceImplDiscr(
    iterator i1,
    iterator i2,
    const value_type* s,
    size_type n,
    std::integral_constant<int, 2>) {
  FBSTRING_ASSERT(i1 <= i2);
  FBSTRING_ASSERT(begin() <= i1 && i1 <= end());
  FBSTRING_ASSERT(begin() <= i2 && i2 <= end());
  return replace(i1, i2, s, s + n);
}

template <typename E, class T, class A, class S>
inline basic_fbstring<E, T, A, S>& basic_fbstring<E, T, A, S>::replaceImplDiscr(
    iterator i1,
    iterator i2,
    size_type n2,
    value_type c,
    std::integral_constant<int, 1>) {
  const size_type n1 = i2 - i1;
  if (n1 > n2) {
    std::fill(i1, i1 + n2, c);
    erase(i1 + n2, i2);
  } else {
    std::fill(i1, i2, c);
    insert(i2, n2 - n1, c);
  }
  FBSTRING_ASSERT(isSane());
  return *this;
}

template <typename E, class T, class A, class S>
template <class InputIter>
inline basic_fbstring<E, T, A, S>& basic_fbstring<E, T, A, S>::replaceImplDiscr(
    iterator i1,
    iterator i2,
    InputIter b,
    InputIter e,
    std::integral_constant<int, 0>) {
  using Cat = typename std::iterator_traits<InputIter>::iterator_category;
  replaceImpl(i1, i2, b, e, Cat());
  return *this;
}

template <typename E, class T, class A, class S>
template <class FwdIterator>
inline bool basic_fbstring<E, T, A, S>::replaceAliased(
    iterator i1,
    iterator i2,
    FwdIterator s1,
    FwdIterator s2,
    std::true_type) {
  std::less_equal<const value_type*> le{};
  const bool aliased = le(&*begin(), &*s1) && le(&*s1, &*end());
  if (!aliased) {
    return false;
  }
  // Aliased replace, copy to new string
  basic_fbstring temp;
  temp.reserve(size() - (i2 - i1) + std::distance(s1, s2));
  temp.append(begin(), i1).append(s1, s2).append(i2, end());
  swap(temp);
  return true;
}

template <typename E, class T, class A, class S>
template <class FwdIterator>
inline void basic_fbstring<E, T, A, S>::replaceImpl(
    iterator i1,
    iterator i2,
    FwdIterator s1,
    FwdIterator s2,
    std::forward_iterator_tag) {
  Invariant checker(*this);

  // Handle aliased replace
  using Sel = bool_constant<
      std::is_same<FwdIterator, iterator>::value ||
      std::is_same<FwdIterator, const_iterator>::value>;
  if (replaceAliased(i1, i2, s1, s2, Sel())) {
    return;
  }

  auto const n1 = i2 - i1;
  FBSTRING_ASSERT(n1 >= 0);
  auto const n2 = std::distance(s1, s2);
  FBSTRING_ASSERT(n2 >= 0);

  if (n1 > n2) {
    // shrinks
    std::copy(s1, s2, i1);
    erase(i1 + n2, i2);
  } else {
    // grows
    s1 = fbstring_detail::copy_n(s1, n1, i1).first;
    insert(i2, s1, s2);
  }
  FBSTRING_ASSERT(isSane());
}

template <typename E, class T, class A, class S>
template <class InputIterator>
inline void basic_fbstring<E, T, A, S>::replaceImpl(
    iterator i1,
    iterator i2,
    InputIterator b,
    InputIterator e,
    std::input_iterator_tag) {
  basic_fbstring temp(begin(), i1);
  temp.append(b, e).append(i2, end());
  swap(temp);
}

template <typename E, class T, class A, class S>
inline typename basic_fbstring<E, T, A, S>::size_type
basic_fbstring<E, T, A, S>::rfind(
    const value_type* s,
    size_type pos,
    size_type n) const {
  if (n > length()) {
    return npos;
  }
  pos = std::min(pos, length() - n);
  if (n == 0) {
    return pos;
  }

  const_iterator i(begin() + pos);
  for (;; --i) {
    if (traits_type::eq(*i, *s) && traits_type::compare(&*i, s, n) == 0) {
      return i - begin();
    }
    if (i == begin()) {
      break;
    }
  }
  return npos;
}

template <typename E, class T, class A, class S>
inline typename basic_fbstring<E, T, A, S>::size_type
basic_fbstring<E, T, A, S>::find_first_of(
    const value_type* s,
    size_type pos,
    size_type n) const {
  if (pos > length() || n == 0) {
    return npos;
  }
  const_iterator i(begin() + pos), finish(end());
  for (; i != finish; ++i) {
    if (traits_type::find(s, n, *i) != nullptr) {
      return i - begin();
    }
  }
  return npos;
}

template <typename E, class T, class A, class S>
inline typename basic_fbstring<E, T, A, S>::size_type
basic_fbstring<E, T, A, S>::find_last_of(
    const value_type* s,
    size_type pos,
    size_type n) const {
  if (!empty() && n > 0) {
    pos = std::min(pos, length() - 1);
    const_iterator i(begin() + pos);
    for (;; --i) {
      if (traits_type::find(s, n, *i) != nullptr) {
        return i - begin();
      }
      if (i == begin()) {
        break;
      }
    }
  }
  return npos;
}

template <typename E, class T, class A, class S>
inline typename basic_fbstring<E, T, A, S>::size_type
basic_fbstring<E, T, A, S>::find_first_not_of(
    const value_type* s,
    size_type pos,
    size_type n) const {
  if (pos < length()) {
    const_iterator i(begin() + pos), finish(end());
    for (; i != finish; ++i) {
      if (traits_type::find(s, n, *i) == nullptr) {
        return i - begin();
      }
    }
  }
  return npos;
}

template <typename E, class T, class A, class S>
inline typename basic_fbstring<E, T, A, S>::size_type
basic_fbstring<E, T, A, S>::find_last_not_of(
    const value_type* s,
    size_type pos,
    size_type n) const {
  if (!this->empty()) {
    pos = std::min(pos, size() - 1);
    const_iterator i(begin() + pos);
    for (;; --i) {
      if (traits_type::find(s, n, *i) == nullptr) {
        return i - begin();
      }
      if (i == begin()) {
        break;
      }
    }
  }
  return npos;
}

// non-member functions
// C++11 21.4.8.1/1
template <typename E, class T, class A, class S>
inline basic_fbstring<E, T, A, S> operator+(
    const basic_fbstring<E, T, A, S>& lhs,
    const basic_fbstring<E, T, A, S>& rhs) {
  basic_fbstring<E, T, A, S> result;
  result.reserve(lhs.size() + rhs.size());
  result.append(lhs).append(rhs);
  return std::move(result);
}

// C++11 21.4.8.1/2
template <typename E, class T, class A, class S>
inline basic_fbstring<E, T, A, S> operator+(
    basic_fbstring<E, T, A, S>&& lhs,
    const basic_fbstring<E, T, A, S>& rhs) {
  return std::move(lhs.append(rhs));
}

// C++11 21.4.8.1/3
template <typename E, class T, class A, class S>
inline basic_fbstring<E, T, A, S> operator+(
    const basic_fbstring<E, T, A, S>& lhs,
    basic_fbstring<E, T, A, S>&& rhs) {
  if (rhs.capacity() >= lhs.size() + rhs.size()) {
    // Good, at least we don't need to reallocate
    return std::move(rhs.insert(0, lhs));
  }
  // Meh, no go. Forward to operator+(const&, const&).
  auto const& rhsC = rhs;
  return lhs + rhsC;
}

// C++11 21.4.8.1/4
template <typename E, class T, class A, class S>
inline basic_fbstring<E, T, A, S> operator+(
    basic_fbstring<E, T, A, S>&& lhs,
    basic_fbstring<E, T, A, S>&& rhs) {
  return std::move(lhs.append(rhs));
}

// C++11 21.4.8.1/5
template <typename E, class T, class A, class S>
inline basic_fbstring<E, T, A, S> operator+(
    const E* lhs,
    const basic_fbstring<E, T, A, S>& rhs) {
  //
  basic_fbstring<E, T, A, S> result;
  const auto len = basic_fbstring<E, T, A, S>::traits_type::length(lhs);
  result.reserve(len + rhs.size());
  result.append(lhs, len).append(rhs);
  return result;
}

// C++11 21.4.8.1/6
template <typename E, class T, class A, class S>
inline basic_fbstring<E, T, A, S> operator+(
    const E* lhs,
    basic_fbstring<E, T, A, S>&& rhs) {
  //
  const auto len = basic_fbstring<E, T, A, S>::traits_type::length(lhs);
  if (rhs.capacity() >= len + rhs.size()) {
    // Good, at least we don't need to reallocate
    rhs.insert(rhs.begin(), lhs, lhs + len);
    return std::move(rhs);
  }
  // Meh, no go. Do it by hand since we have len already.
  basic_fbstring<E, T, A, S> result;
  result.reserve(len + rhs.size());
  result.append(lhs, len).append(rhs);
  return result;
}

// C++11 21.4.8.1/7
template <typename E, class T, class A, class S>
inline basic_fbstring<E, T, A, S> operator+(
    E lhs,
    const basic_fbstring<E, T, A, S>& rhs) {
  basic_fbstring<E, T, A, S> result;
  result.reserve(1 + rhs.size());
  result.push_back(lhs);
  result.append(rhs);
  return result;
}

// C++11 21.4.8.1/8
template <typename E, class T, class A, class S>
inline basic_fbstring<E, T, A, S> operator+(
    E lhs,
    basic_fbstring<E, T, A, S>&& rhs) {
  //
  if (rhs.capacity() > rhs.size()) {
    // Good, at least we don't need to reallocate
    rhs.insert(rhs.begin(), lhs);
    return std::move(rhs);
  }
  // Meh, no go. Forward to operator+(E, const&).
  auto const& rhsC = rhs;
  return lhs + rhsC;
}

// C++11 21.4.8.1/9
template <typename E, class T, class A, class S>
inline basic_fbstring<E, T, A, S> operator+(
    const basic_fbstring<E, T, A, S>& lhs,
    const E* rhs) {
  typedef typename basic_fbstring<E, T, A, S>::size_type size_type;
  typedef typename basic_fbstring<E, T, A, S>::traits_type traits_type;

  basic_fbstring<E, T, A, S> result;
  const size_type len = traits_type::length(rhs);
  result.reserve(lhs.size() + len);
  result.append(lhs).append(rhs, len);
  return result;
}

// C++11 21.4.8.1/10
template <typename E, class T, class A, class S>
inline basic_fbstring<E, T, A, S> operator+(
    basic_fbstring<E, T, A, S>&& lhs,
    const E* rhs) {
  //
  return std::move(lhs += rhs);
}

// C++11 21.4.8.1/11
template <typename E, class T, class A, class S>
inline basic_fbstring<E, T, A, S> operator+(
    const basic_fbstring<E, T, A, S>& lhs,
    E rhs) {
  basic_fbstring<E, T, A, S> result;
  result.reserve(lhs.size() + 1);
  result.append(lhs);
  result.push_back(rhs);
  return result;
}

// C++11 21.4.8.1/12
template <typename E, class T, class A, class S>
inline basic_fbstring<E, T, A, S> operator+(
    basic_fbstring<E, T, A, S>&& lhs,
    E rhs) {
  //
  return std::move(lhs += rhs);
}

template <typename E, class T, class A, class S>
inline bool operator==(
    const basic_fbstring<E, T, A, S>& lhs,
    const basic_fbstring<E, T, A, S>& rhs) {
  return lhs.size() == rhs.size() && lhs.compare(rhs) == 0;
}

template <typename E, class T, class A, class S>
inline bool operator==(
    const typename basic_fbstring<E, T, A, S>::value_type* lhs,
    const basic_fbstring<E, T, A, S>& rhs) {
  return rhs == lhs;
}

template <typename E, class T, class A, class S>
inline bool operator==(
    const basic_fbstring<E, T, A, S>& lhs,
    const typename basic_fbstring<E, T, A, S>::value_type* rhs) {
  return lhs.compare(rhs) == 0;
}

template <typename E, class T, class A, class S>
inline bool operator!=(
    const basic_fbstring<E, T, A, S>& lhs,
    const basic_fbstring<E, T, A, S>& rhs) {
  return !(lhs == rhs);
}

template <typename E, class T, class A, class S>
inline bool operator!=(
    const typename basic_fbstring<E, T, A, S>::value_type* lhs,
    const basic_fbstring<E, T, A, S>& rhs) {
  return !(lhs == rhs);
}

template <typename E, class T, class A, class S>
inline bool operator!=(
    const basic_fbstring<E, T, A, S>& lhs,
    const typename basic_fbstring<E, T, A, S>::value_type* rhs) {
  return !(lhs == rhs);
}

template <typename E, class T, class A, class S>
inline bool operator<(
    const basic_fbstring<E, T, A, S>& lhs,
    const basic_fbstring<E, T, A, S>& rhs) {
  return lhs.compare(rhs) < 0;
}

template <typename E, class T, class A, class S>
inline bool operator<(
    const basic_fbstring<E, T, A, S>& lhs,
    const typename basic_fbstring<E, T, A, S>::value_type* rhs) {
  return lhs.compare(rhs) < 0;
}

template <typename E, class T, class A, class S>
inline bool operator<(
    const typename basic_fbstring<E, T, A, S>::value_type* lhs,
    const basic_fbstring<E, T, A, S>& rhs) {
  return rhs.compare(lhs) > 0;
}

template <typename E, class T, class A, class S>
inline bool operator>(
    const basic_fbstring<E, T, A, S>& lhs,
    const basic_fbstring<E, T, A, S>& rhs) {
  return rhs < lhs;
}

template <typename E, class T, class A, class S>
inline bool operator>(
    const basic_fbstring<E, T, A, S>& lhs,
    const typename basic_fbstring<E, T, A, S>::value_type* rhs) {
  return rhs < lhs;
}

template <typename E, class T, class A, class S>
inline bool operator>(
    const typename basic_fbstring<E, T, A, S>::value_type* lhs,
    const basic_fbstring<E, T, A, S>& rhs) {
  return rhs < lhs;
}

template <typename E, class T, class A, class S>
inline bool operator<=(
    const basic_fbstring<E, T, A, S>& lhs,
    const basic_fbstring<E, T, A, S>& rhs) {
  return !(rhs < lhs);
}

template <typename E, class T, class A, class S>
inline bool operator<=(
    const basic_fbstring<E, T, A, S>& lhs,
    const typename basic_fbstring<E, T, A, S>::value_type* rhs) {
  return !(rhs < lhs);
}

template <typename E, class T, class A, class S>
inline bool operator<=(
    const typename basic_fbstring<E, T, A, S>::value_type* lhs,
    const basic_fbstring<E, T, A, S>& rhs) {
  return !(rhs < lhs);
}

template <typename E, class T, class A, class S>
inline bool operator>=(
    const basic_fbstring<E, T, A, S>& lhs,
    const basic_fbstring<E, T, A, S>& rhs) {
  return !(lhs < rhs);
}

template <typename E, class T, class A, class S>
inline bool operator>=(
    const basic_fbstring<E, T, A, S>& lhs,
    const typename basic_fbstring<E, T, A, S>::value_type* rhs) {
  return !(lhs < rhs);
}

template <typename E, class T, class A, class S>
inline bool operator>=(
    const typename basic_fbstring<E, T, A, S>::value_type* lhs,
    const basic_fbstring<E, T, A, S>& rhs) {
  return !(lhs < rhs);
}

// C++11 21.4.8.8
template <typename E, class T, class A, class S>
void swap(basic_fbstring<E, T, A, S>& lhs, basic_fbstring<E, T, A, S>& rhs) {
  lhs.swap(rhs);
}

// TODO: make this faster.
template <typename E, class T, class A, class S>
inline std::basic_istream<
    typename basic_fbstring<E, T, A, S>::value_type,
    typename basic_fbstring<E, T, A, S>::traits_type>&
operator>>(
    std::basic_istream<
        typename basic_fbstring<E, T, A, S>::value_type,
        typename basic_fbstring<E, T, A, S>::traits_type>& is,
    basic_fbstring<E, T, A, S>& str) {
  typedef std::basic_istream<
      typename basic_fbstring<E, T, A, S>::value_type,
      typename basic_fbstring<E, T, A, S>::traits_type>
      _istream_type;
  typename _istream_type::sentry sentry(is);
  size_t extracted = 0;
  auto err = _istream_type::goodbit;
  if (sentry) {
    auto n = is.width();
    if (n <= 0) {
      n = str.max_size();
    }
    str.erase();
    for (auto got = is.rdbuf()->sgetc(); extracted != size_t(n); ++extracted) {
      if (got == T::eof()) {
        err |= _istream_type::eofbit;
        is.width(0);
        break;
      }
      if (isspace(got)) {
        break;
      }
      str.push_back(got);
      got = is.rdbuf()->snextc();
    }
  }
  if (!extracted) {
    err |= _istream_type::failbit;
  }
  if (err) {
    is.setstate(err);
  }
  return is;
}

template <typename E, class T, class A, class S>
inline std::basic_ostream<
    typename basic_fbstring<E, T, A, S>::value_type,
    typename basic_fbstring<E, T, A, S>::traits_type>&
operator<<(
    std::basic_ostream<
        typename basic_fbstring<E, T, A, S>::value_type,
        typename basic_fbstring<E, T, A, S>::traits_type>& os,
    const basic_fbstring<E, T, A, S>& str) {
#if _LIBCPP_VERSION
  typedef std::basic_ostream<
      typename basic_fbstring<E, T, A, S>::value_type,
      typename basic_fbstring<E, T, A, S>::traits_type>
      _ostream_type;
  typename _ostream_type::sentry _s(os);
  if (_s) {
    typedef std::ostreambuf_iterator<
        typename basic_fbstring<E, T, A, S>::value_type,
        typename basic_fbstring<E, T, A, S>::traits_type>
        _Ip;
    size_t __len = str.size();
    bool __left =
        (os.flags() & _ostream_type::adjustfield) == _ostream_type::left;
    if (__pad_and_output(
            _Ip(os),
            str.data(),
            __left ? str.data() + __len : str.data(),
            str.data() + __len,
            os,
            os.fill())
            .failed()) {
      os.setstate(_ostream_type::badbit | _ostream_type::failbit);
    }
  }
#elif defined(_MSC_VER)
  typedef decltype(os.precision()) streamsize;
  // MSVC doesn't define __ostream_insert
  os.write(str.data(), static_cast<streamsize>(str.size()));
#else
  std::__ostream_insert(os, str.data(), str.size());
#endif
  return os;
}

template <typename E1, class T, class A, class S>
constexpr typename basic_fbstring<E1, T, A, S>::size_type
    basic_fbstring<E1, T, A, S>::npos;

#ifndef _LIBSTDCXX_FBSTRING
// basic_string compatibility routines

template <typename E, class T, class A, class S, class A2>
inline bool operator==(
    const basic_fbstring<E, T, A, S>& lhs,
    const std::basic_string<E, T, A2>& rhs) {
  return lhs.compare(0, lhs.size(), rhs.data(), rhs.size()) == 0;
}

template <typename E, class T, class A, class S, class A2>
inline bool operator==(
    const std::basic_string<E, T, A2>& lhs,
    const basic_fbstring<E, T, A, S>& rhs) {
  return rhs == lhs;
}

template <typename E, class T, class A, class S, class A2>
inline bool operator!=(
    const basic_fbstring<E, T, A, S>& lhs,
    const std::basic_string<E, T, A2>& rhs) {
  return !(lhs == rhs);
}

template <typename E, class T, class A, class S, class A2>
inline bool operator!=(
    const std::basic_string<E, T, A2>& lhs,
    const basic_fbstring<E, T, A, S>& rhs) {
  return !(lhs == rhs);
}

template <typename E, class T, class A, class S, class A2>
inline bool operator<(
    const basic_fbstring<E, T, A, S>& lhs,
    const std::basic_string<E, T, A2>& rhs) {
  return lhs.compare(0, lhs.size(), rhs.data(), rhs.size()) < 0;
}

template <typename E, class T, class A, class S, class A2>
inline bool operator>(
    const basic_fbstring<E, T, A, S>& lhs,
    const std::basic_string<E, T, A2>& rhs) {
  return lhs.compare(0, lhs.size(), rhs.data(), rhs.size()) > 0;
}

template <typename E, class T, class A, class S, class A2>
inline bool operator<(
    const std::basic_string<E, T, A2>& lhs,
    const basic_fbstring<E, T, A, S>& rhs) {
  return rhs > lhs;
}

template <typename E, class T, class A, class S, class A2>
inline bool operator>(
    const std::basic_string<E, T, A2>& lhs,
    const basic_fbstring<E, T, A, S>& rhs) {
  return rhs < lhs;
}

template <typename E, class T, class A, class S, class A2>
inline bool operator<=(
    const basic_fbstring<E, T, A, S>& lhs,
    const std::basic_string<E, T, A2>& rhs) {
  return !(lhs > rhs);
}

template <typename E, class T, class A, class S, class A2>
inline bool operator>=(
    const basic_fbstring<E, T, A, S>& lhs,
    const std::basic_string<E, T, A2>& rhs) {
  return !(lhs < rhs);
}

template <typename E, class T, class A, class S, class A2>
inline bool operator<=(
    const std::basic_string<E, T, A2>& lhs,
    const basic_fbstring<E, T, A, S>& rhs) {
  return !(lhs > rhs);
}

template <typename E, class T, class A, class S, class A2>
inline bool operator>=(
    const std::basic_string<E, T, A2>& lhs,
    const basic_fbstring<E, T, A, S>& rhs) {
  return !(lhs < rhs);
}

#if !defined(_LIBSTDCXX_FBSTRING)
typedef basic_fbstring<char> fbstring;
#endif

// fbstring is relocatable
template <class T, class R, class A, class S>
FOLLY_ASSUME_RELOCATABLE(basic_fbstring<T, R, A, S>);

#endif

FOLLY_FBSTRING_END_NAMESPACE

#ifndef _LIBSTDCXX_FBSTRING

// Hash functions to make fbstring usable with e.g. hash_map
//
// Handle interaction with different C++ standard libraries, which
// expect these types to be in different namespaces.

#define FOLLY_FBSTRING_HASH1(T)                                        \
  template <>                                                          \
  struct hash<::folly::basic_fbstring<T>> {                            \
    size_t operator()(const ::folly::basic_fbstring<T>& s) const {     \
      return ::folly::hash::fnv32_buf(s.data(), s.size() * sizeof(T)); \
    }                                                                  \
  };

// The C++11 standard says that these four are defined
#define FOLLY_FBSTRING_HASH      \
  FOLLY_FBSTRING_HASH1(char)     \
  FOLLY_FBSTRING_HASH1(char16_t) \
  FOLLY_FBSTRING_HASH1(char32_t) \
  FOLLY_FBSTRING_HASH1(wchar_t)

namespace std {

FOLLY_FBSTRING_HASH

} // namespace std

#undef FOLLY_FBSTRING_HASH
#undef FOLLY_FBSTRING_HASH1

#endif // _LIBSTDCXX_FBSTRING

FOLLY_POP_WARNING

#undef FBSTRING_DISABLE_SSO
#undef FBSTRING_SANITIZE_ADDRESS
#undef throw
#undef FBSTRING_LIKELY
#undef FBSTRING_UNLIKELY
#undef FBSTRING_ASSERT

#ifndef _LIBSTDCXX_FBSTRING
namespace folly {
template <class T>
struct IsSomeString;

template <>
struct IsSomeString<fbstring> : std::true_type {};
} // namespace folly
#endif
