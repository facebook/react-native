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

#include <folly/executors/InlineExecutor.h>

#include <folly/Indestructible.h>

namespace folly {

InlineExecutor& InlineExecutor::instance_slow() noexcept {
  static auto instance = Indestructible<InlineExecutor>{};
  cache.store(&*instance, std::memory_order_release);
  return *instance;
}

std::atomic<InlineExecutor*> InlineExecutor::cache;

} // namespace folly
