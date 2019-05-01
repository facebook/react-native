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
#include <folly/Portability.h>

#if FOLLY_HAS_COROUTINES

#include <folly/executors/InlineExecutor.h>
#include <folly/experimental/coro/Baton.h>
#include <folly/experimental/coro/Future.h>
#include <folly/experimental/coro/Promise.h>
#include <folly/experimental/coro/Task.h>
#include <folly/portability/GTest.h>

using namespace folly;

TEST(Baton, Ready) {
  coro::Baton b;
  CHECK(!b.ready());
  b.post();
  CHECK(b.ready());
  b.reset();
  CHECK(!b.ready());
}

TEST(Baton, InitiallyReady) {
  coro::Baton b{true};
  CHECK(b.ready());
  b.reset();
  CHECK(!b.ready());
}

TEST(Baton, AwaitBaton) {
  coro::Baton baton;
  bool reachedBeforeAwait = false;
  bool reachedAfterAwait = false;

  auto makeTask = [&]() -> coro::Task<void> {
    reachedBeforeAwait = true;
    co_await baton;
    reachedAfterAwait = true;
  };

  coro::Task<void> t = makeTask();

  CHECK(!reachedBeforeAwait);
  CHECK(!reachedAfterAwait);

  auto& executor = InlineExecutor::instance();
  coro::Future<void> f = via(&executor, std::move(t));

  CHECK(reachedBeforeAwait);
  CHECK(!reachedAfterAwait);

  baton.post();

  CHECK(reachedAfterAwait);
}

#endif
