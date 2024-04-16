/* Area:	closure_call
   Purpose:	Check return value float.
   Limitations:	none.
   PR:		none.
   Originator:	<andreast@gcc.gnu.org> 20030828	 */

/* { dg-do run } */
#include "ffitest.h"

static void cls_ret_float_fn(ffi_cif* cif __UNUSED__, void* resp, void** args,
			     void* userdata __UNUSED__)
 {
   *(float *)resp = *(float *)args[0];

   printf("%g: %g\n",*(float *)args[0],
	  *(float *)resp);

   CHECK((int)(*(float *)args[0]) == -2122);
   CHECK((int)(*(float *)resp) == -2122);
 }

typedef float (*cls_ret_float)(float);

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  ffi_type * cl_arg_types[2];
  float res;

  cl_arg_types[0] = &ffi_type_float;
  cl_arg_types[1] = NULL;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 1,
		     &ffi_type_float, cl_arg_types) == FFI_OK);

  CHECK(ffi_prep_closure_loc(pcl, &cif, cls_ret_float_fn, NULL, code)  == FFI_OK);
  res = ((((cls_ret_float)code)(-2122.12)));
  /* { dg-output "\\-2122.12: \\-2122.12" } */
  printf("res: %.6f\n", res);
  /* { dg-output "\nres: \-2122.120117" } */
  CHECK((int)res == -2122);
  exit(0);
}
