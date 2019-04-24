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

#include <folly/portability/SysFile.h>

#ifdef _WIN32
#include <limits>

#include <folly/portability/Windows.h>

extern "C" int flock(int fd, int operation) {
  HANDLE h = (HANDLE)_get_osfhandle(fd);
  if (h == INVALID_HANDLE_VALUE) {
    return -1;
  }

  constexpr DWORD kMaxDWORD = std::numeric_limits<DWORD>::max();
  if (operation & LOCK_UN) {
    if (!UnlockFile(h, 0, 0, kMaxDWORD, kMaxDWORD)) {
      return -1;
    }
  } else {
    DWORD flags = DWORD(
        (operation & LOCK_NB ? LOCKFILE_FAIL_IMMEDIATELY : 0) |
        (operation & LOCK_EX ? LOCKFILE_EXCLUSIVE_LOCK : 0));
    OVERLAPPED ov = {};
    if (!LockFileEx(h, flags, 0, kMaxDWORD, kMaxDWORD, &ov)) {
      return -1;
    }
  }
  return 0;
}
#endif
