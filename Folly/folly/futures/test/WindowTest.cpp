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

#include <boost/thread/barrier.hpp>

#include <folly/Conv.h>
#include <folly/executors/ManualExecutor.h>
#include <folly/futures/Future.h>
#include <folly/portability/GTest.h>

#include <vector>

using namespace folly;

typedef FutureException eggs_t;
static eggs_t eggs("eggs");

TEST(Window, basic) {
  // int -> Future<int>
  auto fn = [](std::vector<int> input, size_t window_size, size_t expect) {
    auto res =
        reduce(
            window(input, [](int i) { return makeFuture(i); }, window_size),
            0,
            [](int sum, const Try<int>& b) { return sum + *b; })
            .get();
    EXPECT_EQ(expect, res);
  };
  {
    SCOPED_TRACE("2 in-flight at a time");
    std::vector<int> input = {1, 2, 3};
    fn(input, 2, 6);
  }
  {
    SCOPED_TRACE("4 in-flight at a time");
    std::vector<int> input = {1, 2, 3};
    fn(input, 4, 6);
  }
  {
    SCOPED_TRACE("empty input");
    std::vector<int> input;
    fn(input, 1, 0);
  }
  {
    // int -> Future<Unit>
    auto res = reduce(
                   window(
                       std::vector<int>({1, 2, 3}),
                       [](int /* i */) { return makeFuture(); },
                       2),
                   0,
                   [](int sum, const Try<Unit>& b) {
                     EXPECT_TRUE(b.hasValue());
                     return sum + 1;
                   })
                   .get();
    EXPECT_EQ(3, res);
  }
  {
    // string -> return Future<int>
    auto res = reduce(
                   window(
                       std::vector<std::string>{"1", "2", "3"},
                       [](std::string s) {
                         return makeFuture<int>(folly::to<int>(s));
                       },
                       2),
                   0,
                   [](int sum, const Try<int>& b) { return sum + *b; })
                   .get();
    EXPECT_EQ(6, res);
  }
  {
    // string -> return SemiFuture<int>
    auto res = reduce(
                   window(
                       std::vector<std::string>{"1", "2", "3"},
                       [](std::string s) {
                         return makeSemiFuture<int>(folly::to<int>(s));
                       },
                       2),
                   0,
                   [](int sum, const Try<int>& b) { return sum + *b; })
                   .get();
    EXPECT_EQ(6, res);
  }
  {
    SCOPED_TRACE("repeat same fn");
    auto res =
        reduce(
            window(
                5UL,
                [](size_t iteration) { return folly::makeFuture(iteration); },
                2),
            0UL,
            [](size_t sum, const Try<size_t>& b) { return sum + b.value(); })
            .get();
    EXPECT_EQ(0 + 1 + 2 + 3 + 4, res);
  }
}

TEST(Window, exception) {
  std::vector<int> ints = {1, 2, 3, 4};
  std::vector<Promise<int>> ps(4);

  auto res = reduce(
      window(
          ints,
          [&ps](int i) {
            if (i > 2) {
              throw std::runtime_error("exception should not kill process");
            }
            return ps[i].getFuture();
          },
          2),
      0,
      [](int sum, const Try<int>& b) {
        sum += b.hasException<std::exception>() ? 1 : 0;
        return sum;
      });

  for (auto& p : ps) {
    p.setValue(0);
  }

  // Should have received 2 exceptions.
  EXPECT_EQ(2, std::move(res).get());
}

TEST(Window, stackOverflow) {
  // Number of futures to spawn.
  static constexpr size_t m = 1000;
  // Size of each block of input and output.
  static constexpr size_t n = 1000;

  std::vector<std::array<int, n>> ints;
  int64_t expectedSum = 0;
  for (size_t i = 0; i < m; i++) {
    std::array<int, n> next{};
    next[i % n] = i;
    ints.emplace_back(next);
    expectedSum += i;
  }

  // Try to overflow window's executor.
  auto res = reduce(
      window(
          ints,
          [](std::array<int, n> i) {
            return folly::Future<std::array<int, n>>(i);
          },
          1),
      static_cast<int64_t>(0),
      [](int64_t sum, const Try<std::array<int, n>>& b) {
        for (int a : b.value()) {
          sum += a;
        }
        return sum;
      });

  EXPECT_EQ(std::move(res).get(), expectedSum);
}

TEST(Window, parallel) {
  std::vector<int> input;
  std::vector<Promise<int>> ps(10);
  for (size_t i = 0; i < ps.size(); i++) {
    input.emplace_back(i);
  }
  auto f = collect(window(input, [&](int i) { return ps[i].getFuture(); }, 3));

  std::vector<std::thread> ts;
  boost::barrier barrier(ps.size() + 1);
  for (size_t i = 0; i < ps.size(); i++) {
    ts.emplace_back([&ps, &barrier, i]() {
      barrier.wait();
      ps[i].setValue(i);
    });
  }

  barrier.wait();

  for (auto& t : ts) {
    t.join();
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
  auto f = collect(window(input, [&](int i) { return ps[i].getFuture(); }, 3));

  std::vector<std::thread> ts;
  boost::barrier barrier(ps.size() + 1);
  for (size_t i = 0; i < ps.size(); i++) {
    ts.emplace_back([&ps, &barrier, i]() {
      barrier.wait();
      if (i == (ps.size() / 2)) {
        ps[i].setException(eggs);
      } else {
        ps[i].setValue(i);
      }
    });
  }

  barrier.wait();

  for (auto& t : ts) {
    t.join();
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
  auto f =
      collectAll(window(input, [&](int i) { return ps[i].getFuture(); }, 3));

  std::vector<std::thread> ts;
  boost::barrier barrier(ps.size() + 1);
  for (size_t i = 0; i < ps.size(); i++) {
    ts.emplace_back([&ps, &barrier, i]() {
      barrier.wait();
      if (i == (ps.size() / 2)) {
        ps[i].setException(eggs);
      } else {
        ps[i].setValue(i);
      }
    });
  }

  barrier.wait();

  for (auto& t : ts) {
    t.join();
  }

  EXPECT_TRUE(f.isReady());
  for (size_t i = 0; i < ps.size(); i++) {
    if (i == (ps.size() / 2)) {
      EXPECT_THROW(f.value()[i].value(), eggs_t);
    } else {
      EXPECT_TRUE(f.value()[i].hasValue());
      EXPECT_EQ(i, f.value()[i].value());
    }
  }
}

TEST(WindowExecutor, basic) {
  ManualExecutor executor;

  // int -> Future<int>
  auto fn = [executor_ = &executor](
                std::vector<int> input, size_t window_size, size_t expect) {
    auto res = reduce(
        window(
            executor_, input, [](int i) { return makeFuture(i); }, window_size),
        0,
        [](int sum, const Try<int>& b) { return sum + *b; });
    executor_->waitFor(res);
    EXPECT_EQ(expect, std::move(res).get());
  };
  {
    SCOPED_TRACE("2 in-flight at a time");
    std::vector<int> input = {1, 2, 3};
    fn(input, 2, 6);
  }
  {
    SCOPED_TRACE("4 in-flight at a time");
    std::vector<int> input = {1, 2, 3};
    fn(input, 4, 6);
  }
  {
    SCOPED_TRACE("empty input");
    std::vector<int> input;
    fn(input, 1, 0);
  }
  {
    // int -> Future<Unit>
    auto res = reduce(
        window(
            &executor,
            std::vector<int>({1, 2, 3}),
            [](int /* i */) { return makeFuture(); },
            2),
        0,
        [](int sum, const Try<Unit>& b) {
          EXPECT_TRUE(b.hasValue());
          return sum + 1;
        });
    executor.waitFor(res);
    EXPECT_EQ(3, std::move(res).get());
  }
  {
    // string -> return Future<int>
    auto res = reduce(
        window(
            &executor,
            std::vector<std::string>{"1", "2", "3"},
            [](std::string s) { return makeFuture<int>(folly::to<int>(s)); },
            2),
        0,
        [](int sum, const Try<int>& b) { return sum + *b; });
    executor.waitFor(res);
    EXPECT_EQ(6, std::move(res).get());
  }
}

TEST(WindowExecutor, parallel) {
  ManualExecutor executor;

  std::vector<int> input;
  std::vector<Promise<int>> ps(10);
  for (size_t i = 0; i < ps.size(); i++) {
    input.emplace_back(i);
  }
  auto f = collect(
      window(&executor, input, [&](int i) { return ps[i].getFuture(); }, 3));

  std::vector<std::thread> ts;
  boost::barrier barrier(ps.size() + 1);
  for (size_t i = 0; i < ps.size(); i++) {
    ts.emplace_back([&ps, &barrier, i]() {
      barrier.wait();
      ps[i].setValue(i);
    });
  }

  barrier.wait();

  for (auto& t : ts) {
    t.join();
  }

  executor.waitFor(f);
  EXPECT_TRUE(f.isReady());
  for (size_t i = 0; i < ps.size(); i++) {
    EXPECT_EQ(i, f.value()[i]);
  }
}

TEST(WindowExecutor, parallelWithError) {
  ManualExecutor executor;

  std::vector<int> input;
  std::vector<Promise<int>> ps(10);
  for (size_t i = 0; i < ps.size(); i++) {
    input.emplace_back(i);
  }
  auto f = collect(
      window(&executor, input, [&](int i) { return ps[i].getFuture(); }, 3));

  std::vector<std::thread> ts;
  boost::barrier barrier(ps.size() + 1);
  for (size_t i = 0; i < ps.size(); i++) {
    ts.emplace_back([&ps, &barrier, i]() {
      barrier.wait();
      if (i == (ps.size() / 2)) {
        ps[i].setException(eggs);
      } else {
        ps[i].setValue(i);
      }
    });
  }

  barrier.wait();

  for (auto& t : ts) {
    t.join();
  }

  executor.waitFor(f);
  EXPECT_TRUE(f.isReady());
  EXPECT_THROW(f.value(), eggs_t);
}

TEST(WindowExecutor, allParallelWithError) {
  ManualExecutor executor;

  std::vector<int> input;
  std::vector<Promise<int>> ps(10);
  for (size_t i = 0; i < ps.size(); i++) {
    input.emplace_back(i);
  }
  auto f = collectAll(
      window(&executor, input, [&](int i) { return ps[i].getFuture(); }, 3));

  std::vector<std::thread> ts;
  boost::barrier barrier(ps.size() + 1);
  for (size_t i = 0; i < ps.size(); i++) {
    ts.emplace_back([&ps, &barrier, i]() {
      barrier.wait();
      if (i == (ps.size() / 2)) {
        ps[i].setException(eggs);
      } else {
        ps[i].setValue(i);
      }
    });
  }

  barrier.wait();

  for (auto& t : ts) {
    t.join();
  }

  executor.waitFor(f);
  EXPECT_TRUE(f.isReady());
  for (size_t i = 0; i < ps.size(); i++) {
    if (i == (ps.size() / 2)) {
      EXPECT_THROW(f.value()[i].value(), eggs_t);
    } else {
      EXPECT_TRUE(f.value()[i].hasValue());
      EXPECT_EQ(i, f.value()[i].value());
    }
  }
}
