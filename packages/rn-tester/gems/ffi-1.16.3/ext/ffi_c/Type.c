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

#ifndef _MSC_VER
# include <sys/param.h>
#endif

#include <sys/types.h>
#include <ruby.h>
#if HAVE_RB_EXT_RACTOR_SAFE
#include <ruby/ractor.h>
#endif
#include <ffi.h>
#include "rbffi.h"
#include "compat.h"
#include "Types.h"
#include "Type.h"

static size_t type_memsize(const void *);

typedef struct BuiltinType_ {
    Type type;
    const char* name;
} BuiltinType;

static size_t builtin_type_memsize(const void *);

VALUE rbffi_TypeClass = Qnil;

static VALUE classBuiltinType = Qnil;
static VALUE moduleNativeType = Qnil;
static VALUE typeMap = Qnil;
static ID id_type_size = 0, id_size = 0;
#if HAVE_RB_EXT_RACTOR_SAFE
static rb_ractor_local_key_t custom_typedefs_key;
#endif

const rb_data_type_t rbffi_type_data_type = { /* extern */
  .wrap_struct_name = "FFI::Type",
  .function = {
      .dmark = NULL,
      .dfree = RUBY_TYPED_DEFAULT_FREE,
      .dsize = type_memsize,
  },
  // IMPORTANT: WB_PROTECTED objects must only use the RB_OBJ_WRITE()
  // macro to update VALUE references, as to trigger write barriers.
  .flags = RUBY_TYPED_FREE_IMMEDIATELY | RUBY_TYPED_WB_PROTECTED | FFI_RUBY_TYPED_FROZEN_SHAREABLE
};

static const rb_data_type_t builtin_type_data_type = {
  .wrap_struct_name = "FFI::Type::Builtin",
  .function = {
      .dmark = NULL,
      .dfree = RUBY_TYPED_DEFAULT_FREE,
      .dsize = builtin_type_memsize,
  },
  .parent = &rbffi_type_data_type,
  // IMPORTANT: WB_PROTECTED objects must only use the RB_OBJ_WRITE()
  // macro to update VALUE references, as to trigger write barriers.
  .flags = RUBY_TYPED_FREE_IMMEDIATELY | RUBY_TYPED_WB_PROTECTED | FFI_RUBY_TYPED_FROZEN_SHAREABLE
};

static size_t
type_memsize(const void *data)
{
    return sizeof(Type);
}

static VALUE
type_allocate(VALUE klass)
{
    Type* type;
    VALUE obj = TypedData_Make_Struct(klass, Type, &rbffi_type_data_type, type);

    type->nativeType = -1;
    type->ffiType = &ffi_type_void;

    return obj;
}

/*
 * Document-method: initialize
 * call-seq: initialize(value)
 * @param [Fixnum,Type] value
 * @return [self]
 */
static VALUE
type_initialize(VALUE self, VALUE value)
{
    Type* type;
    Type* other;

    TypedData_Get_Struct(self, Type, &rbffi_type_data_type, type);

    if (FIXNUM_P(value)) {
        type->nativeType = FIX2INT(value);
    } else if (rb_obj_is_kind_of(value, rbffi_TypeClass)) {
        TypedData_Get_Struct(value, Type, &rbffi_type_data_type, other);
        type->nativeType = other->nativeType;
        type->ffiType = other->ffiType;
    } else {
        rb_raise(rb_eArgError, "wrong type");
    }

    rb_obj_freeze(self);

    return self;
}

/*
 * call-seq: type.size
 * @return [Fixnum]
 * Return type's size, in bytes.
 */
static VALUE
type_size(VALUE self)
{
    Type *type;

    TypedData_Get_Struct(self, Type, &rbffi_type_data_type, type);

    return INT2FIX(type->ffiType->size);
}

/*
 * call-seq: type.alignment
 * @return [Fixnum]
 * Get Type alignment.
 */
static VALUE
type_alignment(VALUE self)
{
    Type *type;

    TypedData_Get_Struct(self, Type, &rbffi_type_data_type, type);

    return INT2FIX(type->ffiType->alignment);
}

/*
 * call-seq: type.inspect
 * @return [String]
 * Inspect {Type} object.
 */
static VALUE
type_inspect(VALUE self)
{
    char buf[100];
    Type *type;

    TypedData_Get_Struct(self, Type, &rbffi_type_data_type, type);

    snprintf(buf, sizeof(buf), "#<%s::%p size=%d alignment=%d>",
            rb_obj_classname(self), type, (int) type->ffiType->size, (int) type->ffiType->alignment);

    return rb_str_new2(buf);
}

static VALUE
builtin_type_new(VALUE klass, int nativeType, ffi_type* ffiType, const char* name)
{
    BuiltinType* type;
    VALUE obj = Qnil;

    obj = TypedData_Make_Struct(klass, BuiltinType, &builtin_type_data_type, type);

    type->name = name;
    type->type.nativeType = nativeType;
    type->type.ffiType = ffiType;

    rb_obj_freeze(obj);

    return obj;
}

static size_t
builtin_type_memsize(const void *data)
{
    return sizeof(BuiltinType) + sizeof(ffi_type);
}

/*
 * call-seq: type.inspect
 * @return [String]
 * Inspect {Type::Builtin} object.
 */
static VALUE
builtin_type_inspect(VALUE self)
{
    char buf[100];
    BuiltinType *type;

    TypedData_Get_Struct(self, BuiltinType, &builtin_type_data_type, type);
    snprintf(buf, sizeof(buf), "#<%s::%s size=%d alignment=%d>",
            rb_obj_classname(self), type->name, (int) type->type.ffiType->size, type->type.ffiType->alignment);

    return rb_str_new2(buf);
}

int
rbffi_type_size(VALUE type)
{
    int t = TYPE(type);

    if (t == T_FIXNUM || t == T_BIGNUM) {
        return NUM2INT(type);

    } else if (t == T_SYMBOL) {
        /*
         * Try looking up directly in the type map
         */
        VALUE nType;
        if ((nType = rb_hash_lookup(typeMap, type)) != Qnil) {
            if (rb_obj_is_kind_of(nType, rbffi_TypeClass)) {
                Type* type;
                TypedData_Get_Struct(nType, Type, &rbffi_type_data_type, type);
                return (int) type->ffiType->size;

            } else if (rb_respond_to(nType, id_size)) {
                return NUM2INT(rb_funcall2(nType, id_size, 0, NULL));
            }
        }

        /* Not found - call up to the ruby version to resolve */
        return NUM2INT(rb_funcall2(rbffi_FFIModule, id_type_size, 1, &type));

    } else {
        return NUM2INT(rb_funcall2(type, id_size, 0, NULL));
    }
}

static VALUE
custom_typedefs(VALUE self)
{
#if HAVE_RB_EXT_RACTOR_SAFE
    VALUE hash = rb_ractor_local_storage_value(custom_typedefs_key);
    if (hash == Qnil) {
        hash = rb_hash_new();
        rb_ractor_local_storage_value_set(custom_typedefs_key, hash);
    }
#else
    static VALUE hash = Qundef;
    if (hash == Qundef) {
        rb_global_variable(&hash);
        hash = rb_hash_new();
    }
#endif
    return hash;
}

VALUE
rbffi_Type_Lookup(VALUE name)
{
    int t = TYPE(name);
    if (t == T_SYMBOL || t == T_STRING) {
        /*
         * Try looking up directly in the type map
         */
        VALUE nType;
        VALUE cust = custom_typedefs(Qnil);

        if ((nType = rb_hash_lookup(cust, name)) != Qnil && rb_obj_is_kind_of(nType, rbffi_TypeClass)) {
            return nType;
        }

        if ((nType = rb_hash_lookup(typeMap, name)) != Qnil && rb_obj_is_kind_of(nType, rbffi_TypeClass)) {
            return nType;
        }
    } else if (rb_obj_is_kind_of(name, rbffi_TypeClass)) {

        return name;
    }

    /* Nothing found - let caller handle raising exceptions */
    return Qnil;
}

void
rbffi_Type_Init(VALUE moduleFFI)
{
    /*
     * Document-class: FFI::Type
     * This class manages C types.
     *
     * It embbed {FFI::Type::Builtin} objects as constants (for names,
     * see {FFI::NativeType}).
     */
    rbffi_TypeClass = rb_define_class_under(moduleFFI, "Type", rb_cObject);

    /*
     * Document-constant: FFI::TypeDefs
     */
    rb_define_const(moduleFFI, "TypeDefs", typeMap = rb_hash_new());
    rb_global_variable(&typeMap);
    id_type_size = rb_intern("type_size");
    id_size = rb_intern("size");

#if HAVE_RB_EXT_RACTOR_SAFE
    custom_typedefs_key = rb_ractor_local_storage_value_newkey();
#endif
    rb_define_module_function(moduleFFI, "custom_typedefs", custom_typedefs, 0);

    /*
     * Document-class: FFI::Type::Builtin
     * Class for Built-in types.
     */
    classBuiltinType = rb_define_class_under(rbffi_TypeClass, "Builtin", rbffi_TypeClass);
    /*
     * Document-module: FFI::NativeType
     * This module defines constants for native (C) types.
     *
     * ==Native type constants
     * Native types are defined by constants :
     * * INT8, SCHAR, CHAR
     * * UINT8, UCHAR
     * * INT16, SHORT, SSHORT
     * * UINT16, USHORT
     * * INT32,, INT, SINT
     * * UINT32, UINT
     * * INT64, LONG_LONG, SLONG_LONG
     * * UINT64, ULONG_LONG
     * * LONG, SLONG
     * * ULONG
     * * FLOAT32, FLOAT
     * * FLOAT64, DOUBLE
     * * POINTER
     * * CALLBACK
     * * FUNCTION
     * * CHAR_ARRAY
     * * BOOL
     * * STRING (immutable string, nul terminated)
     * * STRUCT (struct-b-value param or result)
     * * ARRAY (array type definition)
     * * MAPPED (custom native type)
     * For function return type only :
     * * VOID
     * For function argument type only :
     * * BUFFER_IN
     * * BUFFER_OUT
     * * VARARGS (function takes a variable number of arguments)
     *
     * All these constants are exported to {FFI} module prefixed with "TYPE_".
     * They are objets from {FFI::Type::Builtin} class.
     */
    moduleNativeType = rb_define_module_under(moduleFFI, "NativeType");

    /*
     * Document-global: FFI::Type
     */
    rb_global_variable(&rbffi_TypeClass);
    rb_global_variable(&classBuiltinType);
    rb_global_variable(&moduleNativeType);

    rb_define_alloc_func(rbffi_TypeClass, type_allocate);
    rb_define_method(rbffi_TypeClass, "initialize", type_initialize, 1);
    rb_define_method(rbffi_TypeClass, "size", type_size, 0);
    rb_define_method(rbffi_TypeClass, "alignment", type_alignment, 0);
    rb_define_method(rbffi_TypeClass, "inspect", type_inspect, 0);

    /* Make Type::Builtin non-allocatable */
    rb_undef_method(CLASS_OF(classBuiltinType), "new");
    rb_define_method(classBuiltinType, "inspect", builtin_type_inspect, 0);

    rb_global_variable(&rbffi_TypeClass);
    rb_global_variable(&classBuiltinType);

    /* Define all the builtin types */
    #define T(x, ffiType) do { \
        VALUE t = Qnil; \
        rb_define_const(rbffi_TypeClass, #x, t = builtin_type_new(classBuiltinType, NATIVE_##x, ffiType, #x)); \
        rb_define_const(moduleNativeType, #x, t); \
        rb_define_const(moduleFFI, "TYPE_" #x, t); \
    } while(0)

    #define A(old_type, new_type) do { \
        VALUE t = rb_const_get(rbffi_TypeClass, rb_intern(#old_type)); \
        rb_const_set(rbffi_TypeClass, rb_intern(#new_type), t); \
    } while(0)

    /*
     * Document-constant: FFI::Type::Builtin::VOID
     */
    T(VOID, &ffi_type_void);
    T(INT8, &ffi_type_sint8);
    A(INT8, SCHAR);
    A(INT8, CHAR);
    T(UINT8, &ffi_type_uint8);
    A(UINT8, UCHAR);

    T(INT16, &ffi_type_sint16);
    A(INT16, SHORT);
    A(INT16, SSHORT);
    T(UINT16, &ffi_type_uint16);
    A(UINT16, USHORT);
    T(INT32, &ffi_type_sint32);
    A(INT32, INT);
    A(INT32, SINT);
    T(UINT32, &ffi_type_uint32);
    A(UINT32, UINT);
    T(INT64, &ffi_type_sint64);
    A(INT64, LONG_LONG);
    A(INT64, SLONG_LONG);
    T(UINT64, &ffi_type_uint64);
    A(UINT64, ULONG_LONG);
    T(LONG, &ffi_type_slong);
    A(LONG, SLONG);
    T(ULONG, &ffi_type_ulong);
    T(FLOAT32, &ffi_type_float);
    A(FLOAT32, FLOAT);
    T(FLOAT64, &ffi_type_double);
    A(FLOAT64, DOUBLE);
    T(LONGDOUBLE, &ffi_type_longdouble);
    T(POINTER, &ffi_type_pointer);
    T(STRING, &ffi_type_pointer);
    T(BUFFER_IN, &ffi_type_pointer);
    T(BUFFER_OUT, &ffi_type_pointer);
    T(BUFFER_INOUT, &ffi_type_pointer);
    T(BOOL, &ffi_type_uchar);
    T(VARARGS, &ffi_type_void);
}

