/* -----------------------------------------------------------------------
   ffi.c - Copyright (c) 2015 Michael Knyszek <mknyszek@berkeley.edu>
                         2015 Andrew Waterman <waterman@cs.berkeley.edu>
                         2018 Stef O'Rear <sorear2@gmail.com>
   Based on MIPS N32/64 port

   RISC-V Foreign Function Interface

   Permission is hereby granted, free of charge, to any person obtaining
   a copy of this software and associated documentation files (the
   ``Software''), to deal in the Software without restriction, including
   without limitation the rights to use, copy, modify, merge, publish,
   distribute, sublicense, and/or sell copies of the Software, and to
   permit persons to whom the Software is furnished to do so, subject to
   the following conditions:

   The above copyright notice and this permission notice shall be included
   in all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED ``AS IS'', WITHOUT WARRANTY OF ANY KIND,
   EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
   NONINFRINGEMENT.  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
   HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
   WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
   DEALINGS IN THE SOFTWARE.
   ----------------------------------------------------------------------- */

#include <ffi.h>
#include <ffi_common.h>

#include <stdlib.h>
#include <stdint.h>

#if __riscv_float_abi_double
#define ABI_FLEN 64
#define ABI_FLOAT double
#elif __riscv_float_abi_single
#define ABI_FLEN 32
#define ABI_FLOAT float
#endif

#define NARGREG 8
#define STKALIGN 16
#define MAXCOPYARG (2 * sizeof(double))

typedef struct call_context
{
#if ABI_FLEN
    ABI_FLOAT fa[8];
#endif
    size_t a[8];
    /* used by the assembly code to in-place construct its own stack frame */
    char frame[16];
} call_context;

typedef struct call_builder
{
    call_context *aregs;
    int used_integer;
    int used_float;
    size_t *used_stack;
    void *struct_stack;
} call_builder;

/* integer (not pointer) less than ABI XLEN */
/* FFI_TYPE_INT does not appear to be used */
#if __SIZEOF_POINTER__ == 8
#define IS_INT(type) ((type) >= FFI_TYPE_UINT8 && (type) <= FFI_TYPE_SINT64)
#else
#define IS_INT(type) ((type) >= FFI_TYPE_UINT8 && (type) <= FFI_TYPE_SINT32)
#endif

#if ABI_FLEN
typedef struct {
    char as_elements, type1, offset2, type2;
} float_struct_info;

#if ABI_FLEN >= 64
#define IS_FLOAT(type) ((type) >= FFI_TYPE_FLOAT && (type) <= FFI_TYPE_DOUBLE)
#else
#define IS_FLOAT(type) ((type) == FFI_TYPE_FLOAT)
#endif

static ffi_type **flatten_struct(ffi_type *in, ffi_type **out, ffi_type **out_end) {
    int i;
    if (out == out_end) return out;
    if (in->type != FFI_TYPE_STRUCT) {
        *(out++) = in;
    } else {
        for (i = 0; in->elements[i]; i++)
            out = flatten_struct(in->elements[i], out, out_end);
    }
    return out;
}

/* Structs with at most two fields after flattening, one of which is of
   floating point type, are passed in multiple registers if sufficient
   registers are available. */
static float_struct_info struct_passed_as_elements(call_builder *cb, ffi_type *top) {
    float_struct_info ret = {0, 0, 0, 0};
    ffi_type *fields[3];
    int num_floats, num_ints;
    int num_fields = flatten_struct(top, fields, fields + 3) - fields;

    if (num_fields == 1) {
        if (IS_FLOAT(fields[0]->type)) {
            ret.as_elements = 1;
            ret.type1 = fields[0]->type;
        }
    } else if (num_fields == 2) {
        num_floats = IS_FLOAT(fields[0]->type) + IS_FLOAT(fields[1]->type);
        num_ints = IS_INT(fields[0]->type) + IS_INT(fields[1]->type);
        if (num_floats == 0 || num_floats + num_ints != 2)
            return ret;
        if (cb->used_float + num_floats > NARGREG || cb->used_integer + (2 - num_floats) > NARGREG)
            return ret;
        if (!IS_FLOAT(fields[0]->type) && !IS_FLOAT(fields[1]->type))
            return ret;

        ret.type1 = fields[0]->type;
        ret.type2 = fields[1]->type;
        ret.offset2 = FFI_ALIGN(fields[0]->size, fields[1]->alignment);
        ret.as_elements = 1;
    }

    return ret;
}
#endif

/* allocates a single register, float register, or XLEN-sized stack slot to a datum */
static void marshal_atom(call_builder *cb, int type, void *data) {
    size_t value = 0;
    switch (type) {
        case FFI_TYPE_UINT8: value = *(uint8_t *)data; break;
        case FFI_TYPE_SINT8: value = *(int8_t *)data; break;
        case FFI_TYPE_UINT16: value = *(uint16_t *)data; break;
        case FFI_TYPE_SINT16: value = *(int16_t *)data; break;
        /* 32-bit quantities are always sign-extended in the ABI */
        case FFI_TYPE_UINT32: value = *(int32_t *)data; break;
        case FFI_TYPE_SINT32: value = *(int32_t *)data; break;
#if __SIZEOF_POINTER__ == 8
        case FFI_TYPE_UINT64: value = *(uint64_t *)data; break;
        case FFI_TYPE_SINT64: value = *(int64_t *)data; break;
#endif
        case FFI_TYPE_POINTER: value = *(size_t *)data; break;

        /* float values may be recoded in an implementation-defined way
           by hardware conforming to 2.1 or earlier, so use asm to
           reinterpret floats as doubles */
#if ABI_FLEN >= 32
        case FFI_TYPE_FLOAT:
            asm("" : "=f"(cb->aregs->fa[cb->used_float++]) : "0"(*(float *)data));
            return;
#endif
#if ABI_FLEN >= 64
        case FFI_TYPE_DOUBLE:
            asm("" : "=f"(cb->aregs->fa[cb->used_float++]) : "0"(*(double *)data));
            return;
#endif
        default: FFI_ASSERT(0); break;
    }

    if (cb->used_integer == NARGREG) {
        *cb->used_stack++ = value;
    } else {
        cb->aregs->a[cb->used_integer++] = value;
    }
}

static void unmarshal_atom(call_builder *cb, int type, void *data) {
    size_t value;
    switch (type) {
#if ABI_FLEN >= 32
        case FFI_TYPE_FLOAT:
            asm("" : "=f"(*(float *)data) : "0"(cb->aregs->fa[cb->used_float++]));
            return;
#endif
#if ABI_FLEN >= 64
        case FFI_TYPE_DOUBLE:
            asm("" : "=f"(*(double *)data) : "0"(cb->aregs->fa[cb->used_float++]));
            return;
#endif
    }

    if (cb->used_integer == NARGREG) {
        value = *cb->used_stack++;
    } else {
        value = cb->aregs->a[cb->used_integer++];
    }

    switch (type) {
        case FFI_TYPE_UINT8: *(uint8_t *)data = value; break;
        case FFI_TYPE_SINT8: *(uint8_t *)data = value; break;
        case FFI_TYPE_UINT16: *(uint16_t *)data = value; break;
        case FFI_TYPE_SINT16: *(uint16_t *)data = value; break;
        case FFI_TYPE_UINT32: *(uint32_t *)data = value; break;
        case FFI_TYPE_SINT32: *(uint32_t *)data = value; break;
#if __SIZEOF_POINTER__ == 8
        case FFI_TYPE_UINT64: *(uint64_t *)data = value; break;
        case FFI_TYPE_SINT64: *(uint64_t *)data = value; break;
#endif
        case FFI_TYPE_POINTER: *(size_t *)data = value; break;
        default: FFI_ASSERT(0); break;
    }
}

/* adds an argument to a call, or a not by reference return value */
static void marshal(call_builder *cb, ffi_type *type, int var, void *data) {
    size_t realign[2];

#if ABI_FLEN
    if (!var && type->type == FFI_TYPE_STRUCT) {
        float_struct_info fsi = struct_passed_as_elements(cb, type);
        if (fsi.as_elements) {
            marshal_atom(cb, fsi.type1, data);
            if (fsi.offset2)
                marshal_atom(cb, fsi.type2, ((char*)data) + fsi.offset2);
            return;
        }
    }

    if (!var && cb->used_float < NARGREG && IS_FLOAT(type->type)) {
        marshal_atom(cb, type->type, data);
        return;
    }
#endif

    if (type->size > 2 * __SIZEOF_POINTER__) {
        /* copy to stack and pass by reference */
        data = memcpy (cb->struct_stack, data, type->size);
        cb->struct_stack = (size_t *) FFI_ALIGN ((char *) cb->struct_stack + type->size, __SIZEOF_POINTER__);
        marshal_atom(cb, FFI_TYPE_POINTER, &data);
    } else if (IS_INT(type->type) || type->type == FFI_TYPE_POINTER) {
        marshal_atom(cb, type->type, data);
    } else {
        /* overlong integers, soft-float floats, and structs without special
           float handling are treated identically from this point on */

        /* variadics are aligned even in registers */
        if (type->alignment > __SIZEOF_POINTER__) {
            if (var)
                cb->used_integer = FFI_ALIGN(cb->used_integer, 2);
            cb->used_stack = (size_t *)FFI_ALIGN(cb->used_stack, 2*__SIZEOF_POINTER__);
        }

        memcpy(realign, data, type->size);
        if (type->size > 0)
            marshal_atom(cb, FFI_TYPE_POINTER, realign);
        if (type->size > __SIZEOF_POINTER__)
            marshal_atom(cb, FFI_TYPE_POINTER, realign + 1);
    }
}

/* for arguments passed by reference returns the pointer, otherwise the arg is copied (up to MAXCOPYARG bytes) */
static void *unmarshal(call_builder *cb, ffi_type *type, int var, void *data) {
    size_t realign[2];
    void *pointer;

#if ABI_FLEN
    if (!var && type->type == FFI_TYPE_STRUCT) {
        float_struct_info fsi = struct_passed_as_elements(cb, type);
        if (fsi.as_elements) {
            unmarshal_atom(cb, fsi.type1, data);
            if (fsi.offset2)
                unmarshal_atom(cb, fsi.type2, ((char*)data) + fsi.offset2);
            return data;
        }
    }

    if (!var && cb->used_float < NARGREG && IS_FLOAT(type->type)) {
        unmarshal_atom(cb, type->type, data);
        return data;
    }
#endif

    if (type->size > 2 * __SIZEOF_POINTER__) {
        /* pass by reference */
        unmarshal_atom(cb, FFI_TYPE_POINTER, (char*)&pointer);
        return pointer;
    } else if (IS_INT(type->type) || type->type == FFI_TYPE_POINTER) {
        unmarshal_atom(cb, type->type, data);
        return data;
    } else {
        /* overlong integers, soft-float floats, and structs without special
           float handling are treated identically from this point on */

        /* variadics are aligned even in registers */
        if (type->alignment > __SIZEOF_POINTER__) {
            if (var)
                cb->used_integer = FFI_ALIGN(cb->used_integer, 2);
            cb->used_stack = (size_t *)FFI_ALIGN(cb->used_stack, 2*__SIZEOF_POINTER__);
        }

        if (type->size > 0)
            unmarshal_atom(cb, FFI_TYPE_POINTER, realign);
        if (type->size > __SIZEOF_POINTER__)
            unmarshal_atom(cb, FFI_TYPE_POINTER, realign + 1);
        memcpy(data, realign, type->size);
        return data;
    }
}

static int passed_by_ref(call_builder *cb, ffi_type *type, int var) {
#if ABI_FLEN
    if (!var && type->type == FFI_TYPE_STRUCT) {
        float_struct_info fsi = struct_passed_as_elements(cb, type);
        if (fsi.as_elements) return 0;
    }
#endif

    return type->size > 2 * __SIZEOF_POINTER__;
}

/* Perform machine dependent cif processing */
ffi_status ffi_prep_cif_machdep(ffi_cif *cif) {
    cif->riscv_nfixedargs = cif->nargs;
    return FFI_OK;
}

/* Perform machine dependent cif processing when we have a variadic function */

ffi_status ffi_prep_cif_machdep_var(ffi_cif *cif, unsigned int nfixedargs, unsigned int ntotalargs) {
    cif->riscv_nfixedargs = nfixedargs;
    return FFI_OK;
}

/* Low level routine for calling functions */
extern void ffi_call_asm (void *stack, struct call_context *regs,
			  void (*fn) (void), void *closure) FFI_HIDDEN;

static void
ffi_call_int (ffi_cif *cif, void (*fn) (void), void *rvalue, void **avalue,
	      void *closure)
{
    /* this is a conservative estimate, assuming a complex return value and
       that all remaining arguments are long long / __int128 */
    size_t arg_bytes = cif->nargs <= 3 ? 0 :
        FFI_ALIGN(2 * sizeof(size_t) * (cif->nargs - 3), STKALIGN);
    /* Allocate space for copies of big structures.  */
    size_t struct_bytes = FFI_ALIGN (cif->bytes, STKALIGN);
    size_t rval_bytes = 0;
    if (rvalue == NULL && cif->rtype->size > 2*__SIZEOF_POINTER__)
        rval_bytes = FFI_ALIGN(cif->rtype->size, STKALIGN);
    size_t alloc_size = arg_bytes + rval_bytes + struct_bytes + sizeof(call_context);

    /* the assembly code will deallocate all stack data at lower addresses
       than the argument region, so we need to allocate the frame and the
       return value after the arguments in a single allocation */
    size_t alloc_base;
    /* Argument region must be 16-byte aligned */
    if (_Alignof(max_align_t) >= STKALIGN) {
        /* since sizeof long double is normally 16, the compiler will
           guarantee alloca alignment to at least that much */
        alloc_base = (size_t)alloca(alloc_size);
    } else {
        alloc_base = FFI_ALIGN(alloca(alloc_size + STKALIGN - 1), STKALIGN);
    }

    if (rval_bytes)
        rvalue = (void*)(alloc_base + arg_bytes);

    call_builder cb;
    cb.used_float = cb.used_integer = 0;
    cb.aregs = (call_context*)(alloc_base + arg_bytes + rval_bytes + struct_bytes);
    cb.used_stack = (void*)alloc_base;
    cb.struct_stack = (void *) (alloc_base + arg_bytes + rval_bytes);

    int return_by_ref = passed_by_ref(&cb, cif->rtype, 0);
    if (return_by_ref)
        marshal(&cb, &ffi_type_pointer, 0, &rvalue);

    int i;
    for (i = 0; i < cif->nargs; i++)
        marshal(&cb, cif->arg_types[i], i >= cif->riscv_nfixedargs, avalue[i]);

    ffi_call_asm ((void *) alloc_base, cb.aregs, fn, closure);

    cb.used_float = cb.used_integer = 0;
    if (!return_by_ref && rvalue)
      {
	if (IS_INT(cif->rtype->type)
	    && cif->rtype->size < sizeof (ffi_arg))
	  {
	    /* Integer types smaller than ffi_arg need to be extended.  */
	    switch (cif->rtype->type)
	      {
	      case FFI_TYPE_SINT8:
	      case FFI_TYPE_SINT16:
	      case FFI_TYPE_SINT32:
		unmarshal_atom (&cb, (sizeof (ffi_arg) > 4
				      ? FFI_TYPE_SINT64 : FFI_TYPE_SINT32),
				rvalue);
		break;
	      case FFI_TYPE_UINT8:
	      case FFI_TYPE_UINT16:
	      case FFI_TYPE_UINT32:
		unmarshal_atom (&cb, (sizeof (ffi_arg) > 4
				      ? FFI_TYPE_UINT64 : FFI_TYPE_UINT32),
				rvalue);
		break;
	      }
	  }
	else
	  unmarshal(&cb, cif->rtype, 0, rvalue);
      }
}

void
ffi_call (ffi_cif *cif, void (*fn) (void), void *rvalue, void **avalue)
{
  ffi_call_int(cif, fn, rvalue, avalue, NULL);
}

void
ffi_call_go (ffi_cif *cif, void (*fn) (void), void *rvalue,
	     void **avalue, void *closure)
{
  ffi_call_int(cif, fn, rvalue, avalue, closure);
}

extern void ffi_closure_asm(void) FFI_HIDDEN;

ffi_status ffi_prep_closure_loc(ffi_closure *closure, ffi_cif *cif, void (*fun)(ffi_cif*,void*,void**,void*), void *user_data, void *codeloc)
{
    uint32_t *tramp = (uint32_t *) &closure->tramp[0];
    uint64_t fn = (uint64_t) (uintptr_t) ffi_closure_asm;

    if (cif->abi <= FFI_FIRST_ABI || cif->abi >= FFI_LAST_ABI)
        return FFI_BAD_ABI;

    /* we will call ffi_closure_inner with codeloc, not closure, but as long
       as the memory is readable it should work */

    tramp[0] = 0x00000317; /* auipc t1, 0 (i.e. t0 <- codeloc) */
#if __SIZEOF_POINTER__ == 8
    tramp[1] = 0x01033383; /* ld t2, 16(t1) */
#else
    tramp[1] = 0x01032383; /* lw t2, 16(t1) */
#endif
    tramp[2] = 0x00038067; /* jr t2 */
    tramp[3] = 0x00000013; /* nop */
    tramp[4] = fn;
    tramp[5] = fn >> 32;

    closure->cif = cif;
    closure->fun = fun;
    closure->user_data = user_data;

#if !defined(__FreeBSD__)
    __builtin___clear_cache(codeloc, codeloc + FFI_TRAMPOLINE_SIZE);
#endif

    return FFI_OK;
}

extern void ffi_go_closure_asm (void) FFI_HIDDEN;

ffi_status
ffi_prep_go_closure (ffi_go_closure *closure, ffi_cif *cif,
		     void (*fun) (ffi_cif *, void *, void **, void *))
{
  if (cif->abi <= FFI_FIRST_ABI || cif->abi >= FFI_LAST_ABI)
    return FFI_BAD_ABI;

  closure->tramp = (void *) ffi_go_closure_asm;
  closure->cif = cif;
  closure->fun = fun;

  return FFI_OK;
}

/* Called by the assembly code with aregs pointing to saved argument registers
   and stack pointing to the stacked arguments.  Return values passed in
   registers will be reloaded from aregs. */
void FFI_HIDDEN
ffi_closure_inner (ffi_cif *cif,
		   void (*fun) (ffi_cif *, void *, void **, void *),
		   void *user_data,
		   size_t *stack, call_context *aregs)
{
    void **avalue = alloca(cif->nargs * sizeof(void*));
    /* storage for arguments which will be copied by unmarshal().  We could
       theoretically avoid the copies in many cases and use at most 128 bytes
       of memory, but allocating disjoint storage for each argument is
       simpler. */
    char *astorage = alloca(cif->nargs * MAXCOPYARG);
    void *rvalue;
    call_builder cb;
    int return_by_ref;
    int i;

    cb.aregs = aregs;
    cb.used_integer = cb.used_float = 0;
    cb.used_stack = stack;

    return_by_ref = passed_by_ref(&cb, cif->rtype, 0);
    if (return_by_ref)
        unmarshal(&cb, &ffi_type_pointer, 0, &rvalue);
    else
        rvalue = alloca(cif->rtype->size);

    for (i = 0; i < cif->nargs; i++)
        avalue[i] = unmarshal(&cb, cif->arg_types[i],
            i >= cif->riscv_nfixedargs, astorage + i*MAXCOPYARG);

    fun (cif, rvalue, avalue, user_data);

    if (!return_by_ref && cif->rtype->type != FFI_TYPE_VOID) {
        cb.used_integer = cb.used_float = 0;
        marshal(&cb, cif->rtype, 0, rvalue);
    }
}
