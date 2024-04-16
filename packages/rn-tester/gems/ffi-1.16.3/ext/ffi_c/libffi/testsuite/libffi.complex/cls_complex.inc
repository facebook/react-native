/* -*-c-*- */
#include "ffitest.h"
#include <complex.h>

static void cls_ret_complex_fn(ffi_cif* cif __UNUSED__, void* resp, void** args,
			      void* userdata __UNUSED__)
 {
   _Complex T_C_TYPE *pa;
   _Complex T_C_TYPE *pr;
   pa = (_Complex T_C_TYPE *)args[0];
   pr = (_Complex T_C_TYPE *)resp;
   *pr = *pa;

   printf("%.6f,%.6fi: %.6f,%.6fi\n",
	  T_CONV creal (*pa), T_CONV cimag (*pa),
	  T_CONV creal (*pr), T_CONV cimag (*pr));
 }
typedef _Complex T_C_TYPE (*cls_ret_complex)(_Complex T_C_TYPE);

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  ffi_type * cl_arg_types[2];
  _Complex T_C_TYPE res;

  cl_arg_types[0] = &T_FFI_TYPE;
  cl_arg_types[1] = NULL;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 1,
		     &T_FFI_TYPE, cl_arg_types) == FFI_OK);

  CHECK(ffi_prep_closure_loc(pcl, &cif, cls_ret_complex_fn, NULL, code)  == FFI_OK);

  res = (*((cls_ret_complex)code))(0.125 + 128.0 * I);
  printf("res: %.6f,%.6fi\n", T_CONV creal (res), T_CONV cimag (res));
  CHECK (res == (0.125 + 128.0 * I));

  exit(0);
}
