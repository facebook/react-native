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

#include <stdlib.h>
#include <string.h>

#include <folly/portability/Config.h>

#if !defined(_WIN32)
#include <strings.h>
#endif

#if !FOLLY_HAVE_MEMRCHR
extern "C" void* memrchr(const void* s, int c, size_t n);
#endif

#if defined(_WIN32) || defined(__FreeBSD__)
extern "C" char* strndup(const char* a, size_t len);
#endif

#ifdef _WIN32
extern "C" {
void bzero(void* s, size_t n);
int strcasecmp(const char* a, const char* b);
int strncasecmp(const char* a, const char* b, size_t c);
char* strtok_r(char* str, char const* delim, char** ctx);
}
#endif
