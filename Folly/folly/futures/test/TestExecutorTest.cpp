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

#include <folly/futures/test/TestExecutor.h>
#include <folly/portability/GTest.h>

using namespace std;
using namespace std::chrono;
using namespace folly;

TEST(TestExecutor, parallel_run) {
  mutex m;
  set<thread::id> ids;
  auto executor = std::make_unique<TestExecutor>(4);
  const auto numThreads = executor->numThreads();
  EXPECT_EQ(4, numThreads);
  for (auto idx = 0U; idx < numThreads * 10; ++idx) {
    executor->add([&m, &ids]() mutable {
      /* sleep override */ this_thread::sleep_for(milliseconds(100));
      lock_guard<mutex> lg(m);
      ids.insert(this_thread::get_id());
    });
  }

  executor = nullptr;
  EXPECT_EQ(ids.size(), numThreads);
}
