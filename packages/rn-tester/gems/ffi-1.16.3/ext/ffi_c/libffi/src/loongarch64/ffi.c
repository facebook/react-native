/* -----------------------------------------------------------------------
   ffi.c - Copyright (c) 2022 Xu Chenghua <xuchenghua@loongson.cn>
                         2022 Cheng Lulu <chenglulu@loongson.cn>
   Based on RISC-V port

   LoongArch Foreign Function Interface

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

#if defined(__loongarch_soft_float)
# define ABI_FRLEN 0
#elif defined(__loongarch_single_float)
# define ABI_FRLEN 32
# define ABI_FLOAT float
#elif defined(__loongarch_double_float)
# define ABI_FRLEN 64
# define ABI_FLOAT double
#else
#error unsupported LoongArch floating-point ABI
#endif

#define NARGREG 8
#define STKALIGN 16
#define MAXCOPYARG (2 * sizeof (double))

/* call_context registers
   - 8 floating point parameter/result registers.
   - 8 integer parameter/result registers.
   - 2 registers used by the assembly code to in-place construct its own
     stack frame
     - frame register
     - return register
*/
typedef struct call_context
{
  ABI_FLOAT fa[8];
  size_t a[10];
} call_context;

typedef struct call_builder
{
  call_context *aregs;
  int used_integer;
  int used_float;
  size_t *used_stack;
  size_t *stack;
  size_t next_struct_area;
} call_builder;

/* Integer (not pointer) less than ABI GRLEN.  */
/* FFI_TYPE_INT does not appear to be used.  */
#if __SIZEOF_POINTER__ == 8
# define IS_INT(type) ((type) >= FFI_TYPE_UINT8 && (type) <= FFI_TYPE_SINT64)
#else
# define IS_INT(type) ((type) >= FFI_TYPE_UINT8 && (type) <= FFI_TYPE_SINT32)
#endif

#if ABI_FRLEN
typedef struct float_struct_info
{
  char as_elements;
  char type1;
  char offset2;
  char type2;
} float_struct_info;

#if ABI_FRLEN >= 64
# define IS_FLOAT(type) ((type) >= FFI_TYPE_FLOAT && (type) <= FFI_TYPE_DOUBLE)
#else
# define IS_FLOAT(type) ((type) == FFI_TYPE_FLOAT)
#endif

static ffi_type **
flatten_struct (ffi_type *in, ffi_type **out, ffi_type **out_end)
{
  int i;

  if (out == out_end)
    return out;
  if (in->type != FFI_TYPE_STRUCT)
    *(out++) = in;
  else
    for (i = 0; in->elements[i]; i++)
      out = flatten_struct (in->elements[i], out, out_end);
  return out;
}

/* Structs with at most two fields after flattening, one of which is of
   floating point type, are passed in multiple registers if sufficient
   registers are available.  */
static float_struct_info
struct_passed_as_elements (call_builder *cb, ffi_type *top)
{
  float_struct_info ret = {0, 0, 0, 0};
  ffi_type *fields[3];
  int num_floats, num_ints;
  int num_fields = flatten_struct (top, fields, fields + 3) - fields;

  if (num_fields == 1)
    {
      if (IS_FLOAT (fields[0]->type))
	{
	  ret.as_elements = 1;
	  ret.type1 = fields[0]->type;
	}
    }
  else if (num_fields == 2)
    {
      num_floats = IS_FLOAT (fields[0]->type) + IS_FLOAT (fields[1]->type);
      num_ints = IS_INT (fields[0]->type) + IS_INT (fields[1]->type);
      if (num_floats == 0 || num_floats + num_ints != 2)
	return ret;
      if (cb->used_float + num_floats > NARGREG
	  || cb->used_integer + (2 - num_floats) > NARGREG)
	return ret;
      if (!IS_FLOAT (fields[0]->type) && !IS_FLOAT (fields[1]->type))
	return ret;

      ret.type1 = fields[0]->type;
      ret.type2 = fields[1]->type;
      ret.offset2 = FFI_ALIGN (fields[0]->size, fields[1]->alignment);
      ret.as_elements = 1;
    }
  return ret;
}
#endif

/* Allocates a single register, float register, or GRLEN-sized stack slot to a
   datum.  */
static void
marshal_atom (call_builder *cb, int type, void *data)
{
  size_t value = 0;
  switch (type)
    {
    case FFI_TYPE_UINT8:
      value = *(uint8_t *) data;
      break;
    case FFI_TYPE_SINT8:
      value = *(int8_t *) data;
      break;
    case FFI_TYPE_UINT16:
      value = *(uint16_t *) data;
      break;
    case FFI_TYPE_SINT16:
      value = *(int16_t *) data;
      break;
    /* 32-bit quantities are always sign-extended in the ABI.  */
    case FFI_TYPE_UINT32:
      value = *(int32_t *) data;
      break;
    case FFI_TYPE_SINT32:
      value = *(int32_t *) data;
      break;
#if __SIZEOF_POINTER__ == 8
    case FFI_TYPE_UINT64:
      value = *(uint64_t *) data;
      break;
    case FFI_TYPE_SINT64:
      value = *(int64_t *) data;
      break;
#endif
    case FFI_TYPE_POINTER:
      value = *(size_t *) data;
      break;

#if ABI_FRLEN >= 32
    case FFI_TYPE_FLOAT:
      *(float *)(cb->aregs->fa + cb->used_float++) = *(float *) data;
      return;
#endif
#if ABI_FRLEN >= 64
    case FFI_TYPE_DOUBLE:
      (cb->aregs->fa[cb->used_float++]) = *(double *) data;
      return;
#endif
    default:
      FFI_ASSERT (0);
      break;
    }

  if (cb->used_integer == NARGREG)
    *cb->used_stack++ = value;
  else
    cb->aregs->a[cb->used_integer++] = value;
}

static void
unmarshal_atom (call_builder *cb, int type, void *data)
{
  size_t value;
  switch (type)
    {
#if ABI_FRLEN >= 32
    case FFI_TYPE_FLOAT:
      *(float *) data = *(float *)(cb->aregs->fa + cb->used_float++);
      return;
#endif
#if ABI_FRLEN >= 64
    case FFI_TYPE_DOUBLE:
      *(double *) data = cb->aregs->fa[cb->used_float++];
      return;
#endif
    }

  if (cb->used_integer == NARGREG)
    value = *cb->used_stack++;
  else
    value = cb->aregs->a[cb->used_integer++];

  switch (type)
    {
    case FFI_TYPE_UINT8:
    case FFI_TYPE_SINT8:
    case FFI_TYPE_UINT16:
    case FFI_TYPE_SINT16:
    case FFI_TYPE_UINT32:
    case FFI_TYPE_SINT32:
#if __SIZEOF_POINTER__ == 8
    case FFI_TYPE_UINT64:
    case FFI_TYPE_SINT64:
#endif
    case FFI_TYPE_POINTER:
      *(ffi_arg *)data = value;
      break;
    default:
      FFI_ASSERT (0);
      break;
    }
}

/* Allocate and copy a structure that is passed by value on the stack and
   return a pointer to it.  */
static void *
allocate_and_copy_struct_to_stack (call_builder *cb, void *data,
				   ffi_type *type)
{
  size_t dest = cb->next_struct_area - type->size;

  dest = FFI_ALIGN_DOWN (dest, type->alignment);
  cb->next_struct_area = dest;

  return memcpy ((char *)cb->stack + dest, data, type->size);
}

/* Adds an argument to a call, or a not by reference return value.  */
static void
marshal (call_builder *cb, ffi_type *type, int var, void *data)
{
  size_t realign[2];

#if ABI_FRLEN
  if (!var && type->type == FFI_TYPE_STRUCT)
    {
      float_struct_info fsi = struct_passed_as_elements (cb, type);
      if (fsi.as_elements)
	{
	  marshal_atom (cb, fsi.type1, data);
	  if (fsi.offset2)
	    marshal_atom (cb, fsi.type2, ((char *) data) + fsi.offset2);
	  return;
	}
    }

  if (!var && cb->used_float < NARGREG
      && IS_FLOAT (type->type))
    {
      marshal_atom (cb, type->type, data);
      return;
    }

  double promoted;
  if (var && type->type == FFI_TYPE_FLOAT)
    {
      /* C standard requires promoting float -> double for variable arg.  */
      promoted = *(float *) data;
      type = &ffi_type_double;
      data = &promoted;
    }
#endif

  if (type->size > 2 * __SIZEOF_POINTER__)
    /* Pass by reference.  */
    {
      allocate_and_copy_struct_to_stack (cb, data, type);
      data = (char *)cb->stack + cb->next_struct_area;
      marshal_atom (cb, FFI_TYPE_POINTER, &data);
    }
  else if (IS_INT (type->type) || type->type == FFI_TYPE_POINTER)
    marshal_atom (cb, type->type, data);
  else
    {
      /* Overlong integers, soft-float floats, and structs without special
	 float handling are treated identically from this point on.  */

      /* Variadics are aligned even in registers.  */
      if (type->alignment > __SIZEOF_POINTER__)
	{
	  if (var)
	    cb->used_integer = FFI_ALIGN (cb->used_integer, 2);
	  cb->used_stack
	    = (size_t *) FFI_ALIGN (cb->used_stack, 2 * __SIZEOF_POINTER__);
	}

      memcpy (realign, data, type->size);
      if (type->size > 0)
	marshal_atom (cb, FFI_TYPE_POINTER, realign);
      if (type->size > __SIZEOF_POINTER__)
	marshal_atom (cb, FFI_TYPE_POINTER, realign + 1);
    }
}

/* For arguments passed by reference returns the pointer, otherwise the arg
   is copied (up to MAXCOPYARG bytes).  */
static void *
unmarshal (call_builder *cb, ffi_type *type, int var, void *data)
{
  size_t realign[2];
  void *pointer;

#if ABI_FRLEN
  if (!var && type->type == FFI_TYPE_STRUCT)
    {
      float_struct_info fsi = struct_passed_as_elements (cb, type);
      if (fsi.as_elements)
	{
	  unmarshal_atom (cb, fsi.type1, data);
	  if (fsi.offset2)
	    unmarshal_atom (cb, fsi.type2, ((char *) data) + fsi.offset2);
	  return data;
	}
    }

  if (!var && cb->used_float < NARGREG
      && IS_FLOAT (type->type))
    {
      unmarshal_atom (cb, type->type, data);
      return data;
    }

  if (var && type->type == FFI_TYPE_FLOAT)
    {
      int m = cb->used_integer;
      void *promoted
	= m < NARGREG ? cb->aregs->a + m : cb->used_stack + m - NARGREG + 1;
      *(float *) promoted = *(double *) promoted;
    }
#endif

  if (type->size > 2 * __SIZEOF_POINTER__)
    {
      /* Pass by reference.  */
      unmarshal_atom (cb, FFI_TYPE_POINTER, (char *) &pointer);
      return pointer;
    }
  else if (IS_INT (type->type) || type->type == FFI_TYPE_POINTER)
    {
      unmarshal_atom (cb, type->type, data);
      return data;
    }
  else
    {
      /* Overlong integers, soft-float floats, and structs without special
	 float handling are treated identically from this point on.  */

      /* Variadics are aligned even in registers.  */
      if (type->alignment > __SIZEOF_POINTER__)
	{
	  if (var)
	    cb->used_integer = FFI_ALIGN (cb->used_integer, 2);
	  cb->used_stack
	    = (size_t *) FFI_ALIGN (cb->used_stack, 2 * __SIZEOF_POINTER__);
	}

      if (type->size > 0)
	unmarshal_atom (cb, FFI_TYPE_POINTER, realign);
      if (type->size > __SIZEOF_POINTER__)
	unmarshal_atom (cb, FFI_TYPE_POINTER, realign + 1);
      memcpy (data, realign, type->size);
      return data;
    }
}

static int
passed_by_ref (call_builder *cb, ffi_type *type, int var)
{
#if ABI_FRLEN
  if (!var && type->type == FFI_TYPE_STRUCT)
    {
      float_struct_info fsi = struct_passed_as_elements (cb, type);
      if (fsi.as_elements)
	return 0;
    }
#endif

  return type->size > 2 * __SIZEOF_POINTER__;
}

/* Perform machine dependent cif processing.  */
ffi_status
ffi_prep_cif_machdep (ffi_cif *cif)
{
  cif->loongarch_nfixedargs = cif->nargs;
  return FFI_OK;
}

/* Perform machine dependent cif processing when we have a variadic
   function.  */
ffi_status
ffi_prep_cif_machdep_var (ffi_cif *cif, unsigned int nfixedargs,
			  unsigned int ntotalargs)
{
  cif->loongarch_nfixedargs = nfixedargs;
  return FFI_OK;
}

/* Low level routine for calling functions.  */
extern void ffi_call_asm (void *stack, struct call_context *regs,
			  void (*fn) (void), void *closure) FFI_HIDDEN;

static void
ffi_call_int (ffi_cif *cif, void (*fn) (void), void *rvalue, void **avalue,
	      void *closure)
{
  /* This is a conservative estimate, assuming a complex return value and
     that all remaining arguments are long long / __int128 */
  size_t arg_bytes = cif->bytes;
  size_t rval_bytes = 0;
  if (rvalue == NULL && cif->rtype->size > 2 * __SIZEOF_POINTER__)
    rval_bytes = FFI_ALIGN (cif->rtype->size, STKALIGN);
  size_t alloc_size = arg_bytes + rval_bytes + sizeof (call_context);

  /* The assembly code will deallocate all stack data at lower addresses
     than the argument region, so we need to allocate the frame and the
     return value after the arguments in a single allocation.  */
  size_t alloc_base;
  /* Argument region must be 16-byte aligned in LP64 ABIs.  */
  if (_Alignof(max_align_t) >= STKALIGN)
    /* Since sizeof long double is normally 16, the compiler will
       guarantee alloca alignment to at least that much.  */
    alloc_base = (size_t) alloca (alloc_size);
  else
    alloc_base = FFI_ALIGN (alloca (alloc_size + STKALIGN - 1), STKALIGN);

  if (rval_bytes)
    rvalue = (void *) (alloc_base + arg_bytes);

  call_builder cb;
  cb.used_float = cb.used_integer = 0;
  cb.aregs = (call_context *) (alloc_base + arg_bytes + rval_bytes);
  cb.used_stack = (void *) alloc_base;
  cb.stack = (void *) alloc_base;
  cb.next_struct_area = arg_bytes;

  int return_by_ref = passed_by_ref (&cb, cif->rtype, 0);
  if (return_by_ref)
    cb.aregs->a[cb.used_integer++] = (size_t)rvalue;

  int i;
  for (i = 0; i < cif->nargs; i++)
    marshal (&cb, cif->arg_types[i], i >= cif->loongarch_nfixedargs,
	     avalue[i]);

  ffi_call_asm ((void *) alloc_base, cb.aregs, fn, closure);

  cb.used_float = cb.used_integer = 0;
  if (!return_by_ref && rvalue)
    unmarshal (&cb, cif->rtype, 0, rvalue);
}

void
ffi_call (ffi_cif *cif, void (*fn) (void), void *rvalue, void **avalue)
{
  ffi_call_int (cif, fn, rvalue, avalue, NULL);
}

void
ffi_call_go (ffi_cif *cif, void (*fn) (void), void *rvalue, void **avalue,
	     void *closure)
{
  ffi_call_int (cif, fn, rvalue, avalue, closure);
}

extern void ffi_closure_asm (void) FFI_HIDDEN;

ffi_status
ffi_prep_closure_loc (ffi_closure *closure, ffi_cif *cif,
		      void (*fun) (ffi_cif *, void *, void **, void *),
		      void *user_data, void *codeloc)
{
  uint32_t *tramp = (uint32_t *) &closure->tramp[0];
  uint64_t fn = (uint64_t) (uintptr_t) ffi_closure_asm;

  if (cif->abi <= FFI_FIRST_ABI || cif->abi >= FFI_LAST_ABI)
    return FFI_BAD_ABI;

#if defined(FFI_EXEC_STATIC_TRAMP)
  if (ffi_tramp_is_present(closure))
    {
      ffi_tramp_set_parms (closure->ftramp, ffi_closure_asm, closure);
      goto out;
    }
#endif

  /* Fill the dynamic trampoline.  We will call ffi_closure_inner with codeloc,
     not closure, but as long as the memory is readable it should work.  */
  tramp[0] = 0x1800000c; /* pcaddi $t0, 0 (i.e. $t0 <- tramp) */
  tramp[1] = 0x28c0418d; /* ld.d   $t1, $t0, 16 */
  tramp[2] = 0x4c0001a0; /* jirl   $zero, $t1, 0 */
  tramp[3] = 0x03400000; /* nop */
  tramp[4] = fn;
  tramp[5] = fn >> 32;

  __builtin___clear_cache (codeloc, codeloc + FFI_TRAMPOLINE_SIZE);

#if defined(FFI_EXEC_STATIC_TRAMP)
out:
#endif
  closure->cif = cif;
  closure->fun = fun;
  closure->user_data = user_data;

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
   registers will be reloaded from aregs.  */
void FFI_HIDDEN
ffi_closure_inner (ffi_cif *cif,
		   void (*fun) (ffi_cif *, void *, void **, void *),
		   void *user_data, size_t *stack, call_context *aregs)
{
  void **avalue = alloca (cif->nargs * sizeof (void *));
  /* Storage for arguments which will be copied by unmarshal().  We could
     theoretically avoid the copies in many cases and use at most 128 bytes
     of memory, but allocating disjoint storage for each argument is
     simpler.  */
  char *astorage = alloca (cif->nargs * MAXCOPYARG);
  void *rvalue;
  call_builder cb;
  int return_by_ref;
  int i;

  cb.aregs = aregs;
  cb.used_integer = cb.used_float = 0;
  cb.used_stack = stack;

  return_by_ref = passed_by_ref (&cb, cif->rtype, 0);
  if (return_by_ref)
    unmarshal (&cb, &ffi_type_pointer, 0, &rvalue);
  else
    rvalue = alloca (cif->rtype->size);

  for (i = 0; i < cif->nargs; i++)
    avalue[i]
      = unmarshal (&cb, cif->arg_types[i], i >= cif->loongarch_nfixedargs,
		   astorage + i * MAXCOPYARG);

  fun (cif, rvalue, avalue, user_data);

  if (!return_by_ref && cif->rtype->type != FFI_TYPE_VOID)
    {
      cb.used_integer = cb.used_float = 0;
      marshal (&cb, cif->rtype, 0, rvalue);
    }
}

#if defined(FFI_EXEC_STATIC_TRAMP)
void *
ffi_tramp_arch (size_t *tramp_size, size_t *map_size)
{
  extern void *trampoline_code_table;

  *tramp_size = 16;
  /* A mapping size of 64K is chosen to cover the page sizes of 4K, 16K, and
     64K.  */
  *map_size = 1 << 16;
  return &trampoline_code_table;
}
#endif
