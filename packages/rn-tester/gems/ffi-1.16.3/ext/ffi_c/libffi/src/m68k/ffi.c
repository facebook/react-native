/* -----------------------------------------------------------------------
   ffi.c

   m68k Foreign Function Interface
   ----------------------------------------------------------------------- */

#include <ffi.h>
#include <ffi_common.h>

#include <stdlib.h>
#include <unistd.h>
#ifdef __rtems__
void rtems_cache_flush_multiple_data_lines( const void *, size_t );
#else
#include <sys/syscall.h>
#ifdef __MINT__
#include <mint/mintbind.h>
#include <mint/ssystem.h>
#else
#include <asm/cachectl.h>
#endif
#endif

void ffi_call_SYSV (extended_cif *,
		    unsigned, unsigned,
		    void *, void (*fn) ());
void *ffi_prep_args (void *stack, extended_cif *ecif);
void ffi_closure_SYSV (ffi_closure *);
void ffi_closure_struct_SYSV (ffi_closure *);
unsigned int ffi_closure_SYSV_inner (ffi_closure *closure,
				     void *resp, void *args);

/* ffi_prep_args is called by the assembly routine once stack space has
   been allocated for the function's arguments.  */

void *
ffi_prep_args (void *stack, extended_cif *ecif)
{
  unsigned int i;
  void **p_argv;
  char *argp;
  ffi_type **p_arg;
  void *struct_value_ptr;

  argp = stack;

  if (
#ifdef __MINT__
      (ecif->cif->rtype->type == FFI_TYPE_LONGDOUBLE) ||
#endif
      (((ecif->cif->rtype->type == FFI_TYPE_STRUCT)
        && !ecif->cif->flags)))
    struct_value_ptr = ecif->rvalue;
  else
    struct_value_ptr = NULL;

  p_argv = ecif->avalue;

  for (i = ecif->cif->nargs, p_arg = ecif->cif->arg_types;
       i != 0;
       i--, p_arg++)
    {
      size_t z = (*p_arg)->size;
      int type = (*p_arg)->type;

      if (z < sizeof (int))
	{
	  switch (type)
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
#ifdef __MINT__
	      if (z == 1 || z == 2)
		memcpy (argp + 2, *p_argv, z);
              else
		memcpy (argp, *p_argv, z);
#else
	      memcpy (argp + sizeof (int) - z, *p_argv, z);
#endif
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

#define CIF_FLAGS_INT		1
#define CIF_FLAGS_DINT		2
#define CIF_FLAGS_FLOAT		4
#define CIF_FLAGS_DOUBLE	8
#define CIF_FLAGS_LDOUBLE	16
#define CIF_FLAGS_POINTER	32
#define CIF_FLAGS_STRUCT1	64
#define CIF_FLAGS_STRUCT2	128
#define CIF_FLAGS_SINT8		256
#define CIF_FLAGS_SINT16	512

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
      if (cif->rtype->elements[0]->type == FFI_TYPE_STRUCT &&
          cif->rtype->elements[1])
        {
          cif->flags = 0;
          break;
        }

      switch (cif->rtype->size)
	{
	case 1:
#ifdef __MINT__
	  cif->flags = CIF_FLAGS_STRUCT2;
#else
	  cif->flags = CIF_FLAGS_STRUCT1;
#endif
	  break;
	case 2:
	  cif->flags = CIF_FLAGS_STRUCT2;
	  break;
#ifdef __MINT__
	case 3:
#endif
	case 4:
	  cif->flags = CIF_FLAGS_INT;
	  break;
#ifdef __MINT__
	case 7:
#endif
	case 8:
	  cif->flags = CIF_FLAGS_DINT;
	  break;
	default:
	  cif->flags = 0;
	  break;
	}
      break;

    case FFI_TYPE_FLOAT:
      cif->flags = CIF_FLAGS_FLOAT;
      break;

    case FFI_TYPE_DOUBLE:
      cif->flags = CIF_FLAGS_DOUBLE;
      break;

#if (FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE)
    case FFI_TYPE_LONGDOUBLE:
#ifdef __MINT__
      cif->flags = 0;
#else
      cif->flags = CIF_FLAGS_LDOUBLE;
#endif
      break;
#endif

    case FFI_TYPE_POINTER:
      cif->flags = CIF_FLAGS_POINTER;
      break;

    case FFI_TYPE_SINT64:
    case FFI_TYPE_UINT64:
      cif->flags = CIF_FLAGS_DINT;
      break;

    case FFI_TYPE_SINT16:
      cif->flags = CIF_FLAGS_SINT16;
      break;

    case FFI_TYPE_SINT8:
      cif->flags = CIF_FLAGS_SINT8;
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
      && cif->rtype->size > 8)
    ecif.rvalue = alloca (cif->rtype->size);
  else
    ecif.rvalue = rvalue;

  switch (cif->abi)
    {
    case FFI_SYSV:
      ffi_call_SYSV (&ecif, cif->bytes, cif->flags,
		     ecif.rvalue, fn);
      break;

    default:
      FFI_ASSERT (0);
      break;
    }
}

static void
ffi_prep_incoming_args_SYSV (char *stack, void **avalue, ffi_cif *cif)
{
  unsigned int i;
  void **p_argv;
  char *argp;
  ffi_type **p_arg;

  argp = stack;
  p_argv = avalue;

  for (i = cif->nargs, p_arg = cif->arg_types; (i != 0); i--, p_arg++)
    {
      size_t z;

      z = (*p_arg)->size;
#ifdef __MINT__
      if (cif->flags &&
          cif->rtype->type == FFI_TYPE_STRUCT &&
          (z == 1 || z == 2))
 	{
	  *p_argv = (void *) (argp + 2);

	  z = 4;
	}
      else
      if (cif->flags &&
          cif->rtype->type == FFI_TYPE_STRUCT &&
          (z == 3 || z == 4))
 	{
	  *p_argv = (void *) (argp);

	  z = 4;
	}
      else
#endif
      if (z <= 4)
	{
	  *p_argv = (void *) (argp + 4 - z);

	  z = 4;
	}
      else
	{
	  *p_argv = (void *) argp;

	  /* Align if necessary */
	  if ((sizeof(int) - 1) & z)
	    z = FFI_ALIGN(z, sizeof(int));
	}

      p_argv++;
      argp += z;
    }
}

unsigned int
ffi_closure_SYSV_inner (ffi_closure *closure, void *resp, void *args)
{
  ffi_cif *cif;
  void **arg_area;

  cif = closure->cif;
  arg_area = (void**) alloca (cif->nargs * sizeof (void *));

  ffi_prep_incoming_args_SYSV(args, arg_area, cif);

  (closure->fun) (cif, resp, arg_area, closure->user_data);

  return cif->flags;
}

ffi_status
ffi_prep_closure_loc (ffi_closure* closure,
		      ffi_cif* cif,
		      void (*fun)(ffi_cif*,void*,void**,void*),
		      void *user_data,
		      void *codeloc)
{
  if (cif->abi != FFI_SYSV)
    return FFI_BAD_ABI;

  *(unsigned short *)closure->tramp = 0x207c;
  *(void **)(closure->tramp + 2) = codeloc;
  *(unsigned short *)(closure->tramp + 6) = 0x4ef9;

  if (
#ifdef __MINT__
      (cif->rtype->type == FFI_TYPE_LONGDOUBLE) ||
#endif
      (((cif->rtype->type == FFI_TYPE_STRUCT)
         && !cif->flags)))
    *(void **)(closure->tramp + 8) = ffi_closure_struct_SYSV;
  else
    *(void **)(closure->tramp + 8) = ffi_closure_SYSV;

#ifdef __rtems__
  rtems_cache_flush_multiple_data_lines( codeloc, FFI_TRAMPOLINE_SIZE );
#elif defined(__MINT__)
  Ssystem(S_FLUSHCACHE, codeloc, FFI_TRAMPOLINE_SIZE);
#else
  syscall(SYS_cacheflush, codeloc, FLUSH_SCOPE_LINE,
	  FLUSH_CACHE_BOTH, FFI_TRAMPOLINE_SIZE);
#endif

  closure->cif  = cif;
  closure->user_data = user_data;
  closure->fun  = fun;

  return FFI_OK;
}
