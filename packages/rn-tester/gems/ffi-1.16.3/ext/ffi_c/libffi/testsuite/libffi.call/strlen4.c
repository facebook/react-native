/* Area:	ffi_call
   Purpose:	Check strlen function call with additional arguments.
   Limitations:	none.
   PR:		none.
   Originator:	From the original ffitest.c  */

/* { dg-do run } */

#include "ffitest.h"

static int ABI_ATTR my_f(float a, char *s, int i)
{
  return (int) strlen(s) + (int) a + i;
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  ffi_arg rint;
  char *s;
  int v1;
  float v2;
  args[2] = &ffi_type_sint;
  args[1] = &ffi_type_pointer;
  args[0] = &ffi_type_float;
  values[2] = (void*) &v1;
  values[1] = (void*) &s;
  values[0] = (void*) &v2;
  
  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, ABI_NUM, 3,
		       &ffi_type_sint, args) == FFI_OK);
  
  s = "a";
  v1 = 1;
  v2 = 0.0;
  ffi_call(&cif, FFI_FN(my_f), &rint, values);
  CHECK(rint == 2);
  
  s = "1234567";
  v2 = -1.0;
  v1 = -2;
  ffi_call(&cif, FFI_FN(my_f), &rint, values);
  CHECK(rint == 4);
  
  s = "1234567890123456789012345";
  v2 = 1.0;
  v1 = 2;
  ffi_call(&cif, FFI_FN(my_f), &rint, values);
  CHECK(rint == 28);
  
  exit(0);
}
