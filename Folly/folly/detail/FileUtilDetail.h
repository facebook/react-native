/*
 * Copyright 2013-present Facebook, Inc.
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

#include <algorithm>
#include <cerrno>

#include <folly/portability/SysUio.h>
#include <folly/portability/Unistd.h>

/**
 * Helper functions and templates for FileUtil.cpp.  Declared here so
 * they can be unittested.
 */
namespace folly {
namespace fileutil_detail {

// Wrap call to f(args) in loop to retry on EINTR
template <class F, class... Args>
ssize_t wrapNoInt(F f, Args... args) {
  ssize_t r;
  do {
    r = f(args...);
  } while (r == -1 && errno == EINTR);
  return r;
}

inline void incr(ssize_t /* n */) {}
inline void incr(ssize_t n, off_t& offset) {
  offset += off_t(n);
}

// Wrap call to read/pread/write/pwrite(fd, buf, count, offset?) to retry on
// incomplete reads / writes.  The variadic argument magic is there to support
// an additional argument (offset) for pread / pwrite; see the incr() functions
// above which do nothing if the offset is not present and increment it if it
// is.
template <class F, class... Offset>
ssize_t wrapFull(F f, int fd, void* buf, size_t count, Offset... offset) {
  char* b = static_cast<char*>(buf);
  ssize_t totalBytes = 0;
  ssize_t r;
  do {
    r = f(fd, b, count, offset...);
    if (r == -1) {
      if (errno == EINTR) {
        continue;
      }
      return r;
    }

    totalBytes += r;
    b += r;
    count -= r;
    incr(r, offset...);
  } while (r != 0 && count); // 0 means EOF

  return totalBytes;
}

// Wrap call to readv/preadv/writev/pwritev(fd, iov, count, offset?) to
// retry on incomplete reads / writes.
template <class F, class... Offset>
ssize_t wrapvFull(F f, int fd, iovec* iov, int count, Offset... offset) {
  ssize_t totalBytes = 0;
  ssize_t r;
  do {
    r = f(fd, iov, std::min<int>(count, kIovMax), offset...);
    if (r == -1) {
      if (errno == EINTR) {
        continue;
      }
      return r;
    }

    if (r == 0) {
      break; // EOF
    }

    totalBytes += r;
    incr(r, offset...);
    while (r != 0 && count != 0) {
      if (r >= ssize_t(iov->iov_len)) {
        r -= ssize_t(iov->iov_len);
        ++iov;
        --count;
      } else {
        iov->iov_base = static_cast<char*>(iov->iov_base) + r;
        iov->iov_len -= r;
        r = 0;
      }
    }
  } while (count);

  return totalBytes;
}

} // namespace fileutil_detail
} // namespace folly
