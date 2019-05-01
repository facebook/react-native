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

#include <folly/Synchronized.h>

/* `SynchronizedPtr` is a variation on the `Synchronized` idea that's useful for
 * some cases where you want to protect a pointed-to object (or an object within
 * some pointer-like wrapper). If you would otherwise need to use
 * `Synchronized<smart_ptr<Synchronized<T>>>` consider using
 * `SynchronizedPtr<smart_ptr<T>>`as it is a bit easier to use and it works when
 * you want the `T` object at runtime to actually a subclass of `T`.
 *
 * You can access the contained `T` with `.rlock()`, and `.wlock()`, and the
 * pointer or pointer-like wrapper with `.wlockPointer()`. The corresponding
 * `with...` methods take a callback, invoke it with a `T const&`, `T&` or
 * `smart_ptr<T>&` respectively, and return the callback's result.
 */
namespace folly {
template <typename LockHolder, typename Element>
struct SynchronizedPtrLockedElement {
  explicit SynchronizedPtrLockedElement(LockHolder&& holder)
      : holder_(std::move(holder)) {}

  Element& operator*() const {
    return **holder_;
  }

  Element* operator->() const {
    return &**holder_;
  }

  explicit operator bool() const {
    return static_cast<bool>(*holder_);
  }

 private:
  LockHolder holder_;
};

template <typename PointerType, typename MutexType = SharedMutex>
class SynchronizedPtr {
  using inner_type = Synchronized<PointerType, MutexType>;
  inner_type inner_;

 public:
  using pointer_type = PointerType;
  using element_type = typename std::pointer_traits<pointer_type>::element_type;
  using const_element_type = typename std::add_const<element_type>::type;
  using read_locked_element = SynchronizedPtrLockedElement<
      typename inner_type::ConstLockedPtr,
      const_element_type>;
  using write_locked_element = SynchronizedPtrLockedElement<
      typename inner_type::LockedPtr,
      element_type>;
  using write_locked_pointer = typename inner_type::LockedPtr;

  template <typename... Args>
  explicit SynchronizedPtr(Args... args)
      : inner_(std::forward<Args>(args)...) {}

  SynchronizedPtr() = default;
  SynchronizedPtr(SynchronizedPtr const&) = default;
  SynchronizedPtr(SynchronizedPtr&&) = default;
  SynchronizedPtr& operator=(SynchronizedPtr const&) = default;
  SynchronizedPtr& operator=(SynchronizedPtr&&) = default;

  // Methods to provide appropriately locked and const-qualified access to the
  // element.

  read_locked_element rlock() const {
    return read_locked_element(inner_.rlock());
  }

  template <class Function>
  auto withRLock(Function&& function) const {
    return function(*rlock());
  }

  write_locked_element wlock() {
    return write_locked_element(inner_.wlock());
  }

  template <class Function>
  auto withWLock(Function&& function) {
    return function(*wlock());
  }

  // Methods to provide write-locked access to the pointer. We deliberately make
  // it difficult to get a read-locked pointer because that provides read-locked
  // non-const access to the element, and the purpose of this class is to
  // discourage that.
  write_locked_pointer wlockPointer() {
    return inner_.wlock();
  }

  template <class Function>
  auto withWLockPointer(Function&& function) {
    return function(*wlockPointer());
  }
};
} // namespace folly
