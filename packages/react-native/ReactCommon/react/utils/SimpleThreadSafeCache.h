/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <concepts>
#include <list>
#include <mutex>
#include <unordered_map>

namespace facebook::react {

template <typename GeneratorT, typename ValueT>
concept CacheGeneratorFunction = std::invocable<GeneratorT> &&
    std::same_as<std::invoke_result_t<GeneratorT>, ValueT>;

/*
 * Simple thread-safe LRU cache.
 *
 * TODO T228961279: The maxSize template parameter should be removed, since it
 * may be overriden by the constructor.
 */
template <typename KeyT, typename ValueT, int maxSize>
class SimpleThreadSafeCache {
 public:
  SimpleThreadSafeCache() : maxSize_(maxSize) {}
  SimpleThreadSafeCache(unsigned long size) : maxSize_{size} {}

  /*
   * Returns a value from the map with a given key.
   * If the value wasn't found in the cache, constructs the value using given
   * generator function, stores it inside a cache and returns it.
   * Can be called from any thread.
   */
  ValueT get(const KeyT& key, CacheGeneratorFunction<ValueT> auto generator)
      const {
    std::lock_guard<std::mutex> lock(mutex_);

    if (auto it = map_.find(key); it != map_.end()) {
      // Move accessed item to front of list
      list_.splice(list_.begin(), list_, it->second);
      return it->second->second;
    }

    auto value = generator();
    // Add new value to front of list and map
    list_.emplace_front(key, value);
    map_[key] = list_.begin();
    if (list_.size() > maxSize_) {
      // Evict least recently used item (back of list)
      map_.erase(list_.back().first);
      list_.pop_back();
    }
    return value;
  }

  /*
   * Returns a value from the map with a given key.
   * If the value wasn't found in the cache, returns empty optional.
   * Can be called from any thread.
   */
  std::optional<ValueT> get(const KeyT& key) const {
    std::lock_guard<std::mutex> lock(mutex_);

    if (auto it = map_.find(key); it != map_.end()) {
      // Move accessed item to front of list
      list_.splice(list_.begin(), list_, it->second);
      return it->second->second;
    }

    return ValueT{};
  }

 private:
  using EntryT = std::pair<KeyT, ValueT>;
  using iterator = typename std::list<EntryT>::iterator;

  size_t maxSize_;
  mutable std::mutex mutex_;
  mutable std::list<EntryT> list_;
  mutable std::unordered_map<KeyT, iterator> map_;
};

} // namespace facebook::react
