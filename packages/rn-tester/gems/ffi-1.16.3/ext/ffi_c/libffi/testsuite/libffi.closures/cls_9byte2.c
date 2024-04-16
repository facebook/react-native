/* Area:	ffi_call, closure_call
   Purpose:	Check structure passing with different structure size.
		Depending on the ABI. Darwin/AIX do double-word
		alignment of the struct if the first element is a double.
		Check that it does here.
   Limitations:	none.
   PR:		none.
   Originator:	<andreast@gcc.gnu.org> 20030914	 */

/* { dg-do run } */
#include "ffitest.h"

typedef struct cls_struct_9byte {
  double a;
  int b;
} cls_struct_9byte;

static cls_struct_9byte cls_struct_9byte_fn(struct cls_struct_9byte b1,
			    struct cls_struct_9byte b2)
{
  struct cls_struct_9byte result;

  result.a = b1.a + b2.a;
  result.b = b1.b + b2.b;

  printf("%g %d %g %d: %g %d\n", b1.a, b1.b,  b2.a, b2.b,
	 result.a, result.b);

  CHECK(b1.a == 7);
  CHECK(b1.b == 8);

  CHECK(b2.a == 1);
  CHECK(b2.b == 9);

  CHECK(result.a == 8);
  CHECK(result.b == 17);

  return result;
}

static void cls_struct_9byte_gn(ffi_cif* cif __UNUSED__, void* resp,
				void** args, void* userdata __UNUSED__)
{
  struct cls_struct_9byte b1, b2;

  b1 = *(struct cls_struct_9byte*)(args[0]);
  b2 = *(struct cls_struct_9byte*)(args[1]);

  *(cls_struct_9byte*)resp = cls_struct_9byte_fn(b1, b2);
}

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  void* args_dbl[3];
  ffi_type* cls_struct_fields[3];
  ffi_type cls_struct_type;
  ffi_type* dbl_arg_types[3];

  struct cls_struct_9byte h_dbl = { 7.0, 8};
  struct cls_struct_9byte j_dbl = { 1.0, 9};
  struct cls_struct_9byte res_dbl;

  cls_struct_type.size = 0;
  cls_struct_type.alignment = 0;
  cls_struct_type.type = FFI_TYPE_STRUCT;
  cls_struct_type.elements = cls_struct_fields;

  cls_struct_fields[0] = &ffi_type_double;
  cls_struct_fields[1] = &ffi_type_sint;
  cls_struct_fields[2] = NULL;

  dbl_arg_types[0] = &cls_struct_type;
  dbl_arg_types[1] = &cls_struct_type;
  dbl_arg_types[2] = NULL;

  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 2, &cls_struct_type,
		     dbl_arg_types) == FFI_OK);

  args_dbl[0] = &h_dbl;
  args_dbl[1] = &j_dbl;
  args_dbl[2] = NULL;

  ffi_call(&cif, FFI_FN(cls_struct_9byte_fn), &res_dbl, args_dbl);
  /* { dg-output "7 8 1 9: 8 17" } */
  printf("res: %g %d\n", res_dbl.a, res_dbl.b);
  /* { dg-output "\nres: 8 17" } */
  CHECK(res_dbl.a == 8);
  CHECK(res_dbl.b == 17);

  CHECK(ffi_prep_closure_loc(pcl, &cif, cls_struct_9byte_gn, NULL, code) == FFI_OK);

  res_dbl = ((cls_struct_9byte(*)(cls_struct_9byte, cls_struct_9byte))(code))(h_dbl, j_dbl);
  /* { dg-output "\n7 8 1 9: 8 17" } */
  printf("res: %g %d\n", res_dbl.a, res_dbl.b);
  /* { dg-output "\nres: 8 17" } */
  CHECK(res_dbl.a == 8);
  CHECK(res_dbl.b == 17);

  exit(0);
}
