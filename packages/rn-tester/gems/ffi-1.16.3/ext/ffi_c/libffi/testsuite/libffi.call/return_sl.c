/* Area:	ffi_call
   Purpose:	Check if long as return type is handled correctly.
   Limitations:	none.
   PR:		none.
 */

/* { dg-do run } */
#include "ffitest.h"
static long return_sl(long l1, long l2)
{
  CHECK(l1 == 1073741823L);
  CHECK(l2 == 1073741824L);
  return l1 - l2;
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  ffi_arg res;
  unsigned long l1, l2;

  args[0] = &ffi_type_slong;
  args[1] = &ffi_type_slong;
  values[0] = &l1;
  values[1] = &l2;

  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 2,
		     &ffi_type_slong, args) == FFI_OK);

  l1 = 1073741823L;
  l2 = 1073741824L;

  ffi_call(&cif, FFI_FN(return_sl), &res, values);
  printf("res: %ld, %ld\n", (long)res, l1 - l2);
  /* { dg-output "res: -1, -1" } */
  CHECK((long)res == -1);
  CHECK(l1 + 1 == l2);

  exit(0);
}
