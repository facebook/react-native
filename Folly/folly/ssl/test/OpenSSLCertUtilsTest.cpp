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

#include <folly/ssl/OpenSSLCertUtils.h>

#include <openssl/bio.h>
#include <openssl/evp.h>

#include <folly/Range.h>
#include <folly/String.h>
#include <folly/io/async/ssl/OpenSSLPtrTypes.h>
#include <folly/portability/GTest.h>
#include <folly/portability/OpenSSL.h>

using namespace testing;
using namespace folly;

const char* kTestCertWithoutSan = "folly/io/async/test/certs/tests-cert.pem";

// Test key
// -----BEGIN EC PRIVATE KEY-----
// MHcCAQEEIBskFwVZ9miFN+SKCFZPe9WEuFGmP+fsecLUnsTN6bOcoAoGCCqGSM49
// AwEHoUQDQgAE7/f4YYOYunAM/VkmjDYDg3AWUgyyTIraWmmQZsnu0bYNV/lLLfNz
// CtHggxGSwEtEe40nNb9C8wQmHUvb7VBBlw==
// -----END EC PRIVATE KEY-----
const std::string kTestCertWithSan = folly::stripLeftMargin(R"(
  -----BEGIN CERTIFICATE-----
  MIIDXDCCAkSgAwIBAgIBAjANBgkqhkiG9w0BAQsFADBQMQswCQYDVQQGEwJVUzEL
  MAkGA1UECAwCQ0ExDTALBgNVBAoMBEFzb3gxJTAjBgNVBAMMHEFzb3ggQ2VydGlm
  aWNhdGlvbiBBdXRob3JpdHkwHhcNMTcwMjEzMjMyMTAzWhcNNDQwNzAxMjMyMTAz
  WjAwMQswCQYDVQQGEwJVUzENMAsGA1UECgwEQXNveDESMBAGA1UEAwwJMTI3LjAu
  MC4xMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE7/f4YYOYunAM/VkmjDYDg3AW
  UgyyTIraWmmQZsnu0bYNV/lLLfNzCtHggxGSwEtEe40nNb9C8wQmHUvb7VBBl6OC
  ASowggEmMAkGA1UdEwQCMAAwLAYJYIZIAYb4QgENBB8WHU9wZW5TU0wgR2VuZXJh
  dGVkIENlcnRpZmljYXRlMB0GA1UdDgQWBBRx1kmdZEfXHmWLHpSDI0Lh8hmfwzAf
  BgNVHSMEGDAWgBQX3ykJKb97nxp/6UZJyDvts7noezAxBgNVHREEKjAoghJhbm90
  aGVyZXhhbXBsZS5jb22CEioudGhpcmRleGFtcGxlLmNvbTB4BggrBgEFBQcBAQRs
  MGowaAYIKwYBBQUHMAKGXGh0dHBzOi8vcGhhYnJpY2F0b3IuZmIuY29tL2RpZmZ1
  c2lvbi9GQkNPREUvYnJvd3NlL21hc3Rlci90aS90ZXN0X2NlcnRzL2NhX2NlcnQu
  cGVtP3ZpZXc9cmF3MA0GCSqGSIb3DQEBCwUAA4IBAQCj3FLjLMLudaFDiYo9pAPQ
  NBYNpG27aajQCvnEsYaMAGnNBxUUhv/E4xpnJEhatiCJWlPgGebdjXkpXYkLxnFj
  38UmpfZbNcvPPKxXmjIlkpYeFwcHTAUpFmMXVHdr8FjkDSN+qWHLllMFNAAqp0U6
  4VWjDlq9xCjzNw+8fdcEpwylpPrbNyQHqSO1k+DhM2qPuQfiWPmHe2PbJv8JB3no
  HWGi9SNe0FjtJM3066L0Gj8g/bFDo/pnyKguQyGkS7PaepK5/u5Y2fMMBO/m4+U0
  b9Yb0TvatsqL688CoZcSn73A0yAjptwbD/4HmcVlG2j/y8eTVpXisugu6Xz+QQGu
  -----END CERTIFICATE-----
)");

static folly::ssl::X509UniquePtr readCertFromFile(const std::string& filename) {
  folly::ssl::BioUniquePtr bio(BIO_new(BIO_s_file()));
  if (!bio) {
    throw std::runtime_error("Couldn't create BIO");
  }

  if (BIO_read_filename(bio.get(), filename.c_str()) != 1) {
    throw std::runtime_error("Couldn't read cert file: " + filename);
  }
  return folly::ssl::X509UniquePtr(
      PEM_read_bio_X509(bio.get(), nullptr, nullptr, nullptr));
}

static folly::ssl::X509UniquePtr readCertFromData(
    const folly::StringPiece data) {
  folly::ssl::BioUniquePtr bio(BIO_new_mem_buf(data.data(), data.size()));
  if (!bio) {
    throw std::runtime_error("Couldn't create BIO");
  }
  return folly::ssl::X509UniquePtr(
      PEM_read_bio_X509(bio.get(), nullptr, nullptr, nullptr));
}

TEST(OpenSSLCertUtilsTest, TestX509CN) {
  OpenSSL_add_all_algorithms();

  auto x509 = readCertFromFile(kTestCertWithoutSan);
  EXPECT_NE(x509, nullptr);
  auto identity = folly::ssl::OpenSSLCertUtils::getCommonName(*x509);
  EXPECT_EQ(identity.value(), "Asox Company");
  auto sans = folly::ssl::OpenSSLCertUtils::getSubjectAltNames(*x509);
  EXPECT_EQ(sans.size(), 0);
}

TEST(OpenSSLCertUtilsTest, TestX509Sans) {
  OpenSSL_add_all_algorithms();

  auto x509 = readCertFromData(kTestCertWithSan);
  EXPECT_NE(x509, nullptr);
  auto identity = folly::ssl::OpenSSLCertUtils::getCommonName(*x509);
  EXPECT_EQ(identity.value(), "127.0.0.1");
  auto altNames = folly::ssl::OpenSSLCertUtils::getSubjectAltNames(*x509);
  EXPECT_EQ(altNames.size(), 2);
  EXPECT_EQ(altNames[0], "anotherexample.com");
  EXPECT_EQ(altNames[1], "*.thirdexample.com");
}

TEST(OpenSSLCertUtilsTest, TestX509IssuerAndSubject) {
  OpenSSL_add_all_algorithms();

  auto x509 = readCertFromData(kTestCertWithSan);
  EXPECT_NE(x509, nullptr);
  auto issuer = folly::ssl::OpenSSLCertUtils::getIssuer(*x509);
  EXPECT_EQ(
      issuer.value(),
      "C = US, ST = CA, O = Asox, CN = Asox Certification Authority");
  auto subj = folly::ssl::OpenSSLCertUtils::getSubject(*x509);
  EXPECT_EQ(subj.value(), "C = US, O = Asox, CN = 127.0.0.1");
}

TEST(OpenSSLCertUtilsTest, TestX509Dates) {
  OpenSSL_add_all_algorithms();

  auto x509 = readCertFromData(kTestCertWithSan);
  EXPECT_NE(x509, nullptr);
  auto notBefore = folly::ssl::OpenSSLCertUtils::getNotBeforeTime(*x509);
  EXPECT_EQ(notBefore, "Feb 13 23:21:03 2017 GMT");
  auto notAfter = folly::ssl::OpenSSLCertUtils::getNotAfterTime(*x509);
  EXPECT_EQ(notAfter, "Jul  1 23:21:03 2044 GMT");
}

TEST(OpenSSLCertUtilsTest, TestX509Summary) {
  OpenSSL_add_all_algorithms();

  auto x509 = readCertFromData(kTestCertWithSan);
  EXPECT_NE(x509, nullptr);
  auto summary = folly::ssl::OpenSSLCertUtils::toString(*x509);
  EXPECT_EQ(
      summary.value(),
      "        Version: 3 (0x2)\n        Serial Number: 2 (0x2)\n"
      "        Issuer: C = US, ST = CA, O = Asox, CN = Asox Certification Authority\n"
      "        Validity\n            Not Before: Feb 13 23:21:03 2017 GMT\n"
      "            Not After : Jul  1 23:21:03 2044 GMT\n"
      "        Subject: C = US, O = Asox, CN = 127.0.0.1\n"
      "        X509v3 extensions:\n"
      "            X509v3 Basic Constraints: \n"
      "                CA:FALSE\n"
      "            Netscape Comment: \n"
      "                OpenSSL Generated Certificate\n"
      "            X509v3 Subject Key Identifier: \n"
      "                71:D6:49:9D:64:47:D7:1E:65:8B:1E:94:83:23:42:E1:F2:19:9F:C3\n"
      "            X509v3 Authority Key Identifier: \n"
      "                keyid:17:DF:29:09:29:BF:7B:9F:1A:7F:E9:46:49:C8:3B:ED:B3:B9:E8:7B\n\n"
      "            X509v3 Subject Alternative Name: \n"
      "                DNS:anotherexample.com, DNS:*.thirdexample.com\n"
      "            Authority Information Access: \n"
      "                CA Issuers - URI:https://phabricator.fb.com/diffusion/FBCODE/browse/master/ti/test_certs/ca_cert.pem?view=raw\n\n");
}
