/* Area:	ffi_call
   Purpose:	Check return value signed char.
   Limitations:	none.
   PR:		none.
   Originator:	From the original ffitest.c  */

/* { dg-do run } */
#include "ffitest.h"

static signed char return_sc(signed char sc)
{
  return sc;
}
int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  ffi_arg rint;
  signed char sc;

  args[0] = &ffi_type_schar;
  values[0] = &sc;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 1,
		     &ffi_type_schar, args) == FFI_OK);

  for (sc = (signed char) -127;
       sc < (signed char) 127; sc++)
    {
      ffi_call(&cif, FFI_FN(return_sc), &rint, values);
      CHECK((signed char)rint == sc);
    }
  exit(0);
}
