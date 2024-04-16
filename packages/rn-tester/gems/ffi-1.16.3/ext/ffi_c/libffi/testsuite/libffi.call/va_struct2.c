/* Area:		ffi_call
   Purpose:		Test passing struct in variable argument lists.
   Limitations:	none.
   PR:			none.
   Originator: ARM Ltd. */

/* { dg-do run } */
/* { dg-output "" { xfail avr32*-*-* } } */

#include "ffitest.h"
#include <stdarg.h>

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

static struct small_tag
test_fn (int n, ...)
{
  va_list ap;
  struct small_tag s1;
  struct small_tag s2;
  struct large_tag l;

  va_start (ap, n);
  s1 = va_arg (ap, struct small_tag);
  l = va_arg (ap, struct large_tag);
  s2 = va_arg (ap, struct small_tag);
  printf ("%u %u %u %u %u %u %u %u %u\n", s1.a, s1.b, l.a, l.b, l.c, l.d, l.e,
	  s2.a, s2.b);
  CHECK(s1.a == 5);
  CHECK(s1.b == 6);
  CHECK(l.a == 10);
  CHECK(l.b == 11);
  CHECK(l.c == 12);
  CHECK(l.d == 13);
  CHECK(l.e == 14);
  CHECK(s2.a == 7);
  CHECK(s2.b == 8);
  va_end (ap);
  s1.a += s2.a;
  s1.b += s2.b;
  return s1;
}

int
main (void)
{
  ffi_cif cif;
  void* args[5];
  ffi_type* arg_types[5];

  ffi_type s_type;
  ffi_type *s_type_elements[3];

  ffi_type l_type;
  ffi_type *l_type_elements[6];

  struct small_tag s1;
  struct small_tag s2;
  struct large_tag l1;

  int n;
  struct small_tag res;

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

  CHECK(ffi_prep_cif_var(&cif, FFI_DEFAULT_ABI, 1, 4, &s_type, arg_types) == FFI_OK);

  s1.a = 5;
  s1.b = 6;

  l1.a = 10;
  l1.b = 11;
  l1.c = 12;
  l1.d = 13;
  l1.e = 14;

  s2.a = 7;
  s2.b = 8;

  n = 41;

  args[0] = &n;
  args[1] = &s1;
  args[2] = &l1;
  args[3] = &s2;
  args[4] = NULL;

  ffi_call(&cif, FFI_FN(test_fn), &res, args);
  /* { dg-output "5 6 10 11 12 13 14 7 8" } */
  printf("res: %d %d\n", res.a, res.b);
  /* { dg-output "\nres: 12 14" } */
  CHECK(res.a == 12);
  CHECK(res.b == 14);

  return 0;
}
