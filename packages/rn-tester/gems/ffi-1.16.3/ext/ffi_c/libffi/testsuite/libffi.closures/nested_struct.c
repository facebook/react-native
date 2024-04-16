/* Area:	ffi_call, closure_call
   Purpose:	Check structure passing with different structure size.
		Contains structs as parameter of the struct itself.
   Limitations:	none.
   PR:		none.
   Originator:	<andreast@gcc.gnu.org> 20030828	 */

/* { dg-do run } */
#include "ffitest.h"

typedef struct cls_struct_16byte1 {
  double a;
  float b;
  int c;
} cls_struct_16byte1;

typedef struct cls_struct_16byte2 {
  int ii;
  double dd;
  float ff;
} cls_struct_16byte2;

typedef struct cls_struct_combined {
  cls_struct_16byte1 d;
  cls_struct_16byte2 e;
} cls_struct_combined;

static cls_struct_combined cls_struct_combined_fn(struct cls_struct_16byte1 b0,
			    struct cls_struct_16byte2 b1,
			    struct cls_struct_combined b2)
{
  struct cls_struct_combined result;

  result.d.a = b0.a + b1.dd + b2.d.a;
  result.d.b = b0.b + b1.ff + b2.d.b;
  result.d.c = b0.c + b1.ii + b2.d.c;
  result.e.ii = b0.c + b1.ii + b2.e.ii;
  result.e.dd = b0.a + b1.dd + b2.e.dd;
  result.e.ff = b0.b + b1.ff + b2.e.ff;

  printf("%g %g %d %d %g %g %g %g %d %d %g %g: %g %g %d %d %g %g\n",
	 b0.a, b0.b, b0.c,
	 b1.ii, b1.dd, b1.ff,
	 b2.d.a, b2.d.b, b2.d.c,
	 b2.e.ii, b2.e.dd, b2.e.ff,
	 result.d.a, result.d.b, result.d.c,
	 result.e.ii, result.e.dd, result.e.ff);

  CHECK_DOUBLE_EQ(b0.a, 9);
  CHECK_FLOAT_EQ(b0.b, 2);
  CHECK(b0.c == 6);

  CHECK(b1.ii == 1);
  CHECK_DOUBLE_EQ(b1.dd, 2);
  CHECK_FLOAT_EQ(b1.ff, 3);

  CHECK_DOUBLE_EQ(b2.d.a, 4);
  CHECK_FLOAT_EQ(b2.d.b, 5);
  CHECK(b2.d.c == 6);

  CHECK(b2.e.ii == 3);
  CHECK_DOUBLE_EQ(b2.e.dd, 1);
  CHECK_FLOAT_EQ(b2.e.ff, 8);

  CHECK_DOUBLE_EQ(result.d.a, 15);
  CHECK_FLOAT_EQ(result.d.b, 10);
  CHECK(result.d.c == 13);
  CHECK(result.e.ii == 10);
  CHECK_DOUBLE_EQ(result.e.dd, 12);
  CHECK_FLOAT_EQ(result.e.ff, 13);

  return result;
}

static void
cls_struct_combined_gn(ffi_cif* cif __UNUSED__, void* resp, void** args,
		       void* userdata __UNUSED__)
{
  struct cls_struct_16byte1 b0;
  struct cls_struct_16byte2 b1;
  struct cls_struct_combined b2;

  b0 = *(struct cls_struct_16byte1*)(args[0]);
  b1 = *(struct cls_struct_16byte2*)(args[1]);
  b2 = *(struct cls_struct_combined*)(args[2]);


  *(cls_struct_combined*)resp = cls_struct_combined_fn(b0, b1, b2);
}

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  void* args_dbl[5];
  ffi_type* cls_struct_fields[5];
  ffi_type* cls_struct_fields1[5];
  ffi_type* cls_struct_fields2[5];
  ffi_type cls_struct_type, cls_struct_type1, cls_struct_type2;
  ffi_type* dbl_arg_types[5];

  struct cls_struct_16byte1 e_dbl = { 9.0, 2.0, 6};
  struct cls_struct_16byte2 f_dbl = { 1, 2.0, 3.0};
  struct cls_struct_combined g_dbl = {{4.0, 5.0, 6},
				      {3, 1.0, 8.0}};
  struct cls_struct_combined res_dbl;

  cls_struct_type.size = 0;
  cls_struct_type.alignment = 0;
  cls_struct_type.type = FFI_TYPE_STRUCT;
  cls_struct_type.elements = cls_struct_fields;

  cls_struct_type1.size = 0;
  cls_struct_type1.alignment = 0;
  cls_struct_type1.type = FFI_TYPE_STRUCT;
  cls_struct_type1.elements = cls_struct_fields1;

  cls_struct_type2.size = 0;
  cls_struct_type2.alignment = 0;
  cls_struct_type2.type = FFI_TYPE_STRUCT;
  cls_struct_type2.elements = cls_struct_fields2;

  cls_struct_fields[0] = &ffi_type_double;
  cls_struct_fields[1] = &ffi_type_float;
  cls_struct_fields[2] = &ffi_type_sint;
  cls_struct_fields[3] = NULL;

  cls_struct_fields1[0] = &ffi_type_sint;
  cls_struct_fields1[1] = &ffi_type_double;
  cls_struct_fields1[2] = &ffi_type_float;
  cls_struct_fields1[3] = NULL;

  cls_struct_fields2[0] = &cls_struct_type;
  cls_struct_fields2[1] = &cls_struct_type1;
  cls_struct_fields2[2] = NULL;


  dbl_arg_types[0] = &cls_struct_type;
  dbl_arg_types[1] = &cls_struct_type1;
  dbl_arg_types[2] = &cls_struct_type2;
  dbl_arg_types[3] = NULL;

  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 3, &cls_struct_type2,
		     dbl_arg_types) == FFI_OK);

  args_dbl[0] = &e_dbl;
  args_dbl[1] = &f_dbl;
  args_dbl[2] = &g_dbl;
  args_dbl[3] = NULL;

  ffi_call(&cif, FFI_FN(cls_struct_combined_fn), &res_dbl, args_dbl);
  /* { dg-output "9 2 6 1 2 3 4 5 6 3 1 8: 15 10 13 10 12 13" } */
  CHECK_DOUBLE_EQ( res_dbl.d.a, (e_dbl.a + f_dbl.dd + g_dbl.d.a));
  CHECK_FLOAT_EQ( res_dbl.d.b,  (e_dbl.b + f_dbl.ff + g_dbl.d.b));
  CHECK( res_dbl.d.c == (e_dbl.c + f_dbl.ii + g_dbl.d.c));
  CHECK( res_dbl.e.ii == (e_dbl.c + f_dbl.ii + g_dbl.e.ii));
  CHECK_DOUBLE_EQ( res_dbl.e.dd, (e_dbl.a + f_dbl.dd + g_dbl.e.dd));
  CHECK_FLOAT_EQ( res_dbl.e.ff, (e_dbl.b + f_dbl.ff + g_dbl.e.ff));

  CHECK(ffi_prep_closure_loc(pcl, &cif, cls_struct_combined_gn, NULL, code) == FFI_OK);

  res_dbl = ((cls_struct_combined(*)(cls_struct_16byte1,
				     cls_struct_16byte2,
				     cls_struct_combined))
	     (code))(e_dbl, f_dbl, g_dbl);
  /* { dg-output "\n9 2 6 1 2 3 4 5 6 3 1 8: 15 10 13 10 12 13" } */
  CHECK_DOUBLE_EQ( res_dbl.d.a, (e_dbl.a + f_dbl.dd + g_dbl.d.a));
  CHECK_FLOAT_EQ( res_dbl.d.b,  (e_dbl.b + f_dbl.ff + g_dbl.d.b));
  CHECK( res_dbl.d.c == (e_dbl.c + f_dbl.ii + g_dbl.d.c));
  CHECK( res_dbl.e.ii == (e_dbl.c + f_dbl.ii + g_dbl.e.ii));
  CHECK_DOUBLE_EQ( res_dbl.e.dd, (e_dbl.a + f_dbl.dd + g_dbl.e.dd));
  CHECK_FLOAT_EQ( res_dbl.e.ff, (e_dbl.b + f_dbl.ff + g_dbl.e.ff));
  exit(0);
}
