/* Area:	closure_call
   Purpose:	Check return value float.
   Limitations:	none.
   PR:		41908.
   Originator:	<rfm@gnu.org> 20091102	 */

/* { dg-do run } */
#include "ffitest.h"

typedef struct cls_struct_combined {
  float a;
  float b;
  float c;
  float d;
} cls_struct_combined;

static void cls_struct_combined_fn(struct cls_struct_combined arg)
{
  printf("%g %g %g %g\n",
	 arg.a, arg.b,
	 arg.c, arg.d);
  fflush(stdout);

  CHECK_FLOAT_EQ(arg.a, 4);
  CHECK_FLOAT_EQ(arg.b, 5);
  CHECK_FLOAT_EQ(arg.c, 1);
  CHECK_FLOAT_EQ(arg.d, 8);
}

static void
cls_struct_combined_gn(ffi_cif* cif __UNUSED__, void* resp __UNUSED__,
        void** args, void* userdata __UNUSED__)
{
  struct cls_struct_combined a0;

  a0 = *(struct cls_struct_combined*)(args[0]);

  cls_struct_combined_fn(a0);
}


int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  ffi_type* cls_struct_fields0[5];
  ffi_type cls_struct_type0;
  ffi_type* dbl_arg_types[5];

  struct cls_struct_combined g_dbl = {4.0, 5.0, 1.0, 8.0};

  cls_struct_type0.size = 0;
  cls_struct_type0.alignment = 0;
  cls_struct_type0.type = FFI_TYPE_STRUCT;
  cls_struct_type0.elements = cls_struct_fields0;

  cls_struct_fields0[0] = &ffi_type_float;
  cls_struct_fields0[1] = &ffi_type_float;
  cls_struct_fields0[2] = &ffi_type_float;
  cls_struct_fields0[3] = &ffi_type_float;
  cls_struct_fields0[4] = NULL;

  dbl_arg_types[0] = &cls_struct_type0;
  dbl_arg_types[1] = NULL;

  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 1, &ffi_type_void,
		     dbl_arg_types) == FFI_OK);

  CHECK(ffi_prep_closure_loc(pcl, &cif, cls_struct_combined_gn, NULL, code) == FFI_OK);

  ((void(*)(cls_struct_combined)) (code))(g_dbl);
  /* { dg-output "4 5 1 8" } */
  exit(0);
}
