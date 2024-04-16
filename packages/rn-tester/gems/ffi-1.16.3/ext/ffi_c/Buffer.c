/*
 * Copyright (c) 2008-2010 Wayne Meissner
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

#include <stdint.h>
#include <stdbool.h>
#include <limits.h>
#include <ruby.h>
#include "rbffi.h"
#include "rbffi_endian.h"
#include "AbstractMemory.h"

#define BUFFER_EMBED_MAXLEN (8)
typedef struct Buffer {
    AbstractMemory memory;

    union {
        VALUE rbParent; /* link to parent buffer */
        char* storage; /* start of malloc area */
        long embed[BUFFER_EMBED_MAXLEN / sizeof(long)]; /* storage for tiny allocations */
    } data;
} Buffer;

static VALUE buffer_allocate(VALUE klass);
static VALUE buffer_initialize(int argc, VALUE* argv, VALUE self);
static void buffer_release(void *data);
static void buffer_mark(void *data);
static void buffer_compact(void *data);
static VALUE buffer_free(VALUE self);
static size_t allocated_buffer_memsize(const void *data);
static size_t buffer_memsize(const void *data);

static const rb_data_type_t buffer_data_type = {
    .wrap_struct_name = "FFI::Buffer",
    .function = {
        .dmark = buffer_mark,
        .dfree = RUBY_TYPED_DEFAULT_FREE,
        .dsize = buffer_memsize,
        ffi_compact_callback( buffer_compact )
    },
    .parent = &rbffi_abstract_memory_data_type,
    // IMPORTANT: WB_PROTECTED objects must only use the RB_OBJ_WRITE()
    // macro to update VALUE references, as to trigger write barriers.
    .flags = RUBY_TYPED_FREE_IMMEDIATELY | RUBY_TYPED_WB_PROTECTED | FFI_RUBY_TYPED_FROZEN_SHAREABLE
};

static const rb_data_type_t allocated_buffer_data_type = {
    .wrap_struct_name = "FFI::Buffer(allocated)",
    .function = {
        .dmark = NULL,
        .dfree = buffer_release,
        .dsize = allocated_buffer_memsize,
    },
    .parent = &buffer_data_type,
    // IMPORTANT: WB_PROTECTED objects must only use the RB_OBJ_WRITE()
    // macro to update VALUE references, as to trigger write barriers.
    .flags = RUBY_TYPED_FREE_IMMEDIATELY | RUBY_TYPED_WB_PROTECTED | FFI_RUBY_TYPED_FROZEN_SHAREABLE
};


static VALUE BufferClass = Qnil;

static VALUE
buffer_allocate(VALUE klass)
{
    Buffer* buffer;
    VALUE obj;

    obj = TypedData_Make_Struct(klass, Buffer, &allocated_buffer_data_type, buffer);
    RB_OBJ_WRITE(obj, &buffer->data.rbParent, Qnil);
    buffer->memory.flags = MEM_RD | MEM_WR;

    return obj;
}

static void
buffer_release(void *data)
{
    Buffer *ptr = (Buffer *)data;
    if ((ptr->memory.flags & MEM_EMBED) == 0 && ptr->data.storage != NULL) {
        xfree(ptr->data.storage);
        ptr->data.storage = NULL;
    }

    xfree(ptr);
}

/*
 * call-seq: initialize(size, count=1, clear=false)
 * @param [Integer, Symbol, #size] Type or size in bytes of a buffer cell
 * @param [Fixnum] count number of cell in the Buffer
 * @param [Boolean] clear if true, set the buffer to all-zero
 * @return [self]
 * @raise {NoMemoryError} if failed to allocate memory for Buffer
 * A new instance of Buffer.
 */
static VALUE
buffer_initialize(int argc, VALUE* argv, VALUE self)
{
    VALUE rbSize = Qnil, rbCount = Qnil, rbClear = Qnil;
    Buffer* p;
    int nargs;

    TypedData_Get_Struct(self, Buffer, &buffer_data_type, p);

    nargs = rb_scan_args(argc, argv, "12", &rbSize, &rbCount, &rbClear);
    p->memory.typeSize = rbffi_type_size(rbSize);
    p->memory.size = p->memory.typeSize * (nargs > 1 ? NUM2LONG(rbCount) : 1);

    if (p->memory.size > BUFFER_EMBED_MAXLEN) {
        p->data.storage = xmalloc(p->memory.size + 7);
        if (p->data.storage == NULL) {
            rb_raise(rb_eNoMemError, "Failed to allocate memory size=%lu bytes", p->memory.size);
            return Qnil;
        }

        /* ensure the memory is aligned on at least a 8 byte boundary */
        p->memory.address = (void *) (((uintptr_t) p->data.storage + 0x7) & (uintptr_t) ~0x7ULL);

        if (p->memory.size > 0 && (nargs < 3 || RTEST(rbClear))) {
            memset(p->memory.address, 0, p->memory.size);
        }

    } else {
        p->memory.flags |= MEM_EMBED;
        p->memory.address = (void *) &p->data.embed[0];
    }

    if (rb_block_given_p()) {
        return rb_ensure(rb_yield, self, buffer_free, self);
    }

    return self;
}

/*
 * call-seq: initialize_copy(other)
 * @return [self]
 * DO NOT CALL THIS METHOD.
 */
static VALUE
buffer_initialize_copy(VALUE self, VALUE other)
{
    AbstractMemory* src;
    Buffer* dst;

    TypedData_Get_Struct(self, Buffer, &buffer_data_type, dst);
    src = rbffi_AbstractMemory_Cast(other, &buffer_data_type);
    if ((dst->memory.flags & MEM_EMBED) == 0 && dst->data.storage != NULL) {
        xfree(dst->data.storage);
    }
    dst->data.storage = xmalloc(src->size + 7);
    if (dst->data.storage == NULL) {
        rb_raise(rb_eNoMemError, "failed to allocate memory size=%lu bytes", src->size);
        return Qnil;
    }

    dst->memory.address = (void *) (((uintptr_t) dst->data.storage + 0x7) & (uintptr_t) ~0x7ULL);
    dst->memory.size = src->size;
    dst->memory.typeSize = src->typeSize;

    /* finally, copy the actual buffer contents */
    memcpy(dst->memory.address, src->address, src->size);

    return self;
}

static VALUE
buffer_alloc_inout(int argc, VALUE* argv, VALUE klass)
{
    return buffer_initialize(argc, argv, buffer_allocate(klass));
}

static VALUE
slice(VALUE self, long offset, long len)
{
    Buffer* ptr;
    Buffer* result;
    VALUE obj = Qnil;

    TypedData_Get_Struct(self, Buffer, &buffer_data_type, ptr);
    checkBounds(&ptr->memory, offset, len);

    obj = TypedData_Make_Struct(BufferClass, Buffer, &buffer_data_type, result);
    result->memory.address = ptr->memory.address + offset;
    result->memory.size = len;
    result->memory.flags = ptr->memory.flags;
    result->memory.typeSize = ptr->memory.typeSize;
    RB_OBJ_WRITE(obj, &result->data.rbParent, self);

    return obj;
}

/*
 * call-seq: + offset
 * @param [Numeric] offset
 * @return [Buffer] a new instance of Buffer pointing from offset until end of previous buffer.
 * Add a Buffer with an offset
 */
static VALUE
buffer_plus(VALUE self, VALUE rbOffset)
{
    Buffer* ptr;
    long offset = NUM2LONG(rbOffset);

    TypedData_Get_Struct(self, Buffer, &buffer_data_type, ptr);

    return slice(self, offset, ptr->memory.size - offset);
}

/*
 * call-seq: slice(offset, length)
 * @param [Numeric] offset
 * @param [Numeric] length
 * @return [Buffer] a new instance of Buffer
 * Slice an existing Buffer.
 */
static VALUE
buffer_slice(VALUE self, VALUE rbOffset, VALUE rbLength)
{
    return slice(self, NUM2LONG(rbOffset), NUM2LONG(rbLength));
}

/*
 * call-seq: inspect
 * @return [String]
 * Inspect a Buffer.
 */
static VALUE
buffer_inspect(VALUE self)
{
    char tmp[100];
    Buffer* ptr;

    TypedData_Get_Struct(self, Buffer, &buffer_data_type, ptr);

    snprintf(tmp, sizeof(tmp), "#<FFI:Buffer:%p address=%p size=%ld>", ptr, ptr->memory.address, ptr->memory.size);

    return rb_str_new2(tmp);
}


#if BYTE_ORDER == LITTLE_ENDIAN
# define SWAPPED_ORDER BIG_ENDIAN
#else
# define SWAPPED_ORDER LITTLE_ENDIAN
#endif

/*
 * Set or get endianness of Buffer.
 * @overload order
 *  @return [:big, :little]
 *  Get endianness of Buffer.
 * @overload order(order)
 *  @param [:big, :little, :network] order
 *  @return [self]
 *  Set endianness of Buffer (+:network+ is an alias for +:big+).
 */
static VALUE
buffer_order(int argc, VALUE* argv, VALUE self)
{
    Buffer* ptr;

    TypedData_Get_Struct(self, Buffer, &buffer_data_type, ptr);
    if (argc == 0) {
        int order = (ptr->memory.flags & MEM_SWAP) == 0 ? BYTE_ORDER : SWAPPED_ORDER;
        return order == BIG_ENDIAN ? ID2SYM(rb_intern("big")) : ID2SYM(rb_intern("little"));
    } else {
        VALUE rbOrder = Qnil;
        int order = BYTE_ORDER;

        if (rb_scan_args(argc, argv, "1", &rbOrder) < 1) {
            rb_raise(rb_eArgError, "need byte order");
        }
        if (SYMBOL_P(rbOrder)) {
            ID id = SYM2ID(rbOrder);
            if (id == rb_intern("little")) {
                order = LITTLE_ENDIAN;

            } else if (id == rb_intern("big") || id == rb_intern("network")) {
                order = BIG_ENDIAN;
            }
        }
        if (order != BYTE_ORDER) {
            Buffer* p2;
            VALUE retval = slice(self, 0, ptr->memory.size);

            TypedData_Get_Struct(retval, Buffer, &buffer_data_type, p2);
            p2->memory.flags |= MEM_SWAP;
            return retval;
        }

        return self;
    }
}

/* Only used to free the buffer if the yield in the initializer throws an exception */
static VALUE
buffer_free(VALUE self)
{
    Buffer* ptr;

    TypedData_Get_Struct(self, Buffer, &buffer_data_type, ptr);
    if ((ptr->memory.flags & MEM_EMBED) == 0 && ptr->data.storage != NULL) {
        xfree(ptr->data.storage);
        ptr->data.storage = NULL;
    }

    return self;
}

static void
buffer_mark(void *data)
{
    Buffer *ptr = (Buffer *)data;
    rb_gc_mark_movable(ptr->data.rbParent);
}

static void
buffer_compact(void *data)
{
    Buffer *ptr = (Buffer *)data;
    ffi_gc_location(ptr->data.rbParent);
}

static size_t
buffer_memsize(const void *data)
{
    return sizeof(Buffer);
}

static size_t
allocated_buffer_memsize(const void *data)
{
    const Buffer *ptr = (const Buffer *)data;
    size_t memsize = sizeof(Buffer);
    if ((ptr->memory.flags & MEM_EMBED) == 0 && ptr->data.storage != NULL) {
        memsize += ptr->memory.size;
    }
    return memsize;
}

void
rbffi_Buffer_Init(VALUE moduleFFI)
{
    VALUE ffi_AbstractMemory =  rbffi_AbstractMemoryClass;

    /*
     * Document-class: FFI::Buffer < FFI::AbstractMemory
     *
     * A Buffer is a function argument type. It should be use with functions playing with C arrays.
     */
    BufferClass = rb_define_class_under(moduleFFI, "Buffer", ffi_AbstractMemory);

    /*
     * Document-variable: FFI::Buffer
     */
    rb_global_variable(&BufferClass);
    rb_define_alloc_func(BufferClass, buffer_allocate);

    /*
     * Document-method: alloc_inout
     * call-seq: alloc_inout(*args)
     * Create a new Buffer for in and out arguments (alias : <i>new_inout</i>).
     */
    rb_define_singleton_method(BufferClass, "alloc_inout", buffer_alloc_inout, -1);
    /*
     * Document-method: alloc_out
     * call-seq: alloc_out(*args)
     * Create a new Buffer for out arguments (alias : <i>new_out</i>).
     */
    rb_define_singleton_method(BufferClass, "alloc_out", buffer_alloc_inout, -1);
    /*
     * Document-method: alloc_in
     * call-seq: alloc_in(*args)
     * Create a new Buffer for in arguments (alias : <i>new_in</i>).
     */
    rb_define_singleton_method(BufferClass, "alloc_in", buffer_alloc_inout, -1);
    rb_define_alias(rb_singleton_class(BufferClass), "new_in", "alloc_in");
    rb_define_alias(rb_singleton_class(BufferClass), "new_out", "alloc_out");
    rb_define_alias(rb_singleton_class(BufferClass), "new_inout", "alloc_inout");

    rb_define_method(BufferClass, "initialize", buffer_initialize, -1);
    rb_define_method(BufferClass, "initialize_copy", buffer_initialize_copy, 1);
    rb_define_method(BufferClass, "order", buffer_order, -1);
    rb_define_method(BufferClass, "inspect", buffer_inspect, 0);
    rb_define_alias(BufferClass, "length", "total");
    rb_define_method(BufferClass, "+", buffer_plus, 1);
    rb_define_method(BufferClass, "slice", buffer_slice, 2);
}

