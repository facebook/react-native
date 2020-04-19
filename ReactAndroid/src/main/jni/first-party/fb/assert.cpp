/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <stdio.h>
#include <cstdarg>

#include <fb/assert.h>
#include <fb/log.h>

namespace facebook {

#define ASSERT_BUF_SIZE 4096
static char sAssertBuf[ASSERT_BUF_SIZE];
static AssertHandler gAssertHandler;

void assertInternal(const char *formatstr...) {
  va_list va_args;
  va_start(va_args, formatstr);
  vsnprintf(sAssertBuf, sizeof(sAssertBuf), formatstr, va_args);
  va_end(va_args);
  if (gAssertHandler != NULL) {
    gAssertHandler(sAssertBuf);
  }
  FBLOG(LOG_FATAL, "fbassert", "%s", sAssertBuf);
  // crash at this specific address so that we can find our crashes easier
  *(int *)0xdeadb00c = 0;
  // let the compiler know we won't reach the end of the function
  __builtin_unreachable();
}

void setAssertHandler(AssertHandler assertHandler) {
  gAssertHandler = assertHandler;
}

} // namespace facebook
