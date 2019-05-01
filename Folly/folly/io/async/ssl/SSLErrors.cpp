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

#include <folly/Range.h>
#include <folly/portability/OpenSSL.h>

using namespace folly;

namespace {

std::string decodeOpenSSLError(
    int sslError,
    unsigned long errError,
    int sslOperationReturnValue) {
  if (sslError == SSL_ERROR_SYSCALL && errError == 0) {
    if (sslOperationReturnValue == 0) {
      return "Connection EOF";
    } else {
      // In this case errno is set, AsyncSocketException will add it.
      return "Network error";
    }
  } else if (sslError == SSL_ERROR_ZERO_RETURN) {
    // This signifies a TLS closure alert.
    return "SSL connection closed normally";
  } else {
    std::array<char, 256> buf;
    ERR_error_string_n(errError, buf.data(), buf.size());
    // OpenSSL will null terminate the string.
    return std::string(buf.data());
  }
}

const StringPiece getSSLErrorString(SSLError error) {
  StringPiece ret;
  switch (error) {
    case SSLError::CLIENT_RENEGOTIATION:
      ret = "Client tried to renegotiate with server";
      break;
    case SSLError::INVALID_RENEGOTIATION:
      ret = "Attempt to start renegotiation, but unsupported";
      break;
    case SSLError::EARLY_WRITE:
      ret = "Attempt to write before SSL connection established";
      break;
    case SSLError::SSL_ERROR:
      ret = "SSL error";
      break;
    case SSLError::NETWORK_ERROR:
      ret = "Network error";
      break;
    case SSLError::EOF_ERROR:
      ret = "SSL connection closed normally";
      break;
  }
  return ret;
}

AsyncSocketException::AsyncSocketExceptionType exTypefromSSLErrInfo(
    int sslErr,
    unsigned long errError,
    int sslOperationReturnValue) {
  if (sslErr == SSL_ERROR_ZERO_RETURN) {
    return AsyncSocketException::END_OF_FILE;
  } else if (sslErr == SSL_ERROR_SYSCALL) {
    if (errError == 0 && sslOperationReturnValue == 0) {
      return AsyncSocketException::END_OF_FILE;
    } else {
      return AsyncSocketException::NETWORK_ERROR;
    }
  } else {
    // Assume an actual SSL error
    return AsyncSocketException::SSL_ERROR;
  }
}

AsyncSocketException::AsyncSocketExceptionType exTypefromSSLErr(SSLError err) {
  switch (err) {
    case SSLError::EOF_ERROR:
      return AsyncSocketException::END_OF_FILE;
    case SSLError::NETWORK_ERROR:
      return AsyncSocketException::NETWORK_ERROR;
    default:
      // everything else is a SSL_ERROR
      return AsyncSocketException::SSL_ERROR;
  }
}
} // namespace

namespace folly {

SSLException::SSLException(
    int sslErr,
    unsigned long errError,
    int sslOperationReturnValue,
    int errno_copy)
    : AsyncSocketException(
          exTypefromSSLErrInfo(sslErr, errError, sslOperationReturnValue),
          decodeOpenSSLError(sslErr, errError, sslOperationReturnValue),
          sslErr == SSL_ERROR_SYSCALL ? errno_copy : 0) {
  if (sslErr == SSL_ERROR_ZERO_RETURN) {
    sslError = SSLError::EOF_ERROR;
  } else if (sslErr == SSL_ERROR_SYSCALL) {
    sslError = SSLError::NETWORK_ERROR;
  } else {
    // Conservatively assume that this is an SSL error
    sslError = SSLError::SSL_ERROR;
  }
}

SSLException::SSLException(SSLError error)
    : AsyncSocketException(
          exTypefromSSLErr(error),
          getSSLErrorString(error).str(),
          0),
      sslError(error) {}
} // namespace folly
