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

#include <folly/ssl/OpenSSLHash.h>

#include <folly/Format.h>

namespace folly {
namespace ssl {

[[noreturn]] void OpenSSLHash::check_out_size_throw(
    size_t size,
    MutableByteRange out) {
  throw std::invalid_argument(folly::sformat(
      "expected out of size {} but was of size {}", size, out.size()));
}

} // namespace ssl
} // namespace folly
