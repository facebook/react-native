/* -*-c-*- */
#include "ffitest.h"

#include <stdlib.h>
#include <complex.h>

static _Complex T_C_TYPE many(_Complex T_C_TYPE c1,
			      _Complex T_C_TYPE c2,
			      _Complex T_C_TYPE c3,
			      _Complex T_C_TYPE c4,
			      _Complex T_C_TYPE c5,
			      _Complex T_C_TYPE c6,
			      _Complex T_C_TYPE c7,
			      _Complex T_C_TYPE c8,
			      _Complex T_C_TYPE c9,
			      _Complex T_C_TYPE c10,
			      _Complex T_C_TYPE c11,
			      _Complex T_C_TYPE c12,
			      _Complex T_C_TYPE c13)
{
  printf("0 :%f,%fi\n"
	 "1 :%f,%fi\n"
	 "2 :%f,%fi\n"
	 "3 :%f,%fi\n"
	 "4 :%f,%fi\n"
	 "5 :%f,%fi\n"
	 "6 :%f,%fi\n"
	 "7 :%f,%fi\n"
	 "8 :%f,%fi\n"
	 "9 :%f,%fi\n"
	 "10:%f,%fi\n"
	 "11:%f,%fi\n"
	 "12:%f,%fi\n",
	 T_CONV creal (c1), T_CONV cimag (c1),
	 T_CONV creal (c2), T_CONV cimag (c2),
	 T_CONV creal (c3), T_CONV cimag (c3),
	 T_CONV creal (c4), T_CONV cimag (c4),
	 T_CONV creal (c5), T_CONV cimag (c5),
	 T_CONV creal (c6), T_CONV cimag (c6),
	 T_CONV creal (c7), T_CONV cimag (c7),
	 T_CONV creal (c8), T_CONV cimag (c8),
	 T_CONV creal (c9), T_CONV cimag (c9),
	 T_CONV creal (c10), T_CONV cimag (c10),
	 T_CONV creal (c11), T_CONV cimag (c11),
	 T_CONV creal (c12), T_CONV cimag (c12),
	 T_CONV creal (c13), T_CONV cimag (c13));

  return (c1+c2-c3-c4+c5+c6+c7-c8-c9-c10-c11+c12+c13);
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[13];
  void *values[13];
  _Complex T_C_TYPE ca[13];
  _Complex T_C_TYPE c, cc;
  int i;

  for (i = 0; i < 13; i++)
    {
      args[i] = &T_FFI_TYPE;
      values[i] = &ca[i];
      ca[i] = i + (-20 - i) * I;
    }

    /* Initialize the cif */
    CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 13, &T_FFI_TYPE, args) == FFI_OK);

    ffi_call(&cif, FFI_FN(many), &c, values);

    cc =  many(ca[0], ca[1], ca[2], ca[3], ca[4], ca[5], ca[6], ca[7], ca[8],
	       ca[9], ca[10], ca[11], ca[12]);
    CHECK(creal (cc) == creal (c));
    CHECK(cimag (cc) == cimag (c));

    exit(0);
}
