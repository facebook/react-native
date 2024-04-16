/*	Area:			ffi_call, closure_call
	Purpose:		Check large structure returns.
	Limitations:	none.
	PR:				none.
	Originator:		Blake Chaffin	6/18/2007
*/

/* { dg-do run { xfail strongarm*-*-* xscale*-*-* } } */
/* { dg-options -mlong-double-128 { target powerpc64*-*-linux-gnu* } } */
/* { dg-options -Wformat=0 { target moxie*-*-elf or1k-*-* } } */

#include <inttypes.h>

#include "ffitest.h"

typedef	struct BigStruct{
	uint8_t		a;
	int8_t		b;
	uint16_t	c;
	int16_t		d;
	uint32_t	e;
	int32_t		f;
	uint64_t	g;
	int64_t		h;
	float		i;
	double		j;
	long double	k;
	char*		l;
	uint8_t		m;
	int8_t		n;
	uint16_t	o;
	int16_t		p;
	uint32_t	q;
	int32_t		r;
	uint64_t	s;
	int64_t		t;
	float		u;
	double		v;
	long double	w;
	char*		x;
	uint8_t		y;
	int8_t		z;
	uint16_t	aa;
	int16_t		bb;
	uint32_t	cc;
	int32_t		dd;
	uint64_t	ee;
	int64_t		ff;
	float		gg;
	double		hh;
	long double	ii;
	char*		jj;
	uint8_t		kk;
	int8_t		ll;
	uint16_t	mm;
	int16_t		nn;
	uint32_t	oo;
	int32_t		pp;
	uint64_t	qq;
	int64_t		rr;
	float		ss;
	double		tt;
	long double	uu;
	char*		vv;
	uint8_t		ww;
	int8_t		xx;
} BigStruct;

BigStruct
test_large_fn(
	uint8_t		ui8_1,
	int8_t		si8_1,
	uint16_t	ui16_1,
	int16_t		si16_1,
	uint32_t	ui32_1,
	int32_t		si32_1,
	uint64_t	ui64_1,
	int64_t		si64_1,
	float		f_1,
	double		d_1,
	long double	ld_1,
	char*		p_1,
	uint8_t		ui8_2,
	int8_t		si8_2,
	uint16_t	ui16_2,
	int16_t		si16_2,
	uint32_t	ui32_2,
	int32_t		si32_2,
	uint64_t	ui64_2,
	int64_t		si64_2,
	float		f_2,
	double		d_2,
	long double	ld_2,
	char*		p_2,
	uint8_t		ui8_3,
	int8_t		si8_3,
	uint16_t	ui16_3,
	int16_t		si16_3,
	uint32_t	ui32_3,
	int32_t		si32_3,
	uint64_t	ui64_3,
	int64_t		si64_3,
	float		f_3,
	double		d_3,
	long double	ld_3,
	char*		p_3,
	uint8_t		ui8_4,
	int8_t		si8_4,
	uint16_t	ui16_4,
	int16_t		si16_4,
	uint32_t	ui32_4,
	int32_t		si32_4,
	uint64_t	ui64_4,
	int64_t		si64_4,
	float		f_4,
	double		d_4,
	long double	ld_4,
	char*		p_4,
	uint8_t		ui8_5,
	int8_t		si8_5)
{
	BigStruct	retVal	= {
		ui8_1 + 1, si8_1 + 1, ui16_1 + 1, si16_1 + 1, ui32_1 + 1, si32_1 + 1,
			ui64_1 + 1, si64_1 + 1, f_1 + 1, d_1 + 1, ld_1 + 1, (char*)((intptr_t)p_1 + 1),
		ui8_2 + 2, si8_2 + 2, ui16_2 + 2, si16_2 + 2, ui32_2 + 2, si32_2 + 2,
			ui64_2 + 2, si64_2 + 2, f_2 + 2, d_2 + 2, ld_2 + 2, (char*)((intptr_t)p_2 + 2),
		ui8_3 + 3, si8_3 + 3, ui16_3 + 3, si16_3 + 3, ui32_3 + 3, si32_3 + 3,
			ui64_3 + 3, si64_3 + 3, f_3 + 3, d_3 + 3, ld_3 + 3, (char*)((intptr_t)p_3 + 3),
		ui8_4 + 4, si8_4 + 4, ui16_4 + 4, si16_4 + 4, ui32_4 + 4, si32_4 + 4,
			ui64_4 + 4, si64_4 + 4, f_4 + 4, d_4 + 4, ld_4 + 4, (char*)((intptr_t)p_4 + 4),
		ui8_5 + 5, si8_5 + 5};

	printf("%" PRIu8 " %" PRId8 " %hu %hd %u %d %" PRIu64 " %" PRId64 " %.0f %.0f %.0Lf %#lx "
		"%" PRIu8 " %" PRId8 " %hu %hd %u %d %" PRIu64 " %" PRId64 " %.0f %.0f %.0Lf %#lx "
		"%" PRIu8 " %" PRId8 " %hu %hd %u %d %" PRIu64 " %" PRId64 " %.0f %.0f %.0Lf %#lx "
		"%" PRIu8 " %" PRId8 " %hu %hd %u %d %" PRIu64 " %" PRId64 " %.0f %.0f %.0Lf %#lx %" PRIu8 " %" PRId8 ": "
		"%" PRIu8 " %" PRId8 " %hu %hd %u %d %" PRIu64 " %" PRId64 " %.0f %.0f %.0Lf %#lx "
		"%" PRIu8 " %" PRId8 " %hu %hd %u %d %" PRIu64 " %" PRId64 " %.0f %.0f %.0Lf %#lx "
		"%" PRIu8 " %" PRId8 " %hu %hd %u %d %" PRIu64 " %" PRId64 " %.0f %.0f %.0Lf %#lx "
		"%" PRIu8 " %" PRId8 " %hu %hd %u %d %" PRIu64 " %" PRId64 " %.0f %.0f %.0Lf %#lx %" PRIu8 " %" PRId8 "\n",
	       ui8_1, si8_1, ui16_1, si16_1, ui32_1, si32_1, ui64_1, si64_1, f_1, d_1, ld_1, (long)(intptr_t)p_1,
		ui8_2, si8_2, ui16_2, si16_2, ui32_2, si32_2, ui64_2, si64_2, f_2, d_2, ld_2, (long)(intptr_t)p_2,
		ui8_3, si8_3, ui16_3, si16_3, ui32_3, si32_3, ui64_3, si64_3, f_3, d_3, ld_3, (long)(intptr_t)p_3,
		ui8_4, si8_4, ui16_4, si16_4, ui32_4, si32_4, ui64_4, si64_4, f_4, d_4, ld_4, (long)(intptr_t)p_4, ui8_5, si8_5,
		retVal.a, retVal.b, retVal.c, retVal.d, retVal.e, retVal.f,
	       retVal.g, retVal.h, retVal.i, retVal.j, retVal.k, (long)(intptr_t)retVal.l,
		retVal.m, retVal.n, retVal.o, retVal.p, retVal.q, retVal.r,
	       retVal.s, retVal.t, retVal.u, retVal.v, retVal.w, (long)(intptr_t)retVal.x,
		retVal.y, retVal.z, retVal.aa, retVal.bb, retVal.cc, retVal.dd,
	       retVal.ee, retVal.ff, retVal.gg, retVal.hh, retVal.ii, (long)(intptr_t)retVal.jj,
		retVal.kk, retVal.ll, retVal.mm, retVal.nn, retVal.oo, retVal.pp,
	       retVal.qq, retVal.rr, retVal.ss, retVal.tt, retVal.uu, (long)(intptr_t)retVal.vv, retVal.ww, retVal.xx);

	return	retVal;
}

static void
cls_large_fn(ffi_cif* cif __UNUSED__, void* resp, void** args, void* userdata __UNUSED__)
{
	uint8_t		ui8_1	= *(uint8_t*)args[0];
	int8_t		si8_1	= *(int8_t*)args[1];
	uint16_t	ui16_1	= *(uint16_t*)args[2];
	int16_t		si16_1	= *(int16_t*)args[3];
	uint32_t	ui32_1	= *(uint32_t*)args[4];
	int32_t		si32_1	= *(int32_t*)args[5];
	uint64_t	ui64_1	= *(uint64_t*)args[6];
	int64_t		si64_1	= *(int64_t*)args[7];
	float		f_1		= *(float*)args[8];
	double		d_1		= *(double*)args[9];
	long double	ld_1	= *(long double*)args[10];
	char*		p_1		= *(char**)args[11];
	uint8_t		ui8_2	= *(uint8_t*)args[12];
	int8_t		si8_2	= *(int8_t*)args[13];
	uint16_t	ui16_2	= *(uint16_t*)args[14];
	int16_t		si16_2	= *(int16_t*)args[15];
	uint32_t	ui32_2	= *(uint32_t*)args[16];
	int32_t		si32_2	= *(int32_t*)args[17];
	uint64_t	ui64_2	= *(uint64_t*)args[18];
	int64_t		si64_2	= *(int64_t*)args[19];
	float		f_2		= *(float*)args[20];
	double		d_2		= *(double*)args[21];
	long double	ld_2	= *(long double*)args[22];
	char*		p_2		= *(char**)args[23];
	uint8_t		ui8_3	= *(uint8_t*)args[24];
	int8_t		si8_3	= *(int8_t*)args[25];
	uint16_t	ui16_3	= *(uint16_t*)args[26];
	int16_t		si16_3	= *(int16_t*)args[27];
	uint32_t	ui32_3	= *(uint32_t*)args[28];
	int32_t		si32_3	= *(int32_t*)args[29];
	uint64_t	ui64_3	= *(uint64_t*)args[30];
	int64_t		si64_3	= *(int64_t*)args[31];
	float		f_3		= *(float*)args[32];
	double		d_3		= *(double*)args[33];
	long double	ld_3	= *(long double*)args[34];
	char*		p_3		= *(char**)args[35];
	uint8_t		ui8_4	= *(uint8_t*)args[36];
	int8_t		si8_4	= *(int8_t*)args[37];
	uint16_t	ui16_4	= *(uint16_t*)args[38];
	int16_t		si16_4	= *(int16_t*)args[39];
	uint32_t	ui32_4	= *(uint32_t*)args[40];
	int32_t		si32_4	= *(int32_t*)args[41];
	uint64_t	ui64_4	= *(uint64_t*)args[42];
	int64_t		si64_4	= *(int64_t*)args[43];
	float		f_4		= *(float*)args[44];
	double		d_4		= *(double*)args[45];
	long double	ld_4	= *(long double*)args[46];
	char*		p_4		= *(char**)args[47];
	uint8_t		ui8_5	= *(uint8_t*)args[48];
	int8_t		si8_5	= *(int8_t*)args[49];

	*(BigStruct*)resp = test_large_fn(
		ui8_1, si8_1, ui16_1, si16_1, ui32_1, si32_1, ui64_1, si64_1, f_1, d_1, ld_1, p_1,
		ui8_2, si8_2, ui16_2, si16_2, ui32_2, si32_2, ui64_2, si64_2, f_2, d_2, ld_2, p_2,
		ui8_3, si8_3, ui16_3, si16_3, ui32_3, si32_3, ui64_3, si64_3, f_3, d_3, ld_3, p_3,
		ui8_4, si8_4, ui16_4, si16_4, ui32_4, si32_4, ui64_4, si64_4, f_4, d_4, ld_4, p_4,
		ui8_5, si8_5);
}

int
main(int argc __UNUSED__, const char** argv __UNUSED__)
{
        void *code;
	ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);

	ffi_cif		cif;
	ffi_type*	argTypes[51];
	void*		argValues[51];

	ffi_type	ret_struct_type;
	ffi_type*	st_fields[51];
	BigStruct	retVal;

	uint8_t		ui8		= 1;
	int8_t		si8		= 2;
	uint16_t	ui16	= 3;
	int16_t		si16	= 4;
	uint32_t	ui32	= 5;
	int32_t		si32	= 6;
	uint64_t	ui64	= 7;
	int64_t		si64	= 8;
	float		f		= 9;
	double		d		= 10;
	long double	ld		= 11;
	char*		p		= (char*)0x12345678;

	memset (&retVal, 0, sizeof(retVal));

	ret_struct_type.size = 0;
	ret_struct_type.alignment = 0;
	ret_struct_type.type = FFI_TYPE_STRUCT;
	ret_struct_type.elements = st_fields;

	st_fields[0]	= st_fields[12]	= st_fields[24]	= st_fields[36]	= st_fields[48]	= &ffi_type_uint8;
	st_fields[1]	= st_fields[13]	= st_fields[25]	= st_fields[37]	= st_fields[49]	= &ffi_type_sint8;
	st_fields[2]	= st_fields[14]	= st_fields[26]	= st_fields[38]	= &ffi_type_uint16;
	st_fields[3]	= st_fields[15]	= st_fields[27]	= st_fields[39]	= &ffi_type_sint16;
	st_fields[4]	= st_fields[16]	= st_fields[28]	= st_fields[40]	= &ffi_type_uint32;
	st_fields[5]	= st_fields[17]	= st_fields[29]	= st_fields[41]	= &ffi_type_sint32;
	st_fields[6]	= st_fields[18]	= st_fields[30]	= st_fields[42]	= &ffi_type_uint64;
	st_fields[7]	= st_fields[19]	= st_fields[31]	= st_fields[43]	= &ffi_type_sint64;
	st_fields[8]	= st_fields[20]	= st_fields[32]	= st_fields[44]	= &ffi_type_float;
	st_fields[9]	= st_fields[21]	= st_fields[33]	= st_fields[45]	= &ffi_type_double;
	st_fields[10]	= st_fields[22]	= st_fields[34]	= st_fields[46]	= &ffi_type_longdouble;
	st_fields[11]	= st_fields[23]	= st_fields[35]	= st_fields[47]	= &ffi_type_pointer;

	st_fields[50] = NULL;

	argTypes[0]		= argTypes[12]	= argTypes[24]	= argTypes[36]	= argTypes[48]	= &ffi_type_uint8;
	argValues[0]	= argValues[12]	= argValues[24]	= argValues[36]	= argValues[48]	= &ui8;
	argTypes[1]		= argTypes[13]	= argTypes[25]	= argTypes[37]	= argTypes[49]	= &ffi_type_sint8;
	argValues[1]	= argValues[13]	= argValues[25]	= argValues[37]	= argValues[49]	= &si8;
	argTypes[2]		= argTypes[14]	= argTypes[26]	= argTypes[38]	= &ffi_type_uint16;
	argValues[2]	= argValues[14]	= argValues[26]	= argValues[38]	= &ui16;
	argTypes[3]		= argTypes[15]	= argTypes[27]	= argTypes[39]	= &ffi_type_sint16;
	argValues[3]	= argValues[15]	= argValues[27]	= argValues[39]	= &si16;
	argTypes[4]		= argTypes[16]	= argTypes[28]	= argTypes[40]	= &ffi_type_uint32;
	argValues[4]	= argValues[16]	= argValues[28]	= argValues[40]	= &ui32;
	argTypes[5]		= argTypes[17]	= argTypes[29]	= argTypes[41]	= &ffi_type_sint32;
	argValues[5]	= argValues[17]	= argValues[29]	= argValues[41]	= &si32;
	argTypes[6]		= argTypes[18]	= argTypes[30]	= argTypes[42]	= &ffi_type_uint64;
	argValues[6]	= argValues[18]	= argValues[30]	= argValues[42]	= &ui64;
	argTypes[7]		= argTypes[19]	= argTypes[31]	= argTypes[43]	= &ffi_type_sint64;
	argValues[7]	= argValues[19]	= argValues[31]	= argValues[43]	= &si64;
	argTypes[8]		= argTypes[20]	= argTypes[32]	= argTypes[44]	= &ffi_type_float;
	argValues[8]	= argValues[20]	= argValues[32]	= argValues[44]	= &f;
	argTypes[9]		= argTypes[21]	= argTypes[33]	= argTypes[45]	= &ffi_type_double;
	argValues[9]	= argValues[21]	= argValues[33]	= argValues[45]	= &d;
	argTypes[10]	= argTypes[22]	= argTypes[34]	= argTypes[46]	= &ffi_type_longdouble;
	argValues[10]	= argValues[22]	= argValues[34]	= argValues[46]	= &ld;
	argTypes[11]	= argTypes[23]	= argTypes[35]	= argTypes[47]	= &ffi_type_pointer;
	argValues[11]	= argValues[23]	= argValues[35]	= argValues[47]	= &p;

	argTypes[50]	= NULL;
	argValues[50]	= NULL;

	CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 50, &ret_struct_type, argTypes) == FFI_OK);

	ffi_call(&cif, FFI_FN(test_large_fn), &retVal, argValues);
	/* { dg-output "1 2 3 4 5 6 7 8 9 10 11 0x12345678 1 2 3 4 5 6 7 8 9 10 11 0x12345678 1 2 3 4 5 6 7 8 9 10 11 0x12345678 1 2 3 4 5 6 7 8 9 10 11 0x12345678 1 2: 2 3 4 5 6 7 8 9 10 11 12 0x12345679 3 4 5 6 7 8 9 10 11 12 13 0x1234567a 4 5 6 7 8 9 10 11 12 13 14 0x1234567b 5 6 7 8 9 10 11 12 13 14 15 0x1234567c 6 7" } */
	printf("res: %" PRIu8 " %" PRId8 " %hu %hd %u %d %" PRIu64 " %" PRId64 " %.0f %.0f %.0Lf %#lx "
		"%" PRIu8 " %" PRId8 " %hu %hd %u %d %" PRIu64 " %" PRId64 " %.0f %.0f %.0Lf %#lx "
		"%" PRIu8 " %" PRId8 " %hu %hd %u %d %" PRIu64 " %" PRId64 " %.0f %.0f %.0Lf %#lx "
		"%" PRIu8 " %" PRId8 " %hu %hd %u %d %" PRIu64 " %" PRId64 " %.0f %.0f %.0Lf %#lx %" PRIu8 " %" PRId8 "\n",
		retVal.a, retVal.b, retVal.c, retVal.d, retVal.e, retVal.f,
	       retVal.g, retVal.h, retVal.i, retVal.j, retVal.k, (long)(intptr_t)retVal.l,
		retVal.m, retVal.n, retVal.o, retVal.p, retVal.q, retVal.r,
	       retVal.s, retVal.t, retVal.u, retVal.v, retVal.w, (long)(intptr_t)retVal.x,
		retVal.y, retVal.z, retVal.aa, retVal.bb, retVal.cc, retVal.dd,
	       retVal.ee, retVal.ff, retVal.gg, retVal.hh, retVal.ii, (long)(intptr_t)retVal.jj,
		retVal.kk, retVal.ll, retVal.mm, retVal.nn, retVal.oo, retVal.pp,
	       retVal.qq, retVal.rr, retVal.ss, retVal.tt, retVal.uu, (long)(intptr_t)retVal.vv, retVal.ww, retVal.xx);
	/* { dg-output "\nres: 2 3 4 5 6 7 8 9 10 11 12 0x12345679 3 4 5 6 7 8 9 10 11 12 13 0x1234567a 4 5 6 7 8 9 10 11 12 13 14 0x1234567b 5 6 7 8 9 10 11 12 13 14 15 0x1234567c 6 7" } */

	CHECK(ffi_prep_closure_loc(pcl, &cif, cls_large_fn, NULL, code) == FFI_OK);

	retVal	= ((BigStruct(*)(
		uint8_t, int8_t, uint16_t, int16_t, uint32_t, int32_t, uint64_t, int64_t, float, double, long double, char*,
		uint8_t, int8_t, uint16_t, int16_t, uint32_t, int32_t, uint64_t, int64_t, float, double, long double, char*,
		uint8_t, int8_t, uint16_t, int16_t, uint32_t, int32_t, uint64_t, int64_t, float, double, long double, char*,
		uint8_t, int8_t, uint16_t, int16_t, uint32_t, int32_t, uint64_t, int64_t, float, double, long double, char*,
		uint8_t, int8_t))(code))(
		ui8, si8, ui16, si16, ui32, si32, ui64, si64, f, d, ld, p,
		ui8, si8, ui16, si16, ui32, si32, ui64, si64, f, d, ld, p,
		ui8, si8, ui16, si16, ui32, si32, ui64, si64, f, d, ld, p,
		ui8, si8, ui16, si16, ui32, si32, ui64, si64, f, d, ld, p,
		ui8, si8);
	/* { dg-output "\n1 2 3 4 5 6 7 8 9 10 11 0x12345678 1 2 3 4 5 6 7 8 9 10 11 0x12345678 1 2 3 4 5 6 7 8 9 10 11 0x12345678 1 2 3 4 5 6 7 8 9 10 11 0x12345678 1 2: 2 3 4 5 6 7 8 9 10 11 12 0x12345679 3 4 5 6 7 8 9 10 11 12 13 0x1234567a 4 5 6 7 8 9 10 11 12 13 14 0x1234567b 5 6 7 8 9 10 11 12 13 14 15 0x1234567c 6 7" } */
	printf("res: %" PRIu8 " %" PRId8 " %hu %hd %u %d %" PRIu64 " %" PRId64 " %.0f %.0f %.0Lf %#lx "
		"%" PRIu8 " %" PRId8 " %hu %hd %u %d %" PRIu64 " %" PRId64 " %.0f %.0f %.0Lf %#lx "
		"%" PRIu8 " %" PRId8 " %hu %hd %u %d %" PRIu64 " %" PRId64 " %.0f %.0f %.0Lf %#lx "
		"%" PRIu8 " %" PRId8 " %hu %hd %u %d %" PRIu64 " %" PRId64 " %.0f %.0f %.0Lf %#lx %" PRIu8 " %" PRId8 "\n",
		retVal.a, retVal.b, retVal.c, retVal.d, retVal.e, retVal.f,
	       retVal.g, retVal.h, retVal.i, retVal.j, retVal.k, (long)(intptr_t)retVal.l,
		retVal.m, retVal.n, retVal.o, retVal.p, retVal.q, retVal.r,
	       retVal.s, retVal.t, retVal.u, retVal.v, retVal.w, (long)(intptr_t)retVal.x,
		retVal.y, retVal.z, retVal.aa, retVal.bb, retVal.cc, retVal.dd,
	       retVal.ee, retVal.ff, retVal.gg, retVal.hh, retVal.ii, (long)(intptr_t)retVal.jj,
		retVal.kk, retVal.ll, retVal.mm, retVal.nn, retVal.oo, retVal.pp,
	       retVal.qq, retVal.rr, retVal.ss, retVal.tt, retVal.uu, (long)(intptr_t)retVal.vv, retVal.ww, retVal.xx);
	/* { dg-output "\nres: 2 3 4 5 6 7 8 9 10 11 12 0x12345679 3 4 5 6 7 8 9 10 11 12 13 0x1234567a 4 5 6 7 8 9 10 11 12 13 14 0x1234567b 5 6 7 8 9 10 11 12 13 14 15 0x1234567c 6 7" } */

    return 0;
}
