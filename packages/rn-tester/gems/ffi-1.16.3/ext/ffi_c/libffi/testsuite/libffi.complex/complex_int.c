/* Area:	ffi_call
   Purpose:	Check non-standard complex types.
   Limitations:	none.
   PR:		none.
   Originator:	<vogt@linux.vnet.ibm.com>.  */

/* { dg-do run } */

#include "ffitest.h"
#include "ffi.h"
#include <complex.h>

_Complex int f_complex(_Complex int c, int x, int *py)
{
  __real__ c = -2 * __real__ c;
  __imag__ c = __imag__ c + 1;
  *py += x;
  return c;
}

/*
 * This macro can be used to define new complex type descriptors
 * in a platform independent way.
 *
 * name: Name of the new descriptor is ffi_type_complex_<name>.
 * type: The C base type of the complex type.
 */
#define FFI_COMPLEX_TYPEDEF(name, type, ffitype)	     \
  static ffi_type *ffi_elements_complex_##name [2] = {	     \
    (ffi_type *)(&ffitype), NULL			     \
  };							     \
  struct struct_align_complex_##name {			     \
    char c;						     \
    _Complex type x;					     \
  };							     \
  ffi_type ffi_type_complex_##name = {		     \
    sizeof(_Complex type),				     \
    offsetof(struct struct_align_complex_##name, x),	     \
    FFI_TYPE_COMPLEX,					     \
    (ffi_type **)ffi_elements_complex_##name		     \
  }

/* Define new complex type descriptors using the macro: */
/* ffi_type_complex_sint */
FFI_COMPLEX_TYPEDEF(sint, int, ffi_type_sint);
/* ffi_type_complex_uchar */
FFI_COMPLEX_TYPEDEF(uchar, unsigned char, ffi_type_uint8);

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];

  _Complex int tc_arg;
  _Complex int tc_result;
  int tc_int_arg_x;
  int tc_y;
  int *tc_ptr_arg_y = &tc_y;

  args[0] = &ffi_type_complex_sint;
  args[1] = &ffi_type_sint;
  args[2] = &ffi_type_pointer;
  values[0] = &tc_arg;
  values[1] = &tc_int_arg_x;
  values[2] = &tc_ptr_arg_y;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 3, &ffi_type_complex_sint, args)
	== FFI_OK);

  tc_arg = 1 + 7 * I;
  tc_int_arg_x = 1234;
  tc_y = 9876;
  ffi_call(&cif, FFI_FN(f_complex), &tc_result, values);

  printf ("%d,%di %d,%di, x %d 1234, y %d 11110\n",
	  (int)tc_result, (int)(tc_result * -I), 2, 8, tc_int_arg_x, tc_y);
  /* dg-output "-2,8i 2,8i, x 1234 1234, y 11110 11110" */
  CHECK (creal (tc_result) == -2);
  CHECK (cimag (tc_result) == 8);
  CHECK (tc_int_arg_x == 1234);
  CHECK (*tc_ptr_arg_y == 11110);

  exit(0);
}
