#pragma once

#include <atomic>
#include <stdint.h>

#include <folly/portability/SysMman.h>
#include <folly/portability/Unistd.h>

namespace folly { namespace detail {

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

    // MAP_HUGETLB is a perf win, but requires cooperation from the
    // deployment environment (and a change to computeSize()).
    void* mem = static_cast<void*>(mmap(
        nullptr,
        len,
        PROT_READ | PROT_WRITE,
        MAP_PRIVATE | MAP_ANONYMOUS
#ifdef MAP_POPULATE
            |
            MAP_POPULATE
#endif
        ,
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

template<typename Allocator>
struct GivesZeroFilledMemory : public std::false_type {};

template<>
struct GivesZeroFilledMemory<MMapAlloc> : public std::true_type{};

}}
