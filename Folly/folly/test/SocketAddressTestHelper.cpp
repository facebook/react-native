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

#include <folly/test/SocketAddressTestHelper.h>

#include <folly/portability/Sockets.h>
#include <glog/logging.h>

namespace folly {

constexpr const char* SocketAddressTestHelper::kLoopbackAddrIPv4;
constexpr const char* SocketAddressTestHelper::kLoopbackAddrIPv6;
constexpr const char* SocketAddressTestHelper::kGooglePublicDnsAName;
constexpr const char* SocketAddressTestHelper::kGooglePublicDnsBName;
constexpr const char* SocketAddressTestHelper::kGooglePublicDnsAAddrIPv4;
constexpr const char* SocketAddressTestHelper::kGooglePublicDnsBAddrIPv4;
constexpr const char* SocketAddressTestHelper::kGooglePublicDnsAAddrIPv6;
constexpr const char* SocketAddressTestHelper::kGooglePublicDnsBAddrIPv6;

bool SocketAddressTestHelper::isIPv4Enabled() {
  return isFamilyOfAddrEnabled(kLoopbackAddrIPv4);
}

bool SocketAddressTestHelper::isIPv6Enabled() {
  return isFamilyOfAddrEnabled(kLoopbackAddrIPv6);
}

bool SocketAddressTestHelper::isFamilyOfAddrEnabled(const char* addr) {
  struct addrinfo hints {};
  hints.ai_flags = AI_ADDRCONFIG;

  struct addrinfo* resultsp = nullptr;
  int err = getaddrinfo(addr, nullptr, &hints, &resultsp);
  freeaddrinfo(resultsp);
  return !err;
}

}
