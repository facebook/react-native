/* libffi support for Altera Nios II.

   Copyright (c) 2013 Mentor Graphics.

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


#include <ffi.h>
#include <ffi_common.h>

#include <stdlib.h>

/* The Nios II Processor Reference Handbook defines the procedure call
   ABI as follows.

   Arguments are passed as if a structure containing the types of
   the arguments were constructed.  The first 16 bytes are passed in r4
   through r7, the remainder on the stack.  The first 16 bytes of a function
   taking variable arguments are passed in r4-r7 in the same way.

   Return values of types up to 8 bytes are returned in r2 and r3.  For
   return values greater than 8 bytes, the caller must allocate memory for
   the result and pass the address as if it were argument 0.  

   While this isn't specified explicitly in the ABI documentation, GCC
   promotes integral arguments smaller than int size to 32 bits.

   Also of note, the ABI specifies that all structure objects are
   aligned to 32 bits even if all their fields have a smaller natural
   alignment.  See FFI_AGGREGATE_ALIGNMENT.  */


/* Declare the assembly language hooks.  */

extern UINT64 ffi_call_sysv (void (*) (char *, extended_cif *),
			     extended_cif *,
			     unsigned, 
			     void (*fn) (void));
extern void ffi_closure_sysv (void);

/* Perform machine-dependent cif processing.  */

ffi_status ffi_prep_cif_machdep (ffi_cif *cif)
{
  /* We always want at least 16 bytes in the parameter block since it
     simplifies the low-level call function.  Also round the parameter
     block size up to a multiple of 4 bytes to preserve
     32-bit alignment of the stack pointer.  */
  if (cif->bytes < 16)
    cif->bytes = 16;
  else
    cif->bytes = (cif->bytes + 3) & ~3;

  return FFI_OK;
}


/* ffi_prep_args is called by the assembly routine to transfer arguments
   to the stack using the pointers in the ecif array.
   Note that the stack buffer is big enough to fit all the arguments,
   but the first 16 bytes will be copied to registers for the actual
   call.  */

void ffi_prep_args (char *stack, extended_cif *ecif)
{
  char *argp = stack;
  unsigned int i;

  /* The implicit return value pointer is passed as if it were a hidden
     first argument.  */
  if (ecif->cif->rtype->type == FFI_TYPE_STRUCT
      && ecif->cif->rtype->size > 8)
    {
      (*(void **) argp) = ecif->rvalue;
      argp += 4;
    }

  for (i = 0; i < ecif->cif->nargs; i++)
    {
      void *avalue = ecif->avalue[i];
      ffi_type *atype = ecif->cif->arg_types[i];
      size_t size = atype->size;
      size_t alignment = atype->alignment;

      /* Align argp as appropriate for the argument type.  */
      if ((alignment - 1) & (unsigned) argp)
	argp = (char *) FFI_ALIGN (argp, alignment);

      /* Copy the argument, promoting integral types smaller than a
	 word to word size.  */
      if (size < sizeof (int))
	{
	  size = sizeof (int);
	  switch (atype->type)
	    {
	    case FFI_TYPE_SINT8:
	      *(signed int *) argp = (signed int) *(SINT8 *) avalue;
	      break;
		  
	    case FFI_TYPE_UINT8:
	      *(unsigned int *) argp = (unsigned int) *(UINT8 *) avalue;
	      break;
		  
	    case FFI_TYPE_SINT16:
	      *(signed int *) argp = (signed int) *(SINT16 *) avalue;
	      break;
		  
	    case FFI_TYPE_UINT16:
	      *(unsigned int *) argp = (unsigned int) *(UINT16 *) avalue;
	      break;

	    case FFI_TYPE_STRUCT:
	      memcpy (argp, avalue, atype->size);
	      break;

	    default:
	      FFI_ASSERT(0);
	    }
	}
      else if (size == sizeof (int))
	*(unsigned int *) argp = (unsigned int) *(UINT32 *) avalue;
      else
	memcpy (argp, avalue, size);
      argp += size;
    }
}


/* Call FN using the prepared CIF.  RVALUE points to space allocated by
   the caller for the return value, and AVALUE is an array of argument
   pointers.  */

void ffi_call (ffi_cif *cif, void (*fn) (void), void *rvalue, void **avalue)
{

  extended_cif ecif;
  UINT64 result;

  /* If bigret is true, this is the case where a return value of larger
     than 8 bytes is handled by being passed by reference as an implicit
     argument.  */
  int bigret = (cif->rtype->type == FFI_TYPE_STRUCT
		&& cif->rtype->size > 8);

  ecif.cif = cif;
  ecif.avalue = avalue;

  /* Allocate space for return value if this is the pass-by-reference case
     and the caller did not provide a buffer.  */
  if (rvalue == NULL && bigret)
    ecif.rvalue = alloca (cif->rtype->size);
  else
    ecif.rvalue = rvalue;

  result = ffi_call_sysv (ffi_prep_args, &ecif, cif->bytes, fn);

  /* Now result contains the 64 bit contents returned from fn in
     r2 and r3.  Copy the value of the appropriate size to the user-provided
     rvalue buffer.  */
  if (rvalue && !bigret)
    switch (cif->rtype->size)
      {
      case 1:
	*(UINT8 *)rvalue = (UINT8) result;
	break;
      case 2:
	*(UINT16 *)rvalue = (UINT16) result;
	break;
      case 4:
	*(UINT32 *)rvalue = (UINT32) result;
	break;
      case 8:
	*(UINT64 *)rvalue = (UINT64) result;
	break;
      default:
	memcpy (rvalue, (void *)&result, cif->rtype->size);
	break;
      }
}

/* This function is invoked from the closure trampoline to invoke
   CLOSURE with argument block ARGS.  Parse ARGS according to
   CLOSURE->cfi and invoke CLOSURE->fun.  */

static UINT64
ffi_closure_helper (unsigned char *args,
		    ffi_closure *closure)
{
  ffi_cif *cif = closure->cif;
  unsigned char *argp = args;
  void **parsed_args = alloca (cif->nargs * sizeof (void *));
  UINT64 result;
  void *retptr;
  unsigned int i;

  /* First figure out what to do about the return type.  If this is the
     big-structure-return case, the first arg is the hidden return buffer
     allocated by the caller.  */
  if (cif->rtype->type == FFI_TYPE_STRUCT
      && cif->rtype->size > 8)
    {
      retptr = *((void **) argp);
      argp += 4;
    }
  else
    retptr = (void *) &result;

  /* Fill in the array of argument pointers.  */
  for (i = 0; i < cif->nargs; i++)
    {
      size_t size = cif->arg_types[i]->size;
      size_t alignment = cif->arg_types[i]->alignment;

      /* Align argp as appropriate for the argument type.  */
      if ((alignment - 1) & (unsigned) argp)
	argp = (char *) FFI_ALIGN (argp, alignment);

      /* Arguments smaller than an int are promoted to int.  */
      if (size < sizeof (int))
	size = sizeof (int);

      /* Store the pointer.  */
      parsed_args[i] = argp;
      argp += size;
    }

  /* Call the user-supplied function.  */
  (closure->fun) (cif, retptr, parsed_args, closure->user_data);
  return result;
}


/* Initialize CLOSURE with a trampoline to call FUN with
   CIF and USER_DATA.  */
ffi_status
ffi_prep_closure_loc (ffi_closure* closure,
		      ffi_cif* cif,
		      void (*fun) (ffi_cif*, void*, void**, void*),
		      void *user_data,
		      void *codeloc)
{
  unsigned int *tramp = (unsigned int *) &closure->tramp[0];
  int i;

  if (cif->abi != FFI_SYSV)
    return FFI_BAD_ABI;

  /* The trampoline looks like:
       movhi r8, %hi(ffi_closure_sysv)
       ori r8, r8, %lo(ffi_closure_sysv)
       movhi r9, %hi(ffi_closure_helper)
       ori r0, r9, %lo(ffi_closure_helper)
       movhi r10, %hi(closure)
       ori r10, r10, %lo(closure)
       jmp r8
     and then ffi_closure_sysv retrieves the closure pointer out of r10
     in addition to the arguments passed in the normal way for the call,
     and invokes ffi_closure_helper.  We encode the pointer to
     ffi_closure_helper in the trampoline because making a PIC call
     to it in ffi_closure_sysv would be messy (it would have to indirect
     through the GOT).  */

#define HI(x) ((((unsigned int) (x)) >> 16) & 0xffff)
#define LO(x) (((unsigned int) (x)) & 0xffff)
  tramp[0] = (0 << 27) | (8 << 22) | (HI (ffi_closure_sysv) << 6) | 0x34;
  tramp[1] = (8 << 27) | (8 << 22) | (LO (ffi_closure_sysv) << 6) | 0x14;
  tramp[2] = (0 << 27) | (9 << 22) | (HI (ffi_closure_helper) << 6) | 0x34;
  tramp[3] = (9 << 27) | (9 << 22) | (LO (ffi_closure_helper) << 6) | 0x14;
  tramp[4] = (0 << 27) | (10 << 22) | (HI (closure) << 6) | 0x34;
  tramp[5] = (10 << 27) | (10 << 22) | (LO (closure) << 6) | 0x14;
  tramp[6] = (8 << 27) | (0x0d << 11) | 0x3a;
#undef HI
#undef LO

  /* Flush the caches.
     See Example 9-4 in the Nios II Software Developer's Handbook.  */
  for (i = 0; i < 7; i++)
    asm volatile ("flushd 0(%0); flushi %0" :: "r"(tramp + i) : "memory");
  asm volatile ("flushp" ::: "memory");

  closure->cif = cif;
  closure->fun = fun;
  closure->user_data = user_data;

  return FFI_OK;
}

