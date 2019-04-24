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

#include <iostream>
#include <thread>

#include <folly/experimental/LockFreeRingBuffer.h>
#include <folly/portability/GTest.h>
#include <folly/test/DeterministicSchedule.h>

namespace folly {

TEST(LockFreeRingBuffer, writeReadSequentially) {
  const int capacity = 256;
  const int turns = 4;

  LockFreeRingBuffer<int> rb(capacity);
  LockFreeRingBuffer<int>::Cursor cur = rb.currentHead();
  for (unsigned int turn = 0; turn < turns; turn++) {
    for (unsigned int write = 0; write < capacity; write++) {
      int val = turn * capacity + write;
      rb.write(val);
    }

    for (unsigned int write = 0; write < capacity; write++) {
      int dest = 0;
      ASSERT_TRUE(rb.tryRead(dest, cur));
      ASSERT_EQ(turn * capacity + write, dest);
      cur.moveForward();
    }
  }
}

TEST(LockFreeRingBuffer, writeReadSequentiallyBackward) {
  const int capacity = 256;
  const int turns = 4;

  LockFreeRingBuffer<int> rb(capacity);
  for (unsigned int turn = 0; turn < turns; turn++) {
    for (unsigned int write = 0; write < capacity; write++) {
      int val = turn * capacity + write;
      rb.write(val);
    }

    LockFreeRingBuffer<int>::Cursor cur = rb.currentHead();
    cur.moveBackward(1); /// last write
    for (int write = capacity - 1; write >= 0; write--) {
      int foo = 0;
      ASSERT_TRUE(rb.tryRead(foo, cur));
      ASSERT_EQ(turn * capacity + write, foo);
      cur.moveBackward();
    }
  }
}

TEST(LockFreeRingBuffer, readsCanBlock) {
  // Start a reader thread, confirm that reading can block
  std::atomic<bool> readerHasRun(false);
  LockFreeRingBuffer<int> rb(1);
  auto cursor = rb.currentHead();
  cursor.moveForward(3); // wait for the 4th write

  const int sentinel = 0xfaceb00c;

  auto reader = std::thread([&]() {
    int val = 0;
    EXPECT_TRUE(rb.waitAndTryRead(val, cursor));
    readerHasRun = true;
    EXPECT_EQ(sentinel, val);
  });

  for (int i = 0; i < 4; i++) {
    EXPECT_FALSE(readerHasRun);
    int val = sentinel;
    rb.write(val);
  }
  reader.join();
  EXPECT_TRUE(readerHasRun);
}

// expose the cursor raw value via a wrapper type
template <typename T, template <typename> class Atom>
uint64_t value(const typename LockFreeRingBuffer<T, Atom>::Cursor& rbcursor) {
  typedef typename LockFreeRingBuffer<T, Atom>::Cursor RBCursor;

  struct ExposedCursor : RBCursor {
    ExposedCursor(const RBCursor& cursor) : RBCursor(cursor) {}
    uint64_t value() {
      return this->ticket;
    }
  };
  return ExposedCursor(rbcursor).value();
}

template <template <typename> class Atom>
void runReader(
    LockFreeRingBuffer<int, Atom>& rb,
    std::atomic<int32_t>& writes) {
  int32_t idx;
  while ((idx = writes--) > 0) {
    rb.write(idx);
  }
}

template <template <typename> class Atom>
void runWritesNeverFail(int capacity, int writes, int writers) {
  using folly::test::DeterministicSchedule;

  DeterministicSchedule sched(DeterministicSchedule::uniform(0));
  LockFreeRingBuffer<int, Atom> rb(capacity);

  std::atomic<int32_t> writes_remaining(writes);
  std::vector<std::thread> threads(writers);

  for (int i = 0; i < writers; i++) {
    threads[i] = DeterministicSchedule::thread(
        std::bind(runReader<Atom>, std::ref(rb), std::ref(writes_remaining)));
  }

  for (auto& thread : threads) {
    DeterministicSchedule::join(thread);
  }

  EXPECT_EQ(writes, (value<int, Atom>)(rb.currentHead()));
}

TEST(LockFreeRingBuffer, writesNeverFail) {
  using folly::detail::EmulatedFutexAtomic;
  using folly::test::DeterministicAtomic;

  runWritesNeverFail<DeterministicAtomic>(1, 100, 4);
  runWritesNeverFail<DeterministicAtomic>(10, 100, 4);
  runWritesNeverFail<DeterministicAtomic>(100, 1000, 8);
  runWritesNeverFail<DeterministicAtomic>(1000, 10000, 16);

  runWritesNeverFail<std::atomic>(1, 100, 4);
  runWritesNeverFail<std::atomic>(10, 100, 4);
  runWritesNeverFail<std::atomic>(100, 1000, 8);
  runWritesNeverFail<std::atomic>(1000, 10000, 16);

  runWritesNeverFail<EmulatedFutexAtomic>(1, 100, 4);
  runWritesNeverFail<EmulatedFutexAtomic>(10, 100, 4);
  runWritesNeverFail<EmulatedFutexAtomic>(100, 1000, 8);
  runWritesNeverFail<EmulatedFutexAtomic>(1000, 10000, 16);
}

TEST(LockFreeRingBuffer, readerCanDetectSkips) {
  const int capacity = 4;
  const int rounds = 4;

  LockFreeRingBuffer<int> rb(capacity);
  auto cursor = rb.currentHead();
  cursor.moveForward(1);

  for (int round = 0; round < rounds; round++) {
    for (int i = 0; i < capacity; i++) {
      int val = round * capacity + i;
      rb.write(val);
    }
  }

  int result = -1;
  EXPECT_FALSE(rb.tryRead(result, cursor));
  EXPECT_FALSE(rb.waitAndTryRead(result, cursor));
  EXPECT_EQ(-1, result);

  cursor = rb.currentTail();
  EXPECT_TRUE(rb.tryRead(result, cursor));
  EXPECT_EQ(capacity * (rounds - 1), result);

  cursor = rb.currentTail(1.0);
  EXPECT_TRUE(rb.tryRead(result, cursor));
  EXPECT_EQ((capacity * rounds) - 1, result);
}

TEST(LockFreeRingBuffer, currentTailRange) {
  const int capacity = 4;
  LockFreeRingBuffer<int> rb(capacity);

  // Workaround for template deduction failure
  auto (&cursorValue)(value<int, std::atomic>);

  // Empty buffer - everything points to 0
  EXPECT_EQ(0, cursorValue(rb.currentTail(0)));
  EXPECT_EQ(0, cursorValue(rb.currentTail(0.5)));
  EXPECT_EQ(0, cursorValue(rb.currentTail(1)));

  // Half-full
  int val = 5;
  rb.write(val);
  rb.write(val);

  EXPECT_EQ(0, cursorValue(rb.currentTail(0)));
  EXPECT_EQ(1, cursorValue(rb.currentTail(1)));

  // Full
  rb.write(val);
  rb.write(val);

  EXPECT_EQ(0, cursorValue(rb.currentTail(0)));
  EXPECT_EQ(3, cursorValue(rb.currentTail(1)));

  auto midvalue = cursorValue(rb.currentTail(0.5));
  // both rounding behaviours are acceptable
  EXPECT_TRUE(midvalue == 1 || midvalue == 2);
}

TEST(LockFreeRingBuffer, cursorFromWrites) {
  const int capacity = 3;
  LockFreeRingBuffer<int> rb(capacity);

  // Workaround for template deduction failure
  auto (&cursorValue)(value<int, std::atomic>);

  int val = 0xfaceb00c;
  EXPECT_EQ(0, cursorValue(rb.writeAndGetCursor(val)));
  EXPECT_EQ(1, cursorValue(rb.writeAndGetCursor(val)));
  EXPECT_EQ(2, cursorValue(rb.writeAndGetCursor(val)));

  // Check that rb is giving out actual cursors and not just
  // pointing to the current slot.
  EXPECT_EQ(3, cursorValue(rb.writeAndGetCursor(val)));
}

TEST(LockFreeRingBuffer, moveBackwardsCanFail) {
  const int capacity = 3;
  LockFreeRingBuffer<int> rb(capacity);

  // Workaround for template deduction failure
  auto (&cursorValue)(value<int, std::atomic>);

  int val = 0xfaceb00c;
  rb.write(val);
  rb.write(val);

  auto cursor = rb.currentHead(); // points to 2
  EXPECT_EQ(2, cursorValue(cursor));
  EXPECT_TRUE(cursor.moveBackward());
  EXPECT_TRUE(cursor.moveBackward()); // now at 0
  EXPECT_FALSE(cursor.moveBackward()); // moving back does nothing
}

} // namespace folly
