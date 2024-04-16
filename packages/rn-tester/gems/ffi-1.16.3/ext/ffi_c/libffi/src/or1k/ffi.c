/* -----------------------------------------------------------------------
   ffi.c - Copyright (c) 2014 Sebastian Macke <sebastian@macke.de>

   OpenRISC Foreign Function Interface

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
#include "ffi_common.h"

/* ffi_prep_args is called by the assembly routine once stack space
   has been allocated for the function's arguments */

void* ffi_prep_args(char *stack, extended_cif *ecif)
{
  char *stacktemp = stack;
  int i, s;
  ffi_type **arg;
  int count = 0;
  int nfixedargs;

  nfixedargs = ecif->cif->nfixedargs;
  arg = ecif->cif->arg_types;
  void **argv = ecif->avalue;

  if (ecif->cif->rtype->type == FFI_TYPE_STRUCT)
    {
      *(void **) stack = ecif->rvalue;
      stack += 4;
      count = 4;
    }
  for(i=0; i<ecif->cif->nargs; i++)
  {

    /* variadic args are saved on stack */
    if ((nfixedargs == 0) && (count < 24))
      {
        count = 24;
        stack = stacktemp + 24;
      }
    nfixedargs--;

    s = 4;
    switch((*arg)->type)
      {
      case FFI_TYPE_STRUCT:
        *(void **)stack = *argv;
        break;

      case FFI_TYPE_SINT8:
        *(signed int *) stack = (signed int)*(SINT8 *)(* argv);
        break;

      case FFI_TYPE_UINT8:
        *(unsigned int *) stack = (unsigned int)*(UINT8 *)(* argv);
        break;

      case FFI_TYPE_SINT16:
        *(signed int *) stack = (signed int)*(SINT16 *)(* argv);
        break;

      case FFI_TYPE_UINT16:
        *(unsigned int *) stack = (unsigned int)*(UINT16 *)(* argv);
        break;

      case FFI_TYPE_SINT32:
      case FFI_TYPE_UINT32:
      case FFI_TYPE_FLOAT:
      case FFI_TYPE_POINTER:
        *(int *)stack = *(int*)(*argv);
        break;

      default: /* 8 byte types */
        if (count == 20) /* never split arguments */
          {
            stack += 4;
            count += 4;
          }
        s = (*arg)->size;
        memcpy(stack, *argv, s);
        break;
      }

    stack += s;
    count += s;
    argv++;
    arg++;
  }
  return stacktemp + ((count>24)?24:0);
}

extern void ffi_call_SYSV(unsigned,
                          extended_cif *,
                          void *(*)(int *, extended_cif *),
                          unsigned *,
                          void (*fn)(void),
                          unsigned);


void ffi_call(ffi_cif *cif, void (*fn)(void), void *rvalue, void **avalue)
{
  int i;
  int size;
  ffi_type **arg;

  /* Calculate size to allocate on stack */

  for(i = 0, arg = cif->arg_types, size=0; i < cif->nargs; i++, arg++)
    {
      if ((*arg)->type == FFI_TYPE_STRUCT)
        size += 4;
      else
      if ((*arg)->size <= 4)
        size += 4;
      else
        size += 8;

      /* If we have any large structure arguments, make a copy so we are passing
         by value.  */
      {
        ffi_type *at = cif->arg_types[i];
        int size = at->size;
        if (at->type == FFI_TYPE_STRUCT) /* && size > 4) All struct args? */
          {
            char *argcopy = alloca (size);
            memcpy (argcopy, avalue[i], size);
            avalue[i] = argcopy;
          }
      }
    }

  /* for variadic functions more space is needed on the stack */
  if (cif->nargs != cif->nfixedargs)
    size += 24;

  if (cif->rtype->type == FFI_TYPE_STRUCT)
    size += 4;


  extended_cif ecif;
  ecif.cif = cif;
  ecif.avalue = avalue;
  ecif.rvalue = rvalue;

  switch (cif->abi)
  {
    case FFI_SYSV:
      ffi_call_SYSV(size, &ecif, ffi_prep_args, rvalue, fn, cif->flags);
      break;
    default:
      FFI_ASSERT(0);
      break;
  }
}


void ffi_closure_SYSV(unsigned long r3, unsigned long r4, unsigned long r5,
                      unsigned long r6, unsigned long r7, unsigned long r8)
{
  register int *sp __asm__ ("r17");
  register int *r13 __asm__ ("r13");

  ffi_closure* closure = (ffi_closure*) r13;
  char *stack_args = sp;

  /* Lay the register arguments down in a continuous chunk of memory.  */
  unsigned register_args[6] =
    { r3, r4, r5, r6, r7, r8 };

  /* Pointer to a struct return value.  */
  void *struct_rvalue = (void *) r3;

  ffi_cif *cif = closure->cif;
  ffi_type **arg_types = cif->arg_types;
  void **avalue = alloca (cif->nargs * sizeof(void *));
  char *ptr = (char *) register_args;
  int count = 0;
  int nfixedargs = cif->nfixedargs;
  int i;

  /* preserve struct type return pointer passing */

  if ((cif->rtype != NULL) && (cif->rtype->type == FFI_TYPE_STRUCT))
  {
    ptr += 4;
    count = 4;
  }

  /* Find the address of each argument.  */
  for (i = 0; i < cif->nargs; i++)
    {

      /* variadic args are saved on stack */
      if ((nfixedargs == 0) && (count < 24))
        {
          ptr = stack_args;
          count = 24;
        }
      nfixedargs--;

      switch (arg_types[i]->type)
        {
        case FFI_TYPE_SINT8:
        case FFI_TYPE_UINT8:
          avalue[i] = ptr + 3;
          break;

        case FFI_TYPE_SINT16:
        case FFI_TYPE_UINT16:
          avalue[i] = ptr + 2;
          break;

        case FFI_TYPE_SINT32:
        case FFI_TYPE_UINT32:
        case FFI_TYPE_FLOAT:
        case FFI_TYPE_POINTER:
          avalue[i] = ptr;
          break;

        case FFI_TYPE_STRUCT:
          avalue[i] = *(void**)ptr;
          break;

        default:
          /* 8-byte values  */

          /* arguments are never splitted */
          if (ptr == &register_args[5])
            ptr = stack_args;
          avalue[i] = ptr;
          ptr += 4;
          count += 4;
          break;
        }
      ptr += 4;
      count += 4;

      /* If we've handled more arguments than fit in registers,
         start looking at the those passed on the stack.  */

      if (count == 24)
        ptr = stack_args;
    }

  if (cif->rtype && (cif->rtype->type == FFI_TYPE_STRUCT))
    {
      (closure->fun) (cif, struct_rvalue, avalue, closure->user_data);
    } else
    {
      long long rvalue;
      (closure->fun) (cif, &rvalue, avalue, closure->user_data);
      if (cif->rtype)
        asm ("l.ori r12, %0, 0x0\n l.lwz r11, 0(r12)\n l.lwz r12, 4(r12)" : : "r" (&rvalue));
    }
}


ffi_status
ffi_prep_closure_loc (ffi_closure* closure,
                      ffi_cif* cif,
                      void (*fun)(ffi_cif*,void*,void**,void*),
                      void *user_data,
                      void *codeloc)
{
  unsigned short *tramp = (unsigned short *) closure->tramp;
  unsigned long fn = (unsigned long) ffi_closure_SYSV;
  unsigned long cls = (unsigned long) codeloc;

  if (cif->abi != FFI_SYSV)
    return FFI_BAD_ABI;

  closure->cif = cif;
  closure->user_data = user_data;
  closure->fun = fun;

  /* write pointers to temporary registers */
  tramp[0] = (0x6 << 10) | (13 << 5); /* l.movhi r13, ... */
  tramp[1] = cls >> 16;
  tramp[2] = (0x2a << 10) | (13 << 5) | 13; /* l.ori r13, r13, ... */
  tramp[3] = cls & 0xFFFF;

  tramp[4] = (0x6 << 10) | (15 << 5); /* l.movhi r15, ... */
  tramp[5] = fn >> 16;
  tramp[6] = (0x2a << 10) | (15 << 5) | 15; /* l.ori r15, r15 ... */
  tramp[7] = fn & 0xFFFF;

  tramp[8] = (0x11 << 10); /* l.jr r15 */
  tramp[9] = 15 << 11;

  tramp[10] = (0x2a << 10) | (17 << 5) | 1; /* l.ori r17, r1, ... */
  tramp[11] = 0x0;

  return FFI_OK;
}


ffi_status ffi_prep_cif_machdep (ffi_cif *cif)
{
  cif->flags = 0;

  /* structures are returned as pointers */
  if (cif->rtype->type == FFI_TYPE_STRUCT)
    cif->flags = FFI_TYPE_STRUCT;
  else
  if (cif->rtype->size > 4)
    cif->flags = FFI_TYPE_UINT64;

  cif->nfixedargs = cif->nargs;

  return FFI_OK;
}


ffi_status ffi_prep_cif_machdep_var(ffi_cif *cif,
         unsigned int nfixedargs, unsigned int ntotalargs)
{
  ffi_status status;

  status = ffi_prep_cif_machdep (cif);
  cif->nfixedargs = nfixedargs;
  return status;
}
