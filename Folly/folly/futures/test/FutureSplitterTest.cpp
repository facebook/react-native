/*
 * Copyright 2017-present Facebook, Inc.
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
  folly::FutureSplitter<int> sp(
      p.getSemiFuture().via(&InlineExecutor::instance()));
  auto f1 = sp.getFuture();
  EXPECT_FALSE(f1.isReady());
  p.setValue(1);
  EXPECT_TRUE(f1.isReady());
  EXPECT_TRUE(f1.hasValue());
  auto f2 = sp.getFuture();
  EXPECT_TRUE(f2.isReady());
  EXPECT_TRUE(f2.hasValue());
}

TEST(FutureSplitter, splitFutureSuccessSemiFuture) {
  Promise<int> p;
  folly::FutureSplitter<int> sp(
      p.getSemiFuture().via(&InlineExecutor::instance()));
  auto f1 = sp.getSemiFuture();
  EXPECT_FALSE(f1.isReady());
  p.setValue(1);
  EXPECT_TRUE(f1.isReady());
  EXPECT_TRUE(f1.hasValue());
  auto f2 = sp.getSemiFuture();
  EXPECT_TRUE(f2.isReady());
  EXPECT_TRUE(f2.hasValue());
}

TEST(FutureSplitter, splitFutureSuccessNullExecutor) {
  Promise<int> p;
  auto sf = p.getSemiFuture();
  // Double via because a null executor to SemiFuture.via is invalid but we
  // are testing a situation where we have a FutureSplitter from a future with
  // a null executor to account for legacy code.
  auto f = std::move(sf).via(&InlineExecutor::instance()).via(nullptr);
  folly::FutureSplitter<int> sp(std::move(f));
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
  folly::FutureSplitter<int> sp1(
      p.getSemiFuture().via(&InlineExecutor::instance()));
  folly::FutureSplitter<int> sp2(sp1);
  auto f1 = sp1.getFuture();
  EXPECT_FALSE(f1.isReady());
  p.setValue(1);
  EXPECT_TRUE(f1.isReady());
  EXPECT_TRUE(f1.hasValue());
  auto f2 = sp2.getFuture();
  EXPECT_TRUE(f2.isReady());
  EXPECT_TRUE(f2.hasValue());
  folly::FutureSplitter<int> sp3(sp1);
  auto f3 = sp3.getFuture();
  EXPECT_TRUE(f3.isReady());
  EXPECT_TRUE(f3.hasValue());
}

TEST(FutureSplitter, splitFutureMovable) {
  Promise<int> p;
  folly::FutureSplitter<int> sp1(
      p.getSemiFuture().via(&InlineExecutor::instance()));
  auto f1 = sp1.getFuture();
  folly::FutureSplitter<int> sp2(std::move(sp1));
  EXPECT_FALSE(f1.isReady());
  p.setValue(1);
  EXPECT_TRUE(f1.isReady());
  EXPECT_TRUE(f1.hasValue());
  auto f2 = sp2.getFuture();
  EXPECT_TRUE(f2.isReady());
  EXPECT_TRUE(f2.hasValue());
  folly::FutureSplitter<int> sp3(std::move(sp2));
  auto f3 = sp3.getFuture();
  EXPECT_TRUE(f3.isReady());
  EXPECT_TRUE(f3.hasValue());
}

TEST(FutureSplitter, splitFutureCopyAssignable) {
  Promise<int> p;
  folly::FutureSplitter<int> sp1(
      p.getSemiFuture().via(&InlineExecutor::instance()));
  folly::FutureSplitter<int> sp2{};
  sp2 = sp1;
  auto f1 = sp1.getFuture();
  EXPECT_FALSE(f1.isReady());
  p.setValue(1);
  EXPECT_TRUE(f1.isReady());
  EXPECT_TRUE(f1.hasValue());
  auto f2 = sp2.getFuture();
  EXPECT_TRUE(f2.isReady());
  EXPECT_TRUE(f2.hasValue());
  folly::FutureSplitter<int> sp3(sp1);
  auto f3 = sp3.getFuture();
  EXPECT_TRUE(f3.isReady());
  EXPECT_TRUE(f3.hasValue());
}

TEST(FutureSplitter, splitFutureMoveAssignable) {
  Promise<int> p;
  folly::FutureSplitter<int> sp1(
      p.getSemiFuture().via(&InlineExecutor::instance()));
  auto f1 = sp1.getFuture();
  folly::FutureSplitter<int> sp2{};
  sp2 = std::move(sp1);
  EXPECT_FALSE(f1.isReady());
  p.setValue(1);
  EXPECT_TRUE(f1.isReady());
  EXPECT_TRUE(f1.hasValue());
  auto f2 = sp2.getFuture();
  EXPECT_TRUE(f2.isReady());
  EXPECT_TRUE(f2.hasValue());
  folly::FutureSplitter<int> sp3(std::move(sp2));
  auto f3 = sp3.getFuture();
  EXPECT_TRUE(f3.isReady());
  EXPECT_TRUE(f3.hasValue());
}

TEST(FutureSplitter, splitFutureScope) {
  Promise<int> p;
  auto pSP = std::make_unique<folly::FutureSplitter<int>>(
      p.getSemiFuture().via(&InlineExecutor::instance()));
  auto f1 = pSP->getFuture();
  EXPECT_FALSE(f1.isReady());
  pSP.reset();
  EXPECT_NO_THROW(EXPECT_FALSE(f1.isReady()));
  p.setValue(1);
  EXPECT_TRUE(f1.isReady());
  EXPECT_TRUE(f1.hasValue());
  EXPECT_EQ(1, std::move(f1).get());
}

TEST(FutureSplitter, splitFutureFailure) {
  Promise<int> p;
  folly::FutureSplitter<int> sp(
      p.getSemiFuture().via(&InlineExecutor::instance()));
  auto f1 = sp.getFuture();
  EXPECT_FALSE(f1.isReady());
  try {
    throw std::runtime_error("Oops");
  } catch (std::exception& e) {
    p.setException(exception_wrapper(std::current_exception(), e));
  }
  EXPECT_TRUE(f1.isReady());
  EXPECT_TRUE(f1.hasException());
  auto f2 = sp.getFuture();
  EXPECT_TRUE(f2.isReady());
  EXPECT_TRUE(f2.hasException());
}

TEST(FutureSplitter, splitFuturePriority) {
  std::vector<int8_t> priorities = {
      folly::Executor::LO_PRI,
      folly::Executor::MID_PRI,
      folly::Executor::HI_PRI,
  };

  for (const auto priority : priorities) {
    Promise<int> p;
    folly::FutureSplitter<int> sp(
        p.getSemiFuture().via(&InlineExecutor::instance(), priority));
    auto fut = sp.getFuture();
    EXPECT_EQ(priority, fut.getPriority());
  }
}
