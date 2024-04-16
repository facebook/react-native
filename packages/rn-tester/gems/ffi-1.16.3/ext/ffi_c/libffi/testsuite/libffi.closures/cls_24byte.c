/* Area:	ffi_call, closure_call
   Purpose:	Check structure passing with different structure size.
		Depending on the ABI. Check overlapping.
   Limitations:	none.
   PR:		none.
   Originator:	<andreast@gcc.gnu.org> 20030828	 */

/* { dg-do run } */
#include "ffitest.h"

typedef struct cls_struct_24byte {
  double a;
  double b;
  int c;
  float d;
} cls_struct_24byte;

cls_struct_24byte cls_struct_24byte_fn(struct cls_struct_24byte b0,
			    struct cls_struct_24byte b1,
			    struct cls_struct_24byte b2,
			    struct cls_struct_24byte b3)
{
  struct cls_struct_24byte result;

  result.a = b0.a + b1.a + b2.a + b3.a;
  result.b = b0.b + b1.b + b2.b + b3.b;
  result.c = b0.c + b1.c + b2.c + b3.c;
  result.d = b0.d + b1.d + b2.d + b3.d;

  printf("%g %g %d %g %g %g %d %g %g %g %d %g %g %g %d %g: %g %g %d %g\n",
	 b0.a, b0.b, b0.c, b0.d,
	 b1.a, b1.b, b1.c, b1.d,
	 b2.a, b2.b, b2.c, b2.d,
	 b3.a, b3.b, b3.c, b3.d,
	 result.a, result.b, result.c, result.d);
  CHECK_DOUBLE_EQ(b0.a, 9);
  CHECK_DOUBLE_EQ(b0.b, 2);
  CHECK(b0.c == 6);
  CHECK_FLOAT_EQ(b0.d, 5);

  CHECK_DOUBLE_EQ(b1.a, 1);
  CHECK_DOUBLE_EQ(b1.b, 2);
  CHECK(b1.c == 3);
  CHECK_FLOAT_EQ(b1.d, 7);

  CHECK_DOUBLE_EQ(b2.a, 4);
  CHECK_DOUBLE_EQ(b2.b, 5);
  CHECK(b2.c == 7);
  CHECK_FLOAT_EQ(b2.d, 9);

  CHECK_DOUBLE_EQ(b3.a, 8);
  CHECK_DOUBLE_EQ(b3.b, 6);
  CHECK(b3.c == 1);
  CHECK_FLOAT_EQ(b3.d, 4);

  CHECK_DOUBLE_EQ(result.a, 22);
  CHECK_DOUBLE_EQ(result.b, 15);
  CHECK(result.c == 17);
  CHECK_FLOAT_EQ(result.d, 25);

  return result;
}

static void
cls_struct_24byte_gn(ffi_cif* cif __UNUSED__, void* resp, void** args,
		     void* userdata __UNUSED__)
{
  struct cls_struct_24byte b0, b1, b2, b3;

  b0 = *(struct cls_struct_24byte*)(args[0]);
  b1 = *(struct cls_struct_24byte*)(args[1]);
  b2 = *(struct cls_struct_24byte*)(args[2]);
  b3 = *(struct cls_struct_24byte*)(args[3]);

  *(cls_struct_24byte*)resp = cls_struct_24byte_fn(b0, b1, b2, b3);
}

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  void* args_dbl[5];
  ffi_type* cls_struct_fields[5];
  ffi_type cls_struct_type;
  ffi_type* dbl_arg_types[5];

  struct cls_struct_24byte e_dbl = { 9.0, 2.0, 6, 5.0 };
  struct cls_struct_24byte f_dbl = { 1.0, 2.0, 3, 7.0 };
  struct cls_struct_24byte g_dbl = { 4.0, 5.0, 7, 9.0 };
  struct cls_struct_24byte h_dbl = { 8.0, 6.0, 1, 4.0 };
  struct cls_struct_24byte res_dbl;

  cls_struct_type.size = 0;
  cls_struct_type.alignment = 0;
  cls_struct_type.type = FFI_TYPE_STRUCT;
  cls_struct_type.elements = cls_struct_fields;

  cls_struct_fields[0] = &ffi_type_double;
  cls_struct_fields[1] = &ffi_type_double;
  cls_struct_fields[2] = &ffi_type_sint;
  cls_struct_fields[3] = &ffi_type_float;
  cls_struct_fields[4] = NULL;

  dbl_arg_types[0] = &cls_struct_type;
  dbl_arg_types[1] = &cls_struct_type;
  dbl_arg_types[2] = &cls_struct_type;
  dbl_arg_types[3] = &cls_struct_type;
  dbl_arg_types[4] = NULL;

  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 4, &cls_struct_type,
		     dbl_arg_types) == FFI_OK);

  args_dbl[0] = &e_dbl;
  args_dbl[1] = &f_dbl;
  args_dbl[2] = &g_dbl;
  args_dbl[3] = &h_dbl;
  args_dbl[4] = NULL;

  ffi_call(&cif, FFI_FN(cls_struct_24byte_fn), &res_dbl, args_dbl);
  /* { dg-output "9 2 6 5 1 2 3 7 4 5 7 9 8 6 1 4: 22 15 17 25" } */
  printf("res: %g %g %d %g\n", res_dbl.a, res_dbl.b, res_dbl.c, res_dbl.d);
  /* { dg-output "\nres: 22 15 17 25" } */
  CHECK_DOUBLE_EQ(res_dbl.a, 22);
  CHECK_DOUBLE_EQ(res_dbl.b, 15);
  CHECK(res_dbl.c == 17);
  CHECK_FLOAT_EQ(res_dbl.d, 25);

  CHECK(ffi_prep_closure_loc(pcl, &cif, cls_struct_24byte_gn, NULL, code) == FFI_OK);

  res_dbl = ((cls_struct_24byte(*)(cls_struct_24byte,
				   cls_struct_24byte,
				   cls_struct_24byte,
				   cls_struct_24byte))
	     (code))(e_dbl, f_dbl, g_dbl, h_dbl);
  /* { dg-output "\n9 2 6 5 1 2 3 7 4 5 7 9 8 6 1 4: 22 15 17 25" } */
  printf("res: %g %g %d %g\n", res_dbl.a, res_dbl.b, res_dbl.c, res_dbl.d);
  /* { dg-output "\nres: 22 15 17 25" } */
  CHECK_DOUBLE_EQ(res_dbl.a, 22);
  CHECK_DOUBLE_EQ(res_dbl.b, 15);
  CHECK(res_dbl.c == 17);
  CHECK_FLOAT_EQ(res_dbl.d, 25);

  exit(0);
}
