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

#pragma once

#include <folly/FBString.h>
#include <folly/File.h>
#include <folly/Range.h>
#include <glog/logging.h>
#include <boost/noncopyable.hpp>

namespace folly {

/**
 * Maps files in memory (read-only).
 *
 * @author Tudor Bosman (tudorb@fb.com)
 */
class MemoryMapping : boost::noncopyable {
 public:
  /**
   * Lock the pages in memory?
   * TRY_LOCK  = try to lock, log warning if permission denied
   * MUST_LOCK = lock, fail assertion if permission denied.
   */
  enum class LockMode {
    TRY_LOCK,
    MUST_LOCK
  };
  /**
   * Map a portion of the file indicated by filename in memory, causing a CHECK
   * failure on error.
   *
   * By default, map the whole file.  length=-1: map from offset to EOF.
   * Unlike the mmap() system call, offset and length don't need to be
   * page-aligned.  length is clipped to the end of the file if it's too large.
   *
   * The mapping will be destroyed (and the memory pointed-to by data() will
   * likely become inaccessible) when the MemoryMapping object is destroyed.
   */
  struct Options {
    Options() {}

    // Convenience methods; return *this for chaining.
    Options& setPageSize(off_t v) { pageSize = v; return *this; }
    Options& setShared(bool v) { shared = v; return *this; }
    Options& setPrefault(bool v) { prefault = v; return *this; }
    Options& setReadable(bool v) { readable = v; return *this; }
    Options& setWritable(bool v) { writable = v; return *this; }
    Options& setGrow(bool v) { grow = v; return *this; }

    // Page size. 0 = use appropriate page size.
    // (On Linux, we use a huge page size if the file is on a hugetlbfs
    // file system, and the default page size otherwise)
    off_t pageSize = 0;

    // If shared (default), the memory mapping is shared with other processes
    // mapping the same file (or children); if not shared (private), each
    // process has its own mapping. Changes in writable, private mappings are
    // not reflected to the underlying file. See the discussion of
    // MAP_PRIVATE vs MAP_SHARED in the mmap(2) manual page.
    bool shared = true;

    // Populate page tables; subsequent accesses should not be blocked
    // by page faults. This is a hint, as it may not be supported.
    bool prefault = false;

    // Map the pages readable. Note that mapping pages without read permissions
    // is not universally supported (not supported on hugetlbfs on Linux, for
    // example)
    bool readable = true;

    // Map the pages writable.
    bool writable = false;

    // When mapping a file in writable mode, grow the file to the requested
    // length (using ftruncate()) before mapping; if false, truncate the
    // mapping to the actual file size instead.
    bool grow = false;

    // Fix map at this address, if not nullptr. Must be aligned to a multiple
    // of the appropriate page size.
    void* address = nullptr;
  };

  // Options to emulate the old WritableMemoryMapping: readable and writable,
  // allow growing the file if mapping past EOF.
  static Options writable() {
    return Options().setWritable(true).setGrow(true);
  }

  enum AnonymousType {
    kAnonymous
  };

  /**
   * Create an anonymous mapping.
   */
  MemoryMapping(AnonymousType, off_t length, Options options=Options());

  explicit MemoryMapping(File file,
                         off_t offset=0,
                         off_t length=-1,
                         Options options=Options());

  explicit MemoryMapping(const char* name,
                         off_t offset=0,
                         off_t length=-1,
                         Options options=Options());

  explicit MemoryMapping(int fd,
                         off_t offset=0,
                         off_t length=-1,
                         Options options=Options());

  MemoryMapping(MemoryMapping&&) noexcept;

  ~MemoryMapping();

  MemoryMapping& operator=(MemoryMapping);

  void swap(MemoryMapping& other) noexcept;

  /**
   * Lock the pages in memory
   */
  bool mlock(LockMode lock);

  /**
   * Unlock the pages.
   * If dontneed is true, the kernel is instructed to release these pages
   * (per madvise(MADV_DONTNEED)).
   */
  void munlock(bool dontneed = false);

  /**
   * Hint that these pages will be scanned linearly.
   * madvise(MADV_SEQUENTIAL)
   */
  void hintLinearScan();

  /**
   * Advise the kernel about memory access.
   */
  void advise(int advice) const;
  void advise(int advice, size_t offset, size_t length) const;

  /**
   * A bitwise cast of the mapped bytes as range of values. Only intended for
   * use with POD or in-place usable types.
   */
  template<class T>
  Range<const T*> asRange() const {
    size_t count = data_.size() / sizeof(T);
    return Range<const T*>(static_cast<const T*>(
                             static_cast<const void*>(data_.data())),
                           count);
  }

  /**
   * A range of bytes mapped by this mapping.
   */
  ByteRange range() const {
    return data_;
  }

  /**
   * A bitwise cast of the mapped bytes as range of mutable values. Only
   * intended for use with POD or in-place usable types.
   */
  template<class T>
  Range<T*> asWritableRange() const {
    DCHECK(options_.writable);  // you'll segfault anyway...
    size_t count = data_.size() / sizeof(T);
    return Range<T*>(static_cast<T*>(
                       static_cast<void*>(data_.data())),
                     count);
  }

  /**
   * A range of mutable bytes mapped by this mapping.
   */
  MutableByteRange writableRange() const {
    DCHECK(options_.writable);  // you'll segfault anyway...
    return data_;
  }

  /**
   * Return the memory area where the file was mapped.
   * Deprecated; use range() instead.
   */
  StringPiece data() const {
    return asRange<const char>();
  }

  bool mlocked() const {
    return locked_;
  }

  int fd() const { return file_.fd(); }

 private:
  MemoryMapping();

  enum InitFlags {
    kGrow = 1 << 0,
    kAnon = 1 << 1,
  };
  void init(off_t offset, off_t length);

  File file_;
  void* mapStart_ = nullptr;
  off_t mapLength_ = 0;
  Options options_;
  bool locked_ = false;
  MutableByteRange data_;
};

void swap(MemoryMapping&, MemoryMapping&) noexcept;

/**
 * A special case of memcpy() that always copies memory forwards.
 * (libc's memcpy() is allowed to copy memory backwards, and will do so
 * when using SSSE3 instructions).
 *
 * Assumes src and dest are aligned to alignof(unsigned long).
 *
 * Useful when copying from/to memory mappings after hintLinearScan();
 * copying backwards renders any prefetching useless (even harmful).
 */
void alignedForwardMemcpy(void* dest, const void* src, size_t size);

/**
 * Copy a file using mmap(). Overwrites dest.
 */
void mmapFileCopy(const char* src, const char* dest, mode_t mode = 0666);

}  // namespace folly
