/* Area:	closure_call
   Purpose:	Test anonymous unsigned int argument.
   Limitations:	none.
   PR:		none.
   Originator:	ARM Ltd. */

/* { dg-do run } */

#include "ffitest.h"

typedef unsigned int T;

static void cls_ret_T_fn(ffi_cif* cif __UNUSED__, void* resp, void** args,
			 void* userdata __UNUSED__)
 {
   *(ffi_arg *)resp = *(T *)args[0];

   printf("%d: %d %d\n", (int)*(ffi_arg *)resp, *(T *)args[0], *(T *)args[1]);
   CHECK(*(T *)args[0] == 67);
   CHECK(*(T *)args[1] == 4);
   CHECK((int)*(ffi_arg *)resp == 67);
 }

typedef T (*cls_ret_T)(T, ...);

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  ffi_type * cl_arg_types[3];
  T res;

  cl_arg_types[0] = &ffi_type_uint;
  cl_arg_types[1] = &ffi_type_uint;
  cl_arg_types[2] = NULL;

  /* Initialize the cif */
  CHECK(ffi_prep_cif_var(&cif, FFI_DEFAULT_ABI, 1, 2,
			 &ffi_type_uint, cl_arg_types) == FFI_OK);

  CHECK(ffi_prep_closure_loc(pcl, &cif, cls_ret_T_fn, NULL, code)  == FFI_OK);
  res = ((((cls_ret_T)code)(67, 4)));
  /* { dg-output "67: 67 4" } */
  printf("res: %d\n", res);
  /* { dg-output "\nres: 67" } */
  CHECK(res == 67);
  exit(0);
}
