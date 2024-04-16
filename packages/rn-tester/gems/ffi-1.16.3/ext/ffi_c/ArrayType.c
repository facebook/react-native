/*
 * Copyright (c) 2009, Wayne Meissner
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
#include <ffi.h>
#include "compat.h"
#include "ArrayType.h"

static VALUE array_type_s_allocate(VALUE klass);
static VALUE array_type_initialize(VALUE self, VALUE rbComponentType, VALUE rbLength);
static void array_type_mark(void *);
static void array_type_compact(void *);
static void array_type_free(void *);
static size_t array_type_memsize(const void *);

const rb_data_type_t rbffi_array_type_data_type = { /* extern */
  .wrap_struct_name = "FFI::ArrayType",
  .function = {
      .dmark = array_type_mark,
      .dfree = array_type_free,
      .dsize = array_type_memsize,
      ffi_compact_callback( array_type_compact )
  },
  .parent = &rbffi_type_data_type,
  // IMPORTANT: WB_PROTECTED objects must only use the RB_OBJ_WRITE()
  // macro to update VALUE references, as to trigger write barriers.
  .flags = RUBY_TYPED_FREE_IMMEDIATELY | RUBY_TYPED_WB_PROTECTED | FFI_RUBY_TYPED_FROZEN_SHAREABLE
};


VALUE rbffi_ArrayTypeClass = Qnil;

static VALUE
array_type_s_allocate(VALUE klass)
{
    ArrayType* array;
    VALUE obj;

    obj = TypedData_Make_Struct(klass, ArrayType, &rbffi_array_type_data_type, array);

    array->base.nativeType = NATIVE_ARRAY;
    array->base.ffiType = xcalloc(1, sizeof(*array->base.ffiType));
    array->base.ffiType->type = FFI_TYPE_STRUCT;
    array->base.ffiType->size = 0;
    array->base.ffiType->alignment = 0;
    RB_OBJ_WRITE(obj, &array->rbComponentType, Qnil);

    return obj;
}

static void
array_type_mark(void *data)
{
    ArrayType *array = (ArrayType *)data;
    rb_gc_mark_movable(array->rbComponentType);
}

static void
array_type_compact(void *data)
{
    ArrayType *array = (ArrayType *)data;
    ffi_gc_location(array->rbComponentType);
}

static void
array_type_free(void *data)
{
    ArrayType *array = (ArrayType *)data;
    xfree(array->base.ffiType);
    xfree(array->ffiTypes);
    xfree(array);
}

static size_t
array_type_memsize(const void *data)
{
    const ArrayType *array = (const ArrayType *)data;
    size_t memsize = sizeof(ArrayType);
    memsize += array->length * sizeof(*array->ffiTypes);
    memsize += sizeof(*array->base.ffiType);
    return memsize;
}

/*
 * call-seq: initialize(component_type, length)
 * @param [Type] component_type
 * @param [Numeric] length
 * @return [self]
 * A new instance of ArrayType.
 */
static VALUE
array_type_initialize(VALUE self, VALUE rbComponentType, VALUE rbLength)
{
    ArrayType* array;
    int i;

    TypedData_Get_Struct(self, ArrayType, &rbffi_array_type_data_type, array);

    array->length = NUM2UINT(rbLength);
    RB_OBJ_WRITE(self, &array->rbComponentType, rbComponentType);
    TypedData_Get_Struct(rbComponentType, Type, &rbffi_type_data_type, array->componentType);

    array->ffiTypes = xcalloc(array->length + 1, sizeof(*array->ffiTypes));
    array->base.ffiType->elements = array->ffiTypes;
    array->base.ffiType->size = array->componentType->ffiType->size * array->length;
    array->base.ffiType->alignment = array->componentType->ffiType->alignment;

    for (i = 0; i < array->length; ++i) {
        array->ffiTypes[i] = array->componentType->ffiType;
    }

    return self;
}

/*
 * call-seq: length
 * @return [Numeric]
 * Get array's length
 */
static VALUE
array_type_length(VALUE self)
{
    ArrayType* array;

    TypedData_Get_Struct(self, ArrayType, &rbffi_array_type_data_type, array);

    return UINT2NUM(array->length);
}

/*
 * call-seq: element_type
 * @return [Type]
 * Get element type.
 */
static VALUE
array_type_element_type(VALUE self)
{
    ArrayType* array;

    TypedData_Get_Struct(self, ArrayType, &rbffi_array_type_data_type, array);

    return array->rbComponentType;
}

void
rbffi_ArrayType_Init(VALUE moduleFFI)
{
    VALUE ffi_Type;

    ffi_Type = rbffi_TypeClass;

    /*
     * Document-class: FFI::ArrayType < FFI::Type
     *
     * This is a typed array. The type is a {NativeType native type}.
     */
    rbffi_ArrayTypeClass = rb_define_class_under(moduleFFI, "ArrayType", ffi_Type);
    /*
     * Document-variable: FFI::ArrayType
     */
    rb_global_variable(&rbffi_ArrayTypeClass);
    /*
     * Document-constant: FFI::Type::Array
     */
    rb_define_const(ffi_Type, "Array", rbffi_ArrayTypeClass);

    rb_define_alloc_func(rbffi_ArrayTypeClass, array_type_s_allocate);
    rb_define_method(rbffi_ArrayTypeClass, "initialize", array_type_initialize, 2);
    rb_define_method(rbffi_ArrayTypeClass, "length", array_type_length, 0);
    rb_define_method(rbffi_ArrayTypeClass, "elem_type", array_type_element_type, 0);
}

