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

#include <folly/ThreadCachedArena.h>

#include <memory>

namespace folly {

ThreadCachedArena::ThreadCachedArena(size_t minBlockSize, size_t maxAlign)
  : minBlockSize_(minBlockSize), maxAlign_(maxAlign) {
}

SysArena* ThreadCachedArena::allocateThreadLocalArena() {
  SysArena* arena =
    new SysArena(minBlockSize_, SysArena::kNoSizeLimit, maxAlign_);
  auto disposer = [this] (SysArena* t, TLPDestructionMode mode) {
    std::unique_ptr<SysArena> tp(t);  // ensure it gets deleted
    if (mode == TLPDestructionMode::THIS_THREAD) {
      zombify(std::move(*t));
    }
  };
  arena_.reset(arena, disposer);
  return arena;
}

void ThreadCachedArena::zombify(SysArena&& arena) {
  zombies_->merge(std::move(arena));
}

size_t ThreadCachedArena::totalSize() const {
  size_t result = sizeof(ThreadCachedArena);
  for (const auto& arena : arena_.accessAllThreads()) {
    result += arena.totalSize();
  }
  result += zombies_->totalSize() - sizeof(SysArena);
  return result;
}

}  // namespace folly
