/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <fb/log.h>
#include <stdarg.h>
#include <stdio.h>
#include <string.h>

#define LOG_BUFFER_SIZE 4096
static LogHandler gLogHandler;

void setLogHandler(LogHandler logHandler) {
  gLogHandler = logHandler;
}

int fb_printLog(int prio, const char* tag, const char* fmt, ...) {
  char logBuffer[LOG_BUFFER_SIZE];

  va_list va_args;
  va_start(va_args, fmt);
  int result = vsnprintf(logBuffer, sizeof(logBuffer), fmt, va_args);
  va_end(va_args);
  if (gLogHandler != NULL) {
    gLogHandler(prio, tag, logBuffer);
  }
  __android_log_write(prio, tag, logBuffer);
  return result;
}

void logPrintByDelims(
    int priority,
    const char* tag,
    const char* delims,
    const char* msg,
    ...) {
  va_list ap;
  char buf[32768];
  char* context;
  char* tok;

  va_start(ap, msg);
  vsnprintf(buf, sizeof(buf), msg, ap);
  va_end(ap);

  tok = strtok_r(buf, delims, &context);

  if (!tok) {
    return;
  }

  do {
    __android_log_write(priority, tag, tok);
  } while ((tok = strtok_r(NULL, delims, &context)));
}

#ifndef ANDROID

// Implementations of the basic android logging functions for non-android
// platforms.

static char logTagChar(int prio) {
  switch (prio) {
    default:
    case ANDROID_LOG_UNKNOWN:
    case ANDROID_LOG_DEFAULT:
    case ANDROID_LOG_SILENT:
      return ' ';
    case ANDROID_LOG_VERBOSE:
      return 'V';
    case ANDROID_LOG_DEBUG:
      return 'D';
    case ANDROID_LOG_INFO:
      return 'I';
    case ANDROID_LOG_WARN:
      return 'W';
    case ANDROID_LOG_ERROR:
      return 'E';
    case ANDROID_LOG_FATAL:
      return 'F';
  }
}

int __android_log_write(int prio, const char* tag, const char* text) {
  return fprintf(stderr, "[%c/%.16s] %s\n", logTagChar(prio), tag, text);
}

int __android_log_print(int prio, const char* tag, const char* fmt, ...) {
  va_list ap;
  va_start(ap, fmt);

  int res = fprintf(stderr, "[%c/%.16s] ", logTagChar(prio), tag);
  res += vfprintf(stderr, "%s\n", ap);

  va_end(ap);
  return res;
}

#endif
