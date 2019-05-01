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

#include <folly/portability/SysUio.h>

#include <errno.h>
#include <stdio.h>

#include <folly/ScopeGuard.h>
#include <folly/portability/Sockets.h>
#include <folly/portability/SysFile.h>
#include <folly/portability/Unistd.h>

template <class F, class... Args>
static int wrapPositional(F f, int fd, off_t offset, Args... args) {
  off_t origLoc = lseek(fd, 0, SEEK_CUR);
  if (origLoc == off_t(-1)) {
    return -1;
  }
  if (lseek(fd, offset, SEEK_SET) == off_t(-1)) {
    return -1;
  }

  int res = (int)f(fd, args...);

  int curErrNo = errno;
  if (lseek(fd, origLoc, SEEK_SET) == off_t(-1)) {
    if (res == -1) {
      errno = curErrNo;
    }
    return -1;
  }
  errno = curErrNo;

  return res;
}

#if !FOLLY_HAVE_PREADV
extern "C" ssize_t preadv(int fd, const iovec* iov, int count, off_t offset) {
  return wrapPositional(readv, fd, offset, iov, count);
}
#endif

#if !FOLLY_HAVE_PWRITEV
extern "C" ssize_t pwritev(int fd, const iovec* iov, int count, off_t offset) {
  return wrapPositional(writev, fd, offset, iov, count);
}
#endif

#ifdef _WIN32
template <bool isRead>
static ssize_t doVecOperation(int fd, const iovec* iov, int count) {
  if (!count) {
    return 0;
  }
  if (count < 0 || count > folly::kIovMax) {
    errno = EINVAL;
    return -1;
  }

  // We only need to worry about locking if the file descriptor is
  // not a socket. We have no way of locking sockets :(
  // The correct way to do this for sockets is via sendmsg/recvmsg,
  // but this is good enough for now.
  bool shouldLock = !folly::portability::sockets::is_fh_socket(fd);
  if (shouldLock && lockf(fd, F_LOCK, 0) == -1) {
    return -1;
  }
  SCOPE_EXIT {
    if (shouldLock) {
      lockf(fd, F_ULOCK, 0);
    }
  };

  ssize_t bytesProcessed = 0;
  int curIov = 0;
  void* curBase = iov[0].iov_base;
  size_t curLen = iov[0].iov_len;
  while (curIov < count) {
    ssize_t res = 0;
    if (isRead) {
      res = read(fd, curBase, (unsigned int)curLen);
      if (res == 0 && curLen != 0) {
        break; // End of File
      }
    } else {
      res = write(fd, curBase, (unsigned int)curLen);
      // Write of zero bytes is fine.
    }

    if (res == -1) {
      return -1;
    }

    if (size_t(res) == curLen) {
      curIov++;
      if (curIov < count) {
        curBase = iov[curIov].iov_base;
        curLen = iov[curIov].iov_len;
      }
    } else {
      curBase = (void*)((char*)curBase + res);
      curLen -= res;
    }

    if (bytesProcessed + res < 0) {
      // Overflow
      errno = EINVAL;
      return -1;
    }
    bytesProcessed += res;
  }

  return bytesProcessed;
}

extern "C" ssize_t readv(int fd, const iovec* iov, int count) {
  return doVecOperation<true>(fd, iov, count);
}

extern "C" ssize_t writev(int fd, const iovec* iov, int count) {
  return doVecOperation<false>(fd, iov, count);
}
#endif
