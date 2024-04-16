/* Area:	ffi_call
   Purpose:	Check return value float.
   Limitations:	none.
   PR:		none.
   Originator:	<andreast@gcc.gnu.org> 20050212  */

/* { dg-do run } */
#include "ffitest.h"

static float return_fl(float fl1, float fl2)
{
  return fl1 + fl2;
}
int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  float fl1, fl2, rfl;

  args[0] = &ffi_type_float;
  args[1] = &ffi_type_float;
  values[0] = &fl1;
  values[1] = &fl2;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 2,
		     &ffi_type_float, args) == FFI_OK);
  fl1 = 127.0;
  fl2 = 128.0;

  ffi_call(&cif, FFI_FN(return_fl), &rfl, values);
  printf ("%f vs %f\n", rfl, return_fl(fl1, fl2));
  CHECK(rfl ==  fl1 + fl2);
  exit(0);
}
