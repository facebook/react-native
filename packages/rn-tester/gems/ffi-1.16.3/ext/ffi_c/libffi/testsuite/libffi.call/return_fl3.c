/* Area:	ffi_call
   Purpose:	Check return value float.
   Limitations:	none.
   PR:		none.
   Originator:	<andreast@gcc.gnu.org> 20050212  */

/* { dg-do run } */
#include "ffitest.h"

static float return_fl(float fl1, float fl2, unsigned int in3, float fl4)
{
  return fl1 + fl2 + in3 + fl4;
}
int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  float fl1, fl2, fl4, rfl;
  unsigned int in3;
  args[0] = &ffi_type_float;
  args[1] = &ffi_type_float;
  args[2] = &ffi_type_uint;
  args[3] = &ffi_type_float;
  values[0] = &fl1;
  values[1] = &fl2;
  values[2] = &in3;
  values[3] = &fl4;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 4,
		     &ffi_type_float, args) == FFI_OK);
  fl1 = 127.0;
  fl2 = 128.0;
  in3 = 255;
  fl4 = 512.7;

  ffi_call(&cif, FFI_FN(return_fl), &rfl, values);
  printf ("%f vs %f\n", rfl, return_fl(fl1, fl2, in3, fl4));
  CHECK(rfl ==  fl1 + fl2 + in3 + fl4);
  exit(0);
}
