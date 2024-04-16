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
#include <sys/param.h>
#endif
#include <sys/types.h>
#include <stdio.h>
#include <stdint.h>
#include <stdbool.h>
#include <errno.h>
#include <ruby.h>

#include <ffi.h>
#include "rbffi.h"
#include "compat.h"

#include "Type.h"
#include "StructByValue.h"
#include "Struct.h"

#define FFI_ALIGN(v, a)  (((((size_t) (v))-1) | ((a)-1))+1)

static VALUE sbv_allocate(VALUE);
static VALUE sbv_initialize(VALUE, VALUE);
static void sbv_mark(void *);
static void sbv_compact(void *);
static void sbv_free(void *);
static size_t sbv_memsize(const void *);

VALUE rbffi_StructByValueClass = Qnil;

static const rb_data_type_t sbv_type_data_type = {
  .wrap_struct_name = "FFI::StructByValue",
  .function = {
      .dmark = sbv_mark,
      .dfree = sbv_free,
      .dsize = sbv_memsize,
      ffi_compact_callback( sbv_compact )
  },
  .parent = &rbffi_type_data_type,
  // IMPORTANT: WB_PROTECTED objects must only use the RB_OBJ_WRITE()
  // macro to update VALUE references, as to trigger write barriers.
  .flags = RUBY_TYPED_FREE_IMMEDIATELY | RUBY_TYPED_WB_PROTECTED | FFI_RUBY_TYPED_FROZEN_SHAREABLE
};

static VALUE
sbv_allocate(VALUE klass)
{
    StructByValue* sbv;

    VALUE obj = TypedData_Make_Struct(klass, StructByValue, &sbv_type_data_type, sbv);

    RB_OBJ_WRITE(obj, &sbv->rbStructClass, Qnil);
    RB_OBJ_WRITE(obj, &sbv->rbStructLayout, Qnil);
    sbv->base.nativeType = NATIVE_STRUCT;

    sbv->base.ffiType = xcalloc(1, sizeof(*sbv->base.ffiType));
    sbv->base.ffiType->size = 0;
    sbv->base.ffiType->alignment = 1;
    sbv->base.ffiType->type = FFI_TYPE_STRUCT;

    return obj;
}

static VALUE
sbv_initialize(VALUE self, VALUE rbStructClass)
{
    StructByValue* sbv = NULL;
    StructLayout* layout = NULL;
    VALUE rbLayout = Qnil;

    rbLayout = rb_ivar_get(rbStructClass, rb_intern("@layout"));
    if (!rb_obj_is_instance_of(rbLayout, rbffi_StructLayoutClass)) {
        rb_raise(rb_eTypeError, "wrong type in @layout ivar (expected FFI::StructLayout)");
    }

    TypedData_Get_Struct(rbLayout, StructLayout, &rbffi_struct_layout_data_type, layout);
    TypedData_Get_Struct(self, StructByValue, &sbv_type_data_type, sbv);
    RB_OBJ_WRITE(self, &sbv->rbStructClass, rbStructClass);
    RB_OBJ_WRITE(self, &sbv->rbStructLayout, rbLayout);

    /* We can just use everything from the ffi_type directly */
    *sbv->base.ffiType = *layout->base.ffiType;

    return self;
}

static void
sbv_mark(void *data)
{
    StructByValue *sbv = (StructByValue *)data;
    rb_gc_mark_movable(sbv->rbStructClass);
    rb_gc_mark_movable(sbv->rbStructLayout);
}

static void
sbv_compact(void *data)
{
    StructByValue *sbv = (StructByValue *)data;
    ffi_gc_location(sbv->rbStructClass);
    ffi_gc_location(sbv->rbStructLayout);
}

static void
sbv_free(void *data)
{
    StructByValue *sbv = (StructByValue *)data;
    xfree(sbv->base.ffiType);
    xfree(sbv);
}

static size_t
sbv_memsize(const void *data)
{
    const StructByValue *sbv = (const StructByValue *)data;
    return sizeof(StructByValue) + sizeof(*sbv->base.ffiType);
}

static VALUE
sbv_layout(VALUE self)
{
    StructByValue* sbv;

    TypedData_Get_Struct(self, StructByValue, &sbv_type_data_type, sbv);
    return sbv->rbStructLayout;
}

static VALUE
sbv_struct_class(VALUE self)
{
    StructByValue* sbv;

    TypedData_Get_Struct(self, StructByValue, &sbv_type_data_type, sbv);

    return sbv->rbStructClass;
}

void
rbffi_StructByValue_Init(VALUE moduleFFI)
{
    rbffi_StructByValueClass = rb_define_class_under(moduleFFI, "StructByValue", rbffi_TypeClass);
    rb_global_variable(&rbffi_StructByValueClass);
    rb_define_const(rbffi_TypeClass, "Struct", rbffi_StructByValueClass);

    rb_define_alloc_func(rbffi_StructByValueClass, sbv_allocate);
    rb_define_method(rbffi_StructByValueClass, "initialize", sbv_initialize, 1);
    rb_define_method(rbffi_StructByValueClass, "layout", sbv_layout, 0);
    rb_define_method(rbffi_StructByValueClass, "struct_class", sbv_struct_class, 0);
}

