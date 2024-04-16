/* Area:	ffi_call
   Purpose:	Check different structures.
   Limitations:	none.
   PR:		none.
   Originator:	Ronald Oussoren <oussoren@cistron.nl> 20030824	*/

/* { dg-do run } */
#include "ffitest.h"

typedef struct Point {
	float x;
	float y;
} Point;

typedef struct Size {
	float h;
	float w;
} Size;

typedef struct Rect {
	Point o;
	Size  s;
} Rect;

int doit(int o, char* s, Point p, Rect r, int last)
{
	printf("CALLED WITH %d %s {%f %f} {{%f %f} {%f %f}} %d\n",
		o, s, p.x, p.y, r.o.x, r.o.y, r.s.h, r.s.w, last);
	return 42;
}


int main(void)
{
	ffi_type point_type;
	ffi_type size_type;
	ffi_type rect_type;
	ffi_cif cif;
	ffi_type* arglist[6];
	void* values[6];
	int r;

	/*
	 *  First set up FFI types for the 3 struct types
	 */

	point_type.size = 0; /*sizeof(Point);*/
	point_type.alignment = 0; /*__alignof__(Point);*/
	point_type.type = FFI_TYPE_STRUCT;
	point_type.elements = malloc(3 * sizeof(ffi_type*));
	point_type.elements[0] = &ffi_type_float;
	point_type.elements[1] = &ffi_type_float;
	point_type.elements[2] = NULL;

	size_type.size = 0;/* sizeof(Size);*/
	size_type.alignment = 0;/* __alignof__(Size);*/
	size_type.type = FFI_TYPE_STRUCT;
	size_type.elements = malloc(3 * sizeof(ffi_type*));
	size_type.elements[0] = &ffi_type_float;
	size_type.elements[1] = &ffi_type_float;
	size_type.elements[2] = NULL;

	rect_type.size = 0;/*sizeof(Rect);*/
	rect_type.alignment =0;/* __alignof__(Rect);*/
	rect_type.type = FFI_TYPE_STRUCT;
	rect_type.elements = malloc(3 * sizeof(ffi_type*));
	rect_type.elements[0] = &point_type;
	rect_type.elements[1] = &size_type;
	rect_type.elements[2] = NULL;

	/*
	 * Create a CIF
	 */
	arglist[0] = &ffi_type_sint;
	arglist[1] = &ffi_type_pointer;
	arglist[2] = &point_type;
	arglist[3] = &rect_type;
	arglist[4] = &ffi_type_sint;
	arglist[5] = NULL;

	r = ffi_prep_cif(&cif, FFI_DEFAULT_ABI,
			5, &ffi_type_sint, arglist);
	if (r != FFI_OK) {
		abort();
	}


	/* And call the function through the CIF */

	{
	Point p = { 1.0, 2.0 };
	Rect  r = { { 9.0, 10.0}, { -1.0, -2.0 } };
	int   o = 0;
	int   l = 42;
	char* m = "myMethod";
	ffi_arg result;

	values[0] = &o;
	values[1] = &m;
	values[2] = &p;
	values[3] = &r;
	values[4] = &l;
	values[5] = NULL;

	printf("CALLING WITH %d %s {%f %f} {{%f %f} {%f %f}} %d\n",
		o, m, p.x, p.y, r.o.x, r.o.y, r.s.h, r.s.w, l);

	ffi_call(&cif, FFI_FN(doit), &result, values);

	printf ("The result is %d\n", (int)result);

	}
	exit(0);
}
