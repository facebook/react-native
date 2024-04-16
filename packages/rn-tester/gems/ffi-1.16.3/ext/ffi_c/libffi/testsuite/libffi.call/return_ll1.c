/* Area:	ffi_call
   Purpose:	Check if long long are passed in the corresponding regs on ppc.
   Limitations:	none.
   PR:		20104.
   Originator:	<andreast@gcc.gnu.org> 20050222  */

/* { dg-do run } */
/* { dg-options "-Wno-format" { target alpha*-dec-osf* } } */
#include "ffitest.h"
static long long return_ll(int ll0, long long ll1, int ll2)
{
  CHECK(ll0 == 11111111);
  CHECK(ll1 == 11111111111000LL);
  CHECK(ll2 == 11111111);
  return ll0 + ll1 + ll2;
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  long long rlonglong;
  long long ll1;
  unsigned ll0, ll2;

  args[0] = &ffi_type_sint;
  args[1] = &ffi_type_sint64;
  args[2] = &ffi_type_sint;
  values[0] = &ll0;
  values[1] = &ll1;
  values[2] = &ll2;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 3,
		     &ffi_type_sint64, args) == FFI_OK);

  ll0 = 11111111;
  ll1 = 11111111111000LL;
  ll2 = 11111111;

  ffi_call(&cif, FFI_FN(return_ll), &rlonglong, values);
  printf("res: %" PRIdLL ", %" PRIdLL "\n", rlonglong, ll0 + ll1 + ll2);
  /* { dg-output "res: 11111133333222, 11111133333222" } */
  CHECK(rlonglong == 11111133333222);
  CHECK(ll0 + ll1 + ll2 == 11111133333222);
  exit(0);
}
