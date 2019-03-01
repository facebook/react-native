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

// Functions to provide smarter use of jemalloc, if jemalloc is being used.
// http://www.canonware.com/download/jemalloc/jemalloc-latest/doc/jemalloc.html

#pragma once

#include <folly/portability/Config.h>

/**
 * Define various MALLOCX_* macros normally provided by jemalloc.  We define
 * them so that we don't have to include jemalloc.h, in case the program is
 * built without jemalloc support.
 */
#if defined(USE_JEMALLOC) || defined(FOLLY_USE_JEMALLOC)
// We have JEMalloc, so use it.
# include <jemalloc/jemalloc.h>
#else
# ifndef MALLOCX_LG_ALIGN
#  define MALLOCX_LG_ALIGN(la) (la)
# endif
# ifndef MALLOCX_ZERO
#  define MALLOCX_ZERO (static_cast<int>(0x40))
# endif
#endif

// If using fbstring from libstdc++ (see comment in FBString.h), then
// just define stub code here to typedef the fbstring type into the
// folly namespace.
// This provides backwards compatibility for code that explicitly
// includes and uses fbstring.
#if defined(_GLIBCXX_USE_FB) && !defined(_LIBSTDCXX_FBSTRING)

#include <folly/detail/Malloc.h>
#include <folly/portability/BitsFunctexcept.h>

#include <string>

namespace folly {
  using std::goodMallocSize;
  using std::jemallocMinInPlaceExpandable;
  using std::usingJEMalloc;
  using std::smartRealloc;
  using std::checkedMalloc;
  using std::checkedCalloc;
  using std::checkedRealloc;
}

#else // !defined(_GLIBCXX_USE_FB) || defined(_LIBSTDCXX_FBSTRING)

#ifdef _LIBSTDCXX_FBSTRING
#pragma GCC system_header

/**
 * Declare *allocx() and mallctl*() as weak symbols. These will be provided by
 * jemalloc if we are using jemalloc, or will be NULL if we are using another
 * malloc implementation.
 */
extern "C" void* mallocx(size_t, int)
__attribute__((__weak__));
extern "C" void* rallocx(void*, size_t, int)
__attribute__((__weak__));
extern "C" size_t xallocx(void*, size_t, size_t, int)
__attribute__((__weak__));
extern "C" size_t sallocx(const void*, int)
__attribute__((__weak__));
extern "C" void dallocx(void*, int)
__attribute__((__weak__));
extern "C" void sdallocx(void*, size_t, int)
__attribute__((__weak__));
extern "C" size_t nallocx(size_t, int)
__attribute__((__weak__));
extern "C" int mallctl(const char*, void*, size_t*, void*, size_t)
__attribute__((__weak__));
extern "C" int mallctlnametomib(const char*, size_t*, size_t*)
__attribute__((__weak__));
extern "C" int mallctlbymib(const size_t*, size_t, void*, size_t*, void*,
                            size_t)
__attribute__((__weak__));

#include <bits/functexcept.h>

#define FOLLY_HAVE_MALLOC_H 1

#else // !defined(_LIBSTDCXX_FBSTRING)

#include <folly/detail/Malloc.h> /* nolint */
#include <folly/portability/BitsFunctexcept.h> /* nolint */

#endif

// for malloc_usable_size
// NOTE: FreeBSD 9 doesn't have malloc.h.  Its definitions
// are found in stdlib.h.
#if FOLLY_HAVE_MALLOC_H
#include <malloc.h>
#else
#include <stdlib.h>
#endif

#include <cassert>
#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <cstring>

#include <atomic>
#include <new>

#ifdef _LIBSTDCXX_FBSTRING
namespace std _GLIBCXX_VISIBILITY(default) {
_GLIBCXX_BEGIN_NAMESPACE_VERSION
#else
namespace folly {
#endif

// Cannot depend on Portability.h when _LIBSTDCXX_FBSTRING.
#if defined(__GNUC__)
#define FOLLY_MALLOC_NOINLINE __attribute__((__noinline__))
#if (__GNUC__ * 10000 + __GNUC_MINOR__ * 100 + __GNUC_PATCHLEVEL) >= 40900
// This is for checked malloc-like functions (returns non-null pointer
// which cannot alias any outstanding pointer).
#define FOLLY_MALLOC_CHECKED_MALLOC                     \
  __attribute__((__returns_nonnull__, __malloc__))
#else
#define FOLLY_MALLOC_CHECKED_MALLOC __attribute__((__malloc__))
#endif
#else
#define FOLLY_MALLOC_NOINLINE
#define FOLLY_MALLOC_CHECKED_MALLOC
#endif

/**
 * Determine if we are using jemalloc or not.
 */
FOLLY_MALLOC_NOINLINE inline bool usingJEMalloc() noexcept {
  // Checking for rallocx != NULL is not sufficient; we may be in a dlopen()ed
  // module that depends on libjemalloc, so rallocx is resolved, but the main
  // program might be using a different memory allocator.
  // How do we determine that we're using jemalloc? In the hackiest
  // way possible. We allocate memory using malloc() and see if the
  // per-thread counter of allocated memory increases. This makes me
  // feel dirty inside. Also note that this requires jemalloc to have
  // been compiled with --enable-stats.
  static const bool result = [] () noexcept {
    // Some platforms (*cough* OSX *cough*) require weak symbol checks to be
    // in the form if (mallctl != nullptr). Not if (mallctl) or if (!mallctl)
    // (!!). http://goo.gl/xpmctm
    if (mallocx == nullptr || rallocx == nullptr || xallocx == nullptr
        || sallocx == nullptr || dallocx == nullptr || sdallocx == nullptr
        || nallocx == nullptr || mallctl == nullptr
        || mallctlnametomib == nullptr || mallctlbymib == nullptr) {
      return false;
    }

    // "volatile" because gcc optimizes out the reads from *counter, because
    // it "knows" malloc doesn't modify global state...
    /* nolint */ volatile uint64_t* counter;
    size_t counterLen = sizeof(uint64_t*);

    if (mallctl("thread.allocatedp", static_cast<void*>(&counter), &counterLen,
                nullptr, 0) != 0) {
      return false;
    }

    if (counterLen != sizeof(uint64_t*)) {
      return false;
    }

    uint64_t origAllocated = *counter;

    // Static because otherwise clever compilers will find out that
    // the ptr is not used and does not escape the scope, so they will
    // just optimize away the malloc.
    static const void* ptr = malloc(1);
    if (!ptr) {
      // wtf, failing to allocate 1 byte
      return false;
    }

    return (origAllocated != *counter);
  }();

  return result;
}

inline size_t goodMallocSize(size_t minSize) noexcept {
  if (minSize == 0) {
    return 0;
  }

  if (!usingJEMalloc()) {
    // Not using jemalloc - no smarts
    return minSize;
  }

  return nallocx(minSize, 0);
}

// We always request "good" sizes for allocation, so jemalloc can
// never grow in place small blocks; they're already occupied to the
// brim.  Blocks larger than or equal to 4096 bytes can in fact be
// expanded in place, and this constant reflects that.
static const size_t jemallocMinInPlaceExpandable = 4096;

/**
 * Trivial wrappers around malloc, calloc, realloc that check for allocation
 * failure and throw std::bad_alloc in that case.
 */
inline void* checkedMalloc(size_t size) {
  void* p = malloc(size);
  if (!p) std::__throw_bad_alloc();
  return p;
}

inline void* checkedCalloc(size_t n, size_t size) {
  void* p = calloc(n, size);
  if (!p) std::__throw_bad_alloc();
  return p;
}

inline void* checkedRealloc(void* ptr, size_t size) {
  void* p = realloc(ptr, size);
  if (!p) std::__throw_bad_alloc();
  return p;
}

/**
 * This function tries to reallocate a buffer of which only the first
 * currentSize bytes are used. The problem with using realloc is that
 * if currentSize is relatively small _and_ if realloc decides it
 * needs to move the memory chunk to a new buffer, then realloc ends
 * up copying data that is not used. It's impossible to hook into
 * GNU's malloc to figure whether expansion will occur in-place or as
 * a malloc-copy-free troika. (If an expand_in_place primitive would
 * be available, smartRealloc would use it.) As things stand, this
 * routine just tries to call realloc() (thus benefitting of potential
 * copy-free coalescing) unless there's too much slack memory.
 */
FOLLY_MALLOC_CHECKED_MALLOC FOLLY_MALLOC_NOINLINE inline void* smartRealloc(
    void* p,
    const size_t currentSize,
    const size_t currentCapacity,
    const size_t newCapacity) {
  assert(p);
  assert(currentSize <= currentCapacity &&
         currentCapacity < newCapacity);

  if (usingJEMalloc()) {
    // using jemalloc's API. Don't forget that jemalloc can never grow
    // in place blocks smaller than 4096 bytes.
    //
    // NB: newCapacity may not be precisely equal to a jemalloc size class,
    // i.e. newCapacity is not guaranteed to be the result of a
    // goodMallocSize() call, therefore xallocx() may return more than
    // newCapacity bytes of space.  Use >= rather than == to check whether
    // xallocx() successfully expanded in place.
    if (currentCapacity >= jemallocMinInPlaceExpandable &&
        xallocx(p, newCapacity, 0, 0) >= newCapacity) {
      // Managed to expand in place
      return p;
    }
    // Cannot expand; must move
    auto const result = checkedMalloc(newCapacity);
    std::memcpy(result, p, currentSize);
    free(p);
    return result;
  }

  // No jemalloc no honey
  auto const slack = currentCapacity - currentSize;
  if (slack * 2 > currentSize) {
    // Too much slack, malloc-copy-free cycle:
    auto const result = checkedMalloc(newCapacity);
    std::memcpy(result, p, currentSize);
    free(p);
    return result;
  }
  // If there's not too much slack, we realloc in hope of coalescing
  return checkedRealloc(p, newCapacity);
}

#ifdef _LIBSTDCXX_FBSTRING
_GLIBCXX_END_NAMESPACE_VERSION
#endif

} // folly

#endif // !defined(_GLIBCXX_USE_FB) || defined(_LIBSTDCXX_FBSTRING)
