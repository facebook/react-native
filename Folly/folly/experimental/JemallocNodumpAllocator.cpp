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

#include <folly/experimental/JemallocNodumpAllocator.h>

#include <folly/Conv.h>
#include <folly/String.h>
#include <folly/memory/Malloc.h>
#include <glog/logging.h>

namespace folly {

JemallocNodumpAllocator::JemallocNodumpAllocator(State state) {
  if (state == State::ENABLED && extend_and_setup_arena()) {
    LOG(INFO) << "Set up arena: " << arena_index_;
  }
}

bool JemallocNodumpAllocator::extend_and_setup_arena() {
#ifdef FOLLY_JEMALLOC_NODUMP_ALLOCATOR_SUPPORTED
  if (mallctl == nullptr) {
    // Not linked with jemalloc.
    return false;
  }

  size_t len = sizeof(arena_index_);
  if (auto ret = mallctl(
#ifdef FOLLY_JEMALLOC_NODUMP_ALLOCATOR_CHUNK
          "arenas.extend"
#else
          "arenas.create"
#endif
          ,
          &arena_index_,
          &len,
          nullptr,
          0)) {
    LOG(FATAL) << "Unable to extend arena: " << errnoStr(ret);
  }
  flags_ = MALLOCX_ARENA(arena_index_) | MALLOCX_TCACHE_NONE;

#ifdef FOLLY_JEMALLOC_NODUMP_ALLOCATOR_CHUNK
  const auto key =
      folly::to<std::string>("arena.", arena_index_, ".chunk_hooks");
  chunk_hooks_t hooks;
  len = sizeof(hooks);
  // Read the existing hooks
  if (auto ret = mallctl(key.c_str(), &hooks, &len, nullptr, 0)) {
    LOG(FATAL) << "Unable to get the hooks: " << errnoStr(ret);
  }
  if (original_alloc_ == nullptr) {
    original_alloc_ = hooks.alloc;
  } else {
    DCHECK_EQ(original_alloc_, hooks.alloc);
  }

  // Set the custom hook
  hooks.alloc = &JemallocNodumpAllocator::alloc;
  if (auto ret =
          mallctl(key.c_str(), nullptr, nullptr, &hooks, sizeof(hooks))) {
    LOG(FATAL) << "Unable to set the hooks: " << errnoStr(ret);
  }
#else
  const auto key =
      folly::to<std::string>("arena.", arena_index_, ".extent_hooks");
  extent_hooks_t* hooks;
  len = sizeof(hooks);
  // Read the existing hooks
  if (auto ret = mallctl(key.c_str(), &hooks, &len, nullptr, 0)) {
    LOG(FATAL) << "Unable to get the hooks: " << errnoStr(ret);
  }
  if (original_alloc_ == nullptr) {
    original_alloc_ = hooks->alloc;
  } else {
    DCHECK_EQ(original_alloc_, hooks->alloc);
  }

  // Set the custom hook
  extent_hooks_ = *hooks;
  extent_hooks_.alloc = &JemallocNodumpAllocator::alloc;
  extent_hooks_t* new_hooks = &extent_hooks_;
  if (auto ret = mallctl(
          key.c_str(), nullptr, nullptr, &new_hooks, sizeof(new_hooks))) {
    LOG(FATAL) << "Unable to set the hooks: " << errnoStr(ret);
  }
#endif

  return true;
#else // FOLLY_JEMALLOC_NODUMP_ALLOCATOR_SUPPORTED
  return false;
#endif // FOLLY_JEMALLOC_NODUMP_ALLOCATOR_SUPPORTED
}

void* JemallocNodumpAllocator::allocate(size_t size) {
  return mallocx != nullptr ? mallocx(size, flags_) : malloc(size);
}

void* JemallocNodumpAllocator::reallocate(void* p, size_t size) {
  return rallocx != nullptr ? rallocx(p, size, flags_) : realloc(p, size);
}

#ifdef FOLLY_JEMALLOC_NODUMP_ALLOCATOR_SUPPORTED

#ifdef FOLLY_JEMALLOC_NODUMP_ALLOCATOR_CHUNK
chunk_alloc_t* JemallocNodumpAllocator::original_alloc_ = nullptr;
void* JemallocNodumpAllocator::alloc(
    void* chunk,
#else
extent_hooks_t JemallocNodumpAllocator::extent_hooks_;
extent_alloc_t* JemallocNodumpAllocator::original_alloc_ = nullptr;
void* JemallocNodumpAllocator::alloc(
    extent_hooks_t* extent,
    void* new_addr,
#endif
    size_t size,
    size_t alignment,
    bool* zero,
    bool* commit,
    unsigned arena_ind) {
  void* result = original_alloc_(
      JEMALLOC_CHUNK_OR_EXTENT,
#ifdef FOLLY_JEMALLOC_NODUMP_ALLOCATOR_EXTENT
      new_addr,
#endif
      size,
      alignment,
      zero,
      commit,
      arena_ind);
  if (result != nullptr) {
    if (auto ret = madvise(result, size, MADV_DONTDUMP)) {
      VLOG(1) << "Unable to madvise(MADV_DONTDUMP): " << errnoStr(ret);
    }
  }

  return result;
}

#endif // FOLLY_JEMALLOC_NODUMP_ALLOCATOR_SUPPORTED

void JemallocNodumpAllocator::deallocate(void* p, size_t) {
  dallocx != nullptr ? dallocx(p, flags_) : free(p);
}

void JemallocNodumpAllocator::deallocate(void* p, void* userData) {
  const uint64_t flags = reinterpret_cast<uint64_t>(userData);
  dallocx != nullptr ? dallocx(p, static_cast<int>(flags)) : free(p);
}

JemallocNodumpAllocator& globalJemallocNodumpAllocator() {
  static auto instance = new JemallocNodumpAllocator();
  return *instance;
}

} // namespace folly
