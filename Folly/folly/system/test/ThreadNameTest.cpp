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

#include <thread>

#include <folly/ScopeGuard.h>
#include <folly/portability/GTest.h>
#include <folly/synchronization/Baton.h>
#include <folly/system/ThreadName.h>

using namespace std;
using namespace folly;

namespace {

const bool expectedSetOtherThreadNameResult = folly::canSetOtherThreadName();
const bool expectedSetSelfThreadNameResult = folly::canSetCurrentThreadName();
constexpr StringPiece kThreadName{"rockin-thread"};

} // namespace

TEST(ThreadName, getCurrentThreadName) {
  thread th([] {
    EXPECT_EQ(expectedSetSelfThreadNameResult, setThreadName(kThreadName));
    if (expectedSetSelfThreadNameResult) {
      EXPECT_EQ(kThreadName.toString(), *getCurrentThreadName());
    }
  });
  SCOPE_EXIT {
    th.join();
  };
}

#if FOLLY_HAVE_PTHREAD
TEST(ThreadName, setThreadName_other_pthread) {
  Baton<> handle_set;
  Baton<> let_thread_end;
  pthread_t handle;
  thread th([&] {
    handle = pthread_self();
    handle_set.post();
    let_thread_end.wait();
  });
  SCOPE_EXIT {
    th.join();
  };
  handle_set.wait();
  SCOPE_EXIT {
    let_thread_end.post();
  };
  EXPECT_EQ(
      expectedSetOtherThreadNameResult, setThreadName(handle, kThreadName));
}
#endif

TEST(ThreadName, setThreadName_other_id) {
  Baton<> let_thread_end;
  thread th([&] { let_thread_end.wait(); });
  SCOPE_EXIT {
    th.join();
  };
  SCOPE_EXIT {
    let_thread_end.post();
  };
  EXPECT_EQ(
      expectedSetOtherThreadNameResult,
      setThreadName(th.get_id(), kThreadName));
  if (expectedSetOtherThreadNameResult) {
    EXPECT_EQ(*getThreadName(th.get_id()), kThreadName);
  }
}
