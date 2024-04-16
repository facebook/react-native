/* Area:	ffi_call, closure_call
   Purpose:	Check structure passing with different structure size.
		Depending on the ABI. Check overlapping.
   Limitations:	none.
   PR:		none.
   Originator:	<andreast@gcc.gnu.org> 20050708	 */

/* { dg-do run } */
#include "ffitest.h"

typedef struct cls_struct_7byte {
  unsigned char a;
  unsigned char b;
  unsigned char c;
  unsigned char d;
  unsigned char e;
  unsigned char f;
  unsigned char g;
} cls_struct_7byte;

static cls_struct_7byte cls_struct_7byte_fn(struct cls_struct_7byte a1,
			    struct cls_struct_7byte a2)
{
  struct cls_struct_7byte result;

  result.a = a1.a + a2.a;
  result.b = a1.b + a2.b;
  result.c = a1.c + a2.c;
  result.d = a1.d + a2.d;
  result.e = a1.e + a2.e;
  result.f = a1.f + a2.f;
  result.g = a1.g + a2.g;

  printf("%d %d %d %d %d %d %d %d %d %d %d %d %d %d: %d %d %d %d %d %d %d\n",
	 a1.a, a1.b, a1.c, a1.d, a1.e, a1.f, a1.g,
	 a2.a, a2.b, a2.c, a2.d, a2.e, a2.f, a2.g,
	 result.a, result.b, result.c, result.d, result.e, result.f, result.g);

  CHECK(a1.a == 127);
  CHECK(a1.b == 120);
  CHECK(a1.c == 1);
  CHECK(a1.d == 3);
  CHECK(a1.e == 4);
  CHECK(a1.f == 5);
  CHECK(a1.g == 6);

  CHECK(a2.a == 12);
  CHECK(a2.b == 128);
  CHECK(a2.c == 9);
  CHECK(a2.d == 3);
  CHECK(a2.e == 4);
  CHECK(a2.f == 5);
  CHECK(a2.g == 6);

  CHECK(result.a == 139);
  CHECK(result.b == 248);
  CHECK(result.c == 10);
  CHECK(result.d == 6);
  CHECK(result.e == 8);
  CHECK(result.f == 10);
  CHECK(result.g == 12);

  return  result;
}

static void
cls_struct_7byte_gn(ffi_cif* cif __UNUSED__, void* resp, void** args,
		    void* userdata __UNUSED__)
{

  struct cls_struct_7byte a1, a2;

  a1 = *(struct cls_struct_7byte*)(args[0]);
  a2 = *(struct cls_struct_7byte*)(args[1]);

  *(cls_struct_7byte*)resp = cls_struct_7byte_fn(a1, a2);
}

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  void* args_dbl[5];
  ffi_type* cls_struct_fields[8];
  ffi_type cls_struct_type;
  ffi_type* dbl_arg_types[5];

  struct cls_struct_7byte g_dbl = { 127, 120, 1, 3, 4, 5, 6 };
  struct cls_struct_7byte f_dbl = { 12, 128, 9, 3, 4, 5, 6 };
  struct cls_struct_7byte res_dbl = { 0, 0, 0, 0, 0, 0, 0 };

  cls_struct_type.size = 0;
  cls_struct_type.alignment = 0;
  cls_struct_type.type = FFI_TYPE_STRUCT;
  cls_struct_type.elements = cls_struct_fields;

  cls_struct_fields[0] = &ffi_type_uchar;
  cls_struct_fields[1] = &ffi_type_uchar;
  cls_struct_fields[2] = &ffi_type_uchar;
  cls_struct_fields[3] = &ffi_type_uchar;
  cls_struct_fields[4] = &ffi_type_uchar;
  cls_struct_fields[5] = &ffi_type_uchar;
  cls_struct_fields[6] = &ffi_type_uchar;
  cls_struct_fields[7] = NULL;

  dbl_arg_types[0] = &cls_struct_type;
  dbl_arg_types[1] = &cls_struct_type;
  dbl_arg_types[2] = NULL;

  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 2, &cls_struct_type,
		     dbl_arg_types) == FFI_OK);

  args_dbl[0] = &g_dbl;
  args_dbl[1] = &f_dbl;
  args_dbl[2] = NULL;

  ffi_call(&cif, FFI_FN(cls_struct_7byte_fn), &res_dbl, args_dbl);
  /* { dg-output "127 120 1 3 4 5 6 12 128 9 3 4 5 6: 139 248 10 6 8 10 12" } */
  printf("res: %d %d %d %d %d %d %d\n", res_dbl.a, res_dbl.b, res_dbl.c,
	 res_dbl.d, res_dbl.e, res_dbl.f, res_dbl.g);
  /* { dg-output "\nres: 139 248 10 6 8 10 12" } */
  CHECK(res_dbl.a == 139);
  CHECK(res_dbl.b == 248);
  CHECK(res_dbl.c == 10);
  CHECK(res_dbl.d == 6);
  CHECK(res_dbl.e == 8);
  CHECK(res_dbl.f == 10);
  CHECK(res_dbl.g == 12);

  res_dbl.a = 0;
  res_dbl.b = 0;
  res_dbl.c = 0;
  res_dbl.d = 0;
  res_dbl.e = 0;
  res_dbl.f = 0;
  res_dbl.g = 0;

  CHECK(ffi_prep_closure_loc(pcl, &cif, cls_struct_7byte_gn, NULL, code) == FFI_OK);

  res_dbl = ((cls_struct_7byte(*)(cls_struct_7byte, cls_struct_7byte))(code))(g_dbl, f_dbl);
  /* { dg-output "\n127 120 1 3 4 5 6 12 128 9 3 4 5 6: 139 248 10 6 8 10 12" } */
  printf("res: %d %d %d %d %d %d %d\n", res_dbl.a, res_dbl.b, res_dbl.c,
	 res_dbl.d, res_dbl.e, res_dbl.f, res_dbl.g);
  /* { dg-output "\nres: 139 248 10 6 8 10 12" } */
  CHECK(res_dbl.a == 139);
  CHECK(res_dbl.b == 248);
  CHECK(res_dbl.c == 10);
  CHECK(res_dbl.d == 6);
  CHECK(res_dbl.e == 8);
  CHECK(res_dbl.f == 10);
  CHECK(res_dbl.g == 12);

  exit(0);
}
