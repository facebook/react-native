/* Area:	ffi_call, closure_call
   Purpose:	Check passing of multiple signed short values.
   Limitations:	none.
   PR:		PR13221.
   Originator:	<andreast@gcc.gnu.org> 20031129  */

/* { dg-do run } */
#include "ffitest.h"

static signed short test_func_fn(signed short a1, signed short a2)
{
  signed short result;

  result = a1 + a2;

  printf("%d %d: %d\n", a1, a2, result);
  CHECK(a1 == 2);
  CHECK(a2 == 32765);
  CHECK(result == 32767);

  return result;

}

static void test_func_gn(ffi_cif *cif __UNUSED__, void *rval, void **avals,
			 void *data __UNUSED__)
{
  signed short a1, a2;

  a1 = *(signed short *)avals[0];
  a2 = *(signed short *)avals[1];

  *(ffi_arg *)rval = test_func_fn(a1, a2);

}

typedef signed short (*test_type)(signed short, signed short);

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  void * args_dbl[3];
  ffi_type * cl_arg_types[3];
  ffi_arg res_call;
  unsigned short a, b, res_closure;

  a = 2;
  b = 32765;

  args_dbl[0] = &a;
  args_dbl[1] = &b;
  args_dbl[2] = NULL;

  cl_arg_types[0] = &ffi_type_sshort;
  cl_arg_types[1] = &ffi_type_sshort;
  cl_arg_types[2] = NULL;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 2,
		     &ffi_type_sshort, cl_arg_types) == FFI_OK);

  ffi_call(&cif, FFI_FN(test_func_fn), &res_call, args_dbl);
  /* { dg-output "2 32765: 32767" } */
  printf("res: %d\n", (unsigned short)res_call);
  /* { dg-output "\nres: 32767" } */
  CHECK((unsigned short)res_call == 32767);

  CHECK(ffi_prep_closure_loc(pcl, &cif, test_func_gn, NULL, code)  == FFI_OK);

  res_closure = (*((test_type)code))(2, 32765);
  /* { dg-output "\n2 32765: 32767" } */
  printf("res: %d\n", res_closure);
  /* { dg-output "\nres: 32767" } */
  CHECK(res_closure == 32767);

  exit(0);
}
