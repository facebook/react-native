/* -----------------------------------------------------------------------
   ffi.c - Copyright (c) 2017, 2022  Anthony Green
           Copyright (c) 1996, 1998, 1999, 2001, 2007, 2008  Red Hat, Inc.
           Copyright (c) 2002  Ranjit Mathew
           Copyright (c) 2002  Bo Thorsen
           Copyright (c) 2002  Roger Sayle
           Copyright (C) 2008, 2010  Free Software Foundation, Inc.

   x86 Foreign Function Interface

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

#if defined(__i386__) || defined(_M_IX86)
#include <ffi.h>
#include <ffi_common.h>
#include <stdint.h>
#include <stdlib.h>
#include <tramp.h>
#include "internal.h"

/* Force FFI_TYPE_LONGDOUBLE to be different than FFI_TYPE_DOUBLE;
   all further uses in this file will refer to the 80-bit type.  */
#if FFI_TYPE_LONGDOUBLE != FFI_TYPE_DOUBLE
# if FFI_TYPE_LONGDOUBLE != 4
#  error FFI_TYPE_LONGDOUBLE out of date
# endif
#else
# undef FFI_TYPE_LONGDOUBLE
# define FFI_TYPE_LONGDOUBLE 4
#endif

#if defined(__GNUC__) && !defined(__declspec)
# define __declspec(x)  __attribute__((x))
#endif

#if defined(_MSC_VER) && defined(_M_IX86)
/* Stack is not 16-byte aligned on Windows.  */
#define STACK_ALIGN(bytes) (bytes)
#else
#define STACK_ALIGN(bytes) FFI_ALIGN (bytes, 16)
#endif

/* Perform machine dependent cif processing.  */
ffi_status FFI_HIDDEN
ffi_prep_cif_machdep(ffi_cif *cif)
{
  size_t bytes = 0;
  int i, n, flags, cabi = cif->abi;

  switch (cabi)
    {
    case FFI_SYSV:
    case FFI_STDCALL:
    case FFI_THISCALL:
    case FFI_FASTCALL:
    case FFI_MS_CDECL:
    case FFI_PASCAL:
    case FFI_REGISTER:
      break;
    default:
      return FFI_BAD_ABI;
    }

  switch (cif->rtype->type)
    {
    case FFI_TYPE_VOID:
      flags = X86_RET_VOID;
      break;
    case FFI_TYPE_FLOAT:
      flags = X86_RET_FLOAT;
      break;
    case FFI_TYPE_DOUBLE:
      flags = X86_RET_DOUBLE;
      break;
    case FFI_TYPE_LONGDOUBLE:
      flags = X86_RET_LDOUBLE;
      break;
    case FFI_TYPE_UINT8:
      flags = X86_RET_UINT8;
      break;
    case FFI_TYPE_UINT16:
      flags = X86_RET_UINT16;
      break;
    case FFI_TYPE_SINT8:
      flags = X86_RET_SINT8;
      break;
    case FFI_TYPE_SINT16:
      flags = X86_RET_SINT16;
      break;
    case FFI_TYPE_INT:
    case FFI_TYPE_SINT32:
    case FFI_TYPE_UINT32:
    case FFI_TYPE_POINTER:
      flags = X86_RET_INT32;
      break;
    case FFI_TYPE_SINT64:
    case FFI_TYPE_UINT64:
      flags = X86_RET_INT64;
      break;
    case FFI_TYPE_STRUCT:
      {
#ifdef X86_WIN32
        size_t size = cif->rtype->size;
        if (size == 1)
          flags = X86_RET_STRUCT_1B;
        else if (size == 2)
          flags = X86_RET_STRUCT_2B;
        else if (size == 4)
          flags = X86_RET_INT32;
        else if (size == 8)
          flags = X86_RET_INT64;
        else
#endif
          {
          do_struct:
            switch (cabi)
              {
              case FFI_THISCALL:
              case FFI_FASTCALL:
              case FFI_STDCALL:
              case FFI_MS_CDECL:
                flags = X86_RET_STRUCTARG;
                break;
              default:
                flags = X86_RET_STRUCTPOP;
                break;
              }
            /* Allocate space for return value pointer.  */
            bytes += FFI_ALIGN (sizeof(void*), FFI_SIZEOF_ARG);
          }
      }
      break;
    case FFI_TYPE_COMPLEX:
      switch (cif->rtype->elements[0]->type)
	{
	case FFI_TYPE_DOUBLE:
	case FFI_TYPE_LONGDOUBLE:
	case FFI_TYPE_SINT64:
	case FFI_TYPE_UINT64:
	  goto do_struct;
	case FFI_TYPE_FLOAT:
	case FFI_TYPE_INT:
	case FFI_TYPE_SINT32:
	case FFI_TYPE_UINT32:
	  flags = X86_RET_INT64;
	  break;
	case FFI_TYPE_SINT16:
	case FFI_TYPE_UINT16:
	  flags = X86_RET_INT32;
	  break;
	case FFI_TYPE_SINT8:
	case FFI_TYPE_UINT8:
	  flags = X86_RET_STRUCT_2B;
	  break;
	default:
	  return FFI_BAD_TYPEDEF;
	}
      break;
    default:
      return FFI_BAD_TYPEDEF;
    }
  cif->flags = flags;

  for (i = 0, n = cif->nargs; i < n; i++)
    {
      ffi_type *t = cif->arg_types[i];

#if defined(X86_WIN32)
      if (cabi == FFI_STDCALL)
        bytes = FFI_ALIGN (bytes, FFI_SIZEOF_ARG);
      else
#endif
        bytes = FFI_ALIGN (bytes, t->alignment);
      bytes += FFI_ALIGN (t->size, FFI_SIZEOF_ARG);
    }
  cif->bytes = bytes;

  return FFI_OK;
}

static ffi_arg
extend_basic_type(void *arg, int type)
{
  switch (type)
    {
    case FFI_TYPE_SINT8:
      return *(SINT8 *)arg;
    case FFI_TYPE_UINT8:
      return *(UINT8 *)arg;
    case FFI_TYPE_SINT16:
      return *(SINT16 *)arg;
    case FFI_TYPE_UINT16:
      return *(UINT16 *)arg;

    case FFI_TYPE_SINT32:
    case FFI_TYPE_UINT32:
    case FFI_TYPE_POINTER:
    case FFI_TYPE_FLOAT:
      return *(UINT32 *)arg;

    default:
      abort();
    }
}

struct call_frame
{
  void *ebp;		/* 0 */
  void *retaddr;	/* 4 */
  void (*fn)(void);	/* 8 */
  int flags;		/* 12 */
  void *rvalue;		/* 16 */
  unsigned regs[3];	/* 20-28 */
};

struct abi_params
{
  int dir;		/* parameter growth direction */
  int static_chain;	/* the static chain register used by gcc */
  int nregs;		/* number of register parameters */
  int regs[3];
};

static const struct abi_params abi_params[FFI_LAST_ABI] = {
  [FFI_SYSV] = { 1, R_ECX, 0 },
  [FFI_THISCALL] = { 1, R_EAX, 1, { R_ECX } },
  [FFI_FASTCALL] = { 1, R_EAX, 2, { R_ECX, R_EDX } },
  [FFI_STDCALL] = { 1, R_ECX, 0 },
  [FFI_PASCAL] = { -1, R_ECX, 0 },
  /* ??? No defined static chain; gcc does not support REGISTER.  */
  [FFI_REGISTER] = { -1, R_ECX, 3, { R_EAX, R_EDX, R_ECX } },
  [FFI_MS_CDECL] = { 1, R_ECX, 0 }
};

#ifdef HAVE_FASTCALL
  #ifdef _MSC_VER
    #define FFI_DECLARE_FASTCALL __fastcall
  #else
    #define FFI_DECLARE_FASTCALL __declspec(fastcall)
  #endif
#else
  #define FFI_DECLARE_FASTCALL
#endif

extern void FFI_DECLARE_FASTCALL ffi_call_i386(struct call_frame *, char *) FFI_HIDDEN;

/* We perform some black magic here to use some of the parent's stack frame in
 * ffi_call_i386() that breaks with the MSVC compiler with the /RTCs or /GZ
 * flags.  Disable the 'Stack frame run time error checking' for this function
 * so we don't hit weird exceptions in debug builds. */
#if defined(_MSC_VER)
#pragma runtime_checks("s", off)
#endif
static void
ffi_call_int (ffi_cif *cif, void (*fn)(void), void *rvalue,
	      void **avalue, void *closure)
{
  size_t rsize, bytes;
  struct call_frame *frame;
  char *stack, *argp;
  ffi_type **arg_types;
  int flags, cabi, i, n, dir, narg_reg;
  const struct abi_params *pabi;

  flags = cif->flags;
  cabi = cif->abi;
  pabi = &abi_params[cabi];
  dir = pabi->dir;

  rsize = 0;
  if (rvalue == NULL)
    {
      switch (flags)
	{
	case X86_RET_FLOAT:
	case X86_RET_DOUBLE:
	case X86_RET_LDOUBLE:
	case X86_RET_STRUCTPOP:
	case X86_RET_STRUCTARG:
	  /* The float cases need to pop the 387 stack.
	     The struct cases need to pass a valid pointer to the callee.  */
	  rsize = cif->rtype->size;
	  break;
	default:
	  /* We can pretend that the callee returns nothing.  */
	  flags = X86_RET_VOID;
	  break;
	}
    }

  bytes = STACK_ALIGN (cif->bytes);
  stack = alloca(bytes + sizeof(*frame) + rsize);
  argp = (dir < 0 ? stack + bytes : stack);
  frame = (struct call_frame *)(stack + bytes);
  if (rsize)
    rvalue = frame + 1;

  frame->fn = fn;
  frame->flags = flags;
  frame->rvalue = rvalue;
  frame->regs[pabi->static_chain] = (unsigned)closure;

  narg_reg = 0;
  switch (flags)
    {
    case X86_RET_STRUCTARG:
      /* The pointer is passed as the first argument.  */
      if (pabi->nregs > 0)
	{
	  frame->regs[pabi->regs[0]] = (unsigned)rvalue;
	  narg_reg = 1;
	  break;
	}
      /* fallthru */
    case X86_RET_STRUCTPOP:
      *(void **)argp = rvalue;
      argp += sizeof(void *);
      break;
    }

  arg_types = cif->arg_types;
  for (i = 0, n = cif->nargs; i < n; i++)
    {
      ffi_type *ty = arg_types[i];
      void *valp = avalue[i];
      size_t z = ty->size;
      int t = ty->type;

      if (z <= FFI_SIZEOF_ARG && t != FFI_TYPE_STRUCT)
        {
	  ffi_arg val = extend_basic_type (valp, t);

	  if (t != FFI_TYPE_FLOAT && narg_reg < pabi->nregs)
	    frame->regs[pabi->regs[narg_reg++]] = val;
	  else if (dir < 0)
	    {
	      argp -= 4;
	      *(ffi_arg *)argp = val;
	    }
	  else
	    {
	      *(ffi_arg *)argp = val;
	      argp += 4;
	    }
	}
      else
	{
	  size_t za = FFI_ALIGN (z, FFI_SIZEOF_ARG);
	  size_t align = FFI_SIZEOF_ARG;

	  /* Issue 434: For thiscall and fastcall, if the paramter passed
	     as 64-bit integer or struct, all following integer parameters
	     will be passed on stack.  */
	  if ((cabi == FFI_THISCALL || cabi == FFI_FASTCALL)
	      && (t == FFI_TYPE_SINT64
		  || t == FFI_TYPE_UINT64
		  || t == FFI_TYPE_STRUCT))
	    narg_reg = 2;

	  /* Alignment rules for arguments are quite complex.  Vectors and
	     structures with 16 byte alignment get it.  Note that long double
	     on Darwin does have 16 byte alignment, and does not get this
	     alignment if passed directly; a structure with a long double
	     inside, however, would get 16 byte alignment.  Since libffi does
	     not support vectors, we need non concern ourselves with other
	     cases.  */
	  if (t == FFI_TYPE_STRUCT && ty->alignment >= 16)
	    align = 16;

	  if (dir < 0)
	    {
	      /* ??? These reverse argument ABIs are probably too old
		 to have cared about alignment.  Someone should check.  */
	      argp -= za;
	      memcpy (argp, valp, z);
	    }
	  else
	    {
	      argp = (char *)FFI_ALIGN (argp, align);
	      memcpy (argp, valp, z);
	      argp += za;
	    }
	}
    }
  FFI_ASSERT (dir > 0 || argp == stack);

  ffi_call_i386 (frame, stack);
}
#if defined(_MSC_VER)
#pragma runtime_checks("s", restore)
#endif

void
ffi_call (ffi_cif *cif, void (*fn)(void), void *rvalue, void **avalue)
{
  ffi_call_int (cif, fn, rvalue, avalue, NULL);
}

#ifdef FFI_GO_CLOSURES
void
ffi_call_go (ffi_cif *cif, void (*fn)(void), void *rvalue,
	     void **avalue, void *closure)
{
  ffi_call_int (cif, fn, rvalue, avalue, closure);
}
#endif

/** private members **/

void FFI_HIDDEN ffi_closure_i386(void);
void FFI_HIDDEN ffi_closure_STDCALL(void);
void FFI_HIDDEN ffi_closure_REGISTER(void);
#if defined(FFI_EXEC_STATIC_TRAMP)
void FFI_HIDDEN ffi_closure_i386_alt(void);
void FFI_HIDDEN ffi_closure_STDCALL_alt(void);
void FFI_HIDDEN ffi_closure_REGISTER_alt(void);
#endif

struct closure_frame
{
  unsigned rettemp[4];				/* 0 */
  unsigned regs[3];				/* 16-24 */
  ffi_cif *cif;					/* 28 */
  void (*fun)(ffi_cif*,void*,void**,void*);	/* 32 */
  void *user_data;				/* 36 */
};

int FFI_HIDDEN FFI_DECLARE_FASTCALL
ffi_closure_inner (struct closure_frame *frame, char *stack)
{
  ffi_cif *cif = frame->cif;
  int cabi, i, n, flags, dir, narg_reg;
  const struct abi_params *pabi;
  ffi_type **arg_types;
  char *argp;
  void *rvalue;
  void **avalue;

  cabi = cif->abi;
  flags = cif->flags;
  narg_reg = 0;
  rvalue = frame->rettemp;
  pabi = &abi_params[cabi];
  dir = pabi->dir;
  argp = (dir < 0 ? stack + STACK_ALIGN (cif->bytes) : stack);

  switch (flags)
    {
    case X86_RET_STRUCTARG:
      if (pabi->nregs > 0)
	{
	  rvalue = (void *)frame->regs[pabi->regs[0]];
	  narg_reg = 1;
	  frame->rettemp[0] = (unsigned)rvalue;
	  break;
	}
      /* fallthru */
    case X86_RET_STRUCTPOP:
      rvalue = *(void **)argp;
      argp += sizeof(void *);
      frame->rettemp[0] = (unsigned)rvalue;
      break;
    }

  n = cif->nargs;
  avalue = alloca(sizeof(void *) * n);

  arg_types = cif->arg_types;
  for (i = 0; i < n; ++i)
    {
      ffi_type *ty = arg_types[i];
      size_t z = ty->size;
      int t = ty->type;
      void *valp;

      if (z <= FFI_SIZEOF_ARG && t != FFI_TYPE_STRUCT)
	{
	  if (t != FFI_TYPE_FLOAT && narg_reg < pabi->nregs)
	    valp = &frame->regs[pabi->regs[narg_reg++]];
	  else if (dir < 0)
	    {
	      argp -= 4;
	      valp = argp;
	    }
	  else
	    {
	      valp = argp;
	      argp += 4;
	    }
	}
      else
	{
	  size_t za = FFI_ALIGN (z, FFI_SIZEOF_ARG);
	  size_t align = FFI_SIZEOF_ARG;

	  /* See the comment in ffi_call_int.  */
	  if (t == FFI_TYPE_STRUCT && ty->alignment >= 16)
	    align = 16;

	  /* Issue 434: For thiscall and fastcall, if the paramter passed
	     as 64-bit integer or struct, all following integer parameters
	     will be passed on stack.  */
	  if ((cabi == FFI_THISCALL || cabi == FFI_FASTCALL)
	      && (t == FFI_TYPE_SINT64
		  || t == FFI_TYPE_UINT64
		  || t == FFI_TYPE_STRUCT))
	    narg_reg = 2;

	  if (dir < 0)
	    {
	      /* ??? These reverse argument ABIs are probably too old
		 to have cared about alignment.  Someone should check.  */
	      argp -= za;
	      valp = argp;
	    }
	  else
	    {
	      argp = (char *)FFI_ALIGN (argp, align);
	      valp = argp;
	      argp += za;
	    }
	}

      avalue[i] = valp;
    }

  frame->fun (cif, rvalue, avalue, frame->user_data);

  switch (cabi)
    {
    case FFI_STDCALL:
      return flags | (cif->bytes << X86_RET_POP_SHIFT);
    case FFI_THISCALL:
    case FFI_FASTCALL:
      return flags | ((cif->bytes - (narg_reg * FFI_SIZEOF_ARG))
          << X86_RET_POP_SHIFT);
    default:
      return flags;
    }
}

ffi_status
ffi_prep_closure_loc (ffi_closure* closure,
                      ffi_cif* cif,
                      void (*fun)(ffi_cif*,void*,void**,void*),
                      void *user_data,
                      void *codeloc)
{
  char *tramp = closure->tramp;
  void (*dest)(void);
  int op = 0xb8;  /* movl imm, %eax */

  switch (cif->abi)
    {
    case FFI_SYSV:
    case FFI_MS_CDECL:
      dest = ffi_closure_i386;
      break;
    case FFI_STDCALL:
    case FFI_THISCALL:
    case FFI_FASTCALL:
    case FFI_PASCAL:
      dest = ffi_closure_STDCALL;
      break;
    case FFI_REGISTER:
      dest = ffi_closure_REGISTER;
      op = 0x68;  /* pushl imm */
      break;
    default:
      return FFI_BAD_ABI;
    }

#if defined(FFI_EXEC_STATIC_TRAMP)
  if (ffi_tramp_is_present(closure))
    {
      /* Initialize the static trampoline's parameters. */
      if (dest == ffi_closure_i386)
        dest = ffi_closure_i386_alt;
      else if (dest == ffi_closure_STDCALL)
        dest = ffi_closure_STDCALL_alt;
      else
        dest = ffi_closure_REGISTER_alt;
      ffi_tramp_set_parms (closure->ftramp, dest, closure);
      goto out;
    }
#endif

  /* Initialize the dynamic trampoline. */
  /* endbr32.  */
  *(UINT32 *) tramp = 0xfb1e0ff3;

  /* movl or pushl immediate.  */
  tramp[4] = op;
  *(void **)(tramp + 5) = codeloc;

  /* jmp dest */
  tramp[9] = 0xe9;
  *(unsigned *)(tramp + 10) = (unsigned)dest - ((unsigned)codeloc + 14);

#if defined(FFI_EXEC_STATIC_TRAMP)
out:
#endif
  closure->cif = cif;
  closure->fun = fun;
  closure->user_data = user_data;

  return FFI_OK;
}

#ifdef FFI_GO_CLOSURES

void FFI_HIDDEN ffi_go_closure_EAX(void);
void FFI_HIDDEN ffi_go_closure_ECX(void);
void FFI_HIDDEN ffi_go_closure_STDCALL(void);

ffi_status
ffi_prep_go_closure (ffi_go_closure* closure, ffi_cif* cif,
		     void (*fun)(ffi_cif*,void*,void**,void*))
{
  void (*dest)(void);

  switch (cif->abi)
    {
    case FFI_SYSV:
    case FFI_MS_CDECL:
      dest = ffi_go_closure_ECX;
      break;
    case FFI_THISCALL:
    case FFI_FASTCALL:
      dest = ffi_go_closure_EAX;
      break;
    case FFI_STDCALL:
    case FFI_PASCAL:
      dest = ffi_go_closure_STDCALL;
      break;
    case FFI_REGISTER:
    default:
      return FFI_BAD_ABI;
    }

  closure->tramp = dest;
  closure->cif = cif;
  closure->fun = fun;

  return FFI_OK;
}

#endif /* FFI_GO_CLOSURES */

/* ------- Native raw API support -------------------------------- */

#if !FFI_NO_RAW_API

void FFI_HIDDEN ffi_closure_raw_SYSV(void);
void FFI_HIDDEN ffi_closure_raw_THISCALL(void);

ffi_status
ffi_prep_raw_closure_loc (ffi_raw_closure *closure,
                          ffi_cif *cif,
                          void (*fun)(ffi_cif*,void*,ffi_raw*,void*),
                          void *user_data,
                          void *codeloc)
{
  char *tramp = closure->tramp;
  void (*dest)(void);
  int i;

  /* We currently don't support certain kinds of arguments for raw
     closures.  This should be implemented by a separate assembly
     language routine, since it would require argument processing,
     something we don't do now for performance.  */
  for (i = cif->nargs-1; i >= 0; i--)
    switch (cif->arg_types[i]->type)
      {
      case FFI_TYPE_STRUCT:
      case FFI_TYPE_LONGDOUBLE:
	return FFI_BAD_TYPEDEF;
      }

  switch (cif->abi)
    {
    case FFI_THISCALL:
      dest = ffi_closure_raw_THISCALL;
      break;
    case FFI_SYSV:
      dest = ffi_closure_raw_SYSV;
      break;
    default:
      return FFI_BAD_ABI;
    }

  /* movl imm, %eax.  */
  tramp[0] = 0xb8;
  *(void **)(tramp + 1) = codeloc;

  /* jmp dest */
  tramp[5] = 0xe9;
  *(unsigned *)(tramp + 6) = (unsigned)dest - ((unsigned)codeloc + 10);

  closure->cif = cif;
  closure->fun = fun;
  closure->user_data = user_data;

  return FFI_OK;
}

void
ffi_raw_call(ffi_cif *cif, void (*fn)(void), void *rvalue, ffi_raw *avalue)
{
  size_t rsize, bytes;
  struct call_frame *frame;
  char *stack, *argp;
  ffi_type **arg_types;
  int flags, cabi, i, n, narg_reg;
  const struct abi_params *pabi;

  flags = cif->flags;
  cabi = cif->abi;
  pabi = &abi_params[cabi];

  rsize = 0;
  if (rvalue == NULL)
    {
      switch (flags)
	{
	case X86_RET_FLOAT:
	case X86_RET_DOUBLE:
	case X86_RET_LDOUBLE:
	case X86_RET_STRUCTPOP:
	case X86_RET_STRUCTARG:
	  /* The float cases need to pop the 387 stack.
	     The struct cases need to pass a valid pointer to the callee.  */
	  rsize = cif->rtype->size;
	  break;
	default:
	  /* We can pretend that the callee returns nothing.  */
	  flags = X86_RET_VOID;
	  break;
	}
    }

  bytes = STACK_ALIGN (cif->bytes);
  argp = stack =
      (void *)((uintptr_t)alloca(bytes + sizeof(*frame) + rsize + 15) & ~16);
  frame = (struct call_frame *)(stack + bytes);
  if (rsize)
    rvalue = frame + 1;

  frame->fn = fn;
  frame->flags = flags;
  frame->rvalue = rvalue;

  narg_reg = 0;
  switch (flags)
    {
    case X86_RET_STRUCTARG:
      /* The pointer is passed as the first argument.  */
      if (pabi->nregs > 0)
	{
	  frame->regs[pabi->regs[0]] = (unsigned)rvalue;
	  narg_reg = 1;
	  break;
	}
      /* fallthru */
    case X86_RET_STRUCTPOP:
      *(void **)argp = rvalue;
      argp += sizeof(void *);
      bytes -= sizeof(void *);
      break;
    }

  arg_types = cif->arg_types;
  for (i = 0, n = cif->nargs; narg_reg < pabi->nregs && i < n; i++)
    {
      ffi_type *ty = arg_types[i];
      size_t z = ty->size;
      int t = ty->type;

      if (z <= FFI_SIZEOF_ARG && t != FFI_TYPE_STRUCT && t != FFI_TYPE_FLOAT)
	{
	  ffi_arg val = extend_basic_type (avalue, t);
	  frame->regs[pabi->regs[narg_reg++]] = val;
	  z = FFI_SIZEOF_ARG;
	}
      else
	{
	  memcpy (argp, avalue, z);
	  z = FFI_ALIGN (z, FFI_SIZEOF_ARG);
	  argp += z;
	}
      avalue += z;
      bytes -= z;
    }
  if (i < n)
    memcpy (argp, avalue, bytes);

  ffi_call_i386 (frame, stack);
}
#endif /* !FFI_NO_RAW_API */

#if defined(FFI_EXEC_STATIC_TRAMP)
void *
ffi_tramp_arch (size_t *tramp_size, size_t *map_size)
{
  extern void *trampoline_code_table;

  *map_size = X86_TRAMP_MAP_SIZE;
  *tramp_size = X86_TRAMP_SIZE;
  return &trampoline_code_table;
}
#endif

#endif /* __i386__ */
