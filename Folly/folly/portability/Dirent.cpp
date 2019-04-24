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

#include <folly/portability/Dirent.h>

#ifdef _WIN32
#include <stdlib.h>
#include <string>

#include <folly/portability/Windows.h>

struct DIR {
  dirent dir{};
  HANDLE searchHandle{INVALID_HANDLE_VALUE};
  int entriesRead{0};
  char currentName[MAX_PATH * 3];
  std::string pattern;

  int close() {
    return FindClose(searchHandle) ? 0 : -1;
  }

  DIR* open() {
    wchar_t patternBuf[MAX_PATH + 3];
    size_t len;

    if (pattern.empty()) {
      return nullptr;
    }

    if (mbstowcs_s(&len, patternBuf, MAX_PATH, pattern.c_str(), MAX_PATH - 2)) {
      return nullptr;
    }

    // `len` includes the trailing NUL
    if (len) {
      len--;
    }
    if (len && patternBuf[len - 1] != '/' && patternBuf[len - 1] != '\\') {
      patternBuf[len++] = '\\';
    }
    patternBuf[len++] = '*';
    patternBuf[len] = 0;

    WIN32_FIND_DATAW fdata;
    HANDLE h = FindFirstFileW(patternBuf, &fdata);
    if (h == INVALID_HANDLE_VALUE) {
      return nullptr;
    }

    searchHandle = h;
    dir.d_name = currentName;
    if (wcstombs(currentName, fdata.cFileName, MAX_PATH * 3) == (size_t)-1) {
      return nullptr;
    }

    setEntryType(fdata.dwFileAttributes);
    return this;
  }

  dirent* nextDir() {
    if (entriesRead) {
      WIN32_FIND_DATAW fdata;
      if (!FindNextFileW(searchHandle, &fdata)) {
        return nullptr;
      }

      if (wcstombs(currentName, fdata.cFileName, MAX_PATH * 3) == (size_t)-1) {
        errno = EBADF;
        return nullptr;
      }
      setEntryType(fdata.dwFileAttributes);
    }

    entriesRead++;
    return &dir;
  }

 private:
  void setEntryType(DWORD attr) {
    if (attr & FILE_ATTRIBUTE_DIRECTORY) {
      dir.d_type = DT_DIR;
    } else {
      dir.d_type = DT_REG;
    }
  }
};

extern "C" {
int closedir(DIR* dir) {
  auto ret = dir->close();
  delete dir;
  return ret;
}

DIR* opendir(const char* name) {
  auto dir = new DIR();
  dir->pattern = name;
  if (!dir->open()) {
    delete dir;
    return nullptr;
  }
  return dir;
}

dirent* readdir(DIR* dir) {
  return dir->nextDir();
}

int readdir_r(DIR* dir, dirent* buf, dirent** ent) {
  if (!dir || !buf || !ent) {
    return EBADF;
  }
  *ent = dir->nextDir();
  // Our normal readdir implementation is actually
  // already reentrant, but we need to do this copy
  // in case the caller expects buf to have the value.
  if (*ent) {
    *buf = dir->dir;
  }
  return 0;
}

void rewinddir(DIR* dir) {
  dir->close();
  dir->open();
}
}
#endif
