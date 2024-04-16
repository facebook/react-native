/* Area:	ffi_call
   Purpose:	Check for proper argument alignment.
   Limitations:	none.
   PR:		none.
   Originator:	<twalljava@java.net> (from many_win32.c) */

/* { dg-do run } */

#include "ffitest.h"

static float ABI_ATTR align_arguments(int i1,
                                      double f2,
                                      int i3,
                                      double f4)
{
  return i1+f2+i3+f4;
}

int main(void)
{
  ffi_cif cif;
  ffi_type *args[4] = {
    &ffi_type_sint,
    &ffi_type_double,
    &ffi_type_sint,
    &ffi_type_double
  };
  double fa[2] = {1,2};
  int ia[2] = {1,2};
  void *values[4] = {&ia[0], &fa[0], &ia[1], &fa[1]};
  float f, ff;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, ABI_NUM, 4,
		     &ffi_type_float, args) == FFI_OK);

  ff = align_arguments(ia[0], fa[0], ia[1], fa[1]);;

  ffi_call(&cif, FFI_FN(align_arguments), &f, values);

  if (f == ff)
    printf("align arguments tests ok!\n");
  else
    CHECK(0);
  exit(0);
}
