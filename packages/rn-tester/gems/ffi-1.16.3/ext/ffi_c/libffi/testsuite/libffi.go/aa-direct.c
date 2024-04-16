/* { dg-do run } */

#include "static-chain.h"

#if defined(__GNUC__) && !defined(__clang__) && defined(STATIC_CHAIN_REG)

#include "ffitest.h"

/* Blatent assumption here that the prologue doesn't clobber the
   static chain for trivial functions.  If this is not true, don't
   define STATIC_CHAIN_REG, and we'll test what we can via other tests.  */
void *doit(void)
{
  register void *chain __asm__(STATIC_CHAIN_REG);
  return chain;
}

int main()
{
  ffi_cif cif;
  void *result;

  CHECK(ffi_prep_cif(&cif, ABI_NUM, 0, &ffi_type_pointer, NULL) == FFI_OK);

  ffi_call_go(&cif, FFI_FN(doit), &result, NULL, &result);

  CHECK(result == &result);

  return 0;
}

#else /* UNSUPPORTED */
int main() { return 0; }
#endif
