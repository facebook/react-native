/* Area:        fp and variadics
   Purpose:     check fp inputs and returns work on variadics, even the fixed params
   Limitations: None
   PR:          none
   Originator:  <david.gilbert@linaro.org> 2011-01-25

   Intended to stress the difference in ABI on ARM vfp
*/

/* { dg-do run } */

#include <stdarg.h>

#include "ffitest.h"

/* prints out all the parameters, and returns the sum of them all.
 * 'x' is the number of variadic parameters all of which are double in this test
 */
double float_va_fn(unsigned int x, double y,...)
{
  double total=0.0;
  va_list ap;
  unsigned int i;

  total+=(double)x;
  total+=y;

  printf("%u: %.1f :", x, y);

  va_start(ap, y);
  for(i=0;i<x;i++)
  {
    double arg=va_arg(ap, double);
    total+=arg;
    printf(" %d:%.1f ", i, arg);
  }
  va_end(ap);

  printf(" total: %.1f\n", total);

  return total;
}

int main (void)
{
  ffi_cif    cif;

  ffi_type    *arg_types[5];
  void        *values[5];
  double        doubles[5];
  unsigned int firstarg;
  double        resfp;

  /* First test, pass float_va_fn(0,2.0) - note there are no actual
   * variadic parameters, but it's declared variadic so the ABI may be
   * different. */
  /* Call it statically and then via ffi */
  resfp=float_va_fn(0,2.0);
  /* { dg-output "0: 2.0 : total: 2.0" } */
  printf("compiled: %.1f\n", resfp);
  /* { dg-output "\ncompiled: 2.0" } */

  arg_types[0] = &ffi_type_uint;
  arg_types[1] = &ffi_type_double;
  arg_types[2] = NULL;
  CHECK(ffi_prep_cif_var(&cif, FFI_DEFAULT_ABI, 2, 2,
        &ffi_type_double, arg_types) == FFI_OK);

  firstarg = 0;
  doubles[0] = 2.0;
  values[0] = &firstarg;
  values[1] = &doubles[0];
  ffi_call(&cif, FFI_FN(float_va_fn), &resfp, values);
  /* { dg-output "\n0: 2.0 : total: 2.0" } */
  printf("ffi: %.1f\n", resfp);
  /* { dg-output "\nffi: 2.0" } */
  CHECK_DOUBLE_EQ(resfp, 2);

  /* Second test, float_va_fn(2,2.0,3.0,4.0), now with variadic params */
  /* Call it statically and then via ffi */
  resfp=float_va_fn(2,2.0,3.0,4.0);
  /* { dg-output "\n2: 2.0 : 0:3.0  1:4.0  total: 11.0" } */
  printf("compiled: %.1f\n", resfp);
  /* { dg-output "\ncompiled: 11.0" } */
  CHECK_DOUBLE_EQ(resfp, 11);

  arg_types[0] = &ffi_type_uint;
  arg_types[1] = &ffi_type_double;
  arg_types[2] = &ffi_type_double;
  arg_types[3] = &ffi_type_double;
  arg_types[4] = NULL;
  CHECK(ffi_prep_cif_var(&cif, FFI_DEFAULT_ABI, 2, 4,
        &ffi_type_double, arg_types) == FFI_OK);

  firstarg = 2;
  doubles[0] = 2.0;
  doubles[1] = 3.0;
  doubles[2] = 4.0;
  values[0] = &firstarg;
  values[1] = &doubles[0];
  values[2] = &doubles[1];
  values[3] = &doubles[2];
  ffi_call(&cif, FFI_FN(float_va_fn), &resfp, values);
  /* { dg-output "\n2: 2.0 : 0:3.0  1:4.0  total: 11.0" } */
  printf("ffi: %.1f\n", resfp);
  /* { dg-output "\nffi: 11.0" } */
  CHECK_DOUBLE_EQ(resfp, 11);

  exit(0);
}
