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
#include <folly/Lazy.h>

#include <functional>
#include <iostream>
#include <map>

#include <folly/portability/GTest.h>

namespace folly {

TEST(Lazy, Simple) {
  int computeCount = 0;

  auto const val = folly::lazy([&]() -> int {
    ++computeCount;
    EXPECT_EQ(computeCount, 1);
    return 12;
  });
  EXPECT_EQ(computeCount, 0);

  for (int i = 0; i < 100; ++i) {
    if (i > 50) {
      EXPECT_EQ(val(), 12);
      EXPECT_EQ(computeCount, 1);
    } else {
      EXPECT_EQ(computeCount, 0);
    }
  }
  EXPECT_EQ(val(), 12);
  EXPECT_EQ(computeCount, 1);
}

auto globalCount = folly::lazy([] { return 0; });
auto const foo = folly::lazy([]() -> std::string {
  ++globalCount();
  EXPECT_EQ(globalCount(), 1);
  return std::string("YEP");
});

TEST(Lazy, Global) {
  EXPECT_EQ(globalCount(), 0);
  EXPECT_EQ(foo(), "YEP");
  EXPECT_EQ(globalCount(), 1);
}

TEST(Lazy, Map) {
  auto lazyMap = folly::lazy([]() -> std::map<std::string, std::string> {
    return {
        {"foo", "bar"},
        {"baz", "quux"},
    };
  });

  EXPECT_EQ(lazyMap().size(), 2);
  lazyMap()["blah"] = "asd";
  EXPECT_EQ(lazyMap().size(), 3);
}

struct CopyCount {
  CopyCount() {}
  CopyCount(const CopyCount&) {
    ++count;
  }
  CopyCount(CopyCount&&) noexcept {}

  static int count;

  bool operator()() const {
    return true;
  }
};

int CopyCount::count = 0;

TEST(Lazy, NonLambda) {
  auto const rval = folly::lazy(CopyCount());
  EXPECT_EQ(CopyCount::count, 0);
  EXPECT_EQ(rval(), true);
  EXPECT_EQ(CopyCount::count, 0);

  CopyCount cpy;
  auto const lval = folly::lazy(cpy);
  EXPECT_EQ(CopyCount::count, 1);
  EXPECT_EQ(lval(), true);
  EXPECT_EQ(CopyCount::count, 1);

  std::function<bool()> f = [&] { return 12; };
  auto const lazyF = folly::lazy(f);
  EXPECT_EQ(lazyF(), true);
}

TEST(Lazy, Consty) {
  std::function<int()> const f = [&] { return 12; };
  auto lz = folly::lazy(f);
  EXPECT_EQ(lz(), 12);
}

} // namespace folly
