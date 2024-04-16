/* Area:		ffi_call, closure_call
   Purpose:		Check structure returning with different structure size.
				Depending on the ABI. Check bigger struct which overlaps
				the gp and fp register count on Darwin/AIX/ppc64.
   Limitations:	none.
   PR:			none.
   Originator:	Blake Chaffin	6/21/2007	*/

/* { dg-do run { xfail strongarm*-*-* xscale*-*-*  } } */
#include "ffitest.h"

/* 13 FPRs: 104 bytes */
/* 14 FPRs: 112 bytes */

typedef struct struct_108byte {
	double a;
	double b;
	double c;
	double d;
	double e;
	double f;
	double g;
	double h;
	double i;
	double j;
	double k;
	double l;
	double m;
	int n;
} struct_108byte;

struct_108byte cls_struct_108byte_fn(
	struct_108byte b0,
	struct_108byte b1,
	struct_108byte b2,
	struct_108byte b3)
{
	struct_108byte	result;

	result.a = b0.a + b1.a + b2.a + b3.a;
	result.b = b0.b + b1.b + b2.b + b3.b;
	result.c = b0.c + b1.c + b2.c + b3.c;
	result.d = b0.d + b1.d + b2.d + b3.d;
	result.e = b0.e + b1.e + b2.e + b3.e;
	result.f = b0.f + b1.f + b2.f + b3.f;
	result.g = b0.g + b1.g + b2.g + b3.g;
	result.h = b0.h + b1.h + b2.h + b3.h;
	result.i = b0.i + b1.i + b2.i + b3.i;
	result.j = b0.j + b1.j + b2.j + b3.j;
	result.k = b0.k + b1.k + b2.k + b3.k;
	result.l = b0.l + b1.l + b2.l + b3.l;
	result.m = b0.m + b1.m + b2.m + b3.m;
	result.n = b0.n + b1.n + b2.n + b3.n;

	printf("%g %g %g %g %g %g %g %g %g %g %g %g %g %d\n", result.a, result.b, result.c,
		result.d, result.e, result.f, result.g, result.h, result.i,
		result.j, result.k, result.l, result.m, result.n);

	return result;
}

static void
cls_struct_108byte_gn(ffi_cif* cif __UNUSED__, void* resp, void** args, void* userdata __UNUSED__)
{
	struct_108byte	b0, b1, b2, b3;

	b0 = *(struct_108byte*)(args[0]);
	b1 = *(struct_108byte*)(args[1]);
	b2 = *(struct_108byte*)(args[2]);
	b3 = *(struct_108byte*)(args[3]);

	*(struct_108byte*)resp = cls_struct_108byte_fn(b0, b1, b2, b3);
}

int main (void)
{
	ffi_cif cif;
        void *code;
	ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
	void* args_dbl[5];
	ffi_type* cls_struct_fields[15];
	ffi_type cls_struct_type;
	ffi_type* dbl_arg_types[5];

	struct_108byte e_dbl = { 9.0, 2.0, 6.0, 5.0, 3.0, 4.0, 8.0, 1.0, 1.0, 2.0, 3.0, 7.0, 2.0, 7 };
	struct_108byte f_dbl = { 1.0, 2.0, 3.0, 7.0, 2.0, 5.0, 6.0, 7.0, 4.0, 5.0, 7.0, 9.0, 1.0, 4 };
	struct_108byte g_dbl = { 4.0, 5.0, 7.0, 9.0, 1.0, 1.0, 2.0, 9.0, 8.0, 6.0, 1.0, 4.0, 0.0, 3 };
	struct_108byte h_dbl = { 8.0, 6.0, 1.0, 4.0, 0.0, 3.0, 3.0, 1.0, 9.0, 2.0, 6.0, 5.0, 3.0, 2 };
	struct_108byte res_dbl;

	cls_struct_type.size = 0;
	cls_struct_type.alignment = 0;
	cls_struct_type.type = FFI_TYPE_STRUCT;
	cls_struct_type.elements = cls_struct_fields;

	cls_struct_fields[0] = &ffi_type_double;
	cls_struct_fields[1] = &ffi_type_double;
	cls_struct_fields[2] = &ffi_type_double;
	cls_struct_fields[3] = &ffi_type_double;
	cls_struct_fields[4] = &ffi_type_double;
	cls_struct_fields[5] = &ffi_type_double;
	cls_struct_fields[6] = &ffi_type_double;
	cls_struct_fields[7] = &ffi_type_double;
	cls_struct_fields[8] = &ffi_type_double;
	cls_struct_fields[9] = &ffi_type_double;
	cls_struct_fields[10] = &ffi_type_double;
	cls_struct_fields[11] = &ffi_type_double;
	cls_struct_fields[12] = &ffi_type_double;
	cls_struct_fields[13] = &ffi_type_sint32;
	cls_struct_fields[14] = NULL;

	dbl_arg_types[0] = &cls_struct_type;
	dbl_arg_types[1] = &cls_struct_type;
	dbl_arg_types[2] = &cls_struct_type;
	dbl_arg_types[3] = &cls_struct_type;
	dbl_arg_types[4] = NULL;

	CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 4, &cls_struct_type,
		dbl_arg_types) == FFI_OK);

	args_dbl[0] = &e_dbl;
	args_dbl[1] = &f_dbl;
	args_dbl[2] = &g_dbl;
	args_dbl[3] = &h_dbl;
	args_dbl[4] = NULL;

	ffi_call(&cif, FFI_FN(cls_struct_108byte_fn), &res_dbl, args_dbl);
	/* { dg-output "22 15 17 25 6 13 19 18 22 15 17 25 6 16" } */
	printf("res: %g %g %g %g %g %g %g %g %g %g %g %g %g %d\n", res_dbl.a, res_dbl.b,
		res_dbl.c, res_dbl.d, res_dbl.e, res_dbl.f, res_dbl.g, res_dbl.h, res_dbl.i,
		res_dbl.j, res_dbl.k, res_dbl.l, res_dbl.m, res_dbl.n);
	/* { dg-output "\nres: 22 15 17 25 6 13 19 18 22 15 17 25 6 16" } */

	CHECK(ffi_prep_closure_loc(pcl, &cif, cls_struct_108byte_gn, NULL, code) == FFI_OK);

	res_dbl = ((struct_108byte(*)(struct_108byte, struct_108byte,
		struct_108byte, struct_108byte))(code))(e_dbl, f_dbl, g_dbl, h_dbl);
	/* { dg-output "\n22 15 17 25 6 13 19 18 22 15 17 25 6 16" } */
	printf("res: %g %g %g %g %g %g %g %g %g %g %g %g %g %d\n", res_dbl.a, res_dbl.b,
		res_dbl.c, res_dbl.d, res_dbl.e, res_dbl.f, res_dbl.g, res_dbl.h, res_dbl.i,
		res_dbl.j, res_dbl.k, res_dbl.l, res_dbl.m, res_dbl.n);
	/* { dg-output "\nres: 22 15 17 25 6 13 19 18 22 15 17 25 6 16" } */

	exit(0);
}
