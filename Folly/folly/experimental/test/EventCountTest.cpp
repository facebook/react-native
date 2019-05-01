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

#include <folly/experimental/EventCount.h>

#include <algorithm>
#include <atomic>
#include <random>
#include <thread>
#include <vector>

#include <glog/logging.h>

#include <folly/Random.h>
#include <folly/portability/GTest.h>

using namespace folly;

namespace {

class Semaphore {
 public:
  explicit Semaphore(int v = 0) : value_(v) {}

  void down() {
    ec_.await([this] { return tryDown(); });
  }

  void up() {
    ++value_;
    ec_.notifyAll();
  }

  int value() const {
    return value_;
  }

 private:
  bool tryDown() {
    for (int v = value_; v != 0;) {
      if (value_.compare_exchange_weak(v, v - 1)) {
        return true;
      }
    }
    return false;
  }

  std::atomic<int> value_;
  EventCount ec_;
};

template <class T, class Random>
void randomPartition(
    Random& random,
    T key,
    int n,
    std::vector<std::pair<T, int>>& out) {
  while (n != 0) {
    int m = std::min(n, 1000);
    std::uniform_int_distribution<uint32_t> u(1, m);
    int cut = u(random);
    out.emplace_back(key, cut);
    n -= cut;
  }
}

} // namespace

TEST(EventCount, Simple) {
  // We're basically testing for no deadlock.
  static const size_t count = 300000;

  enum class Op {
    UP,
    DOWN,
  };
  std::vector<std::pair<Op, int>> ops;
  std::mt19937 rnd(randomNumberSeed());
  randomPartition(rnd, Op::UP, count, ops);
  size_t uppers = ops.size();
  randomPartition(rnd, Op::DOWN, count, ops);
  size_t downers = ops.size() - uppers;
  VLOG(1) << "Using " << ops.size() << " threads: uppers=" << uppers
          << " downers=" << downers << " sem_count=" << count;

  std::shuffle(ops.begin(), ops.end(), std::mt19937(std::random_device()()));

  std::vector<std::thread> threads;
  threads.reserve(ops.size());

  Semaphore sem;
  for (auto& op : ops) {
    int n = op.second;
    if (op.first == Op::UP) {
      auto fn = [&sem, n]() mutable {
        while (n--) {
          sem.up();
        }
      };
      threads.push_back(std::thread(fn));
    } else {
      auto fn = [&sem, n]() mutable {
        while (n--) {
          sem.down();
        }
      };
      threads.push_back(std::thread(fn));
    }
  }

  for (auto& thread : threads) {
    thread.join();
  }

  EXPECT_EQ(0, sem.value());
}
