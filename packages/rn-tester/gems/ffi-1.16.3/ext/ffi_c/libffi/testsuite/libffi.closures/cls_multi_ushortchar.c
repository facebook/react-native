/* Area:	ffi_call, closure_call
   Purpose:	Check passing of multiple unsigned short/char values.
   Limitations:	none.
   PR:		PR13221.
   Originator:	<andreast@gcc.gnu.org> 20031129  */

/* { dg-do run } */
#include "ffitest.h"

static unsigned short test_func_fn(unsigned char a1, unsigned short a2,
			    unsigned char a3, unsigned short a4)
{
  unsigned short result;

  result = a1 + a2 + a3 + a4;

  printf("%d %d %d %d: %d\n", a1, a2, a3, a4, result);

  CHECK(a1 == 1);
  CHECK(a2 == 2);
  CHECK(a3 == 127);
  CHECK(a4 == 128);
  CHECK(result == 258);

  return result;

}

static void test_func_gn(ffi_cif *cif __UNUSED__, void *rval, void **avals,
			 void *data __UNUSED__)
{
  unsigned char a1, a3;
  unsigned short a2, a4;

  a1 = *(unsigned char *)avals[0];
  a2 = *(unsigned short *)avals[1];
  a3 = *(unsigned char *)avals[2];
  a4 = *(unsigned short *)avals[3];

  *(ffi_arg *)rval = test_func_fn(a1, a2, a3, a4);

}

typedef unsigned short (*test_type)(unsigned char, unsigned short,
				   unsigned char, unsigned short);

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  void * args_dbl[5];
  ffi_type * cl_arg_types[5];
  ffi_arg res_call;
  unsigned char a, c;
  unsigned short b, d, res_closure;

  a = 1;
  b = 2;
  c = 127;
  d = 128;

  args_dbl[0] = &a;
  args_dbl[1] = &b;
  args_dbl[2] = &c;
  args_dbl[3] = &d;
  args_dbl[4] = NULL;

  cl_arg_types[0] = &ffi_type_uchar;
  cl_arg_types[1] = &ffi_type_ushort;
  cl_arg_types[2] = &ffi_type_uchar;
  cl_arg_types[3] = &ffi_type_ushort;
  cl_arg_types[4] = NULL;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 4,
		     &ffi_type_ushort, cl_arg_types) == FFI_OK);

  ffi_call(&cif, FFI_FN(test_func_fn), &res_call, args_dbl);
  /* { dg-output "1 2 127 128: 258" } */
  printf("res: %d\n", (unsigned short)res_call);
  /* { dg-output "\nres: 258" } */
  CHECK(res_call == 258);

  CHECK(ffi_prep_closure_loc(pcl, &cif, test_func_gn, NULL, code)  == FFI_OK);

  res_closure = (*((test_type)code))(1, 2, 127, 128);
  /* { dg-output "\n1 2 127 128: 258" } */
  printf("res: %d\n", res_closure);
  /* { dg-output "\nres: 258" } */
  CHECK(res_closure == 258);

  exit(0);
}
