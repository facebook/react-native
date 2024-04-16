/* -----------------------------------------------------------------------
   ffi.c - Copyright (c) 2012 Tilera Corp.

   TILE Foreign Function Interface

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
#include <stdint.h>
#include <unistd.h>
#include <arch/abi.h>
#include <arch/icache.h>
#include <arch/opcode.h>


/* The first 10 registers are used to pass arguments and return values. */
#define NUM_ARG_REGS 10

/* Performs a raw function call with the given NUM_ARG_REGS register arguments
   and the specified additional stack arguments (if any). */
extern void ffi_call_tile(ffi_sarg reg_args[NUM_ARG_REGS],
                          const ffi_sarg *stack_args,
                          size_t stack_args_bytes,
                          void (*fnaddr)(void))
  FFI_HIDDEN;

/* This handles the raw call from the closure stub, cleaning up the
   parameters and delegating to ffi_closure_tile_inner. */
extern void ffi_closure_tile(void) FFI_HIDDEN;


ffi_status
ffi_prep_cif_machdep(ffi_cif *cif)
{
  /* We always allocate room for all registers. Even if we don't
     use them as parameters, they get returned in the same array
     as struct return values so we need to make room. */
  if (cif->bytes < NUM_ARG_REGS * FFI_SIZEOF_ARG)
    cif->bytes = NUM_ARG_REGS * FFI_SIZEOF_ARG;

  if (cif->rtype->size > NUM_ARG_REGS * FFI_SIZEOF_ARG)
    cif->flags = FFI_TYPE_STRUCT;
  else
    cif->flags = FFI_TYPE_INT;

  /* Nothing to do. */
  return FFI_OK;
}


static long
assign_to_ffi_arg(ffi_sarg *out, void *in, const ffi_type *type,
                  int write_to_reg)
{
  switch (type->type)
    {
    case FFI_TYPE_SINT8:
      *out = *(SINT8 *)in;
      return 1;

    case FFI_TYPE_UINT8:
      *out = *(UINT8 *)in;
      return 1;

    case FFI_TYPE_SINT16:
      *out = *(SINT16 *)in;
      return 1;

    case FFI_TYPE_UINT16:
      *out = *(UINT16 *)in;
      return 1;

    case FFI_TYPE_SINT32:
    case FFI_TYPE_UINT32:
#ifndef __LP64__
    case FFI_TYPE_POINTER:
#endif
      /* Note that even unsigned 32-bit quantities are sign extended
         on tilegx when stored in a register.  */
      *out = *(SINT32 *)in;
      return 1;

    case FFI_TYPE_FLOAT:
#ifdef __tilegx__
      if (write_to_reg)
        {
          /* Properly sign extend the value.  */
          union { float f; SINT32 s32; } val;
          val.f = *(float *)in;
          *out = val.s32;
        }
      else
#endif
        {
          *(float *)out = *(float *)in;
        }
      return 1;

    case FFI_TYPE_SINT64:
    case FFI_TYPE_UINT64:
    case FFI_TYPE_DOUBLE:
#ifdef __LP64__
    case FFI_TYPE_POINTER:
#endif
      *(UINT64 *)out = *(UINT64 *)in;
      return sizeof(UINT64) / FFI_SIZEOF_ARG;

    case FFI_TYPE_STRUCT:
      memcpy(out, in, type->size);
      return (type->size + FFI_SIZEOF_ARG - 1) / FFI_SIZEOF_ARG;

    case FFI_TYPE_VOID:
      /* Must be a return type. Nothing to do. */
      return 0;

    default:
      FFI_ASSERT(0);
      return -1;
    }
}


void
ffi_call(ffi_cif *cif, void (*fn)(void), void *rvalue, void **avalue)
{
  ffi_sarg * const arg_mem = alloca(cif->bytes);
  ffi_sarg * const reg_args = arg_mem;
  ffi_sarg * const stack_args = &reg_args[NUM_ARG_REGS];
  ffi_sarg *argp = arg_mem;
  ffi_type ** const arg_types = cif->arg_types;
  const long num_args = cif->nargs;
  long i;

  if (cif->flags == FFI_TYPE_STRUCT)
    {
      /* Pass a hidden pointer to the return value. We make sure there
         is scratch space for the callee to store the return value even if
         our caller doesn't care about it. */
      *argp++ = (intptr_t)(rvalue ? rvalue : alloca(cif->rtype->size));

      /* No more work needed to return anything. */
      rvalue = NULL;
    }

  for (i = 0; i < num_args; i++)
    {
      ffi_type *type = arg_types[i];
      void * const arg_in = avalue[i];
      ptrdiff_t arg_word = argp - arg_mem;

#ifndef __tilegx__
      /* Doubleword-aligned values are always in an even-number register
         pair, or doubleword-aligned stack slot if out of registers. */
      long align = arg_word & (type->alignment > FFI_SIZEOF_ARG);
      argp += align;
      arg_word += align;
#endif

      if (type->type == FFI_TYPE_STRUCT)
        {
          const size_t arg_size_in_words =
            (type->size + FFI_SIZEOF_ARG - 1) / FFI_SIZEOF_ARG;

          if (arg_word < NUM_ARG_REGS &&
              arg_word + arg_size_in_words > NUM_ARG_REGS)
            {
              /* Args are not allowed to span registers and the stack. */
              argp = stack_args;
            }

          memcpy(argp, arg_in, type->size);
          argp += arg_size_in_words;
        }
      else
        {
          argp += assign_to_ffi_arg(argp, arg_in, arg_types[i], 1);
        }
    }

  /* Actually do the call. */
  ffi_call_tile(reg_args, stack_args,
                cif->bytes - (NUM_ARG_REGS * FFI_SIZEOF_ARG), fn);

  if (rvalue != NULL)
    assign_to_ffi_arg(rvalue, reg_args, cif->rtype, 0);
}


/* Template code for closure. */
extern const UINT64 ffi_template_tramp_tile[] FFI_HIDDEN;


ffi_status
ffi_prep_closure_loc (ffi_closure *closure,
                      ffi_cif *cif,
                      void (*fun)(ffi_cif*, void*, void**, void*),
                      void *user_data,
                      void *codeloc)
{
#ifdef __tilegx__
  /* TILE-Gx */
  SINT64 c;
  SINT64 h;
  int s;
  UINT64 *out;

  if (cif->abi != FFI_UNIX)
    return FFI_BAD_ABI;

  out = (UINT64 *)closure->tramp;

  c = (intptr_t)closure;
  h = (intptr_t)ffi_closure_tile;
  s = 0;

  /* Find the smallest shift count that doesn't lose information
     (i.e. no need to explicitly insert high bits of the address that
     are just the sign extension of the low bits). */
  while ((c >> s) != (SINT16)(c >> s) || (h >> s) != (SINT16)(h >> s))
    s += 16;

#define OPS(a, b, shift) \
  (create_Imm16_X0((a) >> (shift)) | create_Imm16_X1((b) >> (shift)))

  /* Emit the moveli. */
  *out++ = ffi_template_tramp_tile[0] | OPS(c, h, s);
  for (s -= 16; s >= 0; s -= 16)
    *out++ = ffi_template_tramp_tile[1] | OPS(c, h, s);

#undef OPS

  *out++ = ffi_template_tramp_tile[2];

#else
  /* TILEPro */
  UINT64 *out;
  intptr_t delta;

  if (cif->abi != FFI_UNIX)
    return FFI_BAD_ABI;

  out = (UINT64 *)closure->tramp;
  delta = (intptr_t)ffi_closure_tile - (intptr_t)codeloc;

  *out++ = ffi_template_tramp_tile[0] | create_JOffLong_X1(delta >> 3);
#endif

  closure->cif = cif;
  closure->fun = fun;
  closure->user_data = user_data;

  invalidate_icache(closure->tramp, (char *)out - closure->tramp,
                    getpagesize());

  return FFI_OK;
}


/* This is called by the assembly wrapper for closures. This does
   all of the work. On entry reg_args[0] holds the values the registers
   had when the closure was invoked. On return reg_args[1] holds the register
   values to be returned to the caller (many of which may be garbage). */
void FFI_HIDDEN
ffi_closure_tile_inner(ffi_closure *closure,
                       ffi_sarg reg_args[2][NUM_ARG_REGS],
                       ffi_sarg *stack_args)
{
  ffi_cif * const cif = closure->cif;
  void ** const avalue = alloca(cif->nargs * sizeof(void *));
  void *rvalue;
  ffi_type ** const arg_types = cif->arg_types;
  ffi_sarg * const reg_args_in = reg_args[0];
  ffi_sarg * const reg_args_out = reg_args[1];
  ffi_sarg * argp;
  long i, arg_word, nargs = cif->nargs;
  /* Use a union to guarantee proper alignment for double. */
  union { ffi_sarg arg[NUM_ARG_REGS]; double d; UINT64 u64; } closure_ret;

  /* Start out reading register arguments. */
  argp = reg_args_in;

  /* Copy the caller's structure return address to that the closure
     returns the data directly to the caller.  */
  if (cif->flags == FFI_TYPE_STRUCT)
    {
      /* Return by reference via hidden pointer. */
      rvalue = (void *)(intptr_t)*argp++;
      arg_word = 1;
    }
  else
    {
      /* Return the value in registers. */
      rvalue = &closure_ret;
      arg_word = 0;
    }

  /* Grab the addresses of the arguments. */
  for (i = 0; i < nargs; i++)
    {
      ffi_type * const type = arg_types[i];
      const size_t arg_size_in_words =
        (type->size + FFI_SIZEOF_ARG - 1) / FFI_SIZEOF_ARG;

#ifndef __tilegx__
      /* Doubleword-aligned values are always in an even-number register
         pair, or doubleword-aligned stack slot if out of registers. */
      long align = arg_word & (type->alignment > FFI_SIZEOF_ARG);
      argp += align;
      arg_word += align;
#endif

      if (arg_word == NUM_ARG_REGS ||
          (arg_word < NUM_ARG_REGS &&
           arg_word + arg_size_in_words > NUM_ARG_REGS))
        {
          /* Switch to reading arguments from the stack. */
          argp = stack_args;
          arg_word = NUM_ARG_REGS;
        }

      avalue[i] = argp;
      argp += arg_size_in_words;
      arg_word += arg_size_in_words;
    }

  /* Invoke the closure.  */
  closure->fun(cif, rvalue, avalue, closure->user_data);

  if (cif->flags != FFI_TYPE_STRUCT)
    {
      /* Canonicalize for register representation. */
      assign_to_ffi_arg(reg_args_out, &closure_ret, cif->rtype, 1);
    }
}
