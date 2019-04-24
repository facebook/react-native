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

#ifndef _WIN32
#include <dirent.h>
#else

#define DT_UNKNOWN 0
#define DT_DIR 1
#define DT_REG 2
#define DT_LNK 3
struct dirent {
  unsigned char d_type;
  char* d_name;
};

struct DIR;

extern "C" {
int closedir(DIR* dir);
DIR* opendir(const char* name);
dirent* readdir(DIR* dir);
int readdir_r(DIR* dir, dirent* buf, dirent** ent);
void rewinddir(DIR* dir);
}
#endif
