/*
 * Copyright 2016-present Facebook, Inc.
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

#include <folly/io/async/EventBaseThread.h>

#include <chrono>

#include <folly/io/async/EventBaseManager.h>
#include <folly/portability/GTest.h>
#include <folly/synchronization/Baton.h>
#include <folly/system/ThreadName.h>

using namespace std;
using namespace std::chrono;
using namespace folly;

class EventBaseThreadTest : public testing::Test {};

TEST_F(EventBaseThreadTest, example) {
  EventBaseThread ebt(true, nullptr, "monkey");

  Baton<> done;
  ebt.getEventBase()->runInEventBaseThread([&] {
    EXPECT_EQ(getCurrentThreadName().value(), "monkey");
    done.post();
  });
  ASSERT_TRUE(done.try_wait_for(seconds(1)));
}

TEST_F(EventBaseThreadTest, start_stop) {
  EventBaseThread ebt(false);

  for (size_t i = 0; i < 4; ++i) {
    EXPECT_EQ(nullptr, ebt.getEventBase());
    ebt.start();
    EXPECT_NE(nullptr, ebt.getEventBase());

    Baton<> done;
    ebt.getEventBase()->runInEventBaseThread([&] { done.post(); });
    ASSERT_TRUE(done.try_wait_for(seconds(1)));

    EXPECT_NE(nullptr, ebt.getEventBase());
    ebt.stop();
    EXPECT_EQ(nullptr, ebt.getEventBase());
  }
}

TEST_F(EventBaseThreadTest, move) {
  auto ebt0 = EventBaseThread();
  auto ebt1 = std::move(ebt0);
  auto ebt2 = std::move(ebt1);

  EXPECT_EQ(nullptr, ebt0.getEventBase());
  EXPECT_EQ(nullptr, ebt1.getEventBase());
  EXPECT_NE(nullptr, ebt2.getEventBase());

  Baton<> done;
  ebt2.getEventBase()->runInEventBaseThread([&] { done.post(); });
  ASSERT_TRUE(done.try_wait_for(seconds(1)));
}

TEST_F(EventBaseThreadTest, self_move) {
  EventBaseThread ebt0;
  auto ebt = std::move(ebt0);

  EXPECT_NE(nullptr, ebt.getEventBase());

  Baton<> done;
  ebt.getEventBase()->runInEventBaseThread([&] { done.post(); });
  ASSERT_TRUE(done.try_wait_for(seconds(1)));
}

TEST_F(EventBaseThreadTest, default_manager) {
  auto ebm = EventBaseManager::get();
  EventBaseThread ebt;
  auto ebt_eb = ebt.getEventBase();
  auto ebm_eb = static_cast<EventBase*>(nullptr);
  ebt_eb->runInEventBaseThreadAndWait([&] { ebm_eb = ebm->getEventBase(); });
  EXPECT_EQ(uintptr_t(ebt_eb), uintptr_t(ebm_eb));
}

TEST_F(EventBaseThreadTest, custom_manager) {
  EventBaseManager ebm;
  EventBaseThread ebt(&ebm);
  auto ebt_eb = ebt.getEventBase();
  auto ebm_eb = static_cast<EventBase*>(nullptr);
  ebt_eb->runInEventBaseThreadAndWait([&] { ebm_eb = ebm.getEventBase(); });
  EXPECT_EQ(uintptr_t(ebt_eb), uintptr_t(ebm_eb));
}
