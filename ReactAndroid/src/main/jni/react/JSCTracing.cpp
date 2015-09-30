// Copyright 2004-present Facebook. All Rights Reserved.

#include <algorithm>
#include <JavaScriptCore/JavaScript.h>
#include <fbsystrace.h>
#include <sys/types.h>
#include <unistd.h>
#include "JSCHelpers.h"

using std::min;

static uint64_t tagFromJSValue(
    JSContextRef ctx,
    JSValueRef value,
    JSValueRef* exception) {
  // XXX validate that this is a lossless conversion.
  // XXX should we just have separate functions for bridge, infra, and apps,
  // then drop this argument to save time?
  (void)exception;
  uint64_t tag = (uint64_t) JSValueToNumber(ctx, value, NULL);
  return tag;
}

static int64_t int64FromJSValue(
    JSContextRef ctx,
    JSValueRef value,
    JSValueRef* exception) {
  (void)exception;
  int64_t num = (int64_t) JSValueToNumber(ctx, value, NULL);
  return num;
}

static size_t copyTruncatedAsciiChars(
    char* buf,
    size_t bufLen,
    JSContextRef ctx,
    JSValueRef value,
    size_t maxLen) {
  JSStringRef jsString = JSValueToStringCopy(ctx, value, NULL);
  size_t stringLen = JSStringGetLength(jsString);
  // Unlike the Java version, we truncate from the end of the string,
  // rather than the beginning.
  size_t toWrite = min(stringLen, min(bufLen, maxLen));

  const JSChar* chars = JSStringGetCharactersPtr(jsString);
  while (toWrite-- > 0) {
    *(buf++) = (char)*(chars++);
  }

  JSStringRelease(jsString);

  // Return the full length to match snprintf semantics.
  return stringLen;
}

static size_t copyArgsToBuffer(
    char* buf,
    size_t bufLen,
    size_t pos,
    JSContextRef ctx,
    size_t argumentCount,
    const JSValueRef arguments[]) {
  char separator = '|';
  for (
      size_t idx = 0;
      idx + 1 < argumentCount;  // Make sure key and value are present.
      idx += 2) {
    JSValueRef key = arguments[idx];
    JSValueRef value = arguments[idx+1];

    buf[pos++] = separator;
    separator = ';';
    if (FBSYSTRACE_UNLIKELY(pos >= bufLen)) { break; }
    pos += copyTruncatedAsciiChars(
        buf + pos, bufLen - pos, ctx, key, FBSYSTRACE_MAX_MESSAGE_LENGTH);
    if (FBSYSTRACE_UNLIKELY(pos >= bufLen)) { break; }
    buf[pos++] = '=';
    if (FBSYSTRACE_UNLIKELY(pos >= bufLen)) { break; }
    pos += copyTruncatedAsciiChars(
        buf + pos, bufLen - pos, ctx, value, FBSYSTRACE_MAX_MESSAGE_LENGTH);
    if (FBSYSTRACE_UNLIKELY(pos >= bufLen)) { break; }
  }
  return pos;
}

static JSValueRef nativeTraceBeginSection(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  if (FBSYSTRACE_UNLIKELY(argumentCount < 2)) {
    // Could raise an exception here.
    return JSValueMakeUndefined(ctx);
  }

  uint64_t tag = tagFromJSValue(ctx, arguments[0], exception);
  if (!fbsystrace_is_tracing(tag)) {
    return JSValueMakeUndefined(ctx);
  }

  char buf[FBSYSTRACE_MAX_MESSAGE_LENGTH];
  size_t pos = 0;

  pos += snprintf(buf + pos, sizeof(buf) - pos, "B|%d|", getpid());
  // Skip the overflow check here because the int will be small.
  pos += copyTruncatedAsciiChars(buf + pos, sizeof(buf) - pos, ctx, arguments[1], FBSYSTRACE_MAX_SECTION_NAME_LENGTH);
  // Skip the overflow check here because the section name will be small-ish.

  pos = copyArgsToBuffer(buf, sizeof(buf), pos, ctx, argumentCount - 2, arguments + 2);
  if (FBSYSTRACE_UNLIKELY(pos >= sizeof(buf))) {
    goto flush;
  }

flush:
  fbsystrace_trace_raw(buf, min(pos, sizeof(buf)-1));

  return JSValueMakeUndefined(ctx);
}

static JSValueRef nativeTraceEndSection(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  if (FBSYSTRACE_UNLIKELY(argumentCount < 1)) {
    // Could raise an exception here.
    return JSValueMakeUndefined(ctx);
  }

  uint64_t tag = tagFromJSValue(ctx, arguments[0], exception);
  if (!fbsystrace_is_tracing(tag)) {
    return JSValueMakeUndefined(ctx);
  }

  if (FBSYSTRACE_LIKELY(argumentCount == 1)) {
    fbsystrace_end_section(tag);
  } else {
    char buf[FBSYSTRACE_MAX_MESSAGE_LENGTH];
    size_t pos = 0;

    buf[pos++] = 'E';
    buf[pos++] = '|';
    buf[pos++] = '|';
    pos = copyArgsToBuffer(buf, sizeof(buf), pos, ctx, argumentCount - 1, arguments + 1);
    if (FBSYSTRACE_UNLIKELY(pos >= sizeof(buf))) {
      goto flush;
    }

flush:
    fbsystrace_trace_raw(buf, min(pos, sizeof(buf)-1));
  }

  return JSValueMakeUndefined(ctx);
}

static JSValueRef beginOrEndAsync(
    bool isEnd,
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  if (FBSYSTRACE_UNLIKELY(argumentCount < 3)) {
    // Could raise an exception here.
    return JSValueMakeUndefined(ctx);
  }

  uint64_t tag = tagFromJSValue(ctx, arguments[0], exception);
  if (!fbsystrace_is_tracing(tag)) {
    return JSValueMakeUndefined(ctx);
  }

  char buf[FBSYSTRACE_MAX_MESSAGE_LENGTH];
  size_t pos = 0;

  // This uses an if-then-else instruction in ARMv7, which should be cheaper
  // than a full branch.
  buf[pos++] = (isEnd ? 'F' : 'S');
  pos += snprintf(buf + pos, sizeof(buf) - pos, "|%d|", getpid());
  // Skip the overflow check here because the int will be small.
  pos += copyTruncatedAsciiChars(buf + pos, sizeof(buf) - pos, ctx, arguments[1], FBSYSTRACE_MAX_SECTION_NAME_LENGTH);
  // Skip the overflow check here because the section name will be small-ish.

  // I tried some trickery to avoid a branch here, but gcc did not cooperate.
  // We could consider changing the implementation to be lest branchy in the
  // future.
  if (!isEnd) {
    buf[pos++] = '<';
    buf[pos++] = '0';
    buf[pos++] = '>';
  }
  buf[pos++] = '|';

  // Append the cookie.  It should be an integer, but copyTruncatedAsciiChars
  // will automatically convert it to a string.  We might be able to get more
  // performance by just getting the number and doing to string
  // conversion ourselves.  We truncate to FBSYSTRACE_MAX_SECTION_NAME_LENGTH
  // just to make sure we can avoid the overflow check even if the caller
  // passes in something bad.
  pos += copyTruncatedAsciiChars(buf + pos, sizeof(buf) - pos, ctx, arguments[2], FBSYSTRACE_MAX_SECTION_NAME_LENGTH);

  pos = copyArgsToBuffer(buf, sizeof(buf), pos, ctx, argumentCount - 3, arguments + 3);
  if (FBSYSTRACE_UNLIKELY(pos >= sizeof(buf))) {
    goto flush;
  }

flush:
  fbsystrace_trace_raw(buf, min(pos, sizeof(buf)-1));

  return JSValueMakeUndefined(ctx);
}

static JSValueRef nativeTraceBeginAsyncSection(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  return beginOrEndAsync(
      false /* isEnd */,
      ctx,
      function,
      thisObject,
      argumentCount,
      arguments,
      exception);
}

static JSValueRef nativeTraceEndAsyncSection(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  return beginOrEndAsync(
      true /* isEnd */,
      ctx,
      function,
      thisObject,
      argumentCount,
      arguments,
      exception);
}

static JSValueRef nativeTraceAsyncSectionStage(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  if (FBSYSTRACE_UNLIKELY(argumentCount < 4)) {
    // Could raise an exception here.
    return JSValueMakeUndefined(ctx);
  }

  uint64_t tag = tagFromJSValue(ctx, arguments[0], exception);
  if (!fbsystrace_is_tracing(tag)) {
    return JSValueMakeUndefined(ctx);
  }

  char buf[FBSYSTRACE_MAX_MESSAGE_LENGTH];
  size_t pos = 0;

  pos += snprintf(buf + pos, sizeof(buf) - pos, "T|%d", getpid());
  // Skip the overflow check here because the int will be small.

  // Arguments are section name, cookie, and stage name.
  // All added together, they still cannot cause an overflow.
  for (int i = 1; i < 4; i++) {
    buf[pos++] = '|';
    pos += copyTruncatedAsciiChars(buf + pos, sizeof(buf) - pos, ctx, arguments[i], FBSYSTRACE_MAX_SECTION_NAME_LENGTH);
  }

  fbsystrace_trace_raw(buf, min(pos, sizeof(buf)-1));

  return JSValueMakeUndefined(ctx);
}

static JSValueRef nativeTraceCounter(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  if (FBSYSTRACE_UNLIKELY(argumentCount < 3)) {
    // Could raise an exception here.
    return JSValueMakeUndefined(ctx);
  }

  uint64_t tag = tagFromJSValue(ctx, arguments[0], exception);
  if (!fbsystrace_is_tracing(tag)) {
    return JSValueMakeUndefined(ctx);
  }

  char buf[FBSYSTRACE_MAX_MESSAGE_LENGTH];
  size_t len = copyTruncatedAsciiChars(buf, sizeof(buf), ctx,
    arguments[1], FBSYSTRACE_MAX_SECTION_NAME_LENGTH);
  buf[min(len,(FBSYSTRACE_MAX_MESSAGE_LENGTH-1))] = 0;
  int64_t value = int64FromJSValue(ctx, arguments[2], exception);

  fbsystrace_counter(tag, buf, value);

  return JSValueMakeUndefined(ctx);
}

namespace facebook {
namespace react {

void addNativeTracingHooks(JSGlobalContextRef ctx) {
  installGlobalFunction(ctx, "nativeTraceBeginSection", nativeTraceBeginSection);
  installGlobalFunction(ctx, "nativeTraceEndSection", nativeTraceEndSection);
  installGlobalFunction(ctx, "nativeTraceBeginAsyncSection", nativeTraceBeginAsyncSection);
  installGlobalFunction(ctx, "nativeTraceEndAsyncSection", nativeTraceEndAsyncSection);
  installGlobalFunction(ctx, "nativeTraceAsyncSectionStage", nativeTraceAsyncSectionStage);
  installGlobalFunction(ctx, "nativeTraceCounter", nativeTraceCounter);
}

} }
