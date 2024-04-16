/*
 * Copyright (c) 2008, 2009, Wayne Meissner
 * Copyright (C) 2009 Aman Gupta <aman@tmm1.net>
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
#include <sys/types.h>
#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>
#include <errno.h>
#include <ruby.h>

#include "LastError.h"

#if defined(HAVE_NATIVETHREAD) && !defined(_WIN32) && !defined(__WIN32__)
# include <pthread.h>
# define USE_PTHREAD_LOCAL
#endif

#if defined(__CYGWIN__)
typedef uint32_t DWORD;
DWORD __stdcall GetLastError(void);
void __stdcall SetLastError(DWORD);
#endif

typedef struct ThreadData {
    int td_errno;
#if defined(_WIN32) || defined(__CYGWIN__)
    DWORD td_winapi_errno;
#endif
} ThreadData;

#if defined(USE_PTHREAD_LOCAL)
static pthread_key_t threadDataKey;
#endif

static inline ThreadData* thread_data_get(void);

#if defined(USE_PTHREAD_LOCAL)

static ThreadData*
thread_data_init(void)
{
    ThreadData* td = xcalloc(1, sizeof(ThreadData));

    pthread_setspecific(threadDataKey, td);

    return td;
}


static inline ThreadData*
thread_data_get(void)
{
    ThreadData* td = pthread_getspecific(threadDataKey);
    return td != NULL ? td : thread_data_init();
}

static void
thread_data_free(void *ptr)
{
    xfree(ptr);
}

#else
static size_t
thread_data_memsize(const void *data) {
    return sizeof(ThreadData);
}

static const rb_data_type_t thread_data_data_type = {
    .wrap_struct_name = "FFI::ThreadData",
    .function = {
        .dmark = NULL,
        .dfree = RUBY_TYPED_DEFAULT_FREE,
        .dsize = thread_data_memsize,
    },
    // IMPORTANT: WB_PROTECTED objects must only use the RB_OBJ_WRITE()
    // macro to update VALUE references, as to trigger write barriers.
    .flags = RUBY_TYPED_FREE_IMMEDIATELY | RUBY_TYPED_WB_PROTECTED
};

static ID id_thread_data;

static ThreadData*
thread_data_init(void)
{
    ThreadData *td;
    VALUE obj;

    obj = TypedData_Make_Struct(rb_cObject, ThreadData, &thread_data_data_type, td);
    rb_thread_local_aset(rb_thread_current(), id_thread_data, obj);

    return td;
}

static inline ThreadData*
thread_data_get(void)
{
    VALUE obj = rb_thread_local_aref(rb_thread_current(), id_thread_data);

    if (NIL_P(obj)) {
        return thread_data_init();
    }

    ThreadData *td;
    TypedData_Get_Struct(obj, ThreadData, &thread_data_data_type, td);
    return td;
}

#endif


/*
 * call-seq: error
 * @return [Numeric]
 * Get +errno+ value.
 */
static VALUE
get_last_error(VALUE self)
{
    return INT2NUM(thread_data_get()->td_errno);
}

#if defined(_WIN32) || defined(__CYGWIN__)
/*
 * call-seq: winapi_error
 * @return [Numeric]
 * Get +GetLastError()+ value. Only Windows or Cygwin.
 */
static VALUE
get_last_winapi_error(VALUE self)
{
    return INT2NUM(thread_data_get()->td_winapi_errno);
}
#endif


/*
 * call-seq: error(error)
 * @param [Numeric] error
 * @return [nil]
 * Set +errno+ value.
 */
static VALUE
set_last_error(VALUE self, VALUE error)
{
#ifdef _WIN32
    SetLastError(NUM2INT(error));
#else
    errno = NUM2INT(error);
#endif

    return Qnil;
}

#if defined(_WIN32) || defined(__CYGWIN__)
/*
 * call-seq: error(error)
 * @param [Numeric] error
 * @return [nil]
 * Set +GetLastError()+ value. Only on Windows and Cygwin.
 */
static VALUE
set_last_winapi_error(VALUE self, VALUE error)
{
    SetLastError(NUM2INT(error));
    return Qnil;
}
#endif


void
rbffi_save_errno(void)
{
    int error = 0;
#ifdef _WIN32
    error = GetLastError();
#else
    error = errno;
#endif

#if defined(_WIN32) || defined(__CYGWIN__)
    DWORD winapi_error = GetLastError();
    thread_data_get()->td_winapi_errno = winapi_error;
#endif

    thread_data_get()->td_errno = error;
}

void
rbffi_LastError_Init(VALUE moduleFFI)
{
    /*
     * Document-module: FFI::LastError
     * This module defines a couple of method to set and get +errno+
     * for current thread.
     */
    VALUE moduleError = rb_define_module_under(moduleFFI, "LastError");

    rb_define_module_function(moduleError, "error", get_last_error, 0);
    rb_define_module_function(moduleError, "error=", set_last_error, 1);

#if defined(_WIN32) || defined(__CYGWIN__)
    rb_define_module_function(moduleError, "winapi_error", get_last_winapi_error, 0);
    rb_define_module_function(moduleError, "winapi_error=", set_last_winapi_error, 1);
#endif

#if defined(USE_PTHREAD_LOCAL)
    pthread_key_create(&threadDataKey, thread_data_free);
#else
    id_thread_data = rb_intern("ffi_thread_local_data");
#endif /* USE_PTHREAD_LOCAL */
}

