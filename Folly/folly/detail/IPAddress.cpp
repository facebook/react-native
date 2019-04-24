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

#include <folly/detail/IPAddress.h>

#include <folly/Format.h>

namespace folly {
namespace detail {

std::string familyNameStrDefault(sa_family_t family) {
  return sformat("sa_family_t({})", family);
}

[[noreturn]] void getNthMSBitImplThrow(size_t bitCount, sa_family_t family) {
  throw std::invalid_argument(sformat(
      "Bit index must be < {} for addresses of type: {}",
      bitCount,
      familyNameStr(family)));
}
} // namespace detail
} // namespace folly
