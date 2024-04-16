/* Area:	closure_call
   Purpose:	Check return value uchar.
   Limitations:	none.
   PR:		none.
   Originator:	<andreast@gcc.gnu.org> 20030828	 */

/* { dg-do run } */
#include "ffitest.h"

static void cls_ret_uchar_fn(ffi_cif* cif __UNUSED__, void* resp, void** args,
			     void* userdata __UNUSED__)
{
  *(ffi_arg*)resp = *(unsigned char *)args[0];
  printf("%d: %d\n",*(unsigned char *)args[0],
	 (int)*(ffi_arg *)(resp));
  CHECK(*(unsigned char *)args[0] == 127);
  CHECK((int)*(ffi_arg *)(resp) == 127);
}
typedef unsigned char (*cls_ret_uchar)(unsigned char);

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  ffi_type * cl_arg_types[2];
  unsigned char res;

  cl_arg_types[0] = &ffi_type_uchar;
  cl_arg_types[1] = NULL;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 1,
		     &ffi_type_uchar, cl_arg_types) == FFI_OK);

  CHECK(ffi_prep_closure_loc(pcl, &cif, cls_ret_uchar_fn, NULL, code)  == FFI_OK);

  res = (*((cls_ret_uchar)code))(127);
  /* { dg-output "127: 127" } */
  printf("res: %d\n",res);
  /* { dg-output "\nres: 127" } */
  CHECK(res == 127);

  exit(0);
}
