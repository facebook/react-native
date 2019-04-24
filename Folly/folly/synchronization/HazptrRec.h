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

#include <folly/concurrency/CacheLocality.h>

#include <atomic>

namespace folly {

/**
 *  hazptr_rec:
 *
 *  Contains the actual hazard pointer.
 */
template <template <typename> class Atom>
class alignas(hardware_destructive_interference_size) hazptr_rec {
  Atom<const void*> hazptr_{nullptr}; // the hazard pointer
  hazptr_domain<Atom>* domain_;
  hazptr_rec* next_;
  Atom<bool> active_{false};

  friend class hazptr_domain<Atom>;
  friend class hazptr_holder<Atom>;
  friend class hazptr_tc_entry<Atom>;

  const void* hazptr() const noexcept {
    return hazptr_.load(std::memory_order_acquire);
  }

  FOLLY_ALWAYS_INLINE void reset_hazptr(const void* p = nullptr) noexcept {
    hazptr_.store(p, std::memory_order_release);
  }

  bool active() const noexcept {
    return active_.load(std::memory_order_acquire);
  }

  void set_active() noexcept {
    active_.store(true, std::memory_order_relaxed);
  }

  bool try_acquire() noexcept {
    bool a = active();
    return !a &&
        active_.compare_exchange_strong(
            a, true, std::memory_order_release, std::memory_order_relaxed);
  }

  void release() noexcept {
    active_.store(false, std::memory_order_release);
  }

  hazptr_rec<Atom>* next() {
    return next_;
  }

  void set_next(hazptr_rec<Atom>* rec) {
    next_ = rec;
  }

  FOLLY_ALWAYS_INLINE hazptr_domain<Atom>* domain() {
    return domain_;
  }

  void set_domain(hazptr_domain<Atom>* dom) {
    domain_ = dom;
  }
}; // hazptr_rec

} // namespace folly
