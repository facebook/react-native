/* Area:	closure_call
   Purpose:	Check return value sshort.
   Limitations:	none.
   PR:		none.
   Originator:	<andreast@gcc.gnu.org> 20031108	 */

/* { dg-do run } */
#include "ffitest.h"

static void cls_ret_sshort_fn(ffi_cif* cif __UNUSED__, void* resp, void** args,
			      void* userdata __UNUSED__)
{
  *(ffi_arg*)resp = *(signed short *)args[0];
  printf("%d: %d\n",*(signed short *)args[0],
	 (int)*(ffi_arg *)(resp));
  CHECK(*(signed short *)args[0] == 255);
  CHECK((int)*(ffi_arg *)(resp) == 255);
}
typedef signed short (*cls_ret_sshort)(signed short);

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  ffi_type * cl_arg_types[2];
  signed short res;

  cl_arg_types[0] = &ffi_type_sshort;
  cl_arg_types[1] = NULL;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 1,
		     &ffi_type_sshort, cl_arg_types) == FFI_OK);

  CHECK(ffi_prep_closure_loc(pcl, &cif, cls_ret_sshort_fn, NULL, code)  == FFI_OK);

  res = (*((cls_ret_sshort)code))(255);
  /* { dg-output "255: 255" } */
  printf("res: %d\n",res);
  /* { dg-output "\nres: 255" } */
  CHECK(res == 255);

  exit(0);
}
