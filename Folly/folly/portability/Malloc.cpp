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

#include <folly/portability/Malloc.h>

#if !defined(USE_JEMALLOC) && !defined(FOLLY_USE_JEMALLOC)
#if defined(__APPLE__) && !defined(FOLLY_HAVE_MALLOC_USABLE_SIZE)
#include <malloc/malloc.h> // @manual

extern "C" size_t malloc_usable_size(void* ptr) {
  return malloc_size(ptr);
}
#elif defined(_WIN32)
extern "C" size_t malloc_usable_size(void* addr) {
  return _msize(addr);
}
#endif
#endif
