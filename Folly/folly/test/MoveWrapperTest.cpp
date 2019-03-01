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

#include <folly/MoveWrapper.h>

#include <memory>

#include <folly/portability/GTest.h>

namespace folly {

TEST(makeMoveWrapper, Empty) {
  // checks for crashes
  auto p = makeMoveWrapper(std::unique_ptr<int>());
}

TEST(makeMoveWrapper, NonEmpty) {
  auto u = std::unique_ptr<int>(new int(5));
  EXPECT_EQ(*u, 5);
  auto p = makeMoveWrapper(std::move(u));
  EXPECT_TRUE(!u);
  EXPECT_EQ(**p, 5);
}

TEST(makeMoveWrapper, rvalue) {
  std::unique_ptr<int> p;
  makeMoveWrapper(std::move(p));
}

TEST(makeMoveWrapper, lvalue) {
  std::unique_ptr<int> p;
  makeMoveWrapper(p);
}

TEST(makeMoveWrapper, lvalue_copyable) {
  std::shared_ptr<int> p;
  makeMoveWrapper(p);
}

} // namespace
