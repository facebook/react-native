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

#include <numeric>

#include <boost/thread/barrier.hpp>

#include <folly/Random.h>
#include <folly/futures/Future.h>
#include <folly/portability/GTest.h>
#include <folly/small_vector.h>

using namespace folly;

typedef FutureException eggs_t;
static eggs_t eggs("eggs");

auto rng = std::mt19937(folly::randomNumberSeed());

TEST(Collect, collectAll) {
  // returns a vector variant
  {
    std::vector<Promise<int>> promises(10);
    std::vector<Future<int>> futures;

    for (auto& p : promises) {
      futures.push_back(p.getFuture());
    }

    auto allf = collectAll(futures);

    std::shuffle(promises.begin(), promises.end(), rng);
    for (auto& p : promises) {
      EXPECT_FALSE(allf.isReady());
      p.setValue(42);
    }

    EXPECT_TRUE(allf.isReady());
    auto& results = allf.value();
    for (auto& t : results) {
      EXPECT_EQ(42, t.value());
    }
  }

  // check error semantics
  {
    std::vector<Promise<int>> promises(4);
    std::vector<Future<int>> futures;

    for (auto& p : promises) {
      futures.push_back(p.getFuture());
    }

    auto allf = collectAll(futures);

    promises[0].setValue(42);
    promises[1].setException(eggs);

    EXPECT_FALSE(allf.isReady());

    promises[2].setValue(42);

    EXPECT_FALSE(allf.isReady());

    promises[3].setException(eggs);

    EXPECT_TRUE(allf.isReady());
    EXPECT_FALSE(allf.getTry().hasException());

    auto& results = allf.value();
    EXPECT_EQ(42, results[0].value());
    EXPECT_TRUE(results[1].hasException());
    EXPECT_EQ(42, results[2].value());
    EXPECT_TRUE(results[3].hasException());
  }

  // check that futures are ready in then()
  {
    std::vector<Promise<Unit>> promises(10);
    std::vector<Future<Unit>> futures;

    for (auto& p : promises) {
      futures.push_back(p.getFuture());
    }

    auto allf = collectAllSemiFuture(futures).toUnsafeFuture().then(
        [](Try<std::vector<Try<Unit>>>&& ts) {
          for (auto& f : ts.value()) {
            f.value();
          }
        });

    std::shuffle(promises.begin(), promises.end(), rng);
    for (auto& p : promises) {
      p.setValue();
    }
    EXPECT_TRUE(allf.isReady());
  }
}

TEST(Collect, collect) {
  // success case
  {
    std::vector<Promise<int>> promises(10);
    std::vector<Future<int>> futures;

    for (auto& p : promises) {
      futures.push_back(p.getFuture());
    }

    auto allf = collect(futures);

    std::shuffle(promises.begin(), promises.end(), rng);
    for (auto& p : promises) {
      EXPECT_FALSE(allf.isReady());
      p.setValue(42);
    }

    EXPECT_TRUE(allf.isReady());
    for (auto i : allf.value()) {
      EXPECT_EQ(42, i);
    }
  }

  // failure case
  {
    std::vector<Promise<int>> promises(10);
    std::vector<Future<int>> futures;

    for (auto& p : promises) {
      futures.push_back(p.getFuture());
    }

    auto allf = collect(futures);

    std::shuffle(promises.begin(), promises.end(), rng);
    for (int i = 0; i < 10; i++) {
      if (i < 5) {
        // everthing goes well so far...
        EXPECT_FALSE(allf.isReady());
        promises[i].setValue(42);
      } else if (i == 5) {
        // short circuit with an exception
        EXPECT_FALSE(allf.isReady());
        promises[i].setException(eggs);
        EXPECT_TRUE(allf.isReady());
      } else if (i < 8) {
        // don't blow up on further values
        EXPECT_TRUE(allf.isReady());
        promises[i].setValue(42);
      } else {
        // don't blow up on further exceptions
        EXPECT_TRUE(allf.isReady());
        promises[i].setException(eggs);
      }
    }

    EXPECT_THROW(allf.value(), eggs_t);
  }

  // void futures success case
  {
    std::vector<Promise<Unit>> promises(10);
    std::vector<Future<Unit>> futures;

    for (auto& p : promises) {
      futures.push_back(p.getFuture());
    }

    auto allf = collect(futures);

    std::shuffle(promises.begin(), promises.end(), rng);
    for (auto& p : promises) {
      EXPECT_FALSE(allf.isReady());
      p.setValue();
    }

    EXPECT_TRUE(allf.isReady());
  }

  // void futures failure case
  {
    std::vector<Promise<Unit>> promises(10);
    std::vector<Future<Unit>> futures;

    for (auto& p : promises) {
      futures.push_back(p.getFuture());
    }

    auto allf = collect(futures);

    std::shuffle(promises.begin(), promises.end(), rng);
    for (int i = 0; i < 10; i++) {
      if (i < 5) {
        // everthing goes well so far...
        EXPECT_FALSE(allf.isReady());
        promises[i].setValue();
      } else if (i == 5) {
        // short circuit with an exception
        EXPECT_FALSE(allf.isReady());
        promises[i].setException(eggs);
        EXPECT_TRUE(allf.isReady());
      } else if (i < 8) {
        // don't blow up on further values
        EXPECT_TRUE(allf.isReady());
        promises[i].setValue();
      } else {
        // don't blow up on further exceptions
        EXPECT_TRUE(allf.isReady());
        promises[i].setException(eggs);
      }
    }

    EXPECT_THROW(allf.value(), eggs_t);
  }

  // move only compiles
  {
    std::vector<Promise<std::unique_ptr<int>>> promises(10);
    std::vector<Future<std::unique_ptr<int>>> futures;

    for (auto& p : promises) {
      futures.push_back(p.getFuture());
    }

    collect(futures);
  }
}

struct NotDefaultConstructible {
  NotDefaultConstructible() = delete;
  explicit NotDefaultConstructible(int arg) : i(arg) {}
  int i;
};

// We have a specialized implementation for non-default-constructible objects
// Ensure that it works and preserves order
TEST(Collect, collectNotDefaultConstructible) {
  std::vector<Promise<NotDefaultConstructible>> promises(10);
  std::vector<Future<NotDefaultConstructible>> futures;
  std::vector<int> indices(10);
  std::iota(indices.begin(), indices.end(), 0);
  std::shuffle(indices.begin(), indices.end(), rng);

  for (auto& p : promises) {
    futures.push_back(p.getFuture());
  }

  auto allf = collect(futures);

  for (auto i : indices) {
    EXPECT_FALSE(allf.isReady());
    promises[i].setValue(NotDefaultConstructible(i));
  }

  EXPECT_TRUE(allf.isReady());
  int i = 0;
  for (auto val : allf.value()) {
    EXPECT_EQ(i, val.i);
    i++;
  }
}

TEST(Collect, collectAny) {
  {
    std::vector<Promise<int>> promises(10);
    std::vector<Future<int>> futures;

    for (auto& p : promises) {
      futures.push_back(p.getFuture());
    }

    for (auto& f : futures) {
      EXPECT_FALSE(f.isReady());
    }

    auto anyf = collectAny(futures);

    /* futures were moved in, so these are invalid now */
    EXPECT_FALSE(anyf.isReady());

    promises[7].setValue(42);
    EXPECT_TRUE(anyf.isReady());
    auto& idx_fut = anyf.value();

    auto i = idx_fut.first;
    EXPECT_EQ(7, i);

    auto& f = idx_fut.second;
    EXPECT_EQ(42, f.value());
  }

  // error
  {
    std::vector<Promise<Unit>> promises(10);
    std::vector<Future<Unit>> futures;

    for (auto& p : promises) {
      futures.push_back(p.getFuture());
    }

    for (auto& f : futures) {
      EXPECT_FALSE(f.isReady());
    }

    auto anyf = collectAny(futures);

    EXPECT_FALSE(anyf.isReady());

    promises[3].setException(eggs);
    EXPECT_TRUE(anyf.isReady());
    EXPECT_TRUE(anyf.value().second.hasException());
  }

  // then()
  {
    std::vector<Promise<int>> promises(10);
    std::vector<Future<int>> futures;

    for (auto& p : promises) {
      futures.push_back(p.getFuture());
    }

    auto anyf = collectAny(futures).then(
        [](std::pair<size_t, Try<int>> p) { EXPECT_EQ(42, p.second.value()); });

    promises[3].setValue(42);
    EXPECT_TRUE(anyf.isReady());
  }
}

TEST(Collect, collectAnyWithoutException) {
  {
    std::vector<Promise<int>> promises(10);
    std::vector<Future<int>> futures;

    for (auto& p : promises) {
      futures.push_back(p.getFuture());
    }

    auto onef = collectAnyWithoutException(futures);

    /* futures were moved in, so these are invalid now */
    EXPECT_FALSE(onef.isReady());

    promises[7].setValue(42);
    EXPECT_TRUE(onef.isReady());
    auto& idx_fut = onef.value();
    EXPECT_EQ(7, idx_fut.first);
    EXPECT_EQ(42, idx_fut.second);
  }

  // some exception before ready
  {
    std::vector<Promise<int>> promises(10);
    std::vector<Future<int>> futures;

    for (auto& p : promises) {
      futures.push_back(p.getFuture());
    }

    auto onef = collectAnyWithoutException(futures);

    EXPECT_FALSE(onef.isReady());

    promises[3].setException(eggs);
    EXPECT_FALSE(onef.isReady());
    promises[4].setException(eggs);
    EXPECT_FALSE(onef.isReady());
    promises[0].setValue(99);
    EXPECT_TRUE(onef.isReady());
    auto& idx_fut = onef.value();
    EXPECT_EQ(0, idx_fut.first);
    EXPECT_EQ(99, idx_fut.second);
  }

  // all exceptions
  {
    std::vector<Promise<int>> promises(10);
    std::vector<Future<int>> futures;

    for (auto& p : promises) {
      futures.push_back(p.getFuture());
    }

    auto onef = collectAnyWithoutException(futures);

    EXPECT_FALSE(onef.isReady());
    for (int i = 0; i < 9; ++i) {
      promises[i].setException(eggs);
    }
    EXPECT_FALSE(onef.isReady());

    promises[9].setException(eggs);
    EXPECT_TRUE(onef.isReady());
    EXPECT_TRUE(onef.hasException());
  }
}

TEST(Collect, alreadyCompleted) {
  {
    std::vector<Future<Unit>> fs;
    for (int i = 0; i < 10; i++) {
      fs.push_back(makeFuture());
    }

    collectAllSemiFuture(fs).toUnsafeFuture().then(
        [&](std::vector<Try<Unit>> ts) { EXPECT_EQ(fs.size(), ts.size()); });
  }
  {
    std::vector<Future<int>> fs;
    for (int i = 0; i < 10; i++) {
      fs.push_back(makeFuture(i));
    }

    collectAny(fs).then([&](std::pair<size_t, Try<int>> p) {
      EXPECT_EQ(p.first, p.second.value());
    });
  }
}

TEST(Collect, parallel) {
  std::vector<Promise<int>> ps(10);
  std::vector<Future<int>> fs;
  for (size_t i = 0; i < ps.size(); i++) {
    fs.emplace_back(ps[i].getFuture());
  }
  auto f = collect(fs);

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

TEST(Collect, parallelWithError) {
  std::vector<Promise<int>> ps(10);
  std::vector<Future<int>> fs;
  for (size_t i = 0; i < ps.size(); i++) {
    fs.emplace_back(ps[i].getFuture());
  }
  auto f = collect(fs);

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

  for (size_t i = 0; i < ps.size(); i++) {
    ts[i].join();
  }

  EXPECT_TRUE(f.isReady());
  EXPECT_THROW(f.value(), eggs_t);
}

TEST(Collect, allParallel) {
  std::vector<Promise<int>> ps(10);
  std::vector<Future<int>> fs;
  for (size_t i = 0; i < ps.size(); i++) {
    fs.emplace_back(ps[i].getFuture());
  }
  auto f = collectAll(fs);

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
    EXPECT_TRUE(f.value()[i].hasValue());
    EXPECT_EQ(i, f.value()[i].value());
  }
}

TEST(Collect, allParallelWithError) {
  std::vector<Promise<int>> ps(10);
  std::vector<Future<int>> fs;
  for (size_t i = 0; i < ps.size(); i++) {
    fs.emplace_back(ps[i].getFuture());
  }
  auto f = collectAll(fs);

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

  for (size_t i = 0; i < ps.size(); i++) {
    ts[i].join();
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

TEST(Collect, collectN) {
  std::vector<Promise<Unit>> promises(10);
  std::vector<Future<Unit>> futures;

  for (auto& p : promises) {
    futures.push_back(p.getFuture());
  }

  bool flag = false;
  size_t n = 3;
  collectN(futures, n)
      .via(&InlineExecutor::instance())
      .then([&](std::vector<std::pair<size_t, Try<Unit>>> v) {
        flag = true;
        EXPECT_EQ(n, v.size());
        for (auto& tt : v) {
          EXPECT_TRUE(tt.second.hasValue());
        }
      });

  promises[0].setValue();
  EXPECT_FALSE(flag);
  promises[1].setValue();
  EXPECT_FALSE(flag);
  promises[2].setValue();
  EXPECT_TRUE(flag);
}

TEST(Collect, collectNParallel) {
  std::vector<Promise<Unit>> ps(100);
  std::vector<Future<Unit>> futures;

  for (auto& p : ps) {
    futures.push_back(p.getFuture());
  }

  bool flag = false;
  size_t n = 90;
  collectN(futures, n)
      .via(&InlineExecutor::instance())
      .then([&](std::vector<std::pair<size_t, Try<Unit>>> v) {
        flag = true;
        EXPECT_EQ(n, v.size());
        for (auto& tt : v) {
          EXPECT_TRUE(tt.second.hasValue());
        }
      });

  std::vector<std::thread> ts;
  boost::barrier barrier(ps.size() + 1);
  for (size_t i = 0; i < ps.size(); i++) {
    ts.emplace_back([&ps, &barrier, i]() {
      barrier.wait();
      ps[i].setValue();
    });
  }

  barrier.wait();

  for (size_t i = 0; i < ps.size(); i++) {
    ts[i].join();
  }

  EXPECT_TRUE(flag);
}

/// Ensure that we can compile collectAll/Any with folly::small_vector
TEST(Collect, smallVector) {
  static_assert(
      !folly::is_trivially_copyable<Future<Unit>>::value,
      "Futures should not be trivially copyable");
  static_assert(
      !folly::is_trivially_copyable<Future<int>>::value,
      "Futures should not be trivially copyable");

  {
    folly::small_vector<Future<Unit>> futures;

    for (int i = 0; i < 10; i++) {
      futures.push_back(makeFuture());
    }

    auto anyf = collectAny(futures);
  }
  {
    folly::small_vector<Future<Unit>> futures;

    for (int i = 0; i < 10; i++) {
      futures.push_back(makeFuture());
    }

    auto allf = collectAll(futures);
  }
}

TEST(Collect, collectAllVariadic) {
  Promise<bool> pb;
  Promise<int> pi;
  Future<bool> fb = pb.getFuture();
  Future<int> fi = pi.getFuture();
  bool flag = false;
  collectAllSemiFuture(std::move(fb), std::move(fi))
      .toUnsafeFuture()
      .then([&](std::tuple<Try<bool>, Try<int>> tup) {
        flag = true;
        EXPECT_TRUE(std::get<0>(tup).hasValue());
        EXPECT_EQ(std::get<0>(tup).value(), true);
        EXPECT_TRUE(std::get<1>(tup).hasValue());
        EXPECT_EQ(std::get<1>(tup).value(), 42);
      });
  pb.setValue(true);
  EXPECT_FALSE(flag);
  pi.setValue(42);
  EXPECT_TRUE(flag);
}

TEST(Collect, collectAllVariadicReferences) {
  Promise<bool> pb;
  Promise<int> pi;
  Future<bool> fb = pb.getFuture();
  Future<int> fi = pi.getFuture();
  bool flag = false;
  collectAllSemiFuture(fb, fi).toUnsafeFuture().then(
      [&](std::tuple<Try<bool>, Try<int>> tup) {
        flag = true;
        EXPECT_TRUE(std::get<0>(tup).hasValue());
        EXPECT_EQ(std::get<0>(tup).value(), true);
        EXPECT_TRUE(std::get<1>(tup).hasValue());
        EXPECT_EQ(std::get<1>(tup).value(), 42);
      });
  pb.setValue(true);
  EXPECT_FALSE(flag);
  pi.setValue(42);
  EXPECT_TRUE(flag);
}

TEST(Collect, collectAllVariadicWithException) {
  Promise<bool> pb;
  Promise<int> pi;
  Future<bool> fb = pb.getFuture();
  Future<int> fi = pi.getFuture();
  bool flag = false;
  collectAllSemiFuture(std::move(fb), std::move(fi))
      .toUnsafeFuture()
      .then([&](std::tuple<Try<bool>, Try<int>> tup) {
        flag = true;
        EXPECT_TRUE(std::get<0>(tup).hasValue());
        EXPECT_EQ(std::get<0>(tup).value(), true);
        EXPECT_TRUE(std::get<1>(tup).hasException());
        EXPECT_THROW(std::get<1>(tup).value(), eggs_t);
      });
  pb.setValue(true);
  EXPECT_FALSE(flag);
  pi.setException(eggs);
  EXPECT_TRUE(flag);
}

TEST(Collect, collectVariadic) {
  Promise<bool> pb;
  Promise<int> pi;
  Future<bool> fb = pb.getFuture();
  Future<int> fi = pi.getFuture();
  bool flag = false;
  collect(std::move(fb), std::move(fi)).then([&](std::tuple<bool, int> tup) {
    flag = true;
    EXPECT_EQ(std::get<0>(tup), true);
    EXPECT_EQ(std::get<1>(tup), 42);
  });
  pb.setValue(true);
  EXPECT_FALSE(flag);
  pi.setValue(42);
  EXPECT_TRUE(flag);
}

TEST(Collect, collectVariadicWithException) {
  Promise<bool> pb;
  Promise<int> pi;
  Future<bool> fb = pb.getFuture();
  Future<int> fi = pi.getFuture();
  auto f = collect(std::move(fb), std::move(fi));
  pb.setValue(true);
  EXPECT_FALSE(f.isReady());
  pi.setException(eggs);
  EXPECT_TRUE(f.isReady());
  EXPECT_TRUE(f.getTry().hasException());
  EXPECT_THROW(std::move(f).get(), eggs_t);
}

TEST(Collect, collectAllNone) {
  std::vector<Future<int>> fs;
  auto f = collectAll(fs);
  EXPECT_TRUE(f.isReady());
}

TEST(Collect, noDefaultConstructor) {
  struct A {
    explicit A(size_t /* x */) {}
  };

  auto f1 = makeFuture(A(1));
  auto f2 = makeFuture(A(2));

  auto f = collect(std::move(f1), std::move(f2));
}
