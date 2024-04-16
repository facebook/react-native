/* Area:	closure_call
   Purpose:	Check register allocation for closure calls with many float and double arguments
   Limitations:	none.
   PR:		none.
   Originator:	<david.schneider@picle.org> */

/* { dg-do run } */
#include "ffitest.h"
#include <float.h>
#include <math.h>

#define NARGS 16

static void cls_mixed_float_double_fn(ffi_cif* cif , void* ret, void** args,
			      void* userdata __UNUSED__)
{
    double r = 0;
    unsigned int i;
    double t;
    for(i=0; i < cif->nargs; i++)
    {
        if(cif->arg_types[i] == &ffi_type_double) {
				t = *(((double**)(args))[i]);
        } else {
				t = *(((float**)(args))[i]);
        }
        r += t;
    }
    *((double*)ret) = r;
}
typedef double (*cls_mixed)(double, float, double, double, double, double, double, float, float, double, float, float);

int main (void)
{
    ffi_cif cif;
    ffi_closure *closure;
	void* code;
    ffi_type *argtypes[12] = {&ffi_type_double, &ffi_type_float, &ffi_type_double,
                          &ffi_type_double, &ffi_type_double, &ffi_type_double,
                          &ffi_type_double, &ffi_type_float, &ffi_type_float,
                          &ffi_type_double, &ffi_type_float, &ffi_type_float};


    closure = ffi_closure_alloc(sizeof(ffi_closure), (void**)&code);
    if(closure ==NULL)
		abort();
    CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 12, &ffi_type_double, argtypes) == FFI_OK);
	CHECK(ffi_prep_closure_loc(closure, &cif, cls_mixed_float_double_fn, NULL,  code) == FFI_OK);
    double ret = ((cls_mixed)code)(0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0, 1.1, 1.2);
    ffi_closure_free(closure);
	if(fabs(ret - 7.8) < FLT_EPSILON)
		exit(0);
	else
		abort();
}
