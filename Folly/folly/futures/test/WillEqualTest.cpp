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

TEST(WillEqual, basic) {
  // both p1 and p2 already fulfilled
  {
    Promise<int> p1;
    Promise<int> p2;
    p1.setValue(27);
    p2.setValue(27);
    auto f1 = p1.getFuture();
    auto f2 = p2.getFuture();
    EXPECT_TRUE(f1.willEqual(f2).get());
  }
  {
    Promise<int> p1;
    Promise<int> p2;
    p1.setValue(27);
    p2.setValue(36);
    auto f1 = p1.getFuture();
    auto f2 = p2.getFuture();
    EXPECT_FALSE(f1.willEqual(f2).get());
  }
  // both p1 and p2 not yet fulfilled
  {
    Promise<int> p1;
    Promise<int> p2;
    auto f1 = p1.getFuture();
    auto f2 = p2.getFuture();
    auto f3 = f1.willEqual(f2);
    p1.setValue(27);
    p2.setValue(27);
    EXPECT_TRUE(std::move(f3).get());
  }
  {
    Promise<int> p1;
    Promise<int> p2;
    auto f1 = p1.getFuture();
    auto f2 = p2.getFuture();
    auto f3 = f1.willEqual(f2);
    p1.setValue(27);
    p2.setValue(36);
    EXPECT_FALSE(std::move(f3).get());
  }
  // p1 already fulfilled, p2 not yet fulfilled
  {
    Promise<int> p1;
    Promise<int> p2;
    p1.setValue(27);
    auto f1 = p1.getFuture();
    auto f2 = p2.getFuture();
    auto f3 = f1.willEqual(f2);
    p2.setValue(27);
    EXPECT_TRUE(std::move(f3).get());
  }
  {
    Promise<int> p1;
    Promise<int> p2;
    p1.setValue(27);
    auto f1 = p1.getFuture();
    auto f2 = p2.getFuture();
    auto f3 = f1.willEqual(f2);
    p2.setValue(36);
    EXPECT_FALSE(std::move(f3).get());
  }
  // p2 already fulfilled, p1 not yet fulfilled
  {
    Promise<int> p1;
    Promise<int> p2;
    p2.setValue(27);
    auto f1 = p1.getFuture();
    auto f2 = p2.getFuture();
    auto f3 = f1.willEqual(f2);
    p1.setValue(27);
    EXPECT_TRUE(std::move(f3).get());
  }
  {
    Promise<int> p1;
    Promise<int> p2;
    p2.setValue(36);
    auto f1 = p1.getFuture();
    auto f2 = p2.getFuture();
    auto f3 = f1.willEqual(f2);
    p1.setValue(27);
    EXPECT_FALSE(std::move(f3).get());
  }
}
