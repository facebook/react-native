/* Area:	ffi_call
   Purpose:	Check return value double, with many arguments
   Limitations:	none.
   PR:		none.
   Originator:	From the original ffitest.c  */

/* { dg-do run } */
#include "ffitest.h"

#include <stdlib.h>
#include <float.h>
#include <math.h>

static double many(double f1,
		  double f2,
		  double f3,
		  double f4,
		  double f5,
		  double f6,
		  double f7,
		  double f8,
		  double f9,
		  double f10,
		  double f11,
		  double f12,
		  double f13)
{
#if 0
  printf("%f %f %f %f %f %f %f %f %f %f %f %f %f\n",
	 (double) f1, (double) f2, (double) f3, (double) f4, (double) f5, 
	 (double) f6, (double) f7, (double) f8, (double) f9, (double) f10,
	 (double) f11, (double) f12, (double) f13);
#endif

  return ((f1/f2+f3/f4+f5/f6+f7/f8+f9/f10+f11/f12) * f13);
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[13];
  void *values[13];
  double fa[13];
  double f, ff;
  int i;

  for (i = 0; i < 13; i++)
    {
      args[i] = &ffi_type_double;
      values[i] = &fa[i];
      fa[i] = (double) i;
    }

    /* Initialize the cif */
    CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 13, 
		       &ffi_type_double, args) == FFI_OK);

    ffi_call(&cif, FFI_FN(many), &f, values);

    ff =  many(fa[0], fa[1],
	       fa[2], fa[3],
	       fa[4], fa[5],
	       fa[6], fa[7],
	       fa[8], fa[9],
	       fa[10],fa[11],fa[12]);
    if (fabs(f - ff) < FLT_EPSILON)
      exit(0);
    else
      abort();
}
