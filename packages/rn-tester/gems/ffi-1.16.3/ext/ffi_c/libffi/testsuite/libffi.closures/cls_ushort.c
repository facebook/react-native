/* Area:	closure_call
   Purpose:	Check return value ushort.
   Limitations:	none.
   PR:		none.
   Originator:	<andreast@gcc.gnu.org> 20030828	 */

/* { dg-do run } */
#include "ffitest.h"

static void cls_ret_ushort_fn(ffi_cif* cif __UNUSED__, void* resp, void** args,
			      void* userdata __UNUSED__)
{
  *(ffi_arg*)resp = *(unsigned short *)args[0];

  printf("%d: %d\n",*(unsigned short *)args[0],
	 (int)*(ffi_arg *)(resp));
  CHECK(*(unsigned short *)args[0] == 65535);
  CHECK((int)*(ffi_arg *)(resp) == 65535);
}
typedef unsigned short (*cls_ret_ushort)(unsigned short);

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  ffi_type * cl_arg_types[2];
  unsigned short res;

  cl_arg_types[0] = &ffi_type_ushort;
  cl_arg_types[1] = NULL;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 1,
		     &ffi_type_ushort, cl_arg_types) == FFI_OK);

  CHECK(ffi_prep_closure_loc(pcl, &cif, cls_ret_ushort_fn, NULL, code)  == FFI_OK);

  res = (*((cls_ret_ushort)code))(65535);
  /* { dg-output "65535: 65535" } */
  printf("res: %d\n",res);
  /* { dg-output "\nres: 65535" } */
  CHECK(res == 65535);

  exit(0);
}
