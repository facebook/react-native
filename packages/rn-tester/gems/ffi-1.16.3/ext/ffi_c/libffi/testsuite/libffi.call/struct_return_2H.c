/* Area:	ffi_call
   Purpose:	Check structures.
   Limitations:	none.
   PR:		none.
   Originator:	From the original ffitest.c  */

/* { dg-do run } */
#include "ffitest.h"
typedef struct
{
  short x;
  short y;
} test_structure_5;

static test_structure_5 ABI_ATTR struct5(test_structure_5 inp)
{
  inp.x *= 2;
  inp.y *= 3;

  return inp;
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  ffi_type ts5_type;
  ffi_type *ts5_type_elements[3];

  test_structure_5 ts5_arg1;

  /* This is a hack to get a properly aligned result buffer */
  test_structure_5 *ts5_result =
    (test_structure_5 *) malloc (sizeof(test_structure_5));

  ts5_type.size = 0;
  ts5_type.alignment = 0;
  ts5_type.type = FFI_TYPE_STRUCT;
  ts5_type.elements = ts5_type_elements;
  ts5_type_elements[0] = &ffi_type_sshort;
  ts5_type_elements[1] = &ffi_type_sshort;
  ts5_type_elements[2] = NULL;

  args[0] = &ts5_type;
  values[0] = &ts5_arg1;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, ABI_NUM, 1, &ts5_type, args) == FFI_OK);

  ts5_arg1.x = 99;
  ts5_arg1.y = 88;

  ffi_call (&cif, FFI_FN(struct5), ts5_result, values);

  CHECK(ts5_result->x == 99*2);
  CHECK(ts5_result->y == 88*3);
  CHECK(ts5_arg1.x == 99);
  CHECK(ts5_arg1.y == 88);

  free (ts5_result);
  exit(0);
}
