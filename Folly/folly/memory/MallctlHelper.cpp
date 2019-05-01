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

#include <folly/memory/MallctlHelper.h>
#include <folly/Format.h>
#include <folly/String.h>

#include <stdexcept>

namespace folly {

namespace detail {

[[noreturn]] void handleMallctlError(const char* cmd, int err) {
  assert(err != 0);
  throw std::runtime_error(
      sformat("mallctl {}: {} ({})", cmd, errnoStr(err), err));
}

} // namespace detail

} // namespace folly
