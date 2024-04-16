/* Area:	ffi_call
   Purpose:	Check structures.
   Limitations:	none.
   PR:		none.
   Originator:	From the original ffitest.c  */

/* { dg-do run } */
#include "ffitest.h"
typedef struct
{
  float f1;
  float f2;
  float f3;
  float f4;
} test_structure_8;

static test_structure_8 ABI_ATTR struct8 (test_structure_8 ts)
{
  ts.f1 += 1;
  ts.f2 += 1;
  ts.f3 += 1;
  ts.f4 += 1;

  return ts;
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  ffi_type ts8_type;
  ffi_type *ts8_type_elements[5];

  test_structure_8 ts8_arg;

  /* This is a hack to get a properly aligned result buffer */
  test_structure_8 *ts8_result =
    (test_structure_8 *) malloc (sizeof(test_structure_8));

  ts8_type.size = 0;
  ts8_type.alignment = 0;
  ts8_type.type = FFI_TYPE_STRUCT;
  ts8_type.elements = ts8_type_elements;
  ts8_type_elements[0] = &ffi_type_float;
  ts8_type_elements[1] = &ffi_type_float;
  ts8_type_elements[2] = &ffi_type_float;
  ts8_type_elements[3] = &ffi_type_float;
  ts8_type_elements[4] = NULL;

  args[0] = &ts8_type;
  values[0] = &ts8_arg;
  
  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, ABI_NUM, 1, &ts8_type, args) == FFI_OK);
  
  ts8_arg.f1 = 5.55f;
  ts8_arg.f2 = 55.5f;
  ts8_arg.f3 = -5.55f;
  ts8_arg.f4 = -55.5f;

  printf ("%g\n", ts8_arg.f1);
  printf ("%g\n", ts8_arg.f2);
  printf ("%g\n", ts8_arg.f3);
  printf ("%g\n", ts8_arg.f4);
  
  ffi_call(&cif, FFI_FN(struct8), ts8_result, values);

  printf ("%g\n", ts8_result->f1);
  printf ("%g\n", ts8_result->f2);
  printf ("%g\n", ts8_result->f3);
  printf ("%g\n", ts8_result->f4);
  
  CHECK(ts8_result->f1 == 5.55f + 1);
  CHECK(ts8_result->f2 == 55.5f + 1);
  CHECK(ts8_result->f3 == -5.55f + 1);
  CHECK(ts8_result->f4 == -55.5f + 1);
  
  free (ts8_result);
  exit(0);
}
