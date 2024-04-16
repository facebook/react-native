/* Area:	closure_call
   Purpose:	Check return value long long.
   Limitations:	none.
   PR:		none.
   Originator:	<andreast@gcc.gnu.org> 20030828	 */

/* { dg-do run } */
/* { dg-options "-Wno-format" { target alpha*-dec-osf* } } */
#include "ffitest.h"

static void cls_ret_ulonglong_fn(ffi_cif* cif __UNUSED__, void* resp,
				 void** args, void* userdata __UNUSED__)
{
  *(unsigned long long *)resp= 0xfffffffffffffffLL ^ *(unsigned long long *)args[0];

  printf("%" PRIuLL ": %" PRIuLL "\n",*(unsigned long long *)args[0],
	 *(unsigned long long *)(resp));
}
typedef unsigned long long (*cls_ret_ulonglong)(unsigned long long);

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  ffi_type * cl_arg_types[2];
  unsigned long long res;

  cl_arg_types[0] = &ffi_type_uint64;
  cl_arg_types[1] = NULL;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 1,
		     &ffi_type_uint64, cl_arg_types) == FFI_OK);
  CHECK(ffi_prep_closure_loc(pcl, &cif, cls_ret_ulonglong_fn, NULL, code)  == FFI_OK);
  res = (*((cls_ret_ulonglong)code))(214LL);
  /* { dg-output "214: 1152921504606846761" } */
  printf("res: %" PRIdLL "\n", res);
  /* { dg-output "\nres: 1152921504606846761" } */
  CHECK(res == 1152921504606846761LL);

  res = (*((cls_ret_ulonglong)code))(9223372035854775808LL);
  /* { dg-output "\n9223372035854775808: 8070450533247928831" } */
  printf("res: %" PRIdLL "\n", res);
  /* { dg-output "\nres: 8070450533247928831" } */
  CHECK(res == 8070450533247928831LL);

  exit(0);
}
