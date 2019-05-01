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

#include <folly/futures/detail/Core.h>
#include <folly/futures/Future.h>
#include <folly/portability/GTest.h>

using namespace folly;

TEST(Core, size) {
  static constexpr size_t lambdaBufSize = 8 * sizeof(void*);
  struct Gold {
    typename std::aligned_storage<lambdaBufSize>::type lambdaBuf_;
    folly::Optional<Try<Unit>> result_;
    folly::Function<void(Try<Unit>&&)> callback_;
    std::atomic<futures::detail::State> state_;
    std::atomic<unsigned char> attached_;
    std::atomic<bool> interruptHandlerSet_;
    futures::detail::SpinLock interruptLock_;
    int8_t priority_;
    Executor* executor_;
    std::shared_ptr<RequestContext> context_;
    std::unique_ptr<exception_wrapper> interrupt_;
    std::function<void(exception_wrapper const&)> interruptHandler_;
  };
  // If this number goes down, it's fine!
  // If it goes up, please seek professional advice ;-)
  EXPECT_GE(sizeof(Gold), sizeof(futures::detail::Core<Unit>));
}
