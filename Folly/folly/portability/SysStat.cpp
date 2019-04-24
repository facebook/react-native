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

#include <folly/portability/SysStat.h>

#ifdef _WIN32
#include <folly/portability/Windows.h>

extern "C" {
int chmod(char const* fn, int am) {
  return _chmod(fn, am);
}

int fchmod(int fd, mode_t mode) {
  HANDLE h = (HANDLE)_get_osfhandle(fd);
  if (h == INVALID_HANDLE_VALUE) {
    return -1;
  }

  FILE_ATTRIBUTE_TAG_INFO attr{};
  if (!GetFileInformationByHandleEx(
          h, FileAttributeTagInfo, &attr, sizeof(attr))) {
    return -1;
  }

  if (mode & _S_IWRITE) {
    attr.FileAttributes &= ~FILE_ATTRIBUTE_READONLY;
  } else {
    attr.FileAttributes |= FILE_ATTRIBUTE_READONLY;
  }

  if (!SetFileInformationByHandle(
          h, FileAttributeTagInfo, &attr, sizeof(attr))) {
    return -1;
  }

  return 0;
}

// Just return the result of a normal stat for now
int lstat(const char* path, struct stat* st) {
  return stat(path, st);
}

int mkdir(const char* fn, int /* mode */) {
  return _mkdir(fn);
}

int umask(int md) {
  return _umask(md);
}
}
#endif
