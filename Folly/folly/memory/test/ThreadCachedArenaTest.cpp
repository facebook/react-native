/*
 * Copyright 2012-present Facebook, Inc.
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

#include <folly/memory/ThreadCachedArena.h>

#include <algorithm>
#include <iterator>
#include <map>
#include <mutex>
#include <random>
#include <thread>
#include <unordered_map>

#include <glog/logging.h>

#include <folly/Benchmark.h>
#include <folly/Memory.h>
#include <folly/Range.h>
#include <folly/lang/Align.h>
#include <folly/portability/GTest.h>

using namespace folly;

namespace {

class ArenaTester {
 public:
  explicit ArenaTester(ThreadCachedArena& arena) : arena_(&arena) {}

  void allocate(size_t count, size_t maxSize);
  void verify();
  void merge(ArenaTester&& other);

 private:
  std::mutex mergeMutex_;
  std::vector<std::pair<uint8_t, Range<uint8_t*>>> areas_;
  ThreadCachedArena* arena_;
};

void ArenaTester::allocate(size_t count, size_t maxSize) {
  // Allocate chunks of memory of random sizes
  std::mt19937 rnd;
  std::uniform_int_distribution<uint32_t> sizeDist(1, maxSize - 1);
  areas_.clear();
  areas_.reserve(count);
  for (size_t i = 0; i < count; i++) {
    size_t size = sizeDist(rnd);
    uint8_t* p = static_cast<uint8_t*>(arena_->allocate(size));
    areas_.emplace_back(uint8_t(rnd() & 0xff), Range<uint8_t*>(p, size));
  }

  // Fill each area with a different value, to prove that they don't overlap
  // Fill in random order.
  std::random_shuffle(areas_.begin(), areas_.end(), [&rnd](ptrdiff_t n) {
    return std::uniform_int_distribution<uint32_t>(0, n - 1)(rnd);
  });

  for (auto& p : areas_) {
    std::fill(p.second.begin(), p.second.end(), p.first);
  }
}

void ArenaTester::verify() {
  for (auto& p : areas_) {
    for (auto v : p.second) {
      EXPECT_EQ(p.first, v);
    }
  }
}

void ArenaTester::merge(ArenaTester&& other) {
  {
    std::lock_guard<std::mutex> lock(mergeMutex_);
    std::move(
        other.areas_.begin(), other.areas_.end(), std::back_inserter(areas_));
  }
  other.areas_.clear();
}

} // namespace

TEST(ThreadCachedArena, BlockSize) {
  static const size_t alignment = max_align_v;
  static const size_t requestedBlockSize = 64;

  ThreadCachedArena arena(requestedBlockSize);
  size_t blockSize = alignment;
  uint8_t* prev = static_cast<uint8_t*>(arena.allocate(1));

  // Keep allocating until we're no longer one single alignment away from the
  // previous allocation -- that's when we've gotten to the next block.
  uint8_t* p;
  while ((p = static_cast<uint8_t*>(arena.allocate(1))) == prev + alignment) {
    prev = p;
    blockSize += alignment;
  }

  VLOG(1) << "Requested block size: " << requestedBlockSize
          << ", actual: " << blockSize;
  EXPECT_LE(requestedBlockSize, blockSize);
}

TEST(ThreadCachedArena, SingleThreaded) {
  static const size_t requestedBlockSize = 64;
  ThreadCachedArena arena(requestedBlockSize);
  EXPECT_EQ(arena.totalSize(), sizeof(ThreadCachedArena));

  ArenaTester tester(arena);
  tester.allocate(100, 100 << 10);
  tester.verify();

  EXPECT_GT(arena.totalSize(), sizeof(ThreadCachedArena));
}

TEST(ThreadCachedArena, MultiThreaded) {
  static const size_t requestedBlockSize = 64;
  ThreadCachedArena arena(requestedBlockSize);
  ArenaTester mainTester(arena);

  // Do this twice, to catch the possibility that memory from the first
  // round gets freed
  static const size_t numThreads = 20;
  for (size_t i = 0; i < 2; i++) {
    std::vector<std::thread> threads;
    threads.reserve(numThreads);
    for (size_t j = 0; j < numThreads; j++) {
      threads.emplace_back([&arena, &mainTester]() {
        ArenaTester tester(arena);
        tester.allocate(500, 1 << 10);
        tester.verify();
        mainTester.merge(std::move(tester));
      });
    }
    for (auto& t : threads) {
      t.join();
    }
  }

  mainTester.verify();
}

TEST(ThreadCachedArena, ThreadCachedArenaAllocator) {
  using Map = std::unordered_map<
      int,
      int,
      std::hash<int>,
      std::equal_to<int>,
      ThreadCachedArenaAllocator<std::pair<const int, int>>>;

  static const size_t requestedBlockSize = 64;
  ThreadCachedArena arena(requestedBlockSize);

  Map map{0,
          std::hash<int>(),
          std::equal_to<int>(),
          ThreadCachedArenaAllocator<std::pair<const int, int>>(arena)};

  for (int i = 0; i < 1000; i++) {
    map[i] = i;
  }

  for (int i = 0; i < 1000; i++) {
    EXPECT_EQ(i, map[i]);
  }
}

namespace {

static const int kNumValues = 10000;

BENCHMARK(bmUMStandard, iters) {
  using Map = std::unordered_map<int, int>;

  while (iters--) {
    Map map{0};
    for (int i = 0; i < kNumValues; i++) {
      map[i] = i;
    }
  }
}

BENCHMARK(bmUMArena, iters) {
  using Map = std::unordered_map<
      int,
      int,
      std::hash<int>,
      std::equal_to<int>,
      ThreadCachedArenaAllocator<std::pair<const int, int>>>;

  while (iters--) {
    ThreadCachedArena arena;

    Map map{0,
            std::hash<int>(),
            std::equal_to<int>(),
            ThreadCachedArenaAllocator<std::pair<const int, int>>(arena)};

    for (int i = 0; i < kNumValues; i++) {
      map[i] = i;
    }
  }
}

BENCHMARK_DRAW_LINE();

BENCHMARK(bmMStandard, iters) {
  using Map = std::map<int, int>;

  while (iters--) {
    Map map;
    for (int i = 0; i < kNumValues; i++) {
      map[i] = i;
    }
  }
}

BENCHMARK_DRAW_LINE();

BENCHMARK(bmMArena, iters) {
  using Map = std::map<
      int,
      int,
      std::less<int>,
      ThreadCachedArenaAllocator<std::pair<const int, int>>>;

  while (iters--) {
    ThreadCachedArena arena;

    Map map{std::less<int>(),
            ThreadCachedArenaAllocator<std::pair<const int, int>>(arena)};

    for (int i = 0; i < kNumValues; i++) {
      map[i] = i;
    }
  }
}

BENCHMARK_DRAW_LINE();

} // namespace

// Benchmark                               Iters   Total t    t/iter iter/sec
// ----------------------------------------------------------------------------
// Comparing benchmarks: bmUMStandard,bmUMArena
//  + 143% bmUMStandard                     1570  2.005 s   1.277 ms  782.9
// *       bmUMArena                        3817  2.003 s   524.7 us  1.861 k
// ----------------------------------------------------------------------------
// Comparing benchmarks: bmMStandard,bmMArena
//  +79.0% bmMStandard                      1197  2.009 s   1.678 ms  595.8
// *       bmMArena                         2135  2.002 s   937.6 us  1.042 k
// ----------------------------------------------------------------------------

int main(int argc, char* argv[]) {
  testing::InitGoogleTest(&argc, argv);
  gflags::ParseCommandLineFlags(&argc, &argv, true);
  auto ret = RUN_ALL_TESTS();
  if (!ret && FLAGS_benchmark) {
    folly::runBenchmarks();
  }
  return ret;
}
