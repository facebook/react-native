/* Area:	ffi_call
   Purpose:	Check structures.
   Limitations:	none.
   PR:		none.
   Originator:	Sergei Trofimovich <slyfox@gentoo.org>

   The test originally discovered in ruby's bindings
   for ffi in https://bugs.gentoo.org/634190  */

/* { dg-do run } */
#include "ffitest.h"

struct s {
  int s32;
  float f32;
  signed char s8;
};

struct s ABI_ATTR make_s(void) {
  struct s r;
  r.s32 = 0x1234;
  r.f32 = 7.0;
  r.s8  = 0x78;
  return r;
}

int main() {
  ffi_cif cif;
  struct s r;
  ffi_type rtype;
  ffi_type* s_fields[] = {
    &ffi_type_sint,
    &ffi_type_float,
    &ffi_type_schar,
    NULL,
  };

  rtype.size      = 0;
  rtype.alignment = 0,
  rtype.type      = FFI_TYPE_STRUCT,
  rtype.elements  = s_fields,

  r.s32 = 0xbad;
  r.f32 = 999.999;
  r.s8  = 0x51;

  // Here we emulate the following call:
  //r = make_s();

  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 0, &rtype, NULL) == FFI_OK);
  ffi_call(&cif, FFI_FN(make_s), &r, NULL);

  CHECK(r.s32 == 0x1234);
  CHECK(r.f32 == 7.0);
  CHECK(r.s8  == 0x78);
  exit(0);
}
