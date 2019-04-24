/*
 * Copyright 2017-present Facebook, Inc.
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
#include <atomic>
#include <memory>

#include <folly/lang/SafeAssert.h>

namespace folly {
namespace detail {

// This implementation is specific to libstdc++, now accepting
// diffs for other libraries.

// Specifically, this adds support for two things:
// 1) incrementing/decrementing the shared count by more than 1 at a time
// 2) Getting the thing the shared_ptr points to, which may be different from
//    the aliased pointer.

class shared_ptr_internals {
 public:
  template <typename T, typename... Args>
  static std::shared_ptr<T> make_ptr(Args&&... args) {
    return std::make_shared<T>(std::forward<Args...>(args...));
  }
  typedef std::__shared_count<std::_S_atomic> shared_count;
  typedef std::_Sp_counted_base<std::_S_atomic> counted_base;
  template <typename T>
  using CountedPtr = std::shared_ptr<T>;

  template <typename T>
  static counted_base* get_counted_base(const std::shared_ptr<T>& bar);

  static void inc_shared_count(counted_base* base, long count);

  template <typename T>
  static void release_shared(counted_base* base, long count);

  template <typename T>
  static T* get_shared_ptr(counted_base* base);

  template <typename T>
  static T* release_ptr(std::shared_ptr<T>& p);

  template <typename T>
  static std::shared_ptr<T> get_shared_ptr_from_counted_base(
      counted_base* base,
      bool inc = true);

 private:
  /* Accessors for private members using explicit template instantiation */
  struct access_shared_ptr {
    typedef shared_count std::__shared_ptr<const void, std::_S_atomic>::*type;
    friend type fieldPtr(access_shared_ptr);
  };

  struct access_base {
    typedef counted_base* shared_count::*type;
    friend type fieldPtr(access_base);
  };

  struct access_use_count {
    typedef _Atomic_word counted_base::*type;
    friend type fieldPtr(access_use_count);
  };

  struct access_weak_count {
    typedef _Atomic_word counted_base::*type;
    friend type fieldPtr(access_weak_count);
  };

  struct access_counted_ptr_ptr {
    typedef const void* std::_Sp_counted_ptr<const void*, std::_S_atomic>::*
        type;
    friend type fieldPtr(access_counted_ptr_ptr);
  };

  struct access_shared_ptr_ptr {
    typedef const void* std::__shared_ptr<const void, std::_S_atomic>::*type;
    friend type fieldPtr(access_shared_ptr_ptr);
  };

  struct access_refcount {
    typedef shared_count std::__shared_ptr<const void, std::_S_atomic>::*type;
    friend type fieldPtr(access_refcount);
  };

  template <typename Tag, typename Tag::type M>
  struct Rob {
    friend typename Tag::type fieldPtr(Tag) {
      return M;
    }
  };
};

template struct shared_ptr_internals::Rob<
    shared_ptr_internals::access_shared_ptr,
    &std::__shared_ptr<const void, std::_S_atomic>::_M_refcount>;
template struct shared_ptr_internals::Rob<
    shared_ptr_internals::access_base,
    &shared_ptr_internals::shared_count::_M_pi>;
template struct shared_ptr_internals::Rob<
    shared_ptr_internals::access_use_count,
    &shared_ptr_internals::counted_base::_M_use_count>;
template struct shared_ptr_internals::Rob<
    shared_ptr_internals::access_weak_count,
    &shared_ptr_internals::counted_base::_M_weak_count>;
template struct shared_ptr_internals::Rob<
    shared_ptr_internals::access_counted_ptr_ptr,
    &std::_Sp_counted_ptr<const void*, std::_S_atomic>::_M_ptr>;
template struct shared_ptr_internals::Rob<
    shared_ptr_internals::access_shared_ptr_ptr,
    &std::__shared_ptr<const void, std::_S_atomic>::_M_ptr>;
template struct shared_ptr_internals::Rob<
    shared_ptr_internals::access_refcount,
    &std::__shared_ptr<const void, std::_S_atomic>::_M_refcount>;

template <typename T>
inline shared_ptr_internals::counted_base*
shared_ptr_internals::get_counted_base(const std::shared_ptr<T>& bar) {
  // reinterpret_pointer_cast<const void>
  // Not quite C++ legal, but explicit template instantiation access to
  // private members requires full type name (i.e. shared_ptr<const void>, not
  // shared_ptr<T>)
  const std::shared_ptr<const void>& ptr(
      reinterpret_cast<const std::shared_ptr<const void>&>(bar));
  return (ptr.*fieldPtr(access_shared_ptr{})).*fieldPtr(access_base{});
}

inline void shared_ptr_internals::inc_shared_count(
    counted_base* base,
    long count) {
  // Check that we don't exceed the maximum number of atomic_shared_ptrs.
  // Consider setting EXTERNAL_COUNT lower if this CHECK is hit.
  FOLLY_SAFE_CHECK(
      base->_M_get_use_count() + count < INT_MAX, "atomic_shared_ptr overflow");
  __gnu_cxx::__atomic_add_dispatch(
      &(base->*fieldPtr(access_use_count{})), count);
}

template <typename T>
inline void shared_ptr_internals::release_shared(
    counted_base* base,
    long count) {
  // If count == 1, this is equivalent to base->_M_release()
  if (__gnu_cxx::__exchange_and_add_dispatch(
          &(base->*fieldPtr(access_use_count{})), -count) == count) {
    base->_M_dispose();

    if (__gnu_cxx::__exchange_and_add_dispatch(
            &(base->*fieldPtr(access_weak_count{})), -1) == 1) {
      base->_M_destroy();
    }
  }
}

template <typename T>
inline T* shared_ptr_internals::get_shared_ptr(counted_base* base) {
  // See if this was a make_shared allocation
  auto inplace = base->_M_get_deleter(typeid(std::_Sp_make_shared_tag));
  if (inplace) {
    return (T*)inplace;
  }
  // Could also be a _Sp_counted_deleter, but the layout is the same
  using derived_type = std::_Sp_counted_ptr<const void*, std::_S_atomic>;
  auto ptr = reinterpret_cast<derived_type*>(base);
  return (T*)(ptr->*fieldPtr(access_counted_ptr_ptr{}));
}

template <typename T>
inline T* shared_ptr_internals::release_ptr(std::shared_ptr<T>& p) {
  auto res = p.get();
  std::shared_ptr<const void>& ptr(
      reinterpret_cast<std::shared_ptr<const void>&>(p));
  ptr.*fieldPtr(access_shared_ptr_ptr{}) = nullptr;
  (ptr.*fieldPtr(access_refcount{})).*fieldPtr(access_base{}) = nullptr;
  return res;
}

template <typename T>
inline std::shared_ptr<T>
shared_ptr_internals::get_shared_ptr_from_counted_base(
    counted_base* base,
    bool inc) {
  if (!base) {
    return nullptr;
  }
  std::shared_ptr<const void> newp;
  if (inc) {
    inc_shared_count(base, 1);
  }
  newp.*fieldPtr(access_shared_ptr_ptr{}) =
      get_shared_ptr<const void>(base); // _M_ptr
  (newp.*fieldPtr(access_refcount{})).*fieldPtr(access_base{}) = base;
  // reinterpret_pointer_cast<T>
  auto res = reinterpret_cast<std::shared_ptr<T>*>(&newp);
  return std::move(*res);
}

} // namespace detail
} // namespace folly
