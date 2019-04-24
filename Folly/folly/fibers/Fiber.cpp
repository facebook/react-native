/*
 * Copyright 2014-present Facebook, Inc.
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
#include <folly/fibers/Fiber.h>

#include <glog/logging.h>
#include <algorithm>
#include <cstring>
#include <stdexcept>

#include <folly/Likely.h>
#include <folly/Portability.h>
#include <folly/fibers/FiberManagerInternal.h>
#include <folly/portability/SysSyscall.h>
#include <folly/portability/Unistd.h>

namespace folly {
namespace fibers {

namespace {
static const uint64_t kMagic8Bytes = 0xfaceb00cfaceb00c;

std::thread::id localThreadId() {
  return std::this_thread::get_id();
}

/* Size of the region from p + nBytes down to the last non-magic value */
static size_t nonMagicInBytes(unsigned char* stackLimit, size_t stackSize) {
  CHECK_EQ(reinterpret_cast<intptr_t>(stackLimit) % sizeof(uint64_t), 0u);
  CHECK_EQ(stackSize % sizeof(uint64_t), 0u);
  uint64_t* begin = reinterpret_cast<uint64_t*>(stackLimit);
  uint64_t* end = reinterpret_cast<uint64_t*>(stackLimit + stackSize);

  auto firstNonMagic = std::find_if(
      begin, end, [](uint64_t val) { return val != kMagic8Bytes; });

  return (end - firstNonMagic) * sizeof(uint64_t);
}

} // namespace

void Fiber::resume() {
  DCHECK_EQ(state_, AWAITING);
  state_ = READY_TO_RUN;

  if (fiberManager_.observer_) {
    fiberManager_.observer_->runnable(reinterpret_cast<uintptr_t>(this));
  }

  if (LIKELY(threadId_ == localThreadId())) {
    fiberManager_.readyFibers_.push_back(*this);
    fiberManager_.ensureLoopScheduled();
  } else {
    fiberManager_.remoteReadyInsert(this);
  }
}

Fiber::Fiber(FiberManager& fiberManager)
    : fiberManager_(fiberManager),
      fiberStackSize_(fiberManager_.options_.stackSize),
      fiberStackLimit_(fiberManager_.stackAllocator_.allocate(fiberStackSize_)),
      fiberImpl_([this] { fiberFunc(); }, fiberStackLimit_, fiberStackSize_) {
  fiberManager_.allFibers_.push_back(*this);
}

void Fiber::init(bool recordStackUsed) {
// It is necessary to disable the logic for ASAN because we change
// the fiber's stack.
#ifndef FOLLY_SANITIZE_ADDRESS
  recordStackUsed_ = recordStackUsed;
  if (UNLIKELY(recordStackUsed_ && !stackFilledWithMagic_)) {
    CHECK_EQ(
        reinterpret_cast<intptr_t>(fiberStackLimit_) % sizeof(uint64_t), 0u);
    CHECK_EQ(fiberStackSize_ % sizeof(uint64_t), 0u);
    std::fill(
        reinterpret_cast<uint64_t*>(fiberStackLimit_),
        reinterpret_cast<uint64_t*>(fiberStackLimit_ + fiberStackSize_),
        kMagic8Bytes);

    stackFilledWithMagic_ = true;

    // newer versions of boost allocate context on fiber stack,
    // need to create a new one
    fiberImpl_ =
        FiberImpl([this] { fiberFunc(); }, fiberStackLimit_, fiberStackSize_);
  }
#else
  (void)recordStackUsed;
#endif
}

Fiber::~Fiber() {
#ifdef FOLLY_SANITIZE_ADDRESS
  if (asanFakeStack_ != nullptr) {
    fiberManager_.freeFakeStack(asanFakeStack_);
  }
  fiberManager_.unpoisonFiberStack(this);
#endif
  fiberManager_.stackAllocator_.deallocate(fiberStackLimit_, fiberStackSize_);
}

void Fiber::recordStackPosition() {
  // For ASAN builds, functions may run on fake stack.
  // So we cannot get meaningful stack position.
#ifndef FOLLY_SANITIZE_ADDRESS
  int stackDummy;
  auto currentPosition = static_cast<size_t>(
      fiberStackLimit_ + fiberStackSize_ -
      static_cast<unsigned char*>(static_cast<void*>(&stackDummy)));
  fiberManager_.stackHighWatermark_ =
      std::max(fiberManager_.stackHighWatermark_, currentPosition);
  VLOG(4) << "Stack usage: " << currentPosition;
#endif
}

[[noreturn]] void Fiber::fiberFunc() {
#ifdef FOLLY_SANITIZE_ADDRESS
  fiberManager_.registerFinishSwitchStackWithAsan(
      nullptr, &asanMainStackBase_, &asanMainStackSize_);
#endif

  while (true) {
    DCHECK_EQ(state_, NOT_STARTED);

    threadId_ = localThreadId();
    state_ = RUNNING;

    try {
      if (resultFunc_) {
        DCHECK(finallyFunc_);
        DCHECK(!func_);

        resultFunc_();
      } else {
        DCHECK(func_);
        func_();
      }
    } catch (...) {
      fiberManager_.exceptionCallback_(
          std::current_exception(), "running Fiber func_/resultFunc_");
    }

    if (UNLIKELY(recordStackUsed_)) {
      fiberManager_.stackHighWatermark_ = std::max(
          fiberManager_.stackHighWatermark_,
          nonMagicInBytes(fiberStackLimit_, fiberStackSize_));
      VLOG(3) << "Max stack usage: " << fiberManager_.stackHighWatermark_;
      CHECK(
          fiberManager_.stackHighWatermark_ <
          fiberManager_.options_.stackSize - 64)
          << "Fiber stack overflow";
    }

    state_ = INVALID;

    fiberManager_.deactivateFiber(this);
  }
}

void Fiber::preempt(State state) {
  auto preemptImpl = [&]() mutable {
    DCHECK_EQ(fiberManager_.activeFiber_, this);
    DCHECK_EQ(state_, RUNNING);
    DCHECK_NE(state, RUNNING);
    DCHECK(!std::current_exception());

    state_ = state;

    recordStackPosition();

    fiberManager_.deactivateFiber(this);

    DCHECK_EQ(fiberManager_.activeFiber_, this);
    DCHECK_EQ(state_, READY_TO_RUN);
    state_ = RUNNING;
  };

  if (fiberManager_.preemptRunner_) {
    fiberManager_.preemptRunner_->run(std::ref(preemptImpl));
  } else {
    preemptImpl();
  }
}

Fiber::LocalData::~LocalData() {
  reset();
}

Fiber::LocalData::LocalData(const LocalData& other) : data_(nullptr) {
  *this = other;
}

Fiber::LocalData& Fiber::LocalData::operator=(const LocalData& other) {
  reset();
  if (!other.data_) {
    return *this;
  }

  dataSize_ = other.dataSize_;
  dataType_ = other.dataType_;
  dataDestructor_ = other.dataDestructor_;
  dataCopyConstructor_ = other.dataCopyConstructor_;

  if (dataSize_ <= kBufferSize) {
    data_ = &buffer_;
  } else {
    data_ = allocateHeapBuffer(dataSize_);
  }

  dataCopyConstructor_(data_, other.data_);

  return *this;
}

void Fiber::LocalData::reset() {
  if (!data_) {
    return;
  }

  dataDestructor_(data_);
  data_ = nullptr;
}

void* Fiber::LocalData::allocateHeapBuffer(size_t size) {
  return new char[size];
}

void Fiber::LocalData::freeHeapBuffer(void* buffer) {
  delete[] reinterpret_cast<char*>(buffer);
}
} // namespace fibers
} // namespace folly
