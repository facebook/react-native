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

#include <folly/futures/Barrier.h>

namespace folly { namespace futures {

Barrier::Barrier(uint32_t n)
  : size_(n),
    controlBlock_(allocateControlBlock()) { }

Barrier::~Barrier() {
  auto block = controlBlock_.load(std::memory_order_relaxed);
  auto prev = block->valueAndReaderCount.load(std::memory_order_relaxed);
  DCHECK_EQ(prev >> kReaderShift, 0u);
  auto val = prev & kValueMask;
  auto p = promises(block);

  for (uint32_t i = 0; i < val; ++i) {
    p[i].setException(
        folly::make_exception_wrapper<std::runtime_error>("Barrier destroyed"));
  }

  freeControlBlock(controlBlock_);
}

auto Barrier::allocateControlBlock() -> ControlBlock* {
  auto block = static_cast<ControlBlock*>(malloc(controlBlockSize(size_)));
  if (!block) {
    throw std::bad_alloc();
  }
  block->valueAndReaderCount = 0;

  auto p = promises(block);
  uint32_t i = 0;
  try {
    for (i = 0; i < size_; ++i) {
      new (p + i) BoolPromise();
    }
  } catch (...) {
    for (; i != 0; --i) {
      p[i - 1].~BoolPromise();
    }
    throw;
  }

  return block;
}

void Barrier::freeControlBlock(ControlBlock* block) {
  auto p = promises(block);
  for (uint32_t i = size_; i != 0; --i) {
    p[i - 1].~BoolPromise();
  }
  free(block);
}

folly::Future<bool> Barrier::wait() {
  // Load the current control block first. As we know there is at least
  // one thread in the current epoch (us), this means that the value is
  // < size_, so controlBlock_ can't change until we bump the value below.
  auto block = controlBlock_.load(std::memory_order_acquire);
  auto p = promises(block);

  // Bump the value and record ourselves as reader.
  // This ensures that block stays allocated, as the reader count is > 0.
  auto prev = block->valueAndReaderCount.fetch_add(kReader + 1,
                                                   std::memory_order_acquire);

  auto prevValue = static_cast<uint32_t>(prev & kValueMask);
  DCHECK_LT(prevValue, size_);
  auto future = p[prevValue].getFuture();

  if (prevValue + 1 == size_) {
    // Need to reset the barrier before fulfilling any futures. This is
    // when the epoch is flipped to the next.
    controlBlock_.store(allocateControlBlock(), std::memory_order_release);

    p[0].setValue(true);
    for (uint32_t i = 1; i < size_; ++i) {
      p[i].setValue(false);
    }
  }

  // Free the control block if we're the last reader at max value.
  prev = block->valueAndReaderCount.fetch_sub(kReader,
                                              std::memory_order_acq_rel);
  if (prev == (kReader | uint64_t(size_))) {
    freeControlBlock(block);
  }

  return future;
}

}}  // namespaces
