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

#include <folly/Demangle.h>

#include <algorithm>
#include <cstring>

#include <folly/detail/Demangle.h>
#include <folly/portability/Config.h>

#if FOLLY_DETAIL_HAVE_DEMANGLE_H

#include <cxxabi.h>

#endif

namespace folly {

#if FOLLY_DETAIL_HAVE_DEMANGLE_H

fbstring demangle(const char* name) {
#ifdef FOLLY_DEMANGLE_MAX_SYMBOL_SIZE
  // GCC's __cxa_demangle() uses on-stack data structures for the
  // parser state which are linear in the number of components of the
  // symbol. For extremely long symbols, this can cause a stack
  // overflow. We set an arbitrary symbol length limit above which we
  // just return the mangled name.
  size_t mangledLen = strlen(name);
  if (mangledLen > FOLLY_DEMANGLE_MAX_SYMBOL_SIZE) {
    return fbstring(name, mangledLen);
  }
#endif

  int status;
  size_t len = 0;
  // malloc() memory for the demangled type name
  char* demangled = abi::__cxa_demangle(name, nullptr, &len, &status);
  if (status != 0) {
    return name;
  }
  // len is the length of the buffer (including NUL terminator and maybe
  // other junk)
  return fbstring(demangled, strlen(demangled), len, AcquireMallocatedString());
}

namespace {

struct DemangleBuf {
  char* dest;
  size_t remaining;
  size_t total;
};

void demangleCallback(const char* str, size_t size, void* p) {
  DemangleBuf* buf = static_cast<DemangleBuf*>(p);
  size_t n = std::min(buf->remaining, size);
  memcpy(buf->dest, str, n);
  buf->dest += n;
  buf->remaining -= n;
  buf->total += size;
}

} // namespace

size_t demangle(const char* name, char* out, size_t outSize) {
#ifdef FOLLY_DEMANGLE_MAX_SYMBOL_SIZE
  size_t mangledLen = strlen(name);
  if (mangledLen > FOLLY_DEMANGLE_MAX_SYMBOL_SIZE) {
    if (outSize) {
      size_t n = std::min(mangledLen, outSize - 1);
      memcpy(out, name, n);
      out[n] = '\0';
    }
    return mangledLen;
  }
#endif

  DemangleBuf dbuf;
  dbuf.dest = out;
  dbuf.remaining = outSize ? outSize - 1 : 0; // leave room for null term
  dbuf.total = 0;

  // Unlike most library functions, this returns 1 on success and 0 on failure
  int status =
      detail::cplus_demangle_v3_callback_wrapper(name, demangleCallback, &dbuf);
  if (status == 0) { // failed, return original
    return folly::strlcpy(out, name, outSize);
  }
  if (outSize != 0) {
    *dbuf.dest = '\0';
  }
  return dbuf.total;
}

#else

fbstring demangle(const char* name) {
  return name;
}

size_t demangle(const char* name, char* out, size_t outSize) {
  return folly::strlcpy(out, name, outSize);
}

#endif

size_t strlcpy(char* dest, const char* const src, size_t size) {
  size_t len = strlen(src);
  if (size != 0) {
    size_t n = std::min(len, size - 1); // always null terminate!
    memcpy(dest, src, n);
    dest[n] = '\0';
  }
  return len;
}

} // namespace folly
