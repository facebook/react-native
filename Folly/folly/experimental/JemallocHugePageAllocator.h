/*
 * Copyright 2018-present Facebook, Inc.
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

// http://www.canonware.com/download/jemalloc/jemalloc-latest/doc/jemalloc.html

#pragma once

#include <folly/CPortability.h>
#include <folly/memory/Malloc.h>
#include <folly/portability/Config.h>
#include <folly/portability/Memory.h>
#include <folly/portability/SysMman.h>

#include <cstddef>
#include <cstdint>

namespace folly {

/**
 * An allocator which uses Jemalloc to create a dedicated huge page arena,
 * backed by 2MB huge pages (on linux x86-64).
 *
 * This allocator is specifically intended for linux with the transparent
 * huge page support set to 'madvise' and defrag policy set to 'madvise'
 * or 'defer+madvise'.
 * These can be controller via /sys/kernel/mm/transparent_hugepage/enabled
 * and /sys/kernel/mm/transparent_hugepage/defrag.
 *
 * The allocator reserves a fixed-size area using mmap, and sets the
 * MADV_HUGEPAGE page attribute using the madvise system call.
 * A custom jemalloc hook is installed which is called when creating a new
 * extent of memory. This will allocate from the reserved area if possible,
 * and otherwise fall back to the default method.
 * Jemalloc does not use allocated extents across different arenas without
 * first unmapping them, and the advice flags are cleared on munmap.
 * A regular malloc will never end up allocating memory from this arena.
 *
 * If binary isn't linked with jemalloc, the logic falls back to malloc / free.
 *
 * Note that the madvise call does not guarantee huge pages, it is best effort.
 *
 * 1GB Huge Pages are not supported at this point.
 */
class JemallocHugePageAllocator {
 public:
  static bool init(int nr_pages);

  static void* allocate(size_t size) {
    // If uninitialized, flags_ will be 0 and the mallocx behavior
    // will match that of a regular malloc
    return hugePagesSupported ? mallocx(size, flags_) : malloc(size);
  }

  static void* reallocate(void* p, size_t size) {
    return hugePagesSupported ? rallocx(p, size, flags_) : realloc(p, size);
  }

  static void deallocate(void* p, size_t = 0) {
    hugePagesSupported ? dallocx(p, flags_) : free(p);
  }

  static bool initialized() {
    return flags_ != 0;
  }

  static size_t freeSpace();
  static bool addressInArena(void* address);

 private:
  static int flags_;
  static bool hugePagesSupported;
};

// STL compatible huge page allocator, for use with STL-style containers
template <typename T>
class CxxHugePageAllocator {
 private:
  using Self = CxxHugePageAllocator<T>;

 public:
  using value_type = T;

  CxxHugePageAllocator() {}

  template <typename U>
  explicit CxxHugePageAllocator(CxxHugePageAllocator<U> const&) {}

  T* allocate(std::size_t n) {
    return static_cast<T*>(JemallocHugePageAllocator::allocate(sizeof(T) * n));
  }
  void deallocate(T* p, std::size_t n) {
    JemallocHugePageAllocator::deallocate(p, sizeof(T) * n);
  }

  friend bool operator==(Self const&, Self const&) noexcept {
    return true;
  }
  friend bool operator!=(Self const&, Self const&) noexcept {
    return false;
  }
};

} // namespace folly
