/* Area:		ffi_prep_cif, ffi_prep_closure
   Purpose:		Test error return for bad ABIs.
   Limitations:	none.
   PR:			none.
   Originator:	Blake Chaffin 6/6/2007	 */

/* { dg-do run } */

#include "ffitest.h"

static void
dummy_fn(ffi_cif* cif __UNUSED__, void* resp __UNUSED__, 
	 void** args __UNUSED__, void* userdata __UNUSED__)
{}

int main (void)
{
	ffi_cif cif;
        void *code;
	ffi_closure *pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
	ffi_type* arg_types[1];

	arg_types[0] = NULL;

	CHECK(ffi_prep_cif(&cif, 255, 0, &ffi_type_void,
		arg_types) == FFI_BAD_ABI);

	CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 0, &ffi_type_void,
		arg_types) == FFI_OK);

	cif.abi= 255;

	CHECK(ffi_prep_closure_loc(pcl, &cif, dummy_fn, NULL, code) == FFI_BAD_ABI);

	exit(0);
}
