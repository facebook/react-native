/*
 * Copyright 2014-present Facebook, Inc.
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

#include <folly/experimental/symbolizer/ElfCache.h>

#include <link.h>

/*
 * This is declared in `link.h' on Linux platforms, but apparently not on the
 * Mac version of the file.  It's harmless to declare again, in any case.
 *
 * Note that declaring it with `extern "C"` results in linkage conflicts.
 */
extern struct r_debug _r_debug;

namespace folly {
namespace symbolizer {

size_t countLoadedElfFiles() {
  // _r_debug synchronization is... lacking to say the least. It's
  // meant as an aid for debuggers and synchronization is done by
  // calling dl_debug_state() which debuggers are supposed to
  // intercept by setting a breakpoint on.

  // Can't really do that here, so we apply the hope-and-pray strategy.
  if (_r_debug.r_version != 1 || _r_debug.r_state != r_debug::RT_CONSISTENT) {
    // computo ergo sum
    return 1;
  }

  //     r_map       -> head of a linked list of 'link_map_t' entries,
  //                    one per ELF 'binary' in the process address space.
  size_t count = 0;
  for (auto lmap = _r_debug.r_map; lmap != nullptr; lmap = lmap->l_next) {
    ++count;
  }
  return count;
}

SignalSafeElfCache::SignalSafeElfCache(size_t capacity) {
  map_.reserve(capacity);
  slots_.reserve(capacity);

  // Preallocate
  for (size_t i = 0; i < capacity; ++i) {
    slots_.push_back(std::make_shared<ElfFile>());
  }
}

std::shared_ptr<ElfFile> SignalSafeElfCache::getFile(StringPiece p) {
  if (p.size() > Path::kMaxSize) {
    return nullptr;
  }

  scratchpad_.assign(p);
  auto pos = map_.find(scratchpad_);
  if (pos != map_.end()) {
    return slots_[pos->second];
  }

  size_t n = map_.size();
  if (n >= slots_.size()) {
    DCHECK_EQ(map_.size(), slots_.size());
    return nullptr;
  }

  auto& f = slots_[n];

  const char* msg = "";
  int r = f->openAndFollow(scratchpad_.data(), true, &msg);
  if (r != ElfFile::kSuccess) {
    return nullptr;
  }

  map_[scratchpad_] = n;
  return f;
}

ElfCache::ElfCache(size_t capacity) : capacity_(capacity) {}

std::shared_ptr<ElfFile> ElfCache::getFile(StringPiece p) {
  std::lock_guard<std::mutex> lock(mutex_);

  auto pos = files_.find(p);
  if (pos != files_.end()) {
    // Found, move to back (MRU)
    auto& entry = pos->second;
    lruList_.erase(lruList_.iterator_to(*entry));
    lruList_.push_back(*entry);
    return filePtr(entry);
  }

  auto entry = std::make_shared<Entry>();
  entry->path = p.str();
  auto& path = entry->path;

  // No negative caching
  const char* msg = "";
  int r = entry->file.openAndFollow(path.c_str(), true, &msg);
  if (r != ElfFile::kSuccess) {
    return nullptr;
  }

  if (files_.size() == capacity_) {
    auto& e = lruList_.front();
    lruList_.pop_front();
    files_.erase(e.path);
  }

  files_.emplace(entry->path, entry);
  lruList_.push_back(*entry);

  return filePtr(entry);
}

std::shared_ptr<ElfFile> ElfCache::filePtr(const std::shared_ptr<Entry>& e) {
  // share ownership
  return std::shared_ptr<ElfFile>(e, &e->file);
}
} // namespace symbolizer
} // namespace folly
