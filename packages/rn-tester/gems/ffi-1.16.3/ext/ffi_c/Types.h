/*
 * Copyright (c) 2008, 2009, Wayne Meissner
 * Copyright (c) 2009, Luc Heinrich <luc@honk-honk.com>
 *
 * Copyright (c) 2008-2013, Ruby FFI project contributors
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *     * Redistributions of source code must retain the above copyright
 *       notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above copyright
 *       notice, this list of conditions and the following disclaimer in the
 *       documentation and/or other materials provided with the distribution.
 *     * Neither the name of the Ruby FFI project nor the
 *       names of its contributors may be used to endorse or promote products
 *       derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef RBFFI_TYPES_H
#define	RBFFI_TYPES_H

#ifdef	__cplusplus
extern "C" {
#endif

typedef enum {
    NATIVE_VOID,
    NATIVE_INT8,
    NATIVE_UINT8,
    NATIVE_INT16,
    NATIVE_UINT16,
    NATIVE_INT32,
    NATIVE_UINT32,
    NATIVE_INT64,
    NATIVE_UINT64,
    NATIVE_LONG,
    NATIVE_ULONG,
    NATIVE_FLOAT32,
    NATIVE_FLOAT64,
    NATIVE_LONGDOUBLE,
    NATIVE_POINTER,
    NATIVE_FUNCTION,
    NATIVE_BUFFER_IN,
    NATIVE_BUFFER_OUT,
    NATIVE_BUFFER_INOUT,
    NATIVE_CHAR_ARRAY,
    NATIVE_BOOL,

    /** An immutable string.  Nul terminated, but only copies in to the native function */
    NATIVE_STRING,

    /** The function takes a variable number of arguments */
    NATIVE_VARARGS,

    /** Struct-by-value param or result */
    NATIVE_STRUCT,

    /** An array type definition */
    NATIVE_ARRAY,

    /** Custom native type */
    NATIVE_MAPPED,
} NativeType;

#include <ffi.h>
#include "Type.h"

VALUE rbffi_NativeValue_ToRuby(Type* type, VALUE rbType, const void* ptr);
void rbffi_Types_Init(VALUE moduleFFI);

#ifdef	__cplusplus
}
#endif

#endif	/* RBFFI_TYPES_H */

