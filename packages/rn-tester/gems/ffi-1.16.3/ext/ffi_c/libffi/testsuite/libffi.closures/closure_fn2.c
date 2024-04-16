/* Area:	closure_call
   Purpose:	Check multiple values passing from different type.
		Also, exceed the limit of gpr and fpr registers on PowerPC
		Darwin.
   Limitations:	none.
   PR:		none.
   Originator:	<andreast@gcc.gnu.org> 20030828	 */

/* { dg-do run } */
#include "ffitest.h"

static void closure_test_fn2(ffi_cif* cif __UNUSED__, void* resp, void** args,
			     void* userdata)
{
  *(ffi_arg*)resp =
    (int)*(double *)args[0] +(int)(*(double *)args[1]) +
    (int)(*(double *)args[2]) + (int)*(double *)args[3] +
    (int)(*(signed short *)args[4]) + (int)(*(double *)args[5]) +
    (int)*(double *)args[6] + (int)(*(int *)args[7]) +
    (int)(*(double *)args[8]) + (int)*(int *)args[9] +
    (int)(*(int *)args[10]) + (int)(*(float *)args[11]) +
    (int)*(int *)args[12] + (int)(*(float *)args[13]) +
    (int)(*(int *)args[14]) + *(int *)args[15] + (intptr_t)userdata;

  printf("%d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d: %d\n",
	 (int)*(double *)args[0], (int)(*(double *)args[1]),
	 (int)(*(double *)args[2]), (int)*(double *)args[3],
	 (int)(*(signed short *)args[4]), (int)(*(double *)args[5]),
	 (int)*(double *)args[6], (int)(*(int *)args[7]),
	 (int)(*(double*)args[8]), (int)*(int *)args[9],
	 (int)(*(int *)args[10]), (int)(*(float *)args[11]),
	 (int)*(int *)args[12], (int)(*(float *)args[13]),
	 (int)(*(int *)args[14]), *(int *)args[15], (int)(intptr_t)userdata,
	 (int)*(ffi_arg *)resp);
  CHECK((int)*(ffi_arg *)resp == 255);
}

typedef int (*closure_test_type2)(double, double, double, double, signed short,
				  double, double, int, double, int, int, float,
				  int, float, int, int);

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  ffi_type * cl_arg_types[17];
  int res;

  cl_arg_types[0] = &ffi_type_double;
  cl_arg_types[1] = &ffi_type_double;
  cl_arg_types[2] = &ffi_type_double;
  cl_arg_types[3] = &ffi_type_double;
  cl_arg_types[4] = &ffi_type_sshort;
  cl_arg_types[5] = &ffi_type_double;
  cl_arg_types[6] = &ffi_type_double;
  cl_arg_types[7] = &ffi_type_sint;
  cl_arg_types[8] = &ffi_type_double;
  cl_arg_types[9] = &ffi_type_sint;
  cl_arg_types[10] = &ffi_type_sint;
  cl_arg_types[11] = &ffi_type_float;
  cl_arg_types[12] = &ffi_type_sint;
  cl_arg_types[13] = &ffi_type_float;
  cl_arg_types[14] = &ffi_type_sint;
  cl_arg_types[15] = &ffi_type_sint;
  cl_arg_types[16] = NULL;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 16,
		     &ffi_type_sint, cl_arg_types) == FFI_OK);

  CHECK(ffi_prep_closure_loc(pcl, &cif, closure_test_fn2,
                             (void *) 3 /* userdata */, code) == FFI_OK);

  res = (*((closure_test_type2)code))
    (1, 2, 3, 4, 127, 5, 6, 8, 9, 10, 11, 12.0, 13,
     19.0, 21, 1);
  /* { dg-output "1 2 3 4 127 5 6 8 9 10 11 12 13 19 21 1 3: 255" } */
  printf("res: %d\n",res);
  /* { dg-output "\nres: 255" } */
  CHECK(res == 255);
  exit(0);
}
