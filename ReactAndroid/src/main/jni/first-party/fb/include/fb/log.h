/*
 * Copyright (C) 2005 The Android Open Source Project
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * FB Wrapper for logging functions.
 *
 * The android logging API uses the macro "LOG()" for its logic, which means
 * that it conflicts with random other places that use LOG for their own
 * purposes and doesn't work right half the places you include it
 *
 * FBLOG uses exactly the same semantics (FBLOGD for debug etc) but because of
 * the FB prefix it's strictly better. FBLOGV also gets stripped out based on
 * whether NDEBUG is set, but can be overridden by FBLOG_NDEBUG
 *
 * Most of the rest is a copy of <cutils/log.h> with minor changes.
 */

//
// C/C++ logging functions.  See the logging documentation for API details.
//
// We'd like these to be available from C code (in case we import some from
// somewhere), so this has a C interface.
//
// The output will be correct when the log file is shared between multiple
// threads and/or multiple processes so long as the operating system
// supports O_APPEND.  These calls have mutex-protected data structures
// and so are NOT reentrant.  Do not use LOG in a signal handler.
//
#pragma once

#include <fb/visibility.h>

#ifdef __cplusplus
extern "C" {
#endif

#ifdef ANDROID
#include <android/log.h>
#else
// These declarations are needed for our internal use even on non-Android
// builds.
// (they are borrowed from <android/log.h>)

/*
 * Android log priority values, in ascending priority order.
 */
typedef enum android_LogPriority {
  ANDROID_LOG_UNKNOWN = 0,
  ANDROID_LOG_DEFAULT, /* only for SetMinPriority() */
  ANDROID_LOG_VERBOSE,
  ANDROID_LOG_DEBUG,
  ANDROID_LOG_INFO,
  ANDROID_LOG_WARN,
  ANDROID_LOG_ERROR,
  ANDROID_LOG_FATAL,
  ANDROID_LOG_SILENT, /* only for SetMinPriority(); must be last */
} android_LogPriority;

/*
 * Send a simple string to the log.
 */
int __android_log_write(int prio, const char *tag, const char *text);

/*
 * Send a formatted string to the log, used like printf(fmt,...)
 */
int __android_log_print(int prio, const char *tag, const char *fmt, ...)
#if defined(__GNUC__)
    __attribute__((format(printf, 3, 4)))
#endif
    ;

#endif

// ---------------------------------------------------------------------

/*
 * Normally we strip FBLOGV (VERBOSE messages) from release builds.
 * You can modify this (for example with "#define FBLOG_NDEBUG 0"
 * at the top of your source file) to change that behavior.
 */
#ifndef FBLOG_NDEBUG
#ifdef NDEBUG
#define FBLOG_NDEBUG 1
#else
#define FBLOG_NDEBUG 0
#endif
#endif

/*
 * This is the local tag used for the following simplified
 * logging macros.  You can change this preprocessor definition
 * before using the other macros to change the tag.
 */
#ifndef LOG_TAG
#define LOG_TAG NULL
#endif

// ---------------------------------------------------------------------

/*
 * Simplified macro to send a verbose log message using the current LOG_TAG.
 */
#ifndef FBLOGV
#if FBLOG_NDEBUG
#define FBLOGV(...) ((void)0)
#else
#define FBLOGV(...) ((void)FBLOG(LOG_VERBOSE, LOG_TAG, __VA_ARGS__))
#endif
#endif

#define CONDITION(cond) (__builtin_expect((cond) != 0, 0))

#ifndef FBLOGV_IF
#if FBLOG_NDEBUG
#define FBLOGV_IF(cond, ...) ((void)0)
#else
#define FBLOGV_IF(cond, ...)                                            \
  ((CONDITION(cond)) ? ((void)FBLOG(LOG_VERBOSE, LOG_TAG, __VA_ARGS__)) \
                     : (void)0)
#endif
#endif

/*
 * Simplified macro to send a debug log message using the current LOG_TAG.
 */
#ifndef FBLOGD
#define FBLOGD(...) ((void)FBLOG(LOG_DEBUG, LOG_TAG, __VA_ARGS__))
#endif

#ifndef FBLOGD_IF
#define FBLOGD_IF(cond, ...) \
  ((CONDITION(cond)) ? ((void)FBLOG(LOG_DEBUG, LOG_TAG, __VA_ARGS__)) : (void)0)
#endif

/*
 * Simplified macro to send an info log message using the current LOG_TAG.
 */
#ifndef FBLOGI
#define FBLOGI(...) ((void)FBLOG(LOG_INFO, LOG_TAG, __VA_ARGS__))
#endif

#ifndef FBLOGI_IF
#define FBLOGI_IF(cond, ...) \
  ((CONDITION(cond)) ? ((void)FBLOG(LOG_INFO, LOG_TAG, __VA_ARGS__)) : (void)0)
#endif

/*
 * Simplified macro to send a warning log message using the current LOG_TAG.
 */
#ifndef FBLOGW
#define FBLOGW(...) ((void)FBLOG(LOG_WARN, LOG_TAG, __VA_ARGS__))
#endif

#ifndef FBLOGW_IF
#define FBLOGW_IF(cond, ...) \
  ((CONDITION(cond)) ? ((void)FBLOG(LOG_WARN, LOG_TAG, __VA_ARGS__)) : (void)0)
#endif

/*
 * Simplified macro to send an error log message using the current LOG_TAG.
 */
#ifndef FBLOGE
#define FBLOGE(...) ((void)FBLOG(LOG_ERROR, LOG_TAG, __VA_ARGS__))
#endif

#ifndef FBLOGE_IF
#define FBLOGE_IF(cond, ...) \
  ((CONDITION(cond)) ? ((void)FBLOG(LOG_ERROR, LOG_TAG, __VA_ARGS__)) : (void)0)
#endif

// ---------------------------------------------------------------------

/*
 * Conditional based on whether the current LOG_TAG is enabled at
 * verbose priority.
 */
#ifndef IF_FBLOGV
#if FBLOG_NDEBUG
#define IF_FBLOGV() if (false)
#else
#define IF_FBLOGV() IF_FBLOG(LOG_VERBOSE, LOG_TAG)
#endif
#endif

/*
 * Conditional based on whether the current LOG_TAG is enabled at
 * debug priority.
 */
#ifndef IF_FBLOGD
#define IF_FBLOGD() IF_FBLOG(LOG_DEBUG, LOG_TAG)
#endif

/*
 * Conditional based on whether the current LOG_TAG is enabled at
 * info priority.
 */
#ifndef IF_FBLOGI
#define IF_FBLOGI() IF_FBLOG(LOG_INFO, LOG_TAG)
#endif

/*
 * Conditional based on whether the current LOG_TAG is enabled at
 * warn priority.
 */
#ifndef IF_FBLOGW
#define IF_FBLOGW() IF_FBLOG(LOG_WARN, LOG_TAG)
#endif

/*
 * Conditional based on whether the current LOG_TAG is enabled at
 * error priority.
 */
#ifndef IF_FBLOGE
#define IF_FBLOGE() IF_FBLOG(LOG_ERROR, LOG_TAG)
#endif

// ---------------------------------------------------------------------

/*
 * Log a fatal error.  If the given condition fails, this stops program
 * execution like a normal assertion, but also generating the given message.
 * It is NOT stripped from release builds.  Note that the condition test
 * is -inverted- from the normal assert() semantics.
 */
#define FBLOG_ALWAYS_FATAL_IF(cond, ...)                                   \
  ((CONDITION(cond)) ? ((void)fb_printAssert(#cond, LOG_TAG, __VA_ARGS__)) \
                     : (void)0)

#define FBLOG_ALWAYS_FATAL(...) \
  (((void)fb_printAssert(NULL, LOG_TAG, __VA_ARGS__)))

/*
 * Versions of LOG_ALWAYS_FATAL_IF and LOG_ALWAYS_FATAL that
 * are stripped out of release builds.
 */
#if FBLOG_NDEBUG

#define FBLOG_FATAL_IF(cond, ...) ((void)0)
#define FBLOG_FATAL(...) ((void)0)

#else

#define FBLOG_FATAL_IF(cond, ...) FBLOG_ALWAYS_FATAL_IF(cond, __VA_ARGS__)
#define FBLOG_FATAL(...) FBLOG_ALWAYS_FATAL(__VA_ARGS__)

#endif

/*
 * Assertion that generates a log message when the assertion fails.
 * Stripped out of release builds.  Uses the current LOG_TAG.
 */
#define FBLOG_ASSERT(cond, ...) FBLOG_FATAL_IF(!(cond), __VA_ARGS__)
//#define LOG_ASSERT(cond) LOG_FATAL_IF(!(cond), "Assertion failed: " #cond)

// ---------------------------------------------------------------------

/*
 * Basic log message macro.
 *
 * Example:
 *  FBLOG(LOG_WARN, NULL, "Failed with error %d", errno);
 *
 * The second argument may be NULL or "" to indicate the "global" tag.
 */
#ifndef FBLOG
#define FBLOG(priority, tag, ...) \
  FBLOG_PRI(ANDROID_##priority, tag, __VA_ARGS__)
#endif

#ifndef FBLOG_BY_DELIMS
#define FBLOG_BY_DELIMS(priority, tag, delims, msg, ...) \
  logPrintByDelims(ANDROID_##priority, tag, delims, msg, ##__VA_ARGS__)
#endif

/*
 * Log macro that allows you to specify a number for the priority.
 */
#ifndef FBLOG_PRI
#define FBLOG_PRI(priority, tag, ...) fb_printLog(priority, tag, __VA_ARGS__)
#endif

/*
 * Log macro that allows you to pass in a varargs ("args" is a va_list).
 */
#ifndef FBLOG_PRI_VA
#define FBLOG_PRI_VA(priority, tag, fmt, args) \
  fb_vprintLog(priority, NULL, tag, fmt, args)
#endif

/*
 * Conditional given a desired logging priority and tag.
 */
#ifndef IF_FBLOG
#define IF_FBLOG(priority, tag) if (fb_testLog(ANDROID_##priority, tag))
#endif

typedef void (*LogHandler)(int priority, const char *tag, const char *message);
FBEXPORT void setLogHandler(LogHandler logHandler);

/*
 * ===========================================================================
 *
 * The stuff in the rest of this file should not be used directly.
 */
FBEXPORT int fb_printLog(int prio, const char *tag, const char *fmt, ...)
#if defined(__GNUC__)
    __attribute__((format(printf, 3, 4)))
#endif
    ;

#define fb_vprintLog(prio, cond, tag, fmt...) \
  __android_log_vprint(prio, tag, fmt)

#define fb_printAssert(cond, tag, fmt...) __android_log_assert(cond, tag, fmt)

#define fb_writeLog(prio, tag, text) __android_log_write(prio, tag, text)

#define fb_bWriteLog(tag, payload, len) __android_log_bwrite(tag, payload, len)
#define fb_btWriteLog(tag, type, payload, len) \
  __android_log_btwrite(tag, type, payload, len)

#define fb_testLog(prio, tag) (1)

/*
 * FB extensions
 */
void logPrintByDelims(
    int priority,
    const char *tag,
    const char *delims,
    const char *msg,
    ...);

#ifdef __cplusplus
}
#endif
