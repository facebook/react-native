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
#include <folly/fibers/Fiber.h>
#include <folly/fibers/FiberManagerInternal.h>

namespace folly {
namespace fibers {

inline Baton::Baton() : Baton(NO_WAITER) {
  assert(Baton(NO_WAITER).futex_.futex == static_cast<uint32_t>(NO_WAITER));
  assert(Baton(POSTED).futex_.futex == static_cast<uint32_t>(POSTED));
  assert(Baton(TIMEOUT).futex_.futex == static_cast<uint32_t>(TIMEOUT));
  assert(
      Baton(THREAD_WAITING).futex_.futex ==
      static_cast<uint32_t>(THREAD_WAITING));

  assert(futex_.futex.is_lock_free());
  assert(waitingFiber_.is_lock_free());
}

template <typename F>
void Baton::wait(F&& mainContextFunc) {
  auto fm = FiberManager::getFiberManagerUnsafe();
  if (!fm || !fm->activeFiber_) {
    mainContextFunc();
    return waitThread();
  }

  return waitFiber(*fm, std::forward<F>(mainContextFunc));
}

template <typename F>
void Baton::waitFiber(FiberManager& fm, F&& mainContextFunc) {
  auto& waitingFiber = waitingFiber_;
  auto f = [&mainContextFunc, &waitingFiber](Fiber& fiber) mutable {
    auto baton_fiber = waitingFiber.load();
    do {
      if (LIKELY(baton_fiber == NO_WAITER)) {
        continue;
      } else if (baton_fiber == POSTED || baton_fiber == TIMEOUT) {
        fiber.resume();
        break;
      } else {
        throw std::logic_error("Some Fiber is already waiting on this Baton.");
      }
    } while (!waitingFiber.compare_exchange_weak(
        baton_fiber, reinterpret_cast<intptr_t>(&fiber)));

    mainContextFunc();
  };

  fm.awaitFunc_ = std::ref(f);
  fm.activeFiber_->preempt(Fiber::AWAITING);
}

template <typename F>
bool Baton::timed_wait(
    TimeoutController::Duration timeout,
    F&& mainContextFunc) {
  auto fm = FiberManager::getFiberManagerUnsafe();

  if (!fm || !fm->activeFiber_) {
    mainContextFunc();
    return timedWaitThread(timeout);
  }

  auto& baton = *this;
  bool canceled = false;
  auto timeoutFunc = [&baton, &canceled]() mutable {
    baton.postHelper(TIMEOUT);
    canceled = true;
  };

  auto id =
      fm->timeoutManager_->registerTimeout(std::ref(timeoutFunc), timeout);

  waitFiber(*fm, std::move(mainContextFunc));

  auto posted = waitingFiber_ == POSTED;

  if (!canceled) {
    fm->timeoutManager_->cancel(id);
  }

  return posted;
}

template <typename C, typename D>
bool Baton::timed_wait(const std::chrono::time_point<C, D>& timeout) {
  auto now = C::now();

  if (LIKELY(now <= timeout)) {
    return timed_wait(
        std::chrono::duration_cast<std::chrono::milliseconds>(timeout - now));
  } else {
    return timed_wait(TimeoutController::Duration(0));
  }
}
}
}
