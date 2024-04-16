/* Area:	closure_call
   Purpose:	Check return value uint.
   Limitations:	none.
   PR:		none.
   Originator:	<andreast@gcc.gnu.org> 20030828	 */

/* { dg-do run } */
#include "ffitest.h"

static void cls_ret_uint_fn(ffi_cif* cif __UNUSED__, void* resp, void** args,
			    void* userdata __UNUSED__)
{
  *(ffi_arg *)resp = *(unsigned int *)args[0];

  printf("%d: %d\n",*(unsigned int *)args[0],
	 (int)*(ffi_arg *)(resp));

  CHECK(*(unsigned int *)args[0] == 2147483647);
  CHECK((int)*(ffi_arg *)(resp) == 2147483647);
}
typedef unsigned int (*cls_ret_uint)(unsigned int);

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  ffi_type * cl_arg_types[2];
  unsigned int res;

  cl_arg_types[0] = &ffi_type_uint;
  cl_arg_types[1] = NULL;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 1,
		     &ffi_type_uint, cl_arg_types) == FFI_OK);

  CHECK(ffi_prep_closure_loc(pcl, &cif, cls_ret_uint_fn, NULL, code)  == FFI_OK);

  res = (*((cls_ret_uint)code))(2147483647);
  /* { dg-output "2147483647: 2147483647" } */
  printf("res: %d\n",res);
  /* { dg-output "\nres: 2147483647" } */
  CHECK(res == 2147483647);

  exit(0);
}
