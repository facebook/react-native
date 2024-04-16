/* Area:	ffi_call
   Purpose:	Check denorm double value.
   Limitations:	none.
   PR:		PR26483.
   Originator:	From the original ffitest.c  */

/* { dg-do run } */
/* { dg-options "-mieee" { target alpha*-*-* } } */

#include "ffitest.h"
#include "float.h"

typedef union
{
  double d;
  unsigned char c[sizeof (double)];
} value_type;

#define CANARY 0xba

static double dblit(double d)
{
  return d;
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  double d;
  value_type result[2];
  unsigned int i;

  args[0] = &ffi_type_double;
  values[0] = &d;
  
  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 1,
		     &ffi_type_double, args) == FFI_OK);
  
  d = DBL_MIN / 2;
  
  /* Put a canary in the return array.  This is a regression test for
     a buffer overrun.  */
  memset(result[1].c, CANARY, sizeof (double));

  ffi_call(&cif, FFI_FN(dblit), &result[0].d, values);
  
  /* The standard delta check doesn't work for denorms.  Since we didn't do
     any arithmetic, we should get the original result back, and hence an
     exact check should be OK here.  */
 
  CHECK(result[0].d == dblit(d));

  /* Check the canary.  */
  for (i = 0; i < sizeof (double); ++i)
    CHECK(result[1].c[i] == CANARY);

  exit(0);

}
