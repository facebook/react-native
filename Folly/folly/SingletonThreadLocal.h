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

#include <boost/intrusive/list.hpp>

#include <folly/ScopeGuard.h>
#include <folly/ThreadLocal.h>
#include <folly/detail/Singleton.h>
#include <folly/functional/Invoke.h>

namespace folly {

/// SingletonThreadLocal
///
/// Useful for a per-thread leaky-singleton model in libraries and applications.
///
/// By "leaky" it is meant that the T instances held by the instantiation
/// SingletonThreadLocal<T> will survive until their owning thread exits.
/// Therefore, they can safely be used before main() begins and after main()
/// ends, and they can also safely be used in an application that spawns many
/// temporary threads throughout its life.
///
/// Example:
///
///   struct UsefulButHasExpensiveCtor {
///     UsefulButHasExpensiveCtor(); // this is expensive
///     Result operator()(Arg arg);
///   };
///
///   Result useful(Arg arg) {
///     using Useful = UsefulButHasExpensiveCtor;
///     auto& useful = folly::SingletonThreadLocal<Useful>::get();
///     return useful(arg);
///   }
///
/// As an example use-case, the random generators in <random> are expensive to
/// construct. And their constructors are deterministic, but many cases require
/// that they be randomly seeded. So folly::Random makes good canonical uses of
/// folly::SingletonThreadLocal so that a seed is computed from the secure
/// random device once per thread, and the random generator is constructed with
/// the seed once per thread.
///
/// Keywords to help people find this class in search:
/// Thread Local Singleton ThreadLocalSingleton
template <
    typename T,
    typename Tag = detail::DefaultTag,
    typename Make = detail::DefaultMake<T>,
    typename TLTag = _t<std::conditional<
        std::is_same<Tag, detail::DefaultTag>::value,
        void,
        Tag>>>
class SingletonThreadLocal {
 private:
  struct Wrapper;

  using NodeBase = boost::intrusive::list_base_hook<
      boost::intrusive::link_mode<boost::intrusive::auto_unlink>>;

  struct Node : NodeBase {
    Wrapper*& cache;
    bool& stale;

    Node(Wrapper*& cache_, bool& stale_) : cache(cache_), stale(stale_) {
      auto& wrapper = getWrapper();
      wrapper.caches.push_front(*this);
      cache = &wrapper;
    }
    ~Node() {
      clear();
    }

    void clear() {
      cache = nullptr;
      stale = true;
    }
  };

  using List =
      boost::intrusive::list<Node, boost::intrusive::constant_time_size<false>>;

  struct Wrapper {
    template <typename S>
    using MakeRet = is_invocable_r<S, Make>;

    // keep as first field, to save 1 instr in the fast path
    union {
      alignas(alignof(T)) unsigned char storage[sizeof(T)];
      T object;
    };
    List caches;

    /* implicit */ operator T&() {
      return object;
    }

    // normal make types
    template <typename S = T, _t<std::enable_if<MakeRet<S>::value, int>> = 0>
    Wrapper() {
      (void)new (storage) S(Make{}());
    }
    // default and special make types for non-move-constructible T, until C++17
    template <typename S = T, _t<std::enable_if<!MakeRet<S>::value, int>> = 0>
    Wrapper() {
      (void)Make{}(storage);
    }
    ~Wrapper() {
      for (auto& node : caches) {
        node.clear();
      }
      caches.clear();
      object.~T();
    }
  };

  using WrapperTL = ThreadLocal<Wrapper, TLTag>;

  SingletonThreadLocal() = delete;

  FOLLY_EXPORT FOLLY_NOINLINE static WrapperTL& getWrapperTL() {
    static auto& entry = *detail::createGlobal<WrapperTL, Tag>();
    return entry;
  }

  FOLLY_NOINLINE static Wrapper& getWrapper() {
    return *getWrapperTL();
  }

#ifdef FOLLY_TLS
  FOLLY_NOINLINE static T& getSlow(Wrapper*& cache) {
    static thread_local Wrapper** check = &cache;
    CHECK_EQ(check, &cache) << "inline function static thread_local merging";
    static thread_local bool stale;
    static thread_local Node node(cache, stale);
    return !stale && node.cache ? *node.cache : getWrapper();
  }
#endif

 public:
  FOLLY_EXPORT FOLLY_ALWAYS_INLINE static T& get() {
#ifdef FOLLY_TLS
    static thread_local Wrapper* cache;
    return FOLLY_LIKELY(!!cache) ? *cache : getSlow(cache);
#else
    return getWrapper();
#endif
  }

  // Must use a unique Tag, takes a lock that is one per Tag
  static typename WrapperTL::Accessor accessAllThreads() {
    return getWrapperTL().accessAllThreads();
  }
};

} // namespace folly

/// FOLLY_DECLARE_REUSED
///
/// Useful for local variables of container types, where it is desired to avoid
/// the overhead associated with the local variable entering and leaving scope.
/// Rather, where it is desired that the memory be reused between invocations
/// of the same scope in the same thread rather than deallocated and reallocated
/// between invocations of the same scope in the same thread. Note that the
/// container will always be cleared between invocations; it is only the backing
/// memory allocation which is reused.
///
/// Example:
///
///   void traverse_perform(int root);
///   template <typename F>
///   void traverse_each_child_r(int root, F const&);
///   void traverse_depthwise(int root) {
///     // preserves some of the memory backing these per-thread data structures
///     FOLLY_DECLARE_REUSED(seen, std::unordered_set<int>);
///     FOLLY_DECLARE_REUSED(work, std::vector<int>);
///     // example algorithm that uses these per-thread data structures
///     work.push_back(root);
///     while (!work.empty()) {
///       root = work.back();
///       work.pop_back();
///       seen.insert(root);
///       traverse_perform(root);
///       traverse_each_child_r(root, [&](int item) {
///         if (!seen.count(item)) {
///           work.push_back(item);
///         }
///       });
///     }
///   }
#define FOLLY_DECLARE_REUSED(name, ...)                                        \
  struct __folly_reused_type_##name {                                          \
    __VA_ARGS__ object;                                                        \
  };                                                                           \
  auto& name =                                                                 \
      ::folly::SingletonThreadLocal<__folly_reused_type_##name>::get().object; \
  auto __folly_reused_g_##name = ::folly::makeGuard([&] { name.clear(); })
