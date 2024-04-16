/* Area:	ffi_call
   Purpose:	Check return value float, with many arguments
   Limitations:	none.
   PR:		none.
   Originator:	From the original ffitest.c  */

/* { dg-do run } */
#include "ffitest.h"

#include <stdlib.h>
#include <float.h>
#include <math.h>

static float ABI_ATTR many(float f1, float f2, float f3, float f4, float f5, float f6, float f7, float f8, float f9, float f10, float f11, float f12, float f13)
{
#if 0
  printf("%f %f %f %f %f %f %f %f %f %f %f %f %f\n",
	 (double) f1, (double) f2, (double) f3, (double) f4, (double) f5, 
	 (double) f6, (double) f7, (double) f8, (double) f9, (double) f10,
	 (double) f11, (double) f12, (double) f13);
#endif

  return f1+f2+f3+f4+f5+f6+f7+f8+f9+f10+f11+f12+f13;
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[13];
  void *values[13];
  float fa[13];
  float f, ff;
  int i;

  for (i = 0; i < 13; i++)
    {
      args[i] = &ffi_type_float;
      values[i] = &fa[i];
      fa[i] = (float) i;
    }

    /* Initialize the cif */
    CHECK(ffi_prep_cif(&cif, ABI_NUM, 13,
		       &ffi_type_float, args) == FFI_OK);

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
