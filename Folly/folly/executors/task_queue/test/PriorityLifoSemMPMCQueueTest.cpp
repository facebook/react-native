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

#include <vector>

#include <folly/Range.h>
#include <folly/container/Enumerate.h>
#include <folly/executors/task_queue/PriorityLifoSemMPMCQueue.h>
#include <folly/portability/GTest.h>

using namespace folly;

TEST(PriorityLifoSemMPMCQueue, Capacities) {
  const std::vector<size_t> capacities = {1, 2, 3};
  PriorityLifoSemMPMCQueue<int, QueueBehaviorIfFull::THROW> q(
      folly::range(capacities));

  for (auto capacity : folly::enumerate(capacities)) {
    auto pri = static_cast<int8_t>(capacity.index) - 1;
    for (size_t i = 0; i < *capacity; ++i) {
      EXPECT_NO_THROW(q.addWithPriority(0, pri)) << *capacity << " " << i;
    }
    EXPECT_THROW(q.addWithPriority(0, pri), QueueFullException) << *capacity;
  }
}
