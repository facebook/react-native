/*
 * Copyright (c) 2008-2010 Wayne Meissner
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

#ifndef _MSC_VER
# include <sys/param.h>
#endif
# include <sys/types.h>
#include <stdint.h>
#include <stdbool.h>
#include <ruby.h>
#include <ctype.h>
#include "rbffi_endian.h"
#include "Platform.h"

#if defined(__GNU__) || (defined(__GLIBC__) && !defined(__UCLIBC__))
# include <gnu/lib-names.h>
#endif

static VALUE PlatformModule = Qnil;

static void
export_primitive_types(VALUE module)
{
#define S(name, T) do { \
    typedef struct { char c; T v; } s; \
    rb_define_const(module, #name "_ALIGN", INT2NUM((sizeof(s) - sizeof(T)) * 8)); \
    rb_define_const(module, #name "_SIZE", INT2NUM(sizeof(T)* 8)); \
} while(0)
    S(INT8, char);
    S(INT16, short);
    S(INT32, int);
    S(INT64, long long);
    S(LONG, long);
    S(FLOAT, float);
    S(DOUBLE, double);
    S(LONG_DOUBLE, long double);
    S(ADDRESS, void*);
#undef S
}

void
rbffi_Platform_Init(VALUE moduleFFI)
{
    PlatformModule = rb_define_module_under(moduleFFI, "Platform");
    rb_define_const(PlatformModule, "BYTE_ORDER", INT2FIX(BYTE_ORDER));
    rb_define_const(PlatformModule, "LITTLE_ENDIAN", INT2FIX(LITTLE_ENDIAN));
    rb_define_const(PlatformModule, "BIG_ENDIAN", INT2FIX(BIG_ENDIAN));
#if defined(__GNU__) || (defined(__GLIBC__) && !defined(__UCLIBC__))
    rb_define_const(PlatformModule, "GNU_LIBC", rb_str_new2(LIBC_SO));
#endif
    export_primitive_types(PlatformModule);
}
