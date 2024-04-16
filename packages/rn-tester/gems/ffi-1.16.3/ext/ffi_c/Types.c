/*
 * Copyright (c) 2009, Wayne Meissner
 * Copyright (c) 2009, Luc Heinrich
 * Copyright (c) 2009, Aman Gupta.
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

#include <ruby.h>
#include "Pointer.h"
#include "rbffi.h"
#include "Function.h"
#include "StructByValue.h"
#include "Types.h"
#include "Struct.h"
#include "MappedType.h"
#include "MemoryPointer.h"
#include "LongDouble.h"

static ID id_from_native = 0;


VALUE
rbffi_NativeValue_ToRuby(Type* type, VALUE rbType, const void* ptr)
{
    switch (type->nativeType) {
        case NATIVE_VOID:
            return Qnil;
        case NATIVE_INT8:
          return INT2NUM((signed char) *(ffi_sarg *) ptr);
        case NATIVE_INT16:
          return INT2NUM((signed short) *(ffi_sarg *) ptr);
        case NATIVE_INT32:
          return INT2NUM((signed int) *(ffi_sarg *) ptr);
        case NATIVE_LONG:
            return LONG2NUM((signed long) *(ffi_sarg *) ptr);
        case NATIVE_INT64:
            return LL2NUM(*(signed long long *) ptr);

        case NATIVE_UINT8:
          return UINT2NUM((unsigned char) *(ffi_arg *) ptr);
        case NATIVE_UINT16:
          return UINT2NUM((unsigned short) *(ffi_arg *) ptr);
        case NATIVE_UINT32:
          return UINT2NUM((unsigned int) *(ffi_arg *) ptr);
        case NATIVE_ULONG:
            return ULONG2NUM((unsigned long) *(ffi_arg *) ptr);
        case NATIVE_UINT64:
            return ULL2NUM(*(unsigned long long *) ptr);

        case NATIVE_FLOAT32:
            return rb_float_new(*(float *) ptr);
        case NATIVE_FLOAT64:
            return rb_float_new(*(double *) ptr);

        case NATIVE_LONGDOUBLE:
	  return rbffi_longdouble_new(*(long double *) ptr);

        case NATIVE_STRING:
            return (*(void **) ptr != NULL) ? rb_str_new2(*(char **) ptr) : Qnil;
        case NATIVE_POINTER:
            return rbffi_Pointer_NewInstance(*(void **) ptr);
        case NATIVE_BOOL:
            return ((unsigned char) *(ffi_arg *) ptr) ? Qtrue : Qfalse;

        case NATIVE_FUNCTION: {
            return *(void **) ptr != NULL
                    ? rbffi_Function_NewInstance(rbType, rbffi_Pointer_NewInstance(*(void **) ptr))
                    : Qnil;
        }

        case NATIVE_STRUCT: {
            StructByValue* sbv = (StructByValue *)type;
            AbstractMemory* mem;
            VALUE rbMemory = rbffi_MemoryPointer_NewInstance(1, sbv->base.ffiType->size, false);

            TypedData_Get_Struct(rbMemory, AbstractMemory, &rbffi_abstract_memory_data_type, mem);
            memcpy(mem->address, ptr, sbv->base.ffiType->size);
            RB_GC_GUARD(rbMemory);
            RB_GC_GUARD(rbType);

            return rb_class_new_instance(1, &rbMemory, sbv->rbStructClass);
        }

        case NATIVE_MAPPED: {
            /*
             * For mapped types, first convert to the real native type, then upcall to
             * ruby to convert to the expected return type
             */
            MappedType* m = (MappedType *) type;
            VALUE values[2], rbReturnValue;

            values[0] = rbffi_NativeValue_ToRuby(m->type, m->rbType, ptr);
            values[1] = Qnil;


            rbReturnValue = rb_funcall2(m->rbConverter, id_from_native, 2, values);
            RB_GC_GUARD(values[0]);
            RB_GC_GUARD(rbType);

            return rbReturnValue;
        }

        default:
            rb_raise(rb_eRuntimeError, "Unknown type: %d", type->nativeType);
            return Qnil;
    }
}

void
rbffi_Types_Init(VALUE moduleFFI)
{
    id_from_native = rb_intern("from_native");
}

