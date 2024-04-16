/*
 * Copyright (c) 2009, Wayne Meissner
 * Copyright (c) 2009, Luc Heinrich <luc@honk-honk.com>
 * Copyright (c) 2009, Mike Dalessio <mike.dalessio@gmail.com>
 * Copyright (c) 2009, Aman Gupta.
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
#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>
#include <errno.h>
#include <ruby.h>
#include <ruby/thread.h>
#if defined(HAVE_NATIVETHREAD) && !defined(_WIN32)
#  include <signal.h>
#  include <pthread.h>
#endif
#include <ffi.h>
#include "extconf.h"
#include "rbffi.h"
#include "compat.h"
#include "AbstractMemory.h"
#include "Pointer.h"
#include "Struct.h"
#include "Function.h"
#include "Type.h"
#include "LastError.h"
#include "Call.h"
#include "MappedType.h"
#include "Thread.h"
#include "LongDouble.h"

#ifdef USE_RAW
#  ifndef __i386__
#    error "RAW argument packing only supported on i386"
#  endif

#define INT8_ADJ (4)
#define INT16_ADJ (4)
#define INT32_ADJ (4)
#define INT64_ADJ (8)
#define LONG_ADJ (sizeof(long))
#define FLOAT32_ADJ (4)
#define FLOAT64_ADJ (8)
#define ADDRESS_ADJ (sizeof(void *))
#define LONGDOUBLE_ADJ (ffi_type_longdouble.alignment > sizeof(long double) ? ffi_type_longdouble.alignment : sizeof(long double))

#endif /* USE_RAW */

#ifdef USE_RAW
#  define ADJ(p, a) ((p) = (FFIStorage*) (((char *) p) + a##_ADJ))
#else
#  define ADJ(p, a) (++(p))
#endif

static void* callback_param(VALUE proc, VALUE cbinfo);
static inline void* getPointer(VALUE value, int type);

static ID id_to_ptr, id_map_symbol, id_to_native;

void
rbffi_SetupCallParams(int argc, VALUE* argv, int paramCount, Type** paramTypes,
        FFIStorage* paramStorage, void** ffiValues,
        VALUE* callbackParameters, int callbackCount, VALUE enums)
{
    VALUE callbackProc = Qnil;
    FFIStorage* param = &paramStorage[0];
    int i, argidx, cbidx, argCount;

    if (unlikely(paramCount != -1 && paramCount != argc)) {
        if (argc == (paramCount - 1) && callbackCount == 1 && rb_block_given_p()) {
            callbackProc = rb_block_proc();
        } else {
            rb_raise(rb_eArgError, "wrong number of arguments (%d for %d)", argc, paramCount);
        }
    }

    argCount = paramCount != -1 ? paramCount : argc;

    for (i = 0, argidx = 0, cbidx = 0; i < argCount; ++i) {
        Type* paramType = paramTypes[i];
        int type;


        if (unlikely(paramType->nativeType == NATIVE_MAPPED)) {
            VALUE values[] = { argv[argidx], Qnil };
            argv[argidx] = rb_funcall2(((MappedType *) paramType)->rbConverter, id_to_native, 2, values);
            paramType = ((MappedType *) paramType)->type;
        }

        type = argidx < argc ? TYPE(argv[argidx]) : T_NONE;
        ffiValues[i] = param;

        switch (paramType->nativeType) {

            case NATIVE_INT8:
                if (unlikely(type == T_SYMBOL && enums != Qnil)) {
                    VALUE value = rb_funcall(enums, id_map_symbol, 1, argv[argidx]);
                    param->s8 = NUM2INT(value);
                } else {
                    param->s8 = NUM2INT(argv[argidx]);
                }

                ++argidx;
                ADJ(param, INT8);
                break;

            case NATIVE_INT16:
                if (unlikely(type == T_SYMBOL && enums != Qnil)) {
                    VALUE value = rb_funcall(enums, id_map_symbol, 1, argv[argidx]);
                    param->s16 = NUM2INT(value);

                } else {
                    param->s16 = NUM2INT(argv[argidx]);
                }

                ++argidx;
                ADJ(param, INT16);
                break;

            case NATIVE_INT32:
                if (unlikely(type == T_SYMBOL && enums != Qnil)) {
                    VALUE value = rb_funcall(enums, id_map_symbol, 1, argv[argidx]);
                    param->s32 = NUM2INT(value);

                } else {
                    param->s32 = NUM2INT(argv[argidx]);
                }

                ++argidx;
                ADJ(param, INT32);
                break;

            case NATIVE_BOOL:
                if (type != T_TRUE && type != T_FALSE) {
                    rb_raise(rb_eTypeError, "wrong argument type  (expected a boolean parameter)");
                }
                param->s8 = argv[argidx++] == Qtrue;
                ADJ(param, INT8);
                break;

            case NATIVE_UINT8:
                if (unlikely(type == T_SYMBOL && enums != Qnil)) {
                    VALUE value = rb_funcall(enums, id_map_symbol, 1, argv[argidx]);
                    param->u8 = NUM2UINT(value);
                } else {
                    param->u8 = NUM2UINT(argv[argidx]);
                }

                ADJ(param, INT8);
                ++argidx;
                break;

            case NATIVE_UINT16:
                if (unlikely(type == T_SYMBOL && enums != Qnil)) {
                    VALUE value = rb_funcall(enums, id_map_symbol, 1, argv[argidx]);
                    param->u16 = NUM2UINT(value);
                } else {
                    param->u16 = NUM2UINT(argv[argidx]);
                }

                ADJ(param, INT16);
                ++argidx;
                break;

            case NATIVE_UINT32:
                if (unlikely(type == T_SYMBOL && enums != Qnil)) {
                    VALUE value = rb_funcall(enums, id_map_symbol, 1, argv[argidx]);
                    param->u32 = NUM2UINT(value);
                } else {
                    param->u32 = NUM2UINT(argv[argidx]);
                }

                ADJ(param, INT32);
                ++argidx;
                break;

            case NATIVE_INT64:
                if (unlikely(type == T_SYMBOL && enums != Qnil)) {
                    VALUE value = rb_funcall(enums, id_map_symbol, 1, argv[argidx]);
                    param->i64 = NUM2LL(value);
                } else {
                    param->i64 = NUM2LL(argv[argidx]);
                }

                ADJ(param, INT64);
                ++argidx;
                break;

            case NATIVE_UINT64:
                if (unlikely(type == T_SYMBOL && enums != Qnil)) {
                    VALUE value = rb_funcall(enums, id_map_symbol, 1, argv[argidx]);
                    param->u64 = NUM2ULL(value);
                } else {
                    param->u64 = NUM2ULL(argv[argidx]);
                }

                ADJ(param, INT64);
                ++argidx;
                break;

            case NATIVE_LONG:
                if (unlikely(type == T_SYMBOL && enums != Qnil)) {
                    VALUE value = rb_funcall(enums, id_map_symbol, 1, argv[argidx]);
                    *(ffi_sarg *) param = NUM2LONG(value);
                } else {
                    *(ffi_sarg *) param = NUM2LONG(argv[argidx]);
                }

                ADJ(param, LONG);
                ++argidx;
                break;

            case NATIVE_ULONG:
                if (unlikely(type == T_SYMBOL && enums != Qnil)) {
                    VALUE value = rb_funcall(enums, id_map_symbol, 1, argv[argidx]);
                    *(ffi_arg *) param = NUM2ULONG(value);
                } else {
                    *(ffi_arg *) param = NUM2ULONG(argv[argidx]);
                }

                ADJ(param, LONG);
                ++argidx;
                break;

            case NATIVE_FLOAT32:
                if (unlikely(type == T_SYMBOL && enums != Qnil)) {
                    VALUE value = rb_funcall(enums, id_map_symbol, 1, argv[argidx]);
                    param->f32 = (float) NUM2DBL(value);
                } else {
                    param->f32 = (float) NUM2DBL(argv[argidx]);
                }

                ADJ(param, FLOAT32);
                ++argidx;
                break;

            case NATIVE_FLOAT64:
                if (unlikely(type == T_SYMBOL && enums != Qnil)) {
                    VALUE value = rb_funcall(enums, id_map_symbol, 1, argv[argidx]);
                    param->f64 = NUM2DBL(value);
                } else {
                    param->f64 = NUM2DBL(argv[argidx]);
                }

                ADJ(param, FLOAT64);
                ++argidx;
                break;

            case NATIVE_LONGDOUBLE:
                if (unlikely(type == T_SYMBOL && enums != Qnil)) {
                    VALUE value = rb_funcall(enums, id_map_symbol, 1, argv[argidx]);
                    param->ld = rbffi_num2longdouble(value);
                } else {
                    param->ld = rbffi_num2longdouble(argv[argidx]);
                }

                ADJ(param, LONGDOUBLE);
                ++argidx;
                break;


            case NATIVE_STRING:
                if (type == T_NIL) {
                    param->ptr = NULL;

                } else {
                    param->ptr = StringValueCStr(argv[argidx]);
                }

                ADJ(param, ADDRESS);
                ++argidx;
                break;

            case NATIVE_POINTER:
            case NATIVE_BUFFER_IN:
            case NATIVE_BUFFER_OUT:
            case NATIVE_BUFFER_INOUT:
                param->ptr = getPointer(argv[argidx++], type);
                ADJ(param, ADDRESS);
                break;


            case NATIVE_FUNCTION:
                if (callbackProc != Qnil) {
                    param->ptr = callback_param(callbackProc, callbackParameters[cbidx++]);
                } else {
                    param->ptr = callback_param(argv[argidx], callbackParameters[cbidx++]);
                    ++argidx;
                }
                ADJ(param, ADDRESS);
                break;

            case NATIVE_STRUCT:
                ffiValues[i] = getPointer(argv[argidx++], type);
                break;

            default:
                rb_raise(rb_eArgError, "Invalid parameter type: %d", paramType->nativeType);
        }
    }
}

static void *
call_blocking_function(void* data)
{
    rbffi_blocking_call_t* b = (rbffi_blocking_call_t *) data;
    ffi_call(&b->cif, FFI_FN(b->function), b->retval, b->ffiValues);

    return NULL;
}

VALUE
rbffi_do_blocking_call(VALUE data)
{
    rb_thread_call_without_gvl(call_blocking_function, (void*)data, (rb_unblock_function_t *) -1, NULL);

    return Qnil;
}

VALUE
rbffi_save_frame_exception(VALUE data, VALUE exc)
{
    rbffi_frame_t* frame = (rbffi_frame_t *) data;
    frame->exc = exc;
    return Qnil;
}

VALUE
rbffi_CallFunction(int argc, VALUE* argv, void* function, FunctionType* fnInfo)
{
    void* retval;
    void** ffiValues;
    FFIStorage* params;
    VALUE rbReturnValue;
    rbffi_frame_t frame = { 0 };

    retval = alloca(MAX(fnInfo->ffi_cif.rtype->size, FFI_SIZEOF_ARG));

    if (unlikely(fnInfo->blocking)) {
        rbffi_blocking_call_t* bc;

        /* allocate information passed to the blocking function on the stack */
        ffiValues = ALLOCA_N(void *, fnInfo->parameterCount);
        params = ALLOCA_N(FFIStorage, fnInfo->parameterCount);
        bc = ALLOCA_N(rbffi_blocking_call_t, 1);
        bc->retval = retval;
        bc->cif = fnInfo->ffi_cif;
        bc->function = function;
        bc->ffiValues = ffiValues;
        bc->params = params;
        bc->frame = &frame;

        rbffi_SetupCallParams(argc, argv,
            fnInfo->parameterCount, fnInfo->parameterTypes, params, ffiValues,
            fnInfo->callbackParameters, fnInfo->callbackCount, fnInfo->rbEnums);

        rbffi_frame_push(&frame);
        rb_rescue2(rbffi_do_blocking_call, (VALUE) bc, rbffi_save_frame_exception, (VALUE) &frame, rb_eException, (VALUE) 0);
        rbffi_frame_pop(&frame);

    } else {

        ffiValues = ALLOCA_N(void *, fnInfo->parameterCount);
        params = ALLOCA_N(FFIStorage, fnInfo->parameterCount);

        rbffi_SetupCallParams(argc, argv,
            fnInfo->parameterCount, fnInfo->parameterTypes, params, ffiValues,
            fnInfo->callbackParameters, fnInfo->callbackCount, fnInfo->rbEnums);

        rbffi_frame_push(&frame);
        ffi_call(&fnInfo->ffi_cif, FFI_FN(function), retval, ffiValues);
        rbffi_frame_pop(&frame);
    }

    if (unlikely(!fnInfo->ignoreErrno)) {
        rbffi_save_errno();
    }

    if (RTEST(frame.exc) && frame.exc != Qnil) {
        rb_exc_raise(frame.exc);
    }

    RB_GC_GUARD(rbReturnValue) = rbffi_NativeValue_ToRuby(fnInfo->returnType, fnInfo->rbReturnType, retval);
    RB_GC_GUARD(fnInfo->rbReturnType);

    return rbReturnValue;
}

static inline void*
getPointer(VALUE value, int type)
{
    if (likely(type == T_DATA && rb_obj_is_kind_of(value, rbffi_AbstractMemoryClass))) {

        AbstractMemory *mem;
        TypedData_Get_Struct(value, AbstractMemory, &rbffi_abstract_memory_data_type, mem);
        return mem->address;

    } else if (type == T_DATA && rb_obj_is_kind_of(value, rbffi_StructClass)) {

        Struct* s;
        AbstractMemory* memory;

        TypedData_Get_Struct(value, Struct, &rbffi_struct_data_type, s);
        memory = s->pointer;
        return memory != NULL ? memory->address : NULL;

    } else if (type == T_STRING) {

        return StringValuePtr(value);

    } else if (type == T_NIL) {

        return NULL;

    } else if (rb_respond_to(value, id_to_ptr)) {

        VALUE ptr = rb_funcall2(value, id_to_ptr, 0, NULL);
        if (rb_obj_is_kind_of(ptr, rbffi_AbstractMemoryClass) && TYPE(ptr) == T_DATA) {
            AbstractMemory *mem;
            TypedData_Get_Struct(ptr, AbstractMemory, &rbffi_abstract_memory_data_type, mem);
            return mem->address;
        }
        rb_raise(rb_eArgError, "to_ptr returned an invalid pointer");
    }

    rb_raise(rb_eArgError, ":pointer argument is not a valid pointer");
    return NULL;
}

Invoker
rbffi_GetInvoker(FunctionType *fnInfo)
{
    return rbffi_CallFunction;
}


static void*
callback_param(VALUE proc, VALUE cbInfo)
{
    VALUE callback;
    AbstractMemory *mem;

    if (unlikely(proc == Qnil)) {
        return NULL ;
    }

    /* Handle Function pointers here */
    if (rb_obj_is_kind_of(proc, rbffi_FunctionClass)) {
        AbstractMemory* ptr;
        TypedData_Get_Struct(proc, AbstractMemory, &rbffi_abstract_memory_data_type, ptr);
        return ptr->address;
    }

    callback = rbffi_Function_ForProc(cbInfo, proc);
    RB_GC_GUARD(callback);

    TypedData_Get_Struct(callback, AbstractMemory, &rbffi_abstract_memory_data_type, mem);
    return mem->address;
}


void
rbffi_Call_Init(VALUE moduleFFI)
{
    id_to_ptr = rb_intern("to_ptr");
    id_to_native = rb_intern("to_native");
    id_map_symbol = rb_intern("__map_symbol");
}

