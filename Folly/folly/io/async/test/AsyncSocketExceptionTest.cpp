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
#include <array>

#include <folly/io/async/AsyncSocketException.h>
#include <folly/io/async/SSLContext.h>
#include <folly/io/async/ssl/SSLErrors.h>
#include <folly/ssl/Init.h>

#include <folly/portability/GTest.h>
#include <folly/portability/OpenSSL.h>

using namespace testing;

namespace folly {

TEST(AsyncSocketException, SimpleTest) {
  AsyncSocketException ex1(
      AsyncSocketException::AsyncSocketExceptionType::NOT_OPEN,
      "test exception 1");

  EXPECT_EQ(
      AsyncSocketException::AsyncSocketExceptionType::NOT_OPEN, ex1.getType());
  EXPECT_EQ(0, ex1.getErrno());
  EXPECT_EQ(
      "AsyncSocketException: test exception 1, type = Socket not open",
      std::string(ex1.what()));

  AsyncSocketException ex2(
      AsyncSocketException::AsyncSocketExceptionType::BAD_ARGS,
      "test exception 2",
      111 /*ECONNREFUSED*/);

  EXPECT_EQ(
      AsyncSocketException::AsyncSocketExceptionType::BAD_ARGS, ex2.getType());
  EXPECT_EQ(111, ex2.getErrno());
  EXPECT_EQ(
      "AsyncSocketException: test exception 2, type = Invalid arguments, "
      "errno = 111 (Connection refused)",
      std::string(ex2.what()));
}

TEST(AsyncSocketException, SSLExceptionType) {
  {
    // Initiailzes OpenSSL everything. Else some of the calls will block
    folly::ssl::init();
    SSLException eof(SSL_ERROR_ZERO_RETURN, 0, 0, 0);
    EXPECT_EQ(eof.getType(), AsyncSocketException::END_OF_FILE);

    SSLException netEof(SSL_ERROR_SYSCALL, 0, 0, 0);
    EXPECT_EQ(netEof.getType(), AsyncSocketException::END_OF_FILE);

    SSLException netOther(SSL_ERROR_SYSCALL, 0, 1, 0);
    EXPECT_EQ(netOther.getType(), AsyncSocketException::NETWORK_ERROR);

    std::array<int, 6> sslErrs{{SSL_ERROR_SSL,
                                SSL_ERROR_WANT_READ,
                                SSL_ERROR_WANT_WRITE,
                                SSL_ERROR_WANT_X509_LOOKUP,
                                SSL_ERROR_WANT_CONNECT,
                                SSL_ERROR_WANT_ACCEPT}};

    for (auto& e : sslErrs) {
      SSLException sslEx(e, 0, 0, 0);
      EXPECT_EQ(sslEx.getType(), AsyncSocketException::SSL_ERROR);
    }
  }

  {
    SSLException eof(SSLError::EOF_ERROR);
    EXPECT_EQ(eof.getType(), AsyncSocketException::END_OF_FILE);

    SSLException net(SSLError::NETWORK_ERROR);
    EXPECT_EQ(net.getType(), AsyncSocketException::NETWORK_ERROR);

    std::array<SSLError, 4> errs{{SSLError::CLIENT_RENEGOTIATION,
                                  SSLError::INVALID_RENEGOTIATION,
                                  SSLError::EARLY_WRITE,
                                  SSLError::SSL_ERROR}};

    for (auto& e : errs) {
      SSLException sslEx(e);
      EXPECT_EQ(sslEx.getType(), AsyncSocketException::SSL_ERROR);
    }
  }
}

} // namespace folly
