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
		  long int i1,
		  double f3,
		  double f4,
		  long int i2,
		  double f5,
		  double f6,
		  long int i3,
		  double f7,
		  double f8,
		  long int i4,
		  double f9,
		  double f10,
		  long int i5,
		  double f11,
		  double f12,
		  long int i6,
		  double f13)
{
  return ((double) (i1 + i2 + i3 + i4 + i5 + i6) + (f1/f2+f3/f4+f5/f6+f7/f8+f9/f10+f11/f12) * f13);
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[19];
  void *values[19];
  double fa[19];
  long int la[19];
  double f, ff;
  int i;

  for (i = 0; i < 19; i++)
    {
	  if( (i - 2) % 3 == 0) {
	    args[i] = &ffi_type_slong;
	    la[i] = (long int) i;
	    values[i] = &la[i];
	  }
	  else {
	    args[i] = &ffi_type_double;
	    fa[i] = (double) i;
	    values[i] = &fa[i];
	  }
    }

    /* Initialize the cif */
    CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 19,
		       &ffi_type_double, args) == FFI_OK);

    ffi_call(&cif, FFI_FN(many), &f, values);

    ff =  many(fa[0], fa[1], la[2],
               fa[3], fa[4], la[5],
               fa[6], fa[7], la[8],
               fa[9], fa[10], la[11],
               fa[12], fa[13], la[14],
               fa[15], fa[16], la[17],
               fa[18]);
    if (fabs(f - ff) < FLT_EPSILON)
      exit(0);
    else
      abort();
}
