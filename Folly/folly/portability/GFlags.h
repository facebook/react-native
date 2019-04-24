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

#include <folly/portability/Config.h>

#if !FOLLY_HAVE_LIBGFLAGS
// glog/logging.h is dependent on this implementation detail
// being defined otherwise it undefines all of this -_-....
//
// Also, this is deliberately expanded such that places using
// it directly break loudly. (C will break louder than C++, but oh well)
#define DECLARE_VARIABLE() \
  static_assert(false, "You shouldn't be using GFlags internals.");

#define FOLLY_DECLARE_FLAG(_type, _shortType, _name) \
  namespace fL##_shortType {                         \
    extern _type FLAGS_##_name;                      \
  }                                                  \
  using fL##_shortType::FLAGS_##_name

#define DECLARE_bool(_name) FOLLY_DECLARE_FLAG(bool, B, _name)
#define DECLARE_double(_name) FOLLY_DECLARE_FLAG(double, D, _name)
#define DECLARE_int32(_name) FOLLY_DECLARE_FLAG(int, I, _name)
#define DECLARE_int64(_name) FOLLY_DECLARE_FLAG(long long, I64, _name)
#define DECLARE_uint32(_name) FOLLY_DECLARE_FLAG(unsigned long, U32, _name)
#define DECLARE_uint64(_name) FOLLY_DECLARE_FLAG(unsigned long long, U64, _name)
#define DECLARE_string(_name) FOLLY_DECLARE_FLAG(std::string, S, _name)

#define FOLLY_DEFINE_FLAG(_type, _shortType, _name, _default) \
  namespace fL##_shortType {                                  \
    _type FLAGS_##_name = _default;                           \
  }                                                           \
  using fL##_shortType::FLAGS_##_name

#define DEFINE_bool(_name, _default, _description) \
  FOLLY_DEFINE_FLAG(bool, B, _name, _default)
#define DEFINE_double(_name, _default, _description) \
  FOLLY_DEFINE_FLAG(double, D, _name, _default)
#define DEFINE_int32(_name, _default, _description) \
  FOLLY_DEFINE_FLAG(int, I, _name, _default)
#define DEFINE_int64(_name, _default, _description) \
  FOLLY_DEFINE_FLAG(long long, I64, _name, _default)
#define DEFINE_uint32(_name, _default, _description) \
  FOLLY_DEFINE_FLAG(unsigned long, U32, _name, _default)
#define DEFINE_uint64(_name, _default, _description) \
  FOLLY_DEFINE_FLAG(unsigned long long, U64, _name, _default)
#define DEFINE_string(_name, _default, _description) \
  FOLLY_DEFINE_FLAG(std::string, S, _name, _default)

namespace google {
class FlagSaver {};
} // namespace google

#else
#include <gflags/gflags.h>
#endif
