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

// http://www.canonware.com/download/jemalloc/jemalloc-latest/doc/jemalloc.html

#pragma once

#include <folly/portability/Config.h>

#ifdef FOLLY_HAVE_LIBJEMALLOC

#include <folly/portability/SysMman.h>
#include <jemalloc/jemalloc.h>

#if (JEMALLOC_VERSION_MAJOR > 3) && defined(MADV_DONTDUMP)
#define FOLLY_JEMALLOC_NODUMP_ALLOCATOR_SUPPORTED 1
#endif

#endif // FOLLY_HAVE_LIBJEMALLOC

#include <cstddef>

namespace folly {

/**
 * An allocator which uses Jemalloc to create an dedicated arena to allocate
 * memory from. The only special property set on the allocated memory is that
 * the memory is not dump-able.
 *
 * This is done by setting MADV_DONTDUMP using the `madvise` system call. A
 * custom hook installed which is called when allocating a new chunk of memory.
 * All it does is call the original jemalloc hook to allocate the memory and
 * then set the advise on it before returning the pointer to the allocated
 * memory. Jemalloc does not use allocated chunks across different arenas,
 * without `munmap`-ing them first, and the advises are not sticky i.e. they are
 * unset if `munmap` is done. Also this arena can't be used by any other part of
 * the code by just calling `malloc`.
 *
 * If target system doesn't support MADV_DONTDUMP or jemalloc doesn't support
 * custom arena hook, JemallocNodumpAllocator would fall back to using malloc /
 * free. Such behavior can be identified by using
 * !defined(FOLLY_JEMALLOC_NODUMP_ALLOCATOR_SUPPORTED).
 *
 * Similarly, if binary isn't linked with jemalloc, the logic would fall back to
 * malloc / free.
 */
class JemallocNodumpAllocator {
 public:
  enum class State {
    ENABLED,
    DISABLED,
  };

  // To be used as IOBuf::FreeFunction, userData should be set to
  // reinterpret_cast<void*>(getFlags()).
  static void deallocate(void* p, void* userData);

  explicit JemallocNodumpAllocator(State state = State::ENABLED);

  void* allocate(size_t size);
  void* reallocate(void* p, size_t size);
  void deallocate(void* p);

  unsigned getArenaIndex() const { return arena_index_; }
  int getFlags() const { return flags_; }

 private:
#ifdef FOLLY_JEMALLOC_NODUMP_ALLOCATOR_SUPPORTED
  static chunk_alloc_t* original_chunk_alloc_;
  static void* chunk_alloc(void* chunk,
                           size_t size,
                           size_t alignment,
                           bool* zero,
                           bool* commit,
                           unsigned arena_ind);
#endif // FOLLY_JEMALLOC_NODUMP_ALLOCATOR_SUPPORTED

  bool extend_and_setup_arena();

  unsigned arena_index_{0};
  int flags_{0};
};

/**
 * JemallocNodumpAllocator singleton.
 */
JemallocNodumpAllocator& globalJemallocNodumpAllocator();

} // folly
