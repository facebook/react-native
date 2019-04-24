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

#pragma once

#include <atomic>

namespace folly {
namespace detail {

inline std::memory_order default_failure_memory_order(
    std::memory_order successMode) {
  switch (successMode) {
    case std::memory_order_acq_rel:
      return std::memory_order_acquire;
    case std::memory_order_release:
      return std::memory_order_relaxed;
    default:
      return successMode;
  }
}
} // namespace detail
} // namespace folly
