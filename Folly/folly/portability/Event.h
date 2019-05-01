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

#pragma once

#ifdef _MSC_VER
// This needs to be before the libevent include.
#include <folly/portability/Windows.h>
#endif

#include <event.h>

#ifdef _MSC_VER
#include <event2/event_compat.h> // @manual
#include <folly/portability/Fcntl.h>
#endif

namespace folly {
#ifdef _MSC_VER
using libevent_fd_t = evutil_socket_t;
#else
using libevent_fd_t = int;
#endif

inline libevent_fd_t getLibeventFd(int fd) {
#ifdef _MSC_VER
  if (fd == -1) {
    return (libevent_fd_t)INVALID_HANDLE_VALUE;
  }
  return _get_osfhandle(fd);
#else
  return fd;
#endif
}

inline int libeventFdToFd(libevent_fd_t fd) {
#ifdef _MSC_VER
  if (fd == (libevent_fd_t)INVALID_HANDLE_VALUE) {
    return -1;
  }
  return _open_osfhandle((intptr_t)fd, O_RDWR | O_BINARY);
#else
  return fd;
#endif
}

using EventSetCallback = void (*)(libevent_fd_t, short, void*);
inline void
folly_event_set(event* e, int fd, short s, EventSetCallback f, void* arg) {
  auto lfd = getLibeventFd(fd);
  event_set(e, lfd, s, f, arg);
}
} // namespace folly
