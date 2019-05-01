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

#include <unistd.h>

#else

#include <cstdint>

#include <sys/locking.h> // @manual

#include <folly/portability/SysTypes.h>

// This is different from the normal headers because there are a few cases,
// such as close(), where we need to override the definition of an existing
// function. To avoid conflicts at link time, everything here is in a namespace
// which is then used globally.

#define _SC_PAGESIZE 1
#define _SC_PAGE_SIZE _SC_PAGESIZE
#define _SC_NPROCESSORS_ONLN 2
#define _SC_NPROCESSORS_CONF 2

// Windows doesn't define these, but these are the correct values
// for Windows.
#define STDIN_FILENO 0
#define STDOUT_FILENO 1
#define STDERR_FILENO 2

// Windows is weird and doesn't actually defined these
// for the parameters to access, so we have to do it ourselves -_-...
#define F_OK 0
#define X_OK F_OK
#define W_OK 2
#define R_OK 4
#define RW_OK 6

#define F_LOCK _LK_LOCK
#define F_ULOCK _LK_UNLCK

namespace folly {
namespace portability {
namespace unistd {
int access(char const* fn, int am);
int chdir(const char* path);
int close(int fh);
int dup(int fh);
int dup2(int fhs, int fhd);
int fsync(int fd);
int ftruncate(int fd, off_t len);
char* getcwd(char* buf, int sz);
int getdtablesize();
int getgid();
pid_t getpid();
pid_t getppid();
int getuid();
int isatty(int fh);
int lockf(int fd, int cmd, off_t len);
off_t lseek(int fh, off_t off, int orig);
ssize_t read(int fh, void* buf, size_t mcc);
int rmdir(const char* path);
int pipe(int pth[2]);
ssize_t pread(int fd, void* buf, size_t count, off_t offset);
ssize_t pwrite(int fd, const void* buf, size_t count, off_t offset);
ssize_t readlink(const char* path, char* buf, size_t buflen);
void* sbrk(intptr_t i);
unsigned int sleep(unsigned int seconds);
long sysconf(int tp);
int truncate(const char* path, off_t len);
int usleep(unsigned int ms);
ssize_t write(int fh, void const* buf, size_t count);
} // namespace unistd
} // namespace portability
} // namespace folly

/* using override */ using namespace folly::portability::unistd;

#endif
