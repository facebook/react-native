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

#include <thread>

#include <folly/Baton.h>
#include <folly/ScopeGuard.h>
#include <folly/ThreadName.h>
#include <folly/portability/GTest.h>

using namespace std;
using namespace folly;

static constexpr bool expectedSetOtherThreadNameResult =
#ifdef FOLLY_HAS_PTHREAD_SETNAME_NP_THREAD_NAME
    true
#else
    false // This system has no known way to set the name of another thread
#endif
    ;

static constexpr bool expectedSetSelfThreadNameResult =
#if defined(FOLLY_HAS_PTHREAD_SETNAME_NP_THREAD_NAME) || \
    defined(FOLLY_HAS_PTHREAD_SETNAME_NP_NAME)
    true
#else
    false // This system has no known way to set its own thread name
#endif
    ;

TEST(ThreadName, setThreadName_self) {
  thread th([] {
    EXPECT_EQ(expectedSetSelfThreadNameResult, setThreadName("rockin-thread"));
  });
  SCOPE_EXIT { th.join(); };
}

TEST(ThreadName, setThreadName_other_pthread) {
  Baton<> handle_set;
  Baton<> let_thread_end;
  pthread_t handle;
  thread th([&] {
      handle = pthread_self();
      handle_set.post();
      let_thread_end.wait();
  });
  SCOPE_EXIT { th.join(); };
  handle_set.wait();
  SCOPE_EXIT { let_thread_end.post(); };
  EXPECT_EQ(
      expectedSetOtherThreadNameResult, setThreadName(handle, "rockin-thread"));
}

TEST(ThreadName, setThreadName_other_native) {
  Baton<> let_thread_end;
  thread th([&] {
      let_thread_end.wait();
  });
  SCOPE_EXIT { th.join(); };
  SCOPE_EXIT { let_thread_end.post(); };
  EXPECT_EQ(
      expectedSetOtherThreadNameResult,
      setThreadName(th.native_handle(), "rockin-thread"));
}

TEST(ThreadName, setThreadName_other_id) {
  Baton<> let_thread_end;
  thread th([&] {
      let_thread_end.wait();
  });
  SCOPE_EXIT { th.join(); };
  SCOPE_EXIT { let_thread_end.post(); };
  EXPECT_EQ(
      expectedSetOtherThreadNameResult,
      setThreadName(th.get_id(), "rockin-thread"));
}
