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
#include <folly/SpinLock.h>

#include <folly/Random.h>

#include <thread>

#include <folly/portability/Asm.h>
#include <folly/portability/GTest.h>

using folly::SpinLockGuardImpl;

namespace {

template <typename LOCK>
struct LockedVal {
  int ar[1024];
  LOCK lock;

  LockedVal() {
    memset(ar, 0, sizeof ar);
  }
};

template <typename LOCK>
void spinlockTestThread(LockedVal<LOCK>* v) {
  const int max = 1000;
  auto rng = folly::ThreadLocalPRNG();
  for (int i = 0; i < max; i++) {
    folly::asm_pause();
    SpinLockGuardImpl<LOCK> g(v->lock);

    int first = v->ar[0];
    for (size_t j = 1; j < sizeof v->ar / sizeof j; ++j) {
      EXPECT_EQ(first, v->ar[j]);
    }

    int byte = folly::Random::rand32(rng);
    memset(v->ar, char(byte), sizeof v->ar);
  }
}

template <typename LOCK>
struct TryLockState {
  LOCK lock1;
  LOCK lock2;
  bool locked{false};
  uint64_t obtained{0};
  uint64_t failed{0};
};

template <typename LOCK>
void trylockTestThread(TryLockState<LOCK>* state, size_t count) {
  while (true) {
    folly::asm_pause();
    SpinLockGuardImpl<LOCK> g(state->lock1);
    if (state->obtained >= count) {
      break;
    }

    bool ret = state->lock2.trylock();
    EXPECT_NE(state->locked, ret);

    if (ret) {
      // We got lock2.
      ++state->obtained;
      state->locked = true;

      // Release lock1 and wait until at least one other thread fails to
      // obtain the lock2 before continuing.
      auto oldFailed = state->failed;
      while (state->failed == oldFailed && state->obtained < count) {
        state->lock1.unlock();
        folly::asm_pause();
        state->lock1.lock();
      }

      state->locked = false;
      state->lock2.unlock();
    } else {
      ++state->failed;
    }
  }
}

template <typename LOCK>
void correctnessTest() {
  int nthrs = sysconf(_SC_NPROCESSORS_ONLN) * 2;
  std::vector<std::thread> threads;
  LockedVal<LOCK> v;
  for (int i = 0; i < nthrs; ++i) {
    threads.push_back(std::thread(spinlockTestThread<LOCK>, &v));
  }
  for (auto& t : threads) {
    t.join();
  }
}

template <typename LOCK>
void trylockTest() {
  int nthrs = sysconf(_SC_NPROCESSORS_ONLN) + 4;
  std::vector<std::thread> threads;
  TryLockState<LOCK> state;
  size_t count = 100;
  for (int i = 0; i < nthrs; ++i) {
    threads.push_back(std::thread(trylockTestThread<LOCK>, &state, count));
  }
  for (auto& t : threads) {
    t.join();
  }

  EXPECT_EQ(count, state.obtained);
  // Each time the code obtains lock2 it waits for another thread to fail
  // to acquire it.  The only time this might not happen is on the very last
  // loop when no other threads are left.
  EXPECT_GE(state.failed + 1, state.obtained);
}

} // unnamed namespace

#if __x86_64__
TEST(SpinLock, MslCorrectness) {
  correctnessTest<folly::SpinLockMslImpl>();
}
TEST(SpinLock, MslTryLock) {
  trylockTest<folly::SpinLockMslImpl>();
}
#endif

#if __APPLE__
TEST(SpinLock, AppleCorrectness) {
  correctnessTest<folly::SpinLockAppleImpl>();
}
TEST(SpinLock, AppleTryLock) {
  trylockTest<folly::SpinLockAppleImpl>();
}
#endif

#if FOLLY_HAVE_PTHREAD_SPINLOCK_T
TEST(SpinLock, PthreadCorrectness) {
  correctnessTest<folly::SpinLockPthreadImpl>();
}
TEST(SpinLock, PthreadTryLock) {
  trylockTest<folly::SpinLockPthreadImpl>();
}
#endif

TEST(SpinLock, MutexCorrectness) {
  correctnessTest<folly::SpinLockPthreadMutexImpl>();
}
TEST(SpinLock, MutexTryLock) {
  trylockTest<folly::SpinLockPthreadMutexImpl>();
}
