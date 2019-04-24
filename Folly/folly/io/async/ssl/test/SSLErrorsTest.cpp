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

#include <folly/io/async/ssl/SSLErrors.h>

#include <folly/portability/GTest.h>
#include <folly/portability/OpenSSL.h>

using namespace testing;
using namespace folly;

TEST(SSLErrorsTest, TestMessage) {
  ERR_load_crypto_strings();
  unsigned long err;
#ifdef OPENSSL_IS_BORINGSSL
  err = ERR_PACK(ERR_LIB_X509, X509_R_CERT_ALREADY_IN_HASH_TABLE);
#else
  err = ERR_PACK(
      ERR_LIB_X509,
      X509_F_X509_STORE_ADD_CERT,
      X509_R_CERT_ALREADY_IN_HASH_TABLE);
#endif
  SSLException ex(0, err, 0, 0);

// This is flaky - we should not be testing error strings
// which may change version to version
#if defined(OPENSSL_IS_BORINGSSL)
  std::string expectedMsg =
      "AsyncSocketException: error:0b000069:X.509 certificate routines:"
      "OPENSSL_internal:CERT_ALREADY_IN_HASH_TABLE, type = SSL error";
#else
  std::string expectedMsg =
      "AsyncSocketException: error:0B07C065:"
      "x509 certificate routines:X509_STORE_add_cert:"
      "cert already in hash table, type = SSL error";
#endif
  std::string actual = ex.what();
  EXPECT_EQ(expectedMsg, actual);
}
