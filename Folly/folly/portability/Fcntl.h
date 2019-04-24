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

#include <fcntl.h>

#ifdef _WIN32
#include <sys/types.h>

#include <folly/portability/Windows.h>

// I have no idea what the normal values for these are,
// and really don't care what they are. They're only used
// within fcntl, so it's not an issue.
#define FD_CLOEXEC HANDLE_FLAG_INHERIT
#define O_NONBLOCK 1
#define O_CLOEXEC _O_NOINHERIT
#define F_GETFD 1
#define F_SETFD 2
#define F_GETFL 3
#define F_SETFL 4

#ifdef HAVE_POSIX_FALLOCATE
#undef HAVE_POSIX_FALLOCATE
#endif
#define HAVE_POSIX_FALLOCATE 1

// See portability/Unistd.h for why these need to be in a namespace
// rather then extern "C".
namespace folly {
namespace portability {
namespace fcntl {
int creat(char const* fn, int pm);
int fcntl(int fd, int cmd, ...);
int posix_fallocate(int fd, off_t offset, off_t len);
int open(char const* fn, int of, int pm = 0);
} // namespace fcntl
} // namespace portability
} // namespace folly

/* using override */ using namespace folly::portability::fcntl;
#endif
