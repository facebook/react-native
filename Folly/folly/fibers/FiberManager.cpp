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
#include <folly/fibers/FiberManagerInternal.h>

#include <signal.h>

#include <cassert>
#include <stdexcept>

#include <glog/logging.h>

#include <folly/fibers/Fiber.h>
#include <folly/fibers/LoopController.h>

#include <folly/ConstexprMath.h>
#include <folly/SingletonThreadLocal.h>
#include <folly/portability/SysSyscall.h>
#include <folly/portability/Unistd.h>

#ifdef FOLLY_SANITIZE_ADDRESS

#include <dlfcn.h>

static void __sanitizer_start_switch_fiber_weak(
    void** fake_stack_save,
    void const* fiber_stack_base,
    size_t fiber_stack_extent)
    __attribute__((__weakref__("__sanitizer_start_switch_fiber")));
static void __sanitizer_finish_switch_fiber_weak(
    void* fake_stack_save,
    void const** old_stack_base,
    size_t* old_stack_extent)
    __attribute__((__weakref__("__sanitizer_finish_switch_fiber")));
static void __asan_unpoison_memory_region_weak(
    void const /* nolint */ volatile* addr,
    size_t size) __attribute__((__weakref__("__asan_unpoison_memory_region")));

typedef void (*AsanStartSwitchStackFuncPtr)(void**, void const*, size_t);
typedef void (*AsanFinishSwitchStackFuncPtr)(void*, void const**, size_t*);
typedef void (*AsanUnpoisonMemoryRegionFuncPtr)(
    void const /* nolint */ volatile*,
    size_t);

namespace folly {
namespace fibers {

static AsanStartSwitchStackFuncPtr getStartSwitchStackFunc();
static AsanFinishSwitchStackFuncPtr getFinishSwitchStackFunc();
static AsanUnpoisonMemoryRegionFuncPtr getUnpoisonMemoryRegionFunc();
} // namespace fibers
} // namespace folly

#endif

namespace folly {
namespace fibers {

FOLLY_TLS FiberManager* FiberManager::currentFiberManager_ = nullptr;

FiberManager::FiberManager(
    std::unique_ptr<LoopController> loopController,
    Options options)
    : FiberManager(
          LocalType<void>(),
          std::move(loopController),
          std::move(options)) {}

FiberManager::~FiberManager() {
  loopController_.reset();

  while (!fibersPool_.empty()) {
    fibersPool_.pop_front_and_dispose([](Fiber* fiber) { delete fiber; });
  }
  assert(readyFibers_.empty());
  assert(fibersActive_ == 0);
}

LoopController& FiberManager::loopController() {
  return *loopController_;
}

const LoopController& FiberManager::loopController() const {
  return *loopController_;
}

bool FiberManager::hasTasks() const {
  return fibersActive_ > 0 || !remoteReadyQueue_.empty() ||
      !remoteTaskQueue_.empty() || remoteCount_ > 0;
}

Fiber* FiberManager::getFiber() {
  Fiber* fiber = nullptr;

  if (options_.fibersPoolResizePeriodMs > 0 && !fibersPoolResizerScheduled_) {
    fibersPoolResizer_();
    fibersPoolResizerScheduled_ = true;
  }

  if (fibersPool_.empty()) {
    fiber = new Fiber(*this);
    ++fibersAllocated_;
  } else {
    fiber = &fibersPool_.front();
    fibersPool_.pop_front();
    assert(fibersPoolSize_ > 0);
    --fibersPoolSize_;
  }
  assert(fiber);
  if (++fibersActive_ > maxFibersActiveLastPeriod_) {
    maxFibersActiveLastPeriod_ = fibersActive_;
  }
  ++fiberId_;
  bool recordStack = (options_.recordStackEvery != 0) &&
      (fiberId_ % options_.recordStackEvery == 0);
  fiber->init(recordStack);
  return fiber;
}

void FiberManager::setExceptionCallback(FiberManager::ExceptionCallback ec) {
  assert(ec);
  exceptionCallback_ = std::move(ec);
}

size_t FiberManager::fibersAllocated() const {
  return fibersAllocated_;
}

size_t FiberManager::fibersPoolSize() const {
  return fibersPoolSize_;
}

size_t FiberManager::stackHighWatermark() const {
  return stackHighWatermark_;
}

void FiberManager::remoteReadyInsert(Fiber* fiber) {
  if (observer_) {
    observer_->runnable(reinterpret_cast<uintptr_t>(fiber));
  }
  if (remoteReadyQueue_.insertHead(fiber)) {
    loopController_->scheduleThreadSafe();
  }
}

void FiberManager::setObserver(ExecutionObserver* observer) {
  observer_ = observer;
}

ExecutionObserver* FiberManager::getObserver() {
  return observer_;
}

void FiberManager::setPreemptRunner(InlineFunctionRunner* preemptRunner) {
  preemptRunner_ = preemptRunner;
}

void FiberManager::doFibersPoolResizing() {
  while (fibersAllocated_ > maxFibersActiveLastPeriod_ &&
         fibersPoolSize_ > options_.maxFibersPoolSize) {
    auto fiber = &fibersPool_.front();
    assert(fiber != nullptr);
    fibersPool_.pop_front();
    delete fiber;
    --fibersPoolSize_;
    --fibersAllocated_;
  }

  maxFibersActiveLastPeriod_ = fibersActive_;
}

void FiberManager::FibersPoolResizer::operator()() {
  fiberManager_.doFibersPoolResizing();
  fiberManager_.timeoutManager_->registerTimeout(
      *this,
      std::chrono::milliseconds(
          fiberManager_.options_.fibersPoolResizePeriodMs));
}

#ifdef FOLLY_SANITIZE_ADDRESS

void FiberManager::registerStartSwitchStackWithAsan(
    void** saveFakeStack,
    const void* stackBottom,
    size_t stackSize) {
  // Check if we can find a fiber enter function and call it if we find one
  static AsanStartSwitchStackFuncPtr fn = getStartSwitchStackFunc();
  if (fn == nullptr) {
    LOG(FATAL) << "The version of ASAN in use doesn't support fibers";
  } else {
    fn(saveFakeStack, stackBottom, stackSize);
  }
}

void FiberManager::registerFinishSwitchStackWithAsan(
    void* saveFakeStack,
    const void** saveStackBottom,
    size_t* saveStackSize) {
  // Check if we can find a fiber exit function and call it if we find one
  static AsanFinishSwitchStackFuncPtr fn = getFinishSwitchStackFunc();
  if (fn == nullptr) {
    LOG(FATAL) << "The version of ASAN in use doesn't support fibers";
  } else {
    fn(saveFakeStack, saveStackBottom, saveStackSize);
  }
}

void FiberManager::freeFakeStack(void* fakeStack) {
  static AsanStartSwitchStackFuncPtr fnStart = getStartSwitchStackFunc();
  static AsanFinishSwitchStackFuncPtr fnFinish = getFinishSwitchStackFunc();
  if (fnStart == nullptr || fnFinish == nullptr) {
    LOG(FATAL) << "The version of ASAN in use doesn't support fibers";
  }

  void* saveFakeStack;
  const void* stackBottom;
  size_t stackSize;
  fnStart(&saveFakeStack, nullptr, 0);
  fnFinish(fakeStack, &stackBottom, &stackSize);
  fnStart(nullptr, stackBottom, stackSize);
  fnFinish(saveFakeStack, nullptr, nullptr);
}

void FiberManager::unpoisonFiberStack(const Fiber* fiber) {
  auto stack = fiber->getStack();

  // Check if we can find a fiber enter function and call it if we find one
  static AsanUnpoisonMemoryRegionFuncPtr fn = getUnpoisonMemoryRegionFunc();
  if (fn == nullptr) {
    LOG(FATAL) << "This version of ASAN doesn't support memory unpoisoning";
  } else {
    fn(stack.first, stack.second);
  }
}

static AsanStartSwitchStackFuncPtr getStartSwitchStackFunc() {
  AsanStartSwitchStackFuncPtr fn{nullptr};

  // Check whether weak reference points to statically linked enter function
  if (nullptr != (fn = &::__sanitizer_start_switch_fiber_weak)) {
    return fn;
  }

  // Check whether we can find a dynamically linked enter function
  if (nullptr !=
      (fn = (AsanStartSwitchStackFuncPtr)dlsym(
           RTLD_DEFAULT, "__sanitizer_start_switch_fiber"))) {
    return fn;
  }

  // Couldn't find the function at all
  return nullptr;
}

static AsanFinishSwitchStackFuncPtr getFinishSwitchStackFunc() {
  AsanFinishSwitchStackFuncPtr fn{nullptr};

  // Check whether weak reference points to statically linked exit function
  if (nullptr != (fn = &::__sanitizer_finish_switch_fiber_weak)) {
    return fn;
  }

  // Check whether we can find a dynamically linked exit function
  if (nullptr !=
      (fn = (AsanFinishSwitchStackFuncPtr)dlsym(
           RTLD_DEFAULT, "__sanitizer_finish_switch_fiber"))) {
    return fn;
  }

  // Couldn't find the function at all
  return nullptr;
}

static AsanUnpoisonMemoryRegionFuncPtr getUnpoisonMemoryRegionFunc() {
  AsanUnpoisonMemoryRegionFuncPtr fn{nullptr};

  // Check whether weak reference points to statically linked unpoison function
  if (nullptr != (fn = &::__asan_unpoison_memory_region_weak)) {
    return fn;
  }

  // Check whether we can find a dynamically linked unpoison function
  if (nullptr !=
      (fn = (AsanUnpoisonMemoryRegionFuncPtr)dlsym(
           RTLD_DEFAULT, "__asan_unpoison_memory_region"))) {
    return fn;
  }

  // Couldn't find the function at all
  return nullptr;
}

#endif // FOLLY_SANITIZE_ADDRESS

#ifndef _WIN32
namespace {

// SIGSTKSZ (8 kB on our architectures) isn't always enough for
// folly::symbolizer, so allocate 32 kB.
constexpr size_t kAltStackSize = folly::constexpr_max(SIGSTKSZ, 32 * 1024);

bool hasAlternateStack() {
  stack_t ss;
  sigaltstack(nullptr, &ss);
  return !(ss.ss_flags & SS_DISABLE);
}

int setAlternateStack(char* sp, size_t size) {
  CHECK(sp);
  stack_t ss{};
  ss.ss_sp = sp;
  ss.ss_size = size;
  return sigaltstack(&ss, nullptr);
}

int unsetAlternateStack() {
  stack_t ss{};
  ss.ss_flags = SS_DISABLE;
  return sigaltstack(&ss, nullptr);
}

class ScopedAlternateSignalStack {
 public:
  ScopedAlternateSignalStack() {
    if (hasAlternateStack()) {
      return;
    }

    stack_ = std::make_unique<AltStackBuffer>();

    setAlternateStack(stack_->data(), stack_->size());
  }

  ScopedAlternateSignalStack(ScopedAlternateSignalStack&&) = default;
  ScopedAlternateSignalStack& operator=(ScopedAlternateSignalStack&&) = default;

  ~ScopedAlternateSignalStack() {
    if (stack_) {
      unsetAlternateStack();
    }
  }

 private:
  using AltStackBuffer = std::array<char, kAltStackSize>;
  std::unique_ptr<AltStackBuffer> stack_;
};
} // namespace

void FiberManager::registerAlternateSignalStack() {
  SingletonThreadLocal<ScopedAlternateSignalStack>::get();

  alternateSignalStackRegistered_ = true;
}
#endif
} // namespace fibers
} // namespace folly
