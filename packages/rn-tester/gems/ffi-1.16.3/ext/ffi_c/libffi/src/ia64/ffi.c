/* -----------------------------------------------------------------------
   ffi.c - Copyright (c) 1998, 2007, 2008, 2012 Red Hat, Inc.
	   Copyright (c) 2000 Hewlett Packard Company
	   Copyright (c) 2011 Anthony Green
   
   IA64 Foreign Function Interface 

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
#include <stdbool.h>
#include <float.h>

#include "ia64_flags.h"

/* A 64-bit pointer value.  In LP64 mode, this is effectively a plain
   pointer.  In ILP32 mode, it's a pointer that's been extended to 
   64 bits by "addp4".  */
#ifdef __hpux
typedef void *PTR64;
#else // some other unix
typedef void *PTR64 __attribute__((mode(DI)));
#endif

/* Memory image of fp register contents.  This is the implementation
   specific format used by ldf.fill/stf.spill.  All we care about is
   that it wants a 16 byte aligned slot.  */
typedef struct
{
  UINT64 x[2] __attribute__((aligned(16)));
} fpreg;


/* The stack layout given to ffi_call_unix and ffi_closure_unix_inner.  */

struct ia64_args
{
  fpreg fp_regs[8];	/* Contents of 8 fp arg registers.  */
  UINT64 gp_regs[8];	/* Contents of 8 gp arg registers.  */
  UINT64 other_args[];	/* Arguments passed on stack, variable size.  */
};


/* Adjust ADDR, a pointer to an 8 byte slot, to point to the low LEN bytes.  */

static inline void *
endian_adjust (void *addr, size_t len)
{
#ifdef __BIG_ENDIAN__
  return addr + (8 - len);
#else
  return addr;
#endif
}

/* Store VALUE to ADDR in the current cpu implementation's fp spill format.
   This is a macro instead of a function, so that it works for all 3 floating
   point types without type conversions.  Type conversion to long double breaks
   the denorm support.  */

#ifdef __hpux
#define stf_spill(addr, value)
#else
#define stf_spill(addr, value)	\
  asm ("stf.spill %0 = %1%P0" : "=m" (*addr) : "f"(value));
#endif

/* Load a value from ADDR, which is in the current cpu implementation's
   fp spill format.  As above, this must also be a macro.  */

#ifdef __hpux
#define ldf_fill(result, addr)
#else
#define ldf_fill(result, addr)	\
  asm ("ldf.fill %0 = %1%P1" : "=f"(result) : "m"(*addr));
#endif

/* Return the size of the C type associated with with TYPE.  Which will
   be one of the FFI_IA64_TYPE_HFA_* values.  */

static size_t
hfa_type_size (int type)
{
  switch (type)
    {
    case FFI_IA64_TYPE_HFA_FLOAT:
      return sizeof(float);
    case FFI_IA64_TYPE_HFA_DOUBLE:
      return sizeof(double);
    case FFI_IA64_TYPE_HFA_LDOUBLE:
      return sizeof(__float80);
    default:
      abort ();
    }
}

/* Load from ADDR a value indicated by TYPE.  Which will be one of
   the FFI_IA64_TYPE_HFA_* values.  */

static void
hfa_type_load (fpreg *fpaddr, int type, void *addr)
{
  switch (type)
    {
    case FFI_IA64_TYPE_HFA_FLOAT:
      stf_spill (fpaddr, *(float *) addr);
      return;
    case FFI_IA64_TYPE_HFA_DOUBLE:
      stf_spill (fpaddr, *(double *) addr);
      return;
    case FFI_IA64_TYPE_HFA_LDOUBLE:
      stf_spill (fpaddr, *(__float80 *) addr);
      return;
    default:
      abort ();
    }
}

/* Load VALUE into ADDR as indicated by TYPE.  Which will be one of
   the FFI_IA64_TYPE_HFA_* values.  */

static void
hfa_type_store (int type, void *addr, fpreg *fpaddr)
{
  switch (type)
    {
    case FFI_IA64_TYPE_HFA_FLOAT:
      {
	float result;
	ldf_fill (result, fpaddr);
	*(float *) addr = result;
	break;
      }
    case FFI_IA64_TYPE_HFA_DOUBLE:
      {
	double result;
	ldf_fill (result, fpaddr);
	*(double *) addr = result;
	break;
      }
    case FFI_IA64_TYPE_HFA_LDOUBLE:
      {
	__float80 result;
	ldf_fill (result, fpaddr);
	*(__float80 *) addr = result;
	break;
      }
    default:
      abort ();
    }
}

/* Is TYPE a struct containing floats, doubles, or extended doubles,
   all of the same fp type?  If so, return the element type.  Return
   FFI_TYPE_VOID if not.  */

static int
hfa_element_type (ffi_type *type, int nested)
{
  int element = FFI_TYPE_VOID;

  switch (type->type)
    {
    case FFI_TYPE_FLOAT:
      /* We want to return VOID for raw floating-point types, but the
	 synthetic HFA type if we're nested within an aggregate.  */
      if (nested)
	element = FFI_IA64_TYPE_HFA_FLOAT;
      break;

    case FFI_TYPE_DOUBLE:
      /* Similarly.  */
      if (nested)
	element = FFI_IA64_TYPE_HFA_DOUBLE;
      break;

    case FFI_TYPE_LONGDOUBLE:
      /* Similarly, except that that HFA is true for double extended,
	 but not quad precision.  Both have sizeof == 16, so tell the
	 difference based on the precision.  */
      if (LDBL_MANT_DIG == 64 && nested)
	element = FFI_IA64_TYPE_HFA_LDOUBLE;
      break;

    case FFI_TYPE_STRUCT:
      {
	ffi_type **ptr = &type->elements[0];

	for (ptr = &type->elements[0]; *ptr ; ptr++)
	  {
	    int sub_element = hfa_element_type (*ptr, 1);
	    if (sub_element == FFI_TYPE_VOID)
	      return FFI_TYPE_VOID;

	    if (element == FFI_TYPE_VOID)
	      element = sub_element;
	    else if (element != sub_element)
	      return FFI_TYPE_VOID;
	  }
      }
      break;

    default:
      return FFI_TYPE_VOID;
    }

  return element;
}


/* Perform machine dependent cif processing. */

static ffi_status
ffi_prep_cif_machdep_core(ffi_cif *cif)
{
  int flags;

  /* Adjust cif->bytes to include space for the bits of the ia64_args frame
     that precedes the integer register portion.  The estimate that the
     generic bits did for the argument space required is good enough for the
     integer component.  */
  cif->bytes += offsetof(struct ia64_args, gp_regs[0]);
  if (cif->bytes < sizeof(struct ia64_args))
    cif->bytes = sizeof(struct ia64_args);

  /* Set the return type flag. */
  flags = cif->rtype->type;
  switch (cif->rtype->type)
    {
    case FFI_TYPE_LONGDOUBLE:
      /* Leave FFI_TYPE_LONGDOUBLE as meaning double extended precision,
	 and encode quad precision as a two-word integer structure.  */
      if (LDBL_MANT_DIG != 64)
	flags = FFI_IA64_TYPE_SMALL_STRUCT | (16 << 8);
      break;

    case FFI_TYPE_STRUCT:
      {
        size_t size = cif->rtype->size;
  	int hfa_type = hfa_element_type (cif->rtype, 0);

	if (hfa_type != FFI_TYPE_VOID)
	  {
	    size_t nelts = size / hfa_type_size (hfa_type);
	    if (nelts <= 8)
	      flags = hfa_type | (size << 8);
	  }
	else
	  {
	    if (size <= 32)
	      flags = FFI_IA64_TYPE_SMALL_STRUCT | (size << 8);
	  }
      }
      break;

    default:
      break;
    }
  cif->flags = flags;

  return FFI_OK;
}

ffi_status
ffi_prep_cif_machdep(ffi_cif *cif)
{
  cif->nfixedargs = cif->nargs;
  return ffi_prep_cif_machdep_core(cif);
}

ffi_status
ffi_prep_cif_machdep_var(ffi_cif *cif,
			 unsigned int nfixedargs,
			 unsigned int ntotalargs MAYBE_UNUSED)
{
  cif->nfixedargs = nfixedargs;
  return ffi_prep_cif_machdep_core(cif);
}

extern int ffi_call_unix (struct ia64_args *, PTR64, void (*)(void), UINT64);

void
ffi_call(ffi_cif *cif, void (*fn)(void), void *rvalue, void **avalue)
{
  struct ia64_args *stack;
  long i, avn, gpcount, fpcount;
  ffi_type **p_arg;

  FFI_ASSERT (cif->abi == FFI_UNIX);

  /* If we have no spot for a return value, make one.  */
  if (rvalue == NULL && cif->rtype->type != FFI_TYPE_VOID)
    rvalue = alloca (cif->rtype->size);
    
  /* Allocate the stack frame.  */
  stack = alloca (cif->bytes);

  gpcount = fpcount = 0;
  avn = cif->nargs;
  for (i = 0, p_arg = cif->arg_types; i < avn; i++, p_arg++)
    {
      switch ((*p_arg)->type)
	{
	case FFI_TYPE_SINT8:
	  stack->gp_regs[gpcount++] = *(SINT8 *)avalue[i];
	  break;
	case FFI_TYPE_UINT8:
	  stack->gp_regs[gpcount++] = *(UINT8 *)avalue[i];
	  break;
	case FFI_TYPE_SINT16:
	  stack->gp_regs[gpcount++] = *(SINT16 *)avalue[i];
	  break;
	case FFI_TYPE_UINT16:
	  stack->gp_regs[gpcount++] = *(UINT16 *)avalue[i];
	  break;
	case FFI_TYPE_SINT32:
	  stack->gp_regs[gpcount++] = *(SINT32 *)avalue[i];
	  break;
	case FFI_TYPE_UINT32:
	  stack->gp_regs[gpcount++] = *(UINT32 *)avalue[i];
	  break;
	case FFI_TYPE_SINT64:
	case FFI_TYPE_UINT64:
	  stack->gp_regs[gpcount++] = *(UINT64 *)avalue[i];
	  break;

	case FFI_TYPE_POINTER:
	  stack->gp_regs[gpcount++] = (UINT64)(PTR64) *(void **)avalue[i];
	  break;

	case FFI_TYPE_FLOAT:
	  if (gpcount < 8 && fpcount < 8)
	    stf_spill (&stack->fp_regs[fpcount++], *(float *)avalue[i]);
	  {
	    UINT32 tmp;
	    memcpy (&tmp, avalue[i], sizeof (UINT32));
	    stack->gp_regs[gpcount++] = tmp;
	  }
	  break;

	case FFI_TYPE_DOUBLE:
	  if (gpcount < 8 && fpcount < 8)
	    stf_spill (&stack->fp_regs[fpcount++], *(double *)avalue[i]);
	  memcpy (&stack->gp_regs[gpcount++], avalue[i], sizeof (UINT64));
	  break;

	case FFI_TYPE_LONGDOUBLE:
	  if (gpcount & 1)
	    gpcount++;
	  if (LDBL_MANT_DIG == 64 && gpcount < 8 && fpcount < 8)
	    stf_spill (&stack->fp_regs[fpcount++], *(__float80 *)avalue[i]);
	  memcpy (&stack->gp_regs[gpcount], avalue[i], 16);
	  gpcount += 2;
	  break;

	case FFI_TYPE_STRUCT:
	  {
	    size_t size = (*p_arg)->size;
	    size_t align = (*p_arg)->alignment;
	    int hfa_type = hfa_element_type (*p_arg, 0);

	    FFI_ASSERT (align <= 16);
	    if (align == 16 && (gpcount & 1))
	      gpcount++;

	    if (hfa_type != FFI_TYPE_VOID)
	      {
		size_t hfa_size = hfa_type_size (hfa_type);
		size_t offset = 0;
		size_t gp_offset = gpcount * 8;

		while (fpcount < 8
		       && offset < size
		       && gp_offset < 8 * 8)
		  {
		    hfa_type_load (&stack->fp_regs[fpcount], hfa_type,
				   avalue[i] + offset);
		    offset += hfa_size;
		    gp_offset += hfa_size;
		    fpcount += 1;
		  }
	      }

	    memcpy (&stack->gp_regs[gpcount], avalue[i], size);
	    gpcount += (size + 7) / 8;
	  }
	  break;

	default:
	  abort ();
	}
    }

  ffi_call_unix (stack, rvalue, fn, cif->flags);
}

/* Closures represent a pair consisting of a function pointer, and
   some user data.  A closure is invoked by reinterpreting the closure
   as a function pointer, and branching to it.  Thus we can make an
   interpreted function callable as a C function: We turn the
   interpreter itself, together with a pointer specifying the
   interpreted procedure, into a closure.

   For IA64, function pointer are already pairs consisting of a code
   pointer, and a gp pointer.  The latter is needed to access global
   variables.  Here we set up such a pair as the first two words of
   the closure (in the "trampoline" area), but we replace the gp
   pointer with a pointer to the closure itself.  We also add the real
   gp pointer to the closure.  This allows the function entry code to
   both retrieve the user data, and to restore the correct gp pointer.  */

extern void ffi_closure_unix ();

ffi_status
ffi_prep_closure_loc (ffi_closure* closure,
		      ffi_cif* cif,
		      void (*fun)(ffi_cif*,void*,void**,void*),
		      void *user_data,
		      void *codeloc)
{
  /* The layout of a function descriptor.  A C function pointer really 
     points to one of these.  */
  struct ia64_fd
  {
    UINT64 code_pointer;
    UINT64 gp;
  };

  struct ffi_ia64_trampoline_struct
  {
    UINT64 code_pointer;	/* Pointer to ffi_closure_unix.  */
    UINT64 fake_gp;		/* Pointer to closure, installed as gp.  */
    UINT64 real_gp;		/* Real gp value.  */
  };

  struct ffi_ia64_trampoline_struct *tramp;
  struct ia64_fd *fd;

  if (cif->abi != FFI_UNIX)
    return FFI_BAD_ABI;

  tramp = (struct ffi_ia64_trampoline_struct *)closure->tramp;
  fd = (struct ia64_fd *)(void *)ffi_closure_unix;

  tramp->code_pointer = fd->code_pointer;
  tramp->real_gp = fd->gp;
  tramp->fake_gp = (UINT64)(PTR64)codeloc;
  closure->cif = cif;
  closure->user_data = user_data;
  closure->fun = fun;

  return FFI_OK;
}


UINT64
ffi_closure_unix_inner (ffi_closure *closure, struct ia64_args *stack,
			void *rvalue, void *r8)
{
  ffi_cif *cif;
  void **avalue;
  ffi_type **p_arg;
  long i, avn, gpcount, fpcount, nfixedargs;

  cif = closure->cif;
  avn = cif->nargs;
  nfixedargs = cif->nfixedargs;
  avalue = alloca (avn * sizeof (void *));

  /* If the structure return value is passed in memory get that location
     from r8 so as to pass the value directly back to the caller.  */
  if (cif->flags == FFI_TYPE_STRUCT)
    rvalue = r8;

  gpcount = fpcount = 0;
  for (i = 0, p_arg = cif->arg_types; i < avn; i++, p_arg++)
    {
      int named = i < nfixedargs;
      switch ((*p_arg)->type)
	{
	case FFI_TYPE_SINT8:
	case FFI_TYPE_UINT8:
	  avalue[i] = endian_adjust(&stack->gp_regs[gpcount++], 1);
	  break;
	case FFI_TYPE_SINT16:
	case FFI_TYPE_UINT16:
	  avalue[i] = endian_adjust(&stack->gp_regs[gpcount++], 2);
	  break;
	case FFI_TYPE_SINT32:
	case FFI_TYPE_UINT32:
	  avalue[i] = endian_adjust(&stack->gp_regs[gpcount++], 4);
	  break;
	case FFI_TYPE_SINT64:
	case FFI_TYPE_UINT64:
	  avalue[i] = &stack->gp_regs[gpcount++];
	  break;
	case FFI_TYPE_POINTER:
	  avalue[i] = endian_adjust(&stack->gp_regs[gpcount++], sizeof(void*));
	  break;

	case FFI_TYPE_FLOAT:
	  if (named && gpcount < 8 && fpcount < 8)
	    {
	      fpreg *addr = &stack->fp_regs[fpcount++];
	      float result;
	      avalue[i] = addr;
	      ldf_fill (result, addr);
	      *(float *)addr = result;
	    }
	  else
	    avalue[i] = endian_adjust(&stack->gp_regs[gpcount], 4);
	  gpcount++;
	  break;

	case FFI_TYPE_DOUBLE:
	  if (named && gpcount < 8 && fpcount < 8)
	    {
	      fpreg *addr = &stack->fp_regs[fpcount++];
	      double result;
	      avalue[i] = addr;
	      ldf_fill (result, addr);
	      *(double *)addr = result;
	    }
	  else
	    avalue[i] = &stack->gp_regs[gpcount];
	  gpcount++;
	  break;

	case FFI_TYPE_LONGDOUBLE:
	  if (gpcount & 1)
	    gpcount++;
	  if (LDBL_MANT_DIG == 64 && named && gpcount < 8 && fpcount < 8)
	    {
	      fpreg *addr = &stack->fp_regs[fpcount++];
	      __float80 result;
	      avalue[i] = addr;
	      ldf_fill (result, addr);
	      *(__float80 *)addr = result;
	    }
	  else
	    avalue[i] = &stack->gp_regs[gpcount];
	  gpcount += 2;
	  break;

	case FFI_TYPE_STRUCT:
	  {
	    size_t size = (*p_arg)->size;
	    size_t align = (*p_arg)->alignment;
	    int hfa_type = hfa_element_type (*p_arg, 0);

	    FFI_ASSERT (align <= 16);
	    if (align == 16 && (gpcount & 1))
	      gpcount++;

	    if (hfa_type != FFI_TYPE_VOID)
	      {
		size_t hfa_size = hfa_type_size (hfa_type);
		size_t offset = 0;
		size_t gp_offset = gpcount * 8;
		void *addr = alloca (size);

		avalue[i] = addr;

		while (fpcount < 8
		       && offset < size
		       && gp_offset < 8 * 8)
		  {
		    hfa_type_store (hfa_type, addr + offset,
				    &stack->fp_regs[fpcount]);
		    offset += hfa_size;
		    gp_offset += hfa_size;
		    fpcount += 1;
		  }

		if (offset < size)
		  memcpy (addr + offset, (char *)stack->gp_regs + gp_offset,
			  size - offset);
	      }
	    else
	      avalue[i] = &stack->gp_regs[gpcount];

	    gpcount += (size + 7) / 8;
	  }
	  break;

	default:
	  abort ();
	}
    }

  closure->fun (cif, rvalue, avalue, closure->user_data);

  return cif->flags;
}
