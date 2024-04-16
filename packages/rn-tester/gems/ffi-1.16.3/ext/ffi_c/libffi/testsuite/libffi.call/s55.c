/* Area:	ffi_call
   Purpose:	Check structures.
   Limitations:	none.
   PR:		none.
   Originator:	From the original ffitest.c  */

/* { dg-do run } */
#include "ffitest.h"

typedef struct
{
  float f;
} s55;

static s55 ABI_ATTR f55(s55 ts, float f)
{
  s55 r;
  r.f = ts.f + f;
  printf ("f55>> %g + %g = %g\n", ts.f, f, r.f);
  return r;
}

int main (void)
{
  ffi_cif cif;
  s55 F, Fr;
  float f;
  void *values[] = { &F, &f };
  ffi_type s55_type;
  ffi_type *args[] = { &s55_type, &ffi_type_float };
  ffi_type *s55_type_elements[] = { &ffi_type_float, NULL };

  /* This is a hack to get a properly aligned result buffer */
  s55 *s55_result =
    (s55 *) malloc (sizeof(s55));

  s55_type.size = 0;
  s55_type.alignment = 0;
  s55_type.type = FFI_TYPE_STRUCT;
  s55_type.elements = s55_type_elements;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, ABI_NUM, 2, &s55_type, args) == FFI_OK);

  F.f = 1;
  Fr = f55(F, 2.14);
  printf ("%g\n", Fr.f);

  F.f = 1;
  f = 2.14;
  ffi_call(&cif, FFI_FN(f55), s55_result, values);
  printf ("%g\n", s55_result->f);

  fflush(0);

  CHECK(fabs(Fr.f - s55_result->f) < FLT_EPSILON);

  free (s55_result);
  exit(0);
}
