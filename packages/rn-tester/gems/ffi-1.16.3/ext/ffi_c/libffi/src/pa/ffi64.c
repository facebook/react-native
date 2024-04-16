/* -----------------------------------------------------------------------
   ffi64.c - (c) 2022 John David Anglin <dave.anglin@bell.net>
           
   HPPA Foreign Function Interface
   PA 64-Bit ABI support 

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
#include <stdio.h>

#define ROUND_UP(v, a)  (((size_t)(v) + (a) - 1) & ~((a) - 1))

#define FIRST_ARG_SLOT  0
#define DEBUG_LEVEL   0

#define fldw(addr, fpreg) \
  __asm__ volatile ("fldw 4(%0), %%" #fpreg "R" : : "r"(addr) : #fpreg)
#define fstw(fpreg, addr) \
  __asm__ volatile ("fstw %%" #fpreg "R, 4(%0)" : : "r"(addr))
#define fldd(addr, fpreg) \
  __asm__ volatile ("fldd 0(%0), %%" #fpreg "L" : : "r"(addr) : #fpreg)
#define fstd(fpreg, addr) \
  __asm__ volatile ("fstd %%" #fpreg "L, 0(%0)" : : "r"(addr))

#define debug(lvl, x...) do { if (lvl <= DEBUG_LEVEL) { printf(x); } } while (0)

static inline int ffi_struct_type(ffi_type *t)
{
  int sz = t->size;

  /* Small structure results are returned in registers 28 and 29,
     larger ones are in a buffer allocated by the callee.  The
     address of the buffer is passed in r28.  The buffer is supposed
     to be aligned on a 16-byte boundary.   Register return values are
     padded on the right.  The pad bits on the right are undefined.  */

  if (sz <= 16)
    return -sz;
  else
    return FFI_TYPE_STRUCT;
}

/* PA has a downward growing stack, which looks like this.  Stack
   arguments are offset from the argument ponter (AP) in r29.

   Offset
	[ Fixed args ]
   AP-64                arg word 0 (r26, fr4)
   AP-56                arg word 1 (r25, fr5)
   AP-48                arg word 2 (r24, fr6)
   AP-40                arg word 3 (r23, fr7)
   AP-32                arg word 4 (r22, fr8)
   AP-24                arg word 5 (r21, fr9)
   AP-16                arg word 6 (r20, fr10)
   AP-8	                arg word 7 (r19, fr11)
	[ Variable args; AP = SP-16 if there are no variable args ]
   AP			stack arg 0
   AP+8			stack arg 1
   ...
	[ Frame marker ]
   SP-16                RP
   SP-8                 previous SP

   The first eight argument words on the stack are reserved for use by
   the callee.  Instead, the general and floating registers replace
   the first four argument slots.  Non FP arguments are passed solely
   in the general registers.  Single and double FP arguments are passed
   in both general and floating registers when using libffi.

   The registers are allocated in the same manner as stack slots.
   This allows the callee to save its arguments on the stack if
   necessary:

   arg word 0 -> gr26 or fr4L or fr4R
   arg word 1 -> gr25 or fr5L or fr5R
   arg word 2 -> gr24 or fr6L or fr6R
   arg word 3 -> gr23 or fr7L or fr7R
   ...

   Single Single-precision floating-point parameters, when passed in
   floating-point registers, are passed in the right halves of the
   floating point registers; the left halves are unused.

   Quad-precision floating-point parameters within the first 64 bytes of
   the parameter list are always passed in general registers.

   The rest of the arguments are passed on the stack starting at AP.

   This means we can have holes either in the register allocation,
   or in the stack.  */

/* ffi_prep_args is called by the assembly routine once stack space
   has been allocated for the function's arguments

   The following code will put everything into the stack frame
   (which was allocated by the asm routine), and on return
   the asm routine will load the arguments that should be
   passed by register into the appropriate registers

   NOTE: We load floating point args in this function... that means we
   assume gcc will not mess with fp regs in here.  */

void ffi_prep_args_pa64(UINT64 *stack, extended_cif *ecif, unsigned bytes)
{
  register unsigned int i;
  register ffi_type **p_arg;
  register void **p_argv;
  unsigned int slot = FIRST_ARG_SLOT;
  size_t len;

  debug(1, "%s: stack = %p, ecif = %p, bytes = %u\n", __FUNCTION__, stack,
	ecif, bytes);

  p_arg = ecif->cif->arg_types;
  p_argv = ecif->avalue;

  for (i = 0; i < ecif->cif->nargs; i++)
    {
      int type = (*p_arg)->type;

      len = (*p_arg)->size;

      switch (type)
	{
	case FFI_TYPE_SINT8:
	  *(SINT64 *)(stack + slot) = *(SINT8 *)(*p_argv);
	  break;

	case FFI_TYPE_UINT8:
	  *(UINT64 *)(stack + slot) = *(UINT8 *)(*p_argv);
	  break;

	case FFI_TYPE_SINT16:
	  *(SINT64 *)(stack + slot) = *(SINT16 *)(*p_argv);
	  break;

	case FFI_TYPE_UINT16:
	  *(UINT64 *)(stack + slot) = *(UINT16 *)(*p_argv);
	  break;

	case FFI_TYPE_SINT32:
	  *(SINT64 *)(stack + slot) = *(SINT32 *)(*p_argv);
	  break;

	case FFI_TYPE_UINT32:
	  *(UINT64 *)(stack + slot) = *(UINT32 *)(*p_argv);
	  break;

	case FFI_TYPE_UINT64:
	case FFI_TYPE_SINT64:
	case FFI_TYPE_POINTER:
	  debug(3, "Storing UINT64 %lu in slot %u\n", *(UINT64 *)(*p_argv),
		slot);
	  *(UINT64 *)(stack + slot) = *(UINT64 *)(*p_argv);
	  break;

	case FFI_TYPE_FLOAT:
	  /* First 8 args go in fr4L - fr11L.  */
	  debug(3, "Storing UINT32(float) in slot %u\n", slot);
	  *(UINT64 *)(stack + slot) = *(UINT32 *)(*p_argv);
	  switch (slot - FIRST_ARG_SLOT)
	    {
	    /* First 4 args go in fr4L - fr7L.  */
	    case 0: fldw(stack + slot, fr4); break;
	    case 1: fldw(stack + slot, fr5); break;
	    case 2: fldw(stack + slot, fr6); break;
	    case 3: fldw(stack + slot, fr7); break;
	    case 4: fldw(stack + slot, fr8); break;
	    case 5: fldw(stack + slot, fr9); break;
	    case 6: fldw(stack + slot, fr10); break;
	    case 7: fldw(stack + slot, fr11); break;
	    }
	  break;

	case FFI_TYPE_DOUBLE:
	  debug(3, "Storing UINT64(double) at slot %u\n", slot);
	  *(UINT64 *)(stack + slot) = *(UINT64 *)(*p_argv);
	  switch (slot - FIRST_ARG_SLOT)
	    {
	    /* First 8 args go in fr4 to fr11.  */
	    case 0: fldd(stack + slot, fr4); break;
	    case 1: fldd(stack + slot, fr5); break;
	    case 2: fldd(stack + slot, fr6); break;
	    case 3: fldd(stack + slot, fr7); break;
	    case 4: fldd(stack + slot, fr8); break;
	    case 5: fldd(stack + slot, fr9); break;
	    case 6: fldd(stack + slot, fr10); break;
	    case 7: fldd(stack + slot, fr11); break;
	    }
	  break;

#ifdef PA64_HPUX
	case FFI_TYPE_LONGDOUBLE:
	  /* Align slot to a 16-byte boundary.  */
	  slot += (slot & 1);
	  *(UINT64 *)(stack + slot) = *(UINT64 *)(*p_argv);
	  *(UINT64 *)(stack + slot + 1) = *(UINT64 *)(*p_argv + 8);
	  break;
#endif

	case FFI_TYPE_STRUCT:
	  /* Structs larger than 8 bytes are aligned on a 16-byte boundary. */
	  if (len > 8)
	    slot += (slot & 1);
	  memcpy((char *)(stack + slot), (char *)*p_argv, len);
	  break;

	default:
	  FFI_ASSERT(0);
	}

      slot += ROUND_UP (len, 8) >> 3;
      p_arg++;
      p_argv++;
    }

  FFI_ASSERT(slot * 8 <= bytes);

  return;
}

static void ffi_size_stack_pa64(ffi_cif *cif)
{
  ffi_type **ptr;
  int i;
  int z = 0; /* # stack slots */

  for (ptr = cif->arg_types, i = 0; i < cif->nargs; ptr++, i++)
    {
      int type = (*ptr)->type;
      int size = (*ptr)->size;

      switch (type)
	{
#ifdef PA64_HPUX
	case FFI_TYPE_LONGDOUBLE:
	  z += 2 + (z & 1);
	  break;
#endif

	case FFI_TYPE_STRUCT:
	  if (size > 8)
	    z += (z & 1);
	  z += ROUND_UP (size, 8) >> 3;
	  break;

	default: /* 64-bit values */
	  z++;
	}
    }

  /* We need a minimum of 8 argument slots.  Stack must be 16-byte
     aligned.  */
  if (z <= 8)
    z = 8;
  else
    z += (z & 1);

  /* Add 16 bytes for frame marker.  */
  cif->bytes = z * 8 + 64;
  debug(3, "Calculated stack size is %u bytes\n", cif->bytes);
}

/* Perform machine dependent cif processing.  */
ffi_status ffi_prep_cif_machdep(ffi_cif *cif)
{
  /* Set the return type flag for jump table.  */
  switch (cif->rtype->type)
    {
    case FFI_TYPE_COMPLEX:
    case FFI_TYPE_STRUCT:
      /* For the return type we have to check the size of the structures.
	 If the size is smaller or equal 8 bytes, the result is given back
	 in one register. If the size is smaller or equal 16 bytes than we
	 return the result in two registers. If the size is bigger than
	 16 bytes, the return is in a buffer allocated by the caller.  */
      cif->flags = ffi_struct_type(cif->rtype);
      break;

    default:
      cif->flags = (unsigned) cif->rtype->type;
      break;
    }

  /* Lucky us, because of the unique PA ABI we get to do our
     own stack sizing.  */
  switch (cif->abi)
    {
    case FFI_PA64:
      ffi_size_stack_pa64(cif);
      break;

    default:
      FFI_ASSERT(0);
      break;
    }

  return FFI_OK;
}

extern void ffi_call_pa64(void (*)(UINT64 *, extended_cif *, unsigned),
			  extended_cif *, unsigned, unsigned, unsigned *,
			  void (*fn)(void));

void ffi_call(ffi_cif *cif, void (*fn)(void), void *rvalue, void **avalue)
{
  extended_cif ecif;

  ecif.cif = cif;
  ecif.avalue = avalue;

  /* If the return value is a struct and we don't have a return
     value address then we need to make one.  */

  if (rvalue == NULL
      && (cif->rtype->type == FFI_TYPE_STRUCT
	  || cif->rtype->type == FFI_TYPE_COMPLEX)
      && cif->rtype->size > 16)
    ecif.rvalue = alloca(ROUND_UP (cif->rtype->size, 16));
  else
    ecif.rvalue = rvalue;


  switch (cif->abi)
    {
    case FFI_PA64:
      debug(3, "Calling ffi_call_pa64: ecif=%p, bytes=%u, flags=%u, rvalue=%p, fn=%p\n", &ecif, cif->bytes, cif->flags, ecif.rvalue, (void *)fn);
      ffi_call_pa64(ffi_prep_args_pa64, &ecif, cif->bytes,
		     cif->flags, ecif.rvalue, fn);
      break;

    default:
      FFI_ASSERT(0);
      break;
    }
}

#if FFI_CLOSURES
/* This is more-or-less an inverse of ffi_call -- we have arguments on
   the stack, and we need to fill them into a cif structure and invoke
   the user function. This really ought to be in asm to make sure
   the compiler doesn't do things we don't expect.  */
ffi_status ffi_closure_inner_pa64(ffi_closure *closure, UINT64 *stack)
{
  ffi_cif *cif;
  void **avalue;
  void *rvalue;
  /* Functions can return up to 128-bits in registers.  Return address
     must be double word aligned.  */
  union { long double rld; UINT64 ret[2]; } u;
  ffi_type **p_arg;
  char *tmp;
  int i, avn;
  unsigned int slot = FIRST_ARG_SLOT;
  register UINT64 r28 asm("r28");

  cif = closure->cif;

  /* If returning via structure, callee will write to our pointer.  */
  if (cif->flags == FFI_TYPE_STRUCT)
    rvalue = (void *)r28;
  else
    rvalue = &u;

  avalue = (void **)alloca(cif->nargs * FFI_SIZEOF_ARG);
  avn = cif->nargs;
  p_arg = cif->arg_types;

  for (i = 0; i < avn; i++)
    {
      int type = (*p_arg)->type;

      switch (type)
	{
	case FFI_TYPE_SINT8:
	case FFI_TYPE_UINT8:
	  avalue[i] = (void *)(stack + slot) + 7;
	  break;

	case FFI_TYPE_SINT16:
	case FFI_TYPE_UINT16:
	  avalue[i] = (void *)(stack + slot) + 6;
	  break;

	case FFI_TYPE_SINT32:
	case FFI_TYPE_UINT32:
	  avalue[i] = (void *)(stack + slot) + 4;
	  break;

	case FFI_TYPE_POINTER:
	case FFI_TYPE_SINT64:
	case FFI_TYPE_UINT64:
	  avalue[i] = (void *)(stack + slot);
	  break;

	case FFI_TYPE_FLOAT:
	  /* The closure call is indirect.  In Linux, floating point
	     arguments in indirect calls with a prototype are passed
	     in the floating point registers instead of the general
	     registers.  So, we need to replace what was previously
	     stored in the current slot with the value in the
	     corresponding floating point register.  */
	  switch (slot + FIRST_ARG_SLOT)
	    {
	    case 0: fstw(fr4, (void *)(stack + slot)); break;
	    case 1: fstw(fr5, (void *)(stack + slot)); break;
	    case 2: fstw(fr6, (void *)(stack + slot)); break;
	    case 3: fstw(fr7, (void *)(stack + slot)); break;
	    case 4: fstw(fr8, (void *)(stack + slot)); break;
	    case 5: fstw(fr9, (void *)(stack + slot)); break;
	    case 6: fstw(fr10, (void *)(stack + slot)); break;
	    case 7: fstw(fr11, (void *)(stack + slot)); break;
	    }
	  avalue[i] = (void *)(stack + slot) + 4;
	  break;

	case FFI_TYPE_DOUBLE:
	  /* See previous comment for FFI_TYPE_FLOAT.  */
	  switch (slot + FIRST_ARG_SLOT)
	    {
	    case 0: fstd(fr4, (void *)(stack + slot)); break;
	    case 1: fstd(fr5, (void *)(stack + slot)); break;
	    case 2: fstd(fr6, (void *)(stack + slot)); break;
	    case 3: fstd(fr7, (void *)(stack + slot)); break;
	    case 4: fstd(fr8, (void *)(stack + slot)); break;
	    case 5: fstd(fr9, (void *)(stack + slot)); break;
	    case 6: fstd(fr10, (void *)(stack + slot)); break;
	    case 7: fstd(fr11, (void *)(stack + slot)); break;
	    }
	  avalue[i] = (void *)(stack + slot);
	  break;

#ifdef PA64_HPUX
	case FFI_TYPE_LONGDOUBLE:
	  /* Long doubles are treated like a big structure.  */
	  slot += (slot & 1);
	  avalue[i] = (void *)(stack + slot);
	  break;
#endif

	case FFI_TYPE_STRUCT:
	  /* All structs are passed in registers.  Structs larger
	     than 8 bytes are aligned on a 16-byte boundary.  */
	  if((*p_arg)->size > 8)
	    slot += (slot & 1);
	  avalue[i] = (void *) (stack + slot);
	  break;

	default:
	  FFI_ASSERT(0);
	}

      slot += (ROUND_UP ((*p_arg)->size, 8) >> 3);
      p_arg++;
    }

  /* Invoke the closure.  */
  (closure->fun) (cif, rvalue, avalue, closure->user_data);

  debug(3, "after calling function, ret[0] = %16lx, ret[1] = %16lx\n", u.ret[0],
	u.ret[1]);

  /* Store the result using the lower 2 bytes of the flags.  */
  switch (cif->flags)
    {
    case FFI_TYPE_UINT8:
      *(stack + FIRST_ARG_SLOT) = (UINT8)u.ret[0];
      break;
    case FFI_TYPE_SINT8:
      *(stack + FIRST_ARG_SLOT) = (SINT8)u.ret[0];
      break;
    case FFI_TYPE_UINT16:
      *(stack + FIRST_ARG_SLOT) = (UINT16)u.ret[0];
      break;
    case FFI_TYPE_SINT16:
      *(stack + FIRST_ARG_SLOT) = (SINT16)u.ret[0];
      break;
    case FFI_TYPE_INT:
    case FFI_TYPE_SINT32:
      *(stack + FIRST_ARG_SLOT) = (SINT32)u.ret[0];
      break;
    case FFI_TYPE_UINT32:
      *(stack - FIRST_ARG_SLOT) = (UINT32)u.ret[0];
      break;
    case FFI_TYPE_SINT64:
    case FFI_TYPE_UINT64:
    case FFI_TYPE_POINTER:
      *(stack - FIRST_ARG_SLOT) = u.ret[0];
      break;

    case FFI_TYPE_LONGDOUBLE:
      *(stack + FIRST_ARG_SLOT) = u.ret[0];
      *(stack + FIRST_ARG_SLOT + 1) = u.ret[1];
      break;

    case FFI_TYPE_DOUBLE:
      fldd(rvalue, fr4);
      break;

    case FFI_TYPE_FLOAT:
      /* Adjust for address adjustment in fldw macro.  */
      fldw(rvalue - 4, fr4);
      break;

    case FFI_TYPE_STRUCT:
      /* Don't need a return value, done by caller.  */
      break;

    case -1:
    case -2:
    case -3:
    case -4:
    case -5:
    case -6:
    case -7:
    case -8:
    case -9:
    case -10:
    case -11:
    case -12:
    case -13:
    case -14:
    case -15:
    case -16:
      tmp = (void*)(stack + FIRST_ARG_SLOT);
      memcpy((void*)tmp, &u, cif->rtype->size);
      break;

    case FFI_TYPE_VOID:
      break;

    default:
      debug(0, "assert with cif->flags: %d\n",cif->flags);
      FFI_ASSERT(0);
      break;
    }
  return FFI_OK;
}

/* Fill in a closure to refer to the specified fun and user_data.
   cif specifies the argument and result types for fun.
   The cif must already be prep'ed.  */

extern void ffi_closure_pa64(void);

ffi_status
ffi_prep_closure_loc (ffi_closure* closure,
		      ffi_cif* cif,
		      void (*fun)(ffi_cif*,void*,void**,void*),
		      void *user_data,
		      void *codeloc)
{
  /* The layout of a function descriptor.  */
  struct pa64_fd
  {
    UINT64 tmp1;
    UINT64 tmp2;
    UINT64 code_pointer;
    UINT64 gp;
  };

  struct ffi_pa64_trampoline_struct
  {
    UINT64 real_gp;             /* Real gp value.  */
    UINT64 tmp2;
    UINT64 code_pointer;        /* Pointer to ffi_closure_unix.  */
    UINT64 fake_gp;             /* Pointer to closure, installed as gp.  */
  };

  struct ffi_pa64_trampoline_struct *tramp;
  struct pa64_fd *fd;

  if (cif->abi != FFI_PA64)
    return FFI_BAD_ABI;

  /* Get function descriptor address for ffi_closure_pa64.  */
  fd = (struct pa64_fd *)((UINT64)ffi_closure_pa64);

  /* Setup trampoline.  */
  tramp = (struct ffi_pa64_trampoline_struct *)closure->tramp;
  tramp->code_pointer = fd->code_pointer;
  tramp->fake_gp = (UINT64)codeloc;
  tramp->real_gp = fd->gp;

  closure->cif  = cif;
  closure->user_data = user_data;
  closure->fun  = fun;

  return FFI_OK;
}
#endif
