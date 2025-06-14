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
    insert(key, value);
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

  /*
   * Sets a key-value pair in the LRU cache.
   * Can be called from any thread.
   */
  void set(const KeyT& key, const ValueT& value) const {
    std::lock_guard<std::mutex> lock(mutex_);
    if (auto it = map_.find(key); it != map_.end()) {
      // Update existing value and move to front of list
      it->second->second = value;
      list_.splice(list_.begin(), list_, it->second);
    } else {
      insert(key, value);
    }
  }

 private:
  void insert(const KeyT& key, const ValueT& value) const {
    // Add new value to front of list and map
    list_.emplace_front(key, value);
    map_[key] = list_.begin();
    if (list_.size() > maxSize_) {
      // Evict least recently used item (back of list)
      map_.erase(list_.back().first);
      list_.pop_back();
    }
  }

  using iterator = typename std::list<std::pair<KeyT, ValueT>>::iterator;

  size_t maxSize_;
  mutable std::mutex mutex_;
  mutable std::list<std::pair<KeyT, ValueT>> list_;
  mutable std::unordered_map<KeyT, iterator> map_;
};

} // namespace facebook::react
