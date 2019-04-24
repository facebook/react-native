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

#include <folly/portability/SysMman.h>

#ifdef _WIN32

#include <cassert>

#include <folly/Portability.h>
#include <folly/portability/Windows.h>

static bool mmap_to_page_protection(int prot, DWORD& ret, DWORD& acc) {
  if (prot == PROT_NONE) {
    ret = PAGE_NOACCESS;
    acc = 0;
  } else if (prot == PROT_READ) {
    ret = PAGE_READONLY;
    acc = FILE_MAP_READ;
  } else if (prot == PROT_EXEC) {
    ret = PAGE_EXECUTE;
    acc = FILE_MAP_EXECUTE;
  } else if (prot == (PROT_READ | PROT_EXEC)) {
    ret = PAGE_EXECUTE_READ;
    acc = FILE_MAP_READ | FILE_MAP_EXECUTE;
  } else if (prot == (PROT_READ | PROT_WRITE)) {
    ret = PAGE_READWRITE;
    acc = FILE_MAP_READ | FILE_MAP_WRITE;
  } else if (prot == (PROT_READ | PROT_WRITE | PROT_EXEC)) {
    ret = PAGE_EXECUTE_READWRITE;
    acc = FILE_MAP_READ | FILE_MAP_WRITE | FILE_MAP_EXECUTE;
  } else {
    return false;
  }
  return true;
}

static size_t alignToAllocationGranularity(size_t s) {
  static size_t granularity = [] {
    static SYSTEM_INFO inf;
    GetSystemInfo(&inf);
    return inf.dwAllocationGranularity;
  }();
  return (s + granularity - 1) / granularity * granularity;
}

extern "C" {
int madvise(const void* /* addr */, size_t /* len */, int /* advise */) {
  // We do nothing at all.
  // Could probably implement dontneed via VirtualAlloc
  // with the MEM_RESET and MEM_RESET_UNDO flags.
  return 0;
}

int mlock(const void* addr, size_t len) {
  // For some strange reason, it's allowed to
  // lock a nullptr as long as length is zero.
  // VirtualLock doesn't allow it, so handle
  // it specially.
  if (addr == nullptr && len == 0) {
    return 0;
  }
  if (!VirtualLock((void*)addr, len)) {
    return -1;
  }
  return 0;
}

namespace {
constexpr uint32_t kMMapLengthMagic = 0xFACEB00C;
struct MemMapDebugTrailer {
  size_t length;
  uint32_t magic;
};
} // namespace

void* mmap(void* addr, size_t length, int prot, int flags, int fd, off_t off) {
  // Make sure it's something we support first.

  // No Anon shared.
  if ((flags & (MAP_ANONYMOUS | MAP_SHARED)) == (MAP_ANONYMOUS | MAP_SHARED)) {
    return MAP_FAILED;
  }
  // No private copy on write.
  if ((flags & MAP_PRIVATE) == MAP_PRIVATE && fd != -1) {
    return MAP_FAILED;
  }
  // Map isn't anon, must be file backed.
  if (!(flags & MAP_ANONYMOUS) && fd == -1) {
    return MAP_FAILED;
  }

  DWORD newProt;
  DWORD accessFlags;
  if (!mmap_to_page_protection(prot, newProt, accessFlags)) {
    return MAP_FAILED;
  }

  void* ret;
  if (!(flags & MAP_ANONYMOUS) || (flags & MAP_SHARED)) {
    HANDLE h = INVALID_HANDLE_VALUE;
    if (!(flags & MAP_ANONYMOUS)) {
      h = (HANDLE)_get_osfhandle(fd);
    }

    HANDLE fmh = CreateFileMapping(
        h,
        nullptr,
        newProt,
        (DWORD)((length >> 32) & 0xFFFFFFFF),
        (DWORD)(length & 0xFFFFFFFF),
        nullptr);
    if (fmh == nullptr) {
      return MAP_FAILED;
    }
    ret = MapViewOfFileEx(
        fmh,
        accessFlags,
        (DWORD)(0), // off_t is only 32-bit :(
        (DWORD)(off & 0xFFFFFFFF),
        0,
        addr);
    if (ret == nullptr) {
      ret = MAP_FAILED;
    }
    CloseHandle(fmh);
  } else {
    auto baseLength = length;
    if (folly::kIsDebug) {
      // In debug mode we keep track of the length to make
      // sure you're only munmapping the entire thing if
      // we're using VirtualAlloc.
      length += sizeof(MemMapDebugTrailer);
    }

    // VirtualAlloc rounds size down to a multiple
    // of the system allocation granularity :(
    length = alignToAllocationGranularity(length);
    ret = VirtualAlloc(addr, length, MEM_COMMIT | MEM_RESERVE, newProt);
    if (ret == nullptr) {
      return MAP_FAILED;
    }

    if (folly::kIsDebug) {
      auto deb = (MemMapDebugTrailer*)((char*)ret + baseLength);
      deb->length = baseLength;
      deb->magic = kMMapLengthMagic;
    }
  }

  // TODO: Could technically implement MAP_POPULATE via PrefetchVirtualMemory
  //       Should also see about implementing MAP_NORESERVE
  return ret;
}

int mprotect(void* addr, size_t size, int prot) {
  DWORD newProt;
  DWORD access;
  if (!mmap_to_page_protection(prot, newProt, access)) {
    return -1;
  }

  DWORD oldProt;
  BOOL res = VirtualProtect(addr, size, newProt, &oldProt);
  if (!res) {
    return -1;
  }
  return 0;
}

int munlock(const void* addr, size_t length) {
  // See comment in mlock
  if (addr == nullptr && length == 0) {
    return 0;
  }
  if (!VirtualUnlock((void*)addr, length)) {
    return -1;
  }
  return 0;
}

int munmap(void* addr, size_t length) {
  // Try to unmap it as a file, otherwise VirtualFree.
  if (!UnmapViewOfFile(addr)) {
    if (folly::kIsDebug) {
      // We can't do partial unmapping with Windows, so
      // assert that we aren't trying to do that if we're
      // in debug mode.
      MEMORY_BASIC_INFORMATION inf;
      VirtualQuery(addr, &inf, sizeof(inf));
      assert(inf.AllocationBase == addr);

      auto deb = (MemMapDebugTrailer*)((char*)addr + length);
      assert(deb->length == length);
      assert(deb->magic == kMMapLengthMagic);
    }
    if (!VirtualFree(addr, 0, MEM_RELEASE)) {
      return -1;
    }
    return 0;
  }
  return 0;
}
}

#endif
