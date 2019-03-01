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

#pragma once

#include <errno.h>

#include <cstdio>
#include <stdexcept>
#include <system_error>

#include <folly/Conv.h>
#include <folly/FBString.h>
#include <folly/Likely.h>
#include <folly/Portability.h>

namespace folly {

// Various helpers to throw appropriate std::system_error exceptions from C
// library errors (returned in errno, as positive return values (many POSIX
// functions), or as negative return values (Linux syscalls))
//
// The *Explicit functions take an explicit value for errno.

// Helper to throw std::system_error
[[noreturn]] inline void throwSystemErrorExplicit(int err, const char* msg) {
  throw std::system_error(err, std::system_category(), msg);
}

template <class... Args>
[[noreturn]] void throwSystemErrorExplicit(int err, Args&&... args) {
  throwSystemErrorExplicit(
      err, to<fbstring>(std::forward<Args>(args)...).c_str());
}

// Helper to throw std::system_error from errno and components of a string
template <class... Args>
[[noreturn]] void throwSystemError(Args&&... args) {
  throwSystemErrorExplicit(errno, std::forward<Args>(args)...);
}

// Check a Posix return code (0 on success, error number on error), throw
// on error.
template <class... Args>
void checkPosixError(int err, Args&&... args) {
  if (UNLIKELY(err != 0)) {
    throwSystemErrorExplicit(err, std::forward<Args>(args)...);
  }
}

// Check a Linux kernel-style return code (>= 0 on success, negative error
// number on error), throw on error.
template <class... Args>
void checkKernelError(ssize_t ret, Args&&... args) {
  if (UNLIKELY(ret < 0)) {
    throwSystemErrorExplicit(int(-ret), std::forward<Args>(args)...);
  }
}

// Check a traditional Unix return code (-1 and sets errno on error), throw
// on error.
template <class... Args>
void checkUnixError(ssize_t ret, Args&&... args) {
  if (UNLIKELY(ret == -1)) {
    throwSystemError(std::forward<Args>(args)...);
  }
}

template <class... Args>
void checkUnixErrorExplicit(ssize_t ret, int savedErrno, Args&&... args) {
  if (UNLIKELY(ret == -1)) {
    throwSystemErrorExplicit(savedErrno, std::forward<Args>(args)...);
  }
}

// Check the return code from a fopen-style function (returns a non-nullptr
// FILE* on success, nullptr on error, sets errno).  Works with fopen, fdopen,
// freopen, tmpfile, etc.
template <class... Args>
void checkFopenError(FILE* fp, Args&&... args) {
  if (UNLIKELY(!fp)) {
    throwSystemError(std::forward<Args>(args)...);
  }
}

template <class... Args>
void checkFopenErrorExplicit(FILE* fp, int savedErrno, Args&&... args) {
  if (UNLIKELY(!fp)) {
    throwSystemErrorExplicit(savedErrno, std::forward<Args>(args)...);
  }
}

template <typename E, typename V, typename... Args>
void throwOnFail(V&& value, Args&&... args) {
  if (!value) {
    throw E(std::forward<Args>(args)...);
  }
}

/**
 * If cond is not true, raise an exception of type E.  E must have a ctor that
 * works with const char* (a description of the failure).
 */
#define CHECK_THROW(cond, E) \
  ::folly::throwOnFail<E>((cond), "Check failed: " #cond)

}  // namespace folly
