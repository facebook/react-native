// Copyright 2004-present Facebook. All Rights Reserved.

#include "JSCTracing.h"

#if defined(WITH_FBSYSTRACE) && (defined(WITH_JSC_EXTRA_TRACING) || DEBUG)
#define USE_JSCTRACING 1
#else
#define USE_JSCTRACING 0
#endif

#if USE_JSCTRACING

#include <algorithm>
#include <fbsystrace.h>
#include <sys/types.h>
#include <unistd.h>

#include <jschelpers/JavaScriptCore.h>
#include <jschelpers/JSCHelpers.h>
#include <jschelpers/Value.h>

using std::min;
using namespace facebook::react;

static int64_t int64FromJSValue(JSContextRef ctx, JSValueRef value, JSValueRef* exception) {
  return static_cast<int64_t>(JSC_JSValueToNumber(ctx, value, exception));
}

static size_t copyTruncatedAsciiChars(
    char* buf,
    size_t bufLen,
    JSContextRef ctx,
    JSValueRef value,
    size_t maxLen) {
  JSStringRef jsString = JSC_JSValueToStringCopy(ctx, value, NULL);
  size_t stringLen = JSC_JSStringGetLength(ctx, jsString);
  // Unlike the Java version, we truncate from the end of the string,
  // rather than the beginning.
  size_t toWrite = min(stringLen, min(bufLen, maxLen));

  const char *startBuf = buf;
  const JSChar* chars = JSC_JSStringGetCharactersPtr(ctx, jsString);
  while (toWrite-- > 0) {
    *(buf++) = (char)*(chars++);
  }

  JSC_JSStringRelease(ctx, jsString);

  // Return the number of bytes written
  return buf - startBuf;
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
    if (exception) {
      *exception = Value::makeError(
        ctx,
        "nativeTraceBeginSection: requires at least 2 arguments");
    }
    return Value::makeUndefined(ctx);
  }

  uint64_t tag = int64FromJSValue(ctx, arguments[0], exception);
  if (!fbsystrace_is_tracing(tag)) {
    return Value::makeUndefined(ctx);
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

  return Value::makeUndefined(ctx);
}

static JSValueRef nativeTraceEndSection(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  if (FBSYSTRACE_UNLIKELY(argumentCount < 1)) {
    if (exception) {
      *exception = Value::makeError(
        ctx,
        "nativeTraceEndSection: requires at least 1 argument");
    }
    return Value::makeUndefined(ctx);
  }

  uint64_t tag = int64FromJSValue(ctx, arguments[0], exception);
  if (!fbsystrace_is_tracing(tag)) {
    return Value::makeUndefined(ctx);
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

  return Value::makeUndefined(ctx);
}

static JSValueRef beginOrEndAsync(
    bool isEnd,
    bool isFlow,
    JSContextRef ctx,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  if (FBSYSTRACE_UNLIKELY(argumentCount < 3)) {
    if (exception) {
      *exception = Value::makeError(
        ctx,
        "beginOrEndAsync: requires at least 3 arguments");
    }
    return Value::makeUndefined(ctx);
  }

  uint64_t tag = int64FromJSValue(ctx, arguments[0], exception);
  if (!fbsystrace_is_tracing(tag)) {
    return Value::makeUndefined(ctx);
  }

  char buf[FBSYSTRACE_MAX_MESSAGE_LENGTH];
  size_t pos = 0;

  // This uses an if-then-else instruction in ARMv7, which should be cheaper
  // than a full branch.
  buf[pos++] = ((isFlow) ? (isEnd ? 'f' : 's') : (isEnd ? 'F' : 'S'));
  pos += snprintf(buf + pos, sizeof(buf) - pos, "|%d|", getpid());
  // Skip the overflow check here because the int will be small.
  pos += copyTruncatedAsciiChars(buf + pos, sizeof(buf) - pos, ctx, arguments[1], FBSYSTRACE_MAX_SECTION_NAME_LENGTH);
  // Skip the overflow check here because the section name will be small-ish.

  // I tried some trickery to avoid a branch here, but gcc did not cooperate.
  // We could consider changing the implementation to be lest branchy in the
  // future.
  // This is not required for flow use an or to avoid introducing another branch
  if (!(isEnd | isFlow)) {
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

  return Value::makeUndefined(ctx);
}

static JSValueRef nativeTraceBeginAsyncSection(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  return beginOrEndAsync(false /* isEnd */, false /* isFlow */,
    ctx, argumentCount, arguments, exception);
}

static JSValueRef nativeTraceEndAsyncSection(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  return beginOrEndAsync(true /* isEnd */, false /* isFlow */,
      ctx, argumentCount, arguments, exception);
}

static JSValueRef nativeTraceBeginAsyncFlow(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  return beginOrEndAsync(false /* isEnd */, true /* isFlow */,
      ctx, argumentCount, arguments, exception);
}

static JSValueRef nativeTraceEndAsyncFlow(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  return beginOrEndAsync(true /* isEnd */, true /* isFlow */,
      ctx, argumentCount, arguments, exception);
}

static JSValueRef nativeTraceCounter(
    JSContextRef ctx,
    JSObjectRef function,
    JSObjectRef thisObject,
    size_t argumentCount,
    const JSValueRef arguments[],
    JSValueRef* exception) {
  if (FBSYSTRACE_UNLIKELY(argumentCount < 3)) {
    if (exception) {
      *exception = Value::makeError(
        ctx,
        "nativeTraceCounter: requires at least 3 arguments");
    }
    return Value::makeUndefined(ctx);
  }

  uint64_t tag = int64FromJSValue(ctx, arguments[0], exception);
  if (!fbsystrace_is_tracing(tag)) {
    return Value::makeUndefined(ctx);
  }

  char buf[FBSYSTRACE_MAX_MESSAGE_LENGTH];
  size_t len = copyTruncatedAsciiChars(buf, sizeof(buf), ctx,
    arguments[1], FBSYSTRACE_MAX_SECTION_NAME_LENGTH);
  buf[min(len,(FBSYSTRACE_MAX_MESSAGE_LENGTH-1))] = 0;
  int64_t value = int64FromJSValue(ctx, arguments[2], exception);

  fbsystrace_counter(tag, buf, value);

  return Value::makeUndefined(ctx);
}

#endif

namespace facebook {
namespace react {

void addNativeTracingHooks(JSGlobalContextRef ctx) {
#if USE_JSCTRACING
  installGlobalFunction(ctx, "nativeTraceBeginSection", nativeTraceBeginSection);
  installGlobalFunction(ctx, "nativeTraceEndSection", nativeTraceEndSection);
  installGlobalFunction(ctx, "nativeTraceBeginAsyncSection", nativeTraceBeginAsyncSection);
  installGlobalFunction(ctx, "nativeTraceEndAsyncSection", nativeTraceEndAsyncSection);
  installGlobalFunction(ctx, "nativeTraceBeginAsyncFlow", nativeTraceBeginAsyncFlow);
  installGlobalFunction(ctx, "nativeTraceEndAsyncFlow", nativeTraceEndAsyncFlow);
  installGlobalFunction(ctx, "nativeTraceCounter", nativeTraceCounter);
#endif
}

} }
