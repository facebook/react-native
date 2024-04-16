/* Area:		Struct layout
   Purpose:		Test ffi_get_struct_offsets
   Limitations:		none.
   PR:			none.
   Originator: 		Tom Tromey. */

/* { dg-do run } */
#include "ffitest.h"
#include <stddef.h>

struct test_1
{
  char c;
  float f;
  char c2;
  int i;
};

int
main (void)
{
  ffi_type test_1_type;
  ffi_type *test_1_elements[5];
  size_t test_1_offsets[4];

  test_1_elements[0] = &ffi_type_schar;
  test_1_elements[1] = &ffi_type_float;
  test_1_elements[2] = &ffi_type_schar;
  test_1_elements[3] = &ffi_type_sint;
  test_1_elements[4] = NULL;

  test_1_type.size = 0;
  test_1_type.alignment = 0;
  test_1_type.type = FFI_TYPE_STRUCT;
  test_1_type.elements = test_1_elements;

  CHECK (ffi_get_struct_offsets (FFI_DEFAULT_ABI, &test_1_type, test_1_offsets)
	 == FFI_OK);
  CHECK (test_1_type.size == sizeof (struct test_1));
  CHECK (offsetof (struct test_1, c) == test_1_offsets[0]);
  CHECK (offsetof (struct test_1, f) == test_1_offsets[1]);
  CHECK (offsetof (struct test_1, c2) == test_1_offsets[2]);
  CHECK (offsetof (struct test_1, i) == test_1_offsets[3]);

  return 0;
}
