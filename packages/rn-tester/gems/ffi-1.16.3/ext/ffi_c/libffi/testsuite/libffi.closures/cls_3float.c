/* Area:	ffi_call, closure_call
   Purpose:	Check structure passing with different structure size.
		Depending on the ABI. Check overlapping.
   Limitations:>none.
   PR:		none.
   Originator:	<compnerd@compnerd.org> 20171026	 */

/* { dg-do run } */

#include "ffitest.h"

typedef struct cls_struct_3float {
  float f;
  float g;
  float h;
} cls_struct_3float;

cls_struct_3float cls_struct_3float_fn(struct cls_struct_3float a1,
				       struct cls_struct_3float a2)
{
  struct cls_struct_3float result;

  result.f = a1.f + a2.f;
  result.g = a1.g + a2.g;
  result.h = a1.h + a2.h;

  printf("%g %g %g %g %g %g: %g %g %g\n", a1.f, a1.g, a1.h,
	 a2.f, a2.g, a2.h, result.f, result.g, result.h);

  CHECK_FLOAT_EQ(a1.f, 1);
  CHECK_FLOAT_EQ(a1.g, 2);
  CHECK_FLOAT_EQ(a1.h, 3);

  CHECK_FLOAT_EQ(a2.f, 1);
  CHECK_FLOAT_EQ(a2.g, 2);
  CHECK_FLOAT_EQ(a2.h, 3);

  CHECK_FLOAT_EQ(result.f, 2);
  CHECK_FLOAT_EQ(result.g, 4);
  CHECK_FLOAT_EQ(result.h, 6);

  return result;
}

static void
cls_struct_3float_gn(ffi_cif *cif __UNUSED__, void* resp, void **args,
		     void* userdata __UNUSED__)
{
  struct cls_struct_3float a1, a2;

  a1 = *(struct cls_struct_3float*)(args[0]);
  a2 = *(struct cls_struct_3float*)(args[1]);

  *(cls_struct_3float*)resp = cls_struct_3float_fn(a1, a2);
}

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  void *args_dbl[3];
  ffi_type* cls_struct_fields[4];
  ffi_type cls_struct_type;
  ffi_type* dbl_arg_types[3];

  struct cls_struct_3float g_dbl = { 1.0f, 2.0f, 3.0f };
  struct cls_struct_3float f_dbl = { 1.0f, 2.0f, 3.0f };
  struct cls_struct_3float res_dbl;

  cls_struct_fields[0] = &ffi_type_float;
  cls_struct_fields[1] = &ffi_type_float;
  cls_struct_fields[2] = &ffi_type_float;
  cls_struct_fields[3] = NULL;

  cls_struct_type.size = 0;
  cls_struct_type.alignment = 0;
  cls_struct_type.type = FFI_TYPE_STRUCT;
  cls_struct_type.elements = cls_struct_fields;

  dbl_arg_types[0] = &cls_struct_type;
  dbl_arg_types[1] = &cls_struct_type;
  dbl_arg_types[2] = NULL;

  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 2, &cls_struct_type,
		     dbl_arg_types) == FFI_OK);

  args_dbl[0] = &g_dbl;
  args_dbl[1] = &f_dbl;
  args_dbl[2] = NULL;

  ffi_call(&cif, FFI_FN(cls_struct_3float_fn), &res_dbl, args_dbl);
  /* { dg-output "1 2 3 1 2 3: 2 4 6" } */
  printf("res: %g %g %g\n", res_dbl.f, res_dbl.g, res_dbl.h);
  /* { dg-output "\nres: 2 4 6" } */
  CHECK_FLOAT_EQ(res_dbl.f, 2);
  CHECK_FLOAT_EQ(res_dbl.g, 4);
  CHECK_FLOAT_EQ(res_dbl.h, 6);

  CHECK(ffi_prep_closure_loc(pcl, &cif, cls_struct_3float_gn, NULL, code) ==
	FFI_OK);

  res_dbl = ((cls_struct_3float(*)(cls_struct_3float,
				   cls_struct_3float))(code))(g_dbl, f_dbl);
  /* { dg-output "\n1 2 3 1 2 3: 2 4 6" } */
  printf("res: %g %g %g\n", res_dbl.f, res_dbl.g, res_dbl.h);
  /* { dg-output "\nres: 2 4 6" } */
  CHECK_FLOAT_EQ(res_dbl.f, 2);
  CHECK_FLOAT_EQ(res_dbl.g, 4);
  CHECK_FLOAT_EQ(res_dbl.h, 6);

  exit(0);
}
