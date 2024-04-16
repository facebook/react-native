/* Area:	ffi_call
   Purpose:	Check that negative integers are passed correctly.
   Limitations:	none.
   PR:		none.
   Originator:	From the original ffitest.c  */

/* { dg-do run } */

#include "ffitest.h"

static int checking(int a, short b, signed char c)
{

  return (a < 0 && b < 0 && c < 0);
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  ffi_arg rint;

  signed int si;
  signed short ss;
  signed char sc;

  args[0] = &ffi_type_sint;
  values[0] = &si;
  args[1] = &ffi_type_sshort;
  values[1] = &ss;
  args[2] = &ffi_type_schar;
  values[2] = &sc;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 3,
		     &ffi_type_sint, args) == FFI_OK);

  si = -6;
  ss = -12;
  sc = -1;

  checking (si, ss, sc);

  ffi_call(&cif, FFI_FN(checking), &rint, values);

  printf ("%d vs %d\n", (int)rint, checking (si, ss, sc));

  CHECK(rint != 0);

  exit (0);
}
