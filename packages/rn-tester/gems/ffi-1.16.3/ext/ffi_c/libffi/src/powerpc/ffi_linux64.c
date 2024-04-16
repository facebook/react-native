/* -----------------------------------------------------------------------
   ffi_linux64.c - Copyright (C) 2013 IBM
                   Copyright (C) 2011 Anthony Green
                   Copyright (C) 2011 Kyle Moffett
                   Copyright (C) 2008 Red Hat, Inc
                   Copyright (C) 2007, 2008 Free Software Foundation, Inc
                   Copyright (c) 1998 Geoffrey Keating

   PowerPC Foreign Function Interface

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
   IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY CLAIM, DAMAGES OR
   OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
   ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
   OTHER DEALINGS IN THE SOFTWARE.
   ----------------------------------------------------------------------- */

#include "ffi.h"

#ifdef POWERPC64
#include "ffi_common.h"
#include "ffi_powerpc.h"


/* About the LINUX64 ABI.  */
enum {
  NUM_GPR_ARG_REGISTERS64 = 8,
  NUM_FPR_ARG_REGISTERS64 = 13,
  NUM_VEC_ARG_REGISTERS64 = 12,
};
enum { ASM_NEEDS_REGISTERS64 = 4 };


#if HAVE_LONG_DOUBLE_VARIANT && FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
/* Adjust size of ffi_type_longdouble.  */
void FFI_HIDDEN
ffi_prep_types_linux64 (ffi_abi abi)
{
  if ((abi & (FFI_LINUX | FFI_LINUX_LONG_DOUBLE_128)) == FFI_LINUX)
    {
      ffi_type_longdouble.size = 8;
      ffi_type_longdouble.alignment = 8;
    }
  else
    {
      ffi_type_longdouble.size = 16;
      ffi_type_longdouble.alignment = 16;
    }
}
#endif


static unsigned int
discover_homogeneous_aggregate (ffi_abi abi,
                                const ffi_type *t,
                                unsigned int *elnum)
{
  switch (t->type)
    {
#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
    case FFI_TYPE_LONGDOUBLE:
      /* 64-bit long doubles are equivalent to doubles. */
      if ((abi & FFI_LINUX_LONG_DOUBLE_128) == 0)
        {
          *elnum = 1;
          return FFI_TYPE_DOUBLE;
        }
      /* IBM extended precision values use unaligned pairs
         of FPRs, but according to the ABI must be considered
         distinct from doubles. They are also limited to a
         maximum of four members in a homogeneous aggregate. */
      else if ((abi & FFI_LINUX_LONG_DOUBLE_IEEE128) == 0)
        {
          *elnum = 2;
          return FFI_TYPE_LONGDOUBLE;
        }
      /* Fall through. */
#endif
    case FFI_TYPE_FLOAT:
    case FFI_TYPE_DOUBLE:
      *elnum = 1;
      return (int) t->type;

    case FFI_TYPE_STRUCT:;
      {
	unsigned int base_elt = 0, total_elnum = 0;
	ffi_type **el = t->elements;
	while (*el)
	  {
	    unsigned int el_elt, el_elnum = 0;
	    el_elt = discover_homogeneous_aggregate (abi, *el, &el_elnum);
	    if (el_elt == 0
		|| (base_elt && base_elt != el_elt))
	      return 0;
	    base_elt = el_elt;
	    total_elnum += el_elnum;
#if _CALL_ELF == 2
	    if (total_elnum > 8)
	      return 0;
#else
	    if (total_elnum > 1)
	      return 0;
#endif
	    el++;
	  }
	*elnum = total_elnum;
	return base_elt;
      }

    default:
      return 0;
    }
}


/* Perform machine dependent cif processing */
static ffi_status
ffi_prep_cif_linux64_core (ffi_cif *cif)
{
  ffi_type **ptr;
  unsigned bytes;
  unsigned i, fparg_count = 0, intarg_count = 0, vecarg_count = 0;
  unsigned flags = cif->flags;
  unsigned elt, elnum, rtype;

#if FFI_TYPE_LONGDOUBLE == FFI_TYPE_DOUBLE
  /* If compiled without long double support... */
  if ((cif->abi & FFI_LINUX_LONG_DOUBLE_128) != 0 ||
      (cif->abi & FFI_LINUX_LONG_DOUBLE_IEEE128) != 0)
    return FFI_BAD_ABI;
#elif !defined(__VEC__)
  /* If compiled without vector register support (used by assembly)... */
  if ((cif->abi & FFI_LINUX_LONG_DOUBLE_IEEE128) != 0)
    return FFI_BAD_ABI;
#else
  /* If the IEEE128 flag is set, but long double is only 64 bits wide... */
  if ((cif->abi & FFI_LINUX_LONG_DOUBLE_128) == 0 &&
      (cif->abi & FFI_LINUX_LONG_DOUBLE_IEEE128) != 0)
    return FFI_BAD_ABI;
#endif

  /* The machine-independent calculation of cif->bytes doesn't work
     for us.  Redo the calculation.  */
#if _CALL_ELF == 2
  /* Space for backchain, CR, LR, TOC and the asm's temp regs.  */
  bytes = (4 + ASM_NEEDS_REGISTERS64) * sizeof (long);

  /* Space for the general registers.  */
  bytes += NUM_GPR_ARG_REGISTERS64 * sizeof (long);
#else
  /* Space for backchain, CR, LR, cc/ld doubleword, TOC and the asm's temp
     regs.  */
  bytes = (6 + ASM_NEEDS_REGISTERS64) * sizeof (long);

  /* Space for the mandatory parm save area and general registers.  */
  bytes += 2 * NUM_GPR_ARG_REGISTERS64 * sizeof (long);
#endif

  /* Return value handling.  */
  rtype = cif->rtype->type;
#if _CALL_ELF == 2
homogeneous:
#endif
  switch (rtype)
    {
#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
    case FFI_TYPE_LONGDOUBLE:
      if ((cif->abi & FFI_LINUX_LONG_DOUBLE_IEEE128) != 0)
        {
          flags |= FLAG_RETURNS_VEC;
          break;
        }
      if ((cif->abi & FFI_LINUX_LONG_DOUBLE_128) != 0)
	flags |= FLAG_RETURNS_128BITS;
      /* Fall through.  */
#endif
    case FFI_TYPE_DOUBLE:
      flags |= FLAG_RETURNS_64BITS;
      /* Fall through.  */
    case FFI_TYPE_FLOAT:
      flags |= FLAG_RETURNS_FP;
      break;

    case FFI_TYPE_UINT128:
      flags |= FLAG_RETURNS_128BITS;
      /* Fall through.  */
    case FFI_TYPE_UINT64:
    case FFI_TYPE_SINT64:
    case FFI_TYPE_POINTER:
      flags |= FLAG_RETURNS_64BITS;
      break;

    case FFI_TYPE_STRUCT:
#if _CALL_ELF == 2
      elt = discover_homogeneous_aggregate (cif->abi, cif->rtype, &elnum);
      if (elt)
        {
          flags |= FLAG_RETURNS_SMST;
          rtype = elt;
          goto homogeneous;
        }
      if (cif->rtype->size <= 16)
        {
          flags |= FLAG_RETURNS_SMST;
          break;
        }
#endif
      intarg_count++;
      flags |= FLAG_RETVAL_REFERENCE;
      /* Fall through.  */
    case FFI_TYPE_VOID:
      flags |= FLAG_RETURNS_NOTHING;
      break;

    default:
      /* Returns 32-bit integer, or similar.  Nothing to do here.  */
      break;
    }

  for (ptr = cif->arg_types, i = cif->nargs; i > 0; i--, ptr++)
    {
      unsigned int align;

      switch ((*ptr)->type)
	{
#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
	case FFI_TYPE_LONGDOUBLE:
          if ((cif->abi & FFI_LINUX_LONG_DOUBLE_IEEE128) != 0)
            {
              vecarg_count++;
              /* Align to 16 bytes, plus the 16-byte argument. */
              intarg_count = (intarg_count + 3) & ~0x1;
              if (vecarg_count > NUM_VEC_ARG_REGISTERS64)
                flags |= FLAG_ARG_NEEDS_PSAVE;
              break;
            }
	  if ((cif->abi & FFI_LINUX_LONG_DOUBLE_128) != 0)
	    {
	      fparg_count++;
	      intarg_count++;
	    }
	  /* Fall through.  */
#endif
	case FFI_TYPE_DOUBLE:
	case FFI_TYPE_FLOAT:
	  fparg_count++;
	  intarg_count++;
	  if (fparg_count > NUM_FPR_ARG_REGISTERS64)
	    flags |= FLAG_ARG_NEEDS_PSAVE;
	  break;

	case FFI_TYPE_STRUCT:
	  if ((cif->abi & FFI_LINUX_STRUCT_ALIGN) != 0)
	    {
	      align = (*ptr)->alignment;
	      if (align > 16)
		align = 16;
	      align = align / 8;
	      if (align > 1)
		intarg_count = FFI_ALIGN (intarg_count, align);
	    }
	  intarg_count += ((*ptr)->size + 7) / 8;
	  elt = discover_homogeneous_aggregate (cif->abi, *ptr, &elnum);
#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
          if (elt == FFI_TYPE_LONGDOUBLE &&
              (cif->abi & FFI_LINUX_LONG_DOUBLE_IEEE128) != 0)
            {
              vecarg_count += elnum;
              if (vecarg_count > NUM_VEC_ARG_REGISTERS64)
                flags |= FLAG_ARG_NEEDS_PSAVE;
              break;
            }
	  else
#endif
	  if (elt)
	    {
	      fparg_count += elnum;
	      if (fparg_count > NUM_FPR_ARG_REGISTERS64)
		flags |= FLAG_ARG_NEEDS_PSAVE;
	    }
	  else
	    {
	      if (intarg_count > NUM_GPR_ARG_REGISTERS64)
		flags |= FLAG_ARG_NEEDS_PSAVE;
	    }
	  break;

	case FFI_TYPE_POINTER:
	case FFI_TYPE_UINT64:
	case FFI_TYPE_SINT64:
	case FFI_TYPE_INT:
	case FFI_TYPE_UINT32:
	case FFI_TYPE_SINT32:
	case FFI_TYPE_UINT16:
	case FFI_TYPE_SINT16:
	case FFI_TYPE_UINT8:
	case FFI_TYPE_SINT8:
	  /* Everything else is passed as a 8-byte word in a GPR, either
	     the object itself or a pointer to it.  */
	  intarg_count++;
	  if (intarg_count > NUM_GPR_ARG_REGISTERS64)
	    flags |= FLAG_ARG_NEEDS_PSAVE;
	  break;
	default:
	  FFI_ASSERT (0);
	}
    }

  if (fparg_count != 0)
    flags |= FLAG_FP_ARGUMENTS;
  if (intarg_count > 4)
    flags |= FLAG_4_GPR_ARGUMENTS;
  if (vecarg_count != 0)
    flags |= FLAG_VEC_ARGUMENTS;

  /* Space for the FPR registers, if needed.  */
  if (fparg_count != 0)
    bytes += NUM_FPR_ARG_REGISTERS64 * sizeof (double);
  /* Space for the vector registers, if needed, aligned to 16 bytes. */
  if (vecarg_count != 0) {
    bytes = (bytes + 15) & ~0xF;
    bytes += NUM_VEC_ARG_REGISTERS64 * sizeof (float128);
  }

  /* Stack space.  */
#if _CALL_ELF == 2
  if ((flags & FLAG_ARG_NEEDS_PSAVE) != 0)
    bytes += intarg_count * sizeof (long);
#else
  if (intarg_count > NUM_GPR_ARG_REGISTERS64)
    bytes += (intarg_count - NUM_GPR_ARG_REGISTERS64) * sizeof (long);
#endif

  /* The stack space allocated needs to be a multiple of 16 bytes.  */
  bytes = (bytes + 15) & ~0xF;

  cif->flags = flags;
  cif->bytes = bytes;

  return FFI_OK;
}

ffi_status FFI_HIDDEN
ffi_prep_cif_linux64 (ffi_cif *cif)
{
  if ((cif->abi & FFI_LINUX) != 0)
    cif->nfixedargs = cif->nargs;
#if _CALL_ELF != 2
  else if (cif->abi == FFI_COMPAT_LINUX64)
    {
      /* This call is from old code.  Don't touch cif->nfixedargs
	 since old code will be using a smaller cif.  */
      cif->flags |= FLAG_COMPAT;
      /* Translate to new abi value.  */
      cif->abi = FFI_LINUX | FFI_LINUX_LONG_DOUBLE_128;
    }
#endif
  else
    return FFI_BAD_ABI;
  return ffi_prep_cif_linux64_core (cif);
}

ffi_status FFI_HIDDEN
ffi_prep_cif_linux64_var (ffi_cif *cif,
			  unsigned int nfixedargs,
			  unsigned int ntotalargs MAYBE_UNUSED)
{
  if ((cif->abi & FFI_LINUX) != 0)
    cif->nfixedargs = nfixedargs;
#if _CALL_ELF != 2
  else if (cif->abi == FFI_COMPAT_LINUX64)
    {
      /* This call is from old code.  Don't touch cif->nfixedargs
	 since old code will be using a smaller cif.  */
      cif->flags |= FLAG_COMPAT;
      /* Translate to new abi value.  */
      cif->abi = FFI_LINUX | FFI_LINUX_LONG_DOUBLE_128;
    }
#endif
  else
    return FFI_BAD_ABI;
#if _CALL_ELF == 2
  cif->flags |= FLAG_ARG_NEEDS_PSAVE;
#endif
  return ffi_prep_cif_linux64_core (cif);
}


/* ffi_prep_args64 is called by the assembly routine once stack space
   has been allocated for the function's arguments.

   The stack layout we want looks like this:

   |   Ret addr from ffi_call_LINUX64	8bytes	|	higher addresses
   |--------------------------------------------|
   |   CR save area			8bytes	|
   |--------------------------------------------|
   |   Previous backchain pointer	8	|	stack pointer here
   |--------------------------------------------|<+ <<<	on entry to
   |   Saved r28-r31			4*8	| |	ffi_call_LINUX64
   |--------------------------------------------| |
   |   GPR registers r3-r10		8*8	| |
   |--------------------------------------------| |
   |   FPR registers f1-f13 (optional)	13*8	| |
   |--------------------------------------------| |
   |   VEC registers v2-v13 (optional)  12*16   | |
   |--------------------------------------------| |
   |   Parameter save area		        | |
   |--------------------------------------------| |
   |   TOC save area			8	| |
   |--------------------------------------------| |	stack	|
   |   Linker doubleword		8	| |	grows	|
   |--------------------------------------------| |	down	V
   |   Compiler doubleword		8	| |
   |--------------------------------------------| |	lower addresses
   |   Space for callee's LR		8	| |
   |--------------------------------------------| |
   |   CR save area			8	| |
   |--------------------------------------------| |	stack pointer here
   |   Current backchain pointer	8	|-/	during
   |--------------------------------------------|   <<<	ffi_call_LINUX64

*/

void FFI_HIDDEN
ffi_prep_args64 (extended_cif *ecif, unsigned long *const stack)
{
  const unsigned long bytes = ecif->cif->bytes;
  const unsigned long flags = ecif->cif->flags;

  typedef union
  {
    char *c;
    unsigned long *ul;
    float *f;
    double *d;
    float128 *f128;
    size_t p;
  } valp;

  /* 'stacktop' points at the previous backchain pointer.  */
  valp stacktop;

  /* 'next_arg' points at the space for gpr3, and grows upwards as
     we use GPR registers, then continues at rest.  */
  valp gpr_base;
  valp gpr_end;
  valp rest;
  valp next_arg;

  /* 'fpr_base' points at the space for f1, and grows upwards as
     we use FPR registers.  */
  valp fpr_base;
  unsigned int fparg_count;

  /* 'vec_base' points at the space for v2, and grows upwards as
     we use vector registers.  */
  valp vec_base;
  unsigned int vecarg_count;

  unsigned int i, words, nargs, nfixedargs;
  ffi_type **ptr;
  double double_tmp;
  union
  {
    void **v;
    char **c;
    signed char **sc;
    unsigned char **uc;
    signed short **ss;
    unsigned short **us;
    signed int **si;
    unsigned int **ui;
    unsigned long **ul;
    float **f;
    double **d;
    float128 **f128;
  } p_argv;
  unsigned long gprvalue;
  unsigned long align;

  stacktop.c = (char *) stack + bytes;
  gpr_base.ul = stacktop.ul - ASM_NEEDS_REGISTERS64 - NUM_GPR_ARG_REGISTERS64;
  gpr_end.ul = gpr_base.ul + NUM_GPR_ARG_REGISTERS64;
#if _CALL_ELF == 2
  rest.ul = stack + 4 + NUM_GPR_ARG_REGISTERS64;
#else
  rest.ul = stack + 6 + NUM_GPR_ARG_REGISTERS64;
#endif
  fpr_base.d = gpr_base.d - NUM_FPR_ARG_REGISTERS64;
  fparg_count = 0;
  /* Place the vector args below the FPRs, if used, else the GPRs. */
  if (ecif->cif->flags & FLAG_FP_ARGUMENTS)
    vec_base.p = fpr_base.p & ~0xF;
  else
    vec_base.p = gpr_base.p;
  vec_base.f128 -= NUM_VEC_ARG_REGISTERS64;
  vecarg_count = 0;
  next_arg.ul = gpr_base.ul;

  /* Check that everything starts aligned properly.  */
  FFI_ASSERT (((unsigned long) (char *) stack & 0xF) == 0);
  FFI_ASSERT (((unsigned long) stacktop.c & 0xF) == 0);
  FFI_ASSERT (((unsigned long) gpr_base.c & 0xF) == 0);
  FFI_ASSERT (((unsigned long) gpr_end.c  & 0xF) == 0);
  FFI_ASSERT (((unsigned long) vec_base.c & 0xF) == 0);
  FFI_ASSERT ((bytes & 0xF) == 0);

  /* Deal with return values that are actually pass-by-reference.  */
  if (flags & FLAG_RETVAL_REFERENCE)
    *next_arg.ul++ = (unsigned long) (char *) ecif->rvalue;

  /* Now for the arguments.  */
  p_argv.v = ecif->avalue;
  nargs = ecif->cif->nargs;
#if _CALL_ELF != 2
  nfixedargs = (unsigned) -1;
  if ((flags & FLAG_COMPAT) == 0)
#endif
    nfixedargs = ecif->cif->nfixedargs;
  for (ptr = ecif->cif->arg_types, i = 0;
       i < nargs;
       i++, ptr++, p_argv.v++)
    {
      unsigned int elt, elnum;

      switch ((*ptr)->type)
	{
#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
	case FFI_TYPE_LONGDOUBLE:
          if ((ecif->cif->abi & FFI_LINUX_LONG_DOUBLE_IEEE128) != 0)
            {
              next_arg.p = FFI_ALIGN (next_arg.p, 16);
              if (next_arg.ul == gpr_end.ul)
                next_arg.ul = rest.ul;
              if (vecarg_count < NUM_VEC_ARG_REGISTERS64 && i < nfixedargs)
		memcpy (vec_base.f128++, *p_argv.f128, sizeof (float128));
              else
		memcpy (next_arg.f128, *p_argv.f128, sizeof (float128));
              if (++next_arg.f128 == gpr_end.f128)
                next_arg.f128 = rest.f128;
              vecarg_count++;
              FFI_ASSERT (__LDBL_MANT_DIG__ == 113);
              FFI_ASSERT (flags & FLAG_VEC_ARGUMENTS);
              break;
            }
	  if ((ecif->cif->abi & FFI_LINUX_LONG_DOUBLE_128) != 0)
	    {
	      double_tmp = (*p_argv.d)[0];
	      if (fparg_count < NUM_FPR_ARG_REGISTERS64 && i < nfixedargs)
		{
		  *fpr_base.d++ = double_tmp;
# if _CALL_ELF != 2
		  if ((flags & FLAG_COMPAT) != 0)
		    *next_arg.d = double_tmp;
# endif
		}
	      else
		*next_arg.d = double_tmp;
	      if (++next_arg.ul == gpr_end.ul)
		next_arg.ul = rest.ul;
	      fparg_count++;
	      double_tmp = (*p_argv.d)[1];
	      if (fparg_count < NUM_FPR_ARG_REGISTERS64 && i < nfixedargs)
		{
		  *fpr_base.d++ = double_tmp;
# if _CALL_ELF != 2
		  if ((flags & FLAG_COMPAT) != 0)
		    *next_arg.d = double_tmp;
# endif
		}
	      else
		*next_arg.d = double_tmp;
	      if (++next_arg.ul == gpr_end.ul)
		next_arg.ul = rest.ul;
	      fparg_count++;
	      FFI_ASSERT (__LDBL_MANT_DIG__ == 106);
	      FFI_ASSERT (flags & FLAG_FP_ARGUMENTS);
	      break;
	    }
	  /* Fall through.  */
#endif
	case FFI_TYPE_DOUBLE:
#if _CALL_ELF != 2
	do_double:
#endif
	  double_tmp = **p_argv.d;
	  if (fparg_count < NUM_FPR_ARG_REGISTERS64 && i < nfixedargs)
	    {
	      *fpr_base.d++ = double_tmp;
#if _CALL_ELF != 2
	      if ((flags & FLAG_COMPAT) != 0)
		*next_arg.d = double_tmp;
#endif
	    }
	  else
	    *next_arg.d = double_tmp;
	  if (++next_arg.ul == gpr_end.ul)
	    next_arg.ul = rest.ul;
	  fparg_count++;
	  FFI_ASSERT (flags & FLAG_FP_ARGUMENTS);
	  break;

	case FFI_TYPE_FLOAT:
#if _CALL_ELF != 2
	do_float:
#endif
	  double_tmp = **p_argv.f;
	  if (fparg_count < NUM_FPR_ARG_REGISTERS64 && i < nfixedargs)
	    {
	      *fpr_base.d++ = double_tmp;
#if _CALL_ELF != 2
	      if ((flags & FLAG_COMPAT) != 0)
		{
# ifndef __LITTLE_ENDIAN__
		  next_arg.f[1] = (float) double_tmp;
# else
		  next_arg.f[0] = (float) double_tmp;
# endif
		}
#endif
	    }
	  else
	    {
# ifndef __LITTLE_ENDIAN__
	      next_arg.f[1] = (float) double_tmp;
# else
	      next_arg.f[0] = (float) double_tmp;
# endif
	    }
	  if (++next_arg.ul == gpr_end.ul)
	    next_arg.ul = rest.ul;
	  fparg_count++;
	  FFI_ASSERT (flags & FLAG_FP_ARGUMENTS);
	  break;

	case FFI_TYPE_STRUCT:
	  if ((ecif->cif->abi & FFI_LINUX_STRUCT_ALIGN) != 0)
	    {
	      align = (*ptr)->alignment;
	      if (align > 16)
		align = 16;
	      if (align > 1)
                {
                  next_arg.p = FFI_ALIGN (next_arg.p, align);
                  if (next_arg.ul == gpr_end.ul)
                    next_arg.ul = rest.ul;
                }
	    }
	  elt = discover_homogeneous_aggregate (ecif->cif->abi, *ptr, &elnum);
	  if (elt)
	    {
#if _CALL_ELF == 2
	      union {
		void *v;
		float *f;
		double *d;
		float128 *f128;
	      } arg;

	      arg.v = *p_argv.v;
#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
              if (elt == FFI_TYPE_LONGDOUBLE &&
                  (ecif->cif->abi & FFI_LINUX_LONG_DOUBLE_IEEE128) != 0)
                {
                  do
                    {
                      if (vecarg_count < NUM_VEC_ARG_REGISTERS64
                          && i < nfixedargs)
		        memcpy (vec_base.f128++, arg.f128++, sizeof (float128));
                      else
		        memcpy (next_arg.f128, arg.f128++, sizeof (float128));
                      if (++next_arg.f128 == gpr_end.f128)
                        next_arg.f128 = rest.f128;
                      vecarg_count++;
                    }
                  while (--elnum != 0);
                }
              else
#endif
	      if (elt == FFI_TYPE_FLOAT)
		{
		  do
		    {
		      double_tmp = *arg.f++;
		      if (fparg_count < NUM_FPR_ARG_REGISTERS64
			  && i < nfixedargs)
			*fpr_base.d++ = double_tmp;
		      else
			*next_arg.f = (float) double_tmp;
		      if (++next_arg.f == gpr_end.f)
			next_arg.f = rest.f;
		      fparg_count++;
		    }
		  while (--elnum != 0);
		  if ((next_arg.p & 7) != 0)
                    if (++next_arg.f == gpr_end.f)
                      next_arg.f = rest.f;
		}
	      else
		do
		  {
		    double_tmp = *arg.d++;
		    if (fparg_count < NUM_FPR_ARG_REGISTERS64 && i < nfixedargs)
		      *fpr_base.d++ = double_tmp;
		    else
		      *next_arg.d = double_tmp;
		    if (++next_arg.d == gpr_end.d)
		      next_arg.d = rest.d;
		    fparg_count++;
		  }
		while (--elnum != 0);
#else
	      if (elt == FFI_TYPE_FLOAT)
		goto do_float;
	      else
		goto do_double;
#endif
	    }
	  else
	    {
	      words = ((*ptr)->size + 7) / 8;
	      if (next_arg.ul >= gpr_base.ul && next_arg.ul + words > gpr_end.ul)
		{
		  size_t first = gpr_end.c - next_arg.c;
		  memcpy (next_arg.c, *p_argv.c, first);
		  memcpy (rest.c, *p_argv.c + first, (*ptr)->size - first);
		  next_arg.c = rest.c + words * 8 - first;
		}
	      else
		{
		  char *where = next_arg.c;

#ifndef __LITTLE_ENDIAN__
		  /* Structures with size less than eight bytes are passed
		     left-padded.  */
		  if ((*ptr)->size < 8)
		    where += 8 - (*ptr)->size;
#endif
		  memcpy (where, *p_argv.c, (*ptr)->size);
		  next_arg.ul += words;
		  if (next_arg.ul == gpr_end.ul)
		    next_arg.ul = rest.ul;
		}
	    }
	  break;

	case FFI_TYPE_UINT8:
	  gprvalue = **p_argv.uc;
	  goto putgpr;
	case FFI_TYPE_SINT8:
	  gprvalue = **p_argv.sc;
	  goto putgpr;
	case FFI_TYPE_UINT16:
	  gprvalue = **p_argv.us;
	  goto putgpr;
	case FFI_TYPE_SINT16:
	  gprvalue = **p_argv.ss;
	  goto putgpr;
	case FFI_TYPE_UINT32:
	  gprvalue = **p_argv.ui;
	  goto putgpr;
	case FFI_TYPE_INT:
	case FFI_TYPE_SINT32:
	  gprvalue = **p_argv.si;
	  goto putgpr;

	case FFI_TYPE_UINT64:
	case FFI_TYPE_SINT64:
	case FFI_TYPE_POINTER:
	  gprvalue = **p_argv.ul;
	putgpr:
	  *next_arg.ul++ = gprvalue;
	  if (next_arg.ul == gpr_end.ul)
	    next_arg.ul = rest.ul;
	  break;
	}
    }

  FFI_ASSERT (flags & FLAG_4_GPR_ARGUMENTS
	      || (next_arg.ul >= gpr_base.ul
		  && next_arg.ul <= gpr_base.ul + 4));
}


#if _CALL_ELF == 2
#define MIN_CACHE_LINE_SIZE 8

static void
flush_icache (char *wraddr, char *xaddr, int size)
{
  int i;
  for (i = 0; i < size; i += MIN_CACHE_LINE_SIZE)
    __asm__ volatile ("icbi 0,%0;" "dcbf 0,%1;"
		      : : "r" (xaddr + i), "r" (wraddr + i) : "memory");
  __asm__ volatile ("icbi 0,%0;" "dcbf 0,%1;" "sync;" "isync;"
		    : : "r"(xaddr + size - 1), "r"(wraddr + size - 1)
		    : "memory");
}
#endif


ffi_status FFI_HIDDEN
ffi_prep_closure_loc_linux64 (ffi_closure *closure,
			      ffi_cif *cif,
			      void (*fun) (ffi_cif *, void *, void **, void *),
			      void *user_data,
			      void *codeloc)
{
#if _CALL_ELF == 2
  unsigned int *tramp = (unsigned int *) &closure->tramp[0];

  if (cif->abi < FFI_LINUX || cif->abi >= FFI_LAST_ABI)
    return FFI_BAD_ABI;

  tramp[0] = 0xe96c0018;	/* 0:	ld	11,2f-0b(12)	*/
  tramp[1] = 0xe98c0010;	/*	ld	12,1f-0b(12)	*/
  tramp[2] = 0x7d8903a6;	/*	mtctr	12		*/
  tramp[3] = 0x4e800420;	/*	bctr			*/
				/* 1:	.quad	function_addr	*/
				/* 2:	.quad	context		*/
  *(void **) &tramp[4] = (void *) ffi_closure_LINUX64;
  *(void **) &tramp[6] = codeloc;
  flush_icache ((char *) tramp, (char *) codeloc, 4 * 4);
#else
  void **tramp = (void **) &closure->tramp[0];

  if (cif->abi < FFI_LINUX || cif->abi >= FFI_LAST_ABI)
    return FFI_BAD_ABI;

  /* Copy function address and TOC from ffi_closure_LINUX64 OPD.  */
  memcpy (&tramp[0], (void **) ffi_closure_LINUX64, sizeof (void *));
  tramp[1] = codeloc;
  memcpy (&tramp[2], (void **) ffi_closure_LINUX64 + 1, sizeof (void *));
#endif

  closure->cif = cif;
  closure->fun = fun;
  closure->user_data = user_data;

  return FFI_OK;
}


int FFI_HIDDEN
ffi_closure_helper_LINUX64 (ffi_cif *cif,
			    void (*fun) (ffi_cif *, void *, void **, void *),
			    void *user_data,
			    void *rvalue,
			    unsigned long *pst,
                            ffi_dblfl *pfr,
                            float128 *pvec)
{
  /* rvalue is the pointer to space for return value in closure assembly */
  /* pst is the pointer to parameter save area
     (r3-r10 are stored into its first 8 slots by ffi_closure_LINUX64) */
  /* pfr is the pointer to where f1-f13 are stored in ffi_closure_LINUX64 */
  /* pvec is the pointer to where v2-v13 are stored in ffi_closure_LINUX64 */

  void **avalue;
  ffi_type **arg_types;
  unsigned long i, avn, nfixedargs;
  ffi_dblfl *end_pfr = pfr + NUM_FPR_ARG_REGISTERS64;
  float128 *end_pvec = pvec + NUM_VEC_ARG_REGISTERS64;
  unsigned long align;

  avalue = alloca (cif->nargs * sizeof (void *));

  /* Copy the caller's structure return value address so that the
     closure returns the data directly to the caller.  */
  if (cif->rtype->type == FFI_TYPE_STRUCT
      && (cif->flags & FLAG_RETURNS_SMST) == 0)
    {
      rvalue = (void *) *pst;
      pst++;
    }

  i = 0;
  avn = cif->nargs;
#if _CALL_ELF != 2
  nfixedargs = (unsigned) -1;
  if ((cif->flags & FLAG_COMPAT) == 0)
#endif
    nfixedargs = cif->nfixedargs;
  arg_types = cif->arg_types;

  /* Grab the addresses of the arguments from the stack frame.  */
  while (i < avn)
    {
      unsigned int elt, elnum;

      switch (arg_types[i]->type)
	{
	case FFI_TYPE_SINT8:
	case FFI_TYPE_UINT8:
#ifndef __LITTLE_ENDIAN__
	  avalue[i] = (char *) pst + 7;
	  pst++;
	  break;
#endif

	case FFI_TYPE_SINT16:
	case FFI_TYPE_UINT16:
#ifndef __LITTLE_ENDIAN__
	  avalue[i] = (char *) pst + 6;
	  pst++;
	  break;
#endif

	case FFI_TYPE_SINT32:
	case FFI_TYPE_UINT32:
#ifndef __LITTLE_ENDIAN__
	  avalue[i] = (char *) pst + 4;
	  pst++;
	  break;
#endif

	case FFI_TYPE_SINT64:
	case FFI_TYPE_UINT64:
	case FFI_TYPE_POINTER:
	  avalue[i] = pst;
	  pst++;
	  break;

	case FFI_TYPE_STRUCT:
	  if ((cif->abi & FFI_LINUX_STRUCT_ALIGN) != 0)
	    {
	      align = arg_types[i]->alignment;
	      if (align > 16)
		align = 16;
	      if (align > 1)
		pst = (unsigned long *) FFI_ALIGN ((size_t) pst, align);
	    }
	  elt = discover_homogeneous_aggregate (cif->abi, arg_types[i], &elnum);
	  if (elt)
	    {
#if _CALL_ELF == 2
	      union {
		void *v;
		unsigned long *ul;
		float *f;
		double *d;
		float128 *f128;
		size_t p;
	      } to, from;

	      /* Repackage the aggregate from its parts.  The
		 aggregate size is not greater than the space taken by
		 the registers so store back to the register/parameter
		 save arrays.  */
#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
              if (elt == FFI_TYPE_LONGDOUBLE &&
                  (cif->abi & FFI_LINUX_LONG_DOUBLE_IEEE128) != 0)
                {
                  if (pvec + elnum <= end_pvec)
                    to.v = pvec;
                  else
                    to.v = pst;
                }
              else
#endif
	      if (pfr + elnum <= end_pfr)
		to.v = pfr;
	      else
		to.v = pst;

	      avalue[i] = to.v;
	      from.ul = pst;
#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
              if (elt == FFI_TYPE_LONGDOUBLE &&
                  (cif->abi & FFI_LINUX_LONG_DOUBLE_IEEE128) != 0)
                {
                  do
                    {
                      if (pvec < end_pvec && i < nfixedargs)
		        memcpy (to.f128, pvec++, sizeof (float128));
                      else
		        memcpy (to.f128, from.f128, sizeof (float128));
                      to.f128++;
                      from.f128++;
                    }
                  while (--elnum != 0);
                }
              else
#endif
	      if (elt == FFI_TYPE_FLOAT)
		{
		  do
		    {
		      if (pfr < end_pfr && i < nfixedargs)
			{
			  *to.f = (float) pfr->d;
			  pfr++;
			}
		      else
			*to.f = *from.f;
		      to.f++;
		      from.f++;
		    }
		  while (--elnum != 0);
		}
	      else
		{
		  do
		    {
		      if (pfr < end_pfr && i < nfixedargs)
			{
			  *to.d = pfr->d;
			  pfr++;
			}
		      else
			*to.d = *from.d;
		      to.d++;
		      from.d++;
		    }
		  while (--elnum != 0);
		}
#else
	      if (elt == FFI_TYPE_FLOAT)
		goto do_float;
	      else
		goto do_double;
#endif
	    }
	  else
	    {
#ifndef __LITTLE_ENDIAN__
	      /* Structures with size less than eight bytes are passed
		 left-padded.  */
	      if (arg_types[i]->size < 8)
		avalue[i] = (char *) pst + 8 - arg_types[i]->size;
	      else
#endif
		avalue[i] = pst;
	    }
	  pst += (arg_types[i]->size + 7) / 8;
	  break;

#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
	case FFI_TYPE_LONGDOUBLE:
          if ((cif->abi & FFI_LINUX_LONG_DOUBLE_IEEE128) != 0)
            {
              if (((unsigned long) pst & 0xF) != 0)
                ++pst;
              if (pvec < end_pvec && i < nfixedargs)
                avalue[i] = pvec++;
              else
                avalue[i] = pst;
              pst += 2;
              break;
            }
          else if ((cif->abi & FFI_LINUX_LONG_DOUBLE_128) != 0)
	    {
	      if (pfr + 1 < end_pfr && i + 1 < nfixedargs)
		{
		  avalue[i] = pfr;
		  pfr += 2;
		}
	      else
		{
		  if (pfr < end_pfr && i < nfixedargs)
		    {
		      /* Passed partly in f13 and partly on the stack.
			 Move it all to the stack.  */
		      *pst = *(unsigned long *) pfr;
		      pfr++;
		    }
		  avalue[i] = pst;
		}
	      pst += 2;
	      break;
	    }
	  /* Fall through.  */
#endif
	case FFI_TYPE_DOUBLE:
#if _CALL_ELF != 2
	do_double:
#endif
	  /* On the outgoing stack all values are aligned to 8 */
	  /* there are 13 64bit floating point registers */

	  if (pfr < end_pfr && i < nfixedargs)
	    {
	      avalue[i] = pfr;
	      pfr++;
	    }
	  else
	    avalue[i] = pst;
	  pst++;
	  break;

	case FFI_TYPE_FLOAT:
#if _CALL_ELF != 2
	do_float:
#endif
	  if (pfr < end_pfr && i < nfixedargs)
	    {
	      /* Float values are stored as doubles in the
		 ffi_closure_LINUX64 code.  Fix them here.  */
	      pfr->f = (float) pfr->d;
	      avalue[i] = pfr;
	      pfr++;
	    }
	  else
	    {
#ifndef __LITTLE_ENDIAN__
	      avalue[i] = (char *) pst + 4;
#else
	      avalue[i] = pst;
#endif
	    }
	  pst++;
	  break;

	default:
	  FFI_ASSERT (0);
	}

      i++;
    }

  (*fun) (cif, rvalue, avalue, user_data);

  /* Tell ffi_closure_LINUX64 how to perform return type promotions.  */
  if ((cif->flags & FLAG_RETURNS_SMST) != 0)
    {
      if ((cif->flags & (FLAG_RETURNS_FP | FLAG_RETURNS_VEC)) == 0)
	return FFI_V2_TYPE_SMALL_STRUCT + cif->rtype->size - 1;
      else if ((cif->flags & FLAG_RETURNS_VEC) != 0)
        return FFI_V2_TYPE_VECTOR_HOMOG;
      else if ((cif->flags & FLAG_RETURNS_64BITS) != 0)
	return FFI_V2_TYPE_DOUBLE_HOMOG;
      else
	return FFI_V2_TYPE_FLOAT_HOMOG;
    }
  if ((cif->flags & FLAG_RETURNS_VEC) != 0)
    return FFI_V2_TYPE_VECTOR;
  return cif->rtype->type;
}
#endif
