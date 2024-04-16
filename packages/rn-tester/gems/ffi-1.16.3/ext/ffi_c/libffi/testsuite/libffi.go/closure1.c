/* { dg-do run } */

#include "ffitest.h"

void doit(ffi_cif *cif, void *rvalue, void **avalue, void *closure)
{
  (void)cif;
  (void)avalue;
  *(void **)rvalue = closure;
}

typedef void * (*FN)(void);

int main()
{
  ffi_cif cif;
  ffi_go_closure cl;
  void *result;

  CHECK(ffi_prep_cif(&cif, ABI_NUM, 0, &ffi_type_pointer, NULL) == FFI_OK);
  CHECK(ffi_prep_go_closure(&cl, &cif, doit) == FFI_OK);

  ffi_call_go(&cif, FFI_FN(*(FN *)&cl), &result, NULL, &cl);

  CHECK(result == &cl);

  exit(0);
}
