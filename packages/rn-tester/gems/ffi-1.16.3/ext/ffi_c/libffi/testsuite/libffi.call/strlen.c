/* Area:	ffi_call
   Purpose:	Check strlen function call.
   Limitations:	none.
   PR:		none.
   Originator:	From the original ffitest.c  */

/* { dg-do run } */
#include "ffitest.h"

static unsigned int ABI_ATTR my_strlen(char *s)
{
  return (unsigned int) (strlen(s));
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  ffi_arg rint;
  char *s;

  args[0] = &ffi_type_pointer;
  values[0] = (void*) &s;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, ABI_NUM, 1,
		     &ffi_type_uint, args) == FFI_OK);

  s = "a";
  ffi_call(&cif, FFI_FN(my_strlen), &rint, values);
  CHECK(rint == 1);

  s = "1234567";
  ffi_call(&cif, FFI_FN(my_strlen), &rint, values);
  CHECK(rint == 7);

  s = "1234567890123456789012345";
  ffi_call(&cif, FFI_FN(my_strlen), &rint, values);
  CHECK(rint == 25);

  exit (0);
}
