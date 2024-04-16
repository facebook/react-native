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

#ifndef SPARC64

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

/* Perform machine dependent cif processing */
ffi_status FFI_HIDDEN
ffi_prep_cif_machdep(ffi_cif *cif)
{
  ffi_type *rtype = cif->rtype;
  int rtt = rtype->type;
  size_t bytes;
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
    case FFI_TYPE_STRUCT:
      flags = (rtype->size & 0xfff) << SPARC_SIZEMASK_SHIFT;
      flags |= SPARC_RET_STRUCT;
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
    case FFI_TYPE_UINT32:
    case FFI_TYPE_POINTER:
      flags = SPARC_RET_UINT32;
      break;
    case FFI_TYPE_SINT64:
    case FFI_TYPE_UINT64:
      flags = SPARC_RET_INT64;
      break;
    case FFI_TYPE_COMPLEX:
      rtt = rtype->elements[0]->type;
      switch (rtt)
	{
	case FFI_TYPE_FLOAT:
	  flags = SPARC_RET_F_2;
	  break;
	case FFI_TYPE_DOUBLE:
	  flags = SPARC_RET_F_4;
	  break;
	case FFI_TYPE_LONGDOUBLE:
	  flags = SPARC_RET_F_8;
	  break;
	case FFI_TYPE_SINT64:
	case FFI_TYPE_UINT64:
	  flags = SPARC_RET_INT128;
	  break;
	case FFI_TYPE_INT:
	case FFI_TYPE_SINT32:
	case FFI_TYPE_UINT32:
	  flags = SPARC_RET_INT64;
	  break;
	case FFI_TYPE_SINT16:
	case FFI_TYPE_UINT16:
	  flags = SP_V8_RET_CPLX16;
	  break;
	case FFI_TYPE_SINT8:
	case FFI_TYPE_UINT8:
	  flags = SP_V8_RET_CPLX8;
	  break;
	default:
	  abort();
	}
      break;
    default:
      abort();
    }
  cif->flags = flags;

  bytes = 0;
  for (i = 0, n = cif->nargs; i < n; ++i)
    {
      ffi_type *ty = cif->arg_types[i];
      size_t z = ty->size;
      int tt = ty->type;

      switch (tt)
	{
	case FFI_TYPE_STRUCT:
	case FFI_TYPE_LONGDOUBLE:
	by_reference:
	  /* Passed by reference.  */
	  z = 4;
	  break;

	case FFI_TYPE_COMPLEX:
	  tt = ty->elements[0]->type;
	  if (tt == FFI_TYPE_FLOAT || z > 8)
	    goto by_reference;
	  /* FALLTHRU */

	default:
	  z = FFI_ALIGN(z, 4);
	}
      bytes += z;
    }

  /* Sparc call frames require that space is allocated for 6 args,
     even if they aren't used. Make that space if necessary.  */
  if (bytes < 6 * 4)
    bytes = 6 * 4;

  /* The ABI always requires space for the struct return pointer.  */
  bytes += 4;

  /* The stack must be 2 word aligned, so round bytes up appropriately. */
  bytes = FFI_ALIGN(bytes, 2 * 4);

  /* Include the call frame to prep_args.  */
  bytes += 4*16 + 4*8;
  cif->bytes = bytes;

  return FFI_OK;
}

extern void ffi_call_v8(ffi_cif *cif, void (*fn)(void), void *rvalue,
			void **avalue, size_t bytes, void *closure) FFI_HIDDEN;

int FFI_HIDDEN
ffi_prep_args_v8(ffi_cif *cif, unsigned long *argp, void *rvalue, void **avalue)
{
  ffi_type **p_arg;
  int flags = cif->flags;
  int i, nargs;

  if (rvalue == NULL)
    {
      if ((flags & SPARC_FLAG_RET_MASK) == SPARC_RET_STRUCT)
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

  /* This could only really be done when we are returning a structure.
     However, the space is reserved so we can do it unconditionally.  */
  *argp++ = (unsigned long)rvalue;

#ifdef USING_PURIFY
  /* Purify will probably complain in our assembly routine,
     unless we zero out this memory. */
  memset(argp, 0, 6*4);
#endif

  p_arg = cif->arg_types;
  for (i = 0, nargs = cif->nargs; i < nargs; i++)
    {
      ffi_type *ty = p_arg[i];
      void *a = avalue[i];
      int tt = ty->type;
      size_t z;

      switch (tt)
	{
	case FFI_TYPE_STRUCT:
	case FFI_TYPE_LONGDOUBLE:
	by_reference:
	  *argp++ = (unsigned long)a;
	  break;

	case FFI_TYPE_DOUBLE:
	case FFI_TYPE_UINT64:
	case FFI_TYPE_SINT64:
	  memcpy(argp, a, 8);
	  argp += 2;
	  break;

	case FFI_TYPE_INT:
	case FFI_TYPE_FLOAT:
	case FFI_TYPE_UINT32:
	case FFI_TYPE_SINT32:
	case FFI_TYPE_POINTER:
	  *argp++ = *(unsigned *)a;
	  break;

	case FFI_TYPE_UINT8:
	  *argp++ = *(UINT8 *)a;
	  break;
	case FFI_TYPE_SINT8:
	  *argp++ = *(SINT8 *)a;
	  break;
	case FFI_TYPE_UINT16:
	  *argp++ = *(UINT16 *)a;
	  break;
	case FFI_TYPE_SINT16:
	  *argp++ = *(SINT16 *)a;
	  break;

        case FFI_TYPE_COMPLEX:
	  tt = ty->elements[0]->type;
	  z = ty->size;
	  if (tt == FFI_TYPE_FLOAT || z > 8)
	    goto by_reference;
	  if (z < 4)
	    {
	      memcpy((char *)argp + 4 - z, a, z);
	      argp++;
	    }
	  else
	    {
	      memcpy(argp, a, z);
	      argp += z / 4;
	    }
	  break;

	default:
	  abort();
	}
    }

  return flags;
}

static void
ffi_call_int (ffi_cif *cif, void (*fn)(void), void *rvalue,
	      void **avalue, void *closure)
{
  size_t bytes = cif->bytes;

  FFI_ASSERT (cif->abi == FFI_V8);

  /* If we've not got a return value, we need to create one if we've
     got to pass the return value to the callee.  Otherwise ignore it.  */
  if (rvalue == NULL
      && (cif->flags & SPARC_FLAG_RET_MASK) == SPARC_RET_STRUCT)
    bytes += FFI_ALIGN (cif->rtype->size, 8);

  ffi_call_v8(cif, fn, rvalue, avalue, -bytes, closure);
}

void
ffi_call (ffi_cif *cif, void (*fn)(void), void *rvalue, void **avalue)
{
  ffi_call_int (cif, fn, rvalue, avalue, NULL);
}

void
ffi_call_go (ffi_cif *cif, void (*fn)(void), void *rvalue,
	     void **avalue, void *closure)
{
  ffi_call_int (cif, fn, rvalue, avalue, closure);
}

#ifdef __GNUC__
static inline void
ffi_flush_icache (void *p)
{
  /* SPARC v8 requires 5 instructions for flush to be visible */
  asm volatile ("iflush	%0; iflush %0+8; nop; nop; nop; nop; nop"
		: : "r" (p) : "memory");
}
#else
extern void ffi_flush_icache (void *) FFI_HIDDEN;
#endif

extern void ffi_closure_v8(void) FFI_HIDDEN;
extern void ffi_go_closure_v8(void) FFI_HIDDEN;

ffi_status
ffi_prep_closure_loc (ffi_closure *closure,
		      ffi_cif *cif,
		      void (*fun)(ffi_cif*, void*, void**, void*),
		      void *user_data,
		      void *codeloc)
{
  unsigned int *tramp = (unsigned int *) &closure->tramp[0];
  unsigned long ctx = (unsigned long) closure;
  unsigned long fn = (unsigned long) ffi_closure_v8;

  if (cif->abi != FFI_V8)
    return FFI_BAD_ABI;

  tramp[0] = 0x03000000 | fn >> 10;	/* sethi %hi(fn), %g1	*/
  tramp[1] = 0x05000000 | ctx >> 10;	/* sethi %hi(ctx), %g2	*/
  tramp[2] = 0x81c06000 | (fn & 0x3ff);	/* jmp   %g1+%lo(fn)	*/
  tramp[3] = 0x8410a000 | (ctx & 0x3ff);/* or    %g2, %lo(ctx)	*/

  closure->cif = cif;
  closure->fun = fun;
  closure->user_data = user_data;

  ffi_flush_icache (closure);

  return FFI_OK;
}

ffi_status
ffi_prep_go_closure (ffi_go_closure *closure, ffi_cif *cif,
		     void (*fun)(ffi_cif*, void*, void**, void*))
{
  if (cif->abi != FFI_V8)
    return FFI_BAD_ABI;

  closure->tramp = ffi_go_closure_v8;
  closure->cif = cif;
  closure->fun = fun;

  return FFI_OK;
}

int FFI_HIDDEN
ffi_closure_sparc_inner_v8(ffi_cif *cif, 
			   void (*fun)(ffi_cif*, void*, void**, void*),
			   void *user_data, void *rvalue,
			   unsigned long *argp)
{
  ffi_type **arg_types;
  void **avalue;
  int i, nargs, flags;

  arg_types = cif->arg_types;
  nargs = cif->nargs;
  flags = cif->flags;
  avalue = alloca(nargs * sizeof(void *));

  /* Copy the caller's structure return address so that the closure
     returns the data directly to the caller.  Also install it so we
     can return the address in %o0.  */
  if ((flags & SPARC_FLAG_RET_MASK) == SPARC_RET_STRUCT)
    {
      void *new_rvalue = (void *)*argp;
      *(void **)rvalue = new_rvalue;
      rvalue = new_rvalue;
    }

  /* Always skip the structure return address.  */
  argp++;

  /* Grab the addresses of the arguments from the stack frame.  */
  for (i = 0; i < nargs; i++)
    {
      ffi_type *ty = arg_types[i];
      int tt = ty->type;
      void *a = argp;
      size_t z;

      switch (tt)
	{
	case FFI_TYPE_STRUCT:
	case FFI_TYPE_LONGDOUBLE:
	by_reference:
	  /* Straight copy of invisible reference.  */
	  a = (void *)*argp;
	  break;

	case FFI_TYPE_DOUBLE:
	case FFI_TYPE_SINT64:
	case FFI_TYPE_UINT64:
	  if ((unsigned long)a & 7)
	    {
	      /* Align on a 8-byte boundary.  */
	      UINT64 *tmp = alloca(8);
	      *tmp = ((UINT64)argp[0] << 32) | argp[1];
	      a = tmp;
	    }
	  argp++;
	  break;

	case FFI_TYPE_INT:
	case FFI_TYPE_FLOAT:
	case FFI_TYPE_UINT32:
	case FFI_TYPE_SINT32:
	case FFI_TYPE_POINTER:
	  break;
        case FFI_TYPE_UINT16:
        case FFI_TYPE_SINT16:
	  a += 2;
	  break;
        case FFI_TYPE_UINT8:
        case FFI_TYPE_SINT8:
	  a += 3;
	  break;

        case FFI_TYPE_COMPLEX:
	  tt = ty->elements[0]->type;
	  z = ty->size;
	  if (tt == FFI_TYPE_FLOAT || z > 8)
	    goto by_reference;
	  if (z < 4)
	    a += 4 - z;
	  else if (z > 4)
	    argp++;
	  break;

	default:
	  abort();
	}
      argp++;
      avalue[i] = a;
    }

  /* Invoke the closure.  */
  fun (cif, rvalue, avalue, user_data);

  /* Tell ffi_closure_sparc how to perform return type promotions.  */
  return flags;
}
#endif /* !SPARC64 */
