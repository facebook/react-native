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

// We need to prevent winnt.h from defining the core STATUS codes,
// otherwise they will conflict with what we're getting from ntstatus.h
#define UMDF_USING_NTSTATUS

#include <folly/portability/Unistd.h>

#ifdef _WIN32

#include <cstdio>

#include <fcntl.h>

#include <folly/portability/Sockets.h>
#include <folly/portability/Windows.h>

// Including ntdef.h requires building as a driver, but all we want
// is a status code, but we need NTSTATUS defined for that. Luckily
// bcrypt.h also defines NTSTATUS, so we'll use that one instead.
#include <bcrypt.h> // @manual
#include <ntstatus.h> // @manual

// Generic wrapper for the p* family of functions.
template <class F, class... Args>
static int wrapPositional(F f, int fd, off_t offset, Args... args) {
  off_t origLoc = lseek(fd, 0, SEEK_CUR);
  if (origLoc == (off_t)-1) {
    return -1;
  }
  if (lseek(fd, offset, SEEK_SET) == (off_t)-1) {
    return -1;
  }

  int res = (int)f(fd, args...);

  int curErrNo = errno;
  if (lseek(fd, origLoc, SEEK_SET) == (off_t)-1) {
    if (res == -1) {
      errno = curErrNo;
    }
    return -1;
  }
  errno = curErrNo;

  return res;
}

namespace folly {
namespace portability {
namespace unistd {
int access(char const* fn, int am) {
  return _access(fn, am);
}

int chdir(const char* path) {
  return _chdir(path);
}

int close(int fh) {
  if (folly::portability::sockets::is_fh_socket(fh)) {
    SOCKET h = (SOCKET)_get_osfhandle(fh);

    // If we were to just call _close on the descriptor, it would
    // close the HANDLE, but it wouldn't free any of the resources
    // associated to the SOCKET, and we can't call _close after
    // calling closesocket, because closesocket has already closed
    // the HANDLE, and _close would attempt to close the HANDLE
    // again, resulting in a double free.
    // We can however protect the HANDLE from actually being closed
    // long enough to close the file descriptor, then close the
    // socket itself.
    constexpr DWORD protectFlag = HANDLE_FLAG_PROTECT_FROM_CLOSE;
    DWORD handleFlags = 0;
    if (!GetHandleInformation((HANDLE)h, &handleFlags)) {
      return -1;
    }
    if (!SetHandleInformation((HANDLE)h, protectFlag, protectFlag)) {
      return -1;
    }
    int c = 0;
    __try {
      // We expect this to fail. It still closes the file descriptor though.
      c = _close(fh);
      // We just have to catch the SEH exception that gets thrown when we do
      // this with a debugger attached -_-....
    } __except (
        GetExceptionCode() == STATUS_HANDLE_NOT_CLOSABLE
            ? EXCEPTION_CONTINUE_EXECUTION
            : EXCEPTION_CONTINUE_SEARCH) {
      // We told it to continue execution, so there's nothing here would
      // be run anyways.
    }
    // We're at the core, we don't get the luxery of SCOPE_EXIT because
    // of circular dependencies.
    if (!SetHandleInformation((HANDLE)h, protectFlag, handleFlags)) {
      return -1;
    }
    if (c != -1) {
      return -1;
    }
    return closesocket(h);
  }
  return _close(fh);
}

int dup(int fh) {
  return _dup(fh);
}

int dup2(int fhs, int fhd) {
  return _dup2(fhs, fhd);
}

int fsync(int fd) {
  HANDLE h = (HANDLE)_get_osfhandle(fd);
  if (h == INVALID_HANDLE_VALUE) {
    return -1;
  }
  if (!FlushFileBuffers(h)) {
    return -1;
  }
  return 0;
}

int ftruncate(int fd, off_t len) {
  if (_lseek(fd, len, SEEK_SET) == -1) {
    return -1;
  }

  HANDLE h = (HANDLE)_get_osfhandle(fd);
  if (h == INVALID_HANDLE_VALUE) {
    return -1;
  }
  if (!SetEndOfFile(h)) {
    return -1;
  }
  return 0;
}

char* getcwd(char* buf, int sz) {
  return _getcwd(buf, sz);
}

int getdtablesize() {
  return _getmaxstdio();
}

int getgid() {
  return 1;
}

pid_t getpid() {
  return (pid_t)uint64_t(GetCurrentProcessId());
}

// No major need to implement this, and getting a non-potentially
// stale ID on windows is a bit involved.
pid_t getppid() {
  return (pid_t)1;
}

int getuid() {
  return 1;
}

int isatty(int fh) {
  return _isatty(fh);
}

int lockf(int fd, int cmd, off_t len) {
  return _locking(fd, cmd, len);
}

off_t lseek(int fh, off_t off, int orig) {
  return _lseek(fh, off, orig);
}

int rmdir(const char* path) {
  return _rmdir(path);
}

int pipe(int pth[2]) {
  // We need to be able to listen to pipes with
  // libevent, so they need to be actual sockets.
  return socketpair(PF_UNIX, SOCK_STREAM, 0, pth);
}

ssize_t pread(int fd, void* buf, size_t count, off_t offset) {
  return wrapPositional(_read, fd, offset, buf, (unsigned int)count);
}

ssize_t pwrite(int fd, const void* buf, size_t count, off_t offset) {
  return wrapPositional(_write, fd, offset, buf, (unsigned int)count);
}

ssize_t read(int fh, void* buf, size_t count) {
  if (folly::portability::sockets::is_fh_socket(fh)) {
    SOCKET s = (SOCKET)_get_osfhandle(fh);
    if (s != INVALID_SOCKET) {
      auto r = folly::portability::sockets::recv(fh, buf, count, 0);
      if (r == -1 && WSAGetLastError() == WSAEWOULDBLOCK) {
        errno = EAGAIN;
      }
      return r;
    }
  }
  auto r = _read(fh, buf, static_cast<unsigned int>(count));
  if (r == -1 && GetLastError() == ERROR_NO_DATA) {
    // This only happens if the file was non-blocking and
    // no data was present. We have to translate the error
    // to a form that the rest of the world is expecting.
    errno = EAGAIN;
  }
  return r;
}

ssize_t readlink(const char* path, char* buf, size_t buflen) {
  if (!buflen) {
    return -1;
  }

  HANDLE h = CreateFileA(
      path,
      GENERIC_READ,
      FILE_SHARE_READ,
      nullptr,
      OPEN_EXISTING,
      FILE_FLAG_BACKUP_SEMANTICS,
      nullptr);
  if (h == INVALID_HANDLE_VALUE) {
    return -1;
  }

  DWORD ret =
      GetFinalPathNameByHandleA(h, buf, DWORD(buflen - 1), VOLUME_NAME_DOS);
  if (ret >= buflen || ret >= MAX_PATH || !ret) {
    CloseHandle(h);
    return -1;
  }

  CloseHandle(h);
  buf[ret] = '\0';
  return ret;
}

void* sbrk(intptr_t /* i */) {
  return (void*)-1;
}

unsigned int sleep(unsigned int seconds) {
  Sleep((DWORD)(seconds * 1000));
  return 0;
}

long sysconf(int tp) {
  switch (tp) {
    case _SC_PAGESIZE: {
      SYSTEM_INFO inf;
      GetSystemInfo(&inf);
      return (long)inf.dwPageSize;
    }
    case _SC_NPROCESSORS_ONLN: {
      SYSTEM_INFO inf;
      GetSystemInfo(&inf);
      return (long)inf.dwNumberOfProcessors;
    }
    default:
      return -1L;
  }
}

int truncate(const char* path, off_t len) {
  int fd = _open(path, O_WRONLY);
  if (!fd) {
    return -1;
  }
  if (ftruncate(fd, len)) {
    _close(fd);
    return -1;
  }
  return _close(fd) ? -1 : 0;
}

int usleep(unsigned int ms) {
  Sleep((DWORD)(ms / 1000));
  return 0;
}

ssize_t write(int fh, void const* buf, size_t count) {
  if (folly::portability::sockets::is_fh_socket(fh)) {
    SOCKET s = (SOCKET)_get_osfhandle(fh);
    if (s != INVALID_SOCKET) {
      auto r = folly::portability::sockets::send(fh, buf, (size_t)count, 0);
      if (r == -1 && WSAGetLastError() == WSAEWOULDBLOCK) {
        errno = EAGAIN;
      }
      return r;
    }
  }
  auto r = _write(fh, buf, static_cast<unsigned int>(count));
  if ((r > 0 && size_t(r) != count) || (r == -1 && errno == ENOSPC)) {
    // Writing to a pipe with a full buffer doesn't generate
    // any error type, unless it caused us to write exactly 0
    // bytes, so we have to see if we have a pipe first. We
    // don't touch the errno for anything else.
    HANDLE h = (HANDLE)_get_osfhandle(fh);
    if (GetFileType(h) == FILE_TYPE_PIPE) {
      DWORD state = 0;
      if (GetNamedPipeHandleState(
              h, &state, nullptr, nullptr, nullptr, nullptr, 0)) {
        if ((state & PIPE_NOWAIT) == PIPE_NOWAIT) {
          errno = EAGAIN;
          return -1;
        }
      }
    }
  }
  return r;
}
} // namespace unistd
} // namespace portability
} // namespace folly

#endif
