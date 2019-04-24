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

#pragma once

#include <typeinfo>

#include <folly/CPortability.h>

namespace folly {
namespace detail {

// This internal-use-only class is used to create all leaked Meyers singletons.
// It guarantees that only one instance of every such singleton will ever be
// created, even when requested from different compilation units linked
// dynamically.
class StaticSingletonManager {
 public:
  template <typename T, typename Tag, typename F>
  FOLLY_ALWAYS_INLINE FOLLY_ATTR_VISIBILITY_HIDDEN static T* create(
      F&& creator) {
    return static_cast<T*>(create_<T, Tag>(creator));
  }

 private:
  template <typename A, typename B>
  struct TypePair {};

  using Key = std::type_info;
  using Make = void*(void*);

  template <typename F>
  struct Creator {
    static void* create(void* f) {
      return static_cast<void*>((*static_cast<F*>(f))());
    }
  };

  template <typename T, typename Tag, typename F>
  FOLLY_ALWAYS_INLINE FOLLY_ATTR_VISIBILITY_HIDDEN static void* create_(
      F& creator) {
    auto const& key = typeid(TypePair<T, Tag>);
    return create_(key, &Creator<F>::create, &creator);
  }

  template <typename T, typename Tag, typename F>
  FOLLY_ALWAYS_INLINE FOLLY_ATTR_VISIBILITY_HIDDEN static void* create_(
      F const& creator) {
    auto const& key = typeid(TypePair<T, Tag>);
    return create_(key, &Creator<F const>::create, const_cast<F*>(&creator));
  }

  FOLLY_NOINLINE static void* create_(Key const& key, Make* make, void* ctx);
};

template <typename T, typename Tag, typename F>
FOLLY_ALWAYS_INLINE FOLLY_ATTR_VISIBILITY_HIDDEN T* createGlobal(F&& creator) {
  return StaticSingletonManager::create<T, Tag>(static_cast<F&&>(creator));
}

template <typename T, typename Tag>
FOLLY_ALWAYS_INLINE FOLLY_ATTR_VISIBILITY_HIDDEN T* createGlobal() {
  return StaticSingletonManager::create<T, Tag>([]() { return new T(); });
}

} // namespace detail
} // namespace folly
