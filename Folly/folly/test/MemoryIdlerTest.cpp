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

#include <folly/detail/MemoryIdler.h>

#include <folly/portability/GMock.h>
#include <folly/portability/GTest.h>
#include <folly/synchronization/Baton.h>

#include <memory>
#include <thread>

using namespace folly;
using namespace folly::detail;
using namespace testing;

TEST(MemoryIdler, releaseStack) {
  MemoryIdler::unmapUnusedStack();
}

TEST(MemoryIdler, releaseStackMinExtra) {
  MemoryIdler::unmapUnusedStack(0);
}

TEST(MemoryIdler, releaseStackLargeExtra) {
  MemoryIdler::unmapUnusedStack(30000000);
}

TEST(MemoryIdler, releaseMallocTLS) {
  auto p = new int[4];
  MemoryIdler::flushLocalMallocCaches();
  delete[] p;
  MemoryIdler::flushLocalMallocCaches();
  p = new int[4];
  MemoryIdler::flushLocalMallocCaches();
  delete[] p;
}

/// MockClock is a bit tricky because we are mocking a static function
/// (now()), so we need to find the corresponding mock instance without
/// extending its scope beyond that of the test.  I generally avoid
/// shared_ptr, but a weak_ptr is just the ticket here
struct MockClock {
  using duration = std::chrono::steady_clock::duration;
  using time_point = std::chrono::time_point<MockClock, duration>;

  MOCK_METHOD0(nowImpl, time_point());

  /// Hold on to the returned shared_ptr until the end of the test
  static std::shared_ptr<StrictMock<MockClock>> setup() {
    auto rv = std::make_shared<StrictMock<MockClock>>();
    s_mockClockInstance = rv;
    return rv;
  }

  static time_point now() {
    return s_mockClockInstance.lock()->nowImpl();
  }

  static std::weak_ptr<StrictMock<MockClock>> s_mockClockInstance;
};

std::weak_ptr<StrictMock<MockClock>> MockClock::s_mockClockInstance;
static auto const forever = MockClock::time_point::max();

/// MockedAtom gives us a way to select a mocked Futex implementation
/// inside Baton, even though the atom itself isn't exercised by the
/// mocked futex
///
/// Futex<MockAtom> is our mocked futex implementation.  Note that the method
/// signatures differ from the real Futex because we have elided unused default
/// params and collapsed templated methods into the used type
template <typename T>
struct MockAtom : public std::atomic<T> {
  explicit MockAtom(T init = 0) : std::atomic<T>(init) {}

  MOCK_CONST_METHOD2(futexWait, FutexResult(uint32_t, uint32_t));
  MOCK_CONST_METHOD3(
      futexWaitUntil,
      FutexResult(uint32_t, const MockClock::time_point&, uint32_t));
};

FutexResult
futexWait(const Futex<MockAtom>* futex, uint32_t expected, uint32_t waitMask) {
  return futex->futexWait(expected, waitMask);
}
template <typename Clock, typename Duration>
FutexResult futexWaitUntil(
    const Futex<MockAtom>* futex,
    std::uint32_t expected,
    std::chrono::time_point<Clock, Duration> const& deadline,
    uint32_t waitMask) {
  return futex->futexWaitUntil(expected, deadline, waitMask);
}

TEST(MemoryIdler, futexWaitValueChangedEarly) {
  Futex<MockAtom> fut;
  auto clock = MockClock::setup();
  auto begin = MockClock::time_point(std::chrono::seconds(100));
  auto idleTimeout = MemoryIdler::defaultIdleTimeout.load();

  EXPECT_CALL(*clock, nowImpl()).WillOnce(Return(begin));
  EXPECT_CALL(
      fut,
      futexWaitUntil(
          1, AllOf(Ge(begin + idleTimeout), Lt(begin + 2 * idleTimeout)), -1))
      .WillOnce(Return(FutexResult::VALUE_CHANGED));
  EXPECT_EQ(
      FutexResult::VALUE_CHANGED, MemoryIdler::futexWaitUntil(fut, 1, forever));
}

TEST(MemoryIdler, futexWaitValueChangedLate) {
  Futex<MockAtom> fut;
  auto clock = MockClock::setup();
  auto begin = MockClock::time_point(std::chrono::seconds(100));
  auto idleTimeout = MemoryIdler::defaultIdleTimeout.load();

  EXPECT_CALL(*clock, nowImpl()).WillOnce(Return(begin));
  EXPECT_CALL(
      fut,
      futexWaitUntil(
          1, AllOf(Ge(begin + idleTimeout), Lt(begin + 2 * idleTimeout)), -1))
      .WillOnce(Return(FutexResult::TIMEDOUT));
  EXPECT_CALL(fut, futexWaitUntil(1, forever, -1))
      .WillOnce(Return(FutexResult::VALUE_CHANGED));
  EXPECT_EQ(
      FutexResult::VALUE_CHANGED, MemoryIdler::futexWaitUntil(fut, 1, forever));
}

TEST(MemoryIdler, futexWaitAwokenEarly) {
  Futex<MockAtom> fut;
  auto clock = MockClock::setup();
  auto begin = MockClock::time_point(std::chrono::seconds(100));
  auto idleTimeout = MemoryIdler::defaultIdleTimeout.load();

  EXPECT_CALL(*clock, nowImpl()).WillOnce(Return(begin));
  EXPECT_CALL(fut, futexWaitUntil(1, Ge(begin + idleTimeout), -1))
      .WillOnce(Return(FutexResult::AWOKEN));
  EXPECT_EQ(FutexResult::AWOKEN, MemoryIdler::futexWaitUntil(fut, 1, forever));
}

TEST(MemoryIdler, futexWaitAwokenLate) {
  Futex<MockAtom> fut;
  auto clock = MockClock::setup();
  auto begin = MockClock::time_point(std::chrono::seconds(100));
  auto idleTimeout = MemoryIdler::defaultIdleTimeout.load();

  EXPECT_CALL(*clock, nowImpl()).WillOnce(Return(begin));
  EXPECT_CALL(fut, futexWaitUntil(1, begin + idleTimeout, -1))
      .WillOnce(Return(FutexResult::TIMEDOUT));
  EXPECT_CALL(fut, futexWaitUntil(1, forever, -1))
      .WillOnce(Return(FutexResult::AWOKEN));
  EXPECT_EQ(
      FutexResult::AWOKEN,
      MemoryIdler::futexWaitUntil(fut, 1, forever, -1, idleTimeout, 100, 0.0f));
}

TEST(MemoryIdler, futexWaitImmediateFlush) {
  Futex<MockAtom> fut;
  auto clock = MockClock::setup();

  EXPECT_CALL(fut, futexWaitUntil(2, forever, 0xff))
      .WillOnce(Return(FutexResult::AWOKEN));
  EXPECT_EQ(
      FutexResult::AWOKEN,
      MemoryIdler::futexWaitUntil(
          fut, 2, forever, 0xff, std::chrono::seconds(0)));
}

TEST(MemoryIdler, futexWaitNeverFlush) {
  Futex<MockAtom> fut;
  auto clock = MockClock::setup();

  EXPECT_CALL(fut, futexWaitUntil(1, forever, -1))
      .WillOnce(Return(FutexResult::AWOKEN));
  EXPECT_EQ(
      FutexResult::AWOKEN,
      MemoryIdler::futexWaitUntil(
          fut, 1, forever, -1, std::chrono::seconds(-7)));
}
