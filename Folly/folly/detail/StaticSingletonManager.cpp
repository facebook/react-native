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

#include <folly/detail/StaticSingletonManager.h>

#include <mutex>
#include <typeindex>
#include <unordered_map>

namespace folly {
namespace detail {

namespace {

class StaticSingletonManagerImpl {
 public:
  void* create(std::type_info const& key, void* (*make)(void*), void* ctx) {
    auto& e = entry(key);
    std::lock_guard<std::mutex> lock(e.mutex);
    return e.ptr ? e.ptr : (e.ptr = make(ctx));
  }

 private:
  struct Entry {
    void* ptr{};
    std::mutex mutex;
  };

  Entry& entry(std::type_info const& key) {
    std::lock_guard<std::mutex> lock(mutex_);
    auto& e = map_[key];
    return e ? *e : *(e = new Entry());
  }

  std::unordered_map<std::type_index, Entry*> map_;
  std::mutex mutex_;
};

} // namespace

void* StaticSingletonManager::create_(Key const& key, Make* make, void* ctx) {
  // This Leaky Meyers Singleton must always live in the .cpp file.
  static auto& instance = *new StaticSingletonManagerImpl();
  return instance.create(key, make, ctx);
}

} // namespace detail
} // namespace folly
