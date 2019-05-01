/*
 * Copyright 2014-present Facebook, Inc.
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

#include <sys/types.h>

#include <string>

#include <folly/portability/Sockets.h>

namespace folly {
namespace detail {

std::string familyNameStrDefault(sa_family_t family);

inline std::string familyNameStr(sa_family_t family) {
  switch (family) {
    case AF_INET:
      return "AF_INET";
    case AF_INET6:
      return "AF_INET6";
    case AF_UNSPEC:
      return "AF_UNSPEC";
    case AF_UNIX:
      return "AF_UNIX";
    default:
      return familyNameStrDefault(family);
  }
}

[[noreturn]] void getNthMSBitImplThrow(size_t bitCount, sa_family_t family);

template <typename IPAddrType>
inline bool
getNthMSBitImpl(const IPAddrType& ip, size_t bitIndex, sa_family_t family) {
  if (bitIndex >= ip.bitCount()) {
    getNthMSBitImplThrow(ip.bitCount(), family);
  }
  // Underlying bytes are in n/w byte order
  return (ip.getNthMSByte(bitIndex / 8) & (0x80 >> (bitIndex % 8))) != 0;
}
} // namespace detail
} // namespace folly
