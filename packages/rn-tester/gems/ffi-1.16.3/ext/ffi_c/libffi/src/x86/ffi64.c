/* -----------------------------------------------------------------------
   ffi64.c - Copyright (c) 2011, 2018, 2022  Anthony Green
             Copyright (c) 2013  The Written Word, Inc.
             Copyright (c) 2008, 2010  Red Hat, Inc.
             Copyright (c) 2002, 2007  Bo Thorsen <bo@suse.de>

   x86-64 Foreign Function Interface

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
#include <stdarg.h>
#include <stdint.h>
#include <tramp.h>
#include "internal64.h"

#ifdef __x86_64__

#define MAX_GPR_REGS 6
#define MAX_SSE_REGS 8

#if defined(__INTEL_COMPILER)
#include "xmmintrin.h"
#define UINT128 __m128
#else
#if defined(__SUNPRO_C)
#include <sunmedia_types.h>
#define UINT128 __m128i
#else
#define UINT128 __int128_t
#endif
#endif

union big_int_union
{
  UINT32 i32;
  UINT64 i64;
  UINT128 i128;
};

struct register_args
{
  /* Registers for argument passing.  */
  UINT64 gpr[MAX_GPR_REGS];
  union big_int_union sse[MAX_SSE_REGS];
  UINT64 rax;	/* ssecount */
  UINT64 r10;	/* static chain */
};

extern void ffi_call_unix64 (void *args, unsigned long bytes, unsigned flags,
			     void *raddr, void (*fnaddr)(void)) FFI_HIDDEN;

/* All reference to register classes here is identical to the code in
   gcc/config/i386/i386.c. Do *not* change one without the other.  */

/* Register class used for passing given 64bit part of the argument.
   These represent classes as documented by the PS ABI, with the
   exception of SSESF, SSEDF classes, that are basically SSE class,
   just gcc will use SF or DFmode move instead of DImode to avoid
   reformatting penalties.

   Similary we play games with INTEGERSI_CLASS to use cheaper SImode moves
   whenever possible (upper half does contain padding).  */
enum x86_64_reg_class
  {
    X86_64_NO_CLASS,
    X86_64_INTEGER_CLASS,
    X86_64_INTEGERSI_CLASS,
    X86_64_SSE_CLASS,
    X86_64_SSESF_CLASS,
    X86_64_SSEDF_CLASS,
    X86_64_SSEUP_CLASS,
    X86_64_X87_CLASS,
    X86_64_X87UP_CLASS,
    X86_64_COMPLEX_X87_CLASS,
    X86_64_MEMORY_CLASS
  };

#define MAX_CLASSES 4

#define SSE_CLASS_P(X)	((X) >= X86_64_SSE_CLASS && X <= X86_64_SSEUP_CLASS)

/* x86-64 register passing implementation.  See x86-64 ABI for details.  Goal
   of this code is to classify each 8bytes of incoming argument by the register
   class and assign registers accordingly.  */

/* Return the union class of CLASS1 and CLASS2.
   See the x86-64 PS ABI for details.  */

static enum x86_64_reg_class
merge_classes (enum x86_64_reg_class class1, enum x86_64_reg_class class2)
{
  /* Rule #1: If both classes are equal, this is the resulting class.  */
  if (class1 == class2)
    return class1;

  /* Rule #2: If one of the classes is NO_CLASS, the resulting class is
     the other class.  */
  if (class1 == X86_64_NO_CLASS)
    return class2;
  if (class2 == X86_64_NO_CLASS)
    return class1;

  /* Rule #3: If one of the classes is MEMORY, the result is MEMORY.  */
  if (class1 == X86_64_MEMORY_CLASS || class2 == X86_64_MEMORY_CLASS)
    return X86_64_MEMORY_CLASS;

  /* Rule #4: If one of the classes is INTEGER, the result is INTEGER.  */
  if ((class1 == X86_64_INTEGERSI_CLASS && class2 == X86_64_SSESF_CLASS)
      || (class2 == X86_64_INTEGERSI_CLASS && class1 == X86_64_SSESF_CLASS))
    return X86_64_INTEGERSI_CLASS;
  if (class1 == X86_64_INTEGER_CLASS || class1 == X86_64_INTEGERSI_CLASS
      || class2 == X86_64_INTEGER_CLASS || class2 == X86_64_INTEGERSI_CLASS)
    return X86_64_INTEGER_CLASS;

  /* Rule #5: If one of the classes is X87, X87UP, or COMPLEX_X87 class,
     MEMORY is used.  */
  if (class1 == X86_64_X87_CLASS
      || class1 == X86_64_X87UP_CLASS
      || class1 == X86_64_COMPLEX_X87_CLASS
      || class2 == X86_64_X87_CLASS
      || class2 == X86_64_X87UP_CLASS
      || class2 == X86_64_COMPLEX_X87_CLASS)
    return X86_64_MEMORY_CLASS;

  /* Rule #6: Otherwise class SSE is used.  */
  return X86_64_SSE_CLASS;
}

/* Classify the argument of type TYPE and mode MODE.
   CLASSES will be filled by the register class used to pass each word
   of the operand.  The number of words is returned.  In case the parameter
   should be passed in memory, 0 is returned. As a special case for zero
   sized containers, classes[0] will be NO_CLASS and 1 is returned.

   See the x86-64 PS ABI for details.
*/
static size_t
classify_argument (ffi_type *type, enum x86_64_reg_class classes[],
		   size_t byte_offset)
{
  switch (type->type)
    {
    case FFI_TYPE_UINT8:
    case FFI_TYPE_SINT8:
    case FFI_TYPE_UINT16:
    case FFI_TYPE_SINT16:
    case FFI_TYPE_UINT32:
    case FFI_TYPE_SINT32:
    case FFI_TYPE_UINT64:
    case FFI_TYPE_SINT64:
    case FFI_TYPE_POINTER:
    do_integer:
      {
	size_t size = byte_offset + type->size;

	if (size <= 4)
	  {
	    classes[0] = X86_64_INTEGERSI_CLASS;
	    return 1;
	  }
	else if (size <= 8)
	  {
	    classes[0] = X86_64_INTEGER_CLASS;
	    return 1;
	  }
	else if (size <= 12)
	  {
	    classes[0] = X86_64_INTEGER_CLASS;
	    classes[1] = X86_64_INTEGERSI_CLASS;
	    return 2;
	  }
	else if (size <= 16)
	  {
	    classes[0] = classes[1] = X86_64_INTEGER_CLASS;
	    return 2;
	  }
	else
	  FFI_ASSERT (0);
      }
    case FFI_TYPE_FLOAT:
      if (!(byte_offset % 8))
	classes[0] = X86_64_SSESF_CLASS;
      else
	classes[0] = X86_64_SSE_CLASS;
      return 1;
    case FFI_TYPE_DOUBLE:
      classes[0] = X86_64_SSEDF_CLASS;
      return 1;
#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
    case FFI_TYPE_LONGDOUBLE:
      classes[0] = X86_64_X87_CLASS;
      classes[1] = X86_64_X87UP_CLASS;
      return 2;
#endif
    case FFI_TYPE_STRUCT:
      {
	const size_t UNITS_PER_WORD = 8;
        size_t words = (type->size + byte_offset + UNITS_PER_WORD - 1)
                       / UNITS_PER_WORD;
	ffi_type **ptr;
	unsigned int i;
	enum x86_64_reg_class subclasses[MAX_CLASSES];

	/* If the struct is larger than 32 bytes, pass it on the stack.  */
	if (type->size > 32)
	  return 0;

	for (i = 0; i < words; i++)
	  classes[i] = X86_64_NO_CLASS;

	/* Zero sized arrays or structures are NO_CLASS.  We return 0 to
	   signalize memory class, so handle it as special case.  */
	if (!words)
	  {
    case FFI_TYPE_VOID:
	    classes[0] = X86_64_NO_CLASS;
	    return 1;
	  }

	/* Merge the fields of structure.  */
	for (ptr = type->elements; *ptr != NULL; ptr++)
	  {
	    size_t num, pos;

	    byte_offset = FFI_ALIGN (byte_offset, (*ptr)->alignment);

	    num = classify_argument (*ptr, subclasses, byte_offset % 8);
	    if (num == 0)
	      return 0;
            pos = byte_offset / 8;
            for (i = 0; i < num && (i + pos) < words; i++)
	      {
		size_t pos = byte_offset / 8;
		classes[i + pos] =
		  merge_classes (subclasses[i], classes[i + pos]);
	      }

	    byte_offset += (*ptr)->size;
	  }

	if (words > 2)
	  {
	    /* When size > 16 bytes, if the first one isn't
	       X86_64_SSE_CLASS or any other ones aren't
	       X86_64_SSEUP_CLASS, everything should be passed in
	       memory.  */
	    if (classes[0] != X86_64_SSE_CLASS)
	      return 0;

	    for (i = 1; i < words; i++)
	      if (classes[i] != X86_64_SSEUP_CLASS)
		return 0;
	  }

	/* Final merger cleanup.  */
	for (i = 0; i < words; i++)
	  {
	    /* If one class is MEMORY, everything should be passed in
	       memory.  */
	    if (classes[i] == X86_64_MEMORY_CLASS)
	      return 0;

	    /* The X86_64_SSEUP_CLASS should be always preceded by
	       X86_64_SSE_CLASS or X86_64_SSEUP_CLASS.  */
	    if (i > 1 && classes[i] == X86_64_SSEUP_CLASS
		&& classes[i - 1] != X86_64_SSE_CLASS
		&& classes[i - 1] != X86_64_SSEUP_CLASS)
	      {
		/* The first one should never be X86_64_SSEUP_CLASS.  */
		FFI_ASSERT (i != 0);
		classes[i] = X86_64_SSE_CLASS;
	      }

	    /*  If X86_64_X87UP_CLASS isn't preceded by X86_64_X87_CLASS,
		everything should be passed in memory.  */
	    if (i > 1 && classes[i] == X86_64_X87UP_CLASS
		&& (classes[i - 1] != X86_64_X87_CLASS))
	      {
		/* The first one should never be X86_64_X87UP_CLASS.  */
		FFI_ASSERT (i != 0);
		return 0;
	      }
	  }
	return words;
      }
    case FFI_TYPE_COMPLEX:
      {
	ffi_type *inner = type->elements[0];
	switch (inner->type)
	  {
	  case FFI_TYPE_INT:
	  case FFI_TYPE_UINT8:
	  case FFI_TYPE_SINT8:
	  case FFI_TYPE_UINT16:
	  case FFI_TYPE_SINT16:
	  case FFI_TYPE_UINT32:
	  case FFI_TYPE_SINT32:
	  case FFI_TYPE_UINT64:
	  case FFI_TYPE_SINT64:
	    goto do_integer;

	  case FFI_TYPE_FLOAT:
	    classes[0] = X86_64_SSE_CLASS;
	    if (byte_offset % 8)
	      {
		classes[1] = X86_64_SSESF_CLASS;
		return 2;
	      }
	    return 1;
	  case FFI_TYPE_DOUBLE:
	    classes[0] = classes[1] = X86_64_SSEDF_CLASS;
	    return 2;
#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
	  case FFI_TYPE_LONGDOUBLE:
	    classes[0] = X86_64_COMPLEX_X87_CLASS;
	    return 1;
#endif
	  }
      }
    }
  abort();
}

/* Examine the argument and return set number of register required in each
   class.  Return zero iff parameter should be passed in memory, otherwise
   the number of registers.  */

static size_t
examine_argument (ffi_type *type, enum x86_64_reg_class classes[MAX_CLASSES],
		  _Bool in_return, int *pngpr, int *pnsse)
{
  size_t n;
  unsigned int i;
  int ngpr, nsse;

  n = classify_argument (type, classes, 0);
  if (n == 0)
    return 0;

  ngpr = nsse = 0;
  for (i = 0; i < n; ++i)
    switch (classes[i])
      {
      case X86_64_INTEGER_CLASS:
      case X86_64_INTEGERSI_CLASS:
	ngpr++;
	break;
      case X86_64_SSE_CLASS:
      case X86_64_SSESF_CLASS:
      case X86_64_SSEDF_CLASS:
	nsse++;
	break;
      case X86_64_NO_CLASS:
      case X86_64_SSEUP_CLASS:
	break;
      case X86_64_X87_CLASS:
      case X86_64_X87UP_CLASS:
      case X86_64_COMPLEX_X87_CLASS:
	return in_return != 0;
      default:
	abort ();
      }

  *pngpr = ngpr;
  *pnsse = nsse;

  return n;
}

/* Perform machine dependent cif processing.  */

#ifndef __ILP32__
extern ffi_status
ffi_prep_cif_machdep_efi64(ffi_cif *cif);
#endif

ffi_status FFI_HIDDEN
ffi_prep_cif_machdep (ffi_cif *cif)
{
  int gprcount, ssecount, i, avn, ngpr, nsse;
  unsigned flags;
  enum x86_64_reg_class classes[MAX_CLASSES];
  size_t bytes, n, rtype_size;
  ffi_type *rtype;

#ifndef __ILP32__
  if (cif->abi == FFI_EFI64 || cif->abi == FFI_GNUW64)
    return ffi_prep_cif_machdep_efi64(cif);
#endif
  if (cif->abi != FFI_UNIX64)
    return FFI_BAD_ABI;

  gprcount = ssecount = 0;

  rtype = cif->rtype;
  rtype_size = rtype->size;
  switch (rtype->type)
    {
    case FFI_TYPE_VOID:
      flags = UNIX64_RET_VOID;
      break;
    case FFI_TYPE_UINT8:
      flags = UNIX64_RET_UINT8;
      break;
    case FFI_TYPE_SINT8:
      flags = UNIX64_RET_SINT8;
      break;
    case FFI_TYPE_UINT16:
      flags = UNIX64_RET_UINT16;
      break;
    case FFI_TYPE_SINT16:
      flags = UNIX64_RET_SINT16;
      break;
    case FFI_TYPE_UINT32:
      flags = UNIX64_RET_UINT32;
      break;
    case FFI_TYPE_INT:
    case FFI_TYPE_SINT32:
      flags = UNIX64_RET_SINT32;
      break;
    case FFI_TYPE_UINT64:
    case FFI_TYPE_SINT64:
      flags = UNIX64_RET_INT64;
      break;
    case FFI_TYPE_POINTER:
      flags = (sizeof(void *) == 4 ? UNIX64_RET_UINT32 : UNIX64_RET_INT64);
      break;
    case FFI_TYPE_FLOAT:
      flags = UNIX64_RET_XMM32;
      break;
    case FFI_TYPE_DOUBLE:
      flags = UNIX64_RET_XMM64;
      break;
#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
    case FFI_TYPE_LONGDOUBLE:
      flags = UNIX64_RET_X87;
      break;
#endif
    case FFI_TYPE_STRUCT:
      n = examine_argument (cif->rtype, classes, 1, &ngpr, &nsse);
      if (n == 0)
	{
	  /* The return value is passed in memory.  A pointer to that
	     memory is the first argument.  Allocate a register for it.  */
	  gprcount++;
	  /* We don't have to do anything in asm for the return.  */
	  flags = UNIX64_RET_VOID | UNIX64_FLAG_RET_IN_MEM;
	}
      else
	{
	  _Bool sse0 = SSE_CLASS_P (classes[0]);

	  if (rtype_size == 4 && sse0)
	    flags = UNIX64_RET_XMM32;
	  else if (rtype_size == 8)
	    flags = sse0 ? UNIX64_RET_XMM64 : UNIX64_RET_INT64;
	  else
	    {
	      _Bool sse1 = n == 2 && SSE_CLASS_P (classes[1]);
	      if (sse0 && sse1)
		flags = UNIX64_RET_ST_XMM0_XMM1;
	      else if (sse0)
		flags = UNIX64_RET_ST_XMM0_RAX;
	      else if (sse1)
		flags = UNIX64_RET_ST_RAX_XMM0;
	      else
		flags = UNIX64_RET_ST_RAX_RDX;
	      flags |= rtype_size << UNIX64_SIZE_SHIFT;
	    }
	}
      break;
    case FFI_TYPE_COMPLEX:
      switch (rtype->elements[0]->type)
	{
	case FFI_TYPE_UINT8:
	case FFI_TYPE_SINT8:
	case FFI_TYPE_UINT16:
	case FFI_TYPE_SINT16:
	case FFI_TYPE_INT:
	case FFI_TYPE_UINT32:
	case FFI_TYPE_SINT32:
	case FFI_TYPE_UINT64:
	case FFI_TYPE_SINT64:
	  flags = UNIX64_RET_ST_RAX_RDX | ((unsigned) rtype_size << UNIX64_SIZE_SHIFT);
	  break;
	case FFI_TYPE_FLOAT:
	  flags = UNIX64_RET_XMM64;
	  break;
	case FFI_TYPE_DOUBLE:
	  flags = UNIX64_RET_ST_XMM0_XMM1 | (16 << UNIX64_SIZE_SHIFT);
	  break;
#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
	case FFI_TYPE_LONGDOUBLE:
	  flags = UNIX64_RET_X87_2;
	  break;
#endif
	default:
	  return FFI_BAD_TYPEDEF;
	}
      break;
    default:
      return FFI_BAD_TYPEDEF;
    }

  /* Go over all arguments and determine the way they should be passed.
     If it's in a register and there is space for it, let that be so. If
     not, add it's size to the stack byte count.  */
  for (bytes = 0, i = 0, avn = cif->nargs; i < avn; i++)
    {
      if (examine_argument (cif->arg_types[i], classes, 0, &ngpr, &nsse) == 0
	  || gprcount + ngpr > MAX_GPR_REGS
	  || ssecount + nsse > MAX_SSE_REGS)
	{
	  long align = cif->arg_types[i]->alignment;

	  if (align < 8)
	    align = 8;

	  bytes = FFI_ALIGN (bytes, align);
	  bytes += cif->arg_types[i]->size;
	}
      else
	{
	  gprcount += ngpr;
	  ssecount += nsse;
	}
    }
  if (ssecount)
    flags |= UNIX64_FLAG_XMM_ARGS;

  cif->flags = flags;
  cif->bytes = (unsigned) FFI_ALIGN (bytes, 8);

  return FFI_OK;
}

static void
ffi_call_int (ffi_cif *cif, void (*fn)(void), void *rvalue,
	      void **avalue, void *closure)
{
  enum x86_64_reg_class classes[MAX_CLASSES];
  char *stack, *argp;
  ffi_type **arg_types;
  int gprcount, ssecount, ngpr, nsse, i, avn, flags;
  struct register_args *reg_args;

  /* Can't call 32-bit mode from 64-bit mode.  */
  FFI_ASSERT (cif->abi == FFI_UNIX64);

  /* If the return value is a struct and we don't have a return value
     address then we need to make one.  Otherwise we can ignore it.  */
  flags = cif->flags;
  if (rvalue == NULL)
    {
      if (flags & UNIX64_FLAG_RET_IN_MEM)
	rvalue = alloca (cif->rtype->size);
      else
	flags = UNIX64_RET_VOID;
    }

  arg_types = cif->arg_types;
  avn = cif->nargs;

  /* Allocate the space for the arguments, plus 4 words of temp space.  */
  stack = alloca (sizeof (struct register_args) + cif->bytes + 4*8);
  reg_args = (struct register_args *) stack;
  argp = stack + sizeof (struct register_args);

  reg_args->r10 = (uintptr_t) closure;

  gprcount = ssecount = 0;

  /* If the return value is passed in memory, add the pointer as the
     first integer argument.  */
  if (flags & UNIX64_FLAG_RET_IN_MEM)
    reg_args->gpr[gprcount++] = (unsigned long) rvalue;

  for (i = 0; i < avn; ++i)
    {
      size_t n, size = arg_types[i]->size;

      n = examine_argument (arg_types[i], classes, 0, &ngpr, &nsse);
      if (n == 0
	  || gprcount + ngpr > MAX_GPR_REGS
	  || ssecount + nsse > MAX_SSE_REGS)
	{
	  long align = arg_types[i]->alignment;

	  /* Stack arguments are *always* at least 8 byte aligned.  */
	  if (align < 8)
	    align = 8;

          /* Pass this argument in memory.  */
          argp = (void *) FFI_ALIGN (argp, align);
          memcpy (argp, avalue[i], size);

          argp += size;
        }
      else
	{
	  /* The argument is passed entirely in registers.  */
	  char *a = (char *) avalue[i];
	  unsigned int j;

	  for (j = 0; j < n; j++, a += 8, size -= 8)
	    {
	      switch (classes[j])
		{
		case X86_64_NO_CLASS:
		case X86_64_SSEUP_CLASS:
		  break;
		case X86_64_INTEGER_CLASS:
		case X86_64_INTEGERSI_CLASS:
		  /* Sign-extend integer arguments passed in general
		     purpose registers, to cope with the fact that
		     LLVM incorrectly assumes that this will be done
		     (the x86-64 PS ABI does not specify this). */
		  switch (arg_types[i]->type)
		    {
		    case FFI_TYPE_SINT8:
		      reg_args->gpr[gprcount] = (SINT64) *((SINT8 *) a);
		      break;
		    case FFI_TYPE_SINT16:
		      reg_args->gpr[gprcount] = (SINT64) *((SINT16 *) a);
		      break;
		    case FFI_TYPE_SINT32:
		      reg_args->gpr[gprcount] = (SINT64) *((SINT32 *) a);
		      break;
		    default:
		      reg_args->gpr[gprcount] = 0;
		      memcpy (&reg_args->gpr[gprcount], a, size);
		    }
		  gprcount++;
		  break;
		case X86_64_SSE_CLASS:
		case X86_64_SSEDF_CLASS:
		  memcpy (&reg_args->sse[ssecount++].i64, a, sizeof(UINT64));
		  break;
		case X86_64_SSESF_CLASS:
		  memcpy (&reg_args->sse[ssecount++].i32, a, sizeof(UINT32));
		  break;
		default:
		  abort();
		}
	    }
	}
    }
  reg_args->rax = ssecount;

  ffi_call_unix64 (stack, cif->bytes + sizeof (struct register_args),
		   flags, rvalue, fn);
}

#ifndef __ILP32__
extern void
ffi_call_efi64(ffi_cif *cif, void (*fn)(void), void *rvalue, void **avalue);
#endif

void
ffi_call (ffi_cif *cif, void (*fn)(void), void *rvalue, void **avalue)
{
  ffi_type **arg_types = cif->arg_types;
  int i, nargs = cif->nargs;
  const int max_reg_struct_size = cif->abi == FFI_GNUW64 ? 8 : 16;

  /* If we have any large structure arguments, make a copy so we are passing
     by value.  */
  for (i = 0; i < nargs; i++)
    {
      ffi_type *at = arg_types[i];
      int size = at->size;
      if (at->type == FFI_TYPE_STRUCT && size > max_reg_struct_size)
        {
          char *argcopy = alloca (size);
          memcpy (argcopy, avalue[i], size);
          avalue[i] = argcopy;
        }
    }

#ifndef __ILP32__
  if (cif->abi == FFI_EFI64 || cif->abi == FFI_GNUW64)
    {
      ffi_call_efi64(cif, fn, rvalue, avalue);
      return;
    }
#endif
  ffi_call_int (cif, fn, rvalue, avalue, NULL);
}

#ifdef FFI_GO_CLOSURES

#ifndef __ILP32__
extern void
ffi_call_go_efi64(ffi_cif *cif, void (*fn)(void), void *rvalue,
		  void **avalue, void *closure);
#endif

void
ffi_call_go (ffi_cif *cif, void (*fn)(void), void *rvalue,
	     void **avalue, void *closure)
{
#ifndef __ILP32__
  if (cif->abi == FFI_EFI64 || cif->abi == FFI_GNUW64)
    {
      ffi_call_go_efi64(cif, fn, rvalue, avalue, closure);
      return;
    }
#endif
  ffi_call_int (cif, fn, rvalue, avalue, closure);
}

#endif /* FFI_GO_CLOSURES */

extern void ffi_closure_unix64(void) FFI_HIDDEN;
extern void ffi_closure_unix64_sse(void) FFI_HIDDEN;
#if defined(FFI_EXEC_STATIC_TRAMP)
extern void ffi_closure_unix64_alt(void) FFI_HIDDEN;
extern void ffi_closure_unix64_sse_alt(void) FFI_HIDDEN;
#endif

#ifndef __ILP32__
extern ffi_status
ffi_prep_closure_loc_efi64(ffi_closure* closure,
			   ffi_cif* cif,
			   void (*fun)(ffi_cif*, void*, void**, void*),
			   void *user_data,
			   void *codeloc);
#endif

ffi_status
ffi_prep_closure_loc (ffi_closure* closure,
		      ffi_cif* cif,
		      void (*fun)(ffi_cif*, void*, void**, void*),
		      void *user_data,
		      void *codeloc)
{
  static const unsigned char trampoline[24] = {
    /* endbr64 */
    0xf3, 0x0f, 0x1e, 0xfa,
    /* leaq  -0xb(%rip),%r10   # 0x0  */
    0x4c, 0x8d, 0x15, 0xf5, 0xff, 0xff, 0xff,
    /* jmpq  *0x7(%rip)        # 0x18 */
    0xff, 0x25, 0x07, 0x00, 0x00, 0x00,
    /* nopl  0(%rax) */
    0x0f, 0x1f, 0x80, 0x00, 0x00, 0x00, 0x00
  };
  void (*dest)(void);
  char *tramp = closure->tramp;

#ifndef __ILP32__
  if (cif->abi == FFI_EFI64 || cif->abi == FFI_GNUW64)
    return ffi_prep_closure_loc_efi64(closure, cif, fun, user_data, codeloc);
#endif
  if (cif->abi != FFI_UNIX64)
    return FFI_BAD_ABI;

  if (cif->flags & UNIX64_FLAG_XMM_ARGS)
    dest = ffi_closure_unix64_sse;
  else
    dest = ffi_closure_unix64;

#if defined(FFI_EXEC_STATIC_TRAMP)
  if (ffi_tramp_is_present(closure))
    {
      /* Initialize the static trampoline's parameters. */
      if (dest == ffi_closure_unix64_sse)
        dest = ffi_closure_unix64_sse_alt;
      else
        dest = ffi_closure_unix64_alt;
      ffi_tramp_set_parms (closure->ftramp, dest, closure);
      goto out;
    }
#endif

  /* Initialize the dynamic trampoline. */
  memcpy (tramp, trampoline, sizeof(trampoline));
  *(UINT64 *)(tramp + sizeof (trampoline)) = (uintptr_t)dest;

#if defined(FFI_EXEC_STATIC_TRAMP)
out:
#endif
  closure->cif = cif;
  closure->fun = fun;
  closure->user_data = user_data;

  return FFI_OK;
}

int FFI_HIDDEN
ffi_closure_unix64_inner(ffi_cif *cif,
			 void (*fun)(ffi_cif*, void*, void**, void*),
			 void *user_data,
			 void *rvalue,
			 struct register_args *reg_args,
			 char *argp)
{
  void **avalue;
  ffi_type **arg_types;
  long i, avn;
  int gprcount, ssecount, ngpr, nsse;
  int flags;

  avn = cif->nargs;
  flags = cif->flags;
  avalue = alloca(avn * sizeof(void *));
  gprcount = ssecount = 0;

  if (flags & UNIX64_FLAG_RET_IN_MEM)
    {
      /* On return, %rax will contain the address that was passed
	 by the caller in %rdi.  */
      void *r = (void *)(uintptr_t)reg_args->gpr[gprcount++];
      *(void **)rvalue = r;
      rvalue = r;
      flags = (sizeof(void *) == 4 ? UNIX64_RET_UINT32 : UNIX64_RET_INT64);
    }

  arg_types = cif->arg_types;
  for (i = 0; i < avn; ++i)
    {
      enum x86_64_reg_class classes[MAX_CLASSES];
      size_t n;

      n = examine_argument (arg_types[i], classes, 0, &ngpr, &nsse);
      if (n == 0
	  || gprcount + ngpr > MAX_GPR_REGS
	  || ssecount + nsse > MAX_SSE_REGS)
	{
	  long align = arg_types[i]->alignment;

	  /* Stack arguments are *always* at least 8 byte aligned.  */
	  if (align < 8)
	    align = 8;

	  /* Pass this argument in memory.  */
	  argp = (void *) FFI_ALIGN (argp, align);
	  avalue[i] = argp;
	  argp += arg_types[i]->size;
	}
      /* If the argument is in a single register, or two consecutive
	 integer registers, then we can use that address directly.  */
      else if (n == 1
	       || (n == 2 && !(SSE_CLASS_P (classes[0])
			       || SSE_CLASS_P (classes[1]))))
	{
	  /* The argument is in a single register.  */
	  if (SSE_CLASS_P (classes[0]))
	    {
	      avalue[i] = &reg_args->sse[ssecount];
	      ssecount += n;
	    }
	  else
	    {
	      avalue[i] = &reg_args->gpr[gprcount];
	      gprcount += n;
	    }
	}
      /* Otherwise, allocate space to make them consecutive.  */
      else
	{
	  char *a = alloca (16);
	  unsigned int j;

	  avalue[i] = a;
	  for (j = 0; j < n; j++, a += 8)
	    {
	      if (SSE_CLASS_P (classes[j]))
		memcpy (a, &reg_args->sse[ssecount++], 8);
	      else
		memcpy (a, &reg_args->gpr[gprcount++], 8);
	    }
	}
    }

  /* Invoke the closure.  */
  fun (cif, rvalue, avalue, user_data);

  /* Tell assembly how to perform return type promotions.  */
  return flags;
}

#ifdef FFI_GO_CLOSURES

extern void ffi_go_closure_unix64(void) FFI_HIDDEN;
extern void ffi_go_closure_unix64_sse(void) FFI_HIDDEN;

#ifndef __ILP32__
extern ffi_status
ffi_prep_go_closure_efi64(ffi_go_closure* closure, ffi_cif* cif,
			  void (*fun)(ffi_cif*, void*, void**, void*));
#endif

ffi_status
ffi_prep_go_closure (ffi_go_closure* closure, ffi_cif* cif,
		     void (*fun)(ffi_cif*, void*, void**, void*))
{
#ifndef __ILP32__
  if (cif->abi == FFI_EFI64 || cif->abi == FFI_GNUW64)
    return ffi_prep_go_closure_efi64(closure, cif, fun);
#endif
  if (cif->abi != FFI_UNIX64)
    return FFI_BAD_ABI;

  closure->tramp = (cif->flags & UNIX64_FLAG_XMM_ARGS
		    ? ffi_go_closure_unix64_sse
		    : ffi_go_closure_unix64);
  closure->cif = cif;
  closure->fun = fun;

  return FFI_OK;
}

#endif /* FFI_GO_CLOSURES */

#if defined(FFI_EXEC_STATIC_TRAMP)
void *
ffi_tramp_arch (size_t *tramp_size, size_t *map_size)
{
  extern void *trampoline_code_table;

  *map_size = UNIX64_TRAMP_MAP_SIZE;
  *tramp_size = UNIX64_TRAMP_SIZE;
  return &trampoline_code_table;
}
#endif

#endif /* __x86_64__ */
