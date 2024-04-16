/* -----------------------------------------------------------------------
   ffi.c - (c) 2011 Anthony Green
           (c) 2008 Red Hat, Inc.
	   (c) 2006 Free Software Foundation, Inc.
           (c) 2003-2004 Randolph Chung <tausq@debian.org>
           
   HPPA Foreign Function Interface
   HP-UX PA ABI support 

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

#define MIN_STACK_SIZE  64
#define FIRST_ARG_SLOT  9
#define DEBUG_LEVEL   0

#define fldw(addr, fpreg) \
  __asm__ volatile ("fldw 0(%0), %%" #fpreg "L" : : "r"(addr) : #fpreg)
#define fstw(fpreg, addr) \
  __asm__ volatile ("fstw %%" #fpreg "L, 0(%0)" : : "r"(addr))
#define fldd(addr, fpreg) \
  __asm__ volatile ("fldd 0(%0), %%" #fpreg : : "r"(addr) : #fpreg)
#define fstd(fpreg, addr) \
  __asm__ volatile ("fstd %%" #fpreg "L, 0(%0)" : : "r"(addr))

#define debug(lvl, x...) do { if (lvl <= DEBUG_LEVEL) { printf(x); } } while (0)

static inline int ffi_struct_type(ffi_type *t)
{
  size_t sz = t->size;

  /* Small structure results are passed in registers,
     larger ones are passed by pointer.  Note that small
     structures differ from the corresponding integer
     types in that they have different alignment requirements.  */

  if (sz <= 8)
    return -sz;
  else
    return FFI_TYPE_STRUCT; /* else, we pass it by pointer.  */
}

/* PA has a downward growing stack, which looks like this:

   Offset
	[ Variable args ]
   SP = (4*(n+9))       arg word N
   ...
   SP-52                arg word 4
	[ Fixed args ]
   SP-48                arg word 3
   SP-44                arg word 2
   SP-40                arg word 1
   SP-36                arg word 0
	[ Frame marker ]
   ...
   SP-20                RP
   SP-4                 previous SP

   The first four argument words on the stack are reserved for use by
   the callee.  Instead, the general and floating registers replace
   the first four argument slots.  Non FP arguments are passed solely
   in the general registers.  FP arguments are passed in both general
   and floating registers when using libffi.

   Non-FP 32-bit args are passed in gr26, gr25, gr24 and gr23.
   Non-FP 64-bit args are passed in register pairs, starting
   on an odd numbered register (i.e. r25+r26 and r23+r24).
   FP 32-bit arguments are passed in fr4L, fr5L, fr6L and fr7L.
   FP 64-bit arguments are passed in fr5 and fr7.

   The registers are allocated in the same manner as stack slots.
   This allows the callee to save its arguments on the stack if
   necessary:

   arg word 3 -> gr23 or fr7L
   arg word 2 -> gr24 or fr6L or fr7R
   arg word 1 -> gr25 or fr5L
   arg word 0 -> gr26 or fr4L or fr5R

   Note that fr4R and fr6R are never used for arguments (i.e.,
   doubles are not passed in fr4 or fr6).

   The rest of the arguments are passed on the stack starting at SP-52,
   but 64-bit arguments need to be aligned to an 8-byte boundary

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

void ffi_prep_args_pa32(UINT32 *stack, extended_cif *ecif, unsigned bytes)
{
  register unsigned int i;
  register ffi_type **p_arg;
  register void **p_argv;
  unsigned int slot = FIRST_ARG_SLOT;
  char *dest_cpy;
  size_t len;

  debug(1, "%s: stack = %p, ecif = %p, bytes = %u\n", __FUNCTION__, stack,
	ecif, bytes);

  p_arg = ecif->cif->arg_types;
  p_argv = ecif->avalue;

  for (i = 0; i < ecif->cif->nargs; i++)
    {
      int type = (*p_arg)->type;

      switch (type)
	{
	case FFI_TYPE_SINT8:
	  *(SINT32 *)(stack - slot) = *(SINT8 *)(*p_argv);
	  break;

	case FFI_TYPE_UINT8:
	  *(UINT32 *)(stack - slot) = *(UINT8 *)(*p_argv);
	  break;

	case FFI_TYPE_SINT16:
	  *(SINT32 *)(stack - slot) = *(SINT16 *)(*p_argv);
	  break;

	case FFI_TYPE_UINT16:
	  *(UINT32 *)(stack - slot) = *(UINT16 *)(*p_argv);
	  break;

	case FFI_TYPE_UINT32:
	case FFI_TYPE_SINT32:
	case FFI_TYPE_POINTER:
	  debug(3, "Storing UINT32 %u in slot %u\n", *(UINT32 *)(*p_argv),
		slot);
	  *(UINT32 *)(stack - slot) = *(UINT32 *)(*p_argv);
	  break;

	case FFI_TYPE_UINT64:
	case FFI_TYPE_SINT64:
	  /* Align slot for 64-bit type.  */
	  slot += (slot & 1) ? 1 : 2;
	  *(UINT64 *)(stack - slot) = *(UINT64 *)(*p_argv);
	  break;

	case FFI_TYPE_FLOAT:
	  /* First 4 args go in fr4L - fr7L.  */
	  debug(3, "Storing UINT32(float) in slot %u\n", slot);
	  *(UINT32 *)(stack - slot) = *(UINT32 *)(*p_argv);
	  switch (slot - FIRST_ARG_SLOT)
	    {
	    /* First 4 args go in fr4L - fr7L.  */
	    case 0: fldw(stack - slot, fr4); break;
	    case 1: fldw(stack - slot, fr5); break;
	    case 2: fldw(stack - slot, fr6); break;
	    case 3: fldw(stack - slot, fr7); break;
	    }
	  break;

	case FFI_TYPE_DOUBLE:
	  /* Align slot for 64-bit type.  */
	  slot += (slot & 1) ? 1 : 2;
	  debug(3, "Storing UINT64(double) at slot %u\n", slot);
	  *(UINT64 *)(stack - slot) = *(UINT64 *)(*p_argv);
	  switch (slot - FIRST_ARG_SLOT)
	    {
	      /* First 2 args go in fr5, fr7.  */
	      case 1: fldd(stack - slot, fr5); break;
	      case 3: fldd(stack - slot, fr7); break;
	    }
	  break;

#ifdef PA_HPUX
	case FFI_TYPE_LONGDOUBLE:
	  /* Long doubles are passed in the same manner as structures
	     larger than 8 bytes.  */
	  *(UINT32 *)(stack - slot) = (UINT32)(*p_argv);
	  break;
#endif

	case FFI_TYPE_STRUCT:

	  /* Structs smaller or equal than 4 bytes are passed in one
	     register. Structs smaller or equal 8 bytes are passed in two
	     registers. Larger structures are passed by pointer.  */

	  len = (*p_arg)->size;
	  if (len <= 4)
	    {
	      dest_cpy = (char *)(stack - slot) + 4 - len;
	      memcpy(dest_cpy, (char *)*p_argv, len);
	    }
	  else if (len <= 8)
	    {
	      slot += (slot & 1) ? 1 : 2;
	      dest_cpy = (char *)(stack - slot) + 8 - len;
	      memcpy(dest_cpy, (char *)*p_argv, len);
	    }
	  else
	    *(UINT32 *)(stack - slot) = (UINT32)(*p_argv);
	  break;

	default:
	  FFI_ASSERT(0);
	}

      slot++;
      p_arg++;
      p_argv++;
    }

  /* Make sure we didn't mess up and scribble on the stack.  */
  {
    unsigned int n;

    debug(5, "Stack setup:\n");
    for (n = 0; n < (bytes + 3) / 4; n++)
      {
	if ((n%4) == 0) { debug(5, "\n%08x: ", (unsigned int)(stack - n)); }
	debug(5, "%08x ", *(stack - n));
      }
    debug(5, "\n");
  }

  FFI_ASSERT(slot * 4 <= bytes);

  return;
}

static void ffi_size_stack_pa32(ffi_cif *cif)
{
  ffi_type **ptr;
  int i;
  int z = 0; /* # stack slots */

  for (ptr = cif->arg_types, i = 0; i < cif->nargs; ptr++, i++)
    {
      int type = (*ptr)->type;

      switch (type)
	{
	case FFI_TYPE_DOUBLE:
	case FFI_TYPE_UINT64:
	case FFI_TYPE_SINT64:
	  z += 2 + (z & 1); /* must start on even regs, so we may waste one */
	  break;

#ifdef PA_HPUX
	case FFI_TYPE_LONGDOUBLE:
#endif
	case FFI_TYPE_STRUCT:
	  z += 1; /* pass by ptr, callee will copy */
	  break;

	default: /* <= 32-bit values */
	  z++;
	}
    }

  /* We can fit up to 6 args in the default 64-byte stack frame,
     if we need more, we need more stack.  */
  if (z <= 6)
    cif->bytes = MIN_STACK_SIZE; /* min stack size */
  else
    cif->bytes = 64 + ROUND_UP((z - 6) * sizeof(UINT32), MIN_STACK_SIZE);

  debug(3, "Calculated stack size is %u bytes\n", cif->bytes);
}

/* Perform machine dependent cif processing.  */
ffi_status ffi_prep_cif_machdep(ffi_cif *cif)
{
  /* Set the return type flag */
  switch (cif->rtype->type)
    {
    case FFI_TYPE_VOID:
    case FFI_TYPE_FLOAT:
    case FFI_TYPE_DOUBLE:
      cif->flags = (unsigned) cif->rtype->type;
      break;

#ifdef PA_HPUX
    case FFI_TYPE_LONGDOUBLE:
      /* Long doubles are treated like a structure.  */
      cif->flags = FFI_TYPE_STRUCT;
      break;
#endif

    case FFI_TYPE_STRUCT:
      /* For the return type we have to check the size of the structures.
	 If the size is smaller or equal 4 bytes, the result is given back
	 in one register. If the size is smaller or equal 8 bytes than we
	 return the result in two registers. But if the size is bigger than
	 8 bytes, we work with pointers.  */
      cif->flags = ffi_struct_type(cif->rtype);
      break;

    case FFI_TYPE_UINT64:
    case FFI_TYPE_SINT64:
      cif->flags = FFI_TYPE_UINT64;
      break;

    default:
      cif->flags = FFI_TYPE_INT;
      break;
    }

  /* Lucky us, because of the unique PA ABI we get to do our
     own stack sizing.  */
  switch (cif->abi)
    {
    case FFI_PA32:
      ffi_size_stack_pa32(cif);
      break;

    default:
      FFI_ASSERT(0);
      break;
    }

  return FFI_OK;
}

extern void ffi_call_pa32(void (*)(UINT32 *, extended_cif *, unsigned),
			  extended_cif *, unsigned, unsigned, unsigned *,
			  void (*fn)(void));

void ffi_call(ffi_cif *cif, void (*fn)(void), void *rvalue, void **avalue)
{
  extended_cif ecif;
  size_t i, nargs = cif->nargs;
  ffi_type **arg_types = cif->arg_types;

  ecif.cif = cif;
  ecif.avalue = avalue;

  /* If we have any large structure arguments, make a copy so we are passing
     by value.  */
  for (i = 0; i < nargs; i++)
    {
      ffi_type *at = arg_types[i];
      int size = at->size;
      if (at->type == FFI_TYPE_STRUCT && size > 8)
	{
	  char *argcopy = alloca (size);
	  memcpy (argcopy, avalue[i], size);
	  avalue[i] = argcopy;
	}
    }

  /* If the return value is a struct and we don't have a return
     value address then we need to make one.  */

  if (rvalue == NULL
#ifdef PA_HPUX
      && (cif->rtype->type == FFI_TYPE_STRUCT
	  || cif->rtype->type == FFI_TYPE_LONGDOUBLE))
#else
      && cif->rtype->type == FFI_TYPE_STRUCT)
#endif
    {
      ecif.rvalue = alloca(cif->rtype->size);
    }
  else
    ecif.rvalue = rvalue;


  switch (cif->abi)
    {
    case FFI_PA32:
      debug(3, "Calling ffi_call_pa32: ecif=%p, bytes=%u, flags=%u, rvalue=%p, fn=%p\n", &ecif, cif->bytes, cif->flags, ecif.rvalue, (void *)fn);
      ffi_call_pa32(ffi_prep_args_pa32, &ecif, cif->bytes,
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
ffi_status ffi_closure_inner_pa32(ffi_closure *closure, UINT32 *stack)
{
  ffi_cif *cif;
  void **avalue;
  void *rvalue;
  /* Functions can return up to 64-bits in registers.  Return address
     must be double word aligned.  */
  union { double rd; UINT32 ret[2]; } u;
  ffi_type **p_arg;
  char *tmp;
  int i, avn;
  unsigned int slot = FIRST_ARG_SLOT;
  register UINT32 r28 asm("r28");

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
	case FFI_TYPE_SINT16:
	case FFI_TYPE_UINT16:
	case FFI_TYPE_SINT32:
	case FFI_TYPE_UINT32:
	case FFI_TYPE_POINTER:
	  avalue[i] = (char *)(stack - slot) + sizeof(UINT32) - (*p_arg)->size;
	  break;

	case FFI_TYPE_SINT64:
	case FFI_TYPE_UINT64:
	  slot += (slot & 1) ? 1 : 2;
	  avalue[i] = (void *)(stack - slot);
	  break;

	case FFI_TYPE_FLOAT:
#ifdef PA_LINUX
	  /* The closure call is indirect.  In Linux, floating point
	     arguments in indirect calls with a prototype are passed
	     in the floating point registers instead of the general
	     registers.  So, we need to replace what was previously
	     stored in the current slot with the value in the
	     corresponding floating point register.  */
	  switch (slot - FIRST_ARG_SLOT)
	    {
	    case 0: fstw(fr4, (void *)(stack - slot)); break;
	    case 1: fstw(fr5, (void *)(stack - slot)); break;
	    case 2: fstw(fr6, (void *)(stack - slot)); break;
	    case 3: fstw(fr7, (void *)(stack - slot)); break;
	    }
#endif
	  avalue[i] = (void *)(stack - slot);
	  break;

	case FFI_TYPE_DOUBLE:
	  slot += (slot & 1) ? 1 : 2;
#ifdef PA_LINUX
	  /* See previous comment for FFI_TYPE_FLOAT.  */
	  switch (slot - FIRST_ARG_SLOT)
	    {
	    case 1: fstd(fr5, (void *)(stack - slot)); break;
	    case 3: fstd(fr7, (void *)(stack - slot)); break;
	    }
#endif
	  avalue[i] = (void *)(stack - slot);
	  break;

#ifdef PA_HPUX
	case FFI_TYPE_LONGDOUBLE:
	  /* Long doubles are treated like a big structure.  */
	  avalue[i] = (void *) *(stack - slot);
	  break;
#endif

	case FFI_TYPE_STRUCT:
	  /* Structs smaller or equal than 4 bytes are passed in one
	     register. Structs smaller or equal 8 bytes are passed in two
	     registers. Larger structures are passed by pointer.  */
	  if((*p_arg)->size <= 4)
	    {
	      avalue[i] = (void *)(stack - slot) + sizeof(UINT32) -
		(*p_arg)->size;
	    }
	  else if ((*p_arg)->size <= 8)
	    {
	      slot += (slot & 1) ? 1 : 2;
	      avalue[i] = (void *)(stack - slot) + sizeof(UINT64) -
		(*p_arg)->size;
	    }
	  else
	    avalue[i] = (void *) *(stack - slot);
	  break;

	default:
	  FFI_ASSERT(0);
	}

      slot++;
      p_arg++;
    }

  /* Invoke the closure.  */
  (closure->fun) (cif, rvalue, avalue, closure->user_data);

  debug(3, "after calling function, ret[0] = %08x, ret[1] = %08x\n", u.ret[0],
	u.ret[1]);

  /* Store the result using the lower 2 bytes of the flags.  */
  switch (cif->flags)
    {
    case FFI_TYPE_UINT8:
      *(stack - FIRST_ARG_SLOT) = (UINT8)u.ret[0];
      break;
    case FFI_TYPE_SINT8:
      *(stack - FIRST_ARG_SLOT) = (SINT8)u.ret[0];
      break;
    case FFI_TYPE_UINT16:
      *(stack - FIRST_ARG_SLOT) = (UINT16)u.ret[0];
      break;
    case FFI_TYPE_SINT16:
      *(stack - FIRST_ARG_SLOT) = (SINT16)u.ret[0];
      break;
    case FFI_TYPE_INT:
    case FFI_TYPE_SINT32:
    case FFI_TYPE_UINT32:
      *(stack - FIRST_ARG_SLOT) = u.ret[0];
      break;
    case FFI_TYPE_SINT64:
    case FFI_TYPE_UINT64:
      *(stack - FIRST_ARG_SLOT) = u.ret[0];
      *(stack - FIRST_ARG_SLOT - 1) = u.ret[1];
      break;

    case FFI_TYPE_DOUBLE:
      fldd(rvalue, fr4);
      break;

    case FFI_TYPE_FLOAT:
      fldw(rvalue, fr4);
      break;

    case FFI_TYPE_STRUCT:
      /* Don't need a return value, done by caller.  */
      break;

    case FFI_TYPE_SMALL_STRUCT1:
    case FFI_TYPE_SMALL_STRUCT2:
    case FFI_TYPE_SMALL_STRUCT3:
    case FFI_TYPE_SMALL_STRUCT4:
      tmp = (void*)(stack -  FIRST_ARG_SLOT);
      tmp += 4 - cif->rtype->size;
      memcpy((void*)tmp, &u, cif->rtype->size);
      break;

    case FFI_TYPE_SMALL_STRUCT5:
    case FFI_TYPE_SMALL_STRUCT6:
    case FFI_TYPE_SMALL_STRUCT7:
    case FFI_TYPE_SMALL_STRUCT8:
      {
	unsigned int ret2[2];
	int off;

	/* Right justify ret[0] and ret[1] */
	switch (cif->flags)
	  {
	    case FFI_TYPE_SMALL_STRUCT5: off = 3; break;
	    case FFI_TYPE_SMALL_STRUCT6: off = 2; break;
	    case FFI_TYPE_SMALL_STRUCT7: off = 1; break;
	    default: off = 0; break;
	  }

	memset (ret2, 0, sizeof (ret2));
	memcpy ((char *)ret2 + off, &u, 8 - off);

	*(stack - FIRST_ARG_SLOT) = ret2[0];
	*(stack - FIRST_ARG_SLOT - 1) = ret2[1];
      }
      break;

    case FFI_TYPE_POINTER:
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

extern void ffi_closure_pa32(void);

ffi_status
ffi_prep_closure_loc (ffi_closure* closure,
		      ffi_cif* cif,
		      void (*fun)(ffi_cif*,void*,void**,void*),
		      void *user_data,
		      void *codeloc)
{
  /* The layout of a function descriptor.  A function pointer with the PLABEL
     bit set points to a function descriptor.  */
  struct pa32_fd
  {
    UINT32 code_pointer;
    UINT32 gp;
  };

  struct ffi_pa32_trampoline_struct
  {
     UINT32 code_pointer;        /* Pointer to ffi_closure_unix.  */
     UINT32 fake_gp;             /* Pointer to closure, installed as gp.  */
     UINT32 real_gp;             /* Real gp value.  */
  };

  struct ffi_pa32_trampoline_struct *tramp;
  struct pa32_fd *fd;

  if (cif->abi != FFI_PA32)
    return FFI_BAD_ABI;

  /* Get function descriptor address for ffi_closure_pa32.  */
  fd = (struct pa32_fd *)((UINT32)ffi_closure_pa32 & ~3);

  /* Setup trampoline.  */
  tramp = (struct ffi_pa32_trampoline_struct *)closure->tramp;
  tramp->code_pointer = fd->code_pointer;
  tramp->fake_gp = (UINT32)codeloc & ~3;
  tramp->real_gp = fd->gp;

  closure->cif  = cif;
  closure->user_data = user_data;
  closure->fun  = fun;

  return FFI_OK;
}
#endif
