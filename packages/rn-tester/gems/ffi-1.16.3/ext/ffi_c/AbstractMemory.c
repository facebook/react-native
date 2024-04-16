/*
 * Copyright (c) 2008, 2009, Wayne Meissner
 * Copyright (C) 2009 Jake Douglas <jake@shiftedlabs.com>
 * Copyright (C) 2008 Luc Heinrich <luc@honk-honk.com>
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

#include <limits.h>
#include <ruby.h>

#include "rbffi.h"
#include "compat.h"
#include "AbstractMemory.h"
#include "Pointer.h"
#include "Function.h"
#include "LongDouble.h"

#ifdef PRIsVALUE
# define RB_OBJ_CLASSNAME(obj) rb_obj_class(obj)
# define RB_OBJ_STRING(obj) (obj)
#else
# define PRIsVALUE "s"
# define RB_OBJ_CLASSNAME(obj) rb_obj_classname(obj)
# define RB_OBJ_STRING(obj) StringValueCStr(obj)
#endif

static size_t memsize(const void *data);
static inline char* memory_address(VALUE self);
VALUE rbffi_AbstractMemoryClass = Qnil;
static VALUE NullPointerErrorClass = Qnil;
static ID id_to_ptr = 0, id_plus = 0, id_call = 0;

const rb_data_type_t rbffi_abstract_memory_data_type = { /* extern */
    .wrap_struct_name = "FFI::AbstractMemory",
    .function = {
        .dmark = NULL,
        .dfree = RUBY_TYPED_DEFAULT_FREE,
        .dsize = memsize,
    },
    // IMPORTANT: WB_PROTECTED objects must only use the RB_OBJ_WRITE()
    // macro to update VALUE references, as to trigger write barriers.
    .flags = RUBY_TYPED_FREE_IMMEDIATELY | RUBY_TYPED_WB_PROTECTED | FFI_RUBY_TYPED_FROZEN_SHAREABLE
};

static size_t
memsize(const void *data)
{
    return sizeof(AbstractMemory);
}

#define VAL(x, swap) (unlikely(((memory->flags & MEM_SWAP) != 0)) ? swap((x)) : (x))

#define NUM_OP(name, type, toNative, fromNative, swap) \
static void memory_op_put_##name(AbstractMemory* memory, long off, VALUE value); \
static void \
memory_op_put_##name(AbstractMemory* memory, long off, VALUE value) \
{ \
    type tmp = (type) VAL(toNative(value), swap); \
    checkWrite(memory); \
    checkBounds(memory, off, sizeof(type)); \
    memcpy(memory->address + off, &tmp, sizeof(tmp)); \
} \
static VALUE memory_put_##name(VALUE self, VALUE offset, VALUE value); \
static VALUE \
memory_put_##name(VALUE self, VALUE offset, VALUE value) \
{ \
    AbstractMemory* memory; \
    TypedData_Get_Struct(self, AbstractMemory, &rbffi_abstract_memory_data_type, memory); \
    memory_op_put_##name(memory, NUM2LONG(offset), value); \
    return self; \
} \
static VALUE memory_write_##name(VALUE self, VALUE value); \
static VALUE \
memory_write_##name(VALUE self, VALUE value) \
{ \
    AbstractMemory* memory; \
    TypedData_Get_Struct(self, AbstractMemory, &rbffi_abstract_memory_data_type, memory); \
    memory_op_put_##name(memory, 0, value); \
    return self; \
} \
static VALUE memory_op_get_##name(AbstractMemory* memory, long off); \
static VALUE \
memory_op_get_##name(AbstractMemory* memory, long off) \
{ \
    type tmp; \
    checkRead(memory); \
    checkBounds(memory, off, sizeof(type)); \
    memcpy(&tmp, memory->address + off, sizeof(tmp)); \
    return fromNative(VAL(tmp, swap)); \
} \
static VALUE memory_get_##name(VALUE self, VALUE offset); \
static VALUE \
memory_get_##name(VALUE self, VALUE offset) \
{ \
    AbstractMemory* memory; \
    TypedData_Get_Struct(self, AbstractMemory, &rbffi_abstract_memory_data_type, memory); \
    return memory_op_get_##name(memory, NUM2LONG(offset)); \
} \
static VALUE memory_read_##name(VALUE self); \
static VALUE \
memory_read_##name(VALUE self) \
{ \
    AbstractMemory* memory; \
    TypedData_Get_Struct(self, AbstractMemory, &rbffi_abstract_memory_data_type, memory); \
    return memory_op_get_##name(memory, 0); \
} \
static MemoryOp memory_op_##name = { memory_op_get_##name, memory_op_put_##name }; \
\
static VALUE memory_put_array_of_##name(VALUE self, VALUE offset, VALUE ary); \
static VALUE \
memory_put_array_of_##name(VALUE self, VALUE offset, VALUE ary) \
{ \
    long count; \
    long off = NUM2LONG(offset); \
    AbstractMemory* memory = MEMORY(self); \
    long i; \
    Check_Type(ary, T_ARRAY); \
    count = RARRAY_LEN(ary); \
    if (likely(count > 0)) checkWrite(memory); \
    checkBounds(memory, off, count * sizeof(type)); \
    for (i = 0; i < count; i++) { \
        type tmp = (type) VAL(toNative(RARRAY_AREF(ary, i)), swap); \
        memcpy(memory->address + off + (i * sizeof(type)), &tmp, sizeof(tmp)); \
    } \
    return self; \
} \
static VALUE memory_write_array_of_##name(VALUE self, VALUE ary); \
static VALUE \
memory_write_array_of_##name(VALUE self, VALUE ary) \
{ \
    return memory_put_array_of_##name(self, INT2FIX(0), ary); \
} \
static VALUE memory_get_array_of_##name(VALUE self, VALUE offset, VALUE length); \
static VALUE \
memory_get_array_of_##name(VALUE self, VALUE offset, VALUE length) \
{ \
    long count = NUM2LONG(length); \
    long off = NUM2LONG(offset); \
    AbstractMemory* memory = MEMORY(self); \
    VALUE retVal = rb_ary_new2(count); \
    long i; \
    if (likely(count > 0)) checkRead(memory); \
    checkBounds(memory, off, count * sizeof(type)); \
    for (i = 0; i < count; ++i) { \
        type tmp; \
        memcpy(&tmp, memory->address + off + (i * sizeof(type)), sizeof(tmp)); \
        rb_ary_push(retVal, fromNative(VAL(tmp, swap))); \
    } \
    return retVal; \
} \
static VALUE memory_read_array_of_##name(VALUE self, VALUE length); \
static VALUE \
memory_read_array_of_##name(VALUE self, VALUE length) \
{ \
    return memory_get_array_of_##name(self, INT2FIX(0), length); \
}

#define NOSWAP(x) (x)
#define bswap16(x) (((x) >> 8) & 0xff) | (((x) << 8) & 0xff00);
static inline int16_t
SWAPS16(int16_t x)
{
    return bswap16(x);
}

static inline uint16_t
SWAPU16(uint16_t x)
{
    return bswap16(x);
}

#if !defined(__GNUC__) || (__GNUC__ < 4) || (__GNUC__ == 4 && __GNUC_MINOR__ < 3)
#define bswap32(x) \
       (((x << 24) & 0xff000000) | \
        ((x <<  8) & 0x00ff0000) | \
        ((x >>  8) & 0x0000ff00) | \
        ((x >> 24) & 0x000000ff))

#define bswap64(x) \
       (((x << 56) & 0xff00000000000000ULL) | \
        ((x << 40) & 0x00ff000000000000ULL) | \
        ((x << 24) & 0x0000ff0000000000ULL) | \
        ((x <<  8) & 0x000000ff00000000ULL) | \
        ((x >>  8) & 0x00000000ff000000ULL) | \
        ((x >> 24) & 0x0000000000ff0000ULL) | \
        ((x >> 40) & 0x000000000000ff00ULL) | \
        ((x >> 56) & 0x00000000000000ffULL))

static inline int32_t
SWAPS32(int32_t x)
{
    return bswap32(x);
}

static inline uint32_t
SWAPU32(uint32_t x)
{
    return bswap32(x);
}

static inline int64_t
SWAPS64(int64_t x)
{
    return bswap64(x);
}

static inline uint64_t
SWAPU64(uint64_t x)
{
    return bswap64(x);
}

#else
# define SWAPS32(x) ((int32_t) __builtin_bswap32(x))
# define SWAPU32(x) ((uint32_t) __builtin_bswap32(x))
# define SWAPS64(x) ((int64_t) __builtin_bswap64(x))
# define SWAPU64(x) ((uint64_t) __builtin_bswap64(x))
#endif

#if LONG_MAX > INT_MAX
# define SWAPSLONG SWAPS64
# define SWAPULONG SWAPU64
#else
# define SWAPSLONG SWAPS32
# define SWAPULONG SWAPU32
#endif

NUM_OP(int8, int8_t, NUM2INT, INT2NUM, NOSWAP);
NUM_OP(uint8, uint8_t, NUM2UINT, UINT2NUM, NOSWAP);
NUM_OP(int16, int16_t, NUM2INT, INT2NUM, SWAPS16);
NUM_OP(uint16, uint16_t, NUM2UINT, UINT2NUM, SWAPU16);
NUM_OP(int32, int32_t, NUM2INT, INT2NUM, SWAPS32);
NUM_OP(uint32, uint32_t, NUM2UINT, UINT2NUM, SWAPU32);
NUM_OP(int64, int64_t, NUM2LL, LL2NUM, SWAPS64);
NUM_OP(uint64, uint64_t, NUM2ULL, ULL2NUM, SWAPU64);
NUM_OP(long, long, NUM2LONG, LONG2NUM, SWAPSLONG);
NUM_OP(ulong, unsigned long, NUM2ULONG, ULONG2NUM, SWAPULONG);
NUM_OP(float32, float, NUM2DBL, rb_float_new, NOSWAP);
NUM_OP(float64, double, NUM2DBL, rb_float_new, NOSWAP);
NUM_OP(longdouble, long double, rbffi_num2longdouble, rbffi_longdouble_new, NOSWAP);

static inline void*
get_pointer_value(VALUE value)
{
    const int type = TYPE(value);
    if (type == T_DATA && rb_obj_is_kind_of(value, rbffi_PointerClass)) {
        return memory_address(value);
    } else if (type == T_NIL) {
        return NULL;
    } else if (type == T_FIXNUM) {
        return (void *) (uintptr_t) FIX2ULONG(value);
    } else if (type == T_BIGNUM) {
        return (void *) (uintptr_t) NUM2ULL(value);
    } else if (rb_respond_to(value, id_to_ptr)) {
        return MEMORY_PTR(rb_funcall2(value, id_to_ptr, 0, NULL));
    } else {
        rb_raise(rb_eArgError, "value is not a pointer");
        return NULL;
    }
}

NUM_OP(pointer, void *, get_pointer_value, rbffi_Pointer_NewInstance, NOSWAP);

static inline uint8_t
rbffi_bool_value(VALUE value)
{
    return RTEST(value);
}

static inline VALUE
rbffi_bool_new(uint8_t value)
{
    return (value & 1) != 0 ? Qtrue : Qfalse;
}

NUM_OP(bool, unsigned char, rbffi_bool_value, rbffi_bool_new, NOSWAP);


/*
 * call-seq: memory.clear
 * Set the memory to all-zero.
 * @return [self]
 */
static VALUE
memory_clear(VALUE self)
{
    AbstractMemory* ptr = MEMORY(self);
    checkWrite(ptr);
    memset(ptr->address, 0, ptr->size);
    return self;
}

/*
 * call-seq: memory.size
 * Return memory size in bytes (alias: #total)
 * @return [Numeric]
 */
static VALUE
memory_size(VALUE self)
{
    AbstractMemory* ptr;

    TypedData_Get_Struct(self, AbstractMemory, &rbffi_abstract_memory_data_type, ptr);

    return LONG2NUM(ptr->size);
}

/*
 * call-seq: memory.get(type, offset)
 * Return data of given type contained in memory.
 * @param [Symbol, Type] type_name type of data to get
 * @param [Numeric] offset point in buffer to start from
 * @return [Object]
 * @raise {ArgumentError} if type is not supported
 */
static VALUE
memory_get(VALUE self, VALUE type_name, VALUE offset)
{
    AbstractMemory* ptr;
    VALUE nType;
    Type *type;
    MemoryOp *op;

    nType = rbffi_Type_Lookup(type_name);
    if(NIL_P(nType)) goto undefined_type;

    TypedData_Get_Struct(self, AbstractMemory, &rbffi_abstract_memory_data_type, ptr);
    TypedData_Get_Struct(nType, Type, &rbffi_type_data_type, type);

    op = get_memory_op(type);
    if(op == NULL) goto undefined_type;

    return op->get(ptr, NUM2LONG(offset));

undefined_type: {
    VALUE msg = rb_sprintf("undefined type '%" PRIsVALUE "'", type_name);
    rb_exc_raise(rb_exc_new3(rb_eArgError, msg));
    return Qnil;
  }
}

/*
 * call-seq: memory.put(type, offset, value)
 * @param [Symbol, Type] type_name type of data to put
 * @param [Numeric] offset point in buffer to start from
 * @return [nil]
 * @raise {ArgumentError} if type is not supported
 */
static VALUE
memory_put(VALUE self, VALUE type_name, VALUE offset, VALUE value)
{
    AbstractMemory* ptr;
    VALUE nType;
    Type *type;
    MemoryOp *op;

    nType = rbffi_Type_Lookup(type_name);
    if(NIL_P(nType)) goto undefined_type;

    TypedData_Get_Struct(self, AbstractMemory, &rbffi_abstract_memory_data_type, ptr);
    TypedData_Get_Struct(nType, Type, &rbffi_type_data_type, type);

    op = get_memory_op(type);
    if(op == NULL) goto undefined_type;

    op->put(ptr, NUM2LONG(offset), value);
    return Qnil;

undefined_type: {
    VALUE msg = rb_sprintf("unsupported type '%" PRIsVALUE "'", type_name);
    rb_exc_raise(rb_exc_new3(rb_eArgError, msg));
    return Qnil;
  }
}

/*
 * call-seq: memory.get_string(offset, length=nil)
 * Return string contained in memory.
 * @param [Numeric] offset point in buffer to start from
 * @param [Numeric] length string's length in bytes. If nil, a (memory size - offset) length string is returned).
 * @return [String]
 * @raise {IndexError} if +length+ is too great
 * @raise {NullPointerError} if memory not initialized
 */
static VALUE
memory_get_string(int argc, VALUE* argv, VALUE self)
{
    VALUE length = Qnil, offset = Qnil;
    AbstractMemory* ptr = MEMORY(self);
    long off, len;
    char* end;
    int nargs = rb_scan_args(argc, argv, "11", &offset, &length);

    off = NUM2LONG(offset);
    len = nargs > 1 && length != Qnil ? NUM2LONG(length) : (ptr->size - off);
    checkRead(ptr);
    checkBounds(ptr, off, len);

    end = memchr(ptr->address + off, 0, len);
    return rb_str_new((char *) ptr->address + off,
            (end != NULL ? end - ptr->address - off : len));
}

/*
 * call-seq: memory.get_array_of_string(offset, count=nil)
 * Return an array of strings contained in memory.
 * @param [Numeric] offset point in memory to start from
 * @param [Numeric] count number of strings to get. If nil, return all strings
 * @return [Array<String>]
 * @raise {IndexError} if +offset+ is too great
 * @raise {NullPointerError} if memory not initialized
 */
static VALUE
memory_get_array_of_string(int argc, VALUE* argv, VALUE self)
{
    VALUE offset = Qnil, countnum = Qnil, retVal = Qnil;
    AbstractMemory* ptr;
    long off;
    int count;

    rb_scan_args(argc, argv, "11", &offset, &countnum);
    off = NUM2LONG(offset);
    count = (countnum == Qnil ? 0 : NUM2INT(countnum));
    retVal = rb_ary_new2(count);

    TypedData_Get_Struct(self, AbstractMemory, &rbffi_abstract_memory_data_type, ptr);
    checkRead(ptr);

    if (countnum != Qnil) {
        int i;

        checkBounds(ptr, off, count * sizeof (char*));

        for (i = 0; i < count; ++i) {
            const char* strptr = *((const char**) (ptr->address + off) + i);
            rb_ary_push(retVal, (strptr == NULL ? Qnil : rb_str_new2(strptr)));
        }

    } else {
        checkBounds(ptr, off, sizeof (char*));
        for ( ; off < ptr->size - (long) sizeof (void *); off += (long) sizeof (void *)) {
            const char* strptr = *(const char**) (ptr->address + off);
            if (strptr == NULL) {
                break;
            }
            rb_ary_push(retVal, rb_str_new2(strptr));
        }
    }

    return retVal;
}

/*
 * call-seq: memory.read_array_of_string(count=nil)
 * Return an array of strings contained in memory. Same as:
 *  memory.get_array_of_string(0, count)
 * @param [Numeric] count number of strings to get. If nil, return all strings
 * @return [Array<String>]
 */
static VALUE
memory_read_array_of_string(int argc, VALUE* argv, VALUE self)
{
    VALUE* rargv = ALLOCA_N(VALUE, argc + 1);
    int i;

    rargv[0] = INT2FIX(0);
    for (i = 0; i < argc; i++) {
        rargv[i + 1] = argv[i];
    }

    return memory_get_array_of_string(argc + 1, rargv, self);
}


/*
 * call-seq: memory.put_string(offset, str)
 * @param [Numeric] offset
 * @param [String] str
 * @return [self]
 * @raise {SecurityError} when writing unsafe string to memory
 * @raise {IndexError} if +offset+ is too great
 * @raise {NullPointerError} if memory not initialized
 * Put a string in memory.
 */
static VALUE
memory_put_string(VALUE self, VALUE offset, VALUE str)
{
    AbstractMemory* ptr = MEMORY(self);
    long off, len;

    Check_Type(str, T_STRING);
    off = NUM2LONG(offset);
    len = RSTRING_LEN(str);

    checkWrite(ptr);
    checkBounds(ptr, off, len + 1);

    memcpy(ptr->address + off, RSTRING_PTR(str), len);
    *((char *) ptr->address + off + len) = '\0';

    return self;
}

/*
 * call-seq: memory.get_bytes(offset, length)
 * Return string contained in memory.
 * @param [Numeric] offset point in buffer to start from
 * @param [Numeric] length string's length in bytes.
 * @return [String]
 * @raise {IndexError} if +length+ is too great
 * @raise {NullPointerError} if memory not initialized
 */
static VALUE
memory_get_bytes(VALUE self, VALUE offset, VALUE length)
{
    AbstractMemory* ptr = MEMORY(self);
    long off, len;

    off = NUM2LONG(offset);
    len = NUM2LONG(length);

    checkRead(ptr);
    checkBounds(ptr, off, len);

    return rb_str_new((char *) ptr->address + off, len);
}

/*
 * call-seq: memory.put_bytes(offset, str, index=0, length=nil)
 * Put a string in memory.
 * @param [Numeric] offset point in buffer to start from
 * @param [String] str string to put to memory
 * @param [Numeric] index
 * @param [Numeric] length string's length in bytes. If nil, a (memory size - offset) length string is returned).
 * @return [self]
 * @raise {IndexError} if +length+ is too great
 * @raise {NullPointerError} if memory not initialized
 * @raise {RangeError} if +index+ is negative, or if index+length is greater than size of string
 * @raise {SecurityError} when writing unsafe string to memory
 */
static VALUE
memory_put_bytes(int argc, VALUE* argv, VALUE self)
{
    AbstractMemory* ptr = MEMORY(self);
    VALUE offset = Qnil, str = Qnil, rbIndex = Qnil, rbLength = Qnil;
    long off, len, idx;
    int nargs = rb_scan_args(argc, argv, "22", &offset, &str, &rbIndex, &rbLength);

    Check_Type(str, T_STRING);

    off = NUM2LONG(offset);
    idx = nargs > 2 ? NUM2LONG(rbIndex) : 0;
    if (idx < 0) {
        rb_raise(rb_eRangeError, "index cannot be less than zero");
        return Qnil;
    }
    len = nargs > 3 ? NUM2LONG(rbLength) : (RSTRING_LEN(str) - idx);
    if ((idx + len) > RSTRING_LEN(str)) {
        rb_raise(rb_eRangeError, "index+length is greater than size of string");
        return Qnil;
    }

    checkWrite(ptr);
    checkBounds(ptr, off, len);

    memcpy(ptr->address + off, RSTRING_PTR(str) + idx, len);

    return self;
}

/*
 * call-seq: memory.read_bytes(length)
 * @param [Numeric] length of string to return
 * @return [String]
 * equivalent to :
 *  memory.get_bytes(0, length)
 */
static VALUE
memory_read_bytes(VALUE self, VALUE length)
{
    return memory_get_bytes(self, INT2FIX(0), length);
}

/*
 * call-seq: memory.write_bytes(str, index=0, length=nil)
 * @param [String] str string to put to memory
 * @param [Numeric] index
 * @param [Numeric] length string's length in bytes. If nil, a (memory size - offset) length string is returned).
 * @return [self]
 * equivalent to :
 *  memory.put_bytes(0, str, index, length)
 */
static VALUE
memory_write_bytes(int argc, VALUE* argv, VALUE self)
{
    VALUE* wargv = ALLOCA_N(VALUE, argc + 1);
    int i;

    wargv[0] = INT2FIX(0);
    for (i = 0; i < argc; i++) {
        wargv[i + 1] = argv[i];
    }

    return memory_put_bytes(argc + 1, wargv, self);
}

/*
 * call-seq: memory.type_size
 * @return [Numeric] type size in bytes
 * Get the memory's type size.
 */
static VALUE
memory_type_size(VALUE self)
{
    AbstractMemory* ptr;

    TypedData_Get_Struct(self, AbstractMemory, &rbffi_abstract_memory_data_type, ptr);

    return INT2NUM(ptr->typeSize);
}

/*
 * Document-method: []
 * call-seq: memory[idx]
 * @param [Numeric] idx index to access in memory
 * @return
 * Memory read accessor.
 */
static VALUE
memory_aref(VALUE self, VALUE idx)
{
    AbstractMemory* ptr;
    VALUE rbOffset = Qnil;

    TypedData_Get_Struct(self, AbstractMemory, &rbffi_abstract_memory_data_type, ptr);

    rbOffset = ULONG2NUM(NUM2ULONG(idx) * ptr->typeSize);

    return rb_funcall2(self, id_plus, 1, &rbOffset);
}

static inline char*
memory_address(VALUE obj)
{
    AbstractMemory *mem;
    TypedData_Get_Struct(obj, AbstractMemory, &rbffi_abstract_memory_data_type, mem);
    return mem->address;
}

static VALUE
memory_copy_from(VALUE self, VALUE rbsrc, VALUE rblen)
{
    AbstractMemory* dst;

    TypedData_Get_Struct(self, AbstractMemory, &rbffi_abstract_memory_data_type, dst);

    memcpy(dst->address, rbffi_AbstractMemory_Cast(rbsrc, &rbffi_abstract_memory_data_type)->address, NUM2INT(rblen));

    return self;
}

/*
 * call-seq:
 *    res.freeze
 *
 * Freeze the AbstractMemory object and unset the writable flag.
 */
static VALUE
memory_freeze(VALUE self)
{
    AbstractMemory* ptr = MEMORY(self);
    ptr->flags &= ~MEM_WR;
    return rb_call_super(0, NULL);
}

AbstractMemory*
rbffi_AbstractMemory_Cast(VALUE obj, const rb_data_type_t *data_type)
{
    AbstractMemory* memory;
    TypedData_Get_Struct(obj, AbstractMemory, data_type, memory);
    return memory;
}

void
rbffi_AbstractMemory_Error(AbstractMemory *mem, int op)
{
    VALUE rbErrorClass = mem->address == NULL ? NullPointerErrorClass : rb_eRuntimeError;
    if (op == MEM_RD) {
        rb_raise(rbErrorClass, "invalid memory read at address=%p", mem->address);
    } else if (op == MEM_WR) {
        rb_raise(rbErrorClass, "invalid memory write at address=%p", mem->address);
    } else {
        rb_raise(rbErrorClass, "invalid memory access at address=%p", mem->address);
    }
}

static VALUE
memory_op_get_strptr(AbstractMemory* ptr, long offset)
{
    void* tmp = NULL;

    if (ptr != NULL && ptr->address != NULL) {
        checkRead(ptr);
        checkBounds(ptr, offset, sizeof(tmp));
        memcpy(&tmp, ptr->address + offset, sizeof(tmp));
    }

    return tmp != NULL ? rb_str_new2(tmp) : Qnil;
}

static void
memory_op_put_strptr(AbstractMemory* ptr, long offset, VALUE value)
{
    rb_raise(rb_eArgError, "Cannot set :string fields");
}

static MemoryOp memory_op_strptr = { memory_op_get_strptr, memory_op_put_strptr };


MemoryOps rbffi_AbstractMemoryOps = {
    &memory_op_int8, /*.int8 */
    &memory_op_uint8, /* .uint8 */
    &memory_op_int16, /* .int16 */
    &memory_op_uint16, /* .uint16 */
    &memory_op_int32, /* .int32 */
    &memory_op_uint32, /* .uint32 */
    &memory_op_int64, /* .int64 */
    &memory_op_uint64, /* .uint64 */
    &memory_op_long, /* .slong */
    &memory_op_ulong, /* .uslong */
    &memory_op_float32, /* .float32 */
    &memory_op_float64, /* .float64 */
    &memory_op_longdouble, /* .longdouble */
    &memory_op_pointer, /* .pointer */
    &memory_op_strptr, /* .strptr */
    &memory_op_bool /* .boolOp */
};

void
rbffi_AbstractMemory_Init(VALUE moduleFFI)
{
    /*
     * Document-class: FFI::AbstractMemory
     *
     * {AbstractMemory} is the base class for many memory management classes such as {Buffer}.
     *
     * This class has a lot of methods to work with integers :
     * * put_int<i>size</i>(offset, value)
     * * get_int<i>size</i>(offset)
     * * put_uint<i>size</i>(offset, value)
     * * get_uint<i>size</i>(offset)
     * * writeuint<i>size</i>(value)
     * * read_int<i>size</i>
     * * write_uint<i>size</i>(value)
     * * read_uint<i>size</i>
     * * put_array_of_int<i>size</i>(offset, ary)
     * * get_array_of_int<i>size</i>(offset, length)
     * * put_array_of_uint<i>size</i>(offset, ary)
     * * get_array_of_uint<i>size</i>(offset, length)
     * * write_array_of_int<i>size</i>(ary)
     * * read_array_of_int<i>size</i>(length)
     * * write_array_of_uint<i>size</i>(ary)
     * * read_array_of_uint<i>size</i>(length)
     * where _size_ is 8, 16, 32 or 64. Same methods exist for long type.
     *
     * Aliases exist : _char_ for _int8_, _short_ for _int16_, _int_ for _int32_ and <i>long_long</i> for _int64_.
     *
     * Others methods are listed below.
     */
    VALUE classMemory = rb_define_class_under(moduleFFI, "AbstractMemory", rb_cObject);
    rbffi_AbstractMemoryClass = classMemory;
    /*
     * Document-variable: FFI::AbstractMemory
     */
    rb_global_variable(&rbffi_AbstractMemoryClass);
    rb_undef_alloc_func(classMemory);

    NullPointerErrorClass = rb_define_class_under(moduleFFI, "NullPointerError", rb_eRuntimeError);
    /* Document-variable: NullPointerError */
    rb_global_variable(&NullPointerErrorClass);


#undef INT
#define INT(type) \
    rb_define_method(classMemory, "put_" #type, memory_put_##type, 2); \
    rb_define_method(classMemory, "get_" #type, memory_get_##type, 1); \
    rb_define_method(classMemory, "put_u" #type, memory_put_u##type, 2); \
    rb_define_method(classMemory, "get_u" #type, memory_get_u##type, 1); \
    rb_define_method(classMemory, "write_" #type, memory_write_##type, 1); \
    rb_define_method(classMemory, "read_" #type, memory_read_##type, 0); \
    rb_define_method(classMemory, "write_u" #type, memory_write_u##type, 1); \
    rb_define_method(classMemory, "read_u" #type, memory_read_u##type, 0); \
    rb_define_method(classMemory, "put_array_of_" #type, memory_put_array_of_##type, 2); \
    rb_define_method(classMemory, "get_array_of_" #type, memory_get_array_of_##type, 2); \
    rb_define_method(classMemory, "put_array_of_u" #type, memory_put_array_of_u##type, 2); \
    rb_define_method(classMemory, "get_array_of_u" #type, memory_get_array_of_u##type, 2); \
    rb_define_method(classMemory, "write_array_of_" #type, memory_write_array_of_##type, 1); \
    rb_define_method(classMemory, "read_array_of_" #type, memory_read_array_of_##type, 1); \
    rb_define_method(classMemory, "write_array_of_u" #type, memory_write_array_of_u##type, 1); \
    rb_define_method(classMemory, "read_array_of_u" #type, memory_read_array_of_u##type, 1);

    INT(int8);
    INT(int16);
    INT(int32);
    INT(int64);
    INT(long);

#define ALIAS(name, old) \
    rb_define_alias(classMemory, "put_" #name, "put_" #old); \
    rb_define_alias(classMemory, "get_" #name, "get_" #old); \
    rb_define_alias(classMemory, "put_u" #name, "put_u" #old); \
    rb_define_alias(classMemory, "get_u" #name, "get_u" #old); \
    rb_define_alias(classMemory, "write_" #name, "write_" #old); \
    rb_define_alias(classMemory, "read_" #name, "read_" #old); \
    rb_define_alias(classMemory, "write_u" #name, "write_u" #old); \
    rb_define_alias(classMemory, "read_u" #name, "read_u" #old); \
    rb_define_alias(classMemory, "put_array_of_" #name, "put_array_of_" #old); \
    rb_define_alias(classMemory, "get_array_of_" #name, "get_array_of_" #old); \
    rb_define_alias(classMemory, "put_array_of_u" #name, "put_array_of_u" #old); \
    rb_define_alias(classMemory, "get_array_of_u" #name, "get_array_of_u" #old); \
    rb_define_alias(classMemory, "write_array_of_" #name, "write_array_of_" #old); \
    rb_define_alias(classMemory, "read_array_of_" #name, "read_array_of_" #old); \
    rb_define_alias(classMemory, "write_array_of_u" #name, "write_array_of_u" #old); \
    rb_define_alias(classMemory, "read_array_of_u" #name, "read_array_of_u" #old);

    ALIAS(char, int8);
    ALIAS(short, int16);
    ALIAS(int, int32);
    ALIAS(long_long, int64);

    /*
     * Document-method: put_float32
     * call-seq: memory.put_float32offset, value)
     * @param [Numeric] offset
     * @param [Numeric] value
     * @return [self]
     * Put +value+ as a 32-bit float in memory at offset +offset+ (alias: #put_float).
     */
    rb_define_method(classMemory, "put_float32", memory_put_float32, 2);
    /*
     * Document-method: get_float32
     * call-seq: memory.get_float32(offset)
     * @param [Numeric] offset
     * @return [Float]
     * Get a 32-bit float from memory at offset +offset+ (alias: #get_float).
     */
    rb_define_method(classMemory, "get_float32", memory_get_float32, 1);
    rb_define_alias(classMemory, "put_float", "put_float32");
    rb_define_alias(classMemory, "get_float", "get_float32");
    /*
     * Document-method: write_float
     * call-seq: memory.write_float(value)
     * @param [Numeric] value
     * @return [self]
     * Write +value+ as a 32-bit float in memory.
     *
     * Same as:
     *  memory.put_float(0, value)
     */
    rb_define_method(classMemory, "write_float", memory_write_float32, 1);
    /*
     * Document-method: read_float
     * call-seq: memory.read_float
     * @return [Float]
     * Read a 32-bit float from memory.
     *
     * Same as:
     *  memory.get_float(0)
     */
    rb_define_method(classMemory, "read_float", memory_read_float32, 0);
    /*
     * Document-method: put_array_of_float32
     * call-seq: memory.put_array_of_float32(offset, ary)
     * @param [Numeric] offset
     * @param [Array<Numeric>] ary
     * @return [self]
     * Put values from +ary+ as 32-bit floats in memory from offset +offset+ (alias: #put_array_of_float).
     */
    rb_define_method(classMemory, "put_array_of_float32", memory_put_array_of_float32, 2);
    /*
     * Document-method: get_array_of_float32
     * call-seq: memory.get_array_of_float32(offset, length)
     * @param [Numeric] offset
     * @param [Numeric] length number of Float to get
     * @return [Array<Float>]
     * Get 32-bit floats in memory from offset +offset+ (alias: #get_array_of_float).
     */
    rb_define_method(classMemory, "get_array_of_float32", memory_get_array_of_float32, 2);
    /*
     * Document-method: write_array_of_float
     * call-seq: memory.write_array_of_float(ary)
     * @param [Array<Numeric>] ary
     * @return [self]
     * Write values from +ary+ as 32-bit floats in memory.
     *
     * Same as:
     *  memory.put_array_of_float(0, ary)
     */
    rb_define_method(classMemory, "write_array_of_float", memory_write_array_of_float32, 1);
    /*
     * Document-method: read_array_of_float
     * call-seq: memory.read_array_of_float(length)
     * @param [Numeric] length number of Float to read
     * @return [Array<Float>]
     * Read 32-bit floats from memory.
     *
     * Same as:
     *  memory.get_array_of_float(0, ary)
     */
    rb_define_method(classMemory, "read_array_of_float", memory_read_array_of_float32, 1);
    rb_define_alias(classMemory, "put_array_of_float", "put_array_of_float32");
    rb_define_alias(classMemory, "get_array_of_float", "get_array_of_float32");
    /*
     * Document-method: put_float64
     * call-seq: memory.put_float64(offset, value)
     * @param [Numeric] offset
     * @param [Numeric] value
     * @return [self]
     * Put +value+ as a 64-bit float (double) in memory at offset +offset+ (alias: #put_double).
     */
    rb_define_method(classMemory, "put_float64", memory_put_float64, 2);
    /*
     * Document-method: get_float64
     * call-seq: memory.get_float64(offset)
     * @param [Numeric] offset
     * @return [Float]
     * Get a 64-bit float (double) from memory at offset +offset+ (alias: #get_double).
     */
    rb_define_method(classMemory, "get_float64", memory_get_float64, 1);
    rb_define_alias(classMemory, "put_double", "put_float64");
    rb_define_alias(classMemory, "get_double", "get_float64");
    /*
     * Document-method: write_double
     * call-seq: memory.write_double(value)
     * @param [Numeric] value
     * @return [self]
     * Write +value+ as a 64-bit float (double) in memory.
     *
     * Same as:
     *  memory.put_double(0, value)
     */
    rb_define_method(classMemory, "write_double", memory_write_float64, 1);
    /*
     * Document-method: read_double
     * call-seq: memory.read_double
     * @return [Float]
     * Read a 64-bit float (double) from memory.
     *
     * Same as:
     *  memory.get_double(0)
     */
    rb_define_method(classMemory, "read_double", memory_read_float64, 0);
    /*
     * Document-method: put_array_of_float64
     * call-seq: memory.put_array_of_float64(offset, ary)
     * @param [Numeric] offset
     * @param [Array<Numeric>] ary
     * @return [self]
     * Put values from +ary+ as 64-bit floats (doubles) in memory from offset +offset+ (alias: #put_array_of_double).
     */
    rb_define_method(classMemory, "put_array_of_float64", memory_put_array_of_float64, 2);
    /*
     * Document-method: get_array_of_float64
     * call-seq: memory.get_array_of_float64(offset, length)
     * @param [Numeric] offset
     * @param [Numeric] length number of Float to get
     * @return [Array<Float>]
     * Get 64-bit floats (doubles) in memory from offset +offset+ (alias: #get_array_of_double).
     */
    rb_define_method(classMemory, "get_array_of_float64", memory_get_array_of_float64, 2);
    /*
     * Document-method: write_array_of_double
     * call-seq: memory.write_array_of_double(ary)
     * @param [Array<Numeric>] ary
     * @return [self]
     * Write values from +ary+ as 64-bit floats (doubles) in memory.
     *
     * Same as:
     *  memory.put_array_of_double(0, ary)
     */
    rb_define_method(classMemory, "write_array_of_double", memory_write_array_of_float64, 1);
    /*
     * Document-method: read_array_of_double
     * call-seq: memory.read_array_of_double(length)
     * @param [Numeric] length number of Float to read
     * @return [Array<Float>]
     * Read 64-bit floats (doubles) from memory.
     *
     * Same as:
     *  memory.get_array_of_double(0, ary)
     */
    rb_define_method(classMemory, "read_array_of_double", memory_read_array_of_float64, 1);
    rb_define_alias(classMemory, "put_array_of_double", "put_array_of_float64");
    rb_define_alias(classMemory, "get_array_of_double", "get_array_of_float64");
    /*
     * Document-method: put_pointer
     * call-seq: memory.put_pointer(offset, value)
     * @param [Numeric] offset
     * @param [nil,Pointer, Integer, #to_ptr] value
     * @return [self]
     * Put +value+ in memory from +offset+..
     */
    rb_define_method(classMemory, "put_pointer", memory_put_pointer, 2);
    /*
     * Document-method: get_pointer
     * call-seq: memory.get_pointer(offset)
     * @param [Numeric] offset
     * @return [Pointer]
     * Get a {Pointer} to the memory from +offset+.
     */
    rb_define_method(classMemory, "get_pointer", memory_get_pointer, 1);
    /*
     * Document-method: write_pointer
     * call-seq: memory.write_pointer(value)
     * @param [nil,Pointer, Integer, #to_ptr] value
     * @return [self]
     * Write +value+ in memory.
     *
     * Equivalent to:
     *  memory.put_pointer(0, value)
     */
    rb_define_method(classMemory, "write_pointer", memory_write_pointer, 1);
    /*
     * Document-method: read_pointer
     * call-seq: memory.read_pointer
     * @return [Pointer]
     * Get a {Pointer} to the memory from base address.
     *
     * Equivalent to:
     *  memory.get_pointer(0)
     */
    rb_define_method(classMemory, "read_pointer", memory_read_pointer, 0);
    /*
     * Document-method: put_array_of_pointer
     * call-seq: memory.put_array_of_pointer(offset, ary)
     * @param [Numeric] offset
     * @param [Array<#to_ptr>] ary
     * @return [self]
     * Put an array of {Pointer} into memory from +offset+.
     */
    rb_define_method(classMemory, "put_array_of_pointer", memory_put_array_of_pointer, 2);
    /*
     * Document-method: get_array_of_pointer
     * call-seq: memory.get_array_of_pointer(offset, length)
     * @param [Numeric] offset
     * @param [Numeric] length
     * @return [Array<Pointer>]
     * Get an array of {Pointer} of length +length+ from +offset+.
     */
    rb_define_method(classMemory, "get_array_of_pointer", memory_get_array_of_pointer, 2);
    /*
     * Document-method: write_array_of_pointer
     * call-seq: memory.write_array_of_pointer(ary)
     * @param [Array<#to_ptr>] ary
     * @return [self]
     * Write an array of {Pointer} into memory from +offset+.
     *
     * Same as :
     *  memory.put_array_of_pointer(0, ary)
     */
    rb_define_method(classMemory, "write_array_of_pointer", memory_write_array_of_pointer, 1);
    /*
     * Document-method: read_array_of_pointer
     * call-seq: memory.read_array_of_pointer(length)
     * @param [Numeric] length
     * @return [Array<Pointer>]
     * Read an array of {Pointer} of length +length+.
     *
     * Same as:
     *  memory.get_array_of_pointer(0, length)
     */
    rb_define_method(classMemory, "read_array_of_pointer", memory_read_array_of_pointer, 1);

    rb_define_method(classMemory, "get_string", memory_get_string, -1);
    rb_define_method(classMemory, "put_string", memory_put_string, 2);
    rb_define_method(classMemory, "get_bytes", memory_get_bytes, 2);
    rb_define_method(classMemory, "put_bytes", memory_put_bytes, -1);
    rb_define_method(classMemory, "read_bytes", memory_read_bytes, 1);
    rb_define_method(classMemory, "write_bytes", memory_write_bytes, -1);
    rb_define_method(classMemory, "get_array_of_string", memory_get_array_of_string, -1);

    rb_define_method(classMemory, "get", memory_get, 2);
    rb_define_method(classMemory, "put", memory_put, 3);

    rb_define_method(classMemory, "clear", memory_clear, 0);
    rb_define_method(classMemory, "total", memory_size, 0);
    rb_define_alias(classMemory, "size", "total");
    rb_define_method(classMemory, "type_size", memory_type_size, 0);
    rb_define_method(classMemory, "[]", memory_aref, 1);
    rb_define_method(classMemory, "__copy_from__", memory_copy_from, 2);
    rb_define_method(classMemory, "freeze", memory_freeze, 0 );

    id_to_ptr = rb_intern("to_ptr");
    id_call = rb_intern("call");
    id_plus = rb_intern("+");
}

