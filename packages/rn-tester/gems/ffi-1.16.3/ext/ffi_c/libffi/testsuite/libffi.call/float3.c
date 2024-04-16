/* Area:	ffi_call
   Purpose:	Check float arguments with different orders.
   Limitations:	none.
   PR:		none.
   Originator:	From the original ffitest.c  */

/* { dg-do run } */

#include "ffitest.h"
#include "float.h"

#include <math.h>

static double floating_1(float a, double b, long double c)
{
  return (double) a + b + (double) c;
}

static double floating_2(long double a, double b, float c)
{
  return (double) a + b + (double) c;
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  double rd;

  float f;
  double d;
  long double ld;

  args[0] = &ffi_type_float;
  values[0] = &f;
  args[1] = &ffi_type_double;
  values[1] = &d;
  args[2] = &ffi_type_longdouble;
  values[2] = &ld;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 3,
		     &ffi_type_double, args) == FFI_OK);

  f = 3.14159;
  d = (double)1.0/(double)3.0;
  ld = 2.71828182846L;

  floating_1 (f, d, ld);

  ffi_call(&cif, FFI_FN(floating_1), &rd, values);

  CHECK(fabs(rd - floating_1(f, d, ld)) < DBL_EPSILON);

  args[0] = &ffi_type_longdouble;
  values[0] = &ld;
  args[1] = &ffi_type_double;
  values[1] = &d;
  args[2] = &ffi_type_float;
  values[2] = &f;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 3,
		     &ffi_type_double, args) == FFI_OK);

  floating_2 (ld, d, f);

  ffi_call(&cif, FFI_FN(floating_2), &rd, values);

  CHECK(fabs(rd - floating_2(ld, d, f)) < DBL_EPSILON);

  exit (0);
}
