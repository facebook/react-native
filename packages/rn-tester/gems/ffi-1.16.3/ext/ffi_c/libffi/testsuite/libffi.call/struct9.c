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
  int i;
} test_structure_9;

static test_structure_9 ABI_ATTR struct9 (test_structure_9 ts)
{
  ts.f += 1;
  ts.i += 1;

  return ts;
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  ffi_type ts9_type;
  ffi_type *ts9_type_elements[3];

  test_structure_9 ts9_arg;

  /* This is a hack to get a properly aligned result buffer */
  test_structure_9 *ts9_result =
    (test_structure_9 *) malloc (sizeof(test_structure_9));

  ts9_type.size = 0;
  ts9_type.alignment = 0;
  ts9_type.type = FFI_TYPE_STRUCT;
  ts9_type.elements = ts9_type_elements;
  ts9_type_elements[0] = &ffi_type_float;
  ts9_type_elements[1] = &ffi_type_sint;
  ts9_type_elements[2] = NULL;

  args[0] = &ts9_type;
  values[0] = &ts9_arg;
  
  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, ABI_NUM, 1, &ts9_type, args) == FFI_OK);
  
  ts9_arg.f = 5.55f;
  ts9_arg.i = 5;
  
  printf ("%g\n", ts9_arg.f);
  printf ("%d\n", ts9_arg.i);
  
  ffi_call(&cif, FFI_FN(struct9), ts9_result, values);

  printf ("%g\n", ts9_result->f);
  printf ("%d\n", ts9_result->i);
  
  CHECK(ts9_result->f == 5.55f + 1);
  CHECK(ts9_result->i == 5 + 1);

  free (ts9_result);
  exit(0);
}
