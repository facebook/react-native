/* -*-c-*- */
#include "ffitest.h"
#include <complex.h>

_Complex T_C_TYPE
return_c(_Complex T_C_TYPE c1, _Complex T_C_TYPE c2,
	 unsigned int in3, _Complex T_C_TYPE c4)
{
  volatile _Complex T_C_TYPE r = c1 + c2 + in3 + c4;
  return r;
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  _Complex T_C_TYPE c1, c2, c4, rc, rc2;
  unsigned int in3;
  args[0] = &T_FFI_TYPE;
  args[1] = &T_FFI_TYPE;
  args[2] = &ffi_type_uint;
  args[3] = &T_FFI_TYPE;
  values[0] = &c1;
  values[1] = &c2;
  values[2] = &in3;
  values[3] = &c4;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 4,
		     &T_FFI_TYPE, args) == FFI_OK);
  c1 = 127.0 + 255.0 * I;
  c2 = 128.0 + 256.0;
  in3 = 255;
  c4 = 512.7 + 1024.1 * I;

  ffi_call(&cif, FFI_FN(return_c), &rc, values);
  rc2 = return_c(c1, c2, in3, c4);
  printf ("%f,%fi vs %f,%fi\n",
	  T_CONV creal (rc), T_CONV cimag (rc),
	  T_CONV creal (rc2), T_CONV cimag (rc2));
  CHECK(rc == rc2);
  exit(0);
}
