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

#include <folly/io/async/AsyncTimeout.h>
#include <folly/io/async/EventBase.h>
#include <folly/portability/GTest.h>

namespace folly {

TEST(AsyncTimeout, make) {
  int value = 0;
  int const expected = 10;
  EventBase manager;

  auto observer =
      AsyncTimeout::make(manager, [&]() noexcept { value = expected; });

  observer->scheduleTimeout(std::chrono::milliseconds(100));

  manager.loop();

  EXPECT_EQ(expected, value);
}

TEST(AsyncTimeout, schedule) {
  int value = 0;
  int const expected = 10;
  EventBase manager;

  auto observer = AsyncTimeout::schedule(
      std::chrono::milliseconds(100), manager, [&]() noexcept {
        value = expected;
      });

  manager.loop();

  EXPECT_EQ(expected, value);
}

TEST(AsyncTimeout, schedule_immediate) {
  int value = 0;
  int const expected = 10;
  EventBase manager;

  auto observer = AsyncTimeout::schedule(
      std::chrono::milliseconds(0), manager, [&]() noexcept {
        value = expected;
      });

  manager.loop();
  EXPECT_EQ(expected, value);
}

TEST(AsyncTimeout, cancel_make) {
  int value = 0;
  int const expected = 10;
  EventBase manager;

  auto observer =
      AsyncTimeout::make(manager, [&]() noexcept { value = expected; });

  std::weak_ptr<RequestContext> rctx_weak_ptr;

  {
    RequestContextScopeGuard rctx_guard;
    rctx_weak_ptr = RequestContext::saveContext();
    observer->scheduleTimeout(std::chrono::milliseconds(100));
    observer->cancelTimeout();
  }

  // Ensure that RequestContext created for the scope has been released and
  // deleted.
  EXPECT_EQ(rctx_weak_ptr.expired(), true);

  manager.loop();

  EXPECT_NE(expected, value);
}

TEST(AsyncTimeout, cancel_schedule) {
  int value = 0;
  int const expected = 10;
  EventBase manager;
  std::unique_ptr<AsyncTimeout> observer;
  std::weak_ptr<RequestContext> rctx_weak_ptr;

  {
    RequestContextScopeGuard rctx_guard;
    rctx_weak_ptr = RequestContext::saveContext();

    observer = AsyncTimeout::schedule(
        std::chrono::milliseconds(100), manager, [&]() noexcept {
          value = expected;
        });

    observer->cancelTimeout();
  }

  // Ensure that RequestContext created for the scope has been released and
  // deleted.
  EXPECT_EQ(rctx_weak_ptr.expired(), true);

  manager.loop();

  EXPECT_NE(expected, value);
}

} // namespace folly
