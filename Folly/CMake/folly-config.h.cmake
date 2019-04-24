/*
 * Copyright 2016 Facebook, Inc.
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

#if !defined(FOLLY_MOBILE)
#if defined(__ANDROID__) || \
    (defined(__APPLE__) &&  \
     (TARGET_IPHONE_SIMULATOR || TARGET_OS_SIMULATOR || TARGET_OS_IPHONE))
#define FOLLY_MOBILE 1
#else
#define FOLLY_MOBILE 0
#endif
#endif // FOLLY_MOBILE

#cmakedefine FOLLY_HAVE_PTHREAD 1
#cmakedefine FOLLY_HAVE_PTHREAD_ATFORK 1

#cmakedefine FOLLY_HAVE_LIBGFLAGS 1
#cmakedefine FOLLY_UNUSUAL_GFLAGS_NAMESPACE 1
#cmakedefine FOLLY_GFLAGS_NAMESPACE @FOLLY_GFLAGS_NAMESPACE@

#cmakedefine FOLLY_HAVE_LIBGLOG 1

#cmakedefine FOLLY_USE_JEMALLOC 1
#cmakedefine FOLLY_USE_LIBSTDCPP 1

#if __has_include(<features.h>)
#include <features.h>
#endif

#cmakedefine FOLLY_HAVE_MEMRCHR 1
#cmakedefine FOLLY_HAVE_PREADV 1
#cmakedefine FOLLY_HAVE_PWRITEV 1
#cmakedefine FOLLY_HAVE_CLOCK_GETTIME 1
#cmakedefine FOLLY_HAVE_OPENSSL_ASN1_TIME_DIFF 1

#cmakedefine FOLLY_HAVE_IFUNC 1
#cmakedefine FOLLY_HAVE_STD__IS_TRIVIALLY_COPYABLE 1
#cmakedefine FOLLY_HAVE_UNALIGNED_ACCESS 1
#cmakedefine FOLLY_HAVE_VLA 1
#cmakedefine FOLLY_HAVE_WEAK_SYMBOLS 1
#cmakedefine FOLLY_HAVE_LINUX_VDSO 1
#cmakedefine FOLLY_HAVE_MALLOC_USABLE_SIZE 1
#cmakedefine FOLLY_HAVE_INT128_T 1
#cmakedefine FOLLY_SUPPLY_MISSING_INT128_TRAITS 1
#cmakedefine FOLLY_HAVE_WCHAR_SUPPORT 1
#cmakedefine FOLLY_HAVE_EXTRANDOM_SFMT19937 1
#cmakedefine FOLLY_USE_LIBCPP 1
#cmakedefine FOLLY_HAVE_XSI_STRERROR_R 1
#cmakedefine HAVE_VSNPRINTF_ERRORS 1

#cmakedefine FOLLY_USE_SYMBOLIZER 1
#define FOLLY_DEMANGLE_MAX_SYMBOL_SIZE 1024

#cmakedefine FOLLY_HAVE_SHADOW_LOCAL_WARNINGS 1

#cmakedefine FOLLY_HAVE_LIBLZ4 1
#cmakedefine FOLLY_HAVE_LIBLZMA 1
#cmakedefine FOLLY_HAVE_LIBSNAPPY 1
#cmakedefine FOLLY_HAVE_LIBZ 1
#cmakedefine FOLLY_HAVE_LIBZSTD 1
#cmakedefine FOLLY_HAVE_LIBBZ2 1

#cmakedefine FOLLY_ASAN_ENABLED 1

#cmakedefine FOLLY_SUPPORT_SHARED_LIBRARY 1
