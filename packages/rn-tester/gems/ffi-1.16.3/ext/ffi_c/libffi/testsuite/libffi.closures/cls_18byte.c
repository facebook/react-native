/* Area:	ffi_call, closure_call
   Purpose:	Check structure passing with different structure size.
		Depending on the ABI. Double alignment check on darwin.
   Limitations:	none.
   PR:		none.
   Originator:	<andreast@gcc.gnu.org> 20030915	 */

/* { dg-do run } */
#include "ffitest.h"

typedef struct cls_struct_18byte {
  double a;
  unsigned char b;
  unsigned char c;
  double d;
} cls_struct_18byte;

cls_struct_18byte cls_struct_18byte_fn(struct cls_struct_18byte a1,
			    struct cls_struct_18byte a2)
{
  struct cls_struct_18byte result;

  result.a = a1.a + a2.a;
  result.b = a1.b + a2.b;
  result.c = a1.c + a2.c;
  result.d = a1.d + a2.d;


  printf("%g %d %d %g %g %d %d %g: %g %d %d %g\n", a1.a, a1.b, a1.c, a1.d,
	 a2.a, a2.b, a2.c, a2.d,
	 result.a, result.b, result.c, result.d);

  CHECK(a1.a == 1);
  CHECK(a1.b == 127);
  CHECK(a1.c == 126);
  CHECK(a1.d == 3);

  CHECK(a2.a == 4);
  CHECK(a2.b == 125);
  CHECK(a2.c == 124);
  CHECK(a2.d == 5);

  CHECK(result.a == 5);
  CHECK(result.b == 252);
  CHECK(result.c == 250);
  CHECK(result.d == 8);

  return result;
}

static void
cls_struct_18byte_gn(ffi_cif* cif __UNUSED__, void* resp, void** args,
		     void* userdata __UNUSED__)
{
  struct cls_struct_18byte a1, a2;

  a1 = *(struct cls_struct_18byte*)(args[0]);
  a2 = *(struct cls_struct_18byte*)(args[1]);

  *(cls_struct_18byte*)resp = cls_struct_18byte_fn(a1, a2);
}

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  void* args_dbl[3];
  ffi_type* cls_struct_fields[5];
  ffi_type cls_struct_type;
  ffi_type* dbl_arg_types[3];

  struct cls_struct_18byte g_dbl = { 1.0, 127, 126, 3.0 };
  struct cls_struct_18byte f_dbl = { 4.0, 125, 124, 5.0 };
  struct cls_struct_18byte res_dbl;

  cls_struct_type.size = 0;
  cls_struct_type.alignment = 0;
  cls_struct_type.type = FFI_TYPE_STRUCT;
  cls_struct_type.elements = cls_struct_fields;

  cls_struct_fields[0] = &ffi_type_double;
  cls_struct_fields[1] = &ffi_type_uchar;
  cls_struct_fields[2] = &ffi_type_uchar;
  cls_struct_fields[3] = &ffi_type_double;
  cls_struct_fields[4] = NULL;

  dbl_arg_types[0] = &cls_struct_type;
  dbl_arg_types[1] = &cls_struct_type;
  dbl_arg_types[2] = NULL;

  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 2, &cls_struct_type,
		     dbl_arg_types) == FFI_OK);

  args_dbl[0] = &g_dbl;
  args_dbl[1] = &f_dbl;
  args_dbl[2] = NULL;

  ffi_call(&cif, FFI_FN(cls_struct_18byte_fn), &res_dbl, args_dbl);
  /* { dg-output "1 127 126 3 4 125 124 5: 5 252 250 8" } */
  printf("res: %g %d %d %g\n", res_dbl.a, res_dbl.b, res_dbl.c, res_dbl.d);
  /* { dg-output "\nres: 5 252 250 8" } */
  CHECK(res_dbl.a == 5);
  CHECK(res_dbl.b == 252);
  CHECK(res_dbl.c == 250);
  CHECK(res_dbl.d == 8);

  CHECK(ffi_prep_closure_loc(pcl, &cif, cls_struct_18byte_gn, NULL, code) == FFI_OK);

  res_dbl = ((cls_struct_18byte(*)(cls_struct_18byte, cls_struct_18byte))(code))(g_dbl, f_dbl);
  /* { dg-output "\n1 127 126 3 4 125 124 5: 5 252 250 8" } */
  printf("res: %g %d %d %g\n", res_dbl.a, res_dbl.b, res_dbl.c, res_dbl.d);
  /* { dg-output "\nres: 5 252 250 8" } */
  CHECK(res_dbl.a == 5);
  CHECK(res_dbl.b == 252);
  CHECK(res_dbl.c == 250);
  CHECK(res_dbl.d == 8);

  exit(0);
}
