/* Area:	ffi_call, closure_call
   Purpose:	Check structure passing with different structure size.
		Contains structs as parameter of the struct itself.
		Sample taken from Alan Modras patch to src/prep_cif.c.
   Limitations:	none.
   PR:		PR 25630.
   Originator:	<andreast@gcc.gnu.org> 20051010	 */

/* { dg-do run } */
#include "ffitest.h"

typedef struct A {
  double a;
  unsigned char b;
} A;

typedef struct B {
  struct A x;
  unsigned char y;
} B;

typedef struct C {
  long d;
  unsigned char e;
} C;

static B B_fn(struct A b2, struct B b3, struct C b4)
{
  struct B result;

  result.x.a = b2.a + b3.x.a + b4.d;
  result.x.b = b2.b + b3.x.b + b3.y + b4.e;
  result.y = b2.b + b3.x.b + b4.e;

  printf("%d %d %d %d %d %d %d: %d %d %d\n", (int)b2.a, b2.b,
	 (int)b3.x.a, b3.x.b, b3.y, (int)b4.d, b4.e,
	 (int)result.x.a, result.x.b, result.y);

  CHECK((int)b2.a == 1);
  CHECK(b2.b == 7);
  CHECK((int)b3.x.a == 12);
  CHECK(b3.x.b == 127);
  CHECK(b3.y == 99);
  CHECK((int)b4.d == 2);
  CHECK(b4.e == 9);
  CHECK((int)result.x.a == 15);
  CHECK(result.x.b == 242);
  CHECK(result.y == 143);

  return result;
}

static void
B_gn(ffi_cif* cif __UNUSED__, void* resp, void** args,
     void* userdata __UNUSED__)
{
  struct A b0;
  struct B b1;
  struct C b2;

  b0 = *(struct A*)(args[0]);
  b1 = *(struct B*)(args[1]);
  b2 = *(struct C*)(args[2]);

  *(B*)resp = B_fn(b0, b1, b2);
}

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  void* args_dbl[4];
  ffi_type* cls_struct_fields[3];
  ffi_type* cls_struct_fields1[3];
  ffi_type* cls_struct_fields2[3];
  ffi_type cls_struct_type, cls_struct_type1, cls_struct_type2;
  ffi_type* dbl_arg_types[4];

  struct A e_dbl = { 1.0, 7};
  struct B f_dbl = {{12.0 , 127}, 99};
  struct C g_dbl = { 2, 9};

  struct B res_dbl;

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
  cls_struct_fields[1] = &ffi_type_uchar;
  cls_struct_fields[2] = NULL;

  cls_struct_fields1[0] = &cls_struct_type;
  cls_struct_fields1[1] = &ffi_type_uchar;
  cls_struct_fields1[2] = NULL;

  cls_struct_fields2[0] = &ffi_type_slong;
  cls_struct_fields2[1] = &ffi_type_uchar;
  cls_struct_fields2[2] = NULL;


  dbl_arg_types[0] = &cls_struct_type;
  dbl_arg_types[1] = &cls_struct_type1;
  dbl_arg_types[2] = &cls_struct_type2;
  dbl_arg_types[3] = NULL;

  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 3, &cls_struct_type1,
		     dbl_arg_types) == FFI_OK);

  args_dbl[0] = &e_dbl;
  args_dbl[1] = &f_dbl;
  args_dbl[2] = &g_dbl;
  args_dbl[3] = NULL;

  ffi_call(&cif, FFI_FN(B_fn), &res_dbl, args_dbl);
  /* { dg-output "1 7 12 127 99 2 9: 15 242 143" } */
  CHECK( res_dbl.x.a == (e_dbl.a + f_dbl.x.a + g_dbl.d));
  CHECK( res_dbl.x.b == (e_dbl.b + f_dbl.x.b + f_dbl.y + g_dbl.e));
  CHECK( res_dbl.y == (e_dbl.b + f_dbl.x.b + g_dbl.e));

  CHECK(ffi_prep_closure_loc(pcl, &cif, B_gn, NULL, code) == FFI_OK);

  res_dbl = ((B(*)(A, B, C))(code))(e_dbl, f_dbl, g_dbl);
  /* { dg-output "\n1 7 12 127 99 2 9: 15 242 143" } */
  CHECK( res_dbl.x.a == (e_dbl.a + f_dbl.x.a + g_dbl.d));
  CHECK( res_dbl.x.b == (e_dbl.b + f_dbl.x.b + f_dbl.y + g_dbl.e));
  CHECK( res_dbl.y == (e_dbl.b + f_dbl.x.b + g_dbl.e));

  exit(0);
}
