/* Area:	closure_call
   Purpose:	Check return value sint32.
   Limitations:	none.
   PR:		none.
   Originator:	<andreast@gcc.gnu.org> 20031108	 */

/* { dg-do run } */
#include "ffitest.h"

static void cls_ret_sint_fn(ffi_cif* cif __UNUSED__, void* resp, void** args,
			    void* userdata __UNUSED__)
{
  *(ffi_arg*)resp = *(signed int *)args[0];
  printf("%d: %d\n",*(signed int *)args[0],
	 (int)*(ffi_arg *)(resp));
  CHECK(*(signed int *)args[0] == 65534);
  CHECK((int)*(ffi_arg *)(resp) == 65534);
}
typedef signed int (*cls_ret_sint)(signed int);

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  ffi_type * cl_arg_types[2];
  signed int res;

  cl_arg_types[0] = &ffi_type_sint;
  cl_arg_types[1] = NULL;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 1,
		     &ffi_type_sint, cl_arg_types) == FFI_OK);

  CHECK(ffi_prep_closure_loc(pcl, &cif, cls_ret_sint_fn, NULL, code)  == FFI_OK);

  res = (*((cls_ret_sint)code))(65534);
  /* { dg-output "65534: 65534" } */
  printf("res: %d\n",res);
  /* { dg-output "\nres: 65534" } */

  exit(0);
}
