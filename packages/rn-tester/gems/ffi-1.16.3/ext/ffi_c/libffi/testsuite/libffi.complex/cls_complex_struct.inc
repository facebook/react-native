/* -*-c-*- */
#include "ffitest.h"
#include <complex.h>

typedef struct Cs {
  _Complex T_C_TYPE x;
  _Complex T_C_TYPE y;
} Cs;

Cs gc;

void
closure_test_fn(Cs p)
{
  printf("%.1f,%.1fi %.1f,%.1fi\n",
	 T_CONV creal (p.x), T_CONV cimag (p.x),
	 T_CONV creal (p.y), T_CONV cimag (p.y));
  gc = p;
}

void
closure_test_gn(ffi_cif* cif __UNUSED__, void* resp __UNUSED__,
		void** args, void* userdata __UNUSED__)
{
  closure_test_fn(*(Cs*)args[0]);
}

int main(int argc __UNUSED__, char** argv __UNUSED__)
{
  ffi_cif cif;

  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  ffi_type *cl_arg_types[1];

  ffi_type ts1_type;
  ffi_type* ts1_type_elements[4];

  Cs arg = { 1.0 + 11.0 * I, 2.0 + 22.0 * I};

  ts1_type.size = 0;
  ts1_type.alignment = 0;
  ts1_type.type = FFI_TYPE_STRUCT;
  ts1_type.elements = ts1_type_elements;

  ts1_type_elements[0] = &T_FFI_TYPE;
  ts1_type_elements[1] = &T_FFI_TYPE;
  ts1_type_elements[2] = NULL;

  cl_arg_types[0] = &ts1_type;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 1,
		     &ffi_type_void, cl_arg_types) == FFI_OK);

  CHECK(ffi_prep_closure_loc(pcl, &cif, closure_test_gn, NULL, code) == FFI_OK);

  gc.x = 0.0 + 0.0 * I;
  gc.y = 0.0 + 0.0 * I;
  ((void*(*)(Cs))(code))(arg);
  /* { dg-output "1.0,11.0i 2.0,22.0i\n" } */
  CHECK (gc.x == arg.x && gc.y == arg.y);

  gc.x = 0.0 + 0.0 * I;
  gc.y = 0.0 + 0.0 * I;
  closure_test_fn(arg);
  /* { dg-output "1.0,11.0i 2.0,22.0i\n" } */
  CHECK (gc.x == arg.x && gc.y == arg.y);

  return 0;
}
