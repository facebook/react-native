/* Area:	ffi_call
   Purpose:	Check structures.
   Limitations:	none.
   PR:		none.
   Originator:	From the original ffitest.c  */

/* { dg-do run } */
#include "ffitest.h"

typedef struct
{
  unsigned int ui01;
  unsigned int ui02;
  unsigned int ui03;
  unsigned int ui04;
  unsigned int ui05;
  unsigned int ui06;
  unsigned int ui07;
  unsigned int ui08;
  unsigned int ui09;
  unsigned int ui10;
  unsigned int ui11;
  unsigned int ui12;
  unsigned int ui13;
  unsigned int ui14;
  unsigned int ui15;
  unsigned int ui16;
  unsigned int ui17;
} test_structure_1;

static test_structure_1 ABI_ATTR struct1(test_structure_1 ts)
{
  ts.ui17++;

  return ts;
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  ffi_type ts1_type;
  ffi_type *ts1_type_elements[18];

  test_structure_1 ts1_arg;

  /* This is a hack to get a properly aligned result buffer */
  test_structure_1 *ts1_result =
    (test_structure_1 *) malloc (sizeof(test_structure_1));

  ts1_type.size = 0;
  ts1_type.alignment = 0;
  ts1_type.type = FFI_TYPE_STRUCT;
  ts1_type.elements = ts1_type_elements;
  ts1_type_elements[0] = &ffi_type_uint;
  ts1_type_elements[1] = &ffi_type_uint;
  ts1_type_elements[2] = &ffi_type_uint;
  ts1_type_elements[3] = &ffi_type_uint;
  ts1_type_elements[4] = &ffi_type_uint;
  ts1_type_elements[5] = &ffi_type_uint;
  ts1_type_elements[6] = &ffi_type_uint;
  ts1_type_elements[7] = &ffi_type_uint;
  ts1_type_elements[8] = &ffi_type_uint;
  ts1_type_elements[9] = &ffi_type_uint;
  ts1_type_elements[10] = &ffi_type_uint;
  ts1_type_elements[11] = &ffi_type_uint;
  ts1_type_elements[12] = &ffi_type_uint;
  ts1_type_elements[13] = &ffi_type_uint;
  ts1_type_elements[14] = &ffi_type_uint;
  ts1_type_elements[15] = &ffi_type_uint;
  ts1_type_elements[16] = &ffi_type_uint;
  ts1_type_elements[17] = NULL;

  args[0] = &ts1_type;
  values[0] = &ts1_arg;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, ABI_NUM, 1,
		     &ts1_type, args) == FFI_OK);

  ts1_arg.ui17 = 555;

  ffi_call(&cif, FFI_FN(struct1), ts1_result, values);

  CHECK(ts1_result->ui17 == 556);

  /* This will fail if ffi_call isn't passing the struct by value. */
  CHECK(ts1_arg.ui17 == 555);

  free (ts1_result);
  exit(0);
}
