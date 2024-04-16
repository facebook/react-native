/*
 * Copyright (c) 2009, 2010 Wayne Meissner
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
#include <sys/param.h>
#endif
#include <sys/types.h>
#ifndef _WIN32
# include <sys/mman.h>
#endif
#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>
#ifndef _WIN32
# include <unistd.h>
#endif
#include <errno.h>
#include <ruby.h>
#if defined(HAVE_NATIVETHREAD) && !defined(_WIN32) && !defined(__WIN32__)
# include <pthread.h>
#endif

#include <ffi.h>
#include "rbffi.h"
#include "compat.h"

#include "Function.h"
#include "Types.h"
#include "Type.h"
#include "LastError.h"
#include "Call.h"
#include "ClosurePool.h"
#include "MethodHandle.h"


#define MAX_METHOD_FIXED_ARITY (6)

#ifndef roundup
#  define roundup(x, y)   ((((x)+((y)-1))/(y))*(y))
#endif

#ifdef USE_RAW
#  define METHOD_CLOSURE ffi_raw_closure
#  define METHOD_PARAMS ffi_raw*
#else
#  define METHOD_CLOSURE ffi_closure
#  define METHOD_PARAMS void**
#endif



static bool prep_trampoline(void* ctx, void* code, Closure* closure, char* errmsg, size_t errmsgsize);
static long trampoline_size(void);

#if defined(__x86_64__) && \
    (defined(__linux__) || defined(__APPLE__)) && \
    !USE_FFI_ALLOC
# define CUSTOM_TRAMPOLINE 1
#endif


struct MethodHandle {
    Closure* closure;
};

static ClosurePool* defaultClosurePool;


MethodHandle*
rbffi_MethodHandle_Alloc(FunctionType* fnInfo, void* function)
{
    MethodHandle* handle;
    Closure* closure = rbffi_Closure_Alloc(defaultClosurePool);
    if (closure == NULL) {
        rb_raise(rb_eNoMemError, "failed to allocate closure from pool");
        return NULL;
    }

    handle = xcalloc(1, sizeof(*handle));
    handle->closure = closure;
    closure->info = fnInfo;
    closure->function = function;

    return handle;
}

void
rbffi_MethodHandle_Free(MethodHandle* handle)
{
    if (handle != NULL) {
        rbffi_Closure_Free(handle->closure);
        xfree(handle);
    }
}

rbffi_function_anyargs rbffi_MethodHandle_CodeAddress(MethodHandle* handle)
{
    return (rbffi_function_anyargs) handle->closure->code;
}

#ifndef CUSTOM_TRAMPOLINE
static void attached_method_invoke(ffi_cif* cif, void* retval, METHOD_PARAMS parameters, void* user_data);

static ffi_type* methodHandleParamTypes[3];

static ffi_cif mh_cif;

static bool
prep_trampoline(void* ctx, void* code, Closure* closure, char* errmsg, size_t errmsgsize)
{
    ffi_status ffiStatus;

#if defined(USE_RAW)
    ffiStatus = ffi_prep_raw_closure(code, &mh_cif, attached_method_invoke, closure);
#else
    ffiStatus = ffi_prep_closure_loc(closure->pcl, &mh_cif, attached_method_invoke, closure, code);
#endif
    if (ffiStatus != FFI_OK) {
        snprintf(errmsg, errmsgsize, "ffi_prep_closure_loc failed.  status=%#x", ffiStatus);
        return false;
    }

    return true;
}


static long
trampoline_size(void)
{
    return sizeof(METHOD_CLOSURE);
}

/*
 * attached_method_invoke is used functions with more than 6 parameters, or
 * with struct param or return values
 */
static void
attached_method_invoke(ffi_cif* cif, void* mretval, METHOD_PARAMS parameters, void* user_data)
{
    Closure* handle =  (Closure *) user_data;
    FunctionType* fnInfo = (FunctionType *) handle->info;

#ifdef USE_RAW
    int argc = parameters[0].sint;
    VALUE* argv = *(VALUE **) &parameters[1];
#else
    int argc = *(int *) parameters[0];
    VALUE* argv = *(VALUE **) parameters[1];
#endif

    *(VALUE *) mretval = (*fnInfo->invoke)(argc, argv, handle->function, fnInfo);
}

#endif



#if defined(CUSTOM_TRAMPOLINE)
#if defined(__x86_64__)

static VALUE custom_trampoline(int argc, VALUE* argv, VALUE self, Closure*);

#define TRAMPOLINE_CTX_MAGIC (0xfee1deadcafebabe)
#define TRAMPOLINE_FUN_MAGIC (0xfeedfacebeeff00d)

/*
 * This is a hand-coded trampoline to speedup entry from ruby to the FFI translation
 * layer for x86_64 arches.
 *
 * Since a ruby function has exactly 3 arguments, and the first 6 arguments are
 * passed in registers for x86_64, we can tack on a context pointer by simply
 * putting a value in %rcx, then jumping to the C trampoline code.
 *
 * This results in approx a 30% speedup for x86_64 FFI dispatch
 */
__asm__(
    ".text\n\t"
    ".globl ffi_trampoline\n\t"
    ".globl _ffi_trampoline\n\t"
    "ffi_trampoline:\n\t"
    "_ffi_trampoline:\n\t"
    "movabsq $0xfee1deadcafebabe, %rcx\n\t"
    "movabsq $0xfeedfacebeeff00d, %r11\n\t"
    "jmpq *%r11\n\t"
    ".globl ffi_trampoline_end\n\t"
    "ffi_trampoline_end:\n\t"
    ".globl _ffi_trampoline_end\n\t"
    "_ffi_trampoline_end:\n\t"
);

static VALUE
custom_trampoline(int argc, VALUE* argv, VALUE self, Closure* handle)
{
    FunctionType* fnInfo = (FunctionType *) handle->info;
    VALUE rbReturnValue;

    RB_GC_GUARD(rbReturnValue) = (*fnInfo->invoke)(argc, argv, handle->function, fnInfo);
    RB_GC_GUARD(self);

    return rbReturnValue;
}

#elif defined(__i386__) && 0

static VALUE custom_trampoline(void *args, Closure*);
#define TRAMPOLINE_CTX_MAGIC (0xfee1dead)
#define TRAMPOLINE_FUN_MAGIC (0xbeefcafe)

/*
 * This is a hand-coded trampoline to speed-up entry from ruby to the FFI translation
 * layer for i386 arches.
 *
 * This does not make a discernible difference vs a raw closure, so for now,
 * it is not enabled.
 */
__asm__(
    ".text\n\t"
    ".globl ffi_trampoline\n\t"
    ".globl _ffi_trampoline\n\t"
    "ffi_trampoline:\n\t"
    "_ffi_trampoline:\n\t"
    "subl    $12, %esp\n\t"
    "leal    16(%esp), %eax\n\t"
    "movl    %eax, (%esp)\n\t"
    "movl    $0xfee1dead, 4(%esp)\n\t"
    "movl    $0xbeefcafe, %eax\n\t"
    "call    *%eax\n\t"
    "addl    $12, %esp\n\t"
    "ret\n\t"
    ".globl ffi_trampoline_end\n\t"
    "ffi_trampoline_end:\n\t"
    ".globl _ffi_trampoline_end\n\t"
    "_ffi_trampoline_end:\n\t"
);

static VALUE
custom_trampoline(void *args, Closure* handle)
{
    FunctionType* fnInfo = (FunctionType *) handle->info;
    return (*fnInfo->invoke)(*(int *) args, *(VALUE **) (args + 4), handle->function, fnInfo);
}

#endif /* __x86_64__ else __i386__ */

extern void ffi_trampoline(int argc, VALUE* argv, VALUE self);
extern void ffi_trampoline_end(void);
static int trampoline_offsets(long *, long *);

static long trampoline_ctx_offset, trampoline_func_offset;

static long
trampoline_offset(int off, const long value)
{
    char *ptr;
    for (ptr = (char *) &ffi_trampoline + off; ptr < (char *) &ffi_trampoline_end; ++ptr) {
        if (*(long *) ptr == value) {
            return ptr - (char *) &ffi_trampoline;
        }
    }

    return -1;
}

static int
trampoline_offsets(long* ctxOffset, long* fnOffset)
{
    *ctxOffset = trampoline_offset(0, TRAMPOLINE_CTX_MAGIC);
    if (*ctxOffset == -1) {
        return -1;
    }

    *fnOffset = trampoline_offset(0, TRAMPOLINE_FUN_MAGIC);
    if (*fnOffset == -1) {
        return -1;
    }

    return 0;
}

static bool
prep_trampoline(void* ctx, void* code, Closure* closure, char* errmsg, size_t errmsgsize)
{
    memcpy(code, (void*) &ffi_trampoline, trampoline_size());
    /* Patch the context and function addresses into the stub code */
    *(intptr_t *)((char*)code + trampoline_ctx_offset) = (intptr_t) closure;
    *(intptr_t *)((char*)code + trampoline_func_offset) = (intptr_t) custom_trampoline;

    return true;
}

static long
trampoline_size(void)
{
    return (char *) &ffi_trampoline_end - (char *) &ffi_trampoline;
}

#endif /* CUSTOM_TRAMPOLINE */


void
rbffi_MethodHandle_Init(VALUE module)
{
#ifndef CUSTOM_TRAMPOLINE
    ffi_status ffiStatus;
#endif

    defaultClosurePool = rbffi_ClosurePool_New((int) trampoline_size(), prep_trampoline, NULL);

#if defined(CUSTOM_TRAMPOLINE)
    if (trampoline_offsets(&trampoline_ctx_offset, &trampoline_func_offset) != 0) {
        rb_raise(rb_eFatal, "Could not locate offsets in trampoline code");
    }
#else
    methodHandleParamTypes[0] = &ffi_type_sint;
    methodHandleParamTypes[1] = &ffi_type_pointer;
    methodHandleParamTypes[2] = &ffi_type_ulong;

    ffiStatus = ffi_prep_cif(&mh_cif, FFI_DEFAULT_ABI, 3, &ffi_type_ulong,
            methodHandleParamTypes);
    if (ffiStatus != FFI_OK) {
        rb_raise(rb_eFatal, "ffi_prep_cif failed.  status=%#x", ffiStatus);
    }

#endif
}
