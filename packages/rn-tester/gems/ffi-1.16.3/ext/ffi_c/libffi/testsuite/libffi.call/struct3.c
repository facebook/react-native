/* Area:	ffi_call
   Purpose:	Check structures.
   Limitations:	none.
   PR:		none.
   Originator:	From the original ffitest.c  */

/* { dg-do run } */
#include "ffitest.h"

typedef struct
{
  int si;
} test_structure_3;

static test_structure_3 ABI_ATTR struct3(test_structure_3 ts)
{
  ts.si = -(ts.si*2);

  return ts;
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  int compare_value;
  ffi_type ts3_type;
  ffi_type *ts3_type_elements[2];

  test_structure_3 ts3_arg;
  test_structure_3 *ts3_result =
    (test_structure_3 *) malloc (sizeof(test_structure_3));

  ts3_type.size = 0;
  ts3_type.alignment = 0;
  ts3_type.type = FFI_TYPE_STRUCT;
  ts3_type.elements = ts3_type_elements;
  ts3_type_elements[0] = &ffi_type_sint;
  ts3_type_elements[1] = NULL;

  args[0] = &ts3_type;
  values[0] = &ts3_arg;
  
  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, ABI_NUM, 1,
		     &ts3_type, args) == FFI_OK);
  
  ts3_arg.si = -123;
  compare_value = ts3_arg.si;
  
  ffi_call(&cif, FFI_FN(struct3), ts3_result, values);
  
  printf ("%d %d\n", ts3_result->si, -(compare_value*2));
  
  CHECK(ts3_result->si == -(compare_value*2));
 
  free (ts3_result);
  exit(0);
}
