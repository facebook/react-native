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

#include <cstdio>
#include <cstdlib>
#include <cstring>

#include <folly/Portability.h>
#include <folly/Preprocessor.h>

/**
 * Check if the currently loaded version of a library is what you expect.
 *
 * It is possible for multiple versions of the same shared library to end up
 * being loaded simultaneously in the same address space, usually with
 * disastrous results.
 *
 * For example, let's say you have a shared library (foo) that doesn't keep
 * binary compatbility between releases, and so each version is distributed as
 * a SO with different SONAME. Let's say you build another shared library, bar
 * that depends on version 1 of foo: libbar.so depends on libfoo1.so.
 * Your main executable now (baz) depends on version 2 of foo, and also
 * depends on bar: baz depends on libfoo2.so and libbar.so.
 *
 * At load time, baz loads libfoo2.so first, then libbar.so; libbar.so will
 * load libfoo1.so, but, as this is normal dynamic loading (and not explicit
 * dlopen calls with RTLD_DEEPBIND), any symbols from libfoo1.so that are
 * also present in libfoo2.so will be satisfied from the (already loaded)
 * libfoo2.so.
 *
 * But foo does not preserve binary compatibility between versions, so all
 * hell breaks loose (the symbols from libfoo2.so are not necessarily direct
 * replacements of the identically-named symbols in libfoo1.so).
 *
 * It is better to crash with a helpful error message instead, which is what
 * this macro provides. FOLLY_VERSION_CHECK verifies at load time that
 * the compiled-in version is the same as the currently loaded version.
 *
 * Usage: use this macro at namespace scope in a .cpp file (IMPORTANT: NOT
 * in the unnamed namespace):
 *
 * FOLLY_VERSION_CHECK(mylib, "1")
 *
 * The first argument identifies your library; the second argument is a
 * string literal containing the desired version string.
 *
 * In order to avoid changing the file for each version, the version string
 * could be provided on the compiler command line with -D:
 *
 * FOLLY_VERSION_CHECK(mylib, MYLIB_VERSION)
 *
 * ... and then commpile your file with -DMYLIB_VERSION=\"1\"
 */

#if defined(_MSC_VER)
// MSVC doesn't support constructor priorities. Just pray it works, I guess.
// We could implement a link-time mechanism for MSVC,
// via #pragma detect_mismatch but that would only handle
// static library linking.
# define FOLLY_VERSION_CHECK_PRIORITY(Ret, name) \
    __pragma(section(".CRT$XCU",read)) \
    static Ret __cdecl name(void); \
    __declspec(allocate(".CRT$XCU")) \
    Ret (__cdecl*name##_)(void) = name; \
    Ret __cdecl name()

#elif defined(__APPLE__)
// OS X doesn't support constructor priorities. Just pray it works, I guess.
# define FOLLY_VERSION_CHECK_PRIORITY(Ret, name) \
  __attribute__((__constructor__)) Ret name()

#else
# define FOLLY_VERSION_CHECK_PRIORITY(Ret, name) \
  __attribute__((__constructor__(101))) Ret name()
#endif

// Note that this is carefully crafted: PRODUCT##Version must have external
// linkage (so it collides among versions), versionCheck must have internal
// linkage (so it does NOT collide between versions); if we're trying to have
// multiple versions loaded at the same time, they must each run their copy
// of versionCheck, but share the PRODUCT##Version variable.
#define FOLLY_VERSION_CHECK(PRODUCT, VERSION) \
  const char* PRODUCT##Version = VERSION; \
  namespace { \
  FOLLY_VERSION_CHECK_PRIORITY(void, versionCheck) { \
    if (strcmp(PRODUCT##Version, VERSION)) { \
      fprintf(stderr, \
              "Invalid %s version: desired [%s], currently loaded [%s]\n", \
              FB_STRINGIZE(PRODUCT), PRODUCT##Version, VERSION); \
      abort(); \
    } \
  } \
  }
