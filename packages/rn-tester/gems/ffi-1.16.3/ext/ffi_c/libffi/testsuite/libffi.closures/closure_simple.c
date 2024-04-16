/* Area:	closure_call
   Purpose:	Check simple closure handling with all ABIs
   Limitations:	none.
   PR:		none.
   Originator:	<twalljava@dev.java.net> */

/* { dg-do run } */
#include "ffitest.h"

static void
closure_test(ffi_cif* cif __UNUSED__, void* resp, void** args, void* userdata)
{
  *(ffi_arg*)resp =
    (int)*(int *)args[0] + (int)(*(int *)args[1])
    + (int)(*(int *)args[2])  + (int)(*(int *)args[3])
    + (int)(intptr_t)userdata;

  printf("%d %d %d %d: %d\n",
	 (int)*(int *)args[0], (int)(*(int *)args[1]),
	 (int)(*(int *)args[2]), (int)(*(int *)args[3]),
         (int)*(ffi_arg *)resp);

  CHECK((int)*(int *)args[0] == 0);
  CHECK((int)*(int *)args[1] == 1);
  CHECK((int)*(int *)args[2] == 2);
  CHECK((int)*(int *)args[3] == 3);
  CHECK((int)*(ffi_arg *)resp == 9);
}

typedef int (ABI_ATTR *closure_test_type0)(int, int, int, int);

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  ffi_type * cl_arg_types[17];
  int res;

  cl_arg_types[0] = &ffi_type_uint;
  cl_arg_types[1] = &ffi_type_uint;
  cl_arg_types[2] = &ffi_type_uint;
  cl_arg_types[3] = &ffi_type_uint;
  cl_arg_types[4] = NULL;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, ABI_NUM, 4,
		     &ffi_type_sint, cl_arg_types) == FFI_OK);

  CHECK(ffi_prep_closure_loc(pcl, &cif, closure_test,
                             (void *) 3 /* userdata */, code) == FFI_OK);

  res = (*(closure_test_type0)code)(0, 1, 2, 3);
  /* { dg-output "0 1 2 3: 9" } */

  printf("res: %d\n",res);
  /* { dg-output "\nres: 9" } */
  CHECK(res == 9);

  exit(0);
}
