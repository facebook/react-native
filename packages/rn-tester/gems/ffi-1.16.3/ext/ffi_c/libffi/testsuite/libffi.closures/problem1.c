/* Area:	ffi_call, closure_call
   Purpose:	Check structure passing with different structure size.
   Limitations:	none.
   PR:		none.
   Originator:	<andreast@gcc.gnu.org> 20030828	 */

/* { dg-do run } */
#include "ffitest.h"

typedef struct my_ffi_struct {
  double a;
  double b;
  double c;
} my_ffi_struct;

my_ffi_struct callee(struct my_ffi_struct a1, struct my_ffi_struct a2)
{
  struct my_ffi_struct result;
  result.a = a1.a + a2.a;
  result.b = a1.b + a2.b;
  result.c = a1.c + a2.c;


  printf("%g %g %g %g %g %g: %g %g %g\n", a1.a, a1.b, a1.c,
	 a2.a, a2.b, a2.c, result.a, result.b, result.c);

  return result;
}

void stub(ffi_cif* cif __UNUSED__, void* resp, void** args,
	  void* userdata __UNUSED__)
{
  struct my_ffi_struct a1;
  struct my_ffi_struct a2;

  a1 = *(struct my_ffi_struct*)(args[0]);
  a2 = *(struct my_ffi_struct*)(args[1]);

  *(my_ffi_struct *)resp = callee(a1, a2);
}


int main(void)
{
  ffi_type* my_ffi_struct_fields[4];
  ffi_type my_ffi_struct_type;
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  void* args[4];
  ffi_type* arg_types[3];

  struct my_ffi_struct g = { 1.0, 2.0, 3.0 };
  struct my_ffi_struct f = { 1.0, 2.0, 3.0 };
  struct my_ffi_struct res;

  my_ffi_struct_type.size = 0;
  my_ffi_struct_type.alignment = 0;
  my_ffi_struct_type.type = FFI_TYPE_STRUCT;
  my_ffi_struct_type.elements = my_ffi_struct_fields;

  my_ffi_struct_fields[0] = &ffi_type_double;
  my_ffi_struct_fields[1] = &ffi_type_double;
  my_ffi_struct_fields[2] = &ffi_type_double;
  my_ffi_struct_fields[3] = NULL;

  arg_types[0] = &my_ffi_struct_type;
  arg_types[1] = &my_ffi_struct_type;
  arg_types[2] = NULL;

  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 2, &my_ffi_struct_type,
		     arg_types) == FFI_OK);

  args[0] = &g;
  args[1] = &f;
  args[2] = NULL;
  ffi_call(&cif, FFI_FN(callee), &res, args);
  /* { dg-output "1 2 3 1 2 3: 2 4 6" } */
  printf("res: %g %g %g\n", res.a, res.b, res.c);
  /* { dg-output "\nres: 2 4 6" } */

  CHECK(ffi_prep_closure_loc(pcl, &cif, stub, NULL, code) == FFI_OK);

  res = ((my_ffi_struct(*)(struct my_ffi_struct, struct my_ffi_struct))(code))(g, f);
  /* { dg-output "\n1 2 3 1 2 3: 2 4 6" } */
  printf("res: %g %g %g\n", res.a, res.b, res.c);
  /* { dg-output "\nres: 2 4 6" } */

  exit(0);;
}
