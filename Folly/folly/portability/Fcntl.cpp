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

#include <folly/portability/Fcntl.h>

#ifdef _WIN32
#include <folly/portability/Sockets.h>
#include <folly/portability/SysStat.h>
#include <folly/portability/Windows.h>

namespace folly {
namespace portability {
namespace fcntl {
int creat(char const* fn, int pm) {
  return _creat(fn, pm);
}

int fcntl(int fd, int cmd, ...) {
  va_list args;
  int res = -1;
  va_start(args, cmd);
  switch (cmd) {
    case F_GETFD: {
      HANDLE h = (HANDLE)_get_osfhandle(fd);
      if (h != INVALID_HANDLE_VALUE) {
        DWORD flags;
        if (GetHandleInformation(h, &flags)) {
          res = int(flags & HANDLE_FLAG_INHERIT);
        }
      }
      break;
    }
    case F_SETFD: {
      int flags = va_arg(args, int);
      HANDLE h = (HANDLE)_get_osfhandle(fd);
      if (h != INVALID_HANDLE_VALUE) {
        if (SetHandleInformation(
                h, HANDLE_FLAG_INHERIT, (DWORD)(flags & FD_CLOEXEC))) {
          res = 0;
        }
      }
      break;
    }
    case F_GETFL: {
      // No idea how to get the IO blocking mode, so return 0.
      res = 0;
      break;
    }
    case F_SETFL: {
      int flags = va_arg(args, int);
      // If it's not a socket, it's probably a pipe.
      if (folly::portability::sockets::is_fh_socket(fd)) {
        SOCKET s = (SOCKET)_get_osfhandle(fd);
        if (s != INVALID_SOCKET) {
          u_long nonBlockingEnabled = (flags & O_NONBLOCK) ? 1 : 0;
          res = ioctlsocket(s, FIONBIO, &nonBlockingEnabled);
        }
      } else {
        HANDLE p = (HANDLE)_get_osfhandle(fd);
        if (GetFileType(p) == FILE_TYPE_PIPE) {
          DWORD newMode = PIPE_READMODE_BYTE;
          newMode |= (flags & O_NONBLOCK) ? PIPE_NOWAIT : PIPE_WAIT;
          if (SetNamedPipeHandleState(p, &newMode, nullptr, nullptr)) {
            res = 0;
          }
        }
      }
      break;
    }
  }
  va_end(args);
  return res;
}

int open(char const* fn, int of, int pm) {
  int fh;
  int realMode = _S_IREAD;
  if ((of & _O_RDWR) == _O_RDWR) {
    realMode = _S_IREAD | _S_IWRITE;
  } else if ((of & _O_WRONLY) == _O_WRONLY) {
    realMode = _S_IWRITE;
  } else if ((of & _O_RDONLY) != _O_RDONLY) {
    // One of these needs to be present, just fail if
    // none are.
    return -1;
  }
  if (!strcmp(fn, "/dev/null")) {
    // Windows doesn't have a /dev/null, but it does have
    // NUL, which achieves the same result.
    fn = "NUL";
  }
  errno_t res = _sopen_s(&fh, fn, of, _SH_DENYNO, realMode);
  return res ? -1 : fh;
}

int posix_fallocate(int fd, off_t offset, off_t len) {
  // We'll pretend we always have enough space. We
  // can't exactly pre-allocate on windows anyways.
  return 0;
}
} // namespace fcntl
} // namespace portability
} // namespace folly
#endif
