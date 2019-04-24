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

#include <folly/io/async/SSLContext.h>
#include <folly/FileUtil.h>
#include <folly/portability/GTest.h>
#include <folly/ssl/OpenSSLPtrTypes.h>

using namespace std;
using namespace testing;

namespace folly {

class SSLContextTest : public testing::Test {
 public:
  SSLContext ctx;
  void verifySSLCipherList(const vector<string>& ciphers);
};

void SSLContextTest::verifySSLCipherList(const vector<string>& ciphers) {
  int i = 0;
  ssl::SSLUniquePtr ssl(ctx.createSSL());
  for (auto& cipher : ciphers) {
    ASSERT_STREQ(cipher.c_str(), SSL_get_cipher_list(ssl.get(), i++));
  }
  ASSERT_EQ(nullptr, SSL_get_cipher_list(ssl.get(), i));
}

TEST_F(SSLContextTest, TestSetCipherString) {
  ctx.ciphers("AES128-SHA:ECDHE-RSA-AES256-SHA384");
  verifySSLCipherList({"AES128-SHA", "ECDHE-RSA-AES256-SHA384"});
}

TEST_F(SSLContextTest, TestSetCipherList) {
  const vector<string> ciphers = {"ECDHE-RSA-AES128-SHA", "AES256-SHA"};
  ctx.setCipherList(ciphers);
  verifySSLCipherList(ciphers);
}

TEST_F(SSLContextTest, TestLoadCertKey) {
  std::string certData, keyData, anotherKeyData;
  const char* certPath = "folly/io/async/test/certs/tests-cert.pem";
  const char* keyPath = "folly/io/async/test/certs/tests-key.pem";
  const char* anotherKeyPath = "folly/io/async/test/certs/client_key.pem";
  folly::readFile(certPath, certData);
  folly::readFile(keyPath, keyData);
  folly::readFile(anotherKeyPath, anotherKeyData);

  {
    SCOPED_TRACE("Valid cert/key pair from buffer");
    SSLContext tmpCtx;
    tmpCtx.loadCertificateFromBufferPEM(certData);
    tmpCtx.loadPrivateKeyFromBufferPEM(keyData);
    EXPECT_TRUE(tmpCtx.isCertKeyPairValid());
  }

  {
    SCOPED_TRACE("Valid cert/key pair from files");
    SSLContext tmpCtx;
    tmpCtx.loadCertificate(certPath);
    tmpCtx.loadPrivateKey(keyPath);
    EXPECT_TRUE(tmpCtx.isCertKeyPairValid());
  }

  {
    SCOPED_TRACE("Invalid cert/key pair from file. Load cert first");
    SSLContext tmpCtx;
    tmpCtx.loadCertificate(certPath);
    EXPECT_THROW(tmpCtx.loadPrivateKey(anotherKeyPath), std::runtime_error);
  }

  {
    SCOPED_TRACE("Invalid cert/key pair from file. Load key first");
    SSLContext tmpCtx;
    tmpCtx.loadPrivateKey(anotherKeyPath);
    tmpCtx.loadCertificate(certPath);
    EXPECT_FALSE(tmpCtx.isCertKeyPairValid());
  }

  {
    SCOPED_TRACE("Invalid key/cert pair from buf. Load cert first");
    SSLContext tmpCtx;
    tmpCtx.loadCertificateFromBufferPEM(certData);
    EXPECT_THROW(
        tmpCtx.loadPrivateKeyFromBufferPEM(anotherKeyData), std::runtime_error);
  }

  {
    SCOPED_TRACE("Invalid key/cert pair from buf. Load key first");
    SSLContext tmpCtx;
    tmpCtx.loadPrivateKeyFromBufferPEM(anotherKeyData);
    tmpCtx.loadCertificateFromBufferPEM(certData);
    EXPECT_FALSE(tmpCtx.isCertKeyPairValid());
  }

  {
    SCOPED_TRACE(
        "loadCertKeyPairFromBufferPEM() must throw when cert/key mismatch");
    SSLContext tmpCtx;
    EXPECT_THROW(
        tmpCtx.loadCertKeyPairFromBufferPEM(certData, anotherKeyData),
        std::runtime_error);
  }

  {
    SCOPED_TRACE(
        "loadCertKeyPairFromBufferPEM() must succeed when cert/key match");
    SSLContext tmpCtx;
    tmpCtx.loadCertKeyPairFromBufferPEM(certData, keyData);
  }

  {
    SCOPED_TRACE(
        "loadCertKeyPairFromFiles() must throw when cert/key mismatch");
    SSLContext tmpCtx;
    EXPECT_THROW(
        tmpCtx.loadCertKeyPairFromFiles(certPath, anotherKeyPath),
        std::runtime_error);
  }

  {
    SCOPED_TRACE("loadCertKeyPairFromFiles() must succeed when cert/key match");
    SSLContext tmpCtx;
    tmpCtx.loadCertKeyPairFromFiles(certPath, keyPath);
  }
}
} // namespace folly
