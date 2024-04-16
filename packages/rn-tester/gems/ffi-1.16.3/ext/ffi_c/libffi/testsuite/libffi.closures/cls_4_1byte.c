/* Area:	ffi_call, closure_call
   Purpose:	Check structure passing with different structure size.
		Especially with small structures which may fit in one
		register. Depending on the ABI.
   Limitations:	none.
   PR:		none.
   Originator:	<andreast@gcc.gnu.org> 20030902	 */

/* { dg-do run } */
#include "ffitest.h"

typedef struct cls_struct_4_1byte {
  unsigned char a;
  unsigned char b;
  unsigned char c;
  unsigned char d;
} cls_struct_4_1byte;

cls_struct_4_1byte cls_struct_4_1byte_fn(struct cls_struct_4_1byte a1,
			    struct cls_struct_4_1byte a2)
{
  struct cls_struct_4_1byte result;

  result.a = a1.a + a2.a;
  result.b = a1.b + a2.b;
  result.c = a1.c + a2.c;
  result.d = a1.d + a2.d;

  printf("%d %d %d %d %d %d %d %d: %d %d %d %d\n", a1.a, a1.b, a1.c, a1.d,
	 a2.a, a2.b, a2.c, a2.d,
	 result.a, result.b, result.c, result.d);

  CHECK(a1.a == 12);
  CHECK(a1.b == 13);
  CHECK(a1.c == 14);
  CHECK(a1.d == 15);

  CHECK(a2.a == 178);
  CHECK(a2.b == 179);
  CHECK(a2.c == 180);
  CHECK(a2.d == 181);

  CHECK(result.a == 190);
  CHECK(result.b == 192);
  CHECK(result.c == 194);
  CHECK(result.d == 196);
  return  result;
}

static void
cls_struct_4_1byte_gn(ffi_cif* cif __UNUSED__, void* resp, void** args,
		      void* userdata __UNUSED__)
{

  struct cls_struct_4_1byte a1, a2;

  a1 = *(struct cls_struct_4_1byte*)(args[0]);
  a2 = *(struct cls_struct_4_1byte*)(args[1]);

  *(cls_struct_4_1byte*)resp = cls_struct_4_1byte_fn(a1, a2);
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

  struct cls_struct_4_1byte g_dbl = { 12, 13, 14, 15 };
  struct cls_struct_4_1byte f_dbl = { 178, 179, 180, 181 };
  struct cls_struct_4_1byte res_dbl;

  cls_struct_type.size = 0;
  cls_struct_type.alignment = 0;
  cls_struct_type.type = FFI_TYPE_STRUCT;
  cls_struct_type.elements = cls_struct_fields;

  cls_struct_fields[0] = &ffi_type_uchar;
  cls_struct_fields[1] = &ffi_type_uchar;
  cls_struct_fields[2] = &ffi_type_uchar;
  cls_struct_fields[3] = &ffi_type_uchar;
  cls_struct_fields[4] = NULL;

  dbl_arg_types[0] = &cls_struct_type;
  dbl_arg_types[1] = &cls_struct_type;
  dbl_arg_types[2] = NULL;

  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 2, &cls_struct_type,
		     dbl_arg_types) == FFI_OK);

  args_dbl[0] = &g_dbl;
  args_dbl[1] = &f_dbl;
  args_dbl[2] = NULL;

  ffi_call(&cif, FFI_FN(cls_struct_4_1byte_fn), &res_dbl, args_dbl);
  /* { dg-output "12 13 14 15 178 179 180 181: 190 192 194 196" } */
  printf("res: %d %d %d %d\n", res_dbl.a, res_dbl.b, res_dbl.c, res_dbl.d);
  /* { dg-output "\nres: 190 192 194 196" } */
  CHECK(res_dbl.a == 190);
  CHECK(res_dbl.b == 192);
  CHECK(res_dbl.c == 194);
  CHECK(res_dbl.d == 196);

  CHECK(ffi_prep_closure_loc(pcl, &cif, cls_struct_4_1byte_gn, NULL, code) == FFI_OK);

  res_dbl = ((cls_struct_4_1byte(*)(cls_struct_4_1byte, cls_struct_4_1byte))(code))(g_dbl, f_dbl);
  /* { dg-output "\n12 13 14 15 178 179 180 181: 190 192 194 196" } */
  printf("res: %d %d %d %d\n", res_dbl.a, res_dbl.b, res_dbl.c, res_dbl.d);
  /* { dg-output "\nres: 190 192 194 196" } */
  CHECK(res_dbl.a == 190);
  CHECK(res_dbl.b == 192);
  CHECK(res_dbl.c == 194);
  CHECK(res_dbl.d == 196);

  exit(0);
}
