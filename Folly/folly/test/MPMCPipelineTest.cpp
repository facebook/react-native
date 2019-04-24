/*
 * Copyright 2013-present Facebook, Inc.
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

#include <folly/MPMCPipeline.h>

#include <thread>
#include <vector>

#include <glog/logging.h>

#include <folly/Conv.h>
#include <folly/portability/GTest.h>

namespace folly {
namespace test {

TEST(MPMCPipeline, Trivial) {
  MPMCPipeline<int, std::string> a(2, 2);
  EXPECT_EQ(0, a.sizeGuess());
  a.blockingWrite(42);
  EXPECT_EQ(1, a.sizeGuess());

  int val;
  auto ticket = a.blockingReadStage<0>(val);
  EXPECT_EQ(42, val);
  EXPECT_EQ(1, a.sizeGuess());

  a.blockingWriteStage<0>(ticket, "hello world");
  EXPECT_EQ(1, a.sizeGuess());

  std::string s;

  a.blockingRead(s);
  EXPECT_EQ("hello world", s);
  EXPECT_EQ(0, a.sizeGuess());
}

TEST(MPMCPipeline, TrivialAmplification) {
  MPMCPipeline<int, MPMCPipelineStage<std::string, 2>> a(2, 2);
  EXPECT_EQ(0, a.sizeGuess());
  a.blockingWrite(42);
  EXPECT_EQ(2, a.sizeGuess());

  int val;
  auto ticket = a.blockingReadStage<0>(val);
  EXPECT_EQ(42, val);
  EXPECT_EQ(2, a.sizeGuess());

  a.blockingWriteStage<0>(ticket, "hello world");
  EXPECT_EQ(2, a.sizeGuess());
  a.blockingWriteStage<0>(ticket, "goodbye");
  EXPECT_EQ(2, a.sizeGuess());

  std::string s;

  a.blockingRead(s);
  EXPECT_EQ("hello world", s);
  EXPECT_EQ(1, a.sizeGuess());

  a.blockingRead(s);
  EXPECT_EQ("goodbye", s);
  EXPECT_EQ(0, a.sizeGuess());
}

TEST(MPMCPipeline, MultiThreaded) {
  constexpr size_t numThreadsPerStage = 6;
  MPMCPipeline<int, std::string, std::string> a(5, 5, 5);

  std::vector<std::thread> threads;
  threads.reserve(numThreadsPerStage * 2 + 1);
  for (size_t i = 0; i < numThreadsPerStage; ++i) {
    threads.emplace_back([&a] {
      for (;;) {
        int val;
        auto ticket = a.blockingReadStage<0>(val);
        if (val == -1) { // stop
          // We still need to propagate
          a.blockingWriteStage<0>(ticket, "");
          break;
        }
        a.blockingWriteStage<0>(ticket, folly::to<std::string>(val, " hello"));
      }
    });
  }

  for (size_t i = 0; i < numThreadsPerStage; ++i) {
    threads.emplace_back([&a] {
      for (;;) {
        std::string val;
        auto ticket = a.blockingReadStage<1>(val);
        if (val.empty()) { // stop
          // We still need to propagate
          a.blockingWriteStage<1>(ticket, "");
          break;
        }
        a.blockingWriteStage<1>(ticket, folly::to<std::string>(val, " world"));
      }
    });
  }

  std::vector<std::string> results;
  threads.emplace_back([&a, &results]() {
    for (;;) {
      std::string val;
      a.blockingRead(val);
      if (val.empty()) {
        break;
      }
      results.push_back(val);
    }
  });

  constexpr size_t numValues = 1000;
  for (size_t i = 0; i < numValues; ++i) {
    a.blockingWrite(i);
  }
  for (size_t i = 0; i < numThreadsPerStage; ++i) {
    a.blockingWrite(-1);
  }

  for (auto& t : threads) {
    t.join();
  }

  // The consumer thread dequeued the first empty string, there should be
  // numThreadsPerStage - 1 left.
  EXPECT_EQ(numThreadsPerStage - 1, a.sizeGuess());
  for (size_t i = 0; i < numThreadsPerStage - 1; ++i) {
    std::string val;
    a.blockingRead(val);
    EXPECT_TRUE(val.empty());
  }
  {
    std::string tmp;
    EXPECT_FALSE(a.read(tmp));
  }
  EXPECT_EQ(0, a.sizeGuess());

  EXPECT_EQ(numValues, results.size());
  for (size_t i = 0; i < results.size(); ++i) {
    EXPECT_EQ(folly::to<std::string>(i, " hello world"), results[i]);
  }
}

} // namespace test
} // namespace folly

int main(int argc, char* argv[]) {
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  return RUN_ALL_TESTS();
}
