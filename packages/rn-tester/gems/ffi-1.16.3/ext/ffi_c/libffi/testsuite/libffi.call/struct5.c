/* Area:	ffi_call
   Purpose:	Check structures.
   Limitations:	none.
   PR:		none.
   Originator:	From the original ffitest.c  */

/* { dg-do run } */
#include "ffitest.h"
typedef struct
{
  char c1;
  char c2;
} test_structure_5;

static test_structure_5 ABI_ATTR struct5(test_structure_5 ts1, test_structure_5 ts2)
{
  ts1.c1 += ts2.c1;
  ts1.c2 -= ts2.c2;
  
  return ts1;
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  ffi_type ts5_type;
  ffi_type *ts5_type_elements[3];

  test_structure_5 ts5_arg1, ts5_arg2;

  /* This is a hack to get a properly aligned result buffer */
  test_structure_5 *ts5_result =
    (test_structure_5 *) malloc (sizeof(test_structure_5));

  ts5_type.size = 0;
  ts5_type.alignment = 0;
  ts5_type.type = FFI_TYPE_STRUCT;
  ts5_type.elements = ts5_type_elements;
  ts5_type_elements[0] = &ffi_type_schar;
  ts5_type_elements[1] = &ffi_type_schar;
  ts5_type_elements[2] = NULL;

  args[0] = &ts5_type;
  args[1] = &ts5_type;
  values[0] = &ts5_arg1;
  values[1] = &ts5_arg2;
  
  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, ABI_NUM, 2, &ts5_type, args) == FFI_OK);
  
  ts5_arg1.c1 = 2;
  ts5_arg1.c2 = 6;
  ts5_arg2.c1 = 5;
  ts5_arg2.c2 = 3;
  
  ffi_call (&cif, FFI_FN(struct5), ts5_result, values);
  
  CHECK(ts5_result->c1 == 7); 
  CHECK(ts5_result->c2 == 3);
  
  
  free (ts5_result);
  exit(0);
}
