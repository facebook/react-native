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

#pragma once

#include <climits> // for PATH_MAX
#include <cstring>
#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>
#include <vector>

#include <boost/container/flat_map.hpp>
#include <boost/intrusive/list.hpp>
#include <boost/operators.hpp>
#include <glog/logging.h>

#include <folly/Range.h>
#include <folly/experimental/symbolizer/Elf.h>
#include <folly/hash/Hash.h>

namespace folly {
namespace symbolizer {

/**
 * Number of ELF files loaded by the dynamic loader.
 */
size_t countLoadedElfFiles();

class ElfCacheBase {
 public:
  virtual std::shared_ptr<ElfFile> getFile(StringPiece path) = 0;
  virtual ~ElfCacheBase() {}
};

/**
 * Cache ELF files. Async-signal-safe: does memory allocation upfront.
 *
 * Will not grow; once the capacity is reached, lookups for files that
 * aren't already in the cache will fail (return nullptr).
 *
 * Not MT-safe. May not be used concurrently from multiple threads.
 *
 * NOTE that async-signal-safety is preserved only as long as the
 * SignalSafeElfCache object exists; after the SignalSafeElfCache object
 * is destroyed, destroying returned shared_ptr<ElfFile> objects may
 * cause ElfFile objects to be destroyed, and that's not async-signal-safe.
 */
class SignalSafeElfCache : public ElfCacheBase {
 public:
  explicit SignalSafeElfCache(size_t capacity);

  std::shared_ptr<ElfFile> getFile(StringPiece path) override;

 private:
  // We can't use std::string (allocating memory is bad!) so we roll our
  // own wrapper around a fixed-size, null-terminated string.
  class Path : private boost::totally_ordered<Path> {
   public:
    Path() {
      assign(folly::StringPiece());
    }

    explicit Path(StringPiece s) {
      assign(s);
    }

    void assign(StringPiece s) {
      DCHECK_LE(s.size(), kMaxSize);
      if (!s.empty()) {
        memcpy(data_, s.data(), s.size());
      }
      data_[s.size()] = '\0';
    }

    bool operator<(const Path& other) const {
      return strcmp(data_, other.data_) < 0;
    }

    bool operator==(const Path& other) const {
      return strcmp(data_, other.data_) == 0;
    }

    const char* data() const {
      return data_;
    }

    static constexpr size_t kMaxSize = PATH_MAX - 1;

   private:
    char data_[kMaxSize + 1];
  };

  Path scratchpad_; // Preallocated key for map_ lookups.
  boost::container::flat_map<Path, int> map_;
  std::vector<std::shared_ptr<ElfFile>> slots_;
};

/**
 * General-purpose ELF file cache.
 *
 * LRU of given capacity. MT-safe (uses locking). Not async-signal-safe.
 */
class ElfCache : public ElfCacheBase {
 public:
  explicit ElfCache(size_t capacity);

  std::shared_ptr<ElfFile> getFile(StringPiece path) override;

 private:
  std::mutex mutex_;

  typedef boost::intrusive::list_member_hook<> LruLink;

  struct Entry {
    std::string path;
    ElfFile file;
    LruLink lruLink;
  };

  static std::shared_ptr<ElfFile> filePtr(const std::shared_ptr<Entry>& e);

  size_t capacity_;
  std::unordered_map<StringPiece, std::shared_ptr<Entry>, Hash> files_;

  typedef boost::intrusive::list<
      Entry,
      boost::intrusive::member_hook<Entry, LruLink, &Entry::lruLink>,
      boost::intrusive::constant_time_size<false>>
      LruList;
  LruList lruList_;
};
} // namespace symbolizer
} // namespace folly
