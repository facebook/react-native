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

#include <folly/futures/FutureSplitter.h>
#include <folly/portability/GTest.h>

using namespace folly;

TEST(FutureSplitter, splitFutureSuccess) {
  Promise<int> p;
  FutureSplitter<int> sp(p.getFuture());
  auto f1 = sp.getFuture();
  EXPECT_FALSE(f1.isReady());
  p.setValue(1);
  EXPECT_TRUE(f1.isReady());
  EXPECT_TRUE(f1.hasValue());
  auto f2 = sp.getFuture();
  EXPECT_TRUE(f2.isReady());
  EXPECT_TRUE(f2.hasValue());
}

TEST(FutureSplitter, splitFutureCopyable) {
  Promise<int> p;
  FutureSplitter<int> sp1(p.getFuture());
  FutureSplitter<int> sp2(sp1);
  auto f1 = sp1.getFuture();
  EXPECT_FALSE(f1.isReady());
  p.setValue(1);
  EXPECT_TRUE(f1.isReady());
  EXPECT_TRUE(f1.hasValue());
  auto f2 = sp2.getFuture();
  EXPECT_TRUE(f2.isReady());
  EXPECT_TRUE(f2.hasValue());
  FutureSplitter<int> sp3(sp1);
  auto f3 = sp3.getFuture();
  EXPECT_TRUE(f3.isReady());
  EXPECT_TRUE(f3.hasValue());
}

TEST(FutureSplitter, splitFutureMovable) {
  Promise<int> p;
  FutureSplitter<int> sp1(p.getFuture());
  auto f1 = sp1.getFuture();
  FutureSplitter<int> sp2(std::move(sp1));
  EXPECT_FALSE(f1.isReady());
  p.setValue(1);
  EXPECT_TRUE(f1.isReady());
  EXPECT_TRUE(f1.hasValue());
  auto f2 = sp2.getFuture();
  EXPECT_TRUE(f2.isReady());
  EXPECT_TRUE(f2.hasValue());
  FutureSplitter<int> sp3(std::move(sp2));
  auto f3 = sp3.getFuture();
  EXPECT_TRUE(f3.isReady());
  EXPECT_TRUE(f3.hasValue());
}

TEST(FutureSplitter, splitFutureCopyAssignable) {
  Promise<int> p;
  FutureSplitter<int> sp1(p.getFuture());
  FutureSplitter<int> sp2{};
  sp2 = sp1;
  auto f1 = sp1.getFuture();
  EXPECT_FALSE(f1.isReady());
  p.setValue(1);
  EXPECT_TRUE(f1.isReady());
  EXPECT_TRUE(f1.hasValue());
  auto f2 = sp2.getFuture();
  EXPECT_TRUE(f2.isReady());
  EXPECT_TRUE(f2.hasValue());
  FutureSplitter<int> sp3(sp1);
  auto f3 = sp3.getFuture();
  EXPECT_TRUE(f3.isReady());
  EXPECT_TRUE(f3.hasValue());
}

TEST(FutureSplitter, splitFutureMoveAssignable) {
  Promise<int> p;
  FutureSplitter<int> sp1(p.getFuture());
  auto f1 = sp1.getFuture();
  FutureSplitter<int> sp2{};
  sp2 = std::move(sp1);
  EXPECT_FALSE(f1.isReady());
  p.setValue(1);
  EXPECT_TRUE(f1.isReady());
  EXPECT_TRUE(f1.hasValue());
  auto f2 = sp2.getFuture();
  EXPECT_TRUE(f2.isReady());
  EXPECT_TRUE(f2.hasValue());
  FutureSplitter<int> sp3(std::move(sp2));
  auto f3 = sp3.getFuture();
  EXPECT_TRUE(f3.isReady());
  EXPECT_TRUE(f3.hasValue());
}

TEST(FutureSplitter, splitFutureScope) {
  Promise<int> p;
  auto pSP = make_unique<FutureSplitter<int>>(p.getFuture());
  auto f1 = pSP->getFuture();
  EXPECT_FALSE(f1.isReady());
  pSP.reset();
  EXPECT_NO_THROW(EXPECT_FALSE(f1.isReady()));
  p.setValue(1);
  EXPECT_TRUE(f1.isReady());
  EXPECT_TRUE(f1.hasValue());
  EXPECT_EQ(1, f1.get());
}

TEST(FutureSplitter, splitFutureFailure) {
  Promise<int> p;
  FutureSplitter<int> sp(p.getFuture());
  auto f1 = sp.getFuture();
  EXPECT_FALSE(f1.isReady());
  try {
    throw std::runtime_error("Oops");
  } catch (...) {
    p.setException(exception_wrapper(std::current_exception()));
  }
  EXPECT_TRUE(f1.isReady());
  EXPECT_TRUE(f1.hasException());
  auto f2 = sp.getFuture();
  EXPECT_TRUE(f2.isReady());
  EXPECT_TRUE(f2.hasException());
}
