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

#include <atomic>
#include <cstring>
#include <type_traits>

#include <folly/Traits.h>

namespace folly {

/**
 * This class allows you to perform torn loads and stores on the bits of a
 * trivially-copyable type T without triggering undefined behavior. You may
 * encounter corrupt data, but should not encounter nasal demons.
 *
 * This class provides no atomicity or memory ordering. Loads and stores are
 * expected often to be data races. Synchronization is expected to be provided
 * externally, and this class is helpful in building higher-level optimistic
 * concurrency tools in combination with externally-provided synchronization.
 *
 * To see why this is useful, consider the guarantees provided by
 * std::atomic<T>. It ensures that every load returns a T that was stored in the
 * atomic. If T is too large to be read/written with a single load/store
 * instruction, std::atomic<T> falls back to locking to provide this guarantee.
 * Users pay this cost even if they have some higher-level mechanism (an
 * external lock, version numbers, other application-level reasoning) that makes
 * them resilient to torn reads. Tearable<T> allows concurrent access without
 * these costs.
 *
 * For types smaller than the processor word size, prefer std::atomic<T>.
 */
template <typename T>
class Tearable {
 public:
  // We memcpy the object representation, and the destructor would not know how
  // to deal with an object state it doesn't understand.
  static_assert(
      is_trivially_copyable<T>::value,
      "Tearable types must be trivially copyable.");

  Tearable() = default;

  Tearable(const T& val) : Tearable() {
    store(val);
  }

  // Note that while filling dst with invalid data should be fine, *doing
  // anything* with the result may trigger undefined behavior unless you've
  // verified that the data you read was consistent.
  void load(T& dst) const {
    RawWord newDst[kNumDataWords];

    for (std::size_t i = 0; i < kNumDataWords; ++i) {
      newDst[i] = data_[i].load(std::memory_order_relaxed);
    }
    std::memcpy(&dst, newDst, sizeof(T));
  }

  void store(const T& val) {
    RawWord newData[kNumDataWords];
    std::memcpy(newData, &val, sizeof(T));

    for (std::size_t i = 0; i < kNumDataWords; ++i) {
      data_[i].store(newData[i], std::memory_order_relaxed);
    }
  }

 private:
  // A union gets us memcpy-like copy semantics always.
  union RawWord {
    // "unsigned" here matters; we may read uninitialized values (in the
    // trailing data word in write(), for instance).
    unsigned char data alignas(void*)[sizeof(void*)];
  };
  // Because std::atomic_init is declared but undefined in libstdc++-v4.9.2:
  // https://gcc.gnu.org/bugzilla/show_bug.cgi?id=64658.
  struct AtomicWord : std::atomic<RawWord> {
    AtomicWord() noexcept : std::atomic<RawWord>{RawWord{}} {}
  };
  const static std::size_t kNumDataWords =
      (sizeof(T) + sizeof(RawWord) - 1) / sizeof(RawWord);

  AtomicWord data_[kNumDataWords];
};

} // namespace folly
