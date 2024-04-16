/* Area:	ffi_call
   Purpose:	Check return value unsigned char.
   Limitations:	none.
   PR:		none.
   Originator:	From the original ffitest.c  */

/* { dg-do run } */
#include "ffitest.h"

static unsigned char return_uc(unsigned char uc)
{
  return uc;
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  ffi_arg rint;

  unsigned char uc;

  args[0] = &ffi_type_uchar;
  values[0] = &uc;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 1,
		     &ffi_type_uchar, args) == FFI_OK);

  for (uc = (unsigned char) '\x00';
       uc < (unsigned char) '\xff'; uc++)
    {
      ffi_call(&cif, FFI_FN(return_uc), &rint, values);
      CHECK((unsigned char)rint == uc);
    }
  exit(0);
}
