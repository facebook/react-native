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

#include <folly/experimental/JemallocHugePageAllocator.h>

#include <folly/portability/String.h>
#include <glog/logging.h>

#include <sstream>

#if defined(MADV_HUGEPAGE) && defined(FOLLY_USE_JEMALLOC) && !FOLLY_SANITIZE
#include <jemalloc/jemalloc.h>
#if (JEMALLOC_VERSION_MAJOR >= 5)
#define FOLLY_JEMALLOC_HUGE_PAGE_ALLOCATOR_SUPPORTED 1
bool folly::JemallocHugePageAllocator::hugePagesSupported{true};
#endif

#endif // defined(FOLLY_HAVE_LIBJEMALLOC) && !FOLLY_SANITIZE

#ifndef FOLLY_JEMALLOC_HUGE_PAGE_ALLOCATOR_SUPPORTED
// Some mocks when jemalloc.h is not included or version too old
// or when the system does not support the MADV_HUGEPAGE madvise flag
#undef MALLOCX_ARENA
#undef MALLOCX_TCACHE_NONE
#undef MADV_HUGEPAGE
#define MALLOCX_ARENA(x) 0
#define MALLOCX_TCACHE_NONE 0
#define MADV_HUGEPAGE 0
typedef struct extent_hooks_s extent_hooks_t;
typedef void*(extent_alloc_t)(
    extent_hooks_t*,
    void*,
    size_t,
    size_t,
    bool*,
    bool*,
    unsigned);
struct extent_hooks_s {
  extent_alloc_t* alloc;
};
bool folly::JemallocHugePageAllocator::hugePagesSupported{false};
#endif // FOLLY_JEMALLOC_HUGE_PAGE_ALLOCATOR_SUPPORTED

namespace folly {
namespace {

static void print_error(int err, const char* msg) {
  int cur_errno = std::exchange(errno, err);
  PLOG(ERROR) << msg;
  errno = cur_errno;
}

class HugePageArena {
 public:
  int init(int nr_pages);
  void* reserve(size_t size, size_t alignment);

  bool addressInArena(void* address) {
    uintptr_t addr = reinterpret_cast<uintptr_t>(address);
    return addr >= start_ && addr < end_;
  }

  size_t freeSpace() {
    return end_ - freePtr_;
  }

 private:
  static void* allocHook(
      extent_hooks_t* extent,
      void* new_addr,
      size_t size,
      size_t alignment,
      bool* zero,
      bool* commit,
      unsigned arena_ind);

  uintptr_t start_{0};
  uintptr_t end_{0};
  uintptr_t freePtr_{0};
  extent_alloc_t* originalAlloc_{nullptr};
  extent_hooks_t extentHooks_;
};

constexpr size_t kHugePageSize = 2 * 1024 * 1024;

// Singleton arena instance
static HugePageArena arena;

template <typename T, typename U>
static inline T align_up(T val, U alignment) {
  DCHECK((alignment & (alignment - 1)) == 0);
  return (val + alignment - 1) & ~(alignment - 1);
}

// mmap enough memory to hold the aligned huge pages, then use madvise
// to get huge pages. Note that this is only a hint and is not guaranteed
// to be honoured. Check /proc/<pid>/smaps to verify!
static uintptr_t map_pages(size_t nr_pages) {
  // Initial mmapped area is large enough to contain the aligned huge pages
  size_t alloc_size = nr_pages * kHugePageSize;
  void* p = mmap(
      nullptr,
      alloc_size + kHugePageSize,
      PROT_READ | PROT_WRITE,
      MAP_PRIVATE | MAP_ANONYMOUS,
      -1,
      0);

  if (p == MAP_FAILED) {
    return 0;
  }

  // Aligned start address
  uintptr_t first_page = align_up((uintptr_t)p, kHugePageSize);

  // Unmap left-over 4k pages
  munmap(p, first_page - (uintptr_t)p);
  munmap(
      (void*)(first_page + alloc_size),
      kHugePageSize - (first_page - (uintptr_t)p));

  // Tell the kernel to please give us huge pages for this range
  madvise((void*)first_page, kHugePageSize * nr_pages, MADV_HUGEPAGE);
  LOG(INFO) << nr_pages << " huge pages at " << (void*)first_page;
  return first_page;
}

void* HugePageArena::allocHook(
    extent_hooks_t* extent,
    void* new_addr,
    size_t size,
    size_t alignment,
    bool* zero,
    bool* commit,
    unsigned arena_ind) {
  DCHECK((size & (size - 1)) == 0);
  void* res = nullptr;
  if (new_addr == nullptr) {
    res = arena.reserve(size, alignment);
  }
  LOG(INFO) << "Extent request of size " << size << " alignment " << alignment
            << " = " << res << " (" << arena.freeSpace() << " bytes free)";
  if (res == nullptr) {
    LOG_IF(WARNING, new_addr != nullptr) << "Explicit address not supported";
    res = arena.originalAlloc_(
        extent, new_addr, size, alignment, zero, commit, arena_ind);
  } else {
    if (*zero) {
      bzero(res, size);
    }
    *commit = true;
  }
  return res;
}

int HugePageArena::init(int nr_pages) {
  DCHECK(start_ == 0);
  DCHECK(usingJEMalloc());

  unsigned arena_index;
  size_t len = sizeof(arena_index);
  if (auto ret = mallctl("arenas.create", &arena_index, &len, nullptr, 0)) {
    print_error(ret, "Unable to create arena");
    return 0;
  }

  // Set grow retained limit to stop jemalloc from
  // forever increasing the requested size after failed allocations.
  // Normally jemalloc asks for maps of increasing size in order to avoid
  // hitting the limit of allowed mmaps per process.
  // Since this arena is backed by a single mmap and is using huge pages,
  // this is not a concern here.
  // TODO: Support growth of the huge page arena.
  size_t mib[3];
  size_t miblen = sizeof(mib) / sizeof(size_t);
  std::ostringstream rtl_key;
  rtl_key << "arena." << arena_index << ".retain_grow_limit";
  if (auto ret = mallctlnametomib(rtl_key.str().c_str(), mib, &miblen)) {
    print_error(ret, "Unable to read growth limit");
    return 0;
  }
  size_t grow_retained_limit = kHugePageSize;
  mib[1] = arena_index;
  if (auto ret = mallctlbymib(
          mib,
          miblen,
          nullptr,
          nullptr,
          &grow_retained_limit,
          sizeof(grow_retained_limit))) {
    print_error(ret, "Unable to set growth limit");
    return 0;
  }

  std::ostringstream hooks_key;
  hooks_key << "arena." << arena_index << ".extent_hooks";
  extent_hooks_t* hooks;
  len = sizeof(hooks);
  // Read the existing hooks
  if (auto ret = mallctl(hooks_key.str().c_str(), &hooks, &len, nullptr, 0)) {
    print_error(ret, "Unable to get the hooks");
    return 0;
  }
  originalAlloc_ = hooks->alloc;

  // Set the custom hook
  extentHooks_ = *hooks;
  extentHooks_.alloc = &allocHook;
  extent_hooks_t* new_hooks = &extentHooks_;
  if (auto ret = mallctl(
          hooks_key.str().c_str(),
          nullptr,
          nullptr,
          &new_hooks,
          sizeof(new_hooks))) {
    print_error(ret, "Unable to set the hooks");
    return 0;
  }

  start_ = freePtr_ = map_pages(nr_pages);
  if (start_ == 0) {
    return false;
  }
  end_ = start_ + (nr_pages * kHugePageSize);
  return MALLOCX_ARENA(arena_index) | MALLOCX_TCACHE_NONE;
}

void* HugePageArena::reserve(size_t size, size_t alignment) {
  VLOG(1) << "Reserve: " << size << " alignemnt " << alignment;
  uintptr_t res = align_up(freePtr_, alignment);
  uintptr_t newFreePtr = res + size;
  if (newFreePtr > end_) {
    LOG(WARNING) << "Request of size " << size << " denied: " << freeSpace()
                 << " bytes available - not backed by huge pages";
    return nullptr;
  }
  freePtr_ = newFreePtr;
  return reinterpret_cast<void*>(res);
}

} // namespace

int JemallocHugePageAllocator::flags_{0};

bool JemallocHugePageAllocator::init(int nr_pages) {
  if (!usingJEMalloc()) {
    LOG(ERROR) << "Not linked with jemalloc?";
    hugePagesSupported = false;
  }
  if (hugePagesSupported) {
    if (flags_ == 0) {
      flags_ = arena.init(nr_pages);
    } else {
      LOG(WARNING) << "Already initialized";
    }
  } else {
    LOG(WARNING) << "Huge Page Allocator not supported";
  }
  return flags_ != 0;
}

size_t JemallocHugePageAllocator::freeSpace() {
  return arena.freeSpace();
}

bool JemallocHugePageAllocator::addressInArena(void* address) {
  return arena.addressInArena(address);
}

} // namespace folly
