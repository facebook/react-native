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

#include <stdexcept>

#include <folly/Format.h>
#include <folly/io/async/DelayedDestruction.h>

namespace folly {

class AsyncSocketException : public std::runtime_error {
 public:
  enum AsyncSocketExceptionType {
    UNKNOWN = 0,
    NOT_OPEN = 1,
    ALREADY_OPEN = 2,
    TIMED_OUT = 3,
    END_OF_FILE = 4,
    INTERRUPTED = 5,
    BAD_ARGS = 6,
    CORRUPTED_DATA = 7,
    INTERNAL_ERROR = 8,
    NOT_SUPPORTED = 9,
    INVALID_STATE = 10,
    SSL_ERROR = 12,
    COULD_NOT_BIND = 13,
    SASL_HANDSHAKE_TIMEOUT = 14,
    NETWORK_ERROR = 15
  };

  AsyncSocketException(AsyncSocketExceptionType type,
                       const std::string& message,
                       int errno_copy = 0)
      : std::runtime_error(
            AsyncSocketException::getMessage(type, message, errno_copy)),
        type_(type),
        errno_(errno_copy) {}

  /** Error code */
  AsyncSocketExceptionType type_;

  /** A copy of the errno. */
  int errno_;

  AsyncSocketExceptionType getType() const noexcept { return type_; }
  int getErrno() const noexcept { return errno_; }

 protected:
  /** Just like strerror_r but returns a C++ string object. */
  static std::string strerror_s(int errno_copy) {
    return folly::sformat("errno = {} ({})", errno_copy, strerror(errno_copy));
  }

  /** get the string of exception type */
  static folly::StringPiece getExceptionTypeString(
      AsyncSocketExceptionType type) {
    switch (type) {
      case UNKNOWN:
        return "Unknown async socket exception";
      case NOT_OPEN:
        return "Socket not open";
      case ALREADY_OPEN:
        return "Socket already open";
      case TIMED_OUT:
        return "Timed out";
      case END_OF_FILE:
        return "End of file";
      case INTERRUPTED:
        return "Interrupted";
      case BAD_ARGS:
        return "Invalid arguments";
      case CORRUPTED_DATA:
        return "Corrupted Data";
      case INTERNAL_ERROR:
        return "Internal error";
      case NOT_SUPPORTED:
        return "Not supported";
      case INVALID_STATE:
        return "Invalid state";
      case SSL_ERROR:
        return "SSL error";
      case COULD_NOT_BIND:
        return "Could not bind";
      case SASL_HANDSHAKE_TIMEOUT:
        return "SASL handshake timeout";
      case NETWORK_ERROR:
        return "Network error";
      default:
        return "(Invalid exception type)";
    }
  }

  /** Return a message based on the input. */
  static std::string getMessage(AsyncSocketExceptionType type,
                                const std::string& message,
                                int errno_copy) {
    if (errno_copy != 0) {
      return folly::sformat(
          "AsyncSocketException: {}, type = {}, errno = {} ({})",
          message,
          AsyncSocketException::getExceptionTypeString(type),
          errno_copy,
          strerror(errno_copy));
    } else {
      return folly::sformat("AsyncSocketException: {}, type = {}",
                            message,
                            AsyncSocketException::getExceptionTypeString(type));
    }
  }
};

} // folly
