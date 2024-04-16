/* -----------------------------------------------------------------------
   ffi.c - Copyright (c) 2011, 2013 Anthony Green
           Copyright (c) 1996, 2003-2004, 2007-2008 Red Hat, Inc.

   SPARC Foreign Function Interface

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
#include "internal.h"

/* Force FFI_TYPE_LONGDOUBLE to be different than FFI_TYPE_DOUBLE;
   all further uses in this file will refer to the 128-bit type.  */
#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
# if FFI_TYPE_LONGDOUBLE != 4
#  error FFI_TYPE_LONGDOUBLE out of date
# endif
#else
# undef FFI_TYPE_LONGDOUBLE
# define FFI_TYPE_LONGDOUBLE 4
#endif

#ifdef SPARC64

/* Flatten the contents of a structure to the parts that are passed in
   floating point registers.  The return is a bit mask wherein bit N
   set means bytes [4*n, 4*n+3] are passed in %fN.

   We encode both the (running) size (maximum 32) and mask (maxumum 255)
   into one integer.  The size is placed in the low byte, so that align
   and addition work correctly.  The mask is placed in the second byte.  */

static int
ffi_struct_float_mask (ffi_type *outer_type, int size_mask)
{
  ffi_type **elts;
  ffi_type *t;

  if (outer_type->type == FFI_TYPE_COMPLEX)
    {
      int m = 0, tt = outer_type->elements[0]->type;
      size_t z = outer_type->size;

      if (tt == FFI_TYPE_FLOAT
	  || tt == FFI_TYPE_DOUBLE
	  || tt == FFI_TYPE_LONGDOUBLE)
        m = (1 << (z / 4)) - 1;
      return (m << 8) | z;
    }
  FFI_ASSERT (outer_type->type == FFI_TYPE_STRUCT);

  for (elts = outer_type->elements; (t = *elts) != NULL; elts++)
    {
      size_t z = t->size;
      int o, m, tt;

      size_mask = FFI_ALIGN(size_mask, t->alignment);
      switch (t->type)
	{
	case FFI_TYPE_STRUCT:
	  size_mask = ffi_struct_float_mask (t, size_mask);
	  continue;
	case FFI_TYPE_COMPLEX:
	  tt = t->elements[0]->type;
	  if (tt != FFI_TYPE_FLOAT
	      && tt != FFI_TYPE_DOUBLE
	      && tt != FFI_TYPE_LONGDOUBLE)
	    break;
	  /* FALLTHRU */
	case FFI_TYPE_FLOAT:
	case FFI_TYPE_DOUBLE:
	case FFI_TYPE_LONGDOUBLE:
	  m = (1 << (z / 4)) - 1;	/* compute mask for type */
	  o = (size_mask >> 2) & 0x3f;	/* extract word offset */
	  size_mask |= m << (o + 8);	/* insert mask into place */
	  break;
	}
      size_mask += z;
    }

  size_mask = FFI_ALIGN(size_mask, outer_type->alignment);
  FFI_ASSERT ((size_mask & 0xff) == outer_type->size);

  return size_mask;
}

/* Merge floating point data into integer data.  If the structure is
   entirely floating point, simply return a pointer to the fp data.  */

static void *
ffi_struct_float_merge (int size_mask, void *vi, void *vf)
{
  int size = size_mask & 0xff;
  int mask = size_mask >> 8;
  int n = size >> 2;

  if (mask == 0)
    return vi;
  else if (mask == (1 << n) - 1)
    return vf;
  else
    {
      unsigned int *wi = vi, *wf = vf;
      int i;

      for (i = 0; i < n; ++i)
	if ((mask >> i) & 1)
	  wi[i] = wf[i];

      return vi;
    }
}

/* Similar, but place the data into VD in the end.  */

void FFI_HIDDEN
ffi_struct_float_copy (int size_mask, void *vd, void *vi, void *vf)
{
  int size = size_mask & 0xff;
  int mask = size_mask >> 8;
  int n = size >> 2;

  if (mask == 0)
    ;
  else if (mask == (1 << n) - 1)
    vi = vf;
  else
    {
      unsigned int *wd = vd, *wi = vi, *wf = vf;
      int i;

      for (i = 0; i < n; ++i)
	wd[i] = ((mask >> i) & 1 ? wf : wi)[i];
      return;
    }
  memcpy (vd, vi, size);
}

/* Perform machine dependent cif processing */

static ffi_status
ffi_prep_cif_machdep_core(ffi_cif *cif)
{
  ffi_type *rtype = cif->rtype;
  int rtt = rtype->type;
  size_t bytes = 0;
  int i, n, flags;

  /* Set the return type flag */
  switch (rtt)
    {
    case FFI_TYPE_VOID:
      flags = SPARC_RET_VOID;
      break;
    case FFI_TYPE_FLOAT:
      flags = SPARC_RET_F_1;
      break;
    case FFI_TYPE_DOUBLE:
      flags = SPARC_RET_F_2;
      break;
    case FFI_TYPE_LONGDOUBLE:
      flags = SPARC_RET_F_4;
      break;

    case FFI_TYPE_COMPLEX:
    case FFI_TYPE_STRUCT:
      if (rtype->size > 32)
	{
	  flags = SPARC_RET_VOID | SPARC_FLAG_RET_IN_MEM;
	  bytes = 8;
	}
      else
	{
	  int size_mask = ffi_struct_float_mask (rtype, 0);
	  int word_size = (size_mask >> 2) & 0x3f;
	  int all_mask = (1 << word_size) - 1;
	  int fp_mask = size_mask >> 8;

	  flags = (size_mask << SPARC_SIZEMASK_SHIFT) | SPARC_RET_STRUCT;

	  /* For special cases of all-int or all-fp, we can return
	     the value directly without popping through a struct copy.  */
	  if (fp_mask == 0)
	    {
	      if (rtype->alignment >= 8)
		{
		  if (rtype->size == 8)
		    flags = SPARC_RET_INT64;
		  else if (rtype->size == 16)
		    flags = SPARC_RET_INT128;
		}
	    }
	  else if (fp_mask == all_mask)
	    switch (word_size)
	      {
	      case 1: flags = SPARC_RET_F_1; break;
	      case 2: flags = SPARC_RET_F_2; break;
	      case 3: flags = SP_V9_RET_F_3; break;
	      case 4: flags = SPARC_RET_F_4; break;
	      /* 5 word structures skipped; handled via RET_STRUCT.  */
	      case 6: flags = SPARC_RET_F_6; break;
	      /* 7 word structures skipped; handled via RET_STRUCT.  */
	      case 8: flags = SPARC_RET_F_8; break;
	      }
	}
      break;

    case FFI_TYPE_SINT8:
      flags = SPARC_RET_SINT8;
      break;
    case FFI_TYPE_UINT8:
      flags = SPARC_RET_UINT8;
      break;
    case FFI_TYPE_SINT16:
      flags = SPARC_RET_SINT16;
      break;
    case FFI_TYPE_UINT16:
      flags = SPARC_RET_UINT16;
      break;
    case FFI_TYPE_INT:
    case FFI_TYPE_SINT32:
      flags = SP_V9_RET_SINT32;
      break;
    case FFI_TYPE_UINT32:
      flags = SPARC_RET_UINT32;
      break;
    case FFI_TYPE_SINT64:
    case FFI_TYPE_UINT64:
    case FFI_TYPE_POINTER:
      flags = SPARC_RET_INT64;
      break;

    default:
      abort();
    }

  bytes = 0;
  for (i = 0, n = cif->nargs; i < n; ++i)
    {
      ffi_type *ty = cif->arg_types[i];
      size_t z = ty->size;
      size_t a = ty->alignment;

      switch (ty->type)
	{
	case FFI_TYPE_COMPLEX:
	case FFI_TYPE_STRUCT:
	  /* Large structs passed by reference.  */
	  if (z > 16)
	    {
	      a = z = 8;
	      break;
	    }
	  /* Small structs may be passed in integer or fp regs or both.  */
	  if (bytes >= 16*8)
	    break;
	  if ((ffi_struct_float_mask (ty, 0) & 0xff00) == 0)
	    break;
	  /* FALLTHRU */
	case FFI_TYPE_FLOAT:
	case FFI_TYPE_DOUBLE:
	case FFI_TYPE_LONGDOUBLE:
	  flags |= SPARC_FLAG_FP_ARGS;
	  break;
	}
      bytes = FFI_ALIGN(bytes, a);
      bytes += FFI_ALIGN(z, 8);
    }

  /* Sparc call frames require that space is allocated for 6 args,
     even if they aren't used. Make that space if necessary. */
  if (bytes < 6 * 8)
    bytes = 6 * 8;

  /* The stack must be 2 word aligned, so round bytes up appropriately. */
  bytes = FFI_ALIGN(bytes, 16);

  /* Include the call frame to prep_args.  */
  bytes += 8*16 + 8*8;

  cif->bytes = bytes;
  cif->flags = flags;
  return FFI_OK;
}

ffi_status FFI_HIDDEN
ffi_prep_cif_machdep(ffi_cif *cif)
{
  cif->nfixedargs = cif->nargs;
  return ffi_prep_cif_machdep_core(cif);
}

ffi_status FFI_HIDDEN
ffi_prep_cif_machdep_var(ffi_cif *cif, unsigned nfixedargs, unsigned ntotalargs)
{
  cif->nfixedargs = nfixedargs;
  return ffi_prep_cif_machdep_core(cif);
}

extern void ffi_call_v9(ffi_cif *cif, void (*fn)(void), void *rvalue,
			void **avalue, size_t bytes, void *closure) FFI_HIDDEN;

/* ffi_prep_args is called by the assembly routine once stack space
   has been allocated for the function's arguments */

int FFI_HIDDEN
ffi_prep_args_v9(ffi_cif *cif, unsigned long *argp, void *rvalue, void **avalue)
{
  ffi_type **p_arg;
  int flags = cif->flags;
  int i, nargs;

  if (rvalue == NULL)
    {
      if (flags & SPARC_FLAG_RET_IN_MEM)
	{
	  /* Since we pass the pointer to the callee, we need a value.
	     We allowed for this space in ffi_call, before ffi_call_v8
	     alloca'd the space.  */
	  rvalue = (char *)argp + cif->bytes;
	}
      else
	{
	  /* Otherwise, we can ignore the return value.  */
	  flags = SPARC_RET_VOID;
	}
    }

#ifdef USING_PURIFY
  /* Purify will probably complain in our assembly routine,
     unless we zero out this memory. */
  memset(argp, 0, 6*8);
#endif

  if (flags & SPARC_FLAG_RET_IN_MEM)
    *argp++ = (unsigned long)rvalue;

  p_arg = cif->arg_types;
  for (i = 0, nargs = cif->nargs; i < nargs; i++)
    {
      ffi_type *ty = p_arg[i];
      void *a = avalue[i];
      size_t z;

      switch (ty->type)
	{
	case FFI_TYPE_SINT8:
	  *argp++ = *(SINT8 *)a;
	  break;
	case FFI_TYPE_UINT8:
	  *argp++ = *(UINT8 *)a;
	  break;
	case FFI_TYPE_SINT16:
	  *argp++ = *(SINT16 *)a;
	  break;
	case FFI_TYPE_UINT16:
	  *argp++ = *(UINT16 *)a;
	  break;
	case FFI_TYPE_INT:
	case FFI_TYPE_SINT32:
	  *argp++ = *(SINT32 *)a;
	  break;
	case FFI_TYPE_UINT32:
	case FFI_TYPE_FLOAT:
	  *argp++ = *(UINT32 *)a;
	  break;
	case FFI_TYPE_SINT64:
	case FFI_TYPE_UINT64:
	case FFI_TYPE_POINTER:
	case FFI_TYPE_DOUBLE:
	  *argp++ = *(UINT64 *)a;
	  break;

	case FFI_TYPE_LONGDOUBLE:
	case FFI_TYPE_COMPLEX:
	case FFI_TYPE_STRUCT:
	  z = ty->size;
	  if (z > 16)
	    {
	      /* For structures larger than 16 bytes we pass reference.  */
	      *argp++ = (unsigned long)a;
	      break;
	    }
	  if (((unsigned long)argp & 15) && ty->alignment > 8)
	    argp++;
	  memcpy(argp, a, z);
	  argp += FFI_ALIGN(z, 8) / 8;
	  break;

	default:
	  abort();
	}
    }

  return flags;
}

static void
ffi_call_int(ffi_cif *cif, void (*fn)(void), void *rvalue,
	     void **avalue, void *closure)
{
  size_t bytes = cif->bytes;
  size_t i, nargs = cif->nargs;
  ffi_type **arg_types = cif->arg_types;

  FFI_ASSERT (cif->abi == FFI_V9);

  if (rvalue == NULL && (cif->flags & SPARC_FLAG_RET_IN_MEM))
    bytes += FFI_ALIGN (cif->rtype->size, 16);

  /* If we have any large structure arguments, make a copy so we are passing
     by value.  */
  for (i = 0; i < nargs; i++)
    {
      ffi_type *at = arg_types[i];
      int size = at->size;
      if (at->type == FFI_TYPE_STRUCT && size > 4)
        {
          char *argcopy = alloca (size);
          memcpy (argcopy, avalue[i], size);
          avalue[i] = argcopy;
        }
    }  
  
  ffi_call_v9(cif, fn, rvalue, avalue, -bytes, closure);
}

void
ffi_call(ffi_cif *cif, void (*fn)(void), void *rvalue, void **avalue)
{
  ffi_call_int(cif, fn, rvalue, avalue, NULL);
}

void
ffi_call_go(ffi_cif *cif, void (*fn)(void), void *rvalue,
	    void **avalue, void *closure)
{
  ffi_call_int(cif, fn, rvalue, avalue, closure);
}

#ifdef __GNUC__
static inline void
ffi_flush_icache (void *p)
{
  asm volatile ("flush	%0; flush %0+8" : : "r" (p) : "memory");
}
#else
extern void ffi_flush_icache (void *) FFI_HIDDEN;
#endif

extern void ffi_closure_v9(void) FFI_HIDDEN;
extern void ffi_go_closure_v9(void) FFI_HIDDEN;

ffi_status
ffi_prep_closure_loc (ffi_closure* closure,
		      ffi_cif* cif,
		      void (*fun)(ffi_cif*, void*, void**, void*),
		      void *user_data,
		      void *codeloc)
{
  unsigned int *tramp = (unsigned int *) &closure->tramp[0];
  unsigned long fn;

  if (cif->abi != FFI_V9)
    return FFI_BAD_ABI;

  /* Trampoline address is equal to the closure address.  We take advantage
     of that to reduce the trampoline size by 8 bytes. */
  fn = (unsigned long) ffi_closure_v9;
  tramp[0] = 0x83414000;	/* rd	%pc, %g1	*/
  tramp[1] = 0xca586010;	/* ldx	[%g1+16], %g5	*/
  tramp[2] = 0x81c14000;	/* jmp	%g5		*/
  tramp[3] = 0x01000000;	/* nop			*/
  *((unsigned long *) &tramp[4]) = fn;

  closure->cif = cif;
  closure->fun = fun;
  closure->user_data = user_data;

  ffi_flush_icache (closure);

  return FFI_OK;
}

ffi_status
ffi_prep_go_closure (ffi_go_closure* closure, ffi_cif* cif,
		     void (*fun)(ffi_cif*, void*, void**, void*))
{
  if (cif->abi != FFI_V9)
    return FFI_BAD_ABI;

  closure->tramp = ffi_go_closure_v9;
  closure->cif = cif;
  closure->fun = fun;

  return FFI_OK;
}

int FFI_HIDDEN
ffi_closure_sparc_inner_v9(ffi_cif *cif,
			   void (*fun)(ffi_cif*, void*, void**, void*),
			   void *user_data, void *rvalue,
			   unsigned long *gpr, unsigned long *fpr)
{
  ffi_type **arg_types;
  void **avalue;
  int i, argn, argx, nargs, flags, nfixedargs;

  arg_types = cif->arg_types;
  nargs = cif->nargs;
  flags = cif->flags;
  nfixedargs = cif->nfixedargs;

  avalue = alloca(nargs * sizeof(void *));

  /* Copy the caller's structure return address so that the closure
     returns the data directly to the caller.  */
  if (flags & SPARC_FLAG_RET_IN_MEM)
    {
      rvalue = (void *) gpr[0];
      /* Skip the structure return address.  */
      argn = 1;
    }
  else
    argn = 0;

  /* Grab the addresses of the arguments from the stack frame.  */
  for (i = 0; i < nargs; i++, argn = argx)
    {
      int named = i < nfixedargs;
      ffi_type *ty = arg_types[i];
      void *a = &gpr[argn];
      size_t z;

      argx = argn + 1;
      switch (ty->type)
	{
	case FFI_TYPE_COMPLEX:
	case FFI_TYPE_STRUCT:
	  z = ty->size;
	  if (z > 16)
	    a = *(void **)a;
	  else
	    {
	      argx = argn + FFI_ALIGN (z, 8) / 8;
	      if (named && argn < 16)
		{
		  int size_mask = ffi_struct_float_mask (ty, 0);
		  int argn_mask = (0xffff00 >> argn) & 0xff00;

		  /* Eliminate fp registers off the end.  */
		  size_mask = (size_mask & 0xff) | (size_mask & argn_mask);
		  a = ffi_struct_float_merge (size_mask, gpr+argn, fpr+argn);
		}
	    }
	  break;

	case FFI_TYPE_LONGDOUBLE:
	  argn = FFI_ALIGN (argn, 2);
	  a = (named && argn < 16 ? fpr : gpr) + argn;
	  argx = argn + 2;
	  break;
	case FFI_TYPE_DOUBLE:
	  if (named && argn < 16)
	    a = fpr + argn;
	  break;
	case FFI_TYPE_FLOAT:
	  if (named && argn < 16)
	    a = fpr + argn;
	  a += 4;
	  break;

	case FFI_TYPE_UINT64:
	case FFI_TYPE_SINT64:
	case FFI_TYPE_POINTER:
	  break;
	case FFI_TYPE_INT:
	case FFI_TYPE_UINT32:
	case FFI_TYPE_SINT32:
	  a += 4;
	  break;
        case FFI_TYPE_UINT16:
        case FFI_TYPE_SINT16:
	  a += 6;
	  break;
        case FFI_TYPE_UINT8:
        case FFI_TYPE_SINT8:
	  a += 7;
	  break;

	default:
	  abort();
	}
      avalue[i] = a;
    }

  /* Invoke the closure.  */
  fun (cif, rvalue, avalue, user_data);

  /* Tell ffi_closure_sparc how to perform return type promotions.  */
  return flags;
}
#endif /* SPARC64 */
