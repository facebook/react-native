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

#include <stdbool.h>
#include <stdint.h>
#include <limits.h>
#include <ruby.h>
#include "rbffi.h"
#include "AbstractMemory.h"
#include "Pointer.h"
#include "MemoryPointer.h"


static VALUE memptr_allocate(VALUE klass);
static void memptr_release(void *data);
static size_t memptr_memsize(const void *data);
static VALUE memptr_malloc(VALUE self, long size, long count, bool clear);
static VALUE memptr_free(VALUE self);

VALUE rbffi_MemoryPointerClass;

#define MEMPTR(obj) ((MemoryPointer *) rbffi_AbstractMemory_Cast(obj, &memory_pointer_data_type))

VALUE
rbffi_MemoryPointer_NewInstance(long size, long count, bool clear)
{
    return memptr_malloc(memptr_allocate(rbffi_MemoryPointerClass), size, count, clear);
}

static const rb_data_type_t memory_pointer_data_type = {
    .wrap_struct_name = "FFI::MemoryPointer",
    .function = {
        .dmark = NULL,
        .dfree = memptr_release,
        .dsize = memptr_memsize,
    },
    .parent = &rbffi_pointer_data_type,
    // IMPORTANT: WB_PROTECTED objects must only use the RB_OBJ_WRITE()
    // macro to update VALUE references, as to trigger write barriers.
    .flags = RUBY_TYPED_FREE_IMMEDIATELY | RUBY_TYPED_WB_PROTECTED | FFI_RUBY_TYPED_FROZEN_SHAREABLE
};

static VALUE
memptr_allocate(VALUE klass)
{
    Pointer* p;
    VALUE obj = TypedData_Make_Struct(klass, Pointer, &memory_pointer_data_type, p);
    RB_OBJ_WRITE(obj, &p->rbParent, Qnil);
    p->memory.flags = MEM_RD | MEM_WR;

    return obj;
}

/*
 * call-seq: initialize(size, count=1, clear=true)
 * @param [Fixnum, Bignum, Symbol, FFI::Type] size size of a memory cell (in bytes, or type whom size will be used)
 * @param [Numeric] count number of cells in memory
 * @param [Boolean] clear set memory to all-zero if +true+
 * @return [self]
 * A new instance of FFI::MemoryPointer.
 */
static VALUE
memptr_initialize(int argc, VALUE* argv, VALUE self)
{
    VALUE size = Qnil, count = Qnil, clear = Qnil;
    int nargs = rb_scan_args(argc, argv, "12", &size, &count, &clear);

    memptr_malloc(self, rbffi_type_size(size), nargs > 1 ? NUM2LONG(count) : 1,
        RTEST(clear) || clear == Qnil);

    if (rb_block_given_p()) {
        return rb_ensure(rb_yield, self, memptr_free, self);
    }

    return self;
}

static VALUE
memptr_malloc(VALUE self, long size, long count, bool clear)
{
    Pointer* p;
    unsigned long msize;

    TypedData_Get_Struct(self, Pointer, &memory_pointer_data_type, p);

    msize = size * count;

    p->storage = xmalloc(msize + 7);
    if (p->storage == NULL) {
        rb_raise(rb_eNoMemError, "Failed to allocate memory size=%ld bytes", msize);
        return Qnil;
    }
    p->autorelease = true;
    p->memory.typeSize = (int) size;
    p->memory.size = msize;
    /* ensure the memory is aligned on at least a 8 byte boundary */
    p->memory.address = (char *) (((uintptr_t) p->storage + 0x7) & (uintptr_t) ~0x7ULL);
    p->allocated = true;

    if (clear && p->memory.size > 0) {
        memset(p->memory.address, 0, p->memory.size);
    }

    return self;
}

static VALUE
memptr_free(VALUE self)
{
    Pointer* ptr;

    rb_check_frozen(self);
    TypedData_Get_Struct(self, Pointer, &memory_pointer_data_type, ptr);

    if (ptr->allocated) {
        if (ptr->storage != NULL) {
            xfree(ptr->storage);
            ptr->storage = NULL;
        }
        ptr->allocated = false;
    }

    return self;
}

static void
memptr_release(void *data)
{
    Pointer *ptr = (Pointer *)data;
    if (ptr->autorelease && ptr->allocated && ptr->storage != NULL) {
        xfree(ptr->storage);
        ptr->storage = NULL;
    }
    xfree(ptr);
}

static size_t
memptr_memsize(const void *data)
{
    const Pointer *ptr = (const Pointer *)data;
    size_t memsize = sizeof(Pointer);
    if (ptr->allocated) {
        memsize += ptr->memory.size;
    }
    return memsize;
}

/*
 * call-seq: from_string(s)
 * @param [String] s string
 * @return [MemoryPointer]
 * Create a {MemoryPointer} with +s+ inside.
 */
static VALUE
memptr_s_from_string(VALUE klass, VALUE to_str)
{
    VALUE s = StringValue(to_str);
    VALUE args[] = { INT2FIX(1), LONG2NUM(RSTRING_LEN(s) + 1), Qfalse };
    VALUE obj = rb_class_new_instance(3, args, klass);
    rb_funcall(obj, rb_intern("put_string"), 2, INT2FIX(0), s);

    return obj;
}

void
rbffi_MemoryPointer_Init(VALUE moduleFFI)
{
    VALUE ffi_Pointer;

    ffi_Pointer = rbffi_PointerClass;

    /*
     * Document-class: FFI::MemoryPointer < FFI::Pointer
     * A MemoryPointer is a specific {Pointer}. It points to a memory composed of cells. All cells have the
     * same size.
     *
     * @example Create a new MemoryPointer
     *  mp = FFI::MemoryPointer.new(:long, 16)   # Create a pointer on a memory of 16 long ints.
     * @example Create a new MemoryPointer from a String
     *  mp1 = FFI::MemoryPointer.from_string("this is a string")
     *  # same as:
     *  mp2 = FFI::MemoryPointer.new(:char,16)
     *  mp2.put_string("this is a string")
     */
    rbffi_MemoryPointerClass = rb_define_class_under(moduleFFI, "MemoryPointer", ffi_Pointer);
    rb_global_variable(&rbffi_MemoryPointerClass);

    rb_define_alloc_func(rbffi_MemoryPointerClass, memptr_allocate);
    rb_define_method(rbffi_MemoryPointerClass, "initialize", memptr_initialize, -1);
    rb_define_singleton_method(rbffi_MemoryPointerClass, "from_string", memptr_s_from_string, 1);
}

