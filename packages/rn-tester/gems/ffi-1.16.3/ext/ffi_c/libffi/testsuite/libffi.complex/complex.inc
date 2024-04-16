/* -*-c-*-*/
#include "ffitest.h"
#include <complex.h>

static _Complex T_C_TYPE f_complex(_Complex T_C_TYPE c, int x, int *py)
{
  c = -(2 * creal (c)) + (cimag (c) + 1)* I;
  *py += x;

  return c;
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];

  _Complex T_C_TYPE tc_arg;
  _Complex T_C_TYPE tc_result;
  int tc_int_arg_x;
  int tc_y;
  int *tc_ptr_arg_y = &tc_y;

  args[0] = &T_FFI_TYPE;
  args[1] = &ffi_type_sint;
  args[2] = &ffi_type_pointer;
  values[0] = &tc_arg;
  values[1] = &tc_int_arg_x;
  values[2] = &tc_ptr_arg_y;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 3,
		     &T_FFI_TYPE, args) == FFI_OK);

  tc_arg = 1 + 7 * I;
  tc_int_arg_x = 1234;
  tc_y = 9876;
  ffi_call(&cif, FFI_FN(f_complex), &tc_result, values);

  printf ("%f,%fi %f,%fi, x %d 1234, y %d 11110\n",
	  T_CONV creal (tc_result), T_CONV cimag (tc_result),
	  T_CONV creal (2.0), T_CONV creal (8.0), tc_int_arg_x, tc_y);

  CHECK (creal (tc_result) == -2);
  CHECK (cimag (tc_result) == 8);
  CHECK (tc_int_arg_x == 1234);
  CHECK (*tc_ptr_arg_y == 11110);

  exit(0);
}
