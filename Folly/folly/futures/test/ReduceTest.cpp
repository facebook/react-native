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

#include <folly/futures/Future.h>
#include <folly/portability/GTest.h>

using namespace folly;

TEST(Reduce, basic) {
  auto makeFutures = [](int count) {
    std::vector<Future<int>> fs;
    for (int i = 1; i <= count; ++i) {
      fs.emplace_back(makeFuture(i));
    }
    return fs;
  };

  // Empty (Try)
  {
    auto fs = makeFutures(0);

    Future<double> f1 =
        reduce(fs, 1.2, [](double a, Try<int>&& b) { return a + *b + 0.1; });
    EXPECT_EQ(1.2, std::move(f1).get());
  }

  // One (Try)
  {
    auto fs = makeFutures(1);

    Future<double> f1 =
        reduce(fs, 0.0, [](double a, Try<int>&& b) { return a + *b + 0.1; });
    EXPECT_EQ(1.1, std::move(f1).get());
  }

  // Returning values (Try)
  {
    auto fs = makeFutures(3);

    Future<double> f1 =
        reduce(fs, 0.0, [](double a, Try<int>&& b) { return a + *b + 0.1; });
    EXPECT_EQ(6.3, std::move(f1).get());
  }

  // Returning values
  {
    auto fs = makeFutures(3);

    Future<double> f1 =
        reduce(fs, 0.0, [](double a, int&& b) { return a + b + 0.1; });
    EXPECT_EQ(6.3, std::move(f1).get());
  }

  // Returning futures (Try)
  {
    auto fs = makeFutures(3);

    Future<double> f2 = reduce(fs, 0.0, [](double a, Try<int>&& b) {
      return makeFuture<double>(a + *b + 0.1);
    });
    EXPECT_EQ(6.3, std::move(f2).get());
  }

  // Returning futures
  {
    auto fs = makeFutures(3);

    Future<double> f2 = reduce(fs, 0.0, [](double a, int&& b) {
      return makeFuture<double>(a + b + 0.1);
    });
    EXPECT_EQ(6.3, std::move(f2).get());
  }
}

TEST(Reduce, chain) {
  auto makeFutures = [](int count) {
    std::vector<Future<int>> fs;
    for (int i = 1; i <= count; ++i) {
      fs.emplace_back(makeFuture(i));
    }
    return fs;
  };

  {
    auto f = collectAll(makeFutures(3)).reduce(0, [](int a, Try<int>&& b) {
      return a + *b;
    });
    EXPECT_EQ(6, std::move(f).get());
  }
  {
    auto f =
        collect(makeFutures(3)).reduce(0, [](int a, int&& b) { return a + b; });
    EXPECT_EQ(6, std::move(f).get());
  }
}

TEST(Reduce, unorderedReduce) {
  {
    std::vector<Future<int>> fs;
    fs.push_back(makeFuture(1));
    fs.push_back(makeFuture(2));
    fs.push_back(makeFuture(3));

    Future<double> f =
        unorderedReduce(fs.begin(), fs.end(), 0.0, [](double /* a */, int&& b) {
          return double(b);
        });
    EXPECT_EQ(3.0, std::move(f).get());
  }
  {
    Promise<int> p1;
    Promise<int> p2;
    Promise<int> p3;

    std::vector<Future<int>> fs;
    fs.push_back(p1.getFuture());
    fs.push_back(p2.getFuture());
    fs.push_back(p3.getFuture());

    Future<double> f =
        unorderedReduce(fs.begin(), fs.end(), 0.0, [](double /* a */, int&& b) {
          return double(b);
        });
    p3.setValue(3);
    p2.setValue(2);
    p1.setValue(1);
    EXPECT_EQ(1.0, std::move(f).get());
  }
}

TEST(Reduce, unorderedReduceException) {
  Promise<int> p1;
  Promise<int> p2;
  Promise<int> p3;

  std::vector<Future<int>> fs;
  fs.push_back(p1.getFuture());
  fs.push_back(p2.getFuture());
  fs.push_back(p3.getFuture());

  Future<double> f =
      unorderedReduce(fs.begin(), fs.end(), 0.0, [](double /* a */, int&& b) {
        return b + 0.0;
      });
  p3.setValue(3);
  p2.setException(exception_wrapper(std::runtime_error("blah")));
  p1.setValue(1);
  EXPECT_THROW(std::move(f).get(), std::runtime_error);
}

TEST(Reduce, unorderedReduceFuture) {
  Promise<int> p1;
  Promise<int> p2;
  Promise<int> p3;

  std::vector<Future<int>> fs;
  fs.push_back(p1.getFuture());
  fs.push_back(p2.getFuture());
  fs.push_back(p3.getFuture());

  std::vector<Promise<double>> ps(3);

  Future<int> f =
      unorderedReduce(fs.begin(), fs.end(), 0.0, [&](double /* a */, int&& b) {
        return ps[b - 1].getFuture();
      });
  p3.setValue(3);
  p2.setValue(2);
  p1.setValue(1);

  ps[0].setValue(1.0);
  ps[1].setValue(2.0);
  ps[2].setValue(3.0);

  EXPECT_EQ(1.0, std::move(f).get());
}
