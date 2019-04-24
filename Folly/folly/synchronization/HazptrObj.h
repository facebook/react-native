/*
 * Copyright 2018-present Facebook, Inc.
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

#include <folly/synchronization/Hazptr-fwd.h>

#include <folly/CPortability.h>
#include <folly/Portability.h>

#include <glog/logging.h>

#include <atomic>
#include <memory>

///
/// Classes related to objects protected by hazard pointers.
///

namespace folly {

/**
 *  hazptr_obj
 *
 *  Object protected by hazard pointers.
 */
template <template <typename> class Atom>
class hazptr_obj {
  using ReclaimFnPtr = void (*)(hazptr_obj<Atom>*, hazptr_obj_list<Atom>&);

  template <template <typename> class>
  friend class hazptr_domain;
  template <typename, template <typename> class, typename>
  friend class hazptr_obj_base;
  template <typename, template <typename> class, typename>
  friend class hazptr_obj_base_linked;
  template <template <typename> class>
  friend class hazptr_obj_list;
  template <template <typename> class>
  friend class hazptr_priv;

  ReclaimFnPtr reclaim_;
  hazptr_obj<Atom>* next_;

 public:
  /** Constructors */
  /* All constructors set next_ to this in order to catch misuse bugs
      such as double retire. */

  hazptr_obj() noexcept : next_(this) {}

  hazptr_obj(const hazptr_obj<Atom>&) noexcept : next_(this) {}

  hazptr_obj(hazptr_obj<Atom>&&) noexcept : next_(this) {}

  /** Copy operator */
  hazptr_obj<Atom>& operator=(const hazptr_obj<Atom>&) noexcept {
    return *this;
  }

  /** Move operator */
  hazptr_obj<Atom>& operator=(hazptr_obj<Atom>&&) noexcept {
    return *this;
  }

 private:
  friend class hazptr_domain<Atom>;
  template <typename, template <typename> class, typename>
  friend class hazptr_obj_base;
  template <typename, template <typename> class, typename>
  friend class hazptr_obj_base_refcounted;
  friend class hazptr_priv<Atom>;

  hazptr_obj<Atom>* next() const noexcept {
    return next_;
  }

  void set_next(hazptr_obj* obj) noexcept {
    next_ = obj;
  }

  ReclaimFnPtr reclaim() noexcept {
    return reclaim_;
  }

  const void* raw_ptr() const {
    return this;
  }

  void pre_retire_check() noexcept {
    // Only for catching misuse bugs like double retire
    if (next_ != this) {
      pre_retire_check_fail();
    }
  }

  void push_to_retired(hazptr_domain<Atom>& domain) {
#if FOLLY_HAZPTR_THR_LOCAL
    if (&domain == &default_hazptr_domain<Atom>() && !domain.shutdown_) {
      hazptr_priv_tls<Atom>().push(this);
      return;
    }
#endif
    hazptr_obj_list<Atom> l(this);
    hazptr_domain_push_retired(l, true, domain);
  }

  FOLLY_NOINLINE void pre_retire_check_fail() noexcept {
    CHECK_EQ(next_, this);
  }
}; // hazptr_obj

/**
 *  hazptr_obj_list
 *
 *  List of hazptr_obj-s.
 */
template <template <typename> class Atom>
class hazptr_obj_list {
  hazptr_obj<Atom>* head_;
  hazptr_obj<Atom>* tail_;
  int count_;

 public:
  hazptr_obj_list() noexcept : head_(nullptr), tail_(nullptr), count_(0) {}

  explicit hazptr_obj_list(hazptr_obj<Atom>* obj) noexcept
      : head_(obj), tail_(obj), count_(1) {}

  explicit hazptr_obj_list(
      hazptr_obj<Atom>* head,
      hazptr_obj<Atom>* tail,
      int count) noexcept
      : head_(head), tail_(tail), count_(count) {}

  hazptr_obj<Atom>* head() {
    return head_;
  }

  hazptr_obj<Atom>* tail() {
    return tail_;
  }

  int count() {
    return count_;
  }

  void push(hazptr_obj<Atom>* obj) {
    obj->set_next(head_);
    head_ = obj;
    if (tail_ == nullptr) {
      tail_ = obj;
    }
    ++count_;
  }

  void splice(hazptr_obj_list<Atom>& l) {
    if (l.count() == 0) {
      return;
    }
    if (count() == 0) {
      head_ = l.head();
    } else {
      tail_->set_next(l.head());
    }
    tail_ = l.tail();
    count_ += l.count();
    l.clear();
  }

  void clear() {
    head_ = nullptr;
    tail_ = nullptr;
    count_ = 0;
  }
}; // hazptr_obj_list

/**
 *  hazptr_deleter
 *
 *  For empty base optimization.
 */
template <typename T, typename D>
class hazptr_deleter {
  D deleter_;

 public:
  void set_deleter(D d = {}) {
    deleter_ = std::move(d);
  }

  void delete_obj(T* p) {
    deleter_(p);
  }
};

template <typename T>
class hazptr_deleter<T, std::default_delete<T>> {
 public:
  void set_deleter(std::default_delete<T> = {}) {}

  void delete_obj(T* p) {
    delete p;
  }
};

/**
 *  hazptr_obj_base
 *
 *  Base template for objects protected by hazard pointers.
 */
template <typename T, template <typename> class Atom, typename D>
class hazptr_obj_base : public hazptr_obj<Atom>, public hazptr_deleter<T, D> {
 public:
  /* Retire a removed object and pass the responsibility for
   * reclaiming it to the hazptr library */
  void retire(
      D deleter = {},
      hazptr_domain<Atom>& domain = default_hazptr_domain<Atom>()) {
    pre_retire(std::move(deleter));
    set_reclaim();
    this->push_to_retired(domain); // defined in hazptr_obj
  }

  void retire(hazptr_domain<Atom>& domain) {
    retire({}, domain);
  }

 private:
  void pre_retire(D deleter) {
    this->pre_retire_check(); // defined in hazptr_obj
    this->set_deleter(std::move(deleter));
  }

  void set_reclaim() {
    this->reclaim_ = [](hazptr_obj<Atom>* p, hazptr_obj_list<Atom>&) {
      auto hobp = static_cast<hazptr_obj_base<T, Atom, D>*>(p);
      auto obj = static_cast<T*>(hobp);
      hobp->delete_obj(obj);
    };
  }
}; // hazptr_obj_base

} // namespace folly
