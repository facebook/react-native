/* Area:		ffi_call, closure_call
   Purpose:		Test doubles passed in variable argument lists.
   Limitations:	none.
   PR:			none.
   Originator:	Blake Chaffin 6/6/2007	 */

/* { dg-do run { xfail strongarm*-*-* xscale*-*-* } } */
/* { dg-output "" { xfail avr32*-*-* } } */
/* { dg-output "" { xfail mips-sgi-irix6* } } PR libffi/46660 */

#include "ffitest.h"

#define BUF_SIZE 50
static char buffer[BUF_SIZE];

static void
cls_double_va_fn(ffi_cif* cif __UNUSED__, void* resp,
		 void** args, void* userdata __UNUSED__)
{
	char*	format		= *(char**)args[0];
	double	doubleValue	= *(double*)args[1];

	*(ffi_arg*)resp = printf(format, doubleValue);
	CHECK(*(ffi_arg*)resp == 4);
	snprintf(buffer, BUF_SIZE, format, doubleValue);
	CHECK(strncmp(buffer, "7.0\n", 4) == 0);
}

int main (void)
{
	ffi_cif cif;
        void *code;
	ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
	void* args[3];
	ffi_type* arg_types[3];

	char*	format		= "%.1f\n";
	double	doubleArg	= 7;
	ffi_arg	res			= 0;

	arg_types[0] = &ffi_type_pointer;
	arg_types[1] = &ffi_type_double;
	arg_types[2] = NULL;

	/* This printf call is variadic */
	CHECK(ffi_prep_cif_var(&cif, FFI_DEFAULT_ABI, 1, 2, &ffi_type_sint,
			       arg_types) == FFI_OK);

	args[0] = &format;
	args[1] = &doubleArg;
	args[2] = NULL;

	ffi_call(&cif, FFI_FN(printf), &res, args);
	/* { dg-output "7.0" } */
	printf("res: %d\n", (int) res);
	/* { dg-output "\nres: 4" } */
	CHECK(res == 4);

	CHECK(ffi_prep_closure_loc(pcl, &cif, cls_double_va_fn, NULL,
				   code) == FFI_OK);

	res = ((int(*)(char*, ...))(code))(format, doubleArg);
	/* { dg-output "\n7.0" } */
	printf("res: %d\n", (int) res);
	/* { dg-output "\nres: 4" } */
	CHECK(res == 4);

	exit(0);
}
