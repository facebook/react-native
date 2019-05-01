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

#pragma once

namespace folly {

class SocketAddressTestHelper {
 public:
  static constexpr const char* kLoopbackAddrIPv4 = "127.0.0.1";
  static constexpr const char* kLoopbackAddrIPv6 = "::1";

  //  https://developers.google.com/speed/public-dns/docs/using?hl=en
  static constexpr const char* kGooglePublicDnsAName =
      "google-public-dns-a.google.com";
  static constexpr const char* kGooglePublicDnsBName =
      "google-public-dns-b.google.com";
  static constexpr const char* kGooglePublicDnsAAddrIPv4 = "8.8.8.8";
  static constexpr const char* kGooglePublicDnsBAddrIPv4 = "8.8.4.4";
  static constexpr const char* kGooglePublicDnsAAddrIPv6 =
      "2001:4860:4860::8888";
  static constexpr const char* kGooglePublicDnsBAddrIPv6 =
      "2001:4860:4860::8844";

  static bool isIPv4Enabled();
  static bool isIPv6Enabled();

 private:
  static bool isFamilyOfAddrEnabled(const char* addr);
};
} // namespace folly
