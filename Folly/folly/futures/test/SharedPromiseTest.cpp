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

#include <folly/futures/SharedPromise.h>
#include <folly/portability/GTest.h>

using namespace folly;

TEST(SharedPromise, setGetSemiFuture) {
  SharedPromise<int> p;
  p.setValue(1);
  auto f1 = p.getSemiFuture();
  auto f2 = p.getSemiFuture();
  EXPECT_EQ(1, f1.value());
  EXPECT_EQ(1, f2.value());
}

TEST(SharedPromise, setGetMixed) {
  SharedPromise<int> p;
  p.setValue(1);
  auto f1 = p.getSemiFuture();
  auto f2 = p.getFuture();
  EXPECT_EQ(1, f1.value());
  EXPECT_EQ(1, f2.value());
}

TEST(SharedPromise, setGet) {
  SharedPromise<int> p;
  p.setValue(1);
  auto f1 = p.getFuture();
  auto f2 = p.getFuture();
  EXPECT_EQ(1, f1.value());
  EXPECT_EQ(1, f2.value());
}
TEST(SharedPromise, getSet) {
  SharedPromise<int> p;
  auto f1 = p.getFuture();
  auto f2 = p.getFuture();
  p.setValue(1);
  EXPECT_EQ(1, f1.value());
  EXPECT_EQ(1, f2.value());
}

TEST(SharedPromise, getSetGet) {
  SharedPromise<int> p;
  auto f1 = p.getFuture();
  p.setValue(1);
  auto f2 = p.getFuture();
  EXPECT_EQ(1, f1.value());
  EXPECT_EQ(1, f2.value());
}

TEST(SharedPromise, reset) {
  SharedPromise<int> p;

  auto f1 = p.getFuture();
  p.setValue(1);
  EXPECT_EQ(1, f1.value());

  p = SharedPromise<int>();
  auto f2 = p.getFuture();
  EXPECT_FALSE(f2.isReady());
  p.setValue(2);
  EXPECT_EQ(2, f2.value());
}

TEST(SharedPromise, getMoveSet) {
  SharedPromise<int> p;
  auto f = p.getFuture();
  auto p2 = std::move(p);
  p2.setValue(1);
  EXPECT_EQ(1, f.value());
}

TEST(SharedPromise, setMoveGet) {
  SharedPromise<int> p;
  p.setValue(1);
  auto p2 = std::move(p);
  auto f = p2.getFuture();
  EXPECT_EQ(1, f.value());
}

TEST(SharedPromise, moveSetGet) {
  SharedPromise<int> p;
  auto p2 = std::move(p);
  p2.setValue(1);
  auto f = p2.getFuture();
  EXPECT_EQ(1, f.value());
}

TEST(SharedPromise, moveGetSet) {
  SharedPromise<int> p;
  auto p2 = std::move(p);
  auto f = p2.getFuture();
  p2.setValue(1);
  EXPECT_EQ(1, f.value());
}

TEST(SharedPromise, moveMove) {
  SharedPromise<std::shared_ptr<int>> p;
  auto f1 = p.getFuture();
  auto f2 = p.getFuture();
  auto p2 = std::move(p);
  p = std::move(p2);
  p.setValue(std::make_shared<int>(1));
}

TEST(SharedPromise, setWith) {
  SharedPromise<int> p;
  p.setWith([] { return 1; });
  EXPECT_EQ(1, p.getFuture().value());
}

TEST(SharedPromise, isFulfilled) {
  SharedPromise<int> p;
  EXPECT_FALSE(p.isFulfilled());
  auto p2 = std::move(p);
  EXPECT_FALSE(p2.isFulfilled());
  p2.setValue(1);
  EXPECT_TRUE(p2.isFulfilled());
  p = std::move(p2);
  EXPECT_TRUE(p.isFulfilled());
}

TEST(SharedPromise, interruptHandler) {
  SharedPromise<int> p;
  bool flag = false;
  p.setInterruptHandler([&](const exception_wrapper&) { flag = true; });
  auto f = p.getFuture();
  f.cancel();
  EXPECT_TRUE(flag);
}
