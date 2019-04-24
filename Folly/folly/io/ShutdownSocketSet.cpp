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

#include <folly/io/ShutdownSocketSet.h>

#include <chrono>
#include <thread>

#include <glog/logging.h>

#include <folly/FileUtil.h>
#include <folly/portability/Sockets.h>

namespace folly {

ShutdownSocketSet::ShutdownSocketSet(int maxFd)
    : maxFd_(maxFd),
      data_(static_cast<std::atomic<uint8_t>*>(
          folly::checkedCalloc(size_t(maxFd), sizeof(std::atomic<uint8_t>)))),
      nullFile_("/dev/null", O_RDWR) {}

void ShutdownSocketSet::add(int fd) {
  // Silently ignore any fds >= maxFd_, very unlikely
  DCHECK_GE(fd, 0);
  if (fd >= maxFd_) {
    return;
  }

  auto& sref = data_[size_t(fd)];
  uint8_t prevState = FREE;
  CHECK(sref.compare_exchange_strong(
      prevState, IN_USE, std::memory_order_relaxed))
      << "Invalid prev state for fd " << fd << ": " << int(prevState);
}

void ShutdownSocketSet::remove(int fd) {
  DCHECK_GE(fd, 0);
  if (fd >= maxFd_) {
    return;
  }

  auto& sref = data_[size_t(fd)];
  uint8_t prevState = 0;

  prevState = sref.load(std::memory_order_relaxed);
  do {
    switch (prevState) {
      case IN_SHUTDOWN:
        std::this_thread::sleep_for(std::chrono::milliseconds(1));
        prevState = sref.load(std::memory_order_relaxed);
        continue;
      case FREE:
        LOG(FATAL) << "Invalid prev state for fd " << fd << ": "
                   << int(prevState);
    }
  } while (
      !sref.compare_exchange_weak(prevState, FREE, std::memory_order_relaxed));
}

int ShutdownSocketSet::close(int fd) {
  DCHECK_GE(fd, 0);
  if (fd >= maxFd_) {
    return folly::closeNoInt(fd);
  }

  auto& sref = data_[size_t(fd)];
  uint8_t prevState = sref.load(std::memory_order_relaxed);
  uint8_t newState = 0;

  do {
    switch (prevState) {
      case IN_USE:
      case SHUT_DOWN:
        newState = FREE;
        break;
      case IN_SHUTDOWN:
        newState = MUST_CLOSE;
        break;
      default:
        LOG(FATAL) << "Invalid prev state for fd " << fd << ": "
                   << int(prevState);
    }
  } while (!sref.compare_exchange_weak(
      prevState, newState, std::memory_order_relaxed));

  return newState == FREE ? folly::closeNoInt(fd) : 0;
}

void ShutdownSocketSet::shutdown(int fd, bool abortive) {
  DCHECK_GE(fd, 0);
  if (fd >= maxFd_) {
    doShutdown(fd, abortive);
    return;
  }

  auto& sref = data_[size_t(fd)];
  uint8_t prevState = IN_USE;
  if (!sref.compare_exchange_strong(
          prevState, IN_SHUTDOWN, std::memory_order_relaxed)) {
    return;
  }

  doShutdown(fd, abortive);

  prevState = IN_SHUTDOWN;
  if (sref.compare_exchange_strong(
          prevState, SHUT_DOWN, std::memory_order_relaxed)) {
    return;
  }

  CHECK_EQ(prevState, MUST_CLOSE)
      << "Invalid prev state for fd " << fd << ": " << int(prevState);

  folly::closeNoInt(fd); // ignore errors, nothing to do

  CHECK(
      sref.compare_exchange_strong(prevState, FREE, std::memory_order_relaxed))
      << "Invalid prev state for fd " << fd << ": " << int(prevState);
}

void ShutdownSocketSet::shutdownAll(bool abortive) {
  for (int i = 0; i < maxFd_; ++i) {
    auto& sref = data_[size_t(i)];
    if (sref.load(std::memory_order_relaxed) == IN_USE) {
      shutdown(i, abortive);
    }
  }
}

void ShutdownSocketSet::doShutdown(int fd, bool abortive) {
  // shutdown() the socket first, to awaken any threads blocked on the fd
  // (subsequent IO will fail because it's been shutdown); close()ing the
  // socket does not wake up blockers, see
  // http://stackoverflow.com/a/3624545/1736339
  folly::shutdownNoInt(fd, SHUT_RDWR);

  // If abortive shutdown is desired, we'll set the SO_LINGER option on
  // the socket with a timeout of 0; this will cause RST to be sent on
  // close.
  if (abortive) {
    struct linger l = {1, 0};
    if (setsockopt(fd, SOL_SOCKET, SO_LINGER, &l, sizeof(l)) != 0) {
      // Probably not a socket, ignore.
      return;
    }
  }

  // We can't close() the socket, as that would be dangerous; a new file
  // could be opened and get the same file descriptor, and then code assuming
  // the old fd would do IO in the wrong place. We'll (atomically) dup2
  // /dev/null onto the fd instead.
  folly::dup2NoInt(nullFile_.fd(), fd);
}

} // namespace folly
