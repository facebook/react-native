/*
 * Copyright 2014-present Facebook, Inc.
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
#include <string>

#include <folly/CPortability.h>
#include <folly/Range.h>

namespace folly {

class FOLLY_EXPORT AsyncSocketException : public std::runtime_error {
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
    NETWORK_ERROR = 15,
    EARLY_DATA_REJECTED = 16,
  };

  AsyncSocketException(
      AsyncSocketExceptionType type,
      const std::string& message,
      int errnoCopy = 0)
      : std::runtime_error(getMessage(type, message, errnoCopy)),
        type_(type),
        errno_(errnoCopy) {}

  AsyncSocketExceptionType getType() const noexcept {
    return type_;
  }

  int getErrno() const noexcept {
    return errno_;
  }

 protected:
  /** get the string of exception type */
  static folly::StringPiece getExceptionTypeString(
      AsyncSocketExceptionType type);

  /** Return a message based on the input. */
  static std::string getMessage(
      AsyncSocketExceptionType type,
      const std::string& message,
      int errnoCopy);

  /** Error code */
  AsyncSocketExceptionType type_;

  /** A copy of the errno. */
  int errno_;
};

} // namespace folly
