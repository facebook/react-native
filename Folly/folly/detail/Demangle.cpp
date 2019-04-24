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

#include <folly/detail/Demangle.h>

// Do not include <libiberty.h> (binutils) and <string.h> (glibc) in the same
// translation unit since they contain conflicting declarations for the symbol
// `basename`.
//
// So we extract the inclusion of `<demangle.h>` which includes `<libiberty.h>`
// to here, isolating it.
#if FOLLY_DETAIL_HAVE_DEMANGLE_H
#include <demangle.h>
#endif

namespace folly {
namespace detail {

int cplus_demangle_v3_callback_wrapper(
    char const* const mangled,
    void (*const cbref)(char const*, std::size_t, void*),
    void* const opaque) {
#if FOLLY_DETAIL_HAVE_DEMANGLE_H
  auto const options = DMGL_PARAMS | DMGL_ANSI | DMGL_TYPES;
  return cplus_demangle_v3_callback(mangled, options, cbref, opaque);
#else
  return 0;
#endif
}

} // namespace detail
} // namespace folly
