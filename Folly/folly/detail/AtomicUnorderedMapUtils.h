/*
 * Copyright 2015-present Facebook, Inc.
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

#include <atomic>
#include <cassert>
#include <cstdint>
#include <system_error>

#include <folly/portability/SysMman.h>
#include <folly/portability/Unistd.h>

namespace folly {
namespace detail {

class MMapAlloc {
 private:
  size_t computeSize(size_t size) {
    long pagesize = sysconf(_SC_PAGESIZE);
    size_t mmapLength = ((size - 1) & ~(pagesize - 1)) + pagesize;
    assert(size <= mmapLength && mmapLength < size + pagesize);
    assert((mmapLength % pagesize) == 0);
    return mmapLength;
  }

 public:
  void* allocate(size_t size) {
    auto len = computeSize(size);

    int extraflags = 0;
#if defined(MAP_POPULATE)
    extraflags |= MAP_POPULATE;
#endif
    // MAP_HUGETLB is a perf win, but requires cooperation from the
    // deployment environment (and a change to computeSize()).
    void* mem = static_cast<void*>(mmap(
        nullptr,
        len,
        PROT_READ | PROT_WRITE,
        MAP_PRIVATE | MAP_ANONYMOUS | extraflags,
        -1,
        0));
    if (mem == reinterpret_cast<void*>(-1)) {
      throw std::system_error(errno, std::system_category());
    }
#if !defined(MAP_POPULATE) && defined(MADV_WILLNEED)
    madvise(mem, size, MADV_WILLNEED);
#endif

    return mem;
  }

  void deallocate(void* p, size_t size) {
    auto len = computeSize(size);
    munmap(p, len);
  }
};

template <typename Allocator>
struct GivesZeroFilledMemory : public std::false_type {};

template <>
struct GivesZeroFilledMemory<MMapAlloc> : public std::true_type {};

} // namespace detail
} // namespace folly
