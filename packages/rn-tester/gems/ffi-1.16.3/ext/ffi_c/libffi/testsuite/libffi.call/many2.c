/* Area:        ffi_call
   Purpose:     Check uint8_t arguments.
   Limitations: none.
   PR:          PR45677.
   Originator:  Dan Witte <dwitte@gmail.com> 20100916  */

/* { dg-do run } */

#include "ffitest.h"

#define NARGS 7

typedef unsigned char u8;

#ifdef __GNUC__
__attribute__((noinline))
#endif
uint8_t
foo (uint8_t a, uint8_t b, uint8_t c, uint8_t d,
     uint8_t e, uint8_t f, uint8_t g)
{
  return a + b + c + d + e + f + g;
}

uint8_t ABI_ATTR
bar (uint8_t a, uint8_t b, uint8_t c, uint8_t d,
     uint8_t e, uint8_t f, uint8_t g)
{
  return foo (a, b, c, d, e, f, g);
}

int
main (void)
{
  ffi_type *ffitypes[NARGS];
  int i;
  ffi_cif cif;
  ffi_arg result = 0;
  uint8_t args[NARGS];
  void *argptrs[NARGS];

  for (i = 0; i < NARGS; ++i)
    ffitypes[i] = &ffi_type_uint8;

  CHECK (ffi_prep_cif (&cif, ABI_NUM, NARGS,
		       &ffi_type_uint8, ffitypes) == FFI_OK);

  for (i = 0; i < NARGS; ++i)
    {
      args[i] = i;
      argptrs[i] = &args[i];
    }
  ffi_call (&cif, FFI_FN (bar), &result, argptrs);

  CHECK (result == 21);
  return 0;
}
