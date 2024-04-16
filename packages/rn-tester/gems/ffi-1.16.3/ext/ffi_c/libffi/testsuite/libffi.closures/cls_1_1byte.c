/* Area:	ffi_call, closure_call
   Purpose:	Check structure passing with different structure size.
		Especially with small structures which may fit in one
		register. Depending on the ABI.
   Limitations:	none.
   PR:		none.
   Originator:	<andreast@gcc.gnu.org> 20030902	 */



/* { dg-do run } */
#include "ffitest.h"

typedef struct cls_struct_1_1byte {
  unsigned char a;
} cls_struct_1_1byte;

cls_struct_1_1byte cls_struct_1_1byte_fn(struct cls_struct_1_1byte a1,
			    struct cls_struct_1_1byte a2)
{
  struct cls_struct_1_1byte result;

  result.a = a1.a + a2.a;

  printf("%d %d: %d\n", a1.a, a2.a, result.a);
  CHECK(a1.a == 12);
  CHECK(a2.a == 178);
  CHECK(result.a == 190);

  return  result;
}

static void
cls_struct_1_1byte_gn(ffi_cif* cif __UNUSED__, void* resp, void** args,
		      void* userdata __UNUSED__)
{

  struct cls_struct_1_1byte a1, a2;

  a1 = *(struct cls_struct_1_1byte*)(args[0]);
  a2 = *(struct cls_struct_1_1byte*)(args[1]);

  *(cls_struct_1_1byte*)resp = cls_struct_1_1byte_fn(a1, a2);
}

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  void* args_dbl[5];
  ffi_type* cls_struct_fields[2];
  ffi_type cls_struct_type;
  ffi_type* dbl_arg_types[5];

  struct cls_struct_1_1byte g_dbl = { 12 };
  struct cls_struct_1_1byte f_dbl = { 178 };
  struct cls_struct_1_1byte res_dbl;

  cls_struct_type.size = 0;
  cls_struct_type.alignment = 0;
  cls_struct_type.type = FFI_TYPE_STRUCT;
  cls_struct_type.elements = cls_struct_fields;

  cls_struct_fields[0] = &ffi_type_uchar;
  cls_struct_fields[1] = NULL;

  dbl_arg_types[0] = &cls_struct_type;
  dbl_arg_types[1] = &cls_struct_type;
  dbl_arg_types[2] = NULL;

  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 2, &cls_struct_type,
		     dbl_arg_types) == FFI_OK);

  args_dbl[0] = &g_dbl;
  args_dbl[1] = &f_dbl;
  args_dbl[2] = NULL;

  ffi_call(&cif, FFI_FN(cls_struct_1_1byte_fn), &res_dbl, args_dbl);
  /* { dg-output "12 178: 190" } */
  printf("res: %d\n", res_dbl.a);
  /* { dg-output "\nres: 190" } */

  CHECK(ffi_prep_closure_loc(pcl, &cif, cls_struct_1_1byte_gn, NULL, code) == FFI_OK);

  res_dbl = ((cls_struct_1_1byte(*)(cls_struct_1_1byte, cls_struct_1_1byte))(code))(g_dbl, f_dbl);
  /* { dg-output "\n12 178: 190" } */
  printf("res: %d\n", res_dbl.a);
  /* { dg-output "\nres: 190" } */
  CHECK(res_dbl.a == 190);

  exit(0);
}
