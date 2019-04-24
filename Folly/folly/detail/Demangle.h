/*
 * Copyright 2018-present Facebook, Inc.
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

#include <cstddef>

#if __has_include(<demangle.h>)
#define FOLLY_DETAIL_HAVE_DEMANGLE_H 1
#else
#define FOLLY_DETAIL_HAVE_DEMANGLE_H 0
#endif

namespace folly {
namespace detail {

extern int cplus_demangle_v3_callback_wrapper(
    char const* mangled,
    void (*cbref)(char const*, std::size_t, void*),
    void* opaque);

} // namespace detail
} // namespace folly
