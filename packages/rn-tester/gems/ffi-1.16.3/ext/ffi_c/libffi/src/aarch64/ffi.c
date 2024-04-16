/* Copyright (c) 2009, 2010, 2011, 2012 ARM Ltd.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
``Software''), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED ``AS IS'', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.  */

#if defined(__aarch64__) || defined(__arm64__)|| defined (_M_ARM64)
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <fficonfig.h>
#include <ffi.h>
#include <ffi_common.h>
#include "internal.h"
#ifdef _WIN32
#include <windows.h> /* FlushInstructionCache */
#endif
#include <tramp.h>

/* Force FFI_TYPE_LONGDOUBLE to be different than FFI_TYPE_DOUBLE;
   all further uses in this file will refer to the 128-bit type.  */
#if FFI_TYPE_DOUBLE != FFI_TYPE_LONGDOUBLE
# if FFI_TYPE_LONGDOUBLE != 4
#  error FFI_TYPE_LONGDOUBLE out of date
# endif
#else
# undef FFI_TYPE_LONGDOUBLE
# define FFI_TYPE_LONGDOUBLE 4
#endif

union _d
{
  UINT64 d;
  UINT32 s[2];
};

struct _v
{
  union _d d[2] __attribute__((aligned(16)));
};

struct call_context
{
  struct _v v[N_V_ARG_REG];
  UINT64 x[N_X_ARG_REG];
};

#if FFI_EXEC_TRAMPOLINE_TABLE

#ifdef __MACH__
#ifdef HAVE_PTRAUTH
#include <ptrauth.h>
#endif
#include <mach/vm_param.h>
#endif

#else

#if defined (__clang__) && defined (__APPLE__)
extern void sys_icache_invalidate (void *start, size_t len);
#endif

static inline void
ffi_clear_cache (void *start, void *end)
{
#if defined (__clang__) && defined (__APPLE__)
  sys_icache_invalidate (start, (char *)end - (char *)start);
#elif defined (__GNUC__)
  __builtin___clear_cache (start, end);
#elif defined (_WIN32)
  FlushInstructionCache(GetCurrentProcess(), start, (char*)end - (char*)start);
#else
#error "Missing builtin to flush instruction cache"
#endif
}

#endif

/* A subroutine of is_vfp_type.  Given a structure type, return the type code
   of the first non-structure element.  Recurse for structure elements.
   Return -1 if the structure is in fact empty, i.e. no nested elements.  */

static int
is_hfa0 (const ffi_type *ty)
{
  ffi_type **elements = ty->elements;
  int i, ret = -1;

  if (elements != NULL)
    for (i = 0; elements[i]; ++i)
      {
        ret = elements[i]->type;
        if (ret == FFI_TYPE_STRUCT || ret == FFI_TYPE_COMPLEX)
          {
            ret = is_hfa0 (elements[i]);
            if (ret < 0)
              continue;
          }
        break;
      }

  return ret;
}

/* A subroutine of is_vfp_type.  Given a structure type, return true if all
   of the non-structure elements are the same as CANDIDATE.  */

static int
is_hfa1 (const ffi_type *ty, int candidate)
{
  ffi_type **elements = ty->elements;
  int i;

  if (elements != NULL)
    for (i = 0; elements[i]; ++i)
      {
        int t = elements[i]->type;
        if (t == FFI_TYPE_STRUCT || t == FFI_TYPE_COMPLEX)
          {
            if (!is_hfa1 (elements[i], candidate))
              return 0;
          }
        else if (t != candidate)
          return 0;
      }

  return 1;
}

/* Determine if TY may be allocated to the FP registers.  This is both an
   fp scalar type as well as an homogenous floating point aggregate (HFA).
   That is, a structure consisting of 1 to 4 members of all the same type,
   where that type is an fp scalar.

   Returns non-zero iff TY is an HFA.  The result is the AARCH64_RET_*
   constant for the type.  */

static int
is_vfp_type (const ffi_type *ty)
{
  ffi_type **elements;
  int candidate, i;
  size_t size, ele_count;

  /* Quickest tests first.  */
  candidate = ty->type;
  switch (candidate)
    {
    default:
      return 0;
    case FFI_TYPE_FLOAT:
    case FFI_TYPE_DOUBLE:
    case FFI_TYPE_LONGDOUBLE:
      ele_count = 1;
      goto done;
    case FFI_TYPE_COMPLEX:
      candidate = ty->elements[0]->type;
      switch (candidate)
	{
	case FFI_TYPE_FLOAT:
	case FFI_TYPE_DOUBLE:
	case FFI_TYPE_LONGDOUBLE:
	  ele_count = 2;
	  goto done;
	}
      return 0;
    case FFI_TYPE_STRUCT:
      break;
    }

  /* No HFA types are smaller than 4 bytes, or larger than 64 bytes.  */
  size = ty->size;
  if (size < 4 || size > 64)
    return 0;

  /* Find the type of the first non-structure member.  */
  elements = ty->elements;
  candidate = elements[0]->type;
  if (candidate == FFI_TYPE_STRUCT || candidate == FFI_TYPE_COMPLEX)
    {
      for (i = 0; ; ++i)
        {
          candidate = is_hfa0 (elements[i]);
          if (candidate >= 0)
            break;
        }
    }

  /* If the first member is not a floating point type, it's not an HFA.
     Also quickly re-check the size of the structure.  */
  switch (candidate)
    {
    case FFI_TYPE_FLOAT:
      ele_count = size / sizeof(float);
      if (size != ele_count * sizeof(float))
        return 0;
      break;
    case FFI_TYPE_DOUBLE:
      ele_count = size / sizeof(double);
      if (size != ele_count * sizeof(double))
        return 0;
      break;
    case FFI_TYPE_LONGDOUBLE:
      ele_count = size / sizeof(long double);
      if (size != ele_count * sizeof(long double))
        return 0;
      break;
    default:
      return 0;
    }
  if (ele_count > 4)
    return 0;

  /* Finally, make sure that all scalar elements are the same type.  */
  for (i = 0; elements[i]; ++i)
    {
      int t = elements[i]->type;
      if (t == FFI_TYPE_STRUCT || t == FFI_TYPE_COMPLEX)
        {
          if (!is_hfa1 (elements[i], candidate))
            return 0;
        }
      else if (t != candidate)
        return 0;
    }

  /* All tests succeeded.  Encode the result.  */
 done:
  return candidate * 4 + (4 - (int)ele_count);
}

/* Representation of the procedure call argument marshalling
   state.

   The terse state variable names match the names used in the AARCH64
   PCS.

   The struct area is allocated downwards from the top of the argument
   area.  It is used to hold copies of structures passed by value that are
   bigger than 16 bytes.  */

struct arg_state
{
  unsigned ngrn;                /* Next general-purpose register number. */
  unsigned nsrn;                /* Next vector register number. */
  size_t nsaa;                  /* Next stack offset. */
  size_t next_struct_area;	/* Place to allocate big structs. */

#if defined (__APPLE__)
  unsigned allocating_variadic;
#endif
};

/* Initialize a procedure call argument marshalling state.  */
static void
arg_init (struct arg_state *state, size_t size)
{
  state->ngrn = 0;
  state->nsrn = 0;
  state->nsaa = 0;
  state->next_struct_area = size;
#if defined (__APPLE__)
  state->allocating_variadic = 0;
#endif
}

/* Allocate an aligned slot on the stack and return a pointer to it.  */
static void *
allocate_to_stack (struct arg_state *state, void *stack,
		   size_t alignment, size_t size)
{
  size_t nsaa = state->nsaa;

  /* Round up the NSAA to the larger of 8 or the natural
     alignment of the argument's type.  */
#if defined (__APPLE__)
  if (state->allocating_variadic && alignment < 8)
    alignment = 8;
#else
  if (alignment < 8)
    alignment = 8;
#endif

  nsaa = FFI_ALIGN (nsaa, alignment);
  state->nsaa = nsaa + size;

  return (char *)stack + nsaa;
}

/* Allocate and copy a structure that is passed by value on the stack and
   return a pointer to it.  */
static void *
allocate_and_copy_struct_to_stack (struct arg_state *state, void *stack,
				   size_t alignment, size_t size, void *value)
{
  size_t dest = state->next_struct_area - size;

  /* Round down to the natural alignment of the value.  */
  dest = FFI_ALIGN_DOWN (dest, alignment);
  state->next_struct_area = dest;

  return memcpy ((char *) stack + dest, value, size);
}

static ffi_arg
extend_integer_type (void *source, int type)
{
  switch (type)
    {
    case FFI_TYPE_UINT8:
      {
        UINT8 u8;
        memcpy (&u8, source, sizeof (u8));
        return u8;
      }
    case FFI_TYPE_SINT8:
      {
        SINT8 s8;
        memcpy (&s8, source, sizeof (s8));
        return s8;
      }
    case FFI_TYPE_UINT16:
      {
        UINT16 u16;
        memcpy (&u16, source, sizeof (u16));
        return u16;
      }
    case FFI_TYPE_SINT16:
      {
        SINT16 s16;
        memcpy (&s16, source, sizeof (s16));
        return s16;
      }
    case FFI_TYPE_UINT32:
      {
        UINT32 u32;
        memcpy (&u32, source, sizeof (u32));
        return u32;
      }
    case FFI_TYPE_INT:
    case FFI_TYPE_SINT32:
      {
        SINT32 s32;
        memcpy (&s32, source, sizeof (s32));
        return s32;
      }
    case FFI_TYPE_UINT64:
    case FFI_TYPE_SINT64:
      {
        UINT64 u64;
        memcpy (&u64, source, sizeof (u64));
        return u64;
      }
    case FFI_TYPE_POINTER:
      {
        uintptr_t uptr;
        memcpy (&uptr, source, sizeof (uptr));
        return uptr;
      }
    default:
      abort();
    }
}

#if defined(_MSC_VER)
void extend_hfa_type (void *dest, void *src, int h);
#else
static void
extend_hfa_type (void *dest, void *src, int h)
{
  ssize_t f = h - AARCH64_RET_S4;
  void *x0;

  asm volatile (
	"adr	%0, 0f\n"
"	add	%0, %0, %1\n"
"	br	%0\n"
"0:	ldp	s16, s17, [%3]\n"	/* S4 */
"	ldp	s18, s19, [%3, #8]\n"
"	b	4f\n"
"	ldp	s16, s17, [%3]\n"	/* S3 */
"	ldr	s18, [%3, #8]\n"
"	b	3f\n"
"	ldp	s16, s17, [%3]\n"	/* S2 */
"	b	2f\n"
"	nop\n"
"	ldr	s16, [%3]\n"		/* S1 */
"	b	1f\n"
"	nop\n"
"	ldp	d16, d17, [%3]\n"	/* D4 */
"	ldp	d18, d19, [%3, #16]\n"
"	b	4f\n"
"	ldp	d16, d17, [%3]\n"	/* D3 */
"	ldr	d18, [%3, #16]\n"
"	b	3f\n"
"	ldp	d16, d17, [%3]\n"	/* D2 */
"	b	2f\n"
"	nop\n"
"	ldr	d16, [%3]\n"		/* D1 */
"	b	1f\n"
"	nop\n"
"	ldp	q16, q17, [%3]\n"	/* Q4 */
"	ldp	q18, q19, [%3, #32]\n"
"	b	4f\n"
"	ldp	q16, q17, [%3]\n"	/* Q3 */
"	ldr	q18, [%3, #32]\n"
"	b	3f\n"
"	ldp	q16, q17, [%3]\n"	/* Q2 */
"	b	2f\n"
"	nop\n"
"	ldr	q16, [%3]\n"		/* Q1 */
"	b	1f\n"
"4:	str	q19, [%2, #48]\n"
"3:	str	q18, [%2, #32]\n"
"2:	str	q17, [%2, #16]\n"
"1:	str	q16, [%2]"
    : "=&r"(x0)
    : "r"(f * 12), "r"(dest), "r"(src)
    : "memory", "v16", "v17", "v18", "v19");
}
#endif

#if defined(_MSC_VER)
void* compress_hfa_type (void *dest, void *src, int h);
#else
static void *
compress_hfa_type (void *dest, void *reg, int h)
{
  switch (h)
    {
    case AARCH64_RET_S1:
      if (dest == reg)
	{
#ifdef __AARCH64EB__
	  dest += 12;
#endif
	}
      else
	*(float *)dest = *(float *)reg;
      break;
    case AARCH64_RET_S2:
      asm ("ldp q16, q17, [%1]\n\t"
	   "st2 { v16.s, v17.s }[0], [%0]"
	   : : "r"(dest), "r"(reg) : "memory", "v16", "v17");
      break;
    case AARCH64_RET_S3:
      asm ("ldp q16, q17, [%1]\n\t"
	   "ldr q18, [%1, #32]\n\t"
	   "st3 { v16.s, v17.s, v18.s }[0], [%0]"
	   : : "r"(dest), "r"(reg) : "memory", "v16", "v17", "v18");
      break;
    case AARCH64_RET_S4:
      asm ("ldp q16, q17, [%1]\n\t"
	   "ldp q18, q19, [%1, #32]\n\t"
	   "st4 { v16.s, v17.s, v18.s, v19.s }[0], [%0]"
	   : : "r"(dest), "r"(reg) : "memory", "v16", "v17", "v18", "v19");
      break;

    case AARCH64_RET_D1:
      if (dest == reg)
	{
#ifdef __AARCH64EB__
	  dest += 8;
#endif
	}
      else
	*(double *)dest = *(double *)reg;
      break;
    case AARCH64_RET_D2:
      asm ("ldp q16, q17, [%1]\n\t"
	   "st2 { v16.d, v17.d }[0], [%0]"
	   : : "r"(dest), "r"(reg) : "memory", "v16", "v17");
      break;
    case AARCH64_RET_D3:
      asm ("ldp q16, q17, [%1]\n\t"
	   "ldr q18, [%1, #32]\n\t"
	   "st3 { v16.d, v17.d, v18.d }[0], [%0]"
	   : : "r"(dest), "r"(reg) : "memory", "v16", "v17", "v18");
      break;
    case AARCH64_RET_D4:
      asm ("ldp q16, q17, [%1]\n\t"
	   "ldp q18, q19, [%1, #32]\n\t"
	   "st4 { v16.d, v17.d, v18.d, v19.d }[0], [%0]"
	   : : "r"(dest), "r"(reg) : "memory", "v16", "v17", "v18", "v19");
      break;

    default:
      if (dest != reg)
	return memcpy (dest, reg, 16 * (4 - (h & 3)));
      break;
    }
  return dest;
}
#endif

/* Either allocate an appropriate register for the argument type, or if
   none are available, allocate a stack slot and return a pointer
   to the allocated space.  */

static void *
allocate_int_to_reg_or_stack (struct call_context *context,
			      struct arg_state *state,
			      void *stack, size_t size)
{
  if (state->ngrn < N_X_ARG_REG)
    return &context->x[state->ngrn++];

  state->ngrn = N_X_ARG_REG;
  return allocate_to_stack (state, stack, size, size);
}

ffi_status FFI_HIDDEN
ffi_prep_cif_machdep (ffi_cif *cif)
{
  ffi_type *rtype = cif->rtype;
  size_t bytes = cif->bytes;
  int flags, i, n;

  switch (rtype->type)
    {
    case FFI_TYPE_VOID:
      flags = AARCH64_RET_VOID;
      break;
    case FFI_TYPE_UINT8:
      flags = AARCH64_RET_UINT8;
      break;
    case FFI_TYPE_UINT16:
      flags = AARCH64_RET_UINT16;
      break;
    case FFI_TYPE_UINT32:
      flags = AARCH64_RET_UINT32;
      break;
    case FFI_TYPE_SINT8:
      flags = AARCH64_RET_SINT8;
      break;
    case FFI_TYPE_SINT16:
      flags = AARCH64_RET_SINT16;
      break;
    case FFI_TYPE_INT:
    case FFI_TYPE_SINT32:
      flags = AARCH64_RET_SINT32;
      break;
    case FFI_TYPE_SINT64:
    case FFI_TYPE_UINT64:
      flags = AARCH64_RET_INT64;
      break;
    case FFI_TYPE_POINTER:
      flags = (sizeof(void *) == 4 ? AARCH64_RET_UINT32 : AARCH64_RET_INT64);
      break;

    case FFI_TYPE_FLOAT:
    case FFI_TYPE_DOUBLE:
    case FFI_TYPE_LONGDOUBLE:
    case FFI_TYPE_STRUCT:
    case FFI_TYPE_COMPLEX:
      flags = is_vfp_type (rtype);
      if (flags == 0)
	{
	  size_t s = rtype->size;
	  if (s > 16)
	    {
	      flags = AARCH64_RET_VOID | AARCH64_RET_IN_MEM;
	      bytes += 8;
	    }
	  else if (s == 16)
	    flags = AARCH64_RET_INT128;
	  else if (s == 8)
	    flags = AARCH64_RET_INT64;
	  else
	    flags = AARCH64_RET_INT128 | AARCH64_RET_NEED_COPY;
	}
      break;

    default:
      abort();
    }

  for (i = 0, n = cif->nargs; i < n; i++)
    if (is_vfp_type (cif->arg_types[i]))
      {
	flags |= AARCH64_FLAG_ARG_V;
	break;
      }

  /* Round the stack up to a multiple of the stack alignment requirement. */
  cif->bytes = (unsigned) FFI_ALIGN(bytes, 16);
  cif->flags = flags;
#if defined (__APPLE__)
  cif->aarch64_nfixedargs = 0;
#endif

  return FFI_OK;
}

#if defined (__APPLE__)
/* Perform Apple-specific cif processing for variadic calls */
ffi_status FFI_HIDDEN
ffi_prep_cif_machdep_var(ffi_cif *cif, unsigned int nfixedargs,
			 unsigned int ntotalargs)
{
  ffi_status status = ffi_prep_cif_machdep (cif);
  cif->aarch64_nfixedargs = nfixedargs;
  return status;
}
#else
ffi_status FFI_HIDDEN
ffi_prep_cif_machdep_var(ffi_cif *cif, unsigned int nfixedargs, unsigned int ntotalargs)
{
  ffi_status status = ffi_prep_cif_machdep (cif);
  cif->flags |= AARCH64_FLAG_VARARG;
  return status;
}
#endif /* __APPLE__ */

extern void ffi_call_SYSV (struct call_context *context, void *frame,
			   void (*fn)(void), void *rvalue, int flags,
			   void *closure) FFI_HIDDEN;

/* Call a function with the provided arguments and capture the return
   value.  */
static void
ffi_call_int (ffi_cif *cif, void (*fn)(void), void *orig_rvalue,
	      void **avalue, void *closure)
{
  struct call_context *context;
  void *stack, *frame, *rvalue;
  struct arg_state state;
  size_t stack_bytes, rtype_size, rsize;
  int i, nargs, flags, isvariadic = 0;
  ffi_type *rtype;

  flags = cif->flags;
  rtype = cif->rtype;
  rtype_size = rtype->size;
  stack_bytes = cif->bytes;

  if (flags & AARCH64_FLAG_VARARG)
  {
    isvariadic = 1;
    flags &= ~AARCH64_FLAG_VARARG;
  }

  /* If the target function returns a structure via hidden pointer,
     then we cannot allow a null rvalue.  Otherwise, mash a null
     rvalue to void return type.  */
  rsize = 0;
  if (flags & AARCH64_RET_IN_MEM)
    {
      if (orig_rvalue == NULL)
	rsize = rtype_size;
    }
  else if (orig_rvalue == NULL)
    flags &= AARCH64_FLAG_ARG_V;
  else if (flags & AARCH64_RET_NEED_COPY)
    rsize = 16;

  /* Allocate consectutive stack for everything we'll need.
     The frame uses 40 bytes for: lr, fp, rvalue, flags, sp */
  context = alloca (sizeof(struct call_context) + stack_bytes + 40 + rsize);
  stack = context + 1;
  frame = (void*)((uintptr_t)stack + (uintptr_t)stack_bytes);
  rvalue = (rsize ? (void*)((uintptr_t)frame + 40) : orig_rvalue);

  arg_init (&state, stack_bytes);
  for (i = 0, nargs = cif->nargs; i < nargs; i++)
    {
      ffi_type *ty = cif->arg_types[i];
      size_t s = ty->size;
      void *a = avalue[i];
      int h, t;
      void *dest;

      t = ty->type;
      switch (t)
	{
	case FFI_TYPE_VOID:
	  FFI_ASSERT (0);
	  break;

	/* If the argument is a basic type the argument is allocated to an
	   appropriate register, or if none are available, to the stack.  */
	case FFI_TYPE_INT:
	case FFI_TYPE_UINT8:
	case FFI_TYPE_SINT8:
	case FFI_TYPE_UINT16:
	case FFI_TYPE_SINT16:
	case FFI_TYPE_UINT32:
	case FFI_TYPE_SINT32:
	case FFI_TYPE_UINT64:
	case FFI_TYPE_SINT64:
	case FFI_TYPE_POINTER:
	do_pointer:
	  {
	    ffi_arg ext = extend_integer_type (a, t);
	    if (state.ngrn < N_X_ARG_REG)
	      context->x[state.ngrn++] = ext;
	    else
	      {
		void *d = allocate_to_stack (&state, stack, ty->alignment, s);
		state.ngrn = N_X_ARG_REG;
		/* Note that the default abi extends each argument
		   to a full 64-bit slot, while the iOS abi allocates
		   only enough space. */
#ifdef __APPLE__
		memcpy(d, a, s);
#else
		*(ffi_arg *)d = ext;
#endif
	      }
	  }
	  break;

	case FFI_TYPE_FLOAT:
	case FFI_TYPE_DOUBLE:
	case FFI_TYPE_LONGDOUBLE:
	case FFI_TYPE_STRUCT:
	case FFI_TYPE_COMPLEX:
	  {
	    h = is_vfp_type (ty);
	    if (h)
	      {
              int elems = 4 - (h & 3);
              if (cif->abi == FFI_WIN64 && isvariadic)
              {
                if (state.ngrn + elems <= N_X_ARG_REG)
                {
                  dest = &context->x[state.ngrn];
                  state.ngrn += elems;
                  extend_hfa_type(dest, a, h);
                  break;
                }
                state.nsrn = N_X_ARG_REG;
                dest = allocate_to_stack(&state, stack, ty->alignment, s);
              }
              else
              {
                if (state.nsrn + elems <= N_V_ARG_REG)
                {
                  dest = &context->v[state.nsrn];
                  state.nsrn += elems;
                  extend_hfa_type (dest, a, h);
                  break;
                }
                state.nsrn = N_V_ARG_REG;
                dest = allocate_to_stack (&state, stack, ty->alignment, s);
              }
	      }
	    else if (s > 16)
	      {
		/* If the argument is a composite type that is larger than 16
		   bytes, then the argument is copied to memory, and
		   the argument is replaced by a pointer to the copy.  */
		dest = allocate_and_copy_struct_to_stack (&state, stack,
							  ty->alignment, s,
							  avalue[i]);
		a = &dest;
		t = FFI_TYPE_POINTER;
		s = sizeof (void *);
		goto do_pointer;
	      }
	    else
	      {
		size_t n = (s + 7) / 8;
		if (state.ngrn + n <= N_X_ARG_REG)
		  {
		    /* If the argument is a composite type and the size in
		       double-words is not more than the number of available
		       X registers, then the argument is copied into
		       consecutive X registers.  */
		    dest = &context->x[state.ngrn];
                    state.ngrn += (unsigned int)n;
		  }
		else
		  {
		    /* Otherwise, there are insufficient X registers. Further
		       X register allocations are prevented, the NSAA is
		       adjusted and the argument is copied to memory at the
		       adjusted NSAA.  */
		    state.ngrn = N_X_ARG_REG;
		    dest = allocate_to_stack (&state, stack, ty->alignment, s);
		  }
		}
	      memcpy (dest, a, s);
	    }
	  break;

	default:
	  abort();
	}

#if defined (__APPLE__)
      if (i + 1 == cif->aarch64_nfixedargs)
	{
	  state.ngrn = N_X_ARG_REG;
	  state.nsrn = N_V_ARG_REG;
	  state.allocating_variadic = 1;
	}
#endif
    }

  ffi_call_SYSV (context, frame, fn, rvalue, flags, closure);

  if (flags & AARCH64_RET_NEED_COPY)
    memcpy (orig_rvalue, rvalue, rtype_size);
}

void
ffi_call (ffi_cif *cif, void (*fn) (void), void *rvalue, void **avalue)
{
  ffi_call_int (cif, fn, rvalue, avalue, NULL);
}

#if FFI_CLOSURES

#ifdef FFI_GO_CLOSURES
void
ffi_call_go (ffi_cif *cif, void (*fn) (void), void *rvalue,
	     void **avalue, void *closure)
{
  ffi_call_int (cif, fn, rvalue, avalue, closure);
}
#endif /* FFI_GO_CLOSURES */

/* Build a trampoline.  */

extern void ffi_closure_SYSV (void) FFI_HIDDEN;
extern void ffi_closure_SYSV_V (void) FFI_HIDDEN;
#if defined(FFI_EXEC_STATIC_TRAMP)
extern void ffi_closure_SYSV_alt (void) FFI_HIDDEN;
extern void ffi_closure_SYSV_V_alt (void) FFI_HIDDEN;
#endif

ffi_status
ffi_prep_closure_loc (ffi_closure *closure,
                      ffi_cif* cif,
                      void (*fun)(ffi_cif*,void*,void**,void*),
                      void *user_data,
                      void *codeloc)
{
  if (cif->abi != FFI_SYSV && cif->abi != FFI_WIN64)
    return FFI_BAD_ABI;

  void (*start)(void);

  if (cif->flags & AARCH64_FLAG_ARG_V)
    start = ffi_closure_SYSV_V;
  else
    start = ffi_closure_SYSV;

#if FFI_EXEC_TRAMPOLINE_TABLE
# ifdef __MACH__
#  ifdef HAVE_PTRAUTH
  codeloc = ptrauth_auth_data(codeloc, ptrauth_key_function_pointer, 0);
#  endif
  void **config = (void **)((uint8_t *)codeloc - PAGE_MAX_SIZE);
  config[0] = closure;
  config[1] = start;
# endif
#else
  static const unsigned char trampoline[16] = {
    0x90, 0x00, 0x00, 0x58,	/* ldr	x16, tramp+16	*/
    0xf1, 0xff, 0xff, 0x10,	/* adr	x17, tramp+0	*/
    0x00, 0x02, 0x1f, 0xd6	/* br	x16		*/
  };
  char *tramp = closure->tramp;

# if defined(FFI_EXEC_STATIC_TRAMP)
  if (ffi_tramp_is_present(closure))
    {
      /* Initialize the static trampoline's parameters. */
      if (start == ffi_closure_SYSV_V)
          start = ffi_closure_SYSV_V_alt;
      else
          start = ffi_closure_SYSV_alt;
      ffi_tramp_set_parms (closure->ftramp, start, closure);
      goto out;
    }
# endif

  /* Initialize the dynamic trampoline. */
  memcpy (tramp, trampoline, sizeof(trampoline));

  *(UINT64 *)(tramp + 16) = (uintptr_t)start;

  ffi_clear_cache(tramp, tramp + FFI_TRAMPOLINE_SIZE);

  /* Also flush the cache for code mapping.  */
# ifdef _WIN32
  // Not using dlmalloc.c for Windows ARM64 builds
  // so calling ffi_data_to_code_pointer() isn't necessary
  unsigned char *tramp_code = tramp;
# else
  unsigned char *tramp_code = ffi_data_to_code_pointer (tramp);
# endif
  ffi_clear_cache (tramp_code, tramp_code + FFI_TRAMPOLINE_SIZE);
# if defined(FFI_EXEC_STATIC_TRAMP)
out:
# endif
#endif

  closure->cif = cif;
  closure->fun = fun;
  closure->user_data = user_data;

  return FFI_OK;
}

#ifdef FFI_GO_CLOSURES
extern void ffi_go_closure_SYSV (void) FFI_HIDDEN;
extern void ffi_go_closure_SYSV_V (void) FFI_HIDDEN;

ffi_status
ffi_prep_go_closure (ffi_go_closure *closure, ffi_cif* cif,
                     void (*fun)(ffi_cif*,void*,void**,void*))
{
  void (*start)(void);

  if (cif->abi != FFI_SYSV && cif->abi != FFI_WIN64)
    return FFI_BAD_ABI;

  if (cif->flags & AARCH64_FLAG_ARG_V)
    start = ffi_go_closure_SYSV_V;
  else
    start = ffi_go_closure_SYSV;

  closure->tramp = start;
  closure->cif = cif;
  closure->fun = fun;

  return FFI_OK;
}
#endif /* FFI_GO_CLOSURES */

/* Primary handler to setup and invoke a function within a closure.

   A closure when invoked enters via the assembler wrapper
   ffi_closure_SYSV(). The wrapper allocates a call context on the
   stack, saves the interesting registers (from the perspective of
   the calling convention) into the context then passes control to
   ffi_closure_SYSV_inner() passing the saved context and a pointer to
   the stack at the point ffi_closure_SYSV() was invoked.

   On the return path the assembler wrapper will reload call context
   registers.

   ffi_closure_SYSV_inner() marshalls the call context into ffi value
   descriptors, invokes the wrapped function, then marshalls the return
   value back into the call context.  */

int FFI_HIDDEN
ffi_closure_SYSV_inner (ffi_cif *cif,
			void (*fun)(ffi_cif*,void*,void**,void*),
			void *user_data,
			struct call_context *context,
			void *stack, void *rvalue, void *struct_rvalue)
{
  void **avalue = (void**) alloca (cif->nargs * sizeof (void*));
  int i, h, nargs, flags, isvariadic = 0;
  struct arg_state state;

  arg_init (&state, cif->bytes);

  flags = cif->flags;
  if (flags & AARCH64_FLAG_VARARG)
  {
    isvariadic = 1;
    flags &= ~AARCH64_FLAG_VARARG;
  }

  for (i = 0, nargs = cif->nargs; i < nargs; i++)
    {
      ffi_type *ty = cif->arg_types[i];
      int t = ty->type;
      size_t n, s = ty->size;

      switch (t)
	{
	case FFI_TYPE_VOID:
	  FFI_ASSERT (0);
	  break;

	case FFI_TYPE_INT:
	case FFI_TYPE_UINT8:
	case FFI_TYPE_SINT8:
	case FFI_TYPE_UINT16:
	case FFI_TYPE_SINT16:
	case FFI_TYPE_UINT32:
	case FFI_TYPE_SINT32:
	case FFI_TYPE_UINT64:
	case FFI_TYPE_SINT64:
	case FFI_TYPE_POINTER:
	  avalue[i] = allocate_int_to_reg_or_stack (context, &state, stack, s);
	  break;

	case FFI_TYPE_FLOAT:
	case FFI_TYPE_DOUBLE:
	case FFI_TYPE_LONGDOUBLE:
	case FFI_TYPE_STRUCT:
	case FFI_TYPE_COMPLEX:
	  h = is_vfp_type (ty);
	  if (h)
	    {
	      n = 4 - (h & 3);
              if (cif->abi == FFI_WIN64 && isvariadic)
                {
                  if (state.ngrn + n <= N_X_ARG_REG)
                    {
                      void *reg = &context->x[state.ngrn];
                      state.ngrn += (unsigned int)n;

                      /* Eeek! We need a pointer to the structure, however the
                       homogeneous float elements are being passed in individual
                       registers, therefore for float and double the structure
                       is not represented as a contiguous sequence of bytes in
                       our saved register context.  We don't need the original
                       contents of the register storage, so we reformat the
                       structure into the same memory.  */
                      avalue[i] = compress_hfa_type(reg, reg, h);
                    }
                  else
                    {
                      state.ngrn = N_X_ARG_REG;
                      state.nsrn = N_V_ARG_REG;
                      avalue[i] = allocate_to_stack(&state, stack,
                             ty->alignment, s);
                    }
                }
              else
                {
                  if (state.nsrn + n <= N_V_ARG_REG)
                    {
                      void *reg = &context->v[state.nsrn];
                      state.nsrn += (unsigned int)n;
                      avalue[i] = compress_hfa_type(reg, reg, h);
                    }
                  else
                    {
                      state.nsrn = N_V_ARG_REG;
                      avalue[i] = allocate_to_stack(&state, stack,
                                                   ty->alignment, s);
                    }
                }
            }
          else if (s > 16)
            {
              /* Replace Composite type of size greater than 16 with a
                  pointer.  */
#ifdef __ILP32__
             UINT64 avalue_tmp;
             memcpy (&avalue_tmp,
                  allocate_int_to_reg_or_stack (context, &state,
                                               stack, sizeof (void *)),
                  sizeof (UINT64));
             avalue[i] = (void *)(UINT32)avalue_tmp;
#else
              avalue[i] = *(void **)
              allocate_int_to_reg_or_stack (context, &state, stack,
                                         sizeof (void *));
#endif
            }
          else
            {
              n = (s + 7) / 8;
              if (state.ngrn + n <= N_X_ARG_REG)
                {
                  avalue[i] = &context->x[state.ngrn];
                  state.ngrn += (unsigned int)n;
                }
              else
                {
                  state.ngrn = N_X_ARG_REG;
                  avalue[i] = allocate_to_stack(&state, stack,
                                           ty->alignment, s);
                }
            }
          break;

        default:
          abort();
      }

#if defined (__APPLE__)
      if (i + 1 == cif->aarch64_nfixedargs)
	{
	  state.ngrn = N_X_ARG_REG;
	  state.nsrn = N_V_ARG_REG;
	  state.allocating_variadic = 1;
	}
#endif
    }

  if (flags & AARCH64_RET_IN_MEM)
    rvalue = struct_rvalue;

  fun (cif, rvalue, avalue, user_data);

  return flags;
}

#if defined(FFI_EXEC_STATIC_TRAMP)
void *
ffi_tramp_arch (size_t *tramp_size, size_t *map_size)
{
  extern void *trampoline_code_table;

  *tramp_size = AARCH64_TRAMP_SIZE;
  *map_size = AARCH64_TRAMP_MAP_SIZE;
  return &trampoline_code_table;
}
#endif

#endif /* FFI_CLOSURES */

#endif /* (__aarch64__) || defined(__arm64__)|| defined (_M_ARM64)*/
