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
#include <folly/executors/task_queue/UnboundedBlockingQueue.h>
#include <folly/portability/GTest.h>
#include <folly/synchronization/Baton.h>
#include <thread>

using namespace folly;

TEST(UnboundedQueuee, push_pop) {
  UnboundedBlockingQueue<int> q;
  q.add(42);
  EXPECT_EQ(42, q.take());
}
TEST(UnboundedBlockingQueue, size) {
  UnboundedBlockingQueue<int> q;
  EXPECT_EQ(0, q.size());
  q.add(42);
  EXPECT_EQ(1, q.size());
  q.take();
  EXPECT_EQ(0, q.size());
}

TEST(UnboundedBlockingQueue, concurrent_push_pop) {
  UnboundedBlockingQueue<int> q;
  Baton<> b1, b2;
  std::thread t([&] {
    b1.post();
    EXPECT_EQ(42, q.take());
    EXPECT_EQ(0, q.size());
    b2.post();
  });
  b1.wait();
  q.add(42);
  b2.wait();
  EXPECT_EQ(0, q.size());
  t.join();
}
