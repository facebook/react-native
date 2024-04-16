/* Area:	ffi_call, closure_call
   Purpose:	Check parameter passing with nested structs
		of a single type.  This tests the special cases
		for homogeneous floating-point aggregates in the
		AArch64 PCS.
   Limitations:	none.
   PR:		none.
   Originator:  ARM Ltd.  */

/* { dg-do run } */
#include "ffitest.h"

typedef struct A {
  float a_x;
  float a_y;
} A;

typedef struct B {
  float b_x;
  float b_y;
} B;

typedef struct C {
  A a;
  B b;
} C;

static C C_fn (int x, int y, int z, C source, int i, int j, int k)
{
  C result;
  result.a.a_x = source.a.a_x;
  result.a.a_y = source.a.a_y;
  result.b.b_x = source.b.b_x;
  result.b.b_y = source.b.b_y;

  printf ("%d, %d, %d, %d, %d, %d\n", x, y, z, i, j, k);

  CHECK(x == 1);
  CHECK(y == 1);
  CHECK(z == 1);
  CHECK(i == 1);
  CHECK(j == 1);
  CHECK(k == 1);

  printf ("%.1f, %.1f, %.1f, %.1f, "
	  "%.1f, %.1f, %.1f, %.1f\n",
	  source.a.a_x, source.a.a_y,
	  source.b.b_x, source.b.b_y,
	  result.a.a_x, result.a.a_y,
	  result.b.b_x, result.b.b_y);

    CHECK_FLOAT_EQ(source.a.a_x, 1.0);
    CHECK_FLOAT_EQ(source.a.a_y, 2.0);
    CHECK_FLOAT_EQ(source.b.b_x, 4.0);
    CHECK_FLOAT_EQ(source.b.b_y, 8.0);
    CHECK_FLOAT_EQ(result.a.a_x, 1.0);
    CHECK_FLOAT_EQ(result.a.a_y, 2.0);
    CHECK_FLOAT_EQ(result.b.b_x, 4.0);
    CHECK_FLOAT_EQ(result.b.b_y, 8.0);

  return result;
}

int main (void)
{
  ffi_cif cif;

  ffi_type* struct_fields_source_a[3];
  ffi_type* struct_fields_source_b[3];
  ffi_type* struct_fields_source_c[3];
  ffi_type* arg_types[8];

  ffi_type struct_type_a, struct_type_b, struct_type_c;

  struct A source_fld_a = {1.0, 2.0};
  struct B source_fld_b = {4.0, 8.0};
  int k = 1;

  struct C result;
  struct C source = {source_fld_a, source_fld_b};

  struct_type_a.size = 0;
  struct_type_a.alignment = 0;
  struct_type_a.type = FFI_TYPE_STRUCT;
  struct_type_a.elements = struct_fields_source_a;

  struct_type_b.size = 0;
  struct_type_b.alignment = 0;
  struct_type_b.type = FFI_TYPE_STRUCT;
  struct_type_b.elements = struct_fields_source_b;

  struct_type_c.size = 0;
  struct_type_c.alignment = 0;
  struct_type_c.type = FFI_TYPE_STRUCT;
  struct_type_c.elements = struct_fields_source_c;

  struct_fields_source_a[0] = &ffi_type_float;
  struct_fields_source_a[1] = &ffi_type_float;
  struct_fields_source_a[2] = NULL;

  struct_fields_source_b[0] = &ffi_type_float;
  struct_fields_source_b[1] = &ffi_type_float;
  struct_fields_source_b[2] = NULL;

  struct_fields_source_c[0] = &struct_type_a;
  struct_fields_source_c[1] = &struct_type_b;
  struct_fields_source_c[2] = NULL;

  arg_types[0] = &ffi_type_sint32;
  arg_types[1] = &ffi_type_sint32;
  arg_types[2] = &ffi_type_sint32;
  arg_types[3] = &struct_type_c;
  arg_types[4] = &ffi_type_sint32;
  arg_types[5] = &ffi_type_sint32;
  arg_types[6] = &ffi_type_sint32;
  arg_types[7] = NULL;

  void *args[7];
  args[0] = &k;
  args[1] = &k;
  args[2] = &k;
  args[3] = &source;
  args[4] = &k;
  args[5] = &k;
  args[6] = &k;
  CHECK (ffi_prep_cif (&cif, FFI_DEFAULT_ABI, 7, &struct_type_c,
		       arg_types) == FFI_OK);

  ffi_call (&cif, FFI_FN (C_fn), &result, args);
  /* { dg-output "1, 1, 1, 1, 1, 1\n" } */
  /* { dg-output "1.0, 2.0, 4.0, 8.0, 1.0, 2.0, 4.0, 8.0" } */
  CHECK_FLOAT_EQ(result.a.a_x, source.a.a_x);
  CHECK_FLOAT_EQ(result.a.a_y, source.a.a_y);
  CHECK_FLOAT_EQ(result.b.b_x, source.b.b_x);
  CHECK_FLOAT_EQ(result.b.b_y, source.b.b_y);
  exit(0);
}
