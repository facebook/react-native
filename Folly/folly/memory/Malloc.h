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

// Functions to provide smarter use of jemalloc, if jemalloc is being used.
// http://www.canonware.com/download/jemalloc/jemalloc-latest/doc/jemalloc.html

#pragma once

#include <folly/CPortability.h>
#include <folly/portability/Config.h>

/**
 * Define various MALLOCX_* macros normally provided by jemalloc.  We define
 * them so that we don't have to include jemalloc.h, in case the program is
 * built without jemalloc support.
 */
#if (defined(USE_JEMALLOC) || defined(FOLLY_USE_JEMALLOC)) && !FOLLY_SANITIZE
// We have JEMalloc, so use it.
#include <jemalloc/jemalloc.h>
#else
#ifndef MALLOCX_LG_ALIGN
#define MALLOCX_LG_ALIGN(la) (la)
#endif
#ifndef MALLOCX_ZERO
#define MALLOCX_ZERO (static_cast<int>(0x40))
#endif
#ifndef MALLOCX_ARENA
#define MALLOCX_ARENA(_) (static_cast<int>(0))
#endif
#ifndef MALLOCX_LG_ALIGN
#define MALLOCX_LG_ALIGN(_) (static_cast<int>(0))
#endif
#ifndef MALLCTL_ARENAS_ALL
#define MALLCTL_ARENAS_ALL (static_cast<int>(0))
#endif
#ifndef MALLOCX_TCACHE_NONE
#define MALLOCX_TCACHE_NONE (static_cast<int>(0))
#endif
#endif

// If using fbstring from libstdc++ (see comment in FBString.h), then
// just define stub code here to typedef the fbstring type into the
// folly namespace.
// This provides backwards compatibility for code that explicitly
// includes and uses fbstring.
#if defined(_GLIBCXX_USE_FB) && !defined(_LIBSTDCXX_FBSTRING)

#include <folly/lang/Exception.h>
#include <folly/memory/detail/MallocImpl.h>

#include <string>

namespace folly {
using std::checkedCalloc;
using std::checkedMalloc;
using std::checkedRealloc;
using std::goodMallocSize;
using std::jemallocMinInPlaceExpandable;
using std::smartRealloc;
using std::usingJEMalloc;
} // namespace folly

#else // !defined(_GLIBCXX_USE_FB) || defined(_LIBSTDCXX_FBSTRING)

#ifdef _LIBSTDCXX_FBSTRING
#pragma GCC system_header

/**
 * Declare *allocx() and mallctl*() as weak symbols. These will be provided by
 * jemalloc if we are using jemalloc, or will be nullptr if we are using another
 * malloc implementation.
 */
extern "C" void* mallocx(size_t, int) __attribute__((__weak__));
extern "C" void* rallocx(void*, size_t, int) __attribute__((__weak__));
extern "C" size_t xallocx(void*, size_t, size_t, int) __attribute__((__weak__));
extern "C" size_t sallocx(const void*, int) __attribute__((__weak__));
extern "C" void dallocx(void*, int) __attribute__((__weak__));
extern "C" void sdallocx(void*, size_t, int) __attribute__((__weak__));
extern "C" size_t nallocx(size_t, int) __attribute__((__weak__));
extern "C" int mallctl(const char*, void*, size_t*, void*, size_t)
    __attribute__((__weak__));
extern "C" int mallctlnametomib(const char*, size_t*, size_t*)
    __attribute__((__weak__));
extern "C" int
mallctlbymib(const size_t*, size_t, void*, size_t*, void*, size_t)
    __attribute__((__weak__));

#else // !defined(_LIBSTDCXX_FBSTRING)

#include <folly/lang/Exception.h> /* nolint */
#include <folly/memory/detail/MallocImpl.h> /* nolint */

#endif

// for malloc_usable_size
// NOTE: FreeBSD 9 doesn't have malloc.h.  Its definitions
// are found in stdlib.h.
#if __has_include(<malloc.h>)
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

// clang-format off

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
#define FOLLY_MALLOC_CHECKED_MALLOC \
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
#if defined(USE_JEMALLOC) && !FOLLY_SANITIZE
  inline bool usingJEMalloc() noexcept {
    return true;
  }
#else
FOLLY_MALLOC_NOINLINE inline bool usingJEMalloc() noexcept {
  // Checking for rallocx != nullptr is not sufficient; we may be in a
  // dlopen()ed module that depends on libjemalloc, so rallocx is resolved, but
  // the main program might be using a different memory allocator.
  // How do we determine that we're using jemalloc? In the hackiest
  // way possible. We allocate memory using malloc() and see if the
  // per-thread counter of allocated memory increases. This makes me
  // feel dirty inside. Also note that this requires jemalloc to have
  // been compiled with --enable-stats.
  static const bool result = []() noexcept {
    // Some platforms (*cough* OSX *cough*) require weak symbol checks to be
    // in the form if (mallctl != nullptr). Not if (mallctl) or if (!mallctl)
    // (!!). http://goo.gl/xpmctm
    if (mallocx == nullptr || rallocx == nullptr || xallocx == nullptr ||
        sallocx == nullptr || dallocx == nullptr || sdallocx == nullptr ||
        nallocx == nullptr || mallctl == nullptr ||
        mallctlnametomib == nullptr || mallctlbymib == nullptr) {
      return false;
    }

    // "volatile" because gcc optimizes out the reads from *counter, because
    // it "knows" malloc doesn't modify global state...
    /* nolint */ volatile uint64_t* counter;
    size_t counterLen = sizeof(uint64_t*);

    if (mallctl(
            "thread.allocatedp",
            static_cast<void*>(&counter),
            &counterLen,
            nullptr,
            0) != 0) {
      return false;
    }

    if (counterLen != sizeof(uint64_t*)) {
      return false;
    }

    uint64_t origAllocated = *counter;

    static const void* volatile ptr = malloc(1);
    if (!ptr) {
      // wtf, failing to allocate 1 byte
      return false;
    }

    return (origAllocated != *counter);
  }
  ();

  return result;
}
#endif

inline size_t goodMallocSize(size_t minSize) noexcept {
  if (minSize == 0) {
    return 0;
  }

  if (!usingJEMalloc()) {
    // Not using jemalloc - no smarts
    return minSize;
  }

  // nallocx returns 0 if minSize can't succeed, but 0 is not actually
  // a goodMallocSize if you want minSize
  auto rv = nallocx(minSize, 0);
  return rv ? rv : minSize;
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
  if (!p) {
    throw_exception<std::bad_alloc>();
  }
  return p;
}

inline void* checkedCalloc(size_t n, size_t size) {
  void* p = calloc(n, size);
  if (!p) {
    throw_exception<std::bad_alloc>();
  }
  return p;
}

inline void* checkedRealloc(void* ptr, size_t size) {
  void* p = realloc(ptr, size);
  if (!p) {
    throw_exception<std::bad_alloc>();
  }
  return p;
}

/**
 * This function tries to reallocate a buffer of which only the first
 * currentSize bytes are used. The problem with using realloc is that
 * if currentSize is relatively small _and_ if realloc decides it
 * needs to move the memory chunk to a new buffer, then realloc ends
 * up copying data that is not used. It's generally not a win to try
 * to hook in to realloc() behavior to avoid copies - at least in
 * jemalloc, realloc() almost always ends up doing a copy, because
 * there is little fragmentation / slack space to take advantage of.
 */
FOLLY_MALLOC_CHECKED_MALLOC FOLLY_MALLOC_NOINLINE inline void* smartRealloc(
    void* p,
    const size_t currentSize,
    const size_t currentCapacity,
    const size_t newCapacity) {
  assert(p);
  assert(currentSize <= currentCapacity &&
         currentCapacity < newCapacity);

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

} // namespace folly

// clang-format on

#endif // !defined(_GLIBCXX_USE_FB) || defined(_LIBSTDCXX_FBSTRING)
