/*
 * Copyright (c) 2013 Miodrag Vallat.  <miod@openbsd.org>
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * ``Software''), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED ``AS IS'', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/*
 * m88k Foreign Function Interface
 *
 * This file attempts to provide all the FFI entry points which can reliably
 * be implemented in C.
 *
 * Only OpenBSD/m88k is currently supported; other platforms (such as
 * Motorola's SysV/m88k) could be supported with the following tweaks:
 *
 * - non-OpenBSD systems use an `outgoing parameter area' as part of the
 *   88BCS calling convention, which is not supported under OpenBSD from
 *   release 3.6 onwards.  Supporting it should be as easy as taking it
 *   into account when adjusting the stack, in the assembly code.
 *
 * - the logic deciding whether a function argument gets passed through
 *   registers, or on the stack, has changed several times in OpenBSD in
 *   edge cases (especially for structs larger than 32 bytes being passed
 *   by value). The code below attemps to match the logic used by the
 *   system compiler of OpenBSD 5.3, i.e. gcc 3.3.6 with many m88k backend
 *   fixes.
 */

#include <ffi.h>
#include <ffi_common.h>

#include <stdlib.h>
#include <unistd.h>

void ffi_call_OBSD (unsigned int, extended_cif *, unsigned int, void *,
		    void (*fn) ());
void *ffi_prep_args (void *, extended_cif *);
void ffi_closure_OBSD (ffi_closure *);
void ffi_closure_struct_OBSD (ffi_closure *);
unsigned int ffi_closure_OBSD_inner (ffi_closure *, void *, unsigned int *,
				     char *);
void ffi_cacheflush_OBSD (unsigned int, unsigned int);

#define CIF_FLAGS_INT		(1 << 0)
#define CIF_FLAGS_DINT		(1 << 1)

/*
 * Foreign Function Interface API
 */

/* ffi_prep_args is called by the assembly routine once stack space has
   been allocated for the function's arguments.  */

void *
ffi_prep_args (void *stack, extended_cif *ecif)
{
  unsigned int i;
  void **p_argv;
  char *argp, *stackp;
  unsigned int *regp;
  unsigned int regused;
  ffi_type **p_arg;
  void *struct_value_ptr;

  regp = (unsigned int *)stack;
  stackp = (char *)(regp + 8);
  regused = 0;

  if (ecif->cif->rtype->type == FFI_TYPE_STRUCT
      && !ecif->cif->flags)
    struct_value_ptr = ecif->rvalue;
  else
    struct_value_ptr = NULL;

  p_argv = ecif->avalue;

  for (i = ecif->cif->nargs, p_arg = ecif->cif->arg_types; i != 0; i--, p_arg++)
    {
      size_t z;
      unsigned short t, a;

      z = (*p_arg)->size;
      t = (*p_arg)->type;
      a = (*p_arg)->alignment;

      /*
       * Figure out whether the argument can be passed through registers
       * or on the stack.
       * The rule is that registers can only receive simple types not larger
       * than 64 bits, or structs the exact size of a register and aligned to
       * the size of a register.
       */
      if (t == FFI_TYPE_STRUCT)
	{
	  if (z == sizeof (int) && a == sizeof (int) && regused < 8)
	    argp = (char *)regp;
	  else
	    argp = stackp;
	}
      else
	{
	  if (z > sizeof (int) && regused < 8 - 1)
	    {
	      /* align to an even register pair */
	      if (regused & 1)
		{
		  regp++;
		  regused++;
		}
	    }
	  if (regused < 8)
	    argp = (char *)regp;
	  else
	    argp = stackp;
	}

      /* Enforce proper stack alignment of 64-bit types */
      if (argp == stackp && a > sizeof (int))
	{
	  stackp = (char *) FFI_ALIGN(stackp, a);
	  argp = stackp;
	}

      switch (t)
	{
	case FFI_TYPE_SINT8:
	  *(signed int *) argp = (signed int) *(SINT8 *) *p_argv;
	  break;

	case FFI_TYPE_UINT8:
	  *(unsigned int *) argp = (unsigned int) *(UINT8 *) *p_argv;
	  break;

	case FFI_TYPE_SINT16:
	  *(signed int *) argp = (signed int) *(SINT16 *) *p_argv;
	  break;

	case FFI_TYPE_UINT16:
	  *(unsigned int *) argp = (unsigned int) *(UINT16 *) *p_argv;
	  break;

	case FFI_TYPE_INT:
	case FFI_TYPE_FLOAT:
	case FFI_TYPE_UINT32:
	case FFI_TYPE_SINT32:
	case FFI_TYPE_POINTER:
	  *(unsigned int *) argp = *(unsigned int *) *p_argv;
	  break;

	case FFI_TYPE_DOUBLE:
	case FFI_TYPE_UINT64:
	case FFI_TYPE_SINT64:
	case FFI_TYPE_STRUCT:
	  memcpy (argp, *p_argv, z);
	  break;

	default:
	  FFI_ASSERT (0);
	}

      /* Align if necessary.  */
      if ((sizeof (int) - 1) & z)
	z = FFI_ALIGN(z, sizeof (int));

      p_argv++;

      /* Be careful, once all registers are filled, and about to continue
         on stack, regp == stackp.  Therefore the check for regused as well. */
      if (argp == (char *)regp && regused < 8)
	{
	  regp += z / sizeof (int);
	  regused += z / sizeof (int);
	}
      else
	stackp += z;
    }

  return struct_value_ptr;
}

/* Perform machine dependent cif processing */
ffi_status
ffi_prep_cif_machdep (ffi_cif *cif)
{
  /* Set the return type flag */
  switch (cif->rtype->type)
    {
    case FFI_TYPE_VOID:
      cif->flags = 0;
      break;

    case FFI_TYPE_STRUCT:
      if (cif->rtype->size == sizeof (int) &&
	  cif->rtype->alignment == sizeof (int))
	cif->flags = CIF_FLAGS_INT;
      else
	cif->flags = 0;
      break;

    case FFI_TYPE_DOUBLE:
    case FFI_TYPE_SINT64:
    case FFI_TYPE_UINT64:
      cif->flags = CIF_FLAGS_DINT;
      break;

    default:
      cif->flags = CIF_FLAGS_INT;
      break;
    }

  return FFI_OK;
}

void
ffi_call (ffi_cif *cif, void (*fn) (), void *rvalue, void **avalue)
{
  extended_cif ecif;

  ecif.cif = cif;
  ecif.avalue = avalue;

  /* If the return value is a struct and we don't have a return value
     address then we need to make one.  */

  if (rvalue == NULL
      && cif->rtype->type == FFI_TYPE_STRUCT
      && (cif->rtype->size != sizeof (int)
	  || cif->rtype->alignment != sizeof (int)))
    ecif.rvalue = alloca (cif->rtype->size);
  else
    ecif.rvalue = rvalue;

  switch (cif->abi)
    {
    case FFI_OBSD:
      ffi_call_OBSD (cif->bytes, &ecif, cif->flags, ecif.rvalue, fn);
      break;

    default:
      FFI_ASSERT (0);
      break;
    }
}

/*
 * Closure API
 */

static void
ffi_prep_closure_args_OBSD (ffi_cif *cif, void **avalue, unsigned int *regp,
			    char *stackp)
{
  unsigned int i;
  void **p_argv;
  char *argp;
  unsigned int regused;
  ffi_type **p_arg;

  regused = 0;

  p_argv = avalue;

  for (i = cif->nargs, p_arg = cif->arg_types; i != 0; i--, p_arg++)
    {
      size_t z;
      unsigned short t, a;

      z = (*p_arg)->size;
      t = (*p_arg)->type;
      a = (*p_arg)->alignment;

      /*
       * Figure out whether the argument has been passed through registers
       * or on the stack.
       * The rule is that registers can only receive simple types not larger
       * than 64 bits, or structs the exact size of a register and aligned to
       * the size of a register.
       */
      if (t == FFI_TYPE_STRUCT)
	{
	  if (z == sizeof (int) && a == sizeof (int) && regused < 8)
	    argp = (char *)regp;
	  else
	    argp = stackp;
	}
      else
	{
	  if (z > sizeof (int) && regused < 8 - 1)
	    {
	      /* align to an even register pair */
	      if (regused & 1)
		{
		  regp++;
		  regused++;
		}
	    }
	  if (regused < 8)
	    argp = (char *)regp;
	  else
	    argp = stackp;
	}

      /* Enforce proper stack alignment of 64-bit types */
      if (argp == stackp && a > sizeof (int))
	{
	  stackp = (char *) FFI_ALIGN(stackp, a);
	  argp = stackp;
	}

      if (z < sizeof (int) && t != FFI_TYPE_STRUCT)
	*p_argv = (void *) (argp + sizeof (int) - z);
      else
	*p_argv = (void *) argp;

      /* Align if necessary */
      if ((sizeof (int) - 1) & z)
	z = FFI_ALIGN(z, sizeof (int));

      p_argv++;

      /* Be careful, once all registers are exhausted, and about to fetch from
	 stack, regp == stackp.  Therefore the check for regused as well. */
      if (argp == (char *)regp && regused < 8)
	{
	  regp += z / sizeof (int);
	  regused += z / sizeof (int);
	}
      else
	stackp += z;
    }
}

unsigned int
ffi_closure_OBSD_inner (ffi_closure *closure, void *resp, unsigned int *regp,
			char *stackp)
{
  ffi_cif *cif;
  void **arg_area;

  cif = closure->cif;
  arg_area = (void**) alloca (cif->nargs * sizeof (void *));

  ffi_prep_closure_args_OBSD(cif, arg_area, regp, stackp);

  (closure->fun) (cif, resp, arg_area, closure->user_data);

  return cif->flags;
}

ffi_status
ffi_prep_closure_loc (ffi_closure* closure, ffi_cif* cif,
		      void (*fun)(ffi_cif*,void*,void**,void*),
		      void *user_data, void *codeloc)
{
  unsigned int *tramp = (unsigned int *) codeloc;
  void *fn;

  FFI_ASSERT (cif->abi == FFI_OBSD);

  if (cif->rtype->type == FFI_TYPE_STRUCT && !cif->flags)
    fn = &ffi_closure_struct_OBSD;
  else
    fn = &ffi_closure_OBSD;

  /* or.u %r10, %r0, %hi16(fn) */
  tramp[0] = 0x5d400000 | (((unsigned int)fn) >> 16);
  /* or.u %r13, %r0, %hi16(closure) */
  tramp[1] = 0x5da00000 | ((unsigned int)closure >> 16);
  /* or %r10, %r10, %lo16(fn) */
  tramp[2] = 0x594a0000 | (((unsigned int)fn) & 0xffff);
  /* jmp.n %r10 */
  tramp[3] = 0xf400c40a;
  /* or %r13, %r13, %lo16(closure) */
  tramp[4] = 0x59ad0000 | ((unsigned int)closure & 0xffff);

  ffi_cacheflush_OBSD((unsigned int)codeloc, FFI_TRAMPOLINE_SIZE);

  closure->cif  = cif;
  closure->user_data = user_data;
  closure->fun  = fun;

  return FFI_OK;
}
