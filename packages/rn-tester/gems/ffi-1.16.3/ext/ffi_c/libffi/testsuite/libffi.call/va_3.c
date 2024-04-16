/* Area:		ffi_call
   Purpose:		Test function with multiple fixed args and variable argument list.
   Limitations:	none.
   PR:			none.
   Originator:	        ARM Ltd., Oracle */

/* { dg-do run } */
/* { dg-output "" { xfail avr32*-*-* m68k-*-* } } */

#include "ffitest.h"
#include <stdarg.h>

/*
 * This is a modified version of va_2.c that has fixed arguments with "small" types that
 * are not allowed as variable arguments, but they should be still allowed as fixed args.
 */

static int
test_fn (char a1, float a2, int n, ...)
{
  va_list ap;
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

  printf ("%d %f uc=%u sc=%d %u %d %u %d %lu %ld %f %f\n",
	  a1, a2,
	  uc, sc,
	  us, ss,
	  ui, si,
	  ul, sl,
	  f, d);

  va_end (ap);

  CHECK(a1 == 1);
  CHECK((int)a2 == 2);
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
  void* args[14];
  ffi_type* arg_types[14];

  char a1;
  float a2;
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

  arg_types[0] = &ffi_type_schar;
  arg_types[1] = &ffi_type_float;
  arg_types[2] = &ffi_type_sint;
  arg_types[3] = &ffi_type_uint;
  arg_types[4] = &ffi_type_sint;
  arg_types[5] = &ffi_type_uint;
  arg_types[6] = &ffi_type_sint;
  arg_types[7] = &ffi_type_uint;
  arg_types[8] = &ffi_type_sint;
  arg_types[9] = &ffi_type_ulong;
  arg_types[10] = &ffi_type_slong;
  arg_types[11] = &ffi_type_double;
  arg_types[12] = &ffi_type_double;
  arg_types[13] = NULL;

  CHECK(ffi_prep_cif_var(&cif, FFI_DEFAULT_ABI, 3, 13, &ffi_type_sint, arg_types) == FFI_OK);

  a1 = 1;
  a2 = 2.0f;
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

  args[0] = &a1;
  args[1] = &a2;
  args[2] = &n;
  args[3] = &uc;
  args[4] = &sc;
  args[5] = &us;
  args[6] = &ss;
  args[7] = &ui;
  args[8] = &si;
  args[9] = &ul;
  args[10] = &sl;
  args[11] = &f1;
  args[12] = &d1;
  args[13] = NULL;

  ffi_call(&cif, FFI_FN(test_fn), &res, args);
  /* { dg-output "1 2.000000 uc=9 sc=10 11 12 13 14 15 16 2.120000 3.130000" } */
  printf("res: %d\n", (int) res);
  /* { dg-output "\nres: 42" } */
  CHECK(res == 42);

  return 0;
}
