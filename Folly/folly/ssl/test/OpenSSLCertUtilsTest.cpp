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
#include <folly/ssl/OpenSSLCertUtils.h>

#include <folly/Format.h>
#include <folly/Range.h>
#include <folly/String.h>
#include <folly/container/Enumerate.h>
#include <folly/portability/GTest.h>
#include <folly/portability/OpenSSL.h>
#include <folly/ssl/Init.h>
#include <folly/ssl/OpenSSLPtrTypes.h>

using namespace testing;
using namespace folly;

const char* kTestCertWithoutSan = "folly/io/async/test/certs/tests-cert.pem";
const char* kTestCa = "folly/io/async/test/certs/ca-cert.pem";

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

const std::string kTestCertBundle = folly::stripLeftMargin(R"(
  -----BEGIN CERTIFICATE-----
  MIIDgzCCAmugAwIBAgIJAIkcS3PQcCm+MA0GCSqGSIb3DQEBCwUAMFgxCzAJBgNV
  BAYTAlhYMRUwEwYDVQQHDAxEZWZhdWx0IENpdHkxHDAaBgNVBAoME0RlZmF1bHQg
  Q29tcGFueSBMdGQxFDASBgNVBAMMC3Rlc3QgY2VydCAxMB4XDTE3MTAyMzIwNTcw
  M1oXDTE4MTAyMzIwNTcwM1owWDELMAkGA1UEBhMCWFgxFTATBgNVBAcMDERlZmF1
  bHQgQ2l0eTEcMBoGA1UECgwTRGVmYXVsdCBDb21wYW55IEx0ZDEUMBIGA1UEAwwL
  dGVzdCBjZXJ0IDEwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCplTzR
  6shdhVNbx5HFViiYDBjRYXCWiUeR0/0+XPkyI+DPIGAQ6Mre8WD03GPebYn7j3Lr
  JwgV06BJNvVCLDy0SJbf6ToxGfKWSLEWOoip32nIpb9qxURtx44NUvhChP54hhKI
  zAf8nNlS+qKUYbmixJHeUWO//8wNpsMKDkvtfVUZ6oVV3JPOOihJ+sQ0sIc5x+xk
  3eWfa0cNoZnxu4plQg2O4RlHOv8ruMW6BttpcqQ8I+Rxq+/YOhNQhX+6GZ1+Rs+f
  ddWXYNH6tFxsLIEbgCqHhLGw7g+JRms9R+CxLCpjmhYhR2xgl6KQu/Racr2T/17z
  897VfY7X94PmamidAgMBAAGjUDBOMB0GA1UdDgQWBBRHQvRr2p3/83y1yXiiVnnS
  zObpzTAfBgNVHSMEGDAWgBRHQvRr2p3/83y1yXiiVnnSzObpzTAMBgNVHRMEBTAD
  AQH/MA0GCSqGSIb3DQEBCwUAA4IBAQAk61K1sjrS7rrLnGND1o1Q6D2ebgb1wcfU
  WX+ZnhlkUxjSS1nHmaulMftpvzbgrOt7HWZKMXIpetnDSfksrGpw6QJ3VWFIJlH5
  P4x8//pVeI5jQd4W7gIl65tZOc5cEH8aqnzkaGP8YBx6BI6N8px1gZVgePVu3ebR
  eLdrWH2l4VishWOf6rO/ltQdTwRIqj08QNsWmSrRK2d7J/DGA6R9JkdyxeLdxqmB
  2BMwJ7IVR+bWuTzD9Zk5lZseIVFcIksxmQ8jJuZXUdN8WOT/65p9UnN+Cc6+Q7F4
  rlVz+ytcdvaf5mDeqFILDK6btWcUP2Vr1EfRDt/QBrU6OjAVQD+U
  -----END CERTIFICATE-----
  -----BEGIN CERTIFICATE-----
  MIIDgzCCAmugAwIBAgIJAPzrfjTkvHezMA0GCSqGSIb3DQEBCwUAMFgxCzAJBgNV
  BAYTAlhYMRUwEwYDVQQHDAxEZWZhdWx0IENpdHkxHDAaBgNVBAoME0RlZmF1bHQg
  Q29tcGFueSBMdGQxFDASBgNVBAMMC3Rlc3QgY2VydCAyMB4XDTE3MTAyMzIwNTcx
  NloXDTE4MTAyMzIwNTcxNlowWDELMAkGA1UEBhMCWFgxFTATBgNVBAcMDERlZmF1
  bHQgQ2l0eTEcMBoGA1UECgwTRGVmYXVsdCBDb21wYW55IEx0ZDEUMBIGA1UEAwwL
  dGVzdCBjZXJ0IDIwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCzy9G/
  NM7Llp+foYxug2Dqc3r9zWtb4PvbRqoz8W0ZRy0GkL3JtOfLWtlz+RCGa//mlGMA
  HLa+Qg77nnjuhO/KCCgQS9fxHY+zcv1VBwzsKmKcju4BCscsTLPsy0SJCXBXSgnH
  S4NMR/K+YozwdikEZRbU4VLJiw44CeJ1h74r2ElHYuOL0SpL8PSlv7kJu3/xWUiV
  L2iWk+y8yKIpCRQ9I7+L0kuhylZAmVBTKtgbdcLfERqQNNWAT7D+p/6CwNmpT9ei
  G2xJ0N4bt3w8kwcZ+IkGwei8Nadix+POe3WVU9K1VXVfoLZ9nNWKRnwIFP4Bsmld
  rP4Uy2IZuhrKE4BPAgMBAAGjUDBOMB0GA1UdDgQWBBQkmeMfPQaax9wCZL16jSSG
  XigBWjAfBgNVHSMEGDAWgBQkmeMfPQaax9wCZL16jSSGXigBWjAMBgNVHRMEBTAD
  AQH/MA0GCSqGSIb3DQEBCwUAA4IBAQCXzqxYp1FqMS2M+opCSPezgPDBdE2S9g6d
  HJHV5CLptGnu1vQIlyCXy/7X9b6Qq8UzuYyFacN/37tbNw6sGyTRfL8sEeFYfFoT
  GvgSrRqSM47ZBYx5jW/Uslkc5qbq+v4zeGCq5611stQKsJYIudu0+PjJmgtNF6en
  zTx8B6eS79GRN3/M7/kFLlxeZNCQpmKwvPp8P7JE4ZHUtuzQoKtjdt/etWpS76fV
  Akx7VhCFg/lw80tmgSclq885hYRYc6DOKfUubWOacKVfmHwL4oDiSffBonI7MoH8
  SJbzsCBpVd/tkDADZpxBQplGV7AaDBoNS0qvZHfH5x9R9R5lx9M+
  -----END CERTIFICATE-----
  -----BEGIN CERTIFICATE-----
  MIIDgzCCAmugAwIBAgIJAOzqPJDDfSKDMA0GCSqGSIb3DQEBCwUAMFgxCzAJBgNV
  BAYTAlhYMRUwEwYDVQQHDAxEZWZhdWx0IENpdHkxHDAaBgNVBAoME0RlZmF1bHQg
  Q29tcGFueSBMdGQxFDASBgNVBAMMC3Rlc3QgY2VydCAzMB4XDTE3MTAyMzIwNTcy
  NVoXDTE4MTAyMzIwNTcyNVowWDELMAkGA1UEBhMCWFgxFTATBgNVBAcMDERlZmF1
  bHQgQ2l0eTEcMBoGA1UECgwTRGVmYXVsdCBDb21wYW55IEx0ZDEUMBIGA1UEAwwL
  dGVzdCBjZXJ0IDMwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDWqU2b
  eBzaOAja6od84hFfgvitOGrCYqLXMUXe0X7AlldzXV4zHaVyTKdEwDwvKDi5p9OF
  uTxSZkZ0JSPHZeH2/rHXidNMWdtiy5x/5ra1u9ctN7jHeboIxmdpfxoGq7s6cRA5
  oRh0bCNmw+Y7K+1RITmPloB7155RbrJYZR5MOFIaCnZV3j/icKjASTOg3ivXX4lx
  BoHGMYF8rl+51FIJsuXvnBgF+GhadMVSWl4Qy6gLliml1MgujlmFg9/1y/xzdWZg
  yyLI3tvw7fo/NN62u41VQBdCGdpvnVxU4ADu2/T0vhAS+Bh2CMK1OAAw61x1507S
  f68mab9s8at49qefAgMBAAGjUDBOMB0GA1UdDgQWBBQnn76Swsnld6Q1weLgpo/S
  tt0KeTAfBgNVHSMEGDAWgBQnn76Swsnld6Q1weLgpo/Stt0KeTAMBgNVHRMEBTAD
  AQH/MA0GCSqGSIb3DQEBCwUAA4IBAQCB0XANIWyP7DYROh6MFQLqeylngd9iUGNe
  BMT4pWu60p5ZX13kK/gbV/P2cayUkkWEMWpzKcIX70IkaB5y/OxVMXUXo94UupsM
  b1T736wHA0TLeL7yDj9OnMYj/qa2r8pAyEObI84KoWRGMHH9UPSRbVMVrhg/agBA
  LA6eZhwiGctkCy09kp+SFbUpv+SMyVp60UrPub6j68Hzd0FioGY01Os7nScuPNo0
  rl2S+G36bcem8Z5MOkJ0LEFi6ctK9JdLcHkr1SVavo3fsYZaIZraJxFGcYUVyLT+
  Rw7ydBokxHWsmVJczuRmEovXcTmgIphti234e7usKjw8M5mGwYfa
  -----END CERTIFICATE-----
)");

class OpenSSLCertUtilsTest : public Test {
 public:
  void SetUp() override {
    folly::ssl::init();
  }
};

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

TEST_F(OpenSSLCertUtilsTest, TestX509CN) {
  auto x509 = readCertFromFile(kTestCertWithoutSan);
  EXPECT_NE(x509, nullptr);
  auto identity = folly::ssl::OpenSSLCertUtils::getCommonName(*x509);
  EXPECT_EQ(identity.value(), "Asox Company");
  auto sans = folly::ssl::OpenSSLCertUtils::getSubjectAltNames(*x509);
  EXPECT_EQ(sans.size(), 0);
}

TEST_F(OpenSSLCertUtilsTest, TestX509Sans) {
  auto x509 = readCertFromData(kTestCertWithSan);
  EXPECT_NE(x509, nullptr);
  auto identity = folly::ssl::OpenSSLCertUtils::getCommonName(*x509);
  EXPECT_EQ(identity.value(), "127.0.0.1");
  auto altNames = folly::ssl::OpenSSLCertUtils::getSubjectAltNames(*x509);
  EXPECT_EQ(altNames.size(), 2);
  EXPECT_EQ(altNames[0], "anotherexample.com");
  EXPECT_EQ(altNames[1], "*.thirdexample.com");
}

TEST_F(OpenSSLCertUtilsTest, TestX509IssuerAndSubject) {
  auto x509 = readCertFromData(kTestCertWithSan);
  EXPECT_NE(x509, nullptr);
  auto issuer = folly::ssl::OpenSSLCertUtils::getIssuer(*x509);
  EXPECT_EQ(
      issuer.value(),
      "C = US, ST = CA, O = Asox, CN = Asox Certification Authority");
  auto subj = folly::ssl::OpenSSLCertUtils::getSubject(*x509);
  EXPECT_EQ(subj.value(), "C = US, O = Asox, CN = 127.0.0.1");
}

TEST_F(OpenSSLCertUtilsTest, TestX509Dates) {
  auto x509 = readCertFromData(kTestCertWithSan);
  EXPECT_NE(x509, nullptr);
  auto notBefore = folly::ssl::OpenSSLCertUtils::getNotBeforeTime(*x509);
  EXPECT_EQ(notBefore, "Feb 13 23:21:03 2017 GMT");
  auto notAfter = folly::ssl::OpenSSLCertUtils::getNotAfterTime(*x509);
  EXPECT_EQ(notAfter, "Jul  1 23:21:03 2044 GMT");
}

TEST_F(OpenSSLCertUtilsTest, TestX509Summary) {
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

TEST_F(OpenSSLCertUtilsTest, TestDerEncodeDecode) {
  auto x509 = readCertFromData(kTestCertWithSan);

  auto der = folly::ssl::OpenSSLCertUtils::derEncode(*x509);
  auto decoded = folly::ssl::OpenSSLCertUtils::derDecode(der->coalesce());

  EXPECT_EQ(
      folly::ssl::OpenSSLCertUtils::toString(*x509),
      folly::ssl::OpenSSLCertUtils::toString(*decoded));
}

TEST_F(OpenSSLCertUtilsTest, TestDerDecodeJunkData) {
  StringPiece junk{"MyFakeCertificate"};
  EXPECT_THROW(
      folly::ssl::OpenSSLCertUtils::derDecode(junk), std::runtime_error);
}

TEST_F(OpenSSLCertUtilsTest, TestDerDecodeTooShort) {
  auto x509 = readCertFromData(kTestCertWithSan);

  auto der = folly::ssl::OpenSSLCertUtils::derEncode(*x509);
  der->trimEnd(1);
  EXPECT_THROW(
      folly::ssl::OpenSSLCertUtils::derDecode(der->coalesce()),
      std::runtime_error);
}

TEST_F(OpenSSLCertUtilsTest, TestReadCertsFromBuffer) {
  auto certs = folly::ssl::OpenSSLCertUtils::readCertsFromBuffer(
      StringPiece(kTestCertBundle));
  EXPECT_EQ(certs.size(), 3);
  for (auto i : folly::enumerate(certs)) {
    auto identity = folly::ssl::OpenSSLCertUtils::getCommonName(**i);
    EXPECT_TRUE(identity);
    EXPECT_EQ(*identity, folly::sformat("test cert {}", i.index + 1));
  }
}

TEST_F(OpenSSLCertUtilsTest, TestX509Digest) {
  auto x509 = readCertFromFile(kTestCertWithoutSan);
  EXPECT_NE(x509, nullptr);

  auto sha1Digest = folly::ssl::OpenSSLCertUtils::getDigestSha1(*x509);
  EXPECT_EQ(
      folly::hexlify(folly::range(sha1Digest)),
      "b84e951d6c4e6cc70346357fab43d7ed73a07b0f");

  auto sha2Digest = folly::ssl::OpenSSLCertUtils::getDigestSha256(*x509);
  EXPECT_EQ(
      folly::hexlify(folly::range(sha2Digest)),
      "364d3a6a0b10d0635ce59b40c0b7f505ab2cd9fd0a06661cdc61d9cb8c9c9821");
}

TEST_F(OpenSSLCertUtilsTest, TestX509Store) {
  auto store = folly::ssl::OpenSSLCertUtils::readStoreFromFile(kTestCa);
  EXPECT_NE(store, nullptr);

  auto x509 = readCertFromFile(kTestCertWithoutSan);
  folly::ssl::X509StoreCtxUniquePtr ctx(X509_STORE_CTX_new());
  auto rc = X509_STORE_CTX_init(ctx.get(), store.get(), x509.get(), nullptr);
  EXPECT_EQ(rc, 1);
  rc = X509_verify_cert(ctx.get());
  EXPECT_EQ(rc, 1);
}
