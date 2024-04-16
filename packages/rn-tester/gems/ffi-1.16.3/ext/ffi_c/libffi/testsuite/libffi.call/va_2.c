/* Area:		ffi_call
   Purpose:		Test passing struct in variable argument lists.
   Limitations:	none.
   PR:			none.
   Originator:	        ARM Ltd. */

/* { dg-do run } */
/* { dg-output "" { xfail avr32*-*-* m68k-*-* } } */

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


static int
test_fn (int n, ...)
{
  va_list ap;
  struct small_tag s1;
  struct small_tag s2;
  struct large_tag l;
  unsigned char uc;
  signed char sc;
  unsigned short us;
  signed short ss;
  unsigned int ui;
  signed int si;
  unsigned long ul;
  signed long sl;
  float f;
  double d;

  va_start (ap, n);
  s1 = va_arg (ap, struct small_tag);
  l = va_arg (ap, struct large_tag);
  s2 = va_arg (ap, struct small_tag);

  uc = va_arg (ap, unsigned);
  sc = va_arg (ap, signed);

  us = va_arg (ap, unsigned);
  ss = va_arg (ap, signed);

  ui = va_arg (ap, unsigned int);
  si = va_arg (ap, signed int);

  ul = va_arg (ap, unsigned long);
  sl = va_arg (ap, signed long);

  f = va_arg (ap, double);	/* C standard promotes float->double
				   when anonymous */
  d = va_arg (ap, double);

  printf ("%u %u %u %u %u %u %u %u %u uc=%u sc=%d %u %d %u %d %lu %ld %f %f\n",
	  s1.a, s1.b, l.a, l.b, l.c, l.d, l.e,
	  s2.a, s2.b,
	  uc, sc,
	  us, ss,
	  ui, si,
	  ul, sl,
	  f, d);

  va_end (ap);

  CHECK(s1.a == 5);
  CHECK(s1.b == 6);
  CHECK(l.a == 10);
  CHECK(l.b == 11);
  CHECK(l.c == 12);
  CHECK(l.d == 13);
  CHECK(l.e == 14);
  CHECK(s2.a == 7);
  CHECK(s2.b == 8);
  CHECK(uc == 9);
  CHECK(sc == 10);
  CHECK(us == 11);
  CHECK(ss == 12);
  CHECK(ui == 13);
  CHECK(si == 14);
  CHECK(ul == 15);
  CHECK(sl == 16);
  CHECK((int)f == 2);
  CHECK((int)d == 3);

  return n + 1;
}

int
main (void)
{
  ffi_cif cif;
  void* args[15];
  ffi_type* arg_types[15];

  ffi_type s_type;
  ffi_type *s_type_elements[3];

  ffi_type l_type;
  ffi_type *l_type_elements[6];

  struct small_tag s1;
  struct small_tag s2;
  struct large_tag l1;

  int n;
  ffi_arg res;

  unsigned int uc;
  signed int sc;
  unsigned int us;
  signed int ss;
  unsigned int ui;
  signed int si;
  unsigned long ul;
  signed long sl;
  double d1;
  double f1;

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
  arg_types[4] = &ffi_type_uint;
  arg_types[5] = &ffi_type_sint;
  arg_types[6] = &ffi_type_uint;
  arg_types[7] = &ffi_type_sint;
  arg_types[8] = &ffi_type_uint;
  arg_types[9] = &ffi_type_sint;
  arg_types[10] = &ffi_type_ulong;
  arg_types[11] = &ffi_type_slong;
  arg_types[12] = &ffi_type_double;
  arg_types[13] = &ffi_type_double;
  arg_types[14] = NULL;

  CHECK(ffi_prep_cif_var(&cif, FFI_DEFAULT_ABI, 1, 14, &ffi_type_sint, arg_types) == FFI_OK);

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

  uc = 9;
  sc = 10;
  us = 11;
  ss = 12;
  ui = 13;
  si = 14;
  ul = 15;
  sl = 16;
  f1 = 2.12;
  d1 = 3.13;

  args[0] = &n;
  args[1] = &s1;
  args[2] = &l1;
  args[3] = &s2;
  args[4] = &uc;
  args[5] = &sc;
  args[6] = &us;
  args[7] = &ss;
  args[8] = &ui;
  args[9] = &si;
  args[10] = &ul;
  args[11] = &sl;
  args[12] = &f1;
  args[13] = &d1;
  args[14] = NULL;

  ffi_call(&cif, FFI_FN(test_fn), &res, args);
  /* { dg-output "5 6 10 11 12 13 14 7 8 uc=9 sc=10 11 12 13 14 15 16 2.120000 3.130000" } */
  printf("res: %d\n", (int) res);
  /* { dg-output "\nres: 42" } */
  CHECK(res == 42);

  return 0;
}
