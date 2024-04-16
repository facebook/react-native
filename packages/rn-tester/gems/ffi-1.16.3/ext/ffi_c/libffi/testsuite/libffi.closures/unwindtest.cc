/* Area:	ffi_closure, unwind info
   Purpose:	Check if the unwind information is passed correctly.
   Limitations:	none.
   PR:		none.
   Originator:	Jeff Sturm <jsturm@one-point.com>  */

/* { dg-do run { xfail moxie*-*-* } } */

#include "ffitest.h"

void ABI_ATTR
closure_test_fn(ffi_cif* cif __UNUSED__, void* resp __UNUSED__,
		void** args __UNUSED__, void* userdata __UNUSED__)
{
  throw 9;
}

typedef void (*closure_test_type)();

void closure_test_fn1(ffi_cif* cif __UNUSED__, void* resp,
		      void** args, void* userdata __UNUSED__)
 {
    *(ffi_arg*)resp =
      (int)*(float *)args[0] +(int)(*(float *)args[1]) +
      (int)(*(float *)args[2]) + (int)*(float *)args[3] +
      (int)(*(signed short *)args[4]) + (int)(*(float *)args[5]) +
      (int)*(float *)args[6] + (int)(*(int *)args[7]) +
      (int)(*(double*)args[8]) + (int)*(int *)args[9] +
      (int)(*(int *)args[10]) + (int)(*(float *)args[11]) +
      (int)*(int *)args[12] + (int)(*(int *)args[13]) +
      (int)(*(int *)args[14]) + *(int *)args[15] + (int)(intptr_t)userdata;

    printf("%d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d %d: %d\n",
	   (int)*(float *)args[0], (int)(*(float *)args[1]),
	   (int)(*(float *)args[2]), (int)*(float *)args[3],
	   (int)(*(signed short *)args[4]), (int)(*(float *)args[5]),
	   (int)*(float *)args[6], (int)(*(int *)args[7]),
	   (int)(*(double *)args[8]), (int)*(int *)args[9],
	   (int)(*(int *)args[10]), (int)(*(float *)args[11]),
	   (int)*(int *)args[12], (int)(*(int *)args[13]),
	   (int)(*(int *)args[14]), *(int *)args[15],
	   (int)(intptr_t)userdata, (int)*(ffi_arg*)resp);

    throw (int)*(ffi_arg*)resp;
}

typedef int (*closure_test_type1)(float, float, float, float, signed short,
				  float, float, int, double, int, int, float,
				  int, int, int, int);

extern "C"
int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = (ffi_closure *)ffi_closure_alloc(sizeof(ffi_closure), &code);
  ffi_type * cl_arg_types[17];

  {
    cl_arg_types[1] = NULL;

    CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 0,
		       &ffi_type_void, cl_arg_types) == FFI_OK);
    CHECK(ffi_prep_closure_loc(pcl, &cif, closure_test_fn, NULL, code) == FFI_OK);

    try
      {
	(*((closure_test_type)(code)))();
      } catch (int exception_code)
      {
	CHECK(exception_code == 9);
      }

    printf("part one OK\n");
    /* { dg-output "part one OK" } */
    }

    {

      cl_arg_types[0] = &ffi_type_float;
      cl_arg_types[1] = &ffi_type_float;
      cl_arg_types[2] = &ffi_type_float;
      cl_arg_types[3] = &ffi_type_float;
      cl_arg_types[4] = &ffi_type_sshort;
      cl_arg_types[5] = &ffi_type_float;
      cl_arg_types[6] = &ffi_type_float;
      cl_arg_types[7] = &ffi_type_uint;
      cl_arg_types[8] = &ffi_type_double;
      cl_arg_types[9] = &ffi_type_uint;
      cl_arg_types[10] = &ffi_type_uint;
      cl_arg_types[11] = &ffi_type_float;
      cl_arg_types[12] = &ffi_type_uint;
      cl_arg_types[13] = &ffi_type_uint;
      cl_arg_types[14] = &ffi_type_uint;
      cl_arg_types[15] = &ffi_type_uint;
      cl_arg_types[16] = NULL;

      /* Initialize the cif */
      CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 16,
			 &ffi_type_sint, cl_arg_types) == FFI_OK);

      CHECK(ffi_prep_closure_loc(pcl, &cif, closure_test_fn1,
                                 (void *) 3 /* userdata */, code)  == FFI_OK);
      try
	{
	  (*((closure_test_type1)code))
	    (1.1, 2.2, 3.3, 4.4, 127, 5.5, 6.6, 8, 9, 10, 11, 12.0, 13,
	     19, 21, 1);
	  /* { dg-output "\n1 2 3 4 127 5 6 8 9 10 11 12 13 19 21 1 3: 255" } */
	} catch (int exception_code)
	{
	  CHECK(exception_code == 255);
	}
      printf("part two OK\n");
      /* { dg-output "\npart two OK" } */
    }
    exit(0);
}
