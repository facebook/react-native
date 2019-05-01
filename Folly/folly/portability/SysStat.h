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

#include <sys/stat.h>

#ifdef _WIN32
#include <folly/portability/SysTypes.h>

// Windows gives weird names to these.
#define S_IXUSR 0
#define S_IWUSR _S_IWRITE
#define S_IRUSR _S_IREAD
// No group/other permissions so default to user.
#define S_IXGRP S_IXUSR
#define S_IWGRP S_IWUSR
#define S_IRGRP S_IRUSR
#define S_IXOTH S_IXUSR
#define S_IWOTH S_IWUSR
#define S_IROTH S_IRUSR
#define S_IRWXU (S_IRUSR | S_IWUSR | S_IXUSR)
#define S_IRWXG (S_IRGRP | S_IWGRP | S_IXGRP)

#define S_ISDIR(mode) (((mode) & (_S_IFDIR)) == (_S_IFDIR) ? 1 : 0)

// This isn't defined anywhere, so give a sane value.
#define MAXSYMLINKS 255

extern "C" {
int chmod(char const* fn, int am);
int fchmod(int fd, mode_t mode);
int lstat(const char* path, struct stat* st);
int mkdir(const char* fn, int mode);
int umask(int md);
}
#endif
