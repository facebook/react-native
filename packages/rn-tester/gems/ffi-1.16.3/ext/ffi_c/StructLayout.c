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
#include "StructByValue.h"
#include "ArrayType.h"
#include "Function.h"
#include "MappedType.h"
#include "Struct.h"

#define FFI_ALIGN(v, a)  (((((size_t) (v))-1) | ((a)-1))+1)

static void struct_layout_mark(void *);
static void struct_layout_compact(void *);
static void struct_layout_free(void *);
static size_t struct_layout_memsize(const void *);
static void struct_field_mark(void *);
static void struct_field_compact(void *);
static size_t struct_field_memsize(const void *);

VALUE rbffi_StructLayoutFieldClass = Qnil;
VALUE rbffi_StructLayoutNumberFieldClass = Qnil, rbffi_StructLayoutPointerFieldClass = Qnil;
VALUE rbffi_StructLayoutStringFieldClass = Qnil;
VALUE rbffi_StructLayoutFunctionFieldClass = Qnil, rbffi_StructLayoutArrayFieldClass = Qnil;

VALUE rbffi_StructLayoutClass = Qnil;

const rb_data_type_t rbffi_struct_layout_data_type = { /* extern */
  .wrap_struct_name = "FFI::StructLayout",
  .function = {
      .dmark = struct_layout_mark,
      .dfree = struct_layout_free,
      .dsize = struct_layout_memsize,
      ffi_compact_callback( struct_layout_compact )
  },
  .parent = &rbffi_type_data_type,
  // IMPORTANT: WB_PROTECTED objects must only use the RB_OBJ_WRITE()
  // macro to update VALUE references, as to trigger write barriers.
  .flags = RUBY_TYPED_FREE_IMMEDIATELY | RUBY_TYPED_WB_PROTECTED | FFI_RUBY_TYPED_FROZEN_SHAREABLE
};

const rb_data_type_t rbffi_struct_field_data_type = { /* extern */
  .wrap_struct_name = "FFI::StructField",
  .function = {
      .dmark = struct_field_mark,
      .dfree = RUBY_TYPED_DEFAULT_FREE,
      .dsize = struct_field_memsize,
      ffi_compact_callback( struct_field_compact )
  },
  .parent = &rbffi_type_data_type,
  // IMPORTANT: WB_PROTECTED objects must only use the RB_OBJ_WRITE()
  // macro to update VALUE references, as to trigger write barriers.
  .flags = RUBY_TYPED_FREE_IMMEDIATELY | RUBY_TYPED_WB_PROTECTED | FFI_RUBY_TYPED_FROZEN_SHAREABLE
};

static VALUE
struct_field_allocate(VALUE klass)
{
    StructField* field;
    VALUE obj;

    obj = TypedData_Make_Struct(klass, StructField, &rbffi_struct_field_data_type, field);
    RB_OBJ_WRITE(obj, &field->rbType, Qnil);
    RB_OBJ_WRITE(obj, &field->rbName, Qnil);

    return obj;
}

static void
struct_field_mark(void *data)
{
    StructField *f = (StructField *)data;
    rb_gc_mark_movable(f->rbType);
    rb_gc_mark_movable(f->rbName);
}

static void
struct_field_compact(void *data)
{
    StructField *f = (StructField *)data;
    ffi_gc_location(f->rbType);
    ffi_gc_location(f->rbName);
}

static size_t
struct_field_memsize(const void *data)
{
    return sizeof(StructField);
}

/*
 * call-seq: initialize(name, offset, type)
 * @param [String,Symbol] name
 * @param [Fixnum] offset
 * @param [FFI::Type] type
 * @return [self]
 * A new FFI::StructLayout::Field instance.
 */
static VALUE
struct_field_initialize(int argc, VALUE* argv, VALUE self)
{
    VALUE rbOffset = Qnil, rbName = Qnil, rbType = Qnil;
    StructField* field;
    int nargs;

    TypedData_Get_Struct(self, StructField, &rbffi_struct_field_data_type, field);

    nargs = rb_scan_args(argc, argv, "3", &rbName, &rbOffset, &rbType);

    if (TYPE(rbName) != T_SYMBOL && TYPE(rbName) != T_STRING) {
        rb_raise(rb_eTypeError, "wrong argument type %s (expected Symbol/String)",
                rb_obj_classname(rbName));
    }

    Check_Type(rbOffset, T_FIXNUM);

    if (!rb_obj_is_kind_of(rbType, rbffi_TypeClass)) {
        rb_raise(rb_eTypeError, "wrong argument type %s (expected FFI::Type)",
                rb_obj_classname(rbType));
    }

    field->offset = NUM2UINT(rbOffset);
    RB_OBJ_WRITE(self, &field->rbName, (TYPE(rbName) == T_SYMBOL) ? rbName : rb_str_intern(rbName));
    RB_OBJ_WRITE(self, &field->rbType, rbType);
    TypedData_Get_Struct(field->rbType, Type, &rbffi_type_data_type, field->type);
    field->memoryOp = get_memory_op(field->type);
    field->referenceIndex = -1;

    switch (field->type->nativeType == NATIVE_MAPPED ? ((MappedType *) field->type)->type->nativeType : field->type->nativeType) {
        case NATIVE_FUNCTION:
        case NATIVE_POINTER:
            field->referenceRequired = true;
            break;

        default:
            field->referenceRequired = (rb_respond_to(self, rb_intern("reference_required?"))
                    && RTEST(rb_funcall2(self, rb_intern("reference_required?"), 0, NULL)))
                    || (rb_respond_to(rbType, rb_intern("reference_required?"))
                        && RTEST(rb_funcall2(rbType, rb_intern("reference_required?"), 0, NULL)));
            break;
    }

    rb_obj_freeze(self);

    return self;
}

/*
 * call-seq: offset
 * @return [Numeric]
 * Get the field offset.
 */
static VALUE
struct_field_offset(VALUE self)
{
    StructField* field;
    TypedData_Get_Struct(self, StructField, &rbffi_struct_field_data_type, field);
    return UINT2NUM(field->offset);
}

/*
 * call-seq: size
 * @return [Numeric]
 * Get the field size.
 */
static VALUE
struct_field_size(VALUE self)
{
    StructField* field;
    TypedData_Get_Struct(self, StructField, &rbffi_struct_field_data_type, field);
    return UINT2NUM(field->type->ffiType->size);
}

/*
 * call-seq: alignment
 * @return [Numeric]
 * Get the field alignment.
 */
static VALUE
struct_field_alignment(VALUE self)
{
    StructField* field;
    TypedData_Get_Struct(self, StructField, &rbffi_struct_field_data_type, field);
    return UINT2NUM(field->type->ffiType->alignment);
}

/*
 * call-seq: type
 * @return [Type]
 * Get the field type.
 */
static VALUE
struct_field_type(VALUE self)
{
    StructField* field;
    TypedData_Get_Struct(self, StructField, &rbffi_struct_field_data_type, field);

    return field->rbType;
}

/*
 * call-seq: name
 * @return [Symbol]
 * Get the field name.
 */
static VALUE
struct_field_name(VALUE self)
{
    StructField* field;
    TypedData_Get_Struct(self, StructField, &rbffi_struct_field_data_type, field);
    return field->rbName;
}

/*
 * call-seq: get(pointer)
 * @param [AbstractMemory] pointer pointer on a {Struct}
 * @return [Object]
 * Get an object of type {#type} from memory pointed by +pointer+.
 */
static VALUE
struct_field_get(VALUE self, VALUE pointer)
{
    StructField* f;

    TypedData_Get_Struct(self, StructField, &rbffi_struct_field_data_type, f);
    if (f->memoryOp == NULL) {
        rb_raise(rb_eArgError, "get not supported for %s", rb_obj_classname(f->rbType));
        return Qnil;
    }

    return (*f->memoryOp->get)(MEMORY(pointer), f->offset);
}

/*
 * call-seq: put(pointer, value)
 * @param [AbstractMemory] pointer pointer on a {Struct}
 * @param [Object] value this object must be a kind of {#type}
 * @return [self]
 * Put an object to memory pointed by +pointer+.
 */
static VALUE
struct_field_put(VALUE self, VALUE pointer, VALUE value)
{
    StructField* f;

    TypedData_Get_Struct(self, StructField, &rbffi_struct_field_data_type, f);
    if (f->memoryOp == NULL) {
        rb_raise(rb_eArgError, "put not supported for %s", rb_obj_classname(f->rbType));
        return self;
    }

    (*f->memoryOp->put)(MEMORY(pointer), f->offset, value);

    return self;
}

/*
 * call-seq: get(pointer)
 * @param [AbstractMemory] pointer pointer on a {Struct}
 * @return [Function]
 * Get a {Function} from memory pointed by +pointer+.
 */
static VALUE
function_field_get(VALUE self, VALUE pointer)
{
    StructField* f;

    TypedData_Get_Struct(self, StructField, &rbffi_struct_field_data_type, f);

    return rbffi_Function_NewInstance(f->rbType, (*rbffi_AbstractMemoryOps.pointer->get)(MEMORY(pointer), f->offset));
}

/*
 * call-seq: put(pointer, proc)
 * @param [AbstractMemory] pointer pointer to a {Struct}
 * @param [Function, Proc] proc
 * @return [Function]
 * Set a {Function} to memory pointed by +pointer+ as a function.
 *
 * If a Proc is submitted as +proc+, it is automatically transformed to a {Function}.
 */
static VALUE
function_field_put(VALUE self, VALUE pointer, VALUE proc)
{
    StructField* f;
    VALUE value = Qnil;

    TypedData_Get_Struct(self, StructField, &rbffi_struct_field_data_type, f);

    if (NIL_P(proc) || rb_obj_is_kind_of(proc, rbffi_FunctionClass)) {
        value = proc;
    } else if (rb_obj_is_kind_of(proc, rb_cProc) || rb_respond_to(proc, rb_intern("call"))) {
        value = rbffi_Function_ForProc(f->rbType, proc);
    } else {
        rb_raise(rb_eTypeError, "wrong type (expected Proc or Function)");
    }

    (*rbffi_AbstractMemoryOps.pointer->put)(MEMORY(pointer), f->offset, value);

    return self;
}

static inline bool
isCharArray(ArrayType* arrayType)
{
    return arrayType->componentType->nativeType == NATIVE_INT8
            || arrayType->componentType->nativeType == NATIVE_UINT8;
}

/*
 * call-seq: get(pointer)
 * @param [AbstractMemory] pointer pointer on a {Struct}
 * @return [FFI::StructLayout::CharArray, FFI::Struct::InlineArray]
 * Get an array from a {Struct}.
 */
static VALUE
array_field_get(VALUE self, VALUE pointer)
{
    StructField* f;
    ArrayType* array;
    VALUE argv[2];

    TypedData_Get_Struct(self, StructField, &rbffi_struct_field_data_type, f);
    TypedData_Get_Struct(f->rbType, ArrayType, &rbffi_array_type_data_type, array);

    argv[0] = pointer;
    argv[1] = self;

    return rb_class_new_instance(2, argv, isCharArray(array)
            ? rbffi_StructLayoutCharArrayClass : rbffi_StructInlineArrayClass);
}

/*
 * call-seq: put(pointer, value)
 * @param [AbstractMemory] pointer pointer on a {Struct}
 * @param [String, Array] value +value+ may be a String only if array's type is a kind of +int8+
 * @return [value]
 * Set an array in a {Struct}.
 */
static VALUE
array_field_put(VALUE self, VALUE pointer, VALUE value)
{
    StructField* f;
    ArrayType* array;

    TypedData_Get_Struct(self, StructField, &rbffi_struct_field_data_type, f);
    TypedData_Get_Struct(f->rbType, ArrayType, &rbffi_array_type_data_type, array);

    if (isCharArray(array) && rb_obj_is_instance_of(value, rb_cString)) {
        VALUE argv[2];

        argv[0] = INT2FIX(f->offset);
        argv[1] = value;

        if (RSTRING_LEN(value) < array->length) {
            rb_funcall2(pointer, rb_intern("put_string"), 2, argv);
        } else if (RSTRING_LEN(value) == array->length) {
            rb_funcall2(pointer, rb_intern("put_bytes"), 2, argv);
        } else {
            rb_raise(rb_eIndexError, "String is longer (%ld bytes) than the char array (%d bytes)", RSTRING_LEN(value), array->length);
        }
    } else {
#ifdef notyet
        MemoryOp* op;
        int count = RARRAY_LEN(value);
        int i;
        AbstractMemory* memory = MEMORY(pointer);

        if (count > array->length) {
            rb_raise(rb_eIndexError, "array too large");
        }

        /* clear the contents in case of a short write */
        checkWrite(memory);
        checkBounds(memory, f->offset, f->type->ffiType->size);
        if (count < array->length) {
            memset(memory->address + f->offset + (count * array->componentType->ffiType->size),
                    0, (array->length - count) * array->componentType->ffiType->size);
        }

        /* now copy each element in */
        if ((op = get_memory_op(array->componentType)) != NULL) {

            for (i = 0; i < count; ++i) {
                (*op->put)(memory, f->offset + (i * array->componentType->ffiType->size), rb_ary_entry(value, i));
            }

        } else if (array->componentType->nativeType == NATIVE_STRUCT) {

            for (i = 0; i < count; ++i) {
                VALUE entry = rb_ary_entry(value, i);
                Struct* s;

                TypedData_Get_Struct(entry, Struct, &rbffi_struct_data_type, s);

                checkRead(s->pointer);
                checkBounds(s->pointer, 0, array->componentType->ffiType->size);

                memcpy(memory->address + f->offset + (i * array->componentType->ffiType->size),
                        s->pointer->address, array->componentType->ffiType->size);
            }

        } else {
            rb_raise(rb_eNotImpError, "put not supported for arrays of type %s", rb_obj_classname(array->rbComponentType));
        }
#else
        rb_raise(rb_eNotImpError, "cannot set array field");
#endif
    }

    return value;
}


static VALUE
struct_layout_allocate(VALUE klass)
{
    StructLayout* layout;
    VALUE obj;

    obj = TypedData_Make_Struct(klass, StructLayout, &rbffi_struct_layout_data_type, layout);
    layout->rbFieldMap = Qnil;
    layout->rbFieldNames = Qnil;
    layout->rbFields = Qnil;
    layout->base.ffiType = xcalloc(1, sizeof(*layout->base.ffiType));
    layout->base.ffiType->size = 0;
    layout->base.ffiType->alignment = 0;
    layout->base.ffiType->type = FFI_TYPE_STRUCT;

    return obj;
}

/*
 * call-seq: initialize(fields, size, align)
 * @param [Array<StructLayout::Field>] fields
 * @param [Numeric] size
 * @param [Numeric] align
 * @return [self]
 * A new StructLayout instance.
 */
static VALUE
struct_layout_initialize(VALUE self, VALUE fields, VALUE size, VALUE align)
{
    StructLayout* layout;
    ffi_type* ltype;
    int i;

    TypedData_Get_Struct(self, StructLayout, &rbffi_struct_layout_data_type, layout);
    layout->fieldCount = (int) RARRAY_LEN(fields);
    layout->rbFieldMap = rb_hash_new();
    layout->rbFieldNames = rb_ary_new2(layout->fieldCount);
    layout->size = (int) FFI_ALIGN(NUM2INT(size),  NUM2INT(align));
    layout->align = NUM2INT(align);
    layout->fields = xcalloc(layout->fieldCount, sizeof(StructField *));
    layout->ffiTypes = xcalloc(layout->fieldCount + 1, sizeof(ffi_type *));
    layout->rbFields = rb_ary_new2(layout->fieldCount);
    layout->referenceFieldCount = 0;
    layout->base.ffiType->elements = layout->ffiTypes;
    layout->base.ffiType->size = layout->size;
    layout->base.ffiType->alignment = layout->align;

    ltype = layout->base.ffiType;
    for (i = 0; i < (int) layout->fieldCount; ++i) {
        VALUE rbField = rb_ary_entry(fields, i);
        VALUE rbName;
        StructField* field;
        ffi_type* ftype;


        if (!rb_obj_is_kind_of(rbField, rbffi_StructLayoutFieldClass)) {
            rb_raise(rb_eTypeError, "wrong type for field %d.", i);
        }
        rbName = rb_funcall2(rbField, rb_intern("name"), 0, NULL);

        TypedData_Get_Struct(rbField, StructField, &rbffi_struct_field_data_type, field);
        layout->fields[i] = field;

        if (field->type == NULL || field->type->ffiType == NULL) {
            rb_raise(rb_eRuntimeError, "type of field %d not supported", i);
        }

        ftype = field->type->ffiType;
        if (ftype->size == 0 && i < ((int) layout->fieldCount - 1)) {
            rb_raise(rb_eTypeError, "type of field %d has zero size", i);
        }

        if (field->referenceRequired) {
            field->referenceIndex = layout->referenceFieldCount++;
        }


        layout->ffiTypes[i] = ftype->size > 0 ? ftype : NULL;
        rb_hash_aset(layout->rbFieldMap, rbName, rbField);
        rb_ary_push(layout->rbFields, rbField);
        rb_ary_push(layout->rbFieldNames, rbName);
    }

    if (ltype->size == 0) {
        rb_raise(rb_eRuntimeError, "Struct size is zero");
    }

    rb_obj_freeze(layout->rbFieldMap);
    rb_obj_freeze(layout->rbFields);
    rb_obj_freeze(layout->rbFieldNames);
    rb_obj_freeze(self);

    return self;
}

/*
 * call-seq: [](field)
 * @param [Symbol] field
 * @return [StructLayout::Field]
 * Get a field from the layout.
 */
static VALUE
struct_layout_union_bang(VALUE self)
{
    const ffi_type *alignment_types[] = { &ffi_type_sint8, &ffi_type_sint16, &ffi_type_sint32, &ffi_type_sint64,
                                          &ffi_type_float, &ffi_type_double, &ffi_type_longdouble, NULL };
    StructLayout* layout;
    ffi_type *t = NULL;
    int count, i;

    TypedData_Get_Struct(self, StructLayout, &rbffi_struct_layout_data_type, layout);

    for (i = 0; alignment_types[i] != NULL; ++i) {
        if (alignment_types[i]->alignment == layout->align) {
            t = (ffi_type *) alignment_types[i];
            break;
        }
    }
    if (t == NULL) {
        rb_raise(rb_eRuntimeError, "cannot create libffi union representation for alignment %d", layout->align);
        return Qnil;
    }

    count = (int) layout->size / (int) t->size;
    xfree(layout->ffiTypes);
    layout->ffiTypes = xcalloc(count + 1, sizeof(ffi_type *));
    layout->base.ffiType->elements = layout->ffiTypes;

    for (i = 0; i < count; ++i) {
        layout->ffiTypes[i] = t;
    }

    return self;
}

static VALUE
struct_layout_aref(VALUE self, VALUE field)
{
    StructLayout* layout;

    TypedData_Get_Struct(self, StructLayout, &rbffi_struct_layout_data_type, layout);

    return rb_hash_aref(layout->rbFieldMap, field);
}

/*
 * call-seq: fields
 * @return [Array<StructLayout::Field>]
 * Get fields list.
 */
static VALUE
struct_layout_fields(VALUE self)
{
    StructLayout* layout;

    TypedData_Get_Struct(self, StructLayout, &rbffi_struct_layout_data_type, layout);

    return rb_ary_dup(layout->rbFields);
}

/*
 * call-seq: members
 * @return [Array<Symbol>]
 * Get list of field names.
 */
static VALUE
struct_layout_members(VALUE self)
{
    StructLayout* layout;

    TypedData_Get_Struct(self, StructLayout, &rbffi_struct_layout_data_type, layout);

    return rb_ary_dup(layout->rbFieldNames);
}

/*
 * call-seq: to_a
 * @return [Array<StructLayout::Field>]
 * Get an array of fields.
 */
static VALUE
struct_layout_to_a(VALUE self)
{
    StructLayout* layout;

    TypedData_Get_Struct(self, StructLayout, &rbffi_struct_layout_data_type, layout);

    return rb_ary_dup(layout->rbFields);
}

static void
struct_layout_mark(void *data)
{
    StructLayout *layout = (StructLayout *)data;
    rb_gc_mark_movable(layout->rbFieldMap);
    rb_gc_mark_movable(layout->rbFieldNames);
    rb_gc_mark_movable(layout->rbFields);
    /* The values stored in layout->cache_row.fieldName are primary stored in layout->rbFieldMap and are marked there */
}

static void
struct_layout_compact(void *data)
{
    StructLayout *layout = (StructLayout *)data;
    ffi_gc_location(layout->rbFieldMap);
    ffi_gc_location(layout->rbFieldNames);
    ffi_gc_location(layout->rbFields);

    /* Clear the cache, to be safe from changes of fieldName VALUE by GC.compact */
    memset(&layout->cache_row, 0, sizeof(layout->cache_row));
}

static void
struct_layout_free(void *data)
{
    StructLayout *layout = (StructLayout *)data;
    xfree(layout->ffiTypes);
    xfree(layout->base.ffiType);
    xfree(layout->fields);
    xfree(layout);
}


static size_t
struct_layout_memsize(const void * data)
{
    const StructLayout *layout = (const StructLayout *)data;
    size_t memsize = sizeof(StructLayout);
    memsize += layout->fieldCount * (sizeof(StructField *) + sizeof(ffi_type *));
    memsize += sizeof(*layout->base.ffiType);
    return memsize;
}

void
rbffi_StructLayout_Init(VALUE moduleFFI)
{
    VALUE ffi_Type = rbffi_TypeClass;

    /*
     * Document-class: FFI::StructLayout < FFI::Type
     *
     * This class aims at defining a struct layout.
     */
    rbffi_StructLayoutClass = rb_define_class_under(moduleFFI, "StructLayout", ffi_Type);
    rb_global_variable(&rbffi_StructLayoutClass);

    /*
     * Document-class: FFI::StructLayout::Field
     * A field in a {StructLayout}.
     */
    rbffi_StructLayoutFieldClass = rb_define_class_under(rbffi_StructLayoutClass, "Field", rb_cObject);
    rb_global_variable(&rbffi_StructLayoutFieldClass);

    /*
     * Document-class: FFI::StructLayout::Number
     * A numeric {Field} in a {StructLayout}.
     */
    rbffi_StructLayoutNumberFieldClass = rb_define_class_under(rbffi_StructLayoutClass, "Number", rbffi_StructLayoutFieldClass);
    rb_global_variable(&rbffi_StructLayoutNumberFieldClass);

    /*
     * Document-class: FFI::StructLayout::String
     * A string {Field} in a {StructLayout}.
     */
    rbffi_StructLayoutStringFieldClass = rb_define_class_under(rbffi_StructLayoutClass, "String", rbffi_StructLayoutFieldClass);
    rb_global_variable(&rbffi_StructLayoutStringFieldClass);

    /*
     * Document-class: FFI::StructLayout::Pointer
     * A pointer {Field} in a {StructLayout}.
     */
    rbffi_StructLayoutPointerFieldClass = rb_define_class_under(rbffi_StructLayoutClass, "Pointer", rbffi_StructLayoutFieldClass);
    rb_global_variable(&rbffi_StructLayoutPointerFieldClass);

    /*
     * Document-class: FFI::StructLayout::Function
     * A function pointer {Field} in a {StructLayout}.
     */
    rbffi_StructLayoutFunctionFieldClass = rb_define_class_under(rbffi_StructLayoutClass, "Function", rbffi_StructLayoutFieldClass);
    rb_global_variable(&rbffi_StructLayoutFunctionFieldClass);

    /*
     * Document-class: FFI::StructLayout::Array
     * An array {Field} in a {StructLayout}.
     */
    rbffi_StructLayoutArrayFieldClass = rb_define_class_under(rbffi_StructLayoutClass, "Array", rbffi_StructLayoutFieldClass);
    rb_global_variable(&rbffi_StructLayoutArrayFieldClass);

    rb_define_alloc_func(rbffi_StructLayoutFieldClass, struct_field_allocate);
    rb_define_method(rbffi_StructLayoutFieldClass, "initialize", struct_field_initialize, -1);
    rb_define_method(rbffi_StructLayoutFieldClass, "offset", struct_field_offset, 0);
    rb_define_method(rbffi_StructLayoutFieldClass, "size", struct_field_size, 0);
    rb_define_method(rbffi_StructLayoutFieldClass, "alignment", struct_field_alignment, 0);
    rb_define_method(rbffi_StructLayoutFieldClass, "name", struct_field_name, 0);
    rb_define_method(rbffi_StructLayoutFieldClass, "type", struct_field_type, 0);
    rb_define_method(rbffi_StructLayoutFieldClass, "put", struct_field_put, 2);
    rb_define_method(rbffi_StructLayoutFieldClass, "get", struct_field_get, 1);

    rb_define_method(rbffi_StructLayoutFunctionFieldClass, "put", function_field_put, 2);
    rb_define_method(rbffi_StructLayoutFunctionFieldClass, "get", function_field_get, 1);

    rb_define_method(rbffi_StructLayoutArrayFieldClass, "get", array_field_get, 1);
    rb_define_method(rbffi_StructLayoutArrayFieldClass, "put", array_field_put, 2);

    rb_define_alloc_func(rbffi_StructLayoutClass, struct_layout_allocate);
    rb_define_method(rbffi_StructLayoutClass, "initialize", struct_layout_initialize, 3);
    rb_define_method(rbffi_StructLayoutClass, "[]", struct_layout_aref, 1);
    rb_define_method(rbffi_StructLayoutClass, "fields", struct_layout_fields, 0);
    rb_define_method(rbffi_StructLayoutClass, "members", struct_layout_members, 0);
    rb_define_method(rbffi_StructLayoutClass, "to_a", struct_layout_to_a, 0);
    rb_define_method(rbffi_StructLayoutClass, "__union!", struct_layout_union_bang, 0);

}

