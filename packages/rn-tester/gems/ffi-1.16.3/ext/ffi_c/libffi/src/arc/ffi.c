/* -----------------------------------------------------------------------
   ffi.c - Copyright (c) 2013  Synopsys, Inc. (www.synopsys.com)
   
   ARC Foreign Function Interface 

   Permission is hereby granted, free of charge, to any person obtaining
   a copy of this software and associated documentation files (the
   ``Software''), to deal in the Software without restriction, including
   without limitation the rights to use, copy, modify, merge, publish,
   distribute, sublicense, and/or sell copies of the Software, and to
   permit persons to whom the Software is furnished to do so, subject to
   the following conditions:

   The above copyright notice and this permission notice shall be included
   in all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED ``AS IS'', WITHOUT WARRANTY OF ANY KIND, EXPRESS
   OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
   IN NO EVENT SHALL RENESAS TECHNOLOGY BE LIABLE FOR ANY CLAIM, DAMAGES OR
   OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
   ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
   OTHER DEALINGS IN THE SOFTWARE.
   ----------------------------------------------------------------------- */

#include <ffi.h>
#include <ffi_common.h>

#include <stdlib.h>
#include <stdint.h>

#include <sys/cachectl.h>

#define NARGREG 8
#define STKALIGN 4
#define MAXCOPYARG (2 * sizeof(double))

typedef struct call_context
{
  size_t r[8];
  /* used by the assembly code to in-place construct its own stack frame */
  char frame[16];
} call_context;

typedef struct call_builder
{
  call_context *aregs;
  int used_integer;
  //int used_float;
  size_t *used_stack;
  void *struct_stack;
} call_builder;

/* integer (not pointer) less than ABI XLEN */
/* FFI_TYPE_INT does not appear to be used */
#if defined(__ARC64_ARCH64__)
#define IS_INT(type) ((type) >= FFI_TYPE_UINT8 && (type) <= FFI_TYPE_SINT64)
#else
#define IS_INT(type) ((type) >= FFI_TYPE_UINT8 && (type) <= FFI_TYPE_SINT32)
#endif

/* for little endian ARC, the code is in fact stored as mixed endian for
   performance reasons */
#if __BIG_ENDIAN__
#define CODE_ENDIAN(x) (x)
#else
#define CODE_ENDIAN(x) ( (((uint32_t) (x)) << 16) | (((uint32_t) (x)) >> 16))
#endif

/* Perform machine dependent cif processing.  */
ffi_status
ffi_prep_cif_machdep (ffi_cif * cif)
{
  /* Set the return type flag.  */
  switch (cif->rtype->type)
    {
    case FFI_TYPE_VOID:
      cif->flags = (unsigned) cif->rtype->type;
      break;

    case FFI_TYPE_STRUCT:
      cif->flags = (unsigned) cif->rtype->type;
      break;

    case FFI_TYPE_SINT64:
    case FFI_TYPE_UINT64:
    case FFI_TYPE_DOUBLE:
      cif->flags = FFI_TYPE_DOUBLE;
      break;

    case FFI_TYPE_FLOAT:
    default:
      cif->flags = FFI_TYPE_INT;
      break;
    }

  return FFI_OK;
}

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
#if defined(__ARC64_ARCH64__)
    case FFI_TYPE_UINT64: value = *(uint64_t *)data; break;
    case FFI_TYPE_SINT64: value = *(int64_t *)data; break;
#endif
    case FFI_TYPE_POINTER: value = *(size_t *)data; break;
    default: FFI_ASSERT(0); break;
  }

  if (cb->used_integer == NARGREG) {
    *cb->used_stack++ = value;
  } else {
    cb->aregs->r[cb->used_integer++] = value;
  }
}

/* adds an argument to a call, or a not by reference return value */
static void marshal(call_builder *cb, ffi_type *type, int var, void *data) {
  size_t realign[2];

#if (defined(__ARC64_ARCH64__) || defined(__ARC64_ARCH32__))
  if (type->size > 2 * __SIZEOF_POINTER__) {
    if (var) {
      marshal_atom(cb, FFI_TYPE_POINTER, &data);
    } else {
      /* copy to stack and pass by reference */
      data = memcpy (cb->struct_stack, data, type->size);
      cb->struct_stack = (size_t *) FFI_ALIGN ((char *) cb->struct_stack + type->size, __SIZEOF_POINTER__);
      marshal_atom(cb, FFI_TYPE_POINTER, &data);
    }
  }
#else
  if (type->type == FFI_TYPE_STRUCT) {
    if (var) {
      if (type->size > 0)
        marshal_atom(cb, FFI_TYPE_POINTER, data);
    } else {
      int i;
      
      for (i = 0; i < type->size; i += sizeof(size_t)) {
        marshal_atom(cb, FFI_TYPE_POINTER, data);
        data += sizeof(size_t);
      }
    }
  }
#endif
  else if (IS_INT(type->type) || type->type == FFI_TYPE_POINTER) {
    marshal_atom(cb, type->type, data);
  } else {
      memcpy(realign, data, type->size);
      if (type->size > 0)
        marshal_atom(cb, FFI_TYPE_POINTER, realign);
      if (type->size > __SIZEOF_POINTER__)
        marshal_atom(cb, FFI_TYPE_POINTER, realign + 1);
  }
}

static void unmarshal_atom(call_builder *cb, int type, void *data) {
  size_t value;

  if (cb->used_integer == NARGREG) {
    value = *cb->used_stack++;
  } else {
    value = cb->aregs->r[cb->used_integer++];
  }

  switch (type) {
    case FFI_TYPE_UINT8: *(uint8_t *)data = value; break;
    case FFI_TYPE_SINT8: *(uint8_t *)data = value; break;
    case FFI_TYPE_UINT16: *(uint16_t *)data = value; break;
    case FFI_TYPE_SINT16: *(uint16_t *)data = value; break;
    case FFI_TYPE_UINT32: *(uint32_t *)data = value; break;
    case FFI_TYPE_SINT32: *(uint32_t *)data = value; break;
#if defined(__ARC64_ARCH64__)
    case FFI_TYPE_UINT64: *(uint64_t *)data = value; break;
    case FFI_TYPE_SINT64: *(uint64_t *)data = value; break;
#endif
    case FFI_TYPE_POINTER: *(size_t *)data = value; break;
    default: FFI_ASSERT(0); break;
  }
}

/* for arguments passed by reference returns the pointer, otherwise the arg is copied (up to MAXCOPYARG bytes) */
static void *unmarshal(call_builder *cb, ffi_type *type, int var, void *data) {
  size_t realign[2];
  void *pointer;

#if defined(__ARC64_ARCH64__)
  if (type->size > 2 * __SIZEOF_POINTER__) {
        /* pass by reference */
        unmarshal_atom(cb, FFI_TYPE_POINTER, (char*)&pointer);
        return pointer;
    }
#elif defined(__ARC64_ARCH32__)
  if (type->type == FFI_TYPE_STRUCT) {
    if (type->size > 2 * __SIZEOF_POINTER__) {
      unmarshal_atom(cb, FFI_TYPE_POINTER, &realign[0]);
      memcpy(data, (const void*)realign[0], type->size);
      return data;
    } else {
      int i;
      void *pdata = data;

      for (i = 0; i < type->size; i += sizeof(size_t)) {
        unmarshal_atom(cb, FFI_TYPE_POINTER, pdata);
        pdata += sizeof(size_t);
      }
      return data;
    }
  }
#else
  if (type->type == FFI_TYPE_STRUCT) {

      if (var) {
        int i;
        void *pdata = data;

        for (i = 0; i < type->size; i += sizeof(size_t)) {
          unmarshal_atom(cb, FFI_TYPE_POINTER, pdata);
          pdata += sizeof(size_t);
        }
        return data;
      } else {
        if (type->size > 0)
          unmarshal_atom(cb, FFI_TYPE_POINTER, &realign[0]);
        memcpy(data, (const void*)realign[0], type->size);
        return data;
      }
  }
#endif
  else if (IS_INT(type->type) || type->type == FFI_TYPE_POINTER) {
    unmarshal_atom(cb, type->type, data);
    return data;
  } else {
      if (type->size > 0)
        unmarshal_atom(cb, FFI_TYPE_POINTER, realign);
      if (type->size > __SIZEOF_POINTER__)
        unmarshal_atom(cb, FFI_TYPE_POINTER, realign + 1);
      memcpy(data, realign, type->size);
      return data;
  }
}

static int passed_by_ref(ffi_type *type, int var) {
  if (type->type == FFI_TYPE_STRUCT)
	  return 1;
  
  return type->size > 2 * __SIZEOF_POINTER__;
}

/* Low level routine for calling functions */
extern void ffi_call_asm (void *stack, struct call_context *regs,
			  void (*fn) (void), void *closure) FFI_HIDDEN;

static void
ffi_call_int (ffi_cif *cif, void (*fn) (void), void *rvalue, void **avalue,
	      void *closure)
{
  int return_by_ref = passed_by_ref(cif->rtype, 0);

  /* Allocate space for stack arg parameters.  */
  size_t arg_bytes = FFI_ALIGN(2 * sizeof(size_t) * cif->nargs, STKALIGN);
  /* Allocate space for copies of big structures.  */
  size_t struct_bytes = FFI_ALIGN(cif->bytes, STKALIGN);
  // size_t rval_bytes = 0;
  // if (rvalue == NULL && cif->rtype->size > 2*__SIZEOF_POINTER__)
  //   rval_bytes = FFI_ALIGN(cif->rtype->size, STKALIGN);
  size_t alloc_size = arg_bytes + /*rval_bytes +*/ struct_bytes + sizeof(call_context);
  size_t alloc_base = (size_t)alloca(alloc_size);

  // if (rval_bytes)
  //   rvalue = (void*)(alloc_base + arg_bytes);

  call_builder cb;
  cb.used_integer = 0;
  cb.aregs = (call_context*)(alloc_base + arg_bytes /*+ rval_bytes*/ + struct_bytes);
  cb.used_stack = (void*)alloc_base;
  cb.struct_stack = (void *)(alloc_base + arg_bytes /*+ rval_bytes*/);

  // if (cif->rtype->type == FFI_TYPE_STRUCT)
  //   marshal(&cb, &ffi_type_pointer, 0, &rvalue);

  if (return_by_ref)
	  marshal(&cb, &ffi_type_pointer, 0, &rvalue);

  int i;
  for (i = 0; i < cif->nargs; i++)
    marshal(&cb, cif->arg_types[i], 0, avalue[i]);

  ffi_call_asm ((void *) alloc_base, cb.aregs, fn, closure);

  cb.used_integer = 0;
  if (!return_by_ref && rvalue)
    {
	    if (IS_INT(cif->rtype->type)
	        && cif->rtype->size < sizeof (ffi_arg))
	    {
        /* Integer types smaller than ffi_arg need to be extended.  */
	    switch (cif->rtype->type) {
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

ffi_status
ffi_prep_closure_loc (ffi_closure * closure, ffi_cif * cif,
		      void (*fun) (ffi_cif *, void *, void **, void *),
		      void *user_data, void *codeloc)
{
  uint32_t *tramp = (uint32_t *) & (closure->tramp[0]);
  size_t address_ffi_closure = (size_t) ffi_closure_asm;

  switch (cif->abi)
    {
#if defined(__ARC64_ARCH64__)
    case FFI_ARC64:
      FFI_ASSERT (tramp == codeloc);
      tramp[0] = CODE_ENDIAN (0x580a1fc0);	/* movl r8, pcl  */
      tramp[1] = CODE_ENDIAN (0x5c0b1f80);	/* movhl r12, limm */
      tramp[2] = CODE_ENDIAN ((uint32_t)(address_ffi_closure >> 32));
      tramp[3] = CODE_ENDIAN (0x5c051f8c);	/* orl r12, r12, limm */
      tramp[4] = CODE_ENDIAN ((uint32_t)(address_ffi_closure & 0xffffffff));
      tramp[5] = CODE_ENDIAN (0x20200300);	/* j [r12] */
      break;
#else
    case FFI_ARCOMPACT:
      FFI_ASSERT (tramp == codeloc);
      tramp[0] = CODE_ENDIAN (0x200a1fc0);	/* mov r8, pcl  */
      tramp[1] = CODE_ENDIAN (0x20200f80);	/* j [long imm] */
      tramp[2] = CODE_ENDIAN (ffi_closure_asm);
      break;
#endif

    default:
      return FFI_BAD_ABI;
    }

  closure->cif = cif;
  closure->fun = fun;
  closure->user_data = user_data;
  cacheflush (codeloc, FFI_TRAMPOLINE_SIZE, BCACHE);

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
    char *astorage = alloca(cif->bytes);
    char *ptr = astorage;
    void *rvalue;
    call_builder cb;
    int i;

    cb.aregs = aregs;
    cb.used_integer = 0;
    cb.used_stack = stack;
    
    /* handle hidden argument */
    if (cif->flags == FFI_TYPE_STRUCT)
      unmarshal(&cb, &ffi_type_pointer, 0, &rvalue);
    else
      rvalue = alloca(cif->rtype->size);

    for (i = 0; i < cif->nargs; i++) {
      avalue[i] = unmarshal(&cb, cif->arg_types[i], 1, ptr);
      ptr += cif->arg_types[i]->size;
    }

    fun (cif, rvalue, avalue, user_data);

    if (cif->rtype->type != FFI_TYPE_VOID) {
        cb.used_integer = 0;
        marshal(&cb, cif->rtype, 1, rvalue);
    }
}
