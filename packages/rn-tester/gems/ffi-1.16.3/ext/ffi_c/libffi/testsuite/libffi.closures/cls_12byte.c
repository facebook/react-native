/* Area:	ffi_call, closure_call
   Purpose:	Check structure passing with different structure size.
   Limitations:	none.
   PR:		none.
   Originator:	<andreast@gcc.gnu.org> 20030828	 */

/* { dg-do run } */
#include "ffitest.h"

typedef struct cls_struct_12byte {
  int a;
  int b;
  int c;
} cls_struct_12byte;

cls_struct_12byte cls_struct_12byte_fn(struct cls_struct_12byte b1,
			    struct cls_struct_12byte b2)
{
  struct cls_struct_12byte result;

  result.a = b1.a + b2.a;
  result.b = b1.b + b2.b;
  result.c = b1.c + b2.c;

  printf("%d %d %d %d %d %d: %d %d %d\n", b1.a, b1.b, b1.c, b2.a, b2.b, b2.c,
	 result.a, result.b, result.c);

  CHECK(b1.a == 7);
  CHECK(b1.b == 4);
  CHECK(b1.c == 9);

  CHECK(b2.a == 1);
  CHECK(b2.b == 5);
  CHECK(b2.c == 3);

  CHECK(result.a == 8);
  CHECK(result.b == 9);
  CHECK(result.c == 12);
  return result;
}

static void cls_struct_12byte_gn(ffi_cif* cif __UNUSED__, void* resp,
				 void** args , void* userdata __UNUSED__)
{
  struct cls_struct_12byte b1, b2;

  b1 = *(struct cls_struct_12byte*)(args[0]);
  b2 = *(struct cls_struct_12byte*)(args[1]);

  *(cls_struct_12byte*)resp = cls_struct_12byte_fn(b1, b2);
}

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  void* args_dbl[5];
  ffi_type* cls_struct_fields[4];
  ffi_type cls_struct_type;
  ffi_type* dbl_arg_types[5];

  struct cls_struct_12byte h_dbl = { 7, 4, 9 };
  struct cls_struct_12byte j_dbl = { 1, 5, 3 };
  struct cls_struct_12byte res_dbl;

  cls_struct_type.size = 0;
  cls_struct_type.alignment = 0;
  cls_struct_type.type = FFI_TYPE_STRUCT;
  cls_struct_type.elements = cls_struct_fields;

  cls_struct_fields[0] = &ffi_type_sint;
  cls_struct_fields[1] = &ffi_type_sint;
  cls_struct_fields[2] = &ffi_type_sint;
  cls_struct_fields[3] = NULL;

  dbl_arg_types[0] = &cls_struct_type;
  dbl_arg_types[1] = &cls_struct_type;
  dbl_arg_types[2] = NULL;

  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 2, &cls_struct_type,
		     dbl_arg_types) == FFI_OK);

  args_dbl[0] = &h_dbl;
  args_dbl[1] = &j_dbl;
  args_dbl[2] = NULL;

  ffi_call(&cif, FFI_FN(cls_struct_12byte_fn), &res_dbl, args_dbl);
  /* { dg-output "7 4 9 1 5 3: 8 9 12" } */
  printf("res: %d %d %d\n", res_dbl.a, res_dbl.b, res_dbl.c);
  /* { dg-output "\nres: 8 9 12" } */
  CHECK(res_dbl.a == 8);
  CHECK(res_dbl.b == 9);
  CHECK(res_dbl.c == 12);

  CHECK(ffi_prep_closure_loc(pcl, &cif, cls_struct_12byte_gn, NULL, code) == FFI_OK);

  res_dbl.a = 0;
  res_dbl.b = 0;
  res_dbl.c = 0;

  res_dbl = ((cls_struct_12byte(*)(cls_struct_12byte, cls_struct_12byte))(code))(h_dbl, j_dbl);
  /* { dg-output "\n7 4 9 1 5 3: 8 9 12" } */

  printf("res: %d %d %d\n", res_dbl.a, res_dbl.b, res_dbl.c);
  /* { dg-output "\nres: 8 9 12" } */
  CHECK(res_dbl.a == 8);
  CHECK(res_dbl.b == 9);
  CHECK(res_dbl.c == 12);

  exit(0);
}
