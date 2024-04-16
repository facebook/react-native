/* -----------------------------------------------------------------------
   ffi_darwin.c

   Copyright (C) 1998 Geoffrey Keating
   Copyright (C) 2001 John Hornkvist
   Copyright (C) 2002, 2006, 2007, 2009, 2010 Free Software Foundation, Inc.

   FFI support for Darwin and AIX.
   
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

#include <ffi.h>
#include <ffi_common.h>

#include <stdlib.h>

extern void ffi_closure_ASM (void);

#if defined (FFI_GO_CLOSURES)
extern void ffi_go_closure_ASM (void);
#endif

enum {
  /* The assembly depends on these exact flags.  
     For Darwin64 (when FLAG_RETURNS_STRUCT is set):
       FLAG_RETURNS_FP indicates that the structure embeds FP data.
       FLAG_RETURNS_128BITS signals a special struct size that is not
       expanded for float content.  */
  FLAG_RETURNS_128BITS	= 1 << (31-31), /* These go in cr7  */
  FLAG_RETURNS_NOTHING	= 1 << (31-30),
  FLAG_RETURNS_FP	= 1 << (31-29),
  FLAG_RETURNS_64BITS	= 1 << (31-28),

  FLAG_RETURNS_STRUCT	= 1 << (31-27), /* This goes in cr6  */

  FLAG_ARG_NEEDS_COPY   = 1 << (31- 7),
  FLAG_FP_ARGUMENTS     = 1 << (31- 6), /* cr1.eq; specified by ABI  */
  FLAG_4_GPR_ARGUMENTS  = 1 << (31- 5),
  FLAG_RETVAL_REFERENCE = 1 << (31- 4)
};

/* About the DARWIN ABI.  */
enum {
  NUM_GPR_ARG_REGISTERS = 8,
  NUM_FPR_ARG_REGISTERS = 13,
  LINKAGE_AREA_GPRS = 6
};

enum { ASM_NEEDS_REGISTERS = 4 }; /* r28-r31 */

/* ffi_prep_args is called by the assembly routine once stack space
   has been allocated for the function's arguments.
   
   m32/m64

   The stack layout we want looks like this:

   |   Return address from ffi_call_DARWIN      |	higher addresses
   |--------------------------------------------|
   |   Previous backchain pointer	4/8	|	stack pointer here
   |--------------------------------------------|<+ <<<	on entry to
   |   ASM_NEEDS_REGISTERS=r28-r31   4*(4/8)	| |	ffi_call_DARWIN
   |--------------------------------------------| |
   |   When we have any FP activity... the	| |
   |   FPRs occupy NUM_FPR_ARG_REGISTERS slots	| |
   |   here fp13 .. fp1 from high to low addr.	| |
   ~						~ ~
   |   Parameters      (at least 8*4/8=32/64)	| | NUM_GPR_ARG_REGISTERS
   |--------------------------------------------| |
   |   TOC=R2 (AIX) Reserved (Darwin)   4/8	| |
   |--------------------------------------------| |	stack	|
   |   Reserved                       2*4/8	| |	grows	|
   |--------------------------------------------| |	down	V
   |   Space for callee's LR		4/8	| |
   |--------------------------------------------| |	lower addresses
   |   Saved CR [low word for m64]      4/8	| |
   |--------------------------------------------| |     stack pointer here
   |   Current backchain pointer	4/8	|-/	during
   |--------------------------------------------|   <<<	ffi_call_DARWIN

   */

#if defined(POWERPC_DARWIN64)
static void
darwin64_pass_struct_by_value 
  (ffi_type *, char *, unsigned, unsigned *, double **, unsigned long **);
#endif

/* This depends on GPR_SIZE = sizeof (unsigned long) */

void
ffi_prep_args (extended_cif *ecif, unsigned long *const stack)
{
  const unsigned bytes = ecif->cif->bytes;
  const unsigned flags = ecif->cif->flags;
  const unsigned nargs = ecif->cif->nargs;
#if !defined(POWERPC_DARWIN64) 
  const ffi_abi abi = ecif->cif->abi;
#endif

  /* 'stacktop' points at the previous backchain pointer.  */
  unsigned long *const stacktop = stack + (bytes / sizeof(unsigned long));

  /* 'fpr_base' points at the space for fpr1, and grows upwards as
     we use FPR registers.  */
  double *fpr_base = (double *) (stacktop - ASM_NEEDS_REGISTERS) - NUM_FPR_ARG_REGISTERS;
  int gp_count = 0, fparg_count = 0;

  /* 'next_arg' grows up as we put parameters in it.  */
  unsigned long *next_arg = stack + LINKAGE_AREA_GPRS; /* 6 reserved positions.  */

  int i;
  double double_tmp;
  void **p_argv = ecif->avalue;
  unsigned long gprvalue;
  ffi_type** ptr = ecif->cif->arg_types;
#if !defined(POWERPC_DARWIN64) 
  char *dest_cpy;
#endif
  unsigned size_al = 0;

  /* Check that everything starts aligned properly.  */
  FFI_ASSERT(((unsigned) (char *) stack & 0xF) == 0);
  FFI_ASSERT(((unsigned) (char *) stacktop & 0xF) == 0);
  FFI_ASSERT((bytes & 0xF) == 0);

  /* Deal with return values that are actually pass-by-reference.
     Rule:
     Return values are referenced by r3, so r4 is the first parameter.  */

  if (flags & FLAG_RETVAL_REFERENCE)
    *next_arg++ = (unsigned long) (char *) ecif->rvalue;

  /* Now for the arguments.  */
  for (i = nargs; i > 0; i--, ptr++, p_argv++)
    {
      switch ((*ptr)->type)
	{
	/* If a floating-point parameter appears before all of the general-
	   purpose registers are filled, the corresponding GPRs that match
	   the size of the floating-point parameter are skipped.  */
	case FFI_TYPE_FLOAT:
	  double_tmp = *(float *) *p_argv;
	  if (fparg_count < NUM_FPR_ARG_REGISTERS)
	    *fpr_base++ = double_tmp;
#if defined(POWERPC_DARWIN)
	  *(float *)next_arg = *(float *) *p_argv;
#else
	  *(double *)next_arg = double_tmp;
#endif
	  next_arg++;
	  gp_count++;
	  fparg_count++;
	  FFI_ASSERT(flags & FLAG_FP_ARGUMENTS);
	  break;

	case FFI_TYPE_DOUBLE:
	  double_tmp = *(double *) *p_argv;
	  if (fparg_count < NUM_FPR_ARG_REGISTERS)
	    *fpr_base++ = double_tmp;
	  *(double *)next_arg = double_tmp;
#ifdef POWERPC64
	  next_arg++;
	  gp_count++;
#else
	  next_arg += 2;
	  gp_count += 2;
#endif
	  fparg_count++;
	  FFI_ASSERT(flags & FLAG_FP_ARGUMENTS);
	  break;

#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE

	case FFI_TYPE_LONGDOUBLE:
#  if defined(POWERPC64) && !defined(POWERPC_DARWIN64)
	  /* ??? This will exceed the regs count when the value starts at fp13
	     and it will not put the extra bit on the stack.  */
	  if (fparg_count < NUM_FPR_ARG_REGISTERS)
	    *(long double *) fpr_base++ = *(long double *) *p_argv;
	  else
	    *(long double *) next_arg = *(long double *) *p_argv;
	  next_arg += 2;
	  fparg_count += 2;
#  else
	  double_tmp = ((double *) *p_argv)[0];
	  if (fparg_count < NUM_FPR_ARG_REGISTERS)
	    *fpr_base++ = double_tmp;
	  *(double *) next_arg = double_tmp;
#    if defined(POWERPC_DARWIN64)
	  next_arg++;
	  gp_count++;
#    else
	  next_arg += 2;
	  gp_count += 2;
#    endif
	  fparg_count++;
	  double_tmp = ((double *) *p_argv)[1];
	  if (fparg_count < NUM_FPR_ARG_REGISTERS)
	    *fpr_base++ = double_tmp;
	  *(double *) next_arg = double_tmp;
#    if defined(POWERPC_DARWIN64)
	  next_arg++;
	  gp_count++;
#    else
	  next_arg += 2;
	  gp_count += 2;
#    endif
	  fparg_count++;
#  endif
	  FFI_ASSERT(flags & FLAG_FP_ARGUMENTS);
	  break;
#endif
	case FFI_TYPE_UINT64:
	case FFI_TYPE_SINT64:
#ifdef POWERPC64
	  gprvalue = *(long long *) *p_argv;
	  goto putgpr;
#else
	  *(long long *) next_arg = *(long long *) *p_argv;
	  next_arg += 2;
	  gp_count += 2;
#endif
	  break;
	case FFI_TYPE_POINTER:
	  gprvalue = *(unsigned long *) *p_argv;
	  goto putgpr;
	case FFI_TYPE_UINT8:
	  gprvalue = *(unsigned char *) *p_argv;
	  goto putgpr;
	case FFI_TYPE_SINT8:
	  gprvalue = *(signed char *) *p_argv;
	  goto putgpr;
	case FFI_TYPE_UINT16:
	  gprvalue = *(unsigned short *) *p_argv;
	  goto putgpr;
	case FFI_TYPE_SINT16:
	  gprvalue = *(signed short *) *p_argv;
	  goto putgpr;

	case FFI_TYPE_STRUCT:
	  size_al = (*ptr)->size;
#if defined(POWERPC_DARWIN64)
	  next_arg = (unsigned long *)FFI_ALIGN((char *)next_arg, (*ptr)->alignment);
	  darwin64_pass_struct_by_value (*ptr, (char *) *p_argv, 
					 (unsigned) size_al,
					 (unsigned int *) &fparg_count,
					 &fpr_base, &next_arg);
#else
	  dest_cpy = (char *) next_arg;

	  /* If the first member of the struct is a double, then include enough
	     padding in the struct size to align it to double-word.  */
	  if ((*ptr)->elements[0]->type == FFI_TYPE_DOUBLE)
	    size_al = FFI_ALIGN((*ptr)->size, 8);

#  if defined(POWERPC64) 
	  FFI_ASSERT (abi != FFI_DARWIN);
	  memcpy ((char *) dest_cpy, (char *) *p_argv, size_al);
	  next_arg += (size_al + 7) / 8;
#  else
	  /* Structures that match the basic modes (QI 1 byte, HI 2 bytes,
	     SI 4 bytes) are aligned as if they were those modes.
	     Structures with 3 byte in size are padded upwards.  */
	  if (size_al < 3 && abi == FFI_DARWIN)
	    dest_cpy += 4 - size_al;

	  memcpy((char *) dest_cpy, (char *) *p_argv, size_al);
	  next_arg += (size_al + 3) / 4;
#  endif
#endif
	  break;

	case FFI_TYPE_INT:
	case FFI_TYPE_SINT32:
	  gprvalue = *(signed int *) *p_argv;
	  goto putgpr;

	case FFI_TYPE_UINT32:
	  gprvalue = *(unsigned int *) *p_argv;
	putgpr:
	  *next_arg++ = gprvalue;
	  gp_count++;
	  break;
	default:
	  break;
	}
    }

  /* Check that we didn't overrun the stack...  */
  /* FFI_ASSERT(gpr_base <= stacktop - ASM_NEEDS_REGISTERS);
     FFI_ASSERT((unsigned *)fpr_base
     	     <= stacktop - ASM_NEEDS_REGISTERS - NUM_GPR_ARG_REGISTERS);
     FFI_ASSERT(flags & FLAG_4_GPR_ARGUMENTS || intarg_count <= 4);  */
}

#if defined(POWERPC_DARWIN64)

/* See if we can put some of the struct into fprs.
   This should not be called for structures of size 16 bytes, since these are not
   broken out this way.  */
static void
darwin64_scan_struct_for_floats (ffi_type *s, unsigned *nfpr)
{
  int i;

  FFI_ASSERT (s->type == FFI_TYPE_STRUCT)

  for (i = 0; s->elements[i] != NULL; i++)
    {
      ffi_type *p = s->elements[i];
      switch (p->type)
	{
	  case FFI_TYPE_STRUCT:
	    darwin64_scan_struct_for_floats (p, nfpr);
	    break;
	  case FFI_TYPE_LONGDOUBLE:
	    (*nfpr) += 2;
	    break;
	  case FFI_TYPE_DOUBLE:
	  case FFI_TYPE_FLOAT:
	    (*nfpr) += 1;
	    break;
	  default:
	    break;    
	}
    }
}

static int
darwin64_struct_size_exceeds_gprs_p (ffi_type *s, char *src, unsigned *nfpr)
{
  unsigned struct_offset=0, i;

  for (i = 0; s->elements[i] != NULL; i++)
    {
      char *item_base;
      ffi_type *p = s->elements[i];
      /* Find the start of this item (0 for the first one).  */
      if (i > 0)
        struct_offset = FFI_ALIGN(struct_offset, p->alignment);

      item_base = src + struct_offset;

      switch (p->type)
	{
	  case FFI_TYPE_STRUCT:
	    if (darwin64_struct_size_exceeds_gprs_p (p, item_base, nfpr))
	      return 1;
	    break;
	  case FFI_TYPE_LONGDOUBLE:
	    if (*nfpr >= NUM_FPR_ARG_REGISTERS)
	      return 1;
	    (*nfpr) += 1;
	    item_base += 8;
	  /* FALL THROUGH */
	  case FFI_TYPE_DOUBLE:
	    if (*nfpr >= NUM_FPR_ARG_REGISTERS)
	      return 1;
	    (*nfpr) += 1;
	    break;
	  case FFI_TYPE_FLOAT:
	    if (*nfpr >= NUM_FPR_ARG_REGISTERS)
	      return 1;
	    (*nfpr) += 1;
	    break;
	  default:
	    /* If we try and place any item, that is non-float, once we've
	       exceeded the 8 GPR mark, then we can't fit the struct.  */
	    if ((unsigned long)item_base >= 8*8) 
	      return 1;
	    break;    
	}
      /* now count the size of what we just used.  */
      struct_offset += p->size;
    }
  return 0;
}

/* Can this struct be returned by value?  */
int 
darwin64_struct_ret_by_value_p (ffi_type *s)
{
  unsigned nfp = 0;

  FFI_ASSERT (s && s->type == FFI_TYPE_STRUCT);
  
  /* The largest structure we can return is 8long + 13 doubles.  */
  if (s->size > 168)
    return 0;
  
  /* We can't pass more than 13 floats.  */
  darwin64_scan_struct_for_floats (s, &nfp);
  if (nfp > 13)
    return 0;
  
  /* If there are not too many floats, and the struct is
     small enough to accommodate in the GPRs, then it must be OK.  */
  if (s->size <= 64)
    return 1;
  
  /* Well, we have to look harder.  */
  nfp = 0;
  if (darwin64_struct_size_exceeds_gprs_p (s, NULL, &nfp))
    return 0;
  
  return 1;
}

void
darwin64_pass_struct_floats (ffi_type *s, char *src, 
			     unsigned *nfpr, double **fprs)
{
  int i;
  double *fpr_base = *fprs;
  unsigned struct_offset = 0;

  /* We don't assume anything about the alignment of the source.  */
  for (i = 0; s->elements[i] != NULL; i++)
    {
      char *item_base;
      ffi_type *p = s->elements[i];
      /* Find the start of this item (0 for the first one).  */
      if (i > 0)
        struct_offset = FFI_ALIGN(struct_offset, p->alignment);
      item_base = src + struct_offset;

      switch (p->type)
	{
	  case FFI_TYPE_STRUCT:
	    darwin64_pass_struct_floats (p, item_base, nfpr,
					   &fpr_base);
	    break;
	  case FFI_TYPE_LONGDOUBLE:
	    if (*nfpr < NUM_FPR_ARG_REGISTERS)
	      *fpr_base++ = *(double *)item_base;
	    (*nfpr) += 1;
	    item_base += 8;
	  /* FALL THROUGH */
	  case FFI_TYPE_DOUBLE:
	    if (*nfpr < NUM_FPR_ARG_REGISTERS)
	      *fpr_base++ = *(double *)item_base;
	    (*nfpr) += 1;
	    break;
	  case FFI_TYPE_FLOAT:
	    if (*nfpr < NUM_FPR_ARG_REGISTERS)
	      *fpr_base++ = (double) *(float *)item_base;
	    (*nfpr) += 1;
	    break;
	  default:
	    break;    
	}
      /* now count the size of what we just used.  */
      struct_offset += p->size;
    }
  /* Update the scores.  */
  *fprs = fpr_base;
}

/* Darwin64 special rules.
   Break out a struct into params and float registers.  */
static void
darwin64_pass_struct_by_value (ffi_type *s, char *src, unsigned size,
			       unsigned *nfpr, double **fprs, unsigned long **arg)
{
  unsigned long *next_arg = *arg;
  char *dest_cpy = (char *)next_arg;

  FFI_ASSERT (s->type == FFI_TYPE_STRUCT)

  if (!size)
    return;

  /* First... special cases.  */
  if (size < 3
      || (size == 4 
	  && s->elements[0] 
	  && s->elements[0]->type != FFI_TYPE_FLOAT))
    {
      /* Must be at least one GPR, padding is unspecified in value, 
	 let's make it zero.  */
      *next_arg = 0UL; 
      dest_cpy += 8 - size;
      memcpy ((char *) dest_cpy, src, size);
      next_arg++;
    }
  else if (size == 16)
    {
      memcpy ((char *) dest_cpy, src, size);
      next_arg += 2;
    }
  else
    {
      /* now the general case, we consider embedded floats.  */
      memcpy ((char *) dest_cpy, src, size);
      darwin64_pass_struct_floats (s, src, nfpr, fprs);
      next_arg += (size+7)/8;
    }
    
  *arg = next_arg;
}

double *
darwin64_struct_floats_to_mem (ffi_type *s, char *dest, double *fprs, unsigned *nf)
{
  int i;
  unsigned struct_offset = 0;

  /* We don't assume anything about the alignment of the source.  */
  for (i = 0; s->elements[i] != NULL; i++)
    {
      char *item_base;
      ffi_type *p = s->elements[i];
      /* Find the start of this item (0 for the first one).  */
      if (i > 0)
        struct_offset = FFI_ALIGN(struct_offset, p->alignment);
      item_base = dest + struct_offset;

      switch (p->type)
	{
	  case FFI_TYPE_STRUCT:
	    fprs = darwin64_struct_floats_to_mem (p, item_base, fprs, nf);
	    break;
	  case FFI_TYPE_LONGDOUBLE:
	    if (*nf < NUM_FPR_ARG_REGISTERS)
	      {
		*(double *)item_base = *fprs++ ;
		(*nf) += 1;
	      }
	    item_base += 8;
	  /* FALL THROUGH */
	  case FFI_TYPE_DOUBLE:
	    if (*nf < NUM_FPR_ARG_REGISTERS)
	      {
		*(double *)item_base = *fprs++ ;
		(*nf) += 1;
	      }
	    break;
	  case FFI_TYPE_FLOAT:
	    if (*nf < NUM_FPR_ARG_REGISTERS)
	      {
		*(float *)item_base = (float) *fprs++ ;
		(*nf) += 1;
	      }
	    break;
	  default:
	    break;    
	}
      /* now count the size of what we just used.  */
      struct_offset += p->size;
    }
  return fprs;
}

#endif

/* Adjust the size of S to be correct for Darwin.
   On Darwin m32, the first field of a structure has natural alignment.  
   On Darwin m64, all fields have natural alignment.  */

static void
darwin_adjust_aggregate_sizes (ffi_type *s)
{
  int i;

  if (s->type != FFI_TYPE_STRUCT)
    return;

  s->size = 0;
  for (i = 0; s->elements[i] != NULL; i++)
    {
      ffi_type *p;
      int align;
      
      p = s->elements[i];
      if (p->type == FFI_TYPE_STRUCT)
	darwin_adjust_aggregate_sizes (p);
#if defined(POWERPC_DARWIN64)
      /* Natural alignment for all items.  */
      align = p->alignment;
#else
      /* Natural alignment for the first item... */
      if (i == 0)
	align = p->alignment;
      else if (p->alignment == 16 || p->alignment < 4)
	/* .. subsequent items with vector or align < 4 have natural align.  */
	align = p->alignment;
      else
	/* .. or align is 4.  */
	align = 4;
#endif
      /* Pad, if necessary, before adding the current item.  */
      s->size = FFI_ALIGN(s->size, align) + p->size;
    }
  
  s->size = FFI_ALIGN(s->size, s->alignment);
  
  /* This should not be necessary on m64, but harmless.  */
  if (s->elements[0]->type == FFI_TYPE_UINT64
      || s->elements[0]->type == FFI_TYPE_SINT64
      || s->elements[0]->type == FFI_TYPE_DOUBLE
      || s->elements[0]->alignment == 8)
    s->alignment = s->alignment > 8 ? s->alignment : 8;
  /* Do not add additional tail padding.  */
}

/* Adjust the size of S to be correct for AIX.
   Word-align double unless it is the first member of a structure.  */

static void
aix_adjust_aggregate_sizes (ffi_type *s)
{
  int i;

  if (s->type != FFI_TYPE_STRUCT)
    return;

  s->size = 0;
  for (i = 0; s->elements[i] != NULL; i++)
    {
      ffi_type *p;
      int align;
      
      p = s->elements[i];
      aix_adjust_aggregate_sizes (p);
      align = p->alignment;
      if (i != 0 && p->type == FFI_TYPE_DOUBLE)
	align = 4;
      s->size = FFI_ALIGN(s->size, align) + p->size;
    }
  
  s->size = FFI_ALIGN(s->size, s->alignment);
  
  if (s->elements[0]->type == FFI_TYPE_UINT64
      || s->elements[0]->type == FFI_TYPE_SINT64
      || s->elements[0]->type == FFI_TYPE_DOUBLE
      || s->elements[0]->alignment == 8)
    s->alignment = s->alignment > 8 ? s->alignment : 8;
  /* Do not add additional tail padding.  */
}

/* Perform machine dependent cif processing.  */
ffi_status
ffi_prep_cif_machdep (ffi_cif *cif)
{
  /* All this is for the DARWIN ABI.  */
  unsigned i;
  ffi_type **ptr;
  unsigned bytes;
  unsigned fparg_count = 0, intarg_count = 0;
  unsigned flags = 0;
  unsigned size_al = 0;

  /* All the machine-independent calculation of cif->bytes will be wrong.
     All the calculation of structure sizes will also be wrong.
     Redo the calculation for DARWIN.  */

  if (cif->abi == FFI_DARWIN)
    {
      darwin_adjust_aggregate_sizes (cif->rtype);
      for (i = 0; i < cif->nargs; i++)
	darwin_adjust_aggregate_sizes (cif->arg_types[i]);
    }

  if (cif->abi == FFI_AIX)
    {
      aix_adjust_aggregate_sizes (cif->rtype);
      for (i = 0; i < cif->nargs; i++)
	aix_adjust_aggregate_sizes (cif->arg_types[i]);
    }

  /* Space for the frame pointer, callee's LR, CR, etc, and for
     the asm's temp regs.  */

  bytes = (LINKAGE_AREA_GPRS + ASM_NEEDS_REGISTERS) * sizeof(unsigned long);

  /* Return value handling.  
    The rules m32 are as follows:
     - 32-bit (or less) integer values are returned in gpr3;
     - structures of size <= 4 bytes also returned in gpr3;
     - 64-bit integer values [??? and structures between 5 and 8 bytes] are
       returned in gpr3 and gpr4;
     - Single/double FP values are returned in fpr1;
     - Long double FP (if not equivalent to double) values are returned in
       fpr1 and fpr2;
     m64:
     - 64-bit or smaller integral values are returned in GPR3
     - Single/double FP values are returned in fpr1;
     - Long double FP values are returned in fpr1 and fpr2;
     m64 Structures:
     - If the structure could be accommodated in registers were it to be the
       first argument to a routine, then it is returned in those registers.
     m32/m64 structures otherwise:
     - Larger structures values are allocated space and a pointer is passed
       as the first argument.  */
  switch (cif->rtype->type)
    {

#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
    case FFI_TYPE_LONGDOUBLE:
      flags |= FLAG_RETURNS_128BITS;
      flags |= FLAG_RETURNS_FP;
      break;
#endif

    case FFI_TYPE_DOUBLE:
      flags |= FLAG_RETURNS_64BITS;
      /* Fall through.  */
    case FFI_TYPE_FLOAT:
      flags |= FLAG_RETURNS_FP;
      break;

    case FFI_TYPE_UINT64:
    case FFI_TYPE_SINT64:
#ifdef POWERPC64
    case FFI_TYPE_POINTER:
#endif
      flags |= FLAG_RETURNS_64BITS;
      break;

    case FFI_TYPE_STRUCT:
#if defined(POWERPC_DARWIN64)
      {
	/* Can we fit the struct into regs?  */
	if (darwin64_struct_ret_by_value_p (cif->rtype))
	  {
	    unsigned nfpr = 0;
	    flags |= FLAG_RETURNS_STRUCT;
	    if (cif->rtype->size != 16)
	      darwin64_scan_struct_for_floats (cif->rtype, &nfpr) ;
	    else
	      flags |= FLAG_RETURNS_128BITS;
	    /* Will be 0 for 16byte struct.  */
	    if (nfpr)
	      flags |= FLAG_RETURNS_FP;
	  }
	else /* By ref. */
	  {
	    flags |= FLAG_RETVAL_REFERENCE;
	    flags |= FLAG_RETURNS_NOTHING;
	    intarg_count++;
	  }
      }
#elif defined(DARWIN_PPC)
      if (cif->rtype->size <= 4)
	flags |= FLAG_RETURNS_STRUCT;
      else /* else by reference.  */
	{
	  flags |= FLAG_RETVAL_REFERENCE;
	  flags |= FLAG_RETURNS_NOTHING;
	  intarg_count++;
	}
#else /* assume we pass by ref.  */
      flags |= FLAG_RETVAL_REFERENCE;
      flags |= FLAG_RETURNS_NOTHING;
      intarg_count++;
#endif
      break;
    case FFI_TYPE_VOID:
      flags |= FLAG_RETURNS_NOTHING;
      break;

    default:
      /* Returns 32-bit integer, or similar.  Nothing to do here.  */
      break;
    }

  /* The first NUM_GPR_ARG_REGISTERS words of integer arguments, and the
     first NUM_FPR_ARG_REGISTERS fp arguments, go in registers; the rest
     goes on the stack.  
     ??? Structures are passed as a pointer to a copy of the structure. 
     Stuff on the stack needs to keep proper alignment.  
     For m64 the count is effectively of half-GPRs.  */
  for (ptr = cif->arg_types, i = cif->nargs; i > 0; i--, ptr++)
    {
      unsigned align_words;
      switch ((*ptr)->type)
	{
	case FFI_TYPE_FLOAT:
	case FFI_TYPE_DOUBLE:
	  fparg_count++;
#if !defined(POWERPC_DARWIN64)
	  /* If this FP arg is going on the stack, it must be
	     8-byte-aligned.  */
	  if (fparg_count > NUM_FPR_ARG_REGISTERS
	      && (intarg_count & 0x01) != 0)
	    intarg_count++;
#endif
	  break;

#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
	case FFI_TYPE_LONGDOUBLE:
	  fparg_count += 2;
	  /* If this FP arg is going on the stack, it must be
	     16-byte-aligned.  */
	  if (fparg_count >= NUM_FPR_ARG_REGISTERS)
#if defined (POWERPC64)
	    intarg_count = FFI_ALIGN(intarg_count, 2);
#else
	    intarg_count = FFI_ALIGN(intarg_count, 4);
#endif
	  break;
#endif

	case FFI_TYPE_UINT64:
	case FFI_TYPE_SINT64:
#if defined(POWERPC64)
	  intarg_count++;
#else
	  /* 'long long' arguments are passed as two words, but
	     either both words must fit in registers or both go
	     on the stack.  If they go on the stack, they must
	     be 8-byte-aligned.  */
	  if (intarg_count == NUM_GPR_ARG_REGISTERS-1
	      || (intarg_count >= NUM_GPR_ARG_REGISTERS 
	          && (intarg_count & 0x01) != 0))
	    intarg_count++;
	  intarg_count += 2;
#endif
	  break;

	case FFI_TYPE_STRUCT:
	  size_al = (*ptr)->size;
#if defined(POWERPC_DARWIN64)
	  align_words = (*ptr)->alignment >> 3;
	  if (align_words)
	    intarg_count = FFI_ALIGN(intarg_count, align_words);
	  /* Base size of the struct.  */
	  intarg_count += (size_al + 7) / 8;
	  /* If 16 bytes then don't worry about floats.  */
	  if (size_al != 16)
	    /* Scan through for floats to be placed in regs.  */
	    darwin64_scan_struct_for_floats (*ptr, &fparg_count) ;
#else
	  align_words = (*ptr)->alignment >> 2;
	  if (align_words)
	    intarg_count = FFI_ALIGN(intarg_count, align_words);
	  /* If the first member of the struct is a double, then align
	     the struct to double-word. 
	  if ((*ptr)->elements[0]->type == FFI_TYPE_DOUBLE)
	    size_al = FFI_ALIGN((*ptr)->size, 8); */
#  ifdef POWERPC64
	  intarg_count += (size_al + 7) / 8;
#  else
	  intarg_count += (size_al + 3) / 4;
#  endif
#endif
	  break;

	default:
	  /* Everything else is passed as a 4-byte word in a GPR, either
	     the object itself or a pointer to it.  */
	  intarg_count++;
	  break;
	}
    }

  if (fparg_count != 0)
    flags |= FLAG_FP_ARGUMENTS;

#if defined(POWERPC_DARWIN64)
  /* Space to image the FPR registers, if needed - which includes when they might be
     used in a struct return.  */
  if (fparg_count != 0 
      || ((flags & FLAG_RETURNS_STRUCT)
	   && (flags & FLAG_RETURNS_FP)))
    bytes += NUM_FPR_ARG_REGISTERS * sizeof(double);
#else
  /* Space for the FPR registers, if needed.  */
  if (fparg_count != 0)
    bytes += NUM_FPR_ARG_REGISTERS * sizeof(double);
#endif

  /* Stack space.  */
#ifdef POWERPC64
  if ((intarg_count + fparg_count) > NUM_GPR_ARG_REGISTERS)
    bytes += (intarg_count + fparg_count) * sizeof(long);
#else
  if ((intarg_count + 2 * fparg_count) > NUM_GPR_ARG_REGISTERS)
    bytes += (intarg_count + 2 * fparg_count) * sizeof(long);
#endif
  else
    bytes += NUM_GPR_ARG_REGISTERS * sizeof(long);

  /* The stack space allocated needs to be a multiple of 16 bytes.  */
  bytes = FFI_ALIGN(bytes, 16) ;

  cif->flags = flags;
  cif->bytes = bytes;

  return FFI_OK;
}

extern void ffi_call_AIX(extended_cif *, long, unsigned, unsigned *,
			 void (*fn)(void), void (*fn2)(void));

#if defined (FFI_GO_CLOSURES)
extern void ffi_call_go_AIX(extended_cif *, long, unsigned, unsigned *,
			    void (*fn)(void), void (*fn2)(void), void *closure);
#endif

extern void ffi_call_DARWIN(extended_cif *, long, unsigned, unsigned *,
			    void (*fn)(void), void (*fn2)(void), ffi_type*);

void
ffi_call (ffi_cif *cif, void (*fn)(void), void *rvalue, void **avalue)
{
  extended_cif ecif;

  ecif.cif = cif;
  ecif.avalue = avalue;

  /* If the return value is a struct and we don't have a return
     value address then we need to make one.  */

  if ((rvalue == NULL) &&
      (cif->rtype->type == FFI_TYPE_STRUCT))
    {
      ecif.rvalue = alloca (cif->rtype->size);
    }
  else
    ecif.rvalue = rvalue;

  switch (cif->abi)
    {
    case FFI_AIX:
      ffi_call_AIX(&ecif, -(long)cif->bytes, cif->flags, ecif.rvalue, fn,
		   FFI_FN(ffi_prep_args));
      break;
    case FFI_DARWIN:
      ffi_call_DARWIN(&ecif, -(long)cif->bytes, cif->flags, ecif.rvalue, fn,
		      FFI_FN(ffi_prep_args), cif->rtype);
      break;
    default:
      FFI_ASSERT(0);
      break;
    }
}

#if defined (FFI_GO_CLOSURES)
void
ffi_call_go (ffi_cif *cif, void (*fn) (void), void *rvalue, void **avalue,
	     void *closure)
{
  extended_cif ecif;

  ecif.cif = cif;
  ecif.avalue = avalue;

  /* If the return value is a struct and we don't have a return
     value address then we need to make one.  */

  if ((rvalue == NULL) &&
      (cif->rtype->type == FFI_TYPE_STRUCT))
    {
      ecif.rvalue = alloca (cif->rtype->size);
    }
  else
    ecif.rvalue = rvalue;

  switch (cif->abi)
    {
    case FFI_AIX:
      ffi_call_go_AIX(&ecif, -(long)cif->bytes, cif->flags, ecif.rvalue, fn,
		      FFI_FN(ffi_prep_args), closure);
      break;
    default:
      FFI_ASSERT(0);
      break;
    }
}
#endif

static void flush_icache(char *);
static void flush_range(char *, int);

/* The layout of a function descriptor.  A C function pointer really
   points to one of these.  */

typedef struct aix_fd_struct {
  void *code_pointer;
  void *toc;
} aix_fd;

/* here I'd like to add the stack frame layout we use in darwin_closure.S
   and aix_closure.S

   m32/m64

   The stack layout looks like this:

   |   Additional params...			| |     Higher address
   ~						~ ~
   |   Parameters      (at least 8*4/8=32/64)	| | NUM_GPR_ARG_REGISTERS
   |--------------------------------------------| |
   |   TOC=R2 (AIX) Reserved (Darwin)   4/8	| |
   |--------------------------------------------| |
   |   Reserved                       2*4/8	| |
   |--------------------------------------------| |
   |   Space for callee's LR		4/8	| |
   |--------------------------------------------| |
   |   Saved CR [low word for m64]      4/8	| |
   |--------------------------------------------| |
   |   Current backchain pointer	4/8	|-/ Parent's frame.
   |--------------------------------------------| <+ <<< on entry to ffi_closure_ASM
   |   Result Bytes			16	| |
   |--------------------------------------------| |
   ~   padding to 16-byte alignment		~ ~
   |--------------------------------------------| |
   |   NUM_FPR_ARG_REGISTERS slots		| |
   |   here fp13 .. fp1		       13*8	| |
   |--------------------------------------------| |
   |   R3..R10			  8*4/8=32/64	| | NUM_GPR_ARG_REGISTERS
   |--------------------------------------------| |
   |   TOC=R2 (AIX) Reserved (Darwin)   4/8	| |
   |--------------------------------------------| |	stack	|
   |   Reserved [compiler,binder]     2*4/8	| |	grows	|
   |--------------------------------------------| |	down	V
   |   Space for callee's LR		4/8	| |
   |--------------------------------------------| |	lower addresses
   |   Saved CR [low word for m64]      4/8	| |
   |--------------------------------------------| |     stack pointer here
   |   Current backchain pointer	4/8	|-/	during
   |--------------------------------------------|   <<<	ffi_closure_ASM.

*/

ffi_status
ffi_prep_closure_loc (ffi_closure* closure,
		      ffi_cif* cif,
		      void (*fun)(ffi_cif*, void*, void**, void*),
		      void *user_data,
		      void *codeloc)
{
  unsigned int *tramp;
  struct ffi_aix_trampoline_struct *tramp_aix;
  aix_fd *fd;

  switch (cif->abi)
    {
      case FFI_DARWIN:

	FFI_ASSERT (cif->abi == FFI_DARWIN);

	tramp = (unsigned int *) &closure->tramp[0];
#if defined(POWERPC_DARWIN64)
	tramp[0] = 0x7c0802a6;  /*   mflr    r0  */
	tramp[1] = 0x429f0015;  /*   bcl-    20,4*cr7+so,  +0x18 (L1)  */
	/* We put the addresses here.  */
	tramp[6] = 0x7d6802a6;  /*L1:   mflr    r11  */
	tramp[7] = 0xe98b0000;  /*   ld     r12,0(r11) function address  */
	tramp[8] = 0x7c0803a6;  /*   mtlr    r0   */
	tramp[9] = 0x7d8903a6;  /*   mtctr   r12  */
	tramp[10] = 0xe96b0008;  /*   lwz     r11,8(r11) static chain  */
	tramp[11] = 0x4e800420;  /*   bctr  */

	*((unsigned long *)&tramp[2]) = (unsigned long) ffi_closure_ASM; /* function  */
	*((unsigned long *)&tramp[4]) = (unsigned long) codeloc; /* context  */
#else
	tramp[0] = 0x7c0802a6;  /*   mflr    r0  */
	tramp[1] = 0x429f000d;  /*   bcl-    20,4*cr7+so,0x10  */
	tramp[4] = 0x7d6802a6;  /*   mflr    r11  */
	tramp[5] = 0x818b0000;  /*   lwz     r12,0(r11) function address  */
	tramp[6] = 0x7c0803a6;  /*   mtlr    r0   */
	tramp[7] = 0x7d8903a6;  /*   mtctr   r12  */
	tramp[8] = 0x816b0004;  /*   lwz     r11,4(r11) static chain  */
	tramp[9] = 0x4e800420;  /*   bctr  */
	tramp[2] = (unsigned long) ffi_closure_ASM; /* function  */
	tramp[3] = (unsigned long) codeloc; /* context  */
#endif
	closure->cif = cif;
	closure->fun = fun;
	closure->user_data = user_data;

	/* Flush the icache. Only necessary on Darwin.  */
	flush_range(codeloc, FFI_TRAMPOLINE_SIZE);

	break;

    case FFI_AIX:

      tramp_aix = (struct ffi_aix_trampoline_struct *) (closure->tramp);
      fd = (aix_fd *)(void *)ffi_closure_ASM;

      FFI_ASSERT (cif->abi == FFI_AIX);

      tramp_aix->code_pointer = fd->code_pointer;
      tramp_aix->toc = fd->toc;
      tramp_aix->static_chain = codeloc;
      closure->cif = cif;
      closure->fun = fun;
      closure->user_data = user_data;
      break;

    default:
      return FFI_BAD_ABI;
      break;
    }
  return FFI_OK;
}

#if defined (FFI_GO_CLOSURES)
ffi_status
ffi_prep_go_closure (ffi_go_closure* closure,
		     ffi_cif* cif,
		     void (*fun)(ffi_cif*, void*, void**, void*))
{
  switch (cif->abi)
    {
      case FFI_AIX:

        FFI_ASSERT (cif->abi == FFI_AIX);

        closure->tramp = (void *)ffi_go_closure_ASM;
        closure->cif = cif;
        closure->fun = fun;
        return FFI_OK;
      
      // For now, ffi_prep_go_closure is only implemented for AIX, not for Darwin
      default:
        return FFI_BAD_ABI;
        break;
    }
  return FFI_OK;
}
#endif

static void
flush_icache(char *addr)
{
#ifndef _AIX
  __asm__ volatile (
		"dcbf 0,%0\n"
		"\tsync\n"
		"\ticbi 0,%0\n"
		"\tsync\n"
		"\tisync"
		: : "r"(addr) : "memory");
#endif
}

static void
flush_range(char * addr1, int size)
{
#define MIN_LINE_SIZE 32
  int i;
  for (i = 0; i < size; i += MIN_LINE_SIZE)
    flush_icache(addr1+i);
  flush_icache(addr1+size-1);
}

typedef union
{
  float f;
  double d;
} ffi_dblfl;

ffi_type *
ffi_closure_helper_DARWIN (ffi_closure *, void *,
			   unsigned long *, ffi_dblfl *);

#if defined (FFI_GO_CLOSURES)
ffi_type *
ffi_go_closure_helper_DARWIN (ffi_go_closure*, void *,
			      unsigned long *, ffi_dblfl *);
#endif

/* Basically the trampoline invokes ffi_closure_ASM, and on
   entry, r11 holds the address of the closure.
   After storing the registers that could possibly contain
   parameters to be passed into the stack frame and setting
   up space for a return value, ffi_closure_ASM invokes the
   following helper function to do most of the work.  */

static ffi_type *
ffi_closure_helper_common (ffi_cif* cif,
			   void (*fun)(ffi_cif*, void*, void**, void*),
			   void *user_data, void *rvalue,
			   unsigned long *pgr, ffi_dblfl *pfr)
{
  /* rvalue is the pointer to space for return value in closure assembly
     pgr is the pointer to where r3-r10 are stored in ffi_closure_ASM
     pfr is the pointer to where f1-f13 are stored in ffi_closure_ASM.  */

  typedef double ldbits[2];

  union ldu
  {
    ldbits lb;
    long double ld;
  };

  void **          avalue;
  ffi_type **      arg_types;
  long             i, avn;
  ffi_dblfl *      end_pfr = pfr + NUM_FPR_ARG_REGISTERS;
  unsigned         size_al;
#if defined(POWERPC_DARWIN64)
  unsigned 	   fpsused = 0;
#endif

  avalue = alloca (cif->nargs * sizeof(void *));

  if (cif->rtype->type == FFI_TYPE_STRUCT)
    {
#if defined(POWERPC_DARWIN64)
      if (!darwin64_struct_ret_by_value_p (cif->rtype))
	{
    	  /* Won't fit into the regs - return by ref.  */
	  rvalue = (void *) *pgr;
	  pgr++;
	}
#elif defined(DARWIN_PPC)
      if (cif->rtype->size > 4)
	{
	  rvalue = (void *) *pgr;
	  pgr++;
	}
#else /* assume we return by ref.  */
      rvalue = (void *) *pgr;
      pgr++;
#endif
    }

  i = 0;
  avn = cif->nargs;
  arg_types = cif->arg_types;

  /* Grab the addresses of the arguments from the stack frame.  */
  while (i < avn)
    {
      switch (arg_types[i]->type)
	{
	case FFI_TYPE_SINT8:
	case FFI_TYPE_UINT8:
#if  defined(POWERPC64)
	  avalue[i] = (char *) pgr + 7;
#else
	  avalue[i] = (char *) pgr + 3;
#endif
	  pgr++;
	  break;

	case FFI_TYPE_SINT16:
	case FFI_TYPE_UINT16:
#if  defined(POWERPC64)
	  avalue[i] = (char *) pgr + 6;
#else
	  avalue[i] = (char *) pgr + 2;
#endif
	  pgr++;
	  break;

	case FFI_TYPE_SINT32:
	case FFI_TYPE_UINT32:
#if  defined(POWERPC64)
	  avalue[i] = (char *) pgr + 4;
#else
	case FFI_TYPE_POINTER:
	  avalue[i] = pgr;
#endif
	  pgr++;
	  break;

	case FFI_TYPE_STRUCT:
	  size_al = arg_types[i]->size;
#if defined(POWERPC_DARWIN64)
	  pgr = (unsigned long *)FFI_ALIGN((char *)pgr, arg_types[i]->alignment);
	  if (size_al < 3 || size_al == 4)
	    {
	      avalue[i] = ((char *)pgr)+8-size_al;
	      if (arg_types[i]->elements[0]->type == FFI_TYPE_FLOAT
		  && fpsused < NUM_FPR_ARG_REGISTERS)
		{
		  *(float *)pgr = (float) *(double *)pfr;
		  pfr++;
		  fpsused++;
		}
	    }
	  else 
	    {
	      if (size_al != 16)
		pfr = (ffi_dblfl *) 
		    darwin64_struct_floats_to_mem (arg_types[i], (char *)pgr,
						   (double *)pfr, &fpsused);
	      avalue[i] = pgr;
	    }
	  pgr += (size_al + 7) / 8;
#else
	  /* If the first member of the struct is a double, then align
	     the struct to double-word.  */
	  if (arg_types[i]->elements[0]->type == FFI_TYPE_DOUBLE)
	    size_al = FFI_ALIGN(arg_types[i]->size, 8);
#  if defined(POWERPC64)
	  FFI_ASSERT (cif->abi != FFI_DARWIN);
	  avalue[i] = pgr;
	  pgr += (size_al + 7) / 8;
#  else
	  /* Structures that match the basic modes (QI 1 byte, HI 2 bytes,
	     SI 4 bytes) are aligned as if they were those modes.  */
	  if (size_al < 3 && cif->abi == FFI_DARWIN)
	    avalue[i] = (char*) pgr + 4 - size_al;
	  else
	    avalue[i] = pgr;
	  pgr += (size_al + 3) / 4;
#  endif
#endif
	  break;

	case FFI_TYPE_SINT64:
	case FFI_TYPE_UINT64:
#if  defined(POWERPC64)
	case FFI_TYPE_POINTER:
	  avalue[i] = pgr;
	  pgr++;
	  break;
#else
	  /* Long long ints are passed in two gpr's.  */
	  avalue[i] = pgr;
	  pgr += 2;
	  break;
#endif

	case FFI_TYPE_FLOAT:
	  /* A float value consumes a GPR.
	     There are 13 64bit floating point registers.  */
	  if (pfr < end_pfr)
	    {
	      double temp = pfr->d;
	      pfr->f = (float) temp;
	      avalue[i] = pfr;
	      pfr++;
	    }
	  else
	    {
	      avalue[i] = pgr;
	    }
	  pgr++;
	  break;

	case FFI_TYPE_DOUBLE:
	  /* A double value consumes two GPRs.
	     There are 13 64bit floating point registers.  */
	  if (pfr < end_pfr)
	    {
	      avalue[i] = pfr;
	      pfr++;
	    }
	  else
	    {
	      avalue[i] = pgr;
	    }
#ifdef POWERPC64
	  pgr++;
#else
	  pgr += 2;
#endif
	  break;

#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE

	case FFI_TYPE_LONGDOUBLE:
#ifdef POWERPC64
	  if (pfr + 1 < end_pfr)
	    {
	      avalue[i] = pfr;
	      pfr += 2;
	    }
	  else
	    {
	      if (pfr < end_pfr)
		{
		  *pgr = *(unsigned long *) pfr;
		  pfr++;
		}
	      avalue[i] = pgr;
	    }
	  pgr += 2;
#else  /* POWERPC64 */
	  /* A long double value consumes four GPRs and two FPRs.
	     There are 13 64bit floating point registers.  */
	  if (pfr + 1 < end_pfr)
	    {
	      avalue[i] = pfr;
	      pfr += 2;
	    }
	  /* Here we have the situation where one part of the long double
	     is stored in fpr13 and the other part is already on the stack.
	     We use a union to pass the long double to avalue[i].  */
	  else if (pfr + 1 == end_pfr)
	    {
	      union ldu temp_ld;
	      memcpy (&temp_ld.lb[0], pfr, sizeof(ldbits));
	      memcpy (&temp_ld.lb[1], pgr + 2, sizeof(ldbits));
	      avalue[i] = &temp_ld.ld;
	      pfr++;
	    }
	  else
	    {
	      avalue[i] = pgr;
	    }
	  pgr += 4;
#endif  /* POWERPC64 */
	  break;
#endif
	default:
	  FFI_ASSERT(0);
	}
      i++;
    }

  (fun) (cif, rvalue, avalue, user_data);

  /* Tell ffi_closure_ASM to perform return type promotions.  */
  return cif->rtype;
}

ffi_type *
ffi_closure_helper_DARWIN (ffi_closure *closure, void *rvalue,
			   unsigned long *pgr, ffi_dblfl *pfr)
{
  return ffi_closure_helper_common (closure->cif, closure->fun,
				    closure->user_data, rvalue, pgr, pfr);
}

#if defined (FFI_GO_CLOSURES)
ffi_type *
ffi_go_closure_helper_DARWIN (ffi_go_closure *closure, void *rvalue,
			      unsigned long *pgr, ffi_dblfl *pfr)
{
  return ffi_closure_helper_common (closure->cif, closure->fun,
				    closure, rvalue, pgr, pfr);
}
#endif
