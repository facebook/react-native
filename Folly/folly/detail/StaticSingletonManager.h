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

#include <cassert>
#include <mutex>
#include <typeindex>
#include <unordered_map>

namespace folly {
namespace detail {

// This internal-use-only class is used to create all leaked Meyers singletons.
// It guarantees that only one instance of every such singleton will ever be
// created, even when requested from different compilation units linked
// dynamically.
class StaticSingletonManager {
 public:
  static StaticSingletonManager& instance();

  template <typename T, typename Tag, typename F>
  inline T* create(F&& creator) {
    auto& entry = [&]() mutable -> Entry<T>& {
      std::lock_guard<std::mutex> lg(mutex_);

      auto& id = typeid(TypePair<T, Tag>);
      auto& entryPtr = map_[id];
      if (!entryPtr) {
        entryPtr = new Entry<T>();
      }
      assert(dynamic_cast<Entry<T>*>(entryPtr) != nullptr);
      return *static_cast<Entry<T>*>(entryPtr);
    }();

    std::lock_guard<std::mutex> lg(entry.mutex);

    if (!entry.ptr) {
      entry.ptr = creator();
    }
    return entry.ptr;
  }

 private:
  template <typename A, typename B>
  class TypePair {};

  StaticSingletonManager() {}

  struct EntryIf {
    virtual ~EntryIf() {}
  };

  template <typename T>
  struct Entry : public EntryIf {
    T* ptr{nullptr};
    std::mutex mutex;
  };

  std::unordered_map<std::type_index, EntryIf*> map_;
  std::mutex mutex_;
};

template <typename T, typename Tag, typename F>
inline T* createGlobal(F&& creator) {
  return StaticSingletonManager::instance().create<T, Tag>(
      std::forward<F>(creator));
}

template <typename T, typename Tag>
inline T* createGlobal() {
  return createGlobal<T, Tag>([]() { return new T(); });
}
}
}
