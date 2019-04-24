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

TEST(Map, basic) {
  Promise<int> p1;
  Promise<int> p2;
  Promise<int> p3;

  std::vector<Future<int>> fs;
  fs.push_back(p1.getFuture());
  fs.push_back(p2.getFuture());
  fs.push_back(p3.getFuture());

  int c = 0;
  std::vector<Future<Unit>> fs2 = futures::map(fs, [&](int i) { c += i; });

  // Ensure we call the callbacks as the futures complete regardless of order
  p2.setValue(1);
  EXPECT_EQ(1, c);
  p3.setValue(1);
  EXPECT_EQ(2, c);
  p1.setValue(1);
  EXPECT_EQ(3, c);

  EXPECT_TRUE(collect(fs2).isReady());
}

TEST(Map, executor) {
  Promise<int> p1;
  Promise<int> p2;
  Promise<int> p3;
  folly::InlineExecutor exec;

  std::vector<Future<int>> fs;
  fs.push_back(p1.getFuture());
  fs.push_back(p2.getFuture());
  fs.push_back(p3.getFuture());

  int c = 0;
  std::vector<Future<Unit>> fs2 =
      futures::map(exec, fs, [&](int i) { c += i; });

  // Ensure we call the callbacks as the futures complete regardless of order
  p2.setValue(1);
  EXPECT_EQ(1, c);
  p3.setValue(1);
  EXPECT_EQ(2, c);
  p1.setValue(1);
  EXPECT_EQ(3, c);

  EXPECT_TRUE(collect(fs2).isReady());
}

TEST(Map, semifuture) {
  Promise<int> p1;
  Promise<int> p2;
  Promise<int> p3;
  folly::InlineExecutor exec;

  std::vector<SemiFuture<int>> fs;
  fs.push_back(p1.getSemiFuture());
  fs.push_back(p2.getSemiFuture());
  fs.push_back(p3.getSemiFuture());

  int c = 0;
  std::vector<Future<Unit>> fs2 =
      futures::map(exec, fs, [&](int i) { c += i; });

  // Ensure we call the callbacks as the futures complete regardless of order
  p2.setValue(1);
  EXPECT_EQ(1, c);
  p3.setValue(1);
  EXPECT_EQ(2, c);
  p1.setValue(1);
  EXPECT_EQ(3, c);

  EXPECT_TRUE(collect(fs2).isReady());
}
