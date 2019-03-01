/* Copyright (c) 2008, Google Inc.
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 * 
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Google Inc. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * ---
 * Author: Craig Silverstein
 * Copied from google-perftools and modified by Shinichiro Hamaji
 *
 * These are some portability typedefs and defines to make it a bit
 * easier to compile this code under VC++.
 *
 * Several of these are taken from glib:
 *    http://developer.gnome.org/doc/API/glib/glib-windows-compatability-functions.html
 */

#ifndef CTEMPLATE_WINDOWS_PORT_H_
#define CTEMPLATE_WINDOWS_PORT_H_

#include "config.h"

#ifdef _WIN32

#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN  /* We always want minimal includes */
#endif

#include <windows.h>
#include <winsock.h>         /* for gethostname */
#include <io.h>              /* because we so often use open/close/etc */
#include <direct.h>          /* for _getcwd() */
#include <process.h>         /* for _getpid() */
#include <stdio.h>           /* read in vsnprintf decl. before redifining it */
#include <stdarg.h>          /* template_dictionary.cc uses va_copy */
#include <string.h>          /* for _strnicmp(), strerror_s() */
#include <time.h>            /* for localtime_s() */
/* Note: the C++ #includes are all together at the bottom.  This file is
 * used by both C and C++ code, so we put all the C++ together.
 */

#ifdef _MSC_VER

/* 4244: otherwise we get problems when substracting two size_t's to an int
 * 4251: it's complaining about a private struct I've chosen not to dllexport
 * 4355: we use this in a constructor, but we do it safely
 * 4715: for some reason VC++ stopped realizing you can't return after abort()
 * 4800: we know we're casting ints/char*'s to bools, and we're ok with that
 * 4996: Yes, we're ok using "unsafe" functions like fopen() and strerror()
 */
#pragma warning(disable:4244 4251 4355 4715 4800 4996)

/* file I/O */
#define PATH_MAX 1024
#define access  _access
#define getcwd  _getcwd
#define open    _open
#define read    _read
#define write   _write
#define lseek   _lseek
#define close   _close
#define popen   _popen
#define pclose  _pclose
#define R_OK    04           /* read-only (for access()) */
#define S_ISDIR(m)  (((m) & _S_IFMT) == _S_IFDIR)
#ifndef __MINGW32__
enum { STDIN_FILENO = 0, STDOUT_FILENO = 1, STDERR_FILENO = 2 };
#endif
#define S_IRUSR S_IREAD
#define S_IWUSR S_IWRITE

/* Not quite as lightweight as a hard-link, but more than good enough for us. */
#define link(oldpath, newpath)  CopyFileA(oldpath, newpath, false)

#define strcasecmp   _stricmp
#define strncasecmp  _strnicmp

/* In windows-land, hash<> is called hash_compare<> (from xhash.h) */
/* VC11 provides std::hash */
#if defined(_MSC_VER) && (_MSC_VER < 1700)
#define hash  hash_compare
#endif

/* Sleep is in ms, on windows */
#define sleep(secs)  Sleep((secs) * 1000)

/* We can't just use _vsnprintf and _snprintf as drop-in-replacements,
 * because they don't always NUL-terminate. :-(  We also can't use the
 * name vsnprintf, since windows defines that (but not snprintf (!)).
 */
#ifndef HAVE_SNPRINTF
extern int GOOGLE_GLOG_DLL_DECL snprintf(char *str, size_t size,
                                       const char *format, ...);
#endif
extern int GOOGLE_GLOG_DLL_DECL safe_vsnprintf(char *str, size_t size,
                          const char *format, va_list ap);
#define vsnprintf(str, size, format, ap)  safe_vsnprintf(str, size, format, ap)
#ifndef va_copy
#define va_copy(dst, src)  (dst) = (src)
#endif

/* Windows doesn't support specifying the number of buckets as a
 * hash_map constructor arg, so we leave this blank.
 */
#define CTEMPLATE_SMALL_HASHTABLE

#define DEFAULT_TEMPLATE_ROOTDIR  ".."

// ----------------------------------- SYSTEM/PROCESS
typedef int pid_t;
#define getpid  _getpid

#endif  // _MSC_VER

// ----------------------------------- THREADS
#ifndef __MINGW32__
typedef DWORD pthread_t;
typedef DWORD pthread_key_t;
typedef LONG pthread_once_t;
enum { PTHREAD_ONCE_INIT = 0 };   // important that this be 0! for SpinLock
#define pthread_self  GetCurrentThreadId
#define pthread_equal(pthread_t_1, pthread_t_2)  ((pthread_t_1)==(pthread_t_2))

inline struct tm* localtime_r(const time_t* timep, struct tm* result) {
  localtime_s(result, timep);
  return result;
}
#endif

inline char* strerror_r(int errnum, char* buf, size_t buflen) {
  strerror_s(buf, buflen, errnum);
  return buf;
}

#ifndef __cplusplus
/* I don't see how to get inlining for C code in MSVC.  Ah well. */
#define inline
#endif

#endif  /* _WIN32 */

#endif  /* CTEMPLATE_WINDOWS_PORT_H_ */
