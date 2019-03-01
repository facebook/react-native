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
#pragma once

#include <folly/Conv.h>
#include <folly/portability/OpenSSL.h>

#include <openssl/crypto.h>
#include <openssl/opensslv.h>

// This is used to find the OpenSSL version at runtime. Just returning
// OPENSSL_VERSION_NUMBER is insufficient as runtime version may be different
// from the compile-time version
struct OpenSSLVersionFinder {
  static std::string getOpenSSLLongVersion(void) {
#ifdef OPENSSL_VERSION_TEXT
    return SSLeay_version(SSLEAY_VERSION);
#elif defined(OPENSSL_VERSION_NUMBER)
    return folly::format("0x{:x}", OPENSSL_VERSION_NUMBER).str();
#else
    return "";
#endif
  }

  uint64_t getOpenSSLNumericVersion(void) {
#ifdef OPENSSL_VERSION_NUMBER
    return SSLeay();
#else
    return 0;
#endif
  }
};
