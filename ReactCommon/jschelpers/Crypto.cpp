// Copyright (c) 2018-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "Crypto.h"

#include "JSCHelpers.h"

#ifdef __APPLE__
#import <Security/SecRandom.h>
#else
#include <cstdio>
#endif

namespace facebook {
namespace react {

JSValueRef getRandomValues(JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef *exception) {
  auto type = JSC_JSValueGetTypedArrayType(ctx, arguments[0], exception);
  if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

  auto typedArray = JSC_JSValueToObject(ctx, arguments[0], exception);
  if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

  /* 1. If array is not of an integer type (i.e., Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array or UInt8ClampedArray), throw a TypeMismatchError and terminate the algorithm. */
  if (type == kJSTypedArrayTypeNone) {
    JSValueRef errorMsgValue = JSC_JSValueMakeString(ctx, JSC_JSStringCreateWithUTF8CString(ctx, "TypeMismatchError"));
    JSValueRef args[] = {errorMsgValue};

    JSObjectRef errorObj = JSC_JSObjectMakeError(ctx, 1, args, exception);
    if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

    JSValueRef errorRef = JSC_JSValueToObject(ctx, errorObj, exception);
    if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

    *exception = errorRef;
    return JSC_JSValueMakeUndefined(ctx);
  }

  auto length = JSC_JSObjectGetTypedArrayLength(ctx, typedArray, exception);
  if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

  /* 2. If the byteLength of array is greater than 65536, throw a QuotaExceededError and terminate the algorithm. */
  if (length > 65536) {
    JSValueRef errorMsgValue = JSC_JSValueMakeString(ctx, JSC_JSStringCreateWithUTF8CString(ctx, "QuotaExceededError"));
    JSValueRef args[] = {errorMsgValue};

    JSObjectRef errorObj = JSC_JSObjectMakeError(ctx, 1, args, exception);
    if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

    JSValueRef errorRef = JSC_JSValueToObject(ctx, errorObj, exception);
    if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

    *exception = errorRef;
    return JSC_JSValueMakeUndefined(ctx);
  }

  uint8_t *ptr = static_cast<uint8_t*>(JSC_JSObjectGetTypedArrayBytesPtr(ctx, typedArray, exception));
  if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

  auto offset = JSC_JSObjectGetTypedArrayByteOffset(ctx, typedArray, exception);
  if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

#ifdef __APPLE__
  auto result = SecRandomCopyBytes(kSecRandomDefault, length, ptr + offset);

  if (result != errSecSuccess) {
    JSValueRef errorMsgValue = JSC_JSValueMakeString(ctx, JSC_JSStringCreateWithUTF8CString(ctx, "Failed to retreive random values"));
    JSValueRef args[] = {errorMsgValue};

    JSObjectRef errorObj = JSC_JSObjectMakeError(ctx, 1, args, exception);
    if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

    JSValueRef errorRef = JSC_JSValueToObject(ctx, errorObj, exception);
    if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

    *exception = errorRef;
    return JSC_JSValueMakeUndefined(ctx);
  }
#else
  auto fd = fopen("/dev/urandom", "r");

  if (fd == nullptr) {
    JSValueRef errorMsgValue = JSC_JSValueMakeString(ctx, JSC_JSStringCreateWithUTF8CString(ctx, "Failed to open /dev/urandom"));
    JSValueRef args[] = {errorMsgValue};

    JSObjectRef errorObj = JSC_JSObjectMakeError(ctx, 1, args, exception);
    if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

    JSValueRef errorRef = JSC_JSValueToObject(ctx, errorObj, exception);
    if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

    *exception = errorRef;
    return JSC_JSValueMakeUndefined(ctx);
  }

  /* 3. Overwrite all elements of array with cryptographically random values of the appropriate type. */
  auto result = fread(ptr + offset, 1, length, fd);

  fclose(fd);

  if (result != length) {
    JSValueRef errorMsgValue = JSC_JSValueMakeString(ctx, JSC_JSStringCreateWithUTF8CString(ctx, "Failed to retreive enough random values"));
    JSValueRef args[] = {errorMsgValue};

    JSObjectRef errorObj = JSC_JSObjectMakeError(ctx, 1, args, exception);
    if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

    JSValueRef errorRef = JSC_JSValueToObject(ctx, errorObj, exception);
    if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

    *exception = errorRef;
    return JSC_JSValueMakeUndefined(ctx);
  }
#endif

  /* 4. Return array. */
  return arguments[0];
}

} }
