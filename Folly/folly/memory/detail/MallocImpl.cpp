/*
 * Copyright 2014-present Facebook, Inc.
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

#include <folly/memory/detail/MallocImpl.h>

extern "C" {

#ifdef _MSC_VER
// MSVC doesn't have weak symbols, so do some linker magic
// to emulate them. (the magic is in the header)
const char* mallocxWeak = nullptr;
const char* rallocxWeak = nullptr;
const char* xallocxWeak = nullptr;
const char* sallocxWeak = nullptr;
const char* dallocxWeak = nullptr;
const char* sdallocxWeak = nullptr;
const char* nallocxWeak = nullptr;
const char* mallctlWeak = nullptr;
const char* mallctlnametomibWeak = nullptr;
const char* mallctlbymibWeak = nullptr;
#elif !FOLLY_HAVE_WEAK_SYMBOLS
void* (*mallocx)(size_t, int) = nullptr;
void* (*rallocx)(void*, size_t, int) = nullptr;
size_t (*xallocx)(void*, size_t, size_t, int) = nullptr;
size_t (*sallocx)(const void*, int) = nullptr;
void (*dallocx)(void*, int) = nullptr;
void (*sdallocx)(void*, size_t, int) = nullptr;
size_t (*nallocx)(size_t, int) = nullptr;
int (*mallctl)(const char*, void*, size_t*, void*, size_t) = nullptr;
int (*mallctlnametomib)(const char*, size_t*, size_t*) = nullptr;
int (*mallctlbymib)(const size_t*, size_t, void*, size_t*, void*, size_t) =
    nullptr;
#endif
}
