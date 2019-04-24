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

#include <folly/CPortability.h>
#include <folly/portability/Config.h>

#if (defined(USE_JEMALLOC) || defined(FOLLY_USE_JEMALLOC)) && !FOLLY_SANITIZE
// JEMalloc provides it's own implementation of
// malloc_usable_size, and that's what we should be using.
#include <jemalloc/jemalloc.h>
#else
#ifndef __APPLE__
#include <malloc.h>
#endif

#if defined(__APPLE__) && !defined(FOLLY_HAVE_MALLOC_USABLE_SIZE)
// MacOS doesn't have malloc_usable_size()
extern "C" size_t malloc_usable_size(void* ptr);
#elif defined(_WIN32)
extern "C" size_t malloc_usable_size(void* ptr);
#endif
#endif
