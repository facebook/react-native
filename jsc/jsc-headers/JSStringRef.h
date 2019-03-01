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

#ifndef JSStringRef_h
#define JSStringRef_h

#include <JavaScriptCore/JSValueRef.h>

#ifndef __cplusplus
#include <stdbool.h>
#endif
#include <stddef.h> /* for size_t */

#ifdef __cplusplus
extern "C" {
#endif

#if !defined(_NATIVE_WCHAR_T_DEFINED) /* MSVC */ \
    && (!defined(__WCHAR_MAX__) || (__WCHAR_MAX__ > 0xffffU)) /* ISO C/C++ */ \
    && (!defined(WCHAR_MAX) || (WCHAR_MAX > 0xffffU)) /* RVCT */
/*!
@typedef JSChar
@abstract A UTF-16 code unit. One, or a sequence of two, can encode any Unicode
 character. As with all scalar types, endianness depends on the underlying
 architecture.
*/
    typedef unsigned short JSChar;
#else
    typedef wchar_t JSChar;
#endif

/*!
@function
@abstract         Creates a JavaScript string from a buffer of Unicode characters.
@param chars      The buffer of Unicode characters to copy into the new JSString.
@param numChars   The number of characters to copy from the buffer pointed to by chars.
@result           A JSString containing chars. Ownership follows the Create Rule.
*/
JS_EXPORT JSStringRef JSStringCreateWithCharacters(const JSChar* chars, size_t numChars);
/*!
@function
@abstract         Creates a JavaScript string from a null-terminated UTF8 string.
@param string     The null-terminated UTF8 string to copy into the new JSString.
@result           A JSString containing string. Ownership follows the Create Rule.
*/
JS_EXPORT JSStringRef JSStringCreateWithUTF8CString(const char* string);

/*!
@function
@abstract         Retains a JavaScript string.
@param string     The JSString to retain.
@result           A JSString that is the same as string.
*/
JS_EXPORT JSStringRef JSStringRetain(JSStringRef string);
/*!
@function
@abstract         Releases a JavaScript string.
@param string     The JSString to release.
*/
JS_EXPORT void JSStringRelease(JSStringRef string);

/*!
@function
@abstract         Returns the number of Unicode characters in a JavaScript string.
@param string     The JSString whose length (in Unicode characters) you want to know.
@result           The number of Unicode characters stored in string.
*/
JS_EXPORT size_t JSStringGetLength(JSStringRef string);
/*!
@function
@abstract         Returns a pointer to the Unicode character buffer that 
 serves as the backing store for a JavaScript string.
@param string     The JSString whose backing store you want to access.
@result           A pointer to the Unicode character buffer that serves as string's 
 backing store, which will be deallocated when string is deallocated.
*/
JS_EXPORT const JSChar* JSStringGetCharactersPtr(JSStringRef string);

/*!
@function
@abstract Returns the maximum number of bytes a JavaScript string will 
 take up if converted into a null-terminated UTF8 string.
@param string The JSString whose maximum converted size (in bytes) you 
 want to know.
@result The maximum number of bytes that could be required to convert string into a 
 null-terminated UTF8 string. The number of bytes that the conversion actually ends 
 up requiring could be less than this, but never more.
*/
JS_EXPORT size_t JSStringGetMaximumUTF8CStringSize(JSStringRef string);
/*!
@function
@abstract Converts a JavaScript string into a null-terminated UTF8 string, 
 and copies the result into an external byte buffer.
@param string The source JSString.
@param buffer The destination byte buffer into which to copy a null-terminated 
 UTF8 representation of string. On return, buffer contains a UTF8 string 
 representation of string. If bufferSize is too small, buffer will contain only 
 partial results. If buffer is not at least bufferSize bytes in size, 
 behavior is undefined. 
@param bufferSize The size of the external buffer in bytes.
@result The number of bytes written into buffer (including the null-terminator byte).
*/
JS_EXPORT size_t JSStringGetUTF8CString(JSStringRef string, char* buffer, size_t bufferSize);

/*!
@function
@abstract     Tests whether two JavaScript strings match.
@param a      The first JSString to test.
@param b      The second JSString to test.
@result       true if the two strings match, otherwise false.
*/
JS_EXPORT bool JSStringIsEqual(JSStringRef a, JSStringRef b);
/*!
@function
@abstract     Tests whether a JavaScript string matches a null-terminated UTF8 string.
@param a      The JSString to test.
@param b      The null-terminated UTF8 string to test.
@result       true if the two strings match, otherwise false.
*/
JS_EXPORT bool JSStringIsEqualToUTF8CString(JSStringRef a, const char* b);

#ifdef __cplusplus
}
#endif

#endif /* JSStringRef_h */
