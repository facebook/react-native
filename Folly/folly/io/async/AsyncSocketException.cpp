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

#include <folly/io/async/AsyncSocketException.h>

#include <folly/Format.h>
#include <folly/String.h>

namespace folly {

/* static */ StringPiece AsyncSocketException::getExceptionTypeString(
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
    case EARLY_DATA_REJECTED:
      return "Early data rejected";
    default:
      return "(Invalid exception type)";
  }
}

/* static */ std::string AsyncSocketException::getMessage(
    AsyncSocketExceptionType type,
    const std::string& message,
    int errnoCopy) {
  if (errnoCopy != 0) {
    return sformat(
        "AsyncSocketException: {}, type = {}, errno = {} ({})",
        message,
        getExceptionTypeString(type),
        errnoCopy,
        errnoStr(errnoCopy));
  } else {
    return sformat(
        "AsyncSocketException: {}, type = {}",
        message,
        getExceptionTypeString(type));
  }
}

} // namespace folly
