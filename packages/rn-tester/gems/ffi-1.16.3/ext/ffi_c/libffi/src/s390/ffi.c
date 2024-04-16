/* -----------------------------------------------------------------------
   ffi.c - Copyright (c) 2000, 2007 Software AG
           Copyright (c) 2008 Red Hat, Inc

   S390 Foreign Function Interface

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
/*====================================================================*/
/*                          Includes                                  */
/*                          --------                                  */
/*====================================================================*/

#include <ffi.h>
#include <ffi_common.h>
#include <stdint.h>
#include "internal.h"

/*====================== End of Includes =============================*/

/*====================================================================*/
/*                           Defines                                  */
/*                           -------                                  */
/*====================================================================*/

/* Maximum number of GPRs available for argument passing.  */
#define MAX_GPRARGS 5

/* Maximum number of FPRs available for argument passing.  */
#ifdef __s390x__
#define MAX_FPRARGS 4
#else
#define MAX_FPRARGS 2
#endif

/* Round to multiple of 16.  */
#define ROUND_SIZE(size) (((size) + 15) & ~15)

/*===================== End of Defines ===============================*/

/*====================================================================*/
/*                          Externals                                 */
/*                          ---------                                 */
/*====================================================================*/

struct call_frame
{
  void *back_chain;
  void *eos;
  unsigned long gpr_args[5];
  unsigned long gpr_save[9];
  unsigned long long fpr_args[4];
};

extern void FFI_HIDDEN ffi_call_SYSV(struct call_frame *, unsigned, void *,
			             void (*fn)(void), void *);

extern void ffi_closure_SYSV(void);
extern void ffi_go_closure_SYSV(void);

/*====================== End of Externals ============================*/

/*====================================================================*/
/*                                                                    */
/* Name     - ffi_check_struct_type.                                  */
/*                                                                    */
/* Function - Determine if a structure can be passed within a         */
/*            general purpose or floating point register.             */
/*                                                                    */
/*====================================================================*/

static int
ffi_check_struct_type (ffi_type *arg)
{
  size_t size = arg->size;

  /* If the struct has just one element, look at that element
     to find out whether to consider the struct as floating point.  */
  while (arg->type == FFI_TYPE_STRUCT
         && arg->elements[0] && !arg->elements[1])
    arg = arg->elements[0];

  /* Structs of size 1, 2, 4, and 8 are passed in registers,
     just like the corresponding int/float types.  */
  switch (size)
    {
      case 1:
        return FFI_TYPE_UINT8;

      case 2:
        return FFI_TYPE_UINT16;

      case 4:
	if (arg->type == FFI_TYPE_FLOAT)
          return FFI_TYPE_FLOAT;
	else
	  return FFI_TYPE_UINT32;

      case 8:
	if (arg->type == FFI_TYPE_DOUBLE)
          return FFI_TYPE_DOUBLE;
	else
	  return FFI_TYPE_UINT64;

      default:
	break;
    }

  /* Other structs are passed via a pointer to the data.  */
  return FFI_TYPE_POINTER;
}

/*======================== End of Routine ============================*/

/*====================================================================*/
/*                                                                    */
/* Name     - ffi_prep_cif_machdep.                                   */
/*                                                                    */
/* Function - Perform machine dependent CIF processing.               */
/*                                                                    */
/*====================================================================*/

ffi_status FFI_HIDDEN
ffi_prep_cif_machdep(ffi_cif *cif)
{
  size_t struct_size = 0;
  int n_gpr = 0;
  int n_fpr = 0;
  int n_ov = 0;

  ffi_type **ptr;
  int i;

  /* Determine return value handling.  */

  switch (cif->rtype->type)
    {
      /* Void is easy.  */
      case FFI_TYPE_VOID:
	cif->flags = FFI390_RET_VOID;
	break;

      /* Structures and complex are returned via a hidden pointer.  */
      case FFI_TYPE_STRUCT:
      case FFI_TYPE_COMPLEX:
	cif->flags = FFI390_RET_STRUCT;
	n_gpr++;  /* We need one GPR to pass the pointer.  */
	break;

      /* Floating point values are returned in fpr 0.  */
      case FFI_TYPE_FLOAT:
	cif->flags = FFI390_RET_FLOAT;
	break;

      case FFI_TYPE_DOUBLE:
	cif->flags = FFI390_RET_DOUBLE;
	break;

#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
      case FFI_TYPE_LONGDOUBLE:
	cif->flags = FFI390_RET_STRUCT;
	n_gpr++;
	break;
#endif
      /* Integer values are returned in gpr 2 (and gpr 3
	 for 64-bit values on 31-bit machines).  */
      case FFI_TYPE_UINT64:
      case FFI_TYPE_SINT64:
	cif->flags = FFI390_RET_INT64;
	break;

      case FFI_TYPE_POINTER:
      case FFI_TYPE_INT:
      case FFI_TYPE_UINT32:
      case FFI_TYPE_SINT32:
      case FFI_TYPE_UINT16:
      case FFI_TYPE_SINT16:
      case FFI_TYPE_UINT8:
      case FFI_TYPE_SINT8:
	/* These are to be extended to word size.  */
#ifdef __s390x__
	cif->flags = FFI390_RET_INT64;
#else
	cif->flags = FFI390_RET_INT32;
#endif
	break;

      default:
        FFI_ASSERT (0);
        break;
    }

  /* Now for the arguments.  */

  for (ptr = cif->arg_types, i = cif->nargs;
       i > 0;
       i--, ptr++)
    {
      int type = (*ptr)->type;

#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
      /* 16-byte long double is passed like a struct.  */
      if (type == FFI_TYPE_LONGDOUBLE)
	type = FFI_TYPE_STRUCT;
#endif

      /* Check how a structure type is passed.  */
      if (type == FFI_TYPE_STRUCT || type == FFI_TYPE_COMPLEX)
	{
	  if (type == FFI_TYPE_COMPLEX)
	    type = FFI_TYPE_POINTER;
	  else
	    type = ffi_check_struct_type (*ptr);

	  /* If we pass the struct via pointer, we must reserve space
	     to copy its data for proper call-by-value semantics.  */
	  if (type == FFI_TYPE_POINTER)
	    struct_size += ROUND_SIZE ((*ptr)->size);
	}

      /* Now handle all primitive int/float data types.  */
      switch (type)
	{
	  /* The first MAX_FPRARGS floating point arguments
	     go in FPRs, the rest overflow to the stack.  */

	  case FFI_TYPE_DOUBLE:
	    if (n_fpr < MAX_FPRARGS)
	      n_fpr++;
	    else
	      n_ov += sizeof (double) / sizeof (long);
	    break;

	  case FFI_TYPE_FLOAT:
	    if (n_fpr < MAX_FPRARGS)
	      n_fpr++;
	    else
	      n_ov++;
	    break;

	  /* On 31-bit machines, 64-bit integers are passed in GPR pairs,
	     if one is still available, or else on the stack.  If only one
	     register is free, skip the register (it won't be used for any
	     subsequent argument either).  */

#ifndef __s390x__
	  case FFI_TYPE_UINT64:
	  case FFI_TYPE_SINT64:
	    if (n_gpr == MAX_GPRARGS-1)
	      n_gpr = MAX_GPRARGS;
	    if (n_gpr < MAX_GPRARGS)
	      n_gpr += 2;
	    else
	      n_ov += 2;
	    break;
#endif

	  /* Everything else is passed in GPRs (until MAX_GPRARGS
	     have been used) or overflows to the stack.  */

	  default:
	    if (n_gpr < MAX_GPRARGS)
	      n_gpr++;
	    else
	      n_ov++;
	    break;
        }
    }

  /* Total stack space as required for overflow arguments
     and temporary structure copies.  */

  cif->bytes = ROUND_SIZE (n_ov * sizeof (long)) + struct_size;

  return FFI_OK;
}

/*======================== End of Routine ============================*/

/*====================================================================*/
/*                                                                    */
/* Name     - ffi_call.                                               */
/*                                                                    */
/* Function - Call the FFI routine.                                   */
/*                                                                    */
/*====================================================================*/

static void
ffi_call_int(ffi_cif *cif,
	     void (*fn)(void),
	     void *rvalue,
	     void **avalue,
	     void *closure)
{
  int ret_type = cif->flags;
  size_t rsize = 0, bytes = cif->bytes;
  unsigned char *stack, *p_struct;
  struct call_frame *frame;
  unsigned long *p_ov, *p_gpr;
  unsigned long long *p_fpr;
  int n_fpr, n_gpr, n_ov, i, n;
  ffi_type **arg_types;

  FFI_ASSERT (cif->abi == FFI_SYSV);

  /* If we don't have a return value, we need to fake one.  */
  if (rvalue == NULL)
    {
      if (ret_type & FFI390_RET_IN_MEM)
	rsize = cif->rtype->size;
      else
	ret_type = FFI390_RET_VOID;
    }

  /* The stack space will be filled with those areas:

	dummy structure return		    (highest addresses)
	  FPR argument register save area
	  GPR argument register save area
	stack frame for ffi_call_SYSV
	temporary struct copies
	overflow argument area              (lowest addresses)

     We set up the following pointers:

        p_fpr: bottom of the FPR area (growing upwards)
	p_gpr: bottom of the GPR area (growing upwards)
	p_ov: bottom of the overflow area (growing upwards)
	p_struct: top of the struct copy area (growing downwards)

     All areas are kept aligned to twice the word size.

     Note that we're going to create the stack frame for both
     ffi_call_SYSV _and_ the target function right here.  This
     works because we don't make any function calls with more
     than 5 arguments (indeed only memcpy and ffi_call_SYSV),
     and thus we don't have any stacked outgoing parameters.  */

  stack = alloca (bytes + sizeof(struct call_frame) + rsize);
  frame = (struct call_frame *)(stack + bytes);
  if (rsize)
    rvalue = frame + 1;

  /* Link the new frame back to the one from this function.  */
  frame->back_chain = __builtin_frame_address (0);

  /* Fill in all of the argument stuff.  */
  p_ov = (unsigned long *)stack;
  p_struct = (unsigned char *)frame;
  p_gpr = frame->gpr_args;
  p_fpr = frame->fpr_args;
  n_fpr = n_gpr = n_ov = 0;

  /* If we returning a structure then we set the first parameter register
     to the address of where we are returning this structure.  */
  if (cif->flags & FFI390_RET_IN_MEM)
    p_gpr[n_gpr++] = (uintptr_t) rvalue;

  /* Now for the arguments.  */
  arg_types = cif->arg_types;
  for (i = 0, n = cif->nargs; i < n; ++i)
    {
      ffi_type *ty = arg_types[i];
      void *arg = avalue[i];
      int type = ty->type;
      ffi_arg val;

    restart:
      switch (type)
	{
	case FFI_TYPE_SINT8:
	  val = *(SINT8 *)arg;
	  goto do_int;
	case FFI_TYPE_UINT8:
	  val = *(UINT8 *)arg;
	  goto do_int;
	case FFI_TYPE_SINT16:
	  val = *(SINT16 *)arg;
	  goto do_int;
	case FFI_TYPE_UINT16:
	  val = *(UINT16 *)arg;
	  goto do_int;
	case FFI_TYPE_INT:
	case FFI_TYPE_SINT32:
	  val = *(SINT32 *)arg;
	  goto do_int;
	case FFI_TYPE_UINT32:
	  val = *(UINT32 *)arg;
	  goto do_int;
	case FFI_TYPE_POINTER:
	  val = *(uintptr_t *)arg;
	do_int:
	  *(n_gpr < MAX_GPRARGS ? p_gpr + n_gpr++ : p_ov + n_ov++) = val;
	  break;

	case FFI_TYPE_UINT64:
	case FFI_TYPE_SINT64:
#ifdef __s390x__
	  val = *(UINT64 *)arg;
	  goto do_int;
#else
	  if (n_gpr == MAX_GPRARGS-1)
	    n_gpr = MAX_GPRARGS;
	  if (n_gpr < MAX_GPRARGS)
	    p_gpr[n_gpr++] = ((UINT32 *) arg)[0],
	    p_gpr[n_gpr++] = ((UINT32 *) arg)[1];
	  else
	    p_ov[n_ov++] = ((UINT32 *) arg)[0],
	    p_ov[n_ov++] = ((UINT32 *) arg)[1];
#endif
	  break;

	case FFI_TYPE_DOUBLE:
	  if (n_fpr < MAX_FPRARGS)
	    p_fpr[n_fpr++] = *(UINT64 *) arg;
	  else
	    {
#ifdef __s390x__
	      p_ov[n_ov++] = *(UINT64 *) arg;
#else
	      p_ov[n_ov++] = ((UINT32 *) arg)[0],
	      p_ov[n_ov++] = ((UINT32 *) arg)[1];
#endif
	    }
	  break;

	case FFI_TYPE_FLOAT:
	  val = *(UINT32 *)arg;
	  if (n_fpr < MAX_FPRARGS)
	    p_fpr[n_fpr++] = (UINT64)val << 32;
	  else
	    p_ov[n_ov++] = val;
	  break;

	case FFI_TYPE_STRUCT:
          /* Check how a structure type is passed.  */
	  type = ffi_check_struct_type (ty);
	  /* Some structures are passed via a type they contain.  */
	  if (type != FFI_TYPE_POINTER)
	    goto restart;
	  /* ... otherwise, passed by reference.  fallthru.  */

#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
	case FFI_TYPE_LONGDOUBLE:
	  /* 16-byte long double is passed via reference.  */
#endif
	case FFI_TYPE_COMPLEX:
	  /* Complex types are passed via reference.  */
	  p_struct -= ROUND_SIZE (ty->size);
	  memcpy (p_struct, arg, ty->size);
	  val = (uintptr_t)p_struct;
	  goto do_int;

	default:
	  FFI_ASSERT (0);
	  break;
        }
    }

  ffi_call_SYSV (frame, ret_type & FFI360_RET_MASK, rvalue, fn, closure);
}

void
ffi_call (ffi_cif *cif, void (*fn)(void), void *rvalue, void **avalue)
{
  ffi_call_int(cif, fn, rvalue, avalue, NULL);
}

void
ffi_call_go (ffi_cif *cif, void (*fn)(void), void *rvalue,
	     void **avalue, void *closure)
{
  ffi_call_int(cif, fn, rvalue, avalue, closure);
}

/*======================== End of Routine ============================*/

/*====================================================================*/
/*                                                                    */
/* Name     - ffi_closure_helper_SYSV.                                */
/*                                                                    */
/* Function - Call a FFI closure target function.                     */
/*                                                                    */
/*====================================================================*/

void FFI_HIDDEN
ffi_closure_helper_SYSV (ffi_cif *cif,
			 void (*fun)(ffi_cif*,void*,void**,void*),
			 void *user_data,
			 unsigned long *p_gpr,
			 unsigned long long *p_fpr,
			 unsigned long *p_ov)
{
  unsigned long long ret_buffer;

  void *rvalue = &ret_buffer;
  void **avalue;
  void **p_arg;

  int n_gpr = 0;
  int n_fpr = 0;
  int n_ov = 0;

  ffi_type **ptr;
  int i;

  /* Allocate buffer for argument list pointers.  */
  p_arg = avalue = alloca (cif->nargs * sizeof (void *));

  /* If we returning a structure, pass the structure address
     directly to the target function.  Otherwise, have the target
     function store the return value to the GPR save area.  */
  if (cif->flags & FFI390_RET_IN_MEM)
    rvalue = (void *) p_gpr[n_gpr++];

  /* Now for the arguments.  */
  for (ptr = cif->arg_types, i = cif->nargs; i > 0; i--, p_arg++, ptr++)
    {
      int deref_struct_pointer = 0;
      int type = (*ptr)->type;

#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
      /* 16-byte long double is passed like a struct.  */
      if (type == FFI_TYPE_LONGDOUBLE)
	type = FFI_TYPE_STRUCT;
#endif

      /* Check how a structure type is passed.  */
      if (type == FFI_TYPE_STRUCT || type == FFI_TYPE_COMPLEX)
	{
	  if (type == FFI_TYPE_COMPLEX)
	    type = FFI_TYPE_POINTER;
	  else
	    type = ffi_check_struct_type (*ptr);

	  /* If we pass the struct via pointer, remember to
	     retrieve the pointer later.  */
	  if (type == FFI_TYPE_POINTER)
	    deref_struct_pointer = 1;
	}

      /* Pointers are passed like UINTs of the same size.  */
      if (type == FFI_TYPE_POINTER)
	{
#ifdef __s390x__
	  type = FFI_TYPE_UINT64;
#else
	  type = FFI_TYPE_UINT32;
#endif
	}

      /* Now handle all primitive int/float data types.  */
      switch (type)
	{
	  case FFI_TYPE_DOUBLE:
	    if (n_fpr < MAX_FPRARGS)
	      *p_arg = &p_fpr[n_fpr++];
	    else
	      *p_arg = &p_ov[n_ov],
	      n_ov += sizeof (double) / sizeof (long);
	    break;

	  case FFI_TYPE_FLOAT:
	    if (n_fpr < MAX_FPRARGS)
	      *p_arg = &p_fpr[n_fpr++];
	    else
	      *p_arg = (char *)&p_ov[n_ov++] + sizeof (long) - 4;
	    break;

	  case FFI_TYPE_UINT64:
	  case FFI_TYPE_SINT64:
#ifdef __s390x__
	    if (n_gpr < MAX_GPRARGS)
	      *p_arg = &p_gpr[n_gpr++];
	    else
	      *p_arg = &p_ov[n_ov++];
#else
	    if (n_gpr == MAX_GPRARGS-1)
	      n_gpr = MAX_GPRARGS;
	    if (n_gpr < MAX_GPRARGS)
	      *p_arg = &p_gpr[n_gpr], n_gpr += 2;
	    else
	      *p_arg = &p_ov[n_ov], n_ov += 2;
#endif
	    break;

	  case FFI_TYPE_INT:
	  case FFI_TYPE_UINT32:
	  case FFI_TYPE_SINT32:
	    if (n_gpr < MAX_GPRARGS)
	      *p_arg = (char *)&p_gpr[n_gpr++] + sizeof (long) - 4;
	    else
	      *p_arg = (char *)&p_ov[n_ov++] + sizeof (long) - 4;
	    break;

	  case FFI_TYPE_UINT16:
	  case FFI_TYPE_SINT16:
	    if (n_gpr < MAX_GPRARGS)
	      *p_arg = (char *)&p_gpr[n_gpr++] + sizeof (long) - 2;
	    else
	      *p_arg = (char *)&p_ov[n_ov++] + sizeof (long) - 2;
	    break;

	  case FFI_TYPE_UINT8:
	  case FFI_TYPE_SINT8:
	    if (n_gpr < MAX_GPRARGS)
	      *p_arg = (char *)&p_gpr[n_gpr++] + sizeof (long) - 1;
	    else
	      *p_arg = (char *)&p_ov[n_ov++] + sizeof (long) - 1;
	    break;

	  default:
	    FFI_ASSERT (0);
	    break;
        }

      /* If this is a struct passed via pointer, we need to
	 actually retrieve that pointer.  */
      if (deref_struct_pointer)
	*p_arg = *(void **)*p_arg;
    }


  /* Call the target function.  */
  (fun) (cif, rvalue, avalue, user_data);

  /* Convert the return value.  */
  switch (cif->rtype->type)
    {
      /* Void is easy, and so is struct.  */
      case FFI_TYPE_VOID:
      case FFI_TYPE_STRUCT:
      case FFI_TYPE_COMPLEX:
#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
      case FFI_TYPE_LONGDOUBLE:
#endif
	break;

      /* Floating point values are returned in fpr 0.  */
      case FFI_TYPE_FLOAT:
	p_fpr[0] = (long long) *(unsigned int *) rvalue << 32;
	break;

      case FFI_TYPE_DOUBLE:
	p_fpr[0] = *(unsigned long long *) rvalue;
	break;

      /* Integer values are returned in gpr 2 (and gpr 3
	 for 64-bit values on 31-bit machines).  */
      case FFI_TYPE_UINT64:
      case FFI_TYPE_SINT64:
#ifdef __s390x__
	p_gpr[0] = *(unsigned long *) rvalue;
#else
	p_gpr[0] = ((unsigned long *) rvalue)[0],
	p_gpr[1] = ((unsigned long *) rvalue)[1];
#endif
	break;

      case FFI_TYPE_POINTER:
      case FFI_TYPE_UINT32:
      case FFI_TYPE_UINT16:
      case FFI_TYPE_UINT8:
	p_gpr[0] = *(unsigned long *) rvalue;
	break;

      case FFI_TYPE_INT:
      case FFI_TYPE_SINT32:
      case FFI_TYPE_SINT16:
      case FFI_TYPE_SINT8:
	p_gpr[0] = *(signed long *) rvalue;
	break;

      default:
        FFI_ASSERT (0);
        break;
    }
}

/*======================== End of Routine ============================*/

/*====================================================================*/
/*                                                                    */
/* Name     - ffi_prep_closure_loc.                                   */
/*                                                                    */
/* Function - Prepare a FFI closure.                                  */
/*                                                                    */
/*====================================================================*/

ffi_status
ffi_prep_closure_loc (ffi_closure *closure,
		      ffi_cif *cif,
		      void (*fun) (ffi_cif *, void *, void **, void *),
		      void *user_data,
		      void *codeloc)
{
  static unsigned short const template[] = {
    0x0d10,			/* basr %r1,0 */
#ifndef __s390x__
    0x9801, 0x1006,		/* lm %r0,%r1,6(%r1) */
#else
    0xeb01, 0x100e, 0x0004,	/* lmg %r0,%r1,14(%r1) */
#endif
    0x07f1			/* br %r1 */
  };

  unsigned long *tramp = (unsigned long *)&closure->tramp;

  if (cif->abi != FFI_SYSV)
    return FFI_BAD_ABI;

  memcpy (tramp, template, sizeof(template));
  tramp[2] = (unsigned long)codeloc;
  tramp[3] = (unsigned long)&ffi_closure_SYSV;

  closure->cif = cif;
  closure->fun = fun;
  closure->user_data = user_data;

  return FFI_OK;
}

/*======================== End of Routine ============================*/

/* Build a Go language closure.  */

ffi_status
ffi_prep_go_closure (ffi_go_closure *closure, ffi_cif *cif,
		     void (*fun)(ffi_cif*,void*,void**,void*))
{
  if (cif->abi != FFI_SYSV)
    return FFI_BAD_ABI;

  closure->tramp = ffi_go_closure_SYSV;
  closure->cif = cif;
  closure->fun = fun;

  return FFI_OK;
}
