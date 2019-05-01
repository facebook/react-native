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

#include <folly/portability/Libgen.h>

#include <string.h>

namespace folly {
namespace portability {
static char mutableDot[] = {'.', '\0'};
char* internal_dirname(char* path) {
  if (path == nullptr || !strcmp(path, "")) {
    return mutableDot;
  }
  if (!strcmp(path, "/") || !strcmp(path, "\\")) {
    return path;
  }

  size_t len = strlen(path);
  if (path[len - 1] == '/' || path[len - 1] == '\\') {
    path[len - 1] = '\0';
  }

  char* pos = strrchr(path, '/');
  if (strrchr(path, '\\') > pos) {
    pos = strrchr(path, '\\');
  }
  if (pos == nullptr) {
    return mutableDot;
  }

  if (pos == path) {
    *(pos + 1) = '\0';
  } else {
    *pos = '\0';
  }
  return path;
}
} // namespace portability
} // namespace folly

#ifdef _WIN32
extern "C" char* dirname(char* path) {
  return folly::portability::internal_dirname(path);
}
#endif
