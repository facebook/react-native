/* Area:	ffi_call
   Purpose:	Check nested float struct.
   Limitations:	none.
   PR:		none.
   Originator:	Cheng Jin <jincheng@ca.ibm.com>  */

/* { dg-do run } */
#include "ffitest.h"

typedef struct stru_FF stru_FF;
typedef struct stru_Nested_F stru_Nested_F;

struct stru_FF {
	float elem1;
	float elem2;
};

struct stru_Nested_F {
	float elem1;
	stru_FF elem2;
};

static float testNestedFloatStruct(float arg1, stru_Nested_F arg2)
{
	float floatSum = arg1 + arg2.elem1 + arg2.elem2.elem1 + arg2.elem2.elem2;
	return floatSum;
}

int main (void)
{
	float ts12_result = 0;
	int structElemNum = 2;
	int nestedStructElemNum = 2;
	int argNum = 2;

	ffi_cif cif;
	ffi_type **struct_float1 = (ffi_type **)malloc(sizeof(ffi_type *) * (structElemNum + 1));
	ffi_type **struct_float2 = (ffi_type **)malloc(sizeof(ffi_type *) * (nestedStructElemNum + 1));
	ffi_type **args = (ffi_type **)malloc(sizeof(ffi_type *) * (argNum + 1));
	void **values = (void **)malloc(sizeof(void *) * (argNum + 1));
	ffi_type struct_float_type1, struct_float_type2;
	ffi_type *retType = &ffi_type_float;
	float arg1;
	float *arg2 = (float *)malloc(sizeof(stru_Nested_F));

	struct_float2[0] = &ffi_type_float;
	struct_float2[1] = &ffi_type_float;
	struct_float2[2] = NULL;

	struct_float_type2.size = 0;
	struct_float_type2.alignment = 0;
	struct_float_type2.type = FFI_TYPE_STRUCT;
	struct_float_type2.elements = struct_float2;

	struct_float1[0] = &ffi_type_float;
	struct_float1[1] = &struct_float_type2;
	struct_float1[2] = NULL;

	struct_float_type1.size = 0;
	struct_float_type1.alignment = 0;
	struct_float_type1.type = FFI_TYPE_STRUCT;
	struct_float_type1.elements = struct_float1;

	args[0] = &ffi_type_float;
	args[1] = &struct_float_type1;
	args[2] = NULL;

	arg1 = 37.88;
	arg2[0] = 31.22;
	arg2[1] = 33.44;
	arg2[2] = 35.66;
	values[0] = &arg1;
	values[1] = arg2;
	values[2] = NULL;

	CHECK( ffi_prep_cif(&cif, FFI_DEFAULT_ABI, 2, retType, args) == FFI_OK);
	ffi_call(&cif, FFI_FN(testNestedFloatStruct), &ts12_result, values);
	CHECK_FLOAT_EQ(ts12_result, 138.2f);

	free(struct_float1);
	free(struct_float2);
	free(args);
	free(values);

	exit(0);
}
