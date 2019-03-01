/*
 * Copyright 2017 Facebook, Inc.
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

#include <folly/portability/BitsFunctexcept.h>

#include <stdexcept>

#if FOLLY_HAVE_BITS_FUNCTEXCEPT_H

// for symmetry with the header; this section intentionally left blank

#else

FOLLY_NAMESPACE_STD_BEGIN

#if _LIBCPP_VERSION < 4000 && !FOLLY_SKIP_LIBCPP_4000_THROW_BACKPORTS
void __throw_length_error(char const* msg) {
  throw std::length_error(msg);
}

void __throw_logic_error(char const* msg) {
  throw std::logic_error(msg);
}

void __throw_out_of_range(char const* msg) {
  throw std::out_of_range(msg);
}
#endif

#if _CPPLIB_VER // msvc c++ std lib
void __throw_bad_alloc() {
  throw std::bad_alloc();
}
#endif

FOLLY_NAMESPACE_STD_END

#endif
