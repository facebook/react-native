/* Area:	ffi_call
   Purpose:	Check if unsigned long as return type is handled correctly.
   Limitations:	none.
   PR:		none.
   Originator:	<kaffeetisch at gmx dot de> 20060724  */

/* { dg-do run } */
#include "ffitest.h"
static unsigned long return_ul(unsigned long ul1, unsigned long ul2)
{
  CHECK(ul1 == 1073741823L);
  CHECK(ul2 == 1073741824L);
  return ul1 + ul2;
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  ffi_arg res;
  unsigned long ul1, ul2;

  args[0] = &ffi_type_ulong;
  args[1] = &ffi_type_ulong;
  values[0] = &ul1;
  values[1] = &ul2;

  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 2,
		     &ffi_type_ulong, args) == FFI_OK);

  ul1 = 1073741823L;
  ul2 = 1073741824L;

  ffi_call(&cif, FFI_FN(return_ul), &res, values);
  printf("res: %lu, %lu\n", (unsigned long)res, ul1 + ul2);
  /* { dg-output "res: 2147483647, 2147483647" } */
  CHECK(res == 2147483647L);
  CHECK(ul1 + ul2 == 2147483647L);

  exit(0);
}
