/*
 * Copyright (C) 2006 Apple Inc.  All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef JSValueRef_h
#define JSValueRef_h

#include <JavaScriptCore/JSBase.h>
#include <JavaScriptCore/WebKitAvailability.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif

/*!
@enum JSType
@abstract     A constant identifying the type of a JSValue.
@constant     kJSTypeUndefined  The unique undefined value.
@constant     kJSTypeNull       The unique null value.
@constant     kJSTypeBoolean    A primitive boolean value, one of true or false.
@constant     kJSTypeNumber     A primitive number value.
@constant     kJSTypeString     A primitive string value.
@constant     kJSTypeObject     An object value (meaning that this JSValueRef is a JSObjectRef).
*/
typedef enum {
    kJSTypeUndefined,
    kJSTypeNull,
    kJSTypeBoolean,
    kJSTypeNumber,
    kJSTypeString,
    kJSTypeObject
} JSType;

/*!
 @enum JSTypedArrayType
 @abstract     A constant identifying the Typed Array type of a JSObjectRef.
 @constant     kJSTypedArrayTypeInt8Array            Int8Array
 @constant     kJSTypedArrayTypeInt16Array           Int16Array
 @constant     kJSTypedArrayTypeInt32Array           Int32Array
 @constant     kJSTypedArrayTypeUint8Array           Uint8Array
 @constant     kJSTypedArrayTypeUint8ClampedArray    Uint8ClampedArray
 @constant     kJSTypedArrayTypeUint16Array          Uint16Array
 @constant     kJSTypedArrayTypeUint32Array          Uint32Array
 @constant     kJSTypedArrayTypeFloat32Array         Float32Array
 @constant     kJSTypedArrayTypeFloat64Array         Float64Array
 @constant     kJSTypedArrayTypeArrayBuffer          ArrayBuffer
 @constant     kJSTypedArrayTypeNone                 Not a Typed Array

 */
typedef enum {
    kJSTypedArrayTypeInt8Array,
    kJSTypedArrayTypeInt16Array,
    kJSTypedArrayTypeInt32Array,
    kJSTypedArrayTypeUint8Array,
    kJSTypedArrayTypeUint8ClampedArray,
    kJSTypedArrayTypeUint16Array,
    kJSTypedArrayTypeUint32Array,
    kJSTypedArrayTypeFloat32Array,
    kJSTypedArrayTypeFloat64Array,
    kJSTypedArrayTypeArrayBuffer,
    kJSTypedArrayTypeNone,
} JSTypedArrayType CF_ENUM_AVAILABLE(10_12, 10_0);

#ifdef __cplusplus
extern "C" {
#endif

/*!
@function
@abstract       Returns a JavaScript value's type.
@param ctx  The execution context to use.
@param value    The JSValue whose type you want to obtain.
@result         A value of type JSType that identifies value's type.
*/
JS_EXPORT JSType JSValueGetType(JSContextRef ctx, JSValueRef value);

/*!
@function
@abstract       Tests whether a JavaScript value's type is the undefined type.
@param ctx  The execution context to use.
@param value    The JSValue to test.
@result         true if value's type is the undefined type, otherwise false.
*/
JS_EXPORT bool JSValueIsUndefined(JSContextRef ctx, JSValueRef value);

/*!
@function
@abstract       Tests whether a JavaScript value's type is the null type.
@param ctx  The execution context to use.
@param value    The JSValue to test.
@result         true if value's type is the null type, otherwise false.
*/
JS_EXPORT bool JSValueIsNull(JSContextRef ctx, JSValueRef value);

/*!
@function
@abstract       Tests whether a JavaScript value's type is the boolean type.
@param ctx  The execution context to use.
@param value    The JSValue to test.
@result         true if value's type is the boolean type, otherwise false.
*/
JS_EXPORT bool JSValueIsBoolean(JSContextRef ctx, JSValueRef value);

/*!
@function
@abstract       Tests whether a JavaScript value's type is the number type.
@param ctx  The execution context to use.
@param value    The JSValue to test.
@result         true if value's type is the number type, otherwise false.
*/
JS_EXPORT bool JSValueIsNumber(JSContextRef ctx, JSValueRef value);

/*!
@function
@abstract       Tests whether a JavaScript value's type is the string type.
@param ctx  The execution context to use.
@param value    The JSValue to test.
@result         true if value's type is the string type, otherwise false.
*/
JS_EXPORT bool JSValueIsString(JSContextRef ctx, JSValueRef value);

/*!
@function
@abstract       Tests whether a JavaScript value's type is the object type.
@param ctx  The execution context to use.
@param value    The JSValue to test.
@result         true if value's type is the object type, otherwise false.
*/
JS_EXPORT bool JSValueIsObject(JSContextRef ctx, JSValueRef value);

/*!
@function
@abstract Tests whether a JavaScript value is an object with a given class in its class chain.
@param ctx The execution context to use.
@param value The JSValue to test.
@param jsClass The JSClass to test against.
@result true if value is an object and has jsClass in its class chain, otherwise false.
*/
JS_EXPORT bool JSValueIsObjectOfClass(JSContextRef ctx, JSValueRef value, JSClassRef jsClass);

/*!
@function
@abstract       Tests whether a JavaScript value is an array.
@param ctx      The execution context to use.
@param value    The JSValue to test.
@result         true if value is an array, otherwise false.
*/
JS_EXPORT bool JSValueIsArray(JSContextRef ctx, JSValueRef value) CF_AVAILABLE(10_11, 9_0);

/*!
@function
@abstract       Tests whether a JavaScript value is a date.
@param ctx      The execution context to use.
@param value    The JSValue to test.
@result         true if value is a date, otherwise false.
*/
JS_EXPORT bool JSValueIsDate(JSContextRef ctx, JSValueRef value) CF_AVAILABLE(10_11, 9_0);

/*!
@function
@abstract           Returns a JavaScript value's Typed Array type.
@param ctx          The execution context to use.
@param value        The JSValue whose Typed Array type to return.
@param exception    A pointer to a JSValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
@result             A value of type JSTypedArrayType that identifies value's Typed Array type, or kJSTypedArrayTypeNone if the value is not a Typed Array object.
 */
JS_EXPORT JSTypedArrayType JSValueGetTypedArrayType(JSContextRef ctx, JSValueRef value, JSValueRef* exception) CF_AVAILABLE(10_12, 10_0);

/* Comparing values */

/*!
@function
@abstract Tests whether two JavaScript values are equal, as compared by the JS == operator.
@param ctx The execution context to use.
@param a The first value to test.
@param b The second value to test.
@param exception A pointer to a JSValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
@result true if the two values are equal, false if they are not equal or an exception is thrown.
*/
JS_EXPORT bool JSValueIsEqual(JSContextRef ctx, JSValueRef a, JSValueRef b, JSValueRef* exception);

/*!
@function
@abstract       Tests whether two JavaScript values are strict equal, as compared by the JS === operator.
@param ctx  The execution context to use.
@param a        The first value to test.
@param b        The second value to test.
@result         true if the two values are strict equal, otherwise false.
*/
JS_EXPORT bool JSValueIsStrictEqual(JSContextRef ctx, JSValueRef a, JSValueRef b);

/*!
@function
@abstract Tests whether a JavaScript value is an object constructed by a given constructor, as compared by the JS instanceof operator.
@param ctx The execution context to use.
@param value The JSValue to test.
@param constructor The constructor to test against.
@param exception A pointer to a JSValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
@result true if value is an object constructed by constructor, as compared by the JS instanceof operator, otherwise false.
*/
JS_EXPORT bool JSValueIsInstanceOfConstructor(JSContextRef ctx, JSValueRef value, JSObjectRef constructor, JSValueRef* exception);

/* Creating values */

/*!
@function
@abstract       Creates a JavaScript value of the undefined type.
@param ctx  The execution context to use.
@result         The unique undefined value.
*/
JS_EXPORT JSValueRef JSValueMakeUndefined(JSContextRef ctx);

/*!
@function
@abstract       Creates a JavaScript value of the null type.
@param ctx  The execution context to use.
@result         The unique null value.
*/
JS_EXPORT JSValueRef JSValueMakeNull(JSContextRef ctx);

/*!
@function
@abstract       Creates a JavaScript value of the boolean type.
@param ctx  The execution context to use.
@param boolean  The bool to assign to the newly created JSValue.
@result         A JSValue of the boolean type, representing the value of boolean.
*/
JS_EXPORT JSValueRef JSValueMakeBoolean(JSContextRef ctx, bool boolean);

/*!
@function
@abstract       Creates a JavaScript value of the number type.
@param ctx  The execution context to use.
@param number   The double to assign to the newly created JSValue.
@result         A JSValue of the number type, representing the value of number.
*/
JS_EXPORT JSValueRef JSValueMakeNumber(JSContextRef ctx, double number);

/*!
@function
@abstract       Creates a JavaScript value of the string type.
@param ctx  The execution context to use.
@param string   The JSString to assign to the newly created JSValue. The
 newly created JSValue retains string, and releases it upon garbage collection.
@result         A JSValue of the string type, representing the value of string.
*/
JS_EXPORT JSValueRef JSValueMakeString(JSContextRef ctx, JSStringRef string);

/* Converting to and from JSON formatted strings */

/*!
 @function
 @abstract       Creates a JavaScript value from a JSON formatted string.
 @param ctx      The execution context to use.
 @param string   The JSString containing the JSON string to be parsed.
 @result         A JSValue containing the parsed value, or NULL if the input is invalid.
 */
JS_EXPORT JSValueRef JSValueMakeFromJSONString(JSContextRef ctx, JSStringRef string) CF_AVAILABLE(10_7, 7_0);

/*!
 @function
 @abstract       Creates a JavaScript string containing the JSON serialized representation of a JS value.
 @param ctx      The execution context to use.
 @param value    The value to serialize.
 @param indent   The number of spaces to indent when nesting.  If 0, the resulting JSON will not contains newlines.  The size of the indent is clamped to 10 spaces.
 @param exception A pointer to a JSValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
 @result         A JSString with the result of serialization, or NULL if an exception is thrown.
 */
JS_EXPORT JSStringRef JSValueCreateJSONString(JSContextRef ctx, JSValueRef value, unsigned indent, JSValueRef* exception) CF_AVAILABLE(10_7, 7_0);

/* Converting to primitive values */

/*!
@function
@abstract       Converts a JavaScript value to boolean and returns the resulting boolean.
@param ctx  The execution context to use.
@param value    The JSValue to convert.
@result         The boolean result of conversion.
*/
JS_EXPORT bool JSValueToBoolean(JSContextRef ctx, JSValueRef value);

/*!
@function
@abstract       Converts a JavaScript value to number and returns the resulting number.
@param ctx  The execution context to use.
@param value    The JSValue to convert.
@param exception A pointer to a JSValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
@result         The numeric result of conversion, or NaN if an exception is thrown.
*/
JS_EXPORT double JSValueToNumber(JSContextRef ctx, JSValueRef value, JSValueRef* exception);

/*!
@function
@abstract       Converts a JavaScript value to string and copies the result into a JavaScript string.
@param ctx  The execution context to use.
@param value    The JSValue to convert.
@param exception A pointer to a JSValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
@result         A JSString with the result of conversion, or NULL if an exception is thrown. Ownership follows the Create Rule.
*/
JS_EXPORT JSStringRef JSValueToStringCopy(JSContextRef ctx, JSValueRef value, JSValueRef* exception);

/*!
@function
@abstract Converts a JavaScript value to object and returns the resulting object.
@param ctx  The execution context to use.
@param value    The JSValue to convert.
@param exception A pointer to a JSValueRef in which to store an exception, if any. Pass NULL if you do not care to store an exception.
@result         The JSObject result of conversion, or NULL if an exception is thrown.
*/
JS_EXPORT JSObjectRef JSValueToObject(JSContextRef ctx, JSValueRef value, JSValueRef* exception);

/* Garbage collection */
/*!
@function
@abstract Protects a JavaScript value from garbage collection.
@param ctx The execution context to use.
@param value The JSValue to protect.
@discussion Use this method when you want to store a JSValue in a global or on the heap, where the garbage collector will not be able to discover your reference to it.
 
A value may be protected multiple times and must be unprotected an equal number of times before becoming eligible for garbage collection.
*/
JS_EXPORT void JSValueProtect(JSContextRef ctx, JSValueRef value);

/*!
@function
@abstract       Unprotects a JavaScript value from garbage collection.
@param ctx      The execution context to use.
@param value    The JSValue to unprotect.
@discussion     A value may be protected multiple times and must be unprotected an 
 equal number of times before becoming eligible for garbage collection.
*/
JS_EXPORT void JSValueUnprotect(JSContextRef ctx, JSValueRef value);

#ifdef __cplusplus
}
#endif

#endif /* JSValueRef_h */
