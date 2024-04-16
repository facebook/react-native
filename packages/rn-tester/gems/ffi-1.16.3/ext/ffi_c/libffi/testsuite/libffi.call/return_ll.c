/* Area:	ffi_call
   Purpose:	Check return value long long.
   Limitations:	none.
   PR:		none.
   Originator:	From the original ffitest.c  */

/* { dg-do run } */
#include "ffitest.h"
static long long return_ll(long long ll)
{
  return ll;
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  long long rlonglong;
  long long ll;

  args[0] = &ffi_type_sint64;
  values[0] = &ll;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 1,
		     &ffi_type_sint64, args) == FFI_OK);

  for (ll = 0LL; ll < 100LL; ll++)
    {
      ffi_call(&cif, FFI_FN(return_ll), &rlonglong, values);
      CHECK(rlonglong == ll);
    }

  for (ll = 55555555555000LL; ll < 55555555555100LL; ll++)
    {
      ffi_call(&cif, FFI_FN(return_ll), &rlonglong, values);
      CHECK(rlonglong == ll);
    }
  exit(0);
}
