/* -*-c-*- */
#include "ffitest.h"
#include <stdio.h>
#include <stdlib.h>
#include <stdarg.h>
#include <complex.h>

static _Complex T_C_TYPE gComplexValue1 = 1 + 2 * I;
static _Complex T_C_TYPE gComplexValue2 = 3 + 4 * I;

static int cls_variadic(const char *format, ...)
{
  va_list ap;
  _Complex T_C_TYPE p1, p2;

  va_start (ap, format);
  p1 = va_arg (ap, _Complex T_C_TYPE);
  p2 = va_arg (ap, _Complex T_C_TYPE);
  va_end (ap);

  return printf(format, T_CONV creal (p1), T_CONV cimag (p1),
		T_CONV creal (p2), T_CONV cimag (p2));
}

static void
cls_complex_va_fn(ffi_cif* cif __UNUSED__, void* resp,
		  void** args, void* userdata __UNUSED__)
{
  char*	format = *(char**)args[0];
  gComplexValue1 = *(_Complex T_C_TYPE*)args[1];
  gComplexValue2 = *(_Complex T_C_TYPE*)args[2];

  *(ffi_arg*)resp =
    printf(format,
	   T_CONV creal (gComplexValue1), T_CONV cimag (gComplexValue1),
	   T_CONV creal (gComplexValue2), T_CONV cimag (gComplexValue2));
}

int main (void)
{
  ffi_cif cif;
  void *code;
  ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
  void* args[4];
  ffi_type* arg_types[4];
  char *format = "%.1f,%.1fi %.1f,%.1fi\n";

  _Complex T_C_TYPE complexArg1 = 1.0 + 22.0 *I;
  _Complex T_C_TYPE complexArg2 = 333.0 + 4444.0 *I;
  ffi_arg res = 0;

  arg_types[0] = &ffi_type_pointer;
  arg_types[1] = &T_FFI_TYPE;
  arg_types[2] = &T_FFI_TYPE;
  arg_types[3] = NULL;

  /* This printf call is variadic */
  CHECK(ffi_prep_cif_var(&cif, FFI_DEFAULT_ABI, 1, 3, &ffi_type_sint,
			 arg_types) == FFI_OK);

  args[0] = &format;
  args[1] = &complexArg1;
  args[2] = &complexArg2;
  args[3] = NULL;

  ffi_call(&cif, FFI_FN(cls_variadic), &res, args);
  printf("res: %d\n", (int) res);
  CHECK (res == 24);

  CHECK(ffi_prep_closure_loc(pcl, &cif, cls_complex_va_fn, NULL, code)
	== FFI_OK);

  res = ((int(*)(char *, ...))(code))(format, complexArg1, complexArg2);
  CHECK (gComplexValue1 == complexArg1);
  CHECK (gComplexValue2 == complexArg2);
  printf("res: %d\n", (int) res);
  CHECK (res == 24);

  exit(0);
}
