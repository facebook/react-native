/* Area:	bpo-38748
   Purpose:	test for stdcall alignment problem
   Source:      github.com/python/cpython/pull/26204 */

/* { dg-do run } */

#include "ffitest.h"
#include "ffi_common.h"

static UINT32 ABI_ATTR align_arguments(UINT32 l1,
				       UINT64 l2)
{
  return l1 + (UINT32) l2;
}

int main(void)
{
  ffi_cif cif;
  ffi_type *args[4] = {
    &ffi_type_uint32,
    &ffi_type_uint64
  };
  ffi_arg lr1, lr2;
  UINT32 l1 = 1;
  UINT64 l2 = 2;
  void *values[2] = {&l1, &l2};

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, ABI_NUM, 2,
		     &ffi_type_uint32, args) == FFI_OK);

  lr1 = align_arguments(l1, l2);

  ffi_call(&cif, FFI_FN(align_arguments), &lr2, values);

  if (lr1 == lr2)
    printf("bpo-38748 arguments tests ok!\n");
  else
    CHECK(0);
  exit(0);
}
