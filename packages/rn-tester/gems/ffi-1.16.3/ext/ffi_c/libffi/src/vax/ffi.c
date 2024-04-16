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
 * vax Foreign Function Interface
 *
 * This file attempts to provide all the FFI entry points which can reliably
 * be implemented in C.
 */

#include <ffi.h>
#include <ffi_common.h>

#include <stdlib.h>
#include <unistd.h>

#define CIF_FLAGS_CHAR		1	/* for struct only */
#define CIF_FLAGS_SHORT		2	/* for struct only */
#define CIF_FLAGS_INT		4
#define CIF_FLAGS_DINT		8

/*
 * Foreign Function Interface API
 */

void ffi_call_elfbsd (extended_cif *, unsigned, unsigned, void *,
		       void (*) ());
void *ffi_prep_args (extended_cif *ecif, void *stack);

void *
ffi_prep_args (extended_cif *ecif, void *stack)
{
  unsigned int i;
  void **p_argv;
  char *argp;
  ffi_type **p_arg;
  void *struct_value_ptr;

  argp = stack;

  if (ecif->cif->rtype->type == FFI_TYPE_STRUCT
      && !ecif->cif->flags)
    struct_value_ptr = ecif->rvalue;
  else
    struct_value_ptr = NULL;

  p_argv = ecif->avalue;

  for (i = ecif->cif->nargs, p_arg = ecif->cif->arg_types;
       i != 0;
       i--, p_arg++)
    {
      size_t z;

      z = (*p_arg)->size;
      if (z < sizeof (int))
	{
	  switch ((*p_arg)->type)
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

	    case FFI_TYPE_STRUCT:
	      memcpy (argp, *p_argv, z);
	      break;

	    default:
	      FFI_ASSERT (0);
	    }
	  z = sizeof (int);
	}
      else
	{
	  memcpy (argp, *p_argv, z);

	  /* Align if necessary.  */
	  if ((sizeof(int) - 1) & z)
	    z = FFI_ALIGN(z, sizeof(int));
	}

      p_argv++;
      argp += z;
    }

  return struct_value_ptr;
}

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
      if (cif->rtype->elements[0]->type == FFI_TYPE_STRUCT &&
	  cif->rtype->elements[1])
	{
	  cif->flags = 0;
	  break;
	}

      if (cif->rtype->size == sizeof (char))
	cif->flags = CIF_FLAGS_CHAR;
      else if (cif->rtype->size == sizeof (short))
	cif->flags = CIF_FLAGS_SHORT;
      else if (cif->rtype->size == sizeof (int))
	cif->flags = CIF_FLAGS_INT;
      else if (cif->rtype->size == 2 * sizeof (int))
	cif->flags = CIF_FLAGS_DINT;
      else
	cif->flags = 0;
      break;

    default:
      if (cif->rtype->size <= sizeof (int))
	cif->flags = CIF_FLAGS_INT;
      else
	cif->flags = CIF_FLAGS_DINT;
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
      && cif->flags == 0)
    ecif.rvalue = alloca (cif->rtype->size);
  else
    ecif.rvalue = rvalue;

  switch (cif->abi)
    {
    case FFI_ELFBSD:
      ffi_call_elfbsd (&ecif, cif->bytes, cif->flags, ecif.rvalue, fn);
      break;

    default:
      FFI_ASSERT (0);
      break;
    }
}

/*
 * Closure API
 */

void ffi_closure_elfbsd (void);
void ffi_closure_struct_elfbsd (void);
unsigned int ffi_closure_elfbsd_inner (ffi_closure *, void *, char *);

static void
ffi_prep_closure_elfbsd (ffi_cif *cif, void **avalue, char *stackp)
{
  unsigned int i;
  void **p_argv;
  ffi_type **p_arg;

  p_argv = avalue;

  for (i = cif->nargs, p_arg = cif->arg_types; i != 0; i--, p_arg++)
    {
      size_t z;

      z = (*p_arg)->size;
      *p_argv = stackp;

      /* Align if necessary */
      if ((sizeof (int) - 1) & z)
	z = FFI_ALIGN(z, sizeof (int));

      p_argv++;
      stackp += z;
    }
}

unsigned int
ffi_closure_elfbsd_inner (ffi_closure *closure, void *resp, char *stack)
{
  ffi_cif *cif;
  void **arg_area;

  cif = closure->cif;
  arg_area = (void **) alloca (cif->nargs * sizeof (void *));

  ffi_prep_closure_elfbsd (cif, arg_area, stack);

  (closure->fun) (cif, resp, arg_area, closure->user_data);

  return cif->flags;
}

ffi_status
ffi_prep_closure_loc (ffi_closure *closure, ffi_cif *cif,
		      void (*fun)(ffi_cif *, void *, void **, void *),
		      void *user_data, void *codeloc)
{
  char *tramp = (char *) codeloc;
  void *fn;

  FFI_ASSERT (cif->abi == FFI_ELFBSD);

  /* entry mask */
  *(unsigned short *)(tramp + 0) = 0x0000;
  /* movl #closure, r0 */
  tramp[2] = 0xd0;
  tramp[3] = 0x8f;
  *(unsigned int *)(tramp + 4) = (unsigned int) closure;
  tramp[8] = 0x50;

  if (cif->rtype->type == FFI_TYPE_STRUCT
      && !cif->flags)
    fn = &ffi_closure_struct_elfbsd;
  else
    fn = &ffi_closure_elfbsd;

  /* jmpl #fn */
  tramp[9] = 0x17;
  tramp[10] = 0xef;
  *(unsigned int *)(tramp + 11) = (unsigned int)fn + 2 -
				  (unsigned int)tramp - 9 - 6;

  closure->cif = cif;
  closure->user_data = user_data;
  closure->fun = fun;

  return FFI_OK;
}
