/* Area:	closure_call
   Purpose:	Check multiple values passing from different type.
		Also, exceed the limit of gpr and fpr registers on PowerPC
		Darwin.
   Limitations:	none.
   PR:		none.
   Originator:	<andreast@gcc.gnu.org> 20030828	 */

/* { dg-do run } */
#include "ffitest.h"

static void closure_test_fn3(ffi_cif* cif __UNUSED__, void* resp, void** args,
			     void* userdata)
 {
   *(ffi_arg*)resp =
     (int)*(float *)args[0] +(int)(*(float *)args[1]) +
     (int)(*(float *)args[2]) + (int)*(float *)args[3] +
     (int)(*(float *)args[4]) + (int)(*(float *)args[5]) +
     (int)*(float *)args[6] + (int)(*(float *)args[7]) +
     (int)(*(double *)args[8]) + (int)*(int *)args[9] +
     (int)(*(float *)args[10]) + (int)(*(float *)args[11]) +
     (int)*(int *)args[12] + (int)(*(float *)args[13]) +
     (int)(*(float *)args[14]) +  *(int *)args[15] + (intptr_t)userdata;

   printf("%d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d: %d\n",
	  (int)*(float *)args[0], (int)(*(float *)args[1]),
	  (int)(*(float *)args[2]), (int)*(float *)args[3],
	  (int)(*(float *)args[4]), (int)(*(float *)args[5]),
	  (int)*(float *)args[6], (int)(*(float *)args[7]),
	  (int)(*(double *)args[8]), (int)*(int *)args[9],
	  (int)(*(float *)args[10]), (int)(*(float *)args[11]),
	  (int)*(int *)args[12], (int)(*(float *)args[13]),
	  (int)(*(float *)args[14]), *(int *)args[15], (int)(intptr_t)userdata,
    (int)*(ffi_arg *)resp);

    CHECK((int)*(float *)args[0] == 1);
    CHECK((int)(*(float *)args[1]) == 2);
    CHECK((int)(*(float *)args[2]) == 3);
    CHECK((int)(*(float *)args[3]) == 4);
    CHECK((int)(*(float *)args[4]) == 5);
    CHECK((int)(*(float *)args[5]) == 6);
    CHECK((int)*(float *)args[6] == 7);
    CHECK((int)(*(float *)args[7]) == 8);
    CHECK((int)(*(double *)args[8]) == 9);
    CHECK((int)*(int *)args[9] == 10);
    CHECK((int)(*(float *)args[10]) == 11);
    CHECK((int)(*(float *)args[11]) == 12);
    CHECK((int)*(int *)args[12] == 13);
    CHECK((int)(*(float *)args[13]) == 19);
    CHECK((int)(*(float *)args[14]) == 21);
    CHECK(*(int *)args[15] == 1);
    CHECK((int)(intptr_t)userdata == 3);

    CHECK((int)*(ffi_arg *)resp == 135);
 }

typedef int (*closure_test_type3)(float, float, float, float, float, float,
				  float, float, double, int, float, float, int,
				  float, float, int);

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  ffi_type * cl_arg_types[17];
  int res;

  cl_arg_types[0] = &ffi_type_float;
  cl_arg_types[1] = &ffi_type_float;
  cl_arg_types[2] = &ffi_type_float;
  cl_arg_types[3] = &ffi_type_float;
  cl_arg_types[4] = &ffi_type_float;
  cl_arg_types[5] = &ffi_type_float;
  cl_arg_types[6] = &ffi_type_float;
  cl_arg_types[7] = &ffi_type_float;
  cl_arg_types[8] = &ffi_type_double;
  cl_arg_types[9] = &ffi_type_sint;
  cl_arg_types[10] = &ffi_type_float;
  cl_arg_types[11] = &ffi_type_float;
  cl_arg_types[12] = &ffi_type_sint;
  cl_arg_types[13] = &ffi_type_float;
  cl_arg_types[14] = &ffi_type_float;
  cl_arg_types[15] = &ffi_type_sint;
  cl_arg_types[16] = NULL;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 16,
		     &ffi_type_sint, cl_arg_types) == FFI_OK);

  CHECK(ffi_prep_closure_loc(pcl, &cif, closure_test_fn3,
                             (void *) 3 /* userdata */, code)  == FFI_OK);

  res = (*((closure_test_type3)code))
    (1.1, 2.2, 3.3, 4.4, 5.5, 6.6, 7.7, 8.8, 9, 10, 11.11, 12.0, 13,
     19.19, 21.21, 1);
  /* { dg-output "1 2 3 4 5 6 7 8 9 10 11 12 13 19 21 1 3: 135" } */
  printf("res: %d\n",res);
  /* { dg-output "\nres: 135" } */
  CHECK(res == 135);
  exit(0);
}
