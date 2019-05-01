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

#include <folly/portability/Stdio.h>

#ifdef _WIN32

#include <cstdlib>

#include <folly/ScopeGuard.h>
#include <folly/portability/Unistd.h>

extern "C" {
int dprintf(int fd, const char* fmt, ...) {
  va_list args;
  va_start(args, fmt);
  SCOPE_EXIT {
    va_end(args);
  };

  int ret = vsnprintf(nullptr, 0, fmt, args);
  if (ret <= 0) {
    return -1;
  }
  size_t len = size_t(ret);
  char* buf = new char[len + 1];
  SCOPE_EXIT {
    delete[] buf;
  };
  if (size_t(vsnprintf(buf, len + 1, fmt, args)) == len &&
      write(fd, buf, len) == ssize_t(len)) {
    return ret;
  }

  return -1;
}

int pclose(FILE* f) {
  return _pclose(f);
}

FILE* popen(const char* name, const char* mode) {
  return _popen(name, mode);
}

void setbuffer(FILE* f, char* buf, size_t size) {
  setvbuf(f, buf, _IOFBF, size);
}

int vasprintf(char** dest, const char* format, va_list ap) {
  int len = vsnprintf(nullptr, 0, format, ap);
  if (len <= 0) {
    return -1;
  }
  char* buf = *dest = (char*)malloc(size_t(len + 1));
  if (vsnprintf(buf, size_t(len + 1), format, ap) == len) {
    return len;
  }
  free(buf);
  return -1;
}
}

#endif
