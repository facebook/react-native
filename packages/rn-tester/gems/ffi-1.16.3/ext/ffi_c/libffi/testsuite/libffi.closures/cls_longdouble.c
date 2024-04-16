/* Area:		ffi_call, closure_call
   Purpose:		Check long double arguments.
   Limitations:	none.
   PR:			none.
   Originator:	Blake Chaffin	*/

/* This test is known to PASS on armv7l-unknown-linux-gnueabihf, so I have
   remove the xfail for arm*-*-* below, until we know more.  */
/* { dg-do run { xfail strongarm*-*-* xscale*-*-* } } */
/* { dg-options -mlong-double-128 { target powerpc64*-*-linux-gnu* } } */

#include "ffitest.h"

long double cls_ldouble_fn(
	long double	a1,
	long double	a2,
	long double	a3,
	long double	a4,
	long double	a5,
	long double	a6,
	long double	a7,
	long double	a8)
{
	long double	r = a1 + a2 + a3 + a4 + a5 + a6 + a7 + a8;

	printf("%Lg %Lg %Lg %Lg %Lg %Lg %Lg %Lg: %Lg\n",
		a1, a2, a3, a4, a5, a6, a7, a8, r);
	CHECK(a1 == 1);
	CHECK(a2 == 2);
	CHECK(a3 == 3);
	CHECK(a4 == 4);
	CHECK(a5 == 5);
	CHECK(a6 == 6);
	CHECK(a7 == 7);
	CHECK(a8 == 8);

	return r;
}

static void
cls_ldouble_gn(ffi_cif* cif __UNUSED__, void* resp, 
	       void** args, void* userdata __UNUSED__)
{
	long double	a1	= *(long double*)args[0];
	long double	a2	= *(long double*)args[1];
	long double	a3	= *(long double*)args[2];
	long double	a4	= *(long double*)args[3];
	long double	a5	= *(long double*)args[4];
	long double	a6	= *(long double*)args[5];
	long double	a7	= *(long double*)args[6];
	long double	a8	= *(long double*)args[7];

	*(long double*)resp = cls_ldouble_fn(
		a1, a2, a3, a4, a5, a6, a7, a8);
}

int main(void)
{
	ffi_cif	cif;
        void* code;
	ffi_closure*	pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
	void*			args[9];
	ffi_type*		arg_types[9];
	long double		res	= 0;

	long double	arg1	= 1;
	long double	arg2	= 2;
	long double	arg3	= 3;
	long double	arg4	= 4;
	long double	arg5	= 5;
	long double	arg6	= 6;
	long double	arg7	= 7;
	long double	arg8	= 8;

	arg_types[0] = &ffi_type_longdouble;
	arg_types[1] = &ffi_type_longdouble;
	arg_types[2] = &ffi_type_longdouble;
	arg_types[3] = &ffi_type_longdouble;
	arg_types[4] = &ffi_type_longdouble;
	arg_types[5] = &ffi_type_longdouble;
	arg_types[6] = &ffi_type_longdouble;
	arg_types[7] = &ffi_type_longdouble;
	arg_types[8] = NULL;

	CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 8, &ffi_type_longdouble,
		arg_types) == FFI_OK);

	args[0] = &arg1;
	args[1] = &arg2;
	args[2] = &arg3;
	args[3] = &arg4;
	args[4] = &arg5;
	args[5] = &arg6;
	args[6] = &arg7;
	args[7] = &arg8;
	args[8] = NULL;

	ffi_call(&cif, FFI_FN(cls_ldouble_fn), &res, args);
	/* { dg-output "1 2 3 4 5 6 7 8: 36" } */
	printf("res: %Lg\n", res);
	/* { dg-output "\nres: 36" } */
	CHECK(res == 36);

	CHECK(ffi_prep_closure_loc(pcl, &cif, cls_ldouble_gn, NULL, code) == FFI_OK);

	res = ((long double(*)(long double, long double, long double, long double,
		long double, long double, long double, long double))(code))(arg1, arg2,
		arg3, arg4, arg5, arg6, arg7, arg8);
	/* { dg-output "\n1 2 3 4 5 6 7 8: 36" } */
	printf("res: %Lg\n", res);
	/* { dg-output "\nres: 36" } */
	CHECK(res == 36);

	return 0;
}
