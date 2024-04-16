/* Area:       ffi_call, closure_call
   Purpose:    Check structure passing.
   Limitations:        none.
   PR:         none.
   Originator: <jincheng@ca.ibm.com> and <jakub@redhat.com> 20210609    */

/* { dg-do run } */
#include "ffitest.h"

typedef struct A {
  float a, b;
} A;

typedef struct B {
  float x;
  struct A y;
} B;

B B_fn(float b0, struct B b1)
{
  struct B result;

  result.x = b0 + b1.x;
  result.y.a = b0 + b1.y.a;
  result.y.b = b0 + b1.y.b;

  printf("%g %g %g %g: %g %g %g\n", b0, b1.x, b1.y.a, b1.y.b,
        result.x, result.y.a, result.y.b);

  CHECK_FLOAT_EQ(b0, 12.125);
  CHECK_FLOAT_EQ(b1.x, 24.75);
  CHECK_FLOAT_EQ(b1.y.a, 31.625);
  CHECK_FLOAT_EQ(b1.y.b, 32.25);
  CHECK_FLOAT_EQ(result.x, 36.875);
  CHECK_FLOAT_EQ(result.y.a, 43.75);
  CHECK_FLOAT_EQ(result.y.b, 44.375);

  return result;
}

static void
B_gn(ffi_cif* cif __UNUSED__, void* resp, void** args,
     void* userdata __UNUSED__)
{
  float b0;
  struct B b1;

  b0 = *(float*)(args[0]);
  b1 = *(struct B*)(args[1]);

  *(B*)resp = B_fn(b0, b1);
}

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  void* args_dbl[3];
  ffi_type* cls_struct_fields[3];
  ffi_type* cls_struct_fields1[3];
  ffi_type cls_struct_type, cls_struct_type1;
  ffi_type* dbl_arg_types[3];

  float e_dbl = 12.125f;
  struct B f_dbl = { 24.75f, { 31.625f, 32.25f } };

  struct B res_dbl;

  cls_struct_type.size = 0;
  cls_struct_type.alignment = 0;
  cls_struct_type.type = FFI_TYPE_STRUCT;
  cls_struct_type.elements = cls_struct_fields;

  cls_struct_type1.size = 0;
  cls_struct_type1.alignment = 0;
  cls_struct_type1.type = FFI_TYPE_STRUCT;
  cls_struct_type1.elements = cls_struct_fields1;

  cls_struct_fields[0] = &ffi_type_float;
  cls_struct_fields[1] = &ffi_type_float;
  cls_struct_fields[2] = NULL;

  cls_struct_fields1[0] = &ffi_type_float;
  cls_struct_fields1[1] = &cls_struct_type;
  cls_struct_fields1[2] = NULL;


  dbl_arg_types[0] = &ffi_type_float;
  dbl_arg_types[1] = &cls_struct_type1;
  dbl_arg_types[2] = NULL;

  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 2, &cls_struct_type1,
                    dbl_arg_types) == FFI_OK);

  args_dbl[0] = &e_dbl;
  args_dbl[1] = &f_dbl;
  args_dbl[2] = NULL;

  ffi_call(&cif, FFI_FN(B_fn), &res_dbl, args_dbl);
  /* { dg-output "12.125 24.75 31.625 32.25: 36.875 43.75 44.375" } */
  CHECK_FLOAT_EQ( res_dbl.x, (e_dbl + f_dbl.x));
  CHECK_FLOAT_EQ( res_dbl.y.a, (e_dbl + f_dbl.y.a));
  CHECK_FLOAT_EQ( res_dbl.y.b, (e_dbl + f_dbl.y.b));

  CHECK(ffi_prep_closure_loc(pcl, &cif, B_gn, NULL, code) == FFI_OK);

  res_dbl = ((B(*)(float, B))(code))(e_dbl, f_dbl);
  /* { dg-output "\n12.125 24.75 31.625 32.25: 36.875 43.75 44.375" } */
  CHECK_FLOAT_EQ( res_dbl.x, (e_dbl + f_dbl.x));
  CHECK_FLOAT_EQ( res_dbl.y.a, (e_dbl + f_dbl.y.a));
  CHECK_FLOAT_EQ( res_dbl.y.b, (e_dbl + f_dbl.y.b));

  exit(0);
}
