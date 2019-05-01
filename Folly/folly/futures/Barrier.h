/*
 * Copyright 2015-present Facebook, Inc.
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
#include <cstdint>

#include <folly/futures/Future.h>
#include <folly/futures/Promise.h>

namespace folly {
namespace futures {

// A folly::Future-istic Barrier synchronization primitive
//
// The barrier is initialized with a count N.
//
// The first N-1 calls to wait() return uncompleted futures.
//
// The Nth call to wait() completes the previous N-1 futures successfully,
// returns a future that is already completed successfully, and resets the
// barrier; the barrier may be reused immediately, as soon as at least one
// of the future completions has been observed.
//
// Of these N futures, exactly one is completed with true, while the others are
// completed with false; it is unspecified which future completes with true.
// (This may be used to elect a "leader" among a group of threads.)
//
// If the barrier is destroyed, any futures already returned by wait() will
// complete with an error.
class Barrier {
 public:
  explicit Barrier(uint32_t n);
  ~Barrier();

  folly::Future<bool> wait();

 private:
  typedef folly::Promise<bool> BoolPromise;

  static constexpr uint64_t kReaderShift = 32;
  static constexpr uint64_t kReader = uint64_t(1) << kReaderShift;
  static constexpr uint64_t kValueMask = kReader - 1;

  // For each "epoch" that the barrier is active, we have a different
  // ControlBlock. The ControlBlock contains the current barrier value
  // and the number of readers (currently inside wait()) packed into a
  // 64-bit value.
  //
  // The ControlBlock is allocated as long as either:
  // - there are threads currently inside wait() (reader count > 0), or
  // - the value has not yet reached size_ (value < size_)
  //
  // The array of size_ Promise objects is allocated immediately following
  // valueAndReaderCount.

  struct ControlBlock {
    // Reader count in most significant 32 bits
    // Value in least significant 32 bits
    std::atomic<uint64_t> valueAndReaderCount{0};
  };

  struct ControlBlockAndPromise {
    ControlBlock cb;
    BoolPromise promises[1];
  };

  static BoolPromise* promises(ControlBlock* cb) {
    return reinterpret_cast<ControlBlockAndPromise*>(cb)->promises;
  }

  static size_t controlBlockSize(size_t n) {
    return offsetof(ControlBlockAndPromise, promises) + n * sizeof(BoolPromise);
  }

  ControlBlock* allocateControlBlock();
  void freeControlBlock(ControlBlock* b);

  uint32_t size_;
  std::atomic<ControlBlock*> controlBlock_;
};

} // namespace futures
} // namespace folly
