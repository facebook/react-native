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

#include <boost/thread/barrier.hpp>

#include <folly/Conv.h>
#include <folly/futures/Future.h>
#include <folly/portability/GTest.h>

#include <vector>

using namespace folly;

typedef FutureException eggs_t;
static eggs_t eggs("eggs");

TEST(Window, basic) {
  // int -> Future<int>
  auto fn = [](std::vector<int> input, size_t window_size, size_t expect) {
    auto res = reduce(
      window(
        input,
        [](int i) { return makeFuture(i); },
        window_size),
      0,
      [](int sum, const Try<int>& b) {
        return sum + *b;
      }).get();
    EXPECT_EQ(expect, res);
  };
  {
    // 2 in-flight at a time
    std::vector<int> input = {1, 2, 3};
    fn(input, 2, 6);
  }
  {
    // 4 in-flight at a time
    std::vector<int> input = {1, 2, 3};
    fn(input, 4, 6);
  }
  {
    // empty input
    std::vector<int> input;
    fn(input, 1, 0);
  }
  {
    // int -> Future<Unit>
    auto res = reduce(window(std::vector<int>({1, 2, 3}),
                             [](int /* i */) { return makeFuture(); },
                             2),
                      0,
                      [](int sum, const Try<Unit>& b) {
                        EXPECT_TRUE(b.hasValue());
                        return sum + 1;
                      }).get();
    EXPECT_EQ(3, res);
  }
  {
    // string -> return Future<int>
    auto res = reduce(
      window(
        std::vector<std::string>{"1", "2", "3"},
        [](std::string s) { return makeFuture<int>(folly::to<int>(s)); },
        2),
      0,
      [](int sum, const Try<int>& b) {
        return sum + *b;
      }).get();
    EXPECT_EQ(6, res);
  }
}

TEST(Window, parallel) {
  std::vector<int> input;
  std::vector<Promise<int>> ps(10);
  for (size_t i = 0; i < ps.size(); i++) {
    input.emplace_back(i);
  }
  auto f = collect(window(input, [&](int i) {
    return ps[i].getFuture();
  }, 3));

  std::vector<std::thread> ts;
  boost::barrier barrier(ps.size() + 1);
  for (size_t i = 0; i < ps.size(); i++) {
    ts.emplace_back([&ps, &barrier, i]() {
      barrier.wait();
      ps[i].setValue(i);
    });
  }

  barrier.wait();

  for (size_t i = 0; i < ps.size(); i++) {
    ts[i].join();
  }

  EXPECT_TRUE(f.isReady());
  for (size_t i = 0; i < ps.size(); i++) {
    EXPECT_EQ(i, f.value()[i]);
  }
}

TEST(Window, parallelWithError) {
  std::vector<int> input;
  std::vector<Promise<int>> ps(10);
  for (size_t i = 0; i < ps.size(); i++) {
    input.emplace_back(i);
  }
  auto f = collect(window(input, [&](int i) {
    return ps[i].getFuture();
  }, 3));

  std::vector<std::thread> ts;
  boost::barrier barrier(ps.size() + 1);
  for (size_t i = 0; i < ps.size(); i++) {
    ts.emplace_back([&ps, &barrier, i]() {
      barrier.wait();
      if (i == (ps.size()/2)) {
        ps[i].setException(eggs);
      } else {
        ps[i].setValue(i);
      }
    });
  }

  barrier.wait();

  for (size_t i = 0; i < ps.size(); i++) {
    ts[i].join();
  }

  EXPECT_TRUE(f.isReady());
  EXPECT_THROW(f.value(), eggs_t);
}

TEST(Window, allParallelWithError) {
  std::vector<int> input;
  std::vector<Promise<int>> ps(10);
  for (size_t i = 0; i < ps.size(); i++) {
    input.emplace_back(i);
  }
  auto f = collectAll(window(input, [&](int i) {
    return ps[i].getFuture();
  }, 3));

  std::vector<std::thread> ts;
  boost::barrier barrier(ps.size() + 1);
  for (size_t i = 0; i < ps.size(); i++) {
    ts.emplace_back([&ps, &barrier, i]() {
      barrier.wait();
      if (i == (ps.size()/2)) {
        ps[i].setException(eggs);
      } else {
        ps[i].setValue(i);
      }
    });
  }

  barrier.wait();

  for (size_t i = 0; i < ps.size(); i++) {
    ts[i].join();
  }

  EXPECT_TRUE(f.isReady());
  for (size_t i = 0; i < ps.size(); i++) {
    if (i == (ps.size()/2)) {
      EXPECT_THROW(f.value()[i].value(), eggs_t);
    } else {
      EXPECT_TRUE(f.value()[i].hasValue());
      EXPECT_EQ(i, f.value()[i].value());
    }
  }
}
