/* Area:	ffi_call
   Purpose:	Promotion test.
   Limitations:	none.
   PR:		none.
   Originator:	From the original ffitest.c  */

/* { dg-do run } */
#include "ffitest.h"
static int promotion(signed char sc, signed short ss,
		     unsigned char uc, unsigned short us)
{
  int r = (int) sc + (int) ss + (int) uc + (int) us;

  return r;
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  ffi_arg rint;
  signed char sc;
  unsigned char uc;
  signed short ss;
  unsigned short us;
  unsigned long ul;

  args[0] = &ffi_type_schar;
  args[1] = &ffi_type_sshort;
  args[2] = &ffi_type_uchar;
  args[3] = &ffi_type_ushort;
  values[0] = &sc;
  values[1] = &ss;
  values[2] = &uc;
  values[3] = &us;

  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 4,
		     &ffi_type_sint, args) == FFI_OK);

  us = 0;
  ul = 0;

  for (sc = (signed char) -127;
       sc <= (signed char) 120; sc += 1)
    for (ss = -30000; ss <= 30000; ss += 10000)
      for (uc = (unsigned char) 0;
	   uc <= (unsigned char) 200; uc += 20)
	for (us = 0; us <= 60000; us += 10000)
	  {
	    ul++;
	    ffi_call(&cif, FFI_FN(promotion), &rint, values);
	    CHECK((int)rint == (signed char) sc + (signed short) ss +
		  (unsigned char) uc + (unsigned short) us);
	  }
  printf("%lu promotion tests run\n", ul);
  exit(0);
}
