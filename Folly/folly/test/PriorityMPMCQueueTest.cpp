/*
 * Copyright 2017-present Facebook, Inc.
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

#include <folly/PriorityMPMCQueue.h>
#include <folly/portability/GTest.h>

using namespace folly;

TEST(PriorityMPMCQueue, BasicOps) {
  // With just one priority, this should behave like a normal MPMCQueue
  PriorityMPMCQueue<size_t> queue(1, 10);
  EXPECT_TRUE(queue.isEmpty());
  EXPECT_EQ(1, queue.getNumPriorities());

  queue.write(9);
  queue.write(8);

  EXPECT_FALSE(queue.isEmpty());
  EXPECT_EQ(2, queue.size());
  EXPECT_EQ(2, queue.sizeGuess());

  size_t item;
  queue.read(item);
  EXPECT_EQ(9, item);
  EXPECT_FALSE(queue.isEmpty());
  EXPECT_EQ(1, queue.size());
  EXPECT_EQ(1, queue.sizeGuess());

  queue.read(item);
  EXPECT_EQ(8, item);
  EXPECT_TRUE(queue.isEmpty());
  EXPECT_EQ(0, queue.size());
  EXPECT_EQ(0, queue.sizeGuess());
}

TEST(PriorityMPMCQueue, TestPriorities) {
  PriorityMPMCQueue<size_t> queue(3, 10);
  EXPECT_TRUE(queue.isEmpty());
  EXPECT_EQ(3, queue.getNumPriorities());

  // This should go to the lowpri queue, as we only
  // have 3 priorities
  queue.writeWithPriority(5, 50);
  // unqualified writes should be mid-pri
  queue.write(3);
  queue.writeWithPriority(6, 2);
  queue.writeWithPriority(1, 0);
  queue.write(4);
  queue.writeWithPriority(2, 0);

  EXPECT_FALSE(queue.isEmpty());
  EXPECT_EQ(6, queue.size());
  EXPECT_EQ(6, queue.sizeGuess());

  size_t item;
  for (int i = 1; i <= 6; i++) {
    queue.read(item);
    EXPECT_EQ(i, item);
    EXPECT_EQ(6 - i, queue.size());
    EXPECT_EQ(6 - i, queue.sizeGuess());
  }
}

TEST(PriorityMPMCQueue, TestReadWithPriority) {
  PriorityMPMCQueue<size_t> queue(3, 10);
  EXPECT_TRUE(queue.isEmpty());
  EXPECT_EQ(3, queue.getNumPriorities());

  queue.writeWithPriority(2, 2);
  queue.writeWithPriority(1, 1);
  queue.writeWithPriority(0, 0);

  EXPECT_FALSE(queue.isEmpty());
  EXPECT_EQ(3, queue.size());
  EXPECT_EQ(3, queue.sizeGuess());

  size_t item;
  for (int i = 0; i < 3; i++) {
    EXPECT_TRUE(queue.readWithPriority(item, i));
    EXPECT_EQ(i, item);
    EXPECT_FALSE(queue.readWithPriority(item, i));
  }
}

TEST(PriorityMPMCQueue, TestWriteWithPriorityAndTimeout) {
  PriorityMPMCQueue<size_t> queue(5, 1);
  EXPECT_TRUE(queue.isEmpty());
  EXPECT_EQ(5, queue.getNumPriorities());

  const auto timeout = std::chrono::milliseconds{30};
  for (int i = 0; i < 5; i++) {
    auto time_before = std::chrono::steady_clock::now();
    EXPECT_TRUE(queue.writeWithPriority(i, i, timeout));
    auto time_after = std::chrono::steady_clock::now();
    EXPECT_LE(time_after - time_before, timeout);
  }

  // check writeWithPriority will wait for at least timeout if the queue is
  // full.
  auto time_before = std::chrono::steady_clock::now();
  EXPECT_FALSE(queue.writeWithPriority(5, 0, timeout));
  auto time_after = std::chrono::steady_clock::now();
  EXPECT_GE(time_after - time_before, timeout);

  EXPECT_FALSE(queue.isEmpty());
  EXPECT_EQ(5, queue.size());
  EXPECT_EQ(5, queue.sizeGuess());

  size_t item;
  for (int i = 0; i < 5; i++) {
    queue.read(item);
    EXPECT_EQ(i, item);
    EXPECT_EQ(4 - i, queue.size());
    EXPECT_EQ(4 - i, queue.sizeGuess());
  }
}
