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

#include <folly/io/async/test/SocketPair.h>

#include <folly/Conv.h>
#include <folly/portability/Fcntl.h>
#include <folly/portability/Sockets.h>
#include <folly/portability/Unistd.h>

#include <errno.h>
#include <stdexcept>

namespace folly {

SocketPair::SocketPair(Mode mode) {
  if (socketpair(PF_UNIX, SOCK_STREAM, 0, fds_) != 0) {
    throw std::runtime_error(folly::to<std::string>(
        "test::SocketPair: failed create socket pair", errno));
  }

  if (mode == NONBLOCKING) {
    if (fcntl(fds_[0], F_SETFL, O_NONBLOCK) != 0) {
      throw std::runtime_error(folly::to<std::string>(
          "test::SocketPair: failed to set non-blocking "
          "read mode",
          errno));
    }
    if (fcntl(fds_[1], F_SETFL, O_NONBLOCK) != 0) {
      throw std::runtime_error(folly::to<std::string>(
          "test::SocketPair: failed to set non-blocking "
          "write mode",
          errno));
    }
  }
}

SocketPair::~SocketPair() {
  closeFD0();
  closeFD1();
}

void SocketPair::closeFD0() {
  if (fds_[0] >= 0) {
    close(fds_[0]);
    fds_[0] = -1;
  }
}

void SocketPair::closeFD1() {
  if (fds_[1] >= 0) {
    close(fds_[1]);
    fds_[1] = -1;
  }
}

} // namespace folly
