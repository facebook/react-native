/* Area:		ffi_call, closure_call
   Purpose:		Test doubles passed in variable argument lists.
   Limitations:	none.
   PR:			none.
   Originator:	Blake Chaffin 6/6/2007	 */

/* { dg-do run } */
/* { dg-output "" { xfail avr32*-*-* } } */
#include "ffitest.h"

struct small_tag
{
  unsigned char a;
  unsigned char b;
};

struct large_tag
{
  unsigned a;
  unsigned b;
  unsigned c;
  unsigned d;
  unsigned e;
};

static void
test_fn (ffi_cif* cif __UNUSED__, void* resp,
	 void** args, void* userdata __UNUSED__)
{
  int n = *(int*)args[0];
  struct small_tag s1 = * (struct small_tag *) args[1];
  struct large_tag l1 = * (struct large_tag *) args[2];
  struct small_tag s2 = * (struct small_tag *) args[3];

  printf ("%d %d %d %d %d %d %d %d %d %d\n", n, s1.a, s1.b,
	  l1.a, l1.b, l1.c, l1.d, l1.e,
	  s2.a, s2.b);
  CHECK(n == 4);
  CHECK(s1.a == 5);
  CHECK(s1.b == 6);
  CHECK(l1.a == 10);
  CHECK(l1.b == 11);
  CHECK(l1.c == 12);
  CHECK(l1.d == 13);
  CHECK(l1.e == 14);
  CHECK(s2.a == 20);
  CHECK(s2.b == 21);
  * (ffi_arg*) resp = 42;
}

int
main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc (sizeof (ffi_closure), &code);
  ffi_type* arg_types[5];

  ffi_arg res = 0;

  ffi_type s_type;
  ffi_type *s_type_elements[3];

  ffi_type l_type;
  ffi_type *l_type_elements[6];

  struct small_tag s1;
  struct small_tag s2;
  struct large_tag l1;

  int si;

  s_type.size = 0;
  s_type.alignment = 0;
  s_type.type = FFI_TYPE_STRUCT;
  s_type.elements = s_type_elements;

  s_type_elements[0] = &ffi_type_uchar;
  s_type_elements[1] = &ffi_type_uchar;
  s_type_elements[2] = NULL;

  l_type.size = 0;
  l_type.alignment = 0;
  l_type.type = FFI_TYPE_STRUCT;
  l_type.elements = l_type_elements;

  l_type_elements[0] = &ffi_type_uint;
  l_type_elements[1] = &ffi_type_uint;
  l_type_elements[2] = &ffi_type_uint;
  l_type_elements[3] = &ffi_type_uint;
  l_type_elements[4] = &ffi_type_uint;
  l_type_elements[5] = NULL;

  arg_types[0] = &ffi_type_sint;
  arg_types[1] = &s_type;
  arg_types[2] = &l_type;
  arg_types[3] = &s_type;
  arg_types[4] = NULL;

  CHECK(ffi_prep_cif_var(&cif, FFI_DEFAULT_ABI, 1, 4, &ffi_type_sint,
			 arg_types) == FFI_OK);

  si = 4;
  s1.a = 5;
  s1.b = 6;

  s2.a = 20;
  s2.b = 21;

  l1.a = 10;
  l1.b = 11;
  l1.c = 12;
  l1.d = 13;
  l1.e = 14;

  CHECK(ffi_prep_closure_loc(pcl, &cif, test_fn, NULL, code) == FFI_OK);

  res = ((int (*)(int, ...))(code))(si, s1, l1, s2);
  /* { dg-output "4 5 6 10 11 12 13 14 20 21" } */
  printf("res: %d\n", (int) res);
  /* { dg-output "\nres: 42" } */
  CHECK(res == 42);

  exit(0);
}
