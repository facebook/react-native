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

#include <sys/mman.h>

// MAP_ANONYMOUS is named MAP_ANON on OSX/BSD.
#if defined(__APPLE__) || defined(__FreeBSD__)
#if !defined(MAP_ANONYMOUS) && defined(MAP_ANON)
#define MAP_ANONYMOUS MAP_ANON
#endif
#endif

#else

#include <cstdint>

#include <sys/types.h>

#define MAP_ANONYMOUS 1
#define MAP_ANON MAP_ANONYMOUS
#define MAP_SHARED 2
#define MAP_PRIVATE 4
#define MAP_POPULATE 8
#define MAP_NORESERVE 16
#define MAP_FIXED 32

#define MAP_FAILED ((void*)-1)

#define PROT_NONE 0
#define PROT_READ 1
#define PROT_WRITE 2
#define PROT_EXEC 4

#define MADV_NORMAL 0
#define MADV_DONTNEED 0
#define MADV_SEQUENTIAL 0

extern "C" {
int madvise(const void* addr, size_t len, int advise);
int mlock(const void* addr, size_t len);
void* mmap(void* addr, size_t length, int prot, int flags, int fd, off_t off);
int mprotect(void* addr, size_t size, int prot);
int munlock(const void* addr, size_t length);
int munmap(void* addr, size_t length);
}

#endif
