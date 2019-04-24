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
#include <folly/synchronization/AtomicNotification.h>
#include <folly/portability/GTest.h>

#include <thread>

using namespace std::literals;

namespace folly {

namespace {
template <typename Integer>
void run_atomic_wait_basic() {
  auto&& atomic = std::atomic<Integer>{0};

  auto&& one = std::thread{[&]() {
    while (true) {
      atomic_wait(&atomic, Integer{0});
      if (atomic.load() == 1) {
        break;
      }
    }
  }};

  atomic.store(1);
  atomic_notify_one(&atomic);

  one.join();
}

template <typename Integer>
void run_atomic_wait_until_with_timeout() {
  auto&& atomic = std::atomic<Integer>{0};

  auto&& one = std::thread{[&]() {
    auto deadline = std::chrono::steady_clock::now() + 10ms;
    while (true) {
      auto result = atomic_wait_until(&atomic, Integer{0}, deadline);

      // Any sort of spurious wakeup caused due to aliasing should not be
      // changing the value in the futex word in proper usage, so we can
      // assert that the value should remain unchanged
      EXPECT_TRUE(!atomic.load());
      if (result == std::cv_status::timeout) {
        EXPECT_TRUE(std::chrono::steady_clock::now() >= deadline);
        break;
      }
    }
  }};

  one.join();
}

template <typename Integer>
void run_atomic_wait_until_with_notification() {
  auto&& atomic = std::atomic<Integer>{0};

  auto&& one = std::thread{[&]() {
    while (true) {
      auto result = atomic_wait_until(
          &atomic, Integer{0}, std::chrono::steady_clock::time_point::max());

      // note that it is safe to check if we returned from the
      // atomic_wait_until() call due to a timeout, futex aliasing can cause
      // spurious wakeups due to address reuse, but will not cause spurious
      // timeouts, since a futex word has only one timeout on the futex queue,
      // and does not inherit timeout from a previous futex at the same
      // address
      EXPECT_TRUE(result != std::cv_status::timeout);
      break;
    }

    EXPECT_EQ(atomic.load(), 1);
  }};

  atomic.store(1);
  atomic_notify_one(&atomic);
  one.join();
}

class SimpleBaton {
 public:
  void wait() {
    auto lck = std::unique_lock<std::mutex>{mutex_};
    while (!signalled_) {
      cv_.wait(lck);
    }

    EXPECT_TRUE(signalled_);
  }

  bool try_wait() {
    auto lck = std::unique_lock<std::mutex>{mutex_};
    return signalled_;
  }

  void post() {
    auto lck = std::unique_lock<std::mutex>{mutex_};
    signalled_ = true;
    cv_.notify_one();
  }

 private:
  std::mutex mutex_;
  std::condition_variable cv_;
  bool signalled_{false};
};

template <typename Integer>
void run_atomic_aliasing() {
  auto&& atomic = folly::Optional<std::atomic<Integer>>{folly::in_place, 0};
  auto&& one = SimpleBaton{};
  auto&& two = SimpleBaton{};

  auto threadOne = std::thread{[&]() {
    while (true) {
      one.wait();
      atomic_wait(atomic.get_pointer(), Integer{0});
      if (atomic->load() == 1) {
        break;
      }
    }
  }};

  atomic->store(1);
  one.post();
  threadOne.join();

  // reset the atomic variable
  atomic.reset();
  atomic.emplace(0);

  auto threadTwo = std::thread{[&]() {
    atomic_wait(atomic.get_pointer(), Integer{0});
    two.post();
  }};

  while (!two.try_wait()) {
    atomic_notify_one(atomic.get_pointer());
  }

  threadTwo.join();
}
} // namespace

TEST(AtomicWait, Basic) {
  run_atomic_wait_basic<std::uint32_t>();
}

TEST(AtomicWait, BasicNonStandardWidths) {
  run_atomic_wait_basic<std::uint8_t>();
  run_atomic_wait_basic<std::uint16_t>();
  run_atomic_wait_basic<std::uint64_t>();
}

TEST(AtomicWait, AtomicWaitUntilTimeout) {
  run_atomic_wait_until_with_timeout<std::uint32_t>();
}

TEST(AtomicWait, AtomicWaitUntilTimeoutNonStandardWidths) {
  run_atomic_wait_until_with_timeout<std::uint8_t>();
  run_atomic_wait_until_with_timeout<std::uint16_t>();
  run_atomic_wait_until_with_timeout<std::uint64_t>();
}

TEST(AtomicWait, AtomicWaitUntilNotified) {
  run_atomic_wait_until_with_notification<std::uint32_t>();
}

TEST(AtomicWait, AtomicWaitUntilNotifiedNonStandardWidths) {
  run_atomic_wait_until_with_notification<std::uint8_t>();
  run_atomic_wait_until_with_notification<std::uint16_t>();
  run_atomic_wait_until_with_notification<std::uint64_t>();
}

TEST(AtomicWait, AtomicWaitAliasing) {
  run_atomic_aliasing<std::uint32_t>();
}

TEST(AtomicWait, AtomicWaitAliasingNonStandardWidths) {
  run_atomic_aliasing<std::uint8_t>();
  run_atomic_aliasing<std::uint16_t>();
  run_atomic_aliasing<std::uint64_t>();
}

} // namespace folly
