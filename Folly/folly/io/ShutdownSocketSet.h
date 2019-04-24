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

#include <atomic>
#include <cstdlib>
#include <memory>

#include <boost/noncopyable.hpp>

#include <folly/File.h>

namespace folly {

/**
 * Set of sockets that allows immediate, take-no-prisoners abort.
 */
class ShutdownSocketSet : private boost::noncopyable {
 public:
  /**
   * Create a socket set that can handle file descriptors < maxFd.
   * The default value (256Ki) is high enough for just about all
   * applications, even if you increased the number of file descriptors
   * on your system.
   */
  explicit ShutdownSocketSet(int maxFd = 1 << 18);

  /**
   * Add an already open socket to the list of sockets managed by
   * ShutdownSocketSet. You MUST close the socket by calling
   * ShutdownSocketSet::close (which will, as a side effect, also handle EINTR
   * properly) and not by calling close() on the file descriptor.
   */
  void add(int fd);

  /**
   * Remove a socket from the list of sockets managed by ShutdownSocketSet.
   * Note that remove() might block! (which we lamely implement by
   * sleep()-ing) in the extremely rare case that the fd is currently
   * being shutdown().
   */
  void remove(int fd);

  /**
   * Close a socket managed by ShutdownSocketSet. Returns the same return code
   * as ::close() (and sets errno accordingly).
   */
  int close(int fd);

  /**
   * Shut down a socket. If abortive is true, we perform an abortive
   * shutdown (send RST rather than FIN). Note that we might still end up
   * sending FIN due to the rather interesting implementation.
   *
   * This is async-signal-safe and ignores errors.  Obviously, subsequent
   * read() and write() operations to the socket will fail. During normal
   * operation, just call ::shutdown() on the socket.
   */
  void shutdown(int fd, bool abortive = false);

  /**
   * Immediate shutdown of all connections. This is a hard-hitting hammer;
   * all reads and writes will return errors and no new connections will
   * be accepted.
   *
   * To be used only in dire situations. We're using it from the failure
   * signal handler to close all connections quickly, even though the server
   * might take multiple seconds to finish crashing.
   *
   * The optional bool parameter indicates whether to set the active
   * connections in to not linger.  The effect of that includes RST packets
   * being immediately sent to clients which will result
   * in errors (and not normal EOF) on the client side.  This also causes
   * the local (ip, tcp port number) tuple to be reusable immediately, instead
   * of having to wait the standard amount of time.  For full details see
   * the `shutdown` method of `ShutdownSocketSet` (incl. notes about the
   * `abortive` parameter).
   *
   * This is async-signal-safe and ignores errors.
   */
  void shutdownAll(bool abortive = false);

 private:
  void doShutdown(int fd, bool abortive);

  // State transitions:
  // add():
  //   FREE -> IN_USE
  //
  // close():
  //   IN_USE -> (::close()) -> FREE
  //   SHUT_DOWN -> (::close()) -> FREE
  //   IN_SHUTDOWN -> MUST_CLOSE
  //   (If the socket is currently being shut down, we must defer the
  //    ::close() until the shutdown completes)
  //
  // shutdown():
  //   IN_USE -> IN_SHUTDOWN
  //   (::shutdown())
  //   IN_SHUTDOWN -> SHUT_DOWN
  //   MUST_CLOSE -> (::close()) -> FREE
  //
  // State atomic operation memory orders:
  // All atomic operations on per-socket states use std::memory_order_relaxed
  // because there is no associated per-socket data guarded by the state and
  // the states for different sockets are unrelated. If there were associated
  // per-socket data, acquire and release orders would be desired; and if the
  // states for different sockets were related, it could be that sequential
  // consistent orders would be desired.
  enum State : uint8_t {
    FREE = 0,
    IN_USE,
    IN_SHUTDOWN,
    SHUT_DOWN,
    MUST_CLOSE,
  };

  struct Free {
    template <class T>
    void operator()(T* ptr) const {
      ::free(ptr);
    }
  };

  const int maxFd_;
  std::unique_ptr<std::atomic<uint8_t>[], Free> data_;
  folly::File nullFile_;
};

} // namespace folly
