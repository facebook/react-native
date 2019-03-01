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
#pragma once

#include <cassert>

#include <folly/CPortability.h>
#include <folly/Memory.h>
#include <folly/Optional.h>
#include <folly/Portability.h>
#include <folly/ScopeGuard.h>
#ifdef __APPLE__
#include <folly/ThreadLocal.h>
#endif
#include <folly/fibers/Baton.h>
#include <folly/fibers/Fiber.h>
#include <folly/fibers/LoopController.h>
#include <folly/fibers/Promise.h>
#include <folly/Try.h>

namespace folly {
namespace fibers {

namespace {

inline FiberManager::Options preprocessOptions(FiberManager::Options opts) {
#if defined(FOLLY_SANITIZE_ADDRESS) || defined(UNDEFINED_SANITIZER)
  /* ASAN/UBSAN needs a lot of extra stack space.
     16x is a conservative estimate, 8x also worked with tests
     where it mattered.  Note that overallocating here does not necessarily
     increase RSS, since unused memory is pretty much free. */
  opts.stackSize *= 16;
#endif
  return opts;
}

} // anonymous

inline void FiberManager::ensureLoopScheduled() {
  if (isLoopScheduled_) {
    return;
  }

  isLoopScheduled_ = true;
  loopController_->schedule();
}

inline void FiberManager::activateFiber(Fiber* fiber) {
  DCHECK_EQ(activeFiber_, (Fiber*)nullptr);

#ifdef FOLLY_SANITIZE_ADDRESS
  DCHECK(!fiber->asanMainStackBase_);
  DCHECK(!fiber->asanMainStackSize_);
  auto stack = fiber->getStack();
  void* asanFakeStack;
  registerStartSwitchStackWithAsan(&asanFakeStack, stack.first, stack.second);
  SCOPE_EXIT {
    registerFinishSwitchStackWithAsan(asanFakeStack, nullptr, nullptr);
    fiber->asanMainStackBase_ = nullptr;
    fiber->asanMainStackSize_ = 0;
  };
#endif

  activeFiber_ = fiber;
  fiber->fiberImpl_.activate();
}

inline void FiberManager::deactivateFiber(Fiber* fiber) {
  DCHECK_EQ(activeFiber_, fiber);

#ifdef FOLLY_SANITIZE_ADDRESS
  DCHECK(fiber->asanMainStackBase_);
  DCHECK(fiber->asanMainStackSize_);

  registerStartSwitchStackWithAsan(
      &fiber->asanFakeStack_,
      fiber->asanMainStackBase_,
      fiber->asanMainStackSize_);
  SCOPE_EXIT {
    registerFinishSwitchStackWithAsan(
        fiber->asanFakeStack_,
        &fiber->asanMainStackBase_,
        &fiber->asanMainStackSize_);
    fiber->asanFakeStack_ = nullptr;
  };
#endif

  activeFiber_ = nullptr;
  fiber->fiberImpl_.deactivate();
}

inline void FiberManager::runReadyFiber(Fiber* fiber) {
  SCOPE_EXIT {
    assert(currentFiber_ == nullptr);
    assert(activeFiber_ == nullptr);
  };

  assert(
      fiber->state_ == Fiber::NOT_STARTED ||
      fiber->state_ == Fiber::READY_TO_RUN);
  currentFiber_ = fiber;
  fiber->rcontext_ = RequestContext::setContext(std::move(fiber->rcontext_));
  if (observer_) {
    observer_->starting(reinterpret_cast<uintptr_t>(fiber));
  }

  while (fiber->state_ == Fiber::NOT_STARTED ||
         fiber->state_ == Fiber::READY_TO_RUN) {
    activateFiber(fiber);
    if (fiber->state_ == Fiber::AWAITING_IMMEDIATE) {
      try {
        immediateFunc_();
      } catch (...) {
        exceptionCallback_(std::current_exception(), "running immediateFunc_");
      }
      immediateFunc_ = nullptr;
      fiber->state_ = Fiber::READY_TO_RUN;
    }
  }

  if (fiber->state_ == Fiber::AWAITING) {
    awaitFunc_(*fiber);
    awaitFunc_ = nullptr;
    if (observer_) {
      observer_->stopped(reinterpret_cast<uintptr_t>(fiber));
    }
    currentFiber_ = nullptr;
    fiber->rcontext_ = RequestContext::setContext(std::move(fiber->rcontext_));
  } else if (fiber->state_ == Fiber::INVALID) {
    assert(fibersActive_ > 0);
    --fibersActive_;
    // Making sure that task functor is deleted once task is complete.
    // NOTE: we must do it on main context, as the fiber is not
    // running at this point.
    fiber->func_ = nullptr;
    fiber->resultFunc_ = nullptr;
    if (fiber->finallyFunc_) {
      try {
        fiber->finallyFunc_();
      } catch (...) {
        exceptionCallback_(std::current_exception(), "running finallyFunc_");
      }
      fiber->finallyFunc_ = nullptr;
    }
    // Make sure LocalData is not accessible from its destructor
    if (observer_) {
      observer_->stopped(reinterpret_cast<uintptr_t>(fiber));
    }
    currentFiber_ = nullptr;
    fiber->rcontext_ = RequestContext::setContext(std::move(fiber->rcontext_));
    fiber->localData_.reset();
    fiber->rcontext_.reset();

    if (fibersPoolSize_ < options_.maxFibersPoolSize ||
        options_.fibersPoolResizePeriodMs > 0) {
      fibersPool_.push_front(*fiber);
      ++fibersPoolSize_;
    } else {
      delete fiber;
      assert(fibersAllocated_ > 0);
      --fibersAllocated_;
    }
  } else if (fiber->state_ == Fiber::YIELDED) {
    if (observer_) {
      observer_->stopped(reinterpret_cast<uintptr_t>(fiber));
    }
    currentFiber_ = nullptr;
    fiber->rcontext_ = RequestContext::setContext(std::move(fiber->rcontext_));
    fiber->state_ = Fiber::READY_TO_RUN;
    yieldedFibers_.push_back(*fiber);
  }
}

inline void FiberManager::loopUntilNoReady() {
  return loopController_->runLoop();
}

inline void FiberManager::loopUntilNoReadyImpl() {
#ifndef _WIN32
  if (UNLIKELY(!alternateSignalStackRegistered_)) {
    registerAlternateSignalStack();
  }
#endif

  // Support nested FiberManagers
  auto originalFiberManager = this;
  std::swap(currentFiberManager_, originalFiberManager);

  SCOPE_EXIT {
    isLoopScheduled_ = false;
    if (!readyFibers_.empty()) {
      ensureLoopScheduled();
    }
    std::swap(currentFiberManager_, originalFiberManager);
    CHECK_EQ(this, originalFiberManager);
  };

  bool hadRemoteFiber = true;
  while (hadRemoteFiber) {
    hadRemoteFiber = false;

    while (!readyFibers_.empty()) {
      auto& fiber = readyFibers_.front();
      readyFibers_.pop_front();
      runReadyFiber(&fiber);
    }

    remoteReadyQueue_.sweep([this, &hadRemoteFiber](Fiber* fiber) {
      runReadyFiber(fiber);
      hadRemoteFiber = true;
    });

    remoteTaskQueue_.sweep([this, &hadRemoteFiber](RemoteTask* taskPtr) {
      std::unique_ptr<RemoteTask> task(taskPtr);
      auto fiber = getFiber();
      if (task->localData) {
        fiber->localData_ = *task->localData;
      }
      fiber->rcontext_ = std::move(task->rcontext);

      fiber->setFunction(std::move(task->func));
      if (observer_) {
        observer_->runnable(reinterpret_cast<uintptr_t>(fiber));
      }
      runReadyFiber(fiber);
      hadRemoteFiber = true;
    });
  }

  if (observer_) {
    for (auto& yielded : yieldedFibers_) {
      observer_->runnable(reinterpret_cast<uintptr_t>(&yielded));
    }
  }
  readyFibers_.splice(readyFibers_.end(), yieldedFibers_);
}

// We need this to be in a struct, not inlined in addTask, because clang crashes
// otherwise.
template <typename F>
struct FiberManager::AddTaskHelper {
  class Func;

  static constexpr bool allocateInBuffer =
      sizeof(Func) <= Fiber::kUserBufferSize;

  class Func {
   public:
    Func(F&& func, FiberManager& fm) : func_(std::forward<F>(func)), fm_(fm) {}

    void operator()() {
      try {
        func_();
      } catch (...) {
        fm_.exceptionCallback_(
            std::current_exception(), "running Func functor");
      }
      if (allocateInBuffer) {
        this->~Func();
      } else {
        delete this;
      }
    }

   private:
    F func_;
    FiberManager& fm_;
  };
};

template <typename F>
void FiberManager::addTask(F&& func) {
  typedef AddTaskHelper<F> Helper;

  auto fiber = getFiber();
  initLocalData(*fiber);

  if (Helper::allocateInBuffer) {
    auto funcLoc = static_cast<typename Helper::Func*>(fiber->getUserBuffer());
    new (funcLoc) typename Helper::Func(std::forward<F>(func), *this);

    fiber->setFunction(std::ref(*funcLoc));
  } else {
    auto funcLoc = new typename Helper::Func(std::forward<F>(func), *this);

    fiber->setFunction(std::ref(*funcLoc));
  }

  readyFibers_.push_back(*fiber);
  if (observer_) {
    observer_->runnable(reinterpret_cast<uintptr_t>(fiber));
  }

  ensureLoopScheduled();
}

template <typename F>
void FiberManager::addTaskRemote(F&& func) {
  auto task = [&]() {
    auto currentFm = getFiberManagerUnsafe();
    if (currentFm && currentFm->currentFiber_ &&
        currentFm->localType_ == localType_) {
      return folly::make_unique<RemoteTask>(
          std::forward<F>(func), currentFm->currentFiber_->localData_);
    }
    return folly::make_unique<RemoteTask>(std::forward<F>(func));
  }();
  auto insertHead = [&]() {
    return remoteTaskQueue_.insertHead(task.release());
  };
  loopController_->scheduleThreadSafe(std::ref(insertHead));
}

template <typename X>
struct IsRvalueRefTry {
  static const bool value = false;
};
template <typename T>
struct IsRvalueRefTry<folly::Try<T>&&> {
  static const bool value = true;
};

// We need this to be in a struct, not inlined in addTaskFinally, because clang
// crashes otherwise.
template <typename F, typename G>
struct FiberManager::AddTaskFinallyHelper {
  class Func;

  typedef typename std::result_of<F()>::type Result;

  class Finally {
   public:
    Finally(G finally, FiberManager& fm)
        : finally_(std::move(finally)), fm_(fm) {}

    void operator()() {
      try {
        finally_(std::move(*result_));
      } catch (...) {
        fm_.exceptionCallback_(
            std::current_exception(), "running Finally functor");
      }

      if (allocateInBuffer) {
        this->~Finally();
      } else {
        delete this;
      }
    }

   private:
    friend class Func;

    G finally_;
    folly::Optional<folly::Try<Result>> result_;
    FiberManager& fm_;
  };

  class Func {
   public:
    Func(F func, Finally& finally)
        : func_(std::move(func)), result_(finally.result_) {}

    void operator()() {
      result_ = folly::makeTryWith(std::move(func_));

      if (allocateInBuffer) {
        this->~Func();
      } else {
        delete this;
      }
    }

   private:
    F func_;
    folly::Optional<folly::Try<Result>>& result_;
  };

  static constexpr bool allocateInBuffer =
      sizeof(Func) + sizeof(Finally) <= Fiber::kUserBufferSize;
};

template <typename F, typename G>
void FiberManager::addTaskFinally(F&& func, G&& finally) {
  typedef typename std::result_of<F()>::type Result;

  static_assert(
      IsRvalueRefTry<typename FirstArgOf<G>::type>::value,
      "finally(arg): arg must be Try<T>&&");
  static_assert(
      std::is_convertible<
          Result,
          typename std::remove_reference<
              typename FirstArgOf<G>::type>::type::element_type>::value,
      "finally(Try<T>&&): T must be convertible from func()'s return type");

  auto fiber = getFiber();
  initLocalData(*fiber);

  typedef AddTaskFinallyHelper<
      typename std::decay<F>::type,
      typename std::decay<G>::type>
      Helper;

  if (Helper::allocateInBuffer) {
    auto funcLoc = static_cast<typename Helper::Func*>(fiber->getUserBuffer());
    auto finallyLoc =
        static_cast<typename Helper::Finally*>(static_cast<void*>(funcLoc + 1));

    new (finallyLoc) typename Helper::Finally(std::forward<G>(finally), *this);
    new (funcLoc) typename Helper::Func(std::forward<F>(func), *finallyLoc);

    fiber->setFunctionFinally(std::ref(*funcLoc), std::ref(*finallyLoc));
  } else {
    auto finallyLoc =
        new typename Helper::Finally(std::forward<G>(finally), *this);
    auto funcLoc =
        new typename Helper::Func(std::forward<F>(func), *finallyLoc);

    fiber->setFunctionFinally(std::ref(*funcLoc), std::ref(*finallyLoc));
  }

  readyFibers_.push_back(*fiber);
  if (observer_) {
    observer_->runnable(reinterpret_cast<uintptr_t>(fiber));
  }

  ensureLoopScheduled();
}

template <typename F>
typename std::result_of<F()>::type FiberManager::runInMainContext(F&& func) {
  if (UNLIKELY(activeFiber_ == nullptr)) {
    return func();
  }

  typedef typename std::result_of<F()>::type Result;

  folly::Try<Result> result;
  auto f = [&func, &result]() mutable {
    result = folly::makeTryWith(std::forward<F>(func));
  };

  immediateFunc_ = std::ref(f);
  activeFiber_->preempt(Fiber::AWAITING_IMMEDIATE);

  return std::move(result).value();
}

inline FiberManager& FiberManager::getFiberManager() {
  assert(currentFiberManager_ != nullptr);
  return *currentFiberManager_;
}

inline FiberManager* FiberManager::getFiberManagerUnsafe() {
  return currentFiberManager_;
}

inline bool FiberManager::hasActiveFiber() const {
  return activeFiber_ != nullptr;
}

inline void FiberManager::yield() {
  assert(currentFiberManager_ == this);
  assert(activeFiber_ != nullptr);
  assert(activeFiber_->state_ == Fiber::RUNNING);
  activeFiber_->preempt(Fiber::YIELDED);
}

template <typename T>
T& FiberManager::local() {
  if (std::type_index(typeid(T)) == localType_ && currentFiber_) {
    return currentFiber_->localData_.get<T>();
  }
  return localThread<T>();
}

template <typename T>
T& FiberManager::localThread() {
#ifndef __APPLE__
  static thread_local T t;
  return t;
#else // osx doesn't support thread_local
  static ThreadLocal<T> t;
  return *t;
#endif
}

inline void FiberManager::initLocalData(Fiber& fiber) {
  auto fm = getFiberManagerUnsafe();
  if (fm && fm->currentFiber_ && fm->localType_ == localType_) {
    fiber.localData_ = fm->currentFiber_->localData_;
  }
  fiber.rcontext_ = RequestContext::saveContext();
}

template <typename LocalT>
FiberManager::FiberManager(
    LocalType<LocalT>,
    std::unique_ptr<LoopController> loopController__,
    Options options)
    : loopController_(std::move(loopController__)),
      stackAllocator_(options.useGuardPages),
      options_(preprocessOptions(std::move(options))),
      exceptionCallback_([](std::exception_ptr eptr, std::string context) {
        try {
          std::rethrow_exception(eptr);
        } catch (const std::exception& e) {
          LOG(DFATAL) << "Exception " << typeid(e).name() << " with message '"
                      << e.what() << "' was thrown in "
                      << "FiberManager with context '" << context << "'";
        } catch (...) {
          LOG(DFATAL) << "Unknown exception was thrown in FiberManager with "
                      << "context '" << context << "'";
        }
      }),
      timeoutManager_(std::make_shared<TimeoutController>(*loopController_)),
      fibersPoolResizer_(*this),
      localType_(typeid(LocalT)) {
  loopController_->setFiberManager(this);
}

template <typename F>
typename FirstArgOf<F>::type::value_type inline await(F&& func) {
  typedef typename FirstArgOf<F>::type::value_type Result;
  typedef typename FirstArgOf<F>::type::baton_type BatonT;

  return Promise<Result, BatonT>::await(std::forward<F>(func));
}
}
}
