/*
 * Copyright (c) 2008, 2009, Wayne Meissner
 * Copyright (C) 2009 Luc Heinrich <luc@honk-honk.com>
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

#include <sys/types.h>
#ifndef _MSC_VER
# include <sys/param.h>
#endif
#include <stdint.h>
#include <stdbool.h>
#include <ruby.h>
#include "rbffi.h"
#include "compat.h"
#include "AbstractMemory.h"
#include "Pointer.h"
#include "MemoryPointer.h"
#include "Function.h"
#include "Types.h"
#include "Function.h"
#include "StructByValue.h"
#include "ArrayType.h"
#include "MappedType.h"
#include "Struct.h"

typedef struct InlineArray_ {
    VALUE rbMemory;
    VALUE rbField;

    AbstractMemory* memory;
    StructField* field;
    MemoryOp *op;
    Type* componentType;
    ArrayType* arrayType;
    int length;
} InlineArray;


static void struct_mark(void *data);
static void struct_compact(void *data);
static void struct_free(void *data);
static size_t struct_memsize(const void *);
static VALUE struct_class_layout(VALUE klass);
static void struct_malloc(VALUE self, Struct* s);
static void inline_array_mark(void *);
static void inline_array_compact(void *);
static size_t inline_array_memsize(const void *);
static void store_reference_value(VALUE self, StructField* f, Struct* s, VALUE value);

const rb_data_type_t rbffi_struct_data_type = { /* extern */
    .wrap_struct_name = "FFI::Struct",
    .function = {
        .dmark = struct_mark,
        .dfree = struct_free,
        .dsize = struct_memsize,
        ffi_compact_callback( struct_compact )
    },
    // IMPORTANT: WB_PROTECTED objects must only use the RB_OBJ_WRITE()
    // macro to update VALUE references, as to trigger write barriers.
    .flags = RUBY_TYPED_FREE_IMMEDIATELY | RUBY_TYPED_WB_PROTECTED | FFI_RUBY_TYPED_FROZEN_SHAREABLE
};
VALUE rbffi_StructClass = Qnil;

VALUE rbffi_StructInlineArrayClass = Qnil;
VALUE rbffi_StructLayoutCharArrayClass = Qnil;

static ID id_pointer_ivar = 0, id_layout_ivar = 0;
static ID id_get = 0, id_put = 0, id_to_ptr = 0, id_to_s = 0, id_layout = 0;

static inline char*
memory_address(VALUE self)
{
    AbstractMemory *mem;
    TypedData_Get_Struct(self, AbstractMemory, &rbffi_abstract_memory_data_type, mem);
    return mem->address;
}

static VALUE
struct_allocate(VALUE klass)
{
    Struct* s;
    VALUE obj = TypedData_Make_Struct(klass, Struct, &rbffi_struct_data_type, s);

    RB_OBJ_WRITE(obj, &s->rbPointer, Qnil);
    RB_OBJ_WRITE(obj, &s->rbLayout, Qnil);

    return obj;
}

/*
 * call-seq: initialize
 * @overload initialize(pointer, *args)
 *  @param [AbstractMemory] pointer
 *  @param [Array] args
 * @return [self]
 */
static VALUE
struct_initialize(int argc, VALUE* argv, VALUE self)
{
    Struct* s;
    VALUE rbPointer = Qnil, rest = Qnil, klass = CLASS_OF(self);
    int nargs;

    TypedData_Get_Struct(self, Struct, &rbffi_struct_data_type, s);

    nargs = rb_scan_args(argc, argv, "01*", &rbPointer, &rest);

    /* Call up into ruby code to adjust the layout */
    if (nargs > 1) {
        VALUE rbLayout = rb_apply(CLASS_OF(self), id_layout, rest);
        RB_OBJ_WRITE(self, &s->rbLayout, rbLayout);
    } else {
        RB_OBJ_WRITE(self, &s->rbLayout, struct_class_layout(klass));
    }

    if (!rb_obj_is_kind_of(s->rbLayout, rbffi_StructLayoutClass)) {
        rb_raise(rb_eRuntimeError, "Invalid Struct layout");
    }

    TypedData_Get_Struct(s->rbLayout, StructLayout, &rbffi_struct_layout_data_type, s->layout);

    if (rbPointer != Qnil) {
        s->pointer = MEMORY(rbPointer);
        RB_OBJ_WRITE(self, &s->rbPointer, rbPointer);
    } else {
        struct_malloc(self, s);
    }

    return self;
}

/*
 * call-seq: initialize_copy(other)
 * @return [nil]
 * DO NOT CALL THIS METHOD
 */
static VALUE
struct_initialize_copy(VALUE self, VALUE other)
{
    Struct* src;
    Struct* dst;

    TypedData_Get_Struct(self, Struct, &rbffi_struct_data_type, dst);
    TypedData_Get_Struct(other, Struct, &rbffi_struct_data_type, src);
    if (dst == src) {
        return self;
    }

    RB_OBJ_WRITE(self, &dst->rbLayout, src->rbLayout);
    dst->layout = src->layout;

    /*
     * A new MemoryPointer instance is allocated here instead of just calling
     * #dup on rbPointer, since the Pointer may not know its length, or may
     * be longer than just this struct.
     */
    if (src->pointer->address != NULL) {
        RB_OBJ_WRITE(self, &dst->rbPointer, rbffi_MemoryPointer_NewInstance(1, src->layout->size, false));
        dst->pointer = MEMORY(dst->rbPointer);
        memcpy(dst->pointer->address, src->pointer->address, src->layout->size);
    } else {
        RB_OBJ_WRITE(self, &dst->rbPointer, src->rbPointer);
        dst->pointer = src->pointer;
    }

    if (src->layout->referenceFieldCount > 0) {
        size_t index;

        dst->rbReferences = ALLOC_N(VALUE, dst->layout->referenceFieldCount);
        memcpy(dst->rbReferences, src->rbReferences, dst->layout->referenceFieldCount * sizeof(VALUE));
        for ( index = 0; index < dst->layout->referenceFieldCount; index++) {
            RB_OBJ_WRITTEN(self, Qundef, &dst->rbReferences[index]);
        }
    }

    return self;
}

static VALUE
struct_class_layout(VALUE klass)
{
    VALUE layout;
    if (!rb_ivar_defined(klass, id_layout_ivar)) {
        rb_raise(rb_eRuntimeError, "no Struct layout configured for %s", rb_class2name(klass));
    }

    layout = rb_ivar_get(klass, id_layout_ivar);
    if (!rb_obj_is_kind_of(layout, rbffi_StructLayoutClass)) {
        rb_raise(rb_eRuntimeError, "invalid Struct layout for %s", rb_class2name(klass));
    }

    return layout;
}

static StructLayout*
struct_layout(VALUE self)
{
    Struct* s;
    TypedData_Get_Struct(self, Struct, &rbffi_struct_data_type, s);
    if (s->layout != NULL) {
        return s->layout;
    }

    if (s->layout == NULL) {
        RB_OBJ_WRITE(self, &s->rbLayout, struct_class_layout(CLASS_OF(self)));
        TypedData_Get_Struct(s->rbLayout, StructLayout, &rbffi_struct_layout_data_type, s->layout);
    }

    return s->layout;
}

static Struct*
struct_validate(VALUE self)
{
    Struct* s;
    TypedData_Get_Struct(self, Struct, &rbffi_struct_data_type, s);

    if (struct_layout(self) == NULL) {
        rb_raise(rb_eRuntimeError, "struct layout == null");
    }

    if (s->pointer == NULL) {
        struct_malloc(self, s);
    }

    return s;
}

static void
struct_malloc(VALUE self, Struct* s)
{
    if (s->rbPointer == Qnil) {
        RB_OBJ_WRITE(self, &s->rbPointer, rbffi_MemoryPointer_NewInstance(s->layout->size, 1, true));
    } else if (!rb_obj_is_kind_of(s->rbPointer, rbffi_AbstractMemoryClass)) {
        rb_raise(rb_eRuntimeError, "invalid pointer in struct");
    }

    TypedData_Get_Struct(s->rbPointer, AbstractMemory, &rbffi_abstract_memory_data_type, s->pointer);
}

static void
struct_mark(void *data)
{
    Struct *s = (Struct *)data;
    rb_gc_mark_movable(s->rbPointer);
    rb_gc_mark_movable(s->rbLayout);
    if (s->rbReferences != NULL) {
        size_t index;
        for (index = 0; index < s->layout->referenceFieldCount; index++) {
            rb_gc_mark_movable(s->rbReferences[index]);
        }
    }
}

static void
struct_compact(void *data)
{
    Struct *s = (Struct *)data;
    ffi_gc_location(s->rbPointer);
    ffi_gc_location(s->rbLayout);
    if (s->rbReferences != NULL) {
        size_t index;
        for (index = 0; index < s->layout->referenceFieldCount; index++) {
            ffi_gc_location(s->rbReferences[index]);
        }
    }
}

static void
struct_free(void *data)
{
    Struct *s = (Struct *)data;
    xfree(s->rbReferences);
    xfree(s);
}

static size_t
struct_memsize(const void *data)
{
    const Struct *s = (const Struct *)data;
    return sizeof(Struct) + (s->layout->referenceFieldCount * sizeof(VALUE));
}

static void
store_reference_value(VALUE self, StructField* f, Struct* s, VALUE value)
{
    if (unlikely(f->referenceIndex == -1)) {
        rb_raise(rb_eRuntimeError, "put_reference_value called for non-reference type");
        return;
    }
    if (s->rbReferences == NULL) {
        int i;
        s->rbReferences = ALLOC_N(VALUE, s->layout->referenceFieldCount);
        for (i = 0; i < s->layout->referenceFieldCount; ++i) {
            RB_OBJ_WRITE(self, &s->rbReferences[i], Qnil);
        }
    }

    RB_OBJ_WRITE(self, &s->rbReferences[f->referenceIndex], value);
}


static StructField *
struct_field(Struct* s, VALUE fieldName)
{
    StructLayout* layout = s->layout;
    struct field_cache_entry *p_ce = FIELD_CACHE_LOOKUP(layout, fieldName);

    /* Do a hash lookup only if cache entry is empty or fieldName is unexpected? */
    if (unlikely(!SYMBOL_P(fieldName) || !p_ce->fieldName || p_ce->fieldName != fieldName)) {
        VALUE rbField = rb_hash_aref(layout->rbFieldMap, fieldName);
        if (unlikely(NIL_P(rbField))) {
            VALUE str = rb_funcall2(fieldName, id_to_s, 0, NULL);
            rb_raise(rb_eArgError, "No such field '%s'", StringValueCStr(str));
        }
        /* Write the retrieved coder to the cache */
        RB_OBJ_WRITE(s->rbLayout, &p_ce->fieldName, fieldName);
        TypedData_Get_Struct(rbField, StructField, &rbffi_struct_field_data_type, p_ce->field);
    }

    return p_ce->field;
}

/*
 * call-seq: struct[field_name]
 * @param field_name field to access
 * Acces to a Struct field.
 */
static VALUE
struct_aref(VALUE self, VALUE fieldName)
{
    Struct* s;
    StructField* f;

    s = struct_validate(self);

    f = struct_field(s, fieldName);
    if (f->memoryOp != NULL) {
        return (*f->memoryOp->get)(s->pointer, f->offset);

    } else {
        VALUE rbField = rb_hash_aref(s->layout->rbFieldMap, fieldName);
        /* call up to the ruby code to fetch the value */
        return rb_funcall2(rbField, id_get, 1, &s->rbPointer);
    }
}

/*
 * call-seq: []=(field_name, value)
 * @param field_name field to access
 * @param value value to set to +field_name+
 * @return [value]
 * Set a field in Struct.
 */
static VALUE
struct_aset(VALUE self, VALUE fieldName, VALUE value)
{
    Struct* s;
    StructField* f;

    rb_check_frozen(self);
    s = struct_validate(self);

    f = struct_field(s, fieldName);
    if (f->memoryOp != NULL) {

        (*f->memoryOp->put)(s->pointer, f->offset, value);

    } else {
        VALUE rbField = rb_hash_aref(s->layout->rbFieldMap, fieldName);
        /* call up to the ruby code to set the value */
        VALUE argv[2];
        argv[0] = s->rbPointer;
        argv[1] = value;
        rb_funcall2(rbField, id_put, 2, argv);
    }

    if (f->referenceRequired) {
        store_reference_value(self, f, s, value);
    }

    return value;
}

/*
 * call-seq: pointer= pointer
 * @param [AbstractMemory] pointer
 * @return [self]
 * Make Struct point to +pointer+.
 */
static VALUE
struct_set_pointer(VALUE self, VALUE pointer)
{
    Struct* s;
    StructLayout* layout;
    AbstractMemory* memory;

    rb_check_frozen(self);
    if (!rb_obj_is_kind_of(pointer, rbffi_AbstractMemoryClass)) {
        rb_raise(rb_eTypeError, "wrong argument type %s (expected Pointer or Buffer)",
                rb_obj_classname(pointer));
        return Qnil;
    }


    TypedData_Get_Struct(self, Struct, &rbffi_struct_data_type, s);
    TypedData_Get_Struct(pointer, AbstractMemory, &rbffi_abstract_memory_data_type, memory);
    layout = struct_layout(self);

    if ((int) layout->base.ffiType->size > memory->size) {
        rb_raise(rb_eArgError, "memory of %ld bytes too small for struct %s (expected at least %ld)",
                memory->size, rb_obj_classname(self), (long) layout->base.ffiType->size);
    }

    s->pointer = MEMORY(pointer);
    RB_OBJ_WRITE(self, &s->rbPointer, pointer);
    rb_ivar_set(self, id_pointer_ivar, pointer);

    return self;
}

/*
 * call-seq: pointer
 * @return [AbstractMemory]
 * Get pointer to Struct contents.
 */
static VALUE
struct_get_pointer(VALUE self)
{
    Struct* s;

    TypedData_Get_Struct(self, Struct, &rbffi_struct_data_type, s);

    return s->rbPointer;
}

/*
 * call-seq: layout= layout
 * @param [StructLayout] layout
 * @return [self]
 * Set the Struct's layout.
 */
static VALUE
struct_set_layout(VALUE self, VALUE layout)
{
    Struct* s;
    TypedData_Get_Struct(self, Struct, &rbffi_struct_data_type, s);

    rb_check_frozen(self);
    if (!rb_obj_is_kind_of(layout, rbffi_StructLayoutClass)) {
        rb_raise(rb_eTypeError, "wrong argument type %s (expected %s)",
                rb_obj_classname(layout), rb_class2name(rbffi_StructLayoutClass));
        return Qnil;
    }

    TypedData_Get_Struct(layout, StructLayout, &rbffi_struct_layout_data_type, s->layout);
    rb_ivar_set(self, id_layout_ivar, layout);

    return self;
}

/*
 * call-seq: layout
 * @return [StructLayout]
 * Get the Struct's layout.
 */
static VALUE
struct_get_layout(VALUE self)
{
    Struct* s;

    TypedData_Get_Struct(self, Struct, &rbffi_struct_data_type, s);

    return s->rbLayout;
}

/*
 * call-seq: null?
 * @return [Boolean]
 * Test if Struct's pointer is NULL
 */
static VALUE
struct_null_p(VALUE self)
{
    Struct* s;

    TypedData_Get_Struct(self, Struct, &rbffi_struct_data_type, s);

    return s->pointer->address == NULL ? Qtrue : Qfalse;
}

/*
 * (see Pointer#order)
 */
static VALUE
struct_order(int argc, VALUE* argv, VALUE self)
{
    Struct* s;

    TypedData_Get_Struct(self, Struct, &rbffi_struct_data_type, s);
    if (argc == 0) {
        return rb_funcall(s->rbPointer, rb_intern("order"), 0);

    } else {
        VALUE retval = rb_obj_dup(self);
        VALUE rbPointer = rb_funcall2(s->rbPointer, rb_intern("order"), argc, argv);
        struct_set_pointer(retval, rbPointer);

        return retval;
    }
}

static const rb_data_type_t inline_array_data_type = {
    .wrap_struct_name = "FFI::Struct::InlineArray",
    .function = {
        .dmark = inline_array_mark,
        .dfree = RUBY_TYPED_DEFAULT_FREE,
        .dsize = inline_array_memsize,
        ffi_compact_callback( inline_array_compact )
    },
    // IMPORTANT: WB_PROTECTED objects must only use the RB_OBJ_WRITE()
    // macro to update VALUE references, as to trigger write barriers.
    .flags = RUBY_TYPED_FREE_IMMEDIATELY | RUBY_TYPED_WB_PROTECTED | FFI_RUBY_TYPED_FROZEN_SHAREABLE
};

static VALUE
inline_array_allocate(VALUE klass)
{
    InlineArray* array;
    VALUE obj;

    obj = TypedData_Make_Struct(klass, InlineArray, &inline_array_data_type, array);
    RB_OBJ_WRITE(obj, &array->rbMemory, Qnil);
    RB_OBJ_WRITE(obj, &array->rbField, Qnil);

    return obj;
}

static void
inline_array_mark(void *data)
{
    InlineArray *array = (InlineArray *)data;
    rb_gc_mark_movable(array->rbField);
    rb_gc_mark_movable(array->rbMemory);
}

static void
inline_array_compact(void *data)
{
    InlineArray *array = (InlineArray *)data;
    ffi_gc_location(array->rbField);
    ffi_gc_location(array->rbMemory);
}

static size_t
inline_array_memsize(const void *data)
{
    return sizeof(InlineArray);
}

/*
 * Document-method: FFI::Struct::InlineArray#initialize
 * call-seq: initialize(memory, field)
 * @param [AbstractMemory] memory
 * @param [StructField] field
 * @return [self]
 */
static VALUE
inline_array_initialize(VALUE self, VALUE rbMemory, VALUE rbField)
{
    InlineArray* array;

    TypedData_Get_Struct(self, InlineArray, &inline_array_data_type, array);
    RB_OBJ_WRITE(self, &array->rbMemory, rbMemory);
    RB_OBJ_WRITE(self, &array->rbField, rbField);

    TypedData_Get_Struct(rbMemory, AbstractMemory, &rbffi_abstract_memory_data_type, array->memory);
    TypedData_Get_Struct(rbField, StructField, &rbffi_struct_field_data_type, array->field);
    TypedData_Get_Struct(array->field->rbType, ArrayType, &rbffi_array_type_data_type, array->arrayType);
    TypedData_Get_Struct(array->arrayType->rbComponentType, Type, &rbffi_type_data_type, array->componentType);

    array->op = get_memory_op(array->componentType);
    if (array->op == NULL && array->componentType->nativeType == NATIVE_MAPPED) {
        array->op = get_memory_op(((MappedType *) array->componentType)->type);
    }

    array->length = array->arrayType->length;

    return self;
}

/*
 * call-seq: size
 * @return [Numeric]
 * Get size
 */
static VALUE
inline_array_size(VALUE self)
{
    InlineArray* array;

    TypedData_Get_Struct(self, InlineArray, &inline_array_data_type, array);

    return UINT2NUM(((ArrayType *) array->field->type)->length);
}

static int
inline_array_offset(InlineArray* array, int index)
{
    if (index < 0 || (index >= array->length && array->length > 0)) {
        rb_raise(rb_eIndexError, "index %d out of bounds", index);
    }

    return (int) array->field->offset + (index * (int) array->componentType->ffiType->size);
}

/*
 * call-seq: [](index)
 * @param [Numeric] index
 * @return [Type, Struct]
 */
static VALUE
inline_array_aref(VALUE self, VALUE rbIndex)
{
    InlineArray* array;

    TypedData_Get_Struct(self, InlineArray, &inline_array_data_type, array);

    if (array->op != NULL) {
        VALUE rbNativeValue = array->op->get(array->memory,
                inline_array_offset(array, NUM2INT(rbIndex)));
        if (unlikely(array->componentType->nativeType == NATIVE_MAPPED)) {
            return rb_funcall(((MappedType *) array->componentType)->rbConverter,
                    rb_intern("from_native"), 2, rbNativeValue, Qnil);
        } else {
            return rbNativeValue;
        }

    } else if (array->componentType->nativeType == NATIVE_STRUCT) {
        VALUE rbOffset = INT2NUM(inline_array_offset(array, NUM2INT(rbIndex)));
        VALUE rbLength = INT2NUM(array->componentType->ffiType->size);
        VALUE rbPointer = rb_funcall(array->rbMemory, rb_intern("slice"), 2, rbOffset, rbLength);

        return rb_class_new_instance(1, &rbPointer, ((StructByValue *) array->componentType)->rbStructClass);
    } else {

        rb_raise(rb_eArgError, "get not supported for %s", rb_obj_classname(array->arrayType->rbComponentType));
        return Qnil;
    }
}

/*
 * call-seq: []=(index, value)
 * @param [Numeric] index
 * @param [Type, Struct]
 * @return [value]
 */
static VALUE
inline_array_aset(VALUE self, VALUE rbIndex, VALUE rbValue)
{
    InlineArray* array;

    rb_check_frozen(self);
    TypedData_Get_Struct(self, InlineArray, &inline_array_data_type, array);

    if (array->op != NULL) {
        if (unlikely(array->componentType->nativeType == NATIVE_MAPPED)) {
            rbValue = rb_funcall(((MappedType *) array->componentType)->rbConverter,
                    rb_intern("to_native"), 2, rbValue, Qnil);
        }
        array->op->put(array->memory, inline_array_offset(array, NUM2INT(rbIndex)),
            rbValue);

    } else if (array->componentType->nativeType == NATIVE_STRUCT) {
        int offset = inline_array_offset(array, NUM2INT(rbIndex));
        Struct* s;

        if (!rb_obj_is_kind_of(rbValue, rbffi_StructClass)) {
            rb_raise(rb_eTypeError, "argument not an instance of struct");
            return Qnil;
        }

        checkWrite(array->memory);
        checkBounds(array->memory, offset, array->componentType->ffiType->size);

        TypedData_Get_Struct(rbValue, Struct, &rbffi_struct_data_type, s);
        checkRead(s->pointer);
        checkBounds(s->pointer, 0, array->componentType->ffiType->size);

        memcpy(array->memory->address + offset, s->pointer->address, array->componentType->ffiType->size);

    } else {
        ArrayType* arrayType;
        TypedData_Get_Struct(array->field->rbType, ArrayType, &rbffi_array_type_data_type, arrayType);

        rb_raise(rb_eArgError, "set not supported for %s", rb_obj_classname(arrayType->rbComponentType));
        return Qnil;
    }

    return rbValue;
}

/*
 * call-seq: each
 * Yield block for each element of +self+.
 */
static VALUE
inline_array_each(VALUE self)
{
    InlineArray* array;

    int i;

    TypedData_Get_Struct(self, InlineArray, &inline_array_data_type, array);

    for (i = 0; i < array->length; ++i) {
        rb_yield(inline_array_aref(self, INT2FIX(i)));
    }

    return self;
}

/*
 * call-seq: to_a
 * @return [Array]
 * Convert +self+ to an array.
 */
static VALUE
inline_array_to_a(VALUE self)
{
    InlineArray* array;
    VALUE obj;
    int i;

    TypedData_Get_Struct(self, InlineArray, &inline_array_data_type, array);
    obj = rb_ary_new2(array->length);


    for (i = 0; i < array->length; ++i) {
        rb_ary_push(obj, inline_array_aref(self, INT2FIX(i)));
    }

    return obj;
}

/*
 * Document-method: FFI::StructLayout::CharArray#to_s
 * call-seq: to_s
 * @return [String]
 * Convert +self+ to a string.
 */
static VALUE
inline_array_to_s(VALUE self)
{
    InlineArray* array;
    VALUE argv[2];

    TypedData_Get_Struct(self, InlineArray, &inline_array_data_type, array);

    if (array->componentType->nativeType != NATIVE_INT8 && array->componentType->nativeType != NATIVE_UINT8) {
        VALUE dummy = Qnil;
        return rb_call_super(0, &dummy);
    }

    argv[0] = UINT2NUM(array->field->offset);
    argv[1] = UINT2NUM(array->length);

    return rb_funcall2(array->rbMemory, rb_intern("get_string"), 2, argv);
}

/*
 * call-seq: to_ptr
 * @return [AbstractMemory]
 * Get pointer to +self+ content.
 */
static VALUE
inline_array_to_ptr(VALUE self)
{
    InlineArray* array;

    TypedData_Get_Struct(self, InlineArray, &inline_array_data_type, array);

    return rb_funcall(array->rbMemory, rb_intern("slice"), 2,
        UINT2NUM(array->field->offset), UINT2NUM(array->arrayType->base.ffiType->size));
}


void
rbffi_Struct_Init(VALUE moduleFFI)
{
    VALUE StructClass;

    rbffi_StructLayout_Init(moduleFFI);

    /*
     * Document-class: FFI::Struct
     *
     * A FFI::Struct means to mirror a C struct.
     *
     * A Struct is defined as:
     *  class MyStruct < FFI::Struct
     *    layout :value1, :int,
     *           :value2, :double
     *  end
     * and is used as:
     *  my_struct = MyStruct.new
     *  my_struct[:value1] = 12
     *
     * For more information, see http://github.com/ffi/ffi/wiki/Structs
     */
    rbffi_StructClass = rb_define_class_under(moduleFFI, "Struct", rb_cObject);
    StructClass = rbffi_StructClass; // put on a line alone to help RDoc
    rb_global_variable(&rbffi_StructClass);

    /*
     * Document-class: FFI::Struct::InlineArray
     */
    rbffi_StructInlineArrayClass = rb_define_class_under(rbffi_StructClass, "InlineArray", rb_cObject);
    rb_global_variable(&rbffi_StructInlineArrayClass);

    /*
     * Document-class: FFI::StructLayout::CharArray < FFI::Struct::InlineArray
     */
    rbffi_StructLayoutCharArrayClass = rb_define_class_under(rbffi_StructLayoutClass, "CharArray",
                                                             rbffi_StructInlineArrayClass);
    rb_global_variable(&rbffi_StructLayoutCharArrayClass);


    rb_define_alloc_func(StructClass, struct_allocate);
    rb_define_method(StructClass, "initialize", struct_initialize, -1);
    rb_define_method(StructClass, "initialize_copy", struct_initialize_copy, 1);
    rb_define_method(StructClass, "order", struct_order, -1);

    rb_define_alias(rb_singleton_class(StructClass), "alloc_in", "new");
    rb_define_alias(rb_singleton_class(StructClass), "alloc_out", "new");
    rb_define_alias(rb_singleton_class(StructClass), "alloc_inout", "new");
    rb_define_alias(rb_singleton_class(StructClass), "new_in", "new");
    rb_define_alias(rb_singleton_class(StructClass), "new_out", "new");
    rb_define_alias(rb_singleton_class(StructClass), "new_inout", "new");

    rb_define_method(StructClass, "pointer", struct_get_pointer, 0);
    rb_define_private_method(StructClass, "pointer=", struct_set_pointer, 1);

    rb_define_method(StructClass, "layout", struct_get_layout, 0);
    rb_define_private_method(StructClass, "layout=", struct_set_layout, 1);

    rb_define_method(StructClass, "[]", struct_aref, 1);
    rb_define_method(StructClass, "[]=", struct_aset, 2);
    rb_define_method(StructClass, "null?", struct_null_p, 0);

    rb_include_module(rbffi_StructInlineArrayClass, rb_mEnumerable);
    rb_define_alloc_func(rbffi_StructInlineArrayClass, inline_array_allocate);
    rb_define_method(rbffi_StructInlineArrayClass, "initialize", inline_array_initialize, 2);
    rb_define_method(rbffi_StructInlineArrayClass, "[]", inline_array_aref, 1);
    rb_define_method(rbffi_StructInlineArrayClass, "[]=", inline_array_aset, 2);
    rb_define_method(rbffi_StructInlineArrayClass, "each", inline_array_each, 0);
    rb_define_method(rbffi_StructInlineArrayClass, "size", inline_array_size, 0);
    rb_define_method(rbffi_StructInlineArrayClass, "to_a", inline_array_to_a, 0);
    rb_define_method(rbffi_StructInlineArrayClass, "to_ptr", inline_array_to_ptr, 0);

    rb_define_method(rbffi_StructLayoutCharArrayClass, "to_s", inline_array_to_s, 0);
    rb_define_alias(rbffi_StructLayoutCharArrayClass, "to_str", "to_s");

    id_pointer_ivar = rb_intern("@pointer");
    id_layout_ivar = rb_intern("@layout");
    id_layout = rb_intern("layout");
    id_get = rb_intern("get");
    id_put = rb_intern("put");
    id_to_ptr = rb_intern("to_ptr");
    id_to_s = rb_intern("to_s");
}

