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

#include <folly/io/async/ScopedEventBaseThread.h>

#include <chrono>
#include <string>

#include <folly/Optional.h>
#include <folly/io/async/EventBaseManager.h>
#include <folly/portability/GTest.h>
#include <folly/synchronization/Baton.h>
#include <folly/system/ThreadName.h>

using namespace std;
using namespace std::chrono;
using namespace folly;

class ScopedEventBaseThreadTest : public testing::Test {};

TEST_F(ScopedEventBaseThreadTest, example) {
  ScopedEventBaseThread sebt;

  Baton<> done;
  sebt.getEventBase()->runInEventBaseThread([&] { done.post(); });
  ASSERT_TRUE(done.try_wait_for(seconds(1)));
}

TEST_F(ScopedEventBaseThreadTest, named_example) {
  static constexpr StringPiece kThreadName{"named_example"};

  Optional<std::string> createdThreadName;
  Baton<> done;

  ScopedEventBaseThread sebt{kThreadName};
  sebt.getEventBase()->runInEventBaseThread([&] {
    createdThreadName = folly::getCurrentThreadName();
    done.post();
  });

  ASSERT_TRUE(done.try_wait_for(seconds(1)));
  if (createdThreadName) {
    ASSERT_EQ(kThreadName.toString(), createdThreadName.value());
  }
}

TEST_F(ScopedEventBaseThreadTest, default_manager) {
  auto ebm = EventBaseManager::get();
  ScopedEventBaseThread sebt;
  auto sebt_eb = sebt.getEventBase();
  auto ebm_eb = static_cast<EventBase*>(nullptr);
  sebt_eb->runInEventBaseThreadAndWait([&] { ebm_eb = ebm->getEventBase(); });
  EXPECT_EQ(uintptr_t(sebt_eb), uintptr_t(ebm_eb));
}

TEST_F(ScopedEventBaseThreadTest, custom_manager) {
  EventBaseManager ebm;
  ScopedEventBaseThread sebt(&ebm);
  auto sebt_eb = sebt.getEventBase();
  auto ebm_eb = static_cast<EventBase*>(nullptr);
  sebt_eb->runInEventBaseThreadAndWait([&] { ebm_eb = ebm.getEventBase(); });
  EXPECT_EQ(uintptr_t(sebt_eb), uintptr_t(ebm_eb));
}

TEST_F(ScopedEventBaseThreadTest, eb_dtor_in_io_thread) {
  Optional<ScopedEventBaseThread> sebt;
  sebt.emplace();
  auto const io_thread_id = sebt->getThreadId();
  EXPECT_NE(this_thread::get_id(), io_thread_id) << "sanity";

  auto const eb = sebt->getEventBase();
  thread::id eb_dtor_thread_id;
  eb->runOnDestruction(new EventBase::FunctionLoopCallback(
      [&] { eb_dtor_thread_id = this_thread::get_id(); }));
  sebt.clear();
  EXPECT_EQ(io_thread_id, eb_dtor_thread_id);
}
