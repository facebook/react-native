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

#include <memory>

#include <folly/executors/FiberIOExecutor.h>
#include <folly/executors/IOThreadPoolExecutor.h>

#include <folly/portability/GTest.h>

namespace {

class FiberIOExecutorTest : public testing::Test {};
} // namespace

TEST_F(FiberIOExecutorTest, event_base) {
  auto tpe = std::make_shared<folly::IOThreadPoolExecutor>(1);
  folly::FiberIOExecutor e(tpe);

  ASSERT_NE(e.getEventBase(), nullptr);
  ASSERT_EQ(e.getEventBase(), tpe->getEventBase());
}

TEST_F(FiberIOExecutorTest, basic_execution) {
  auto tpe = std::make_shared<folly::IOThreadPoolExecutor>(1);
  folly::FiberIOExecutor e(tpe);

  // FiberIOExecutor should add tasks using the FiberManager mapped to the
  // IOThreadPoolExecutor's event base.
  folly::Baton<> baton;
  bool inContext = false;

  e.add([&]() {
    inContext = folly::fibers::onFiber();
    auto& lc = dynamic_cast<folly::fibers::EventBaseLoopController&>(
        folly::fibers::getFiberManager(*e.getEventBase()).loopController());
    auto& eb = lc.getEventBase()->getEventBase();
    inContext =
        inContext && &eb == folly::EventBaseManager::get()->getEventBase();
    baton.post();
  });
  baton.wait();

  ASSERT_TRUE(inContext);
}
