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
  double d;
} test_structure_6;

static test_structure_6 ABI_ATTR struct6 (test_structure_6 ts)
{
  ts.f += 1;
  ts.d += 1;
  
  return ts;
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  ffi_type ts6_type;
  ffi_type *ts6_type_elements[3];

  test_structure_6 ts6_arg;

  /* This is a hack to get a properly aligned result buffer */
  test_structure_6 *ts6_result =
    (test_structure_6 *) malloc (sizeof(test_structure_6));

  ts6_type.size = 0;
  ts6_type.alignment = 0;
  ts6_type.type = FFI_TYPE_STRUCT;
  ts6_type.elements = ts6_type_elements;
  ts6_type_elements[0] = &ffi_type_float;
  ts6_type_elements[1] = &ffi_type_double;
  ts6_type_elements[2] = NULL;

  args[0] = &ts6_type;
  values[0] = &ts6_arg;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, ABI_NUM, 1, &ts6_type, args) == FFI_OK);
  
  ts6_arg.f = 5.55f;
  ts6_arg.d = 6.66;
  
  printf ("%g\n", ts6_arg.f);
  printf ("%g\n", ts6_arg.d);

  ffi_call(&cif, FFI_FN(struct6), ts6_result, values);
    
  CHECK(ts6_result->f == 5.55f + 1);
  CHECK(ts6_result->d == 6.66 + 1);
    
  free (ts6_result);
  exit(0);
}
