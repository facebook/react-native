/* Area:	ffi_call
   Purpose:	Check structures.
   Limitations:	none.
   PR:		none.
   Originator:	From the original ffitest.c  */

/* { dg-do run } */
#include "ffitest.h"
typedef struct
{
  int a;
  int b;
  int c;
  int d;
  int e;
  int f;
  int g;
  int h;
} test_structure_5;

static test_structure_5 ABI_ATTR struct5(test_structure_5 inp)
{
  inp.a *= 2;
  inp.b *= 3;
  inp.c *= 4;
  inp.d *= 5;
  inp.e *= 6;
  inp.f *= 7;
  inp.g *= 8;
  inp.h *= 9;
  return inp;
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  ffi_type ts5_type;
  ffi_type *ts5_type_elements[9];

  test_structure_5 ts5_arg1;

  /* This is a hack to get a properly aligned result buffer */
  test_structure_5 *ts5_result =
    (test_structure_5 *) malloc (sizeof(test_structure_5));

  ts5_type.size = 0;
  ts5_type.alignment = 0;
  ts5_type.type = FFI_TYPE_STRUCT;
  ts5_type.elements = ts5_type_elements;
  ts5_type_elements[0] = &ffi_type_sint;
  ts5_type_elements[1] = &ffi_type_sint;
  ts5_type_elements[2] = &ffi_type_sint;
  ts5_type_elements[3] = &ffi_type_sint;
  ts5_type_elements[4] = &ffi_type_sint;
  ts5_type_elements[5] = &ffi_type_sint;
  ts5_type_elements[6] = &ffi_type_sint;
  ts5_type_elements[7] = &ffi_type_sint;
  ts5_type_elements[8] = NULL;

  args[0] = &ts5_type;
  values[0] = &ts5_arg1;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, ABI_NUM, 1, &ts5_type, args) == FFI_OK);

  ts5_arg1.a = 9;
  ts5_arg1.b = 8;
  ts5_arg1.c = 7;
  ts5_arg1.d = 6;
  ts5_arg1.e = 5;
  ts5_arg1.f = 4;
  ts5_arg1.g = 3;
  ts5_arg1.h = 2;

  ffi_call (&cif, FFI_FN(struct5), ts5_result, values);

  CHECK(ts5_result->a == 9*2);
  CHECK(ts5_result->b == 8*3);
  CHECK(ts5_result->c == 7*4);
  CHECK(ts5_result->d == 6*5);
  CHECK(ts5_result->e == 5*6);
  CHECK(ts5_result->f == 4*7);
  CHECK(ts5_result->g == 3*8);
  CHECK(ts5_result->h == 2*9);

  free (ts5_result);
  exit(0);
}
