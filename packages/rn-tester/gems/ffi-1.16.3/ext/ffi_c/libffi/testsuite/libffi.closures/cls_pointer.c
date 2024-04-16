/* Area:		ffi_call, closure_call
   Purpose:		Check pointer arguments.
   Limitations:	none.
   PR:			none.
   Originator:	Blake Chaffin 6/6/2007	*/

/* { dg-do run { xfail strongarm*-*-* xscale*-*-* } } */
#include "ffitest.h"

void* cls_pointer_fn(void* a1, void* a2)
{
	void*	result	= (void*)((intptr_t)a1 + (intptr_t)a2);

	printf("0x%08x 0x%08x: 0x%08x\n", 
	       (unsigned int)(uintptr_t) a1,
               (unsigned int)(uintptr_t) a2,
               (unsigned int)(uintptr_t) result);

	CHECK((unsigned int)(uintptr_t) a1 == 0x12345678);
	CHECK((unsigned int)(uintptr_t) a2 == 0x89abcdef);
	CHECK((unsigned int)(uintptr_t) result == 0x9be02467);

	return result;
}

static void
cls_pointer_gn(ffi_cif* cif __UNUSED__, void* resp, 
	       void** args, void* userdata __UNUSED__)
{
	void*	a1	= *(void**)(args[0]);
	void*	a2	= *(void**)(args[1]);

	*(void**)resp = cls_pointer_fn(a1, a2);
}

int main (void)
{
	ffi_cif	cif;
        void *code;
	ffi_closure*	pcl = ffi_closure_alloc(sizeof(ffi_closure), &code);
	void*			args[3];
	/*	ffi_type		cls_pointer_type; */
	ffi_type*		arg_types[3];

/*	cls_pointer_type.size = sizeof(void*);
	cls_pointer_type.alignment = 0;
	cls_pointer_type.type = FFI_TYPE_POINTER;
	cls_pointer_type.elements = NULL;*/

	void*	arg1	= (void*)0x12345678;
	void*	arg2	= (void*)0x89abcdef;
	ffi_arg	res		= 0;

	arg_types[0] = &ffi_type_pointer;
	arg_types[1] = &ffi_type_pointer;
	arg_types[2] = NULL;

	CHECK(ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 2, &ffi_type_pointer,
		arg_types) == FFI_OK);

	args[0] = &arg1;
	args[1] = &arg2;
	args[2] = NULL;

	ffi_call(&cif, FFI_FN(cls_pointer_fn), &res, args);
	/* { dg-output "0x12345678 0x89abcdef: 0x9be02467" } */
	printf("res: 0x%08x\n", (unsigned int) res);
	/* { dg-output "\nres: 0x9be02467" } */

	CHECK(ffi_prep_closure_loc(pcl, &cif, cls_pointer_gn, NULL, code) == FFI_OK);

	res = (ffi_arg)(uintptr_t)((void*(*)(void*, void*))(code))(arg1, arg2);
	/* { dg-output "\n0x12345678 0x89abcdef: 0x9be02467" } */
	printf("res: 0x%08x\n", (unsigned int) res);
	/* { dg-output "\nres: 0x9be02467" } */
	CHECK(res == 0x9be02467);

	exit(0);
}
