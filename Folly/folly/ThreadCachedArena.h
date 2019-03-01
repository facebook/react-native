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

#include <type_traits>

#include <folly/Arena.h>
#include <folly/Likely.h>
#include <folly/Synchronized.h>
#include <folly/ThreadLocal.h>

namespace folly {

/**
 * Thread-caching arena: allocate memory which gets freed when the arena gets
 * destroyed.
 *
 * The arena itself allocates memory using malloc() in blocks of
 * at least minBlockSize bytes.
 *
 * For speed, each thread gets its own Arena (see Arena.h); when threads
 * exit, the Arena gets merged into a "zombie" Arena, which will be deallocated
 * when the ThreadCachedArena object is destroyed.
 */
class ThreadCachedArena {
 public:
  explicit ThreadCachedArena(
      size_t minBlockSize = SysArena::kDefaultMinBlockSize,
      size_t maxAlign = SysArena::kDefaultMaxAlign);

  void* allocate(size_t size) {
    SysArena* arena = arena_.get();
    if (UNLIKELY(!arena)) {
      arena = allocateThreadLocalArena();
    }

    return arena->allocate(size);
  }

  void deallocate(void* /* p */) {
    // Deallocate? Never!
  }

  // Gets the total memory used by the arena
  size_t totalSize() const;

 private:
  struct ThreadLocalPtrTag {};

  ThreadCachedArena(const ThreadCachedArena&) = delete;
  ThreadCachedArena(ThreadCachedArena&&) = delete;
  ThreadCachedArena& operator=(const ThreadCachedArena&) = delete;
  ThreadCachedArena& operator=(ThreadCachedArena&&) = delete;

  SysArena* allocateThreadLocalArena();

  // Zombify the blocks in arena, saving them for deallocation until
  // the ThreadCachedArena is destroyed.
  void zombify(SysArena&& arena);

  const size_t minBlockSize_;
  const size_t maxAlign_;

  ThreadLocalPtr<SysArena, ThreadLocalPtrTag> arena_;  // Per-thread arena.

  // Allocations from threads that are now dead.
  Synchronized<SysArena> zombies_;
};

template <>
struct IsArenaAllocator<ThreadCachedArena> : std::true_type { };

}  // namespace folly
