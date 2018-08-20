// Copyright (c) 2018-present, Facebook, Inc.

// This source code is licensed under the MIT license found in the
// LICENSE file in the root directory of this source tree.

#include "Crypto.h"

#include "JSCHelpers.h"

// FIXME: When we upgrade JSC for Android this will always be supported
#ifdef __APPLE__
#define JSC_HAS_TYPED_ARRAY_SUPPORT
#endif

#ifdef __APPLE__
#import <Security/SecRandom.h>
#else
#include <cstdio>
#endif

namespace facebook {
namespace react {

#ifdef JSC_HAS_TYPED_ARRAY_SUPPORT

static void populateRandomData (JSContextRef ctx, uint8_t *ptr, size_t length, JSValueRef *exception) {
#ifdef __APPLE__
  auto result = SecRandomCopyBytes(kSecRandomDefault, length, ptr);

  if (result != errSecSuccess) {
    JSValueRef errorMsgValue = JSC_JSValueMakeString(ctx, JSC_JSStringCreateWithUTF8CString(ctx, "Failed to retreive random values"));
    JSValueRef args[] = {errorMsgValue};

    JSObjectRef errorObj = JSC_JSObjectMakeError(ctx, 1, args, exception);
    if (*exception != nullptr) return ;

    JSValueRef errorRef = JSC_JSValueToObject(ctx, errorObj, exception);
    if (*exception != nullptr) return ;

    *exception = errorRef;
    return ;
  }
#else
  auto fd = fopen("/dev/urandom", "r");

  if (fd == nullptr) {
    JSValueRef errorMsgValue = JSC_JSValueMakeString(ctx, JSC_JSStringCreateWithUTF8CString(ctx, "Failed to open /dev/urandom"));
    JSValueRef args[] = {errorMsgValue};

    JSObjectRef errorObj = JSC_JSObjectMakeError(ctx, 1, args, exception);
    if (*exception != nullptr) return ;

    JSValueRef errorRef = JSC_JSValueToObject(ctx, errorObj, exception);
    if (*exception != nullptr) return ;

    *exception = errorRef;
    return ;
  }

  auto result = fread(ptr, 1, length, fd);

  fclose(fd);

  if (result != length) {
    JSValueRef errorMsgValue = JSC_JSValueMakeString(ctx, JSC_JSStringCreateWithUTF8CString(ctx, "Failed to retreive enough random values"));
    JSValueRef args[] = {errorMsgValue};

    JSObjectRef errorObj = JSC_JSObjectMakeError(ctx, 1, args, exception);
    if (*exception != nullptr) return ;

    JSValueRef errorRef = JSC_JSValueToObject(ctx, errorObj, exception);
    if (*exception != nullptr) return ;

    *exception = errorRef;
    return ;
  }
#endif
}

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

  /* 3. Overwrite all elements of array with cryptographically random values of the appropriate type. */
  populateRandomData(ctx, ptr + offset, length, exception);
  if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

  /* 4. Return array. */
  return arguments[0];
}

#else

static JSValueRef getPropertyNamed(JSContextRef ctx, JSObjectRef object, const char *name, JSValueRef *exception) {
  auto jsPropertyName = JSC_JSStringCreateWithUTF8CString(ctx, name);
  auto value = JSC_JSObjectGetProperty(ctx, object, jsPropertyName, exception);
  JSC_JSStringRelease(ctx, jsPropertyName);
  return value;
}

JSValueRef getRandomValues(JSContextRef ctx, JSObjectRef function, JSObjectRef thisObject, size_t argumentCount, const JSValueRef arguments[], JSValueRef *exception) {
  auto typedArray = JSC_JSValueToObject(ctx, arguments[0], exception);
  if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

  JSValueRef args[3];

  args[0] = getPropertyNamed(ctx, typedArray, "buffer", exception);
  if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

  args[1] = getPropertyNamed(ctx, typedArray, "byteOffset", exception);
  if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

  args[2] = getPropertyNamed(ctx, typedArray, "byteLength", exception);
  if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

  auto byteLength = JSC_JSValueToNumber(ctx, args[2], exception);
  if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

  /* 2. If the byteLength of array is greater than 65536, throw a QuotaExceededError and terminate the algorithm. */
  if (byteLength > 65536) {
    JSValueRef errorMsgValue = JSC_JSValueMakeString(ctx, JSC_JSStringCreateWithUTF8CString(ctx, "QuotaExceededError"));
    JSValueRef args[] = {errorMsgValue};

    JSObjectRef errorObj = JSC_JSObjectMakeError(ctx, 1, args, exception);
    if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

    JSValueRef errorRef = JSC_JSValueToObject(ctx, errorObj, exception);
    if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

    *exception = errorRef;
    return JSC_JSValueMakeUndefined(ctx);
  }

  JSObjectRef global = JSC_JSContextGetGlobalObject(ctx);
  JSValueRef constructorValue = getPropertyNamed(ctx, global, "Uint8Array", exception);
  if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

  JSObjectRef constructor = JSC_JSValueToObject(ctx, constructorValue, exception);
  if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

  JSObjectRef view = JSC_JSObjectCallAsConstructor(ctx, constructor, 3, args, exception);
  if (*exception != nullptr) return JSC_JSValueMakeUndefined(ctx);

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
  for (auto idx = 0; idx < byteLength; idx++) {
    auto randomByte = JSC_JSValueMakeNumber(ctx, fgetc(fd));
    JSC_JSObjectSetPropertyAtIndex(ctx, view, idx, randomByte, exception);

    if (*exception != nullptr) {
      fclose(fd);
      return JSC_JSValueMakeUndefined(ctx);
    }
  }

  fclose(fd);

  /* 4. Return array. */
  return arguments[0];
}

#endif

} }
