/* Area:	ffi_call
   Purpose:	Reproduce bug found in python ctypes
   Limitations:	none.
   PR:		Fedora 1174037  */

/* { dg-do run } */
#include "ffitest.h"

typedef struct {
  long x;
  long y;
} POINT;

typedef struct {
  long left;
  long top;
  long right;
  long bottom;
} RECT;

static RECT ABI_ATTR pr_test(int i __UNUSED__, RECT ar __UNUSED__, 
			     RECT* br __UNUSED__, POINT cp __UNUSED__, 
			     RECT dr __UNUSED__, RECT *er __UNUSED__, 
			     POINT fp, RECT gr __UNUSED__)
{
  RECT result;

  result.left = fp.x;
  result.right = fp.y;
  result.top = fp.x;
  result.bottom = fp.y;

  return result;
}

int main (void)
{
  ffi_cif cif;
  ffi_type *args[MAX_ARGS];
  void *values[MAX_ARGS];
  ffi_type point_type, rect_type;
  ffi_type *point_type_elements[3];  
  ffi_type *rect_type_elements[5];  
  
  int i;
  POINT cp, fp;
  RECT ar, br, dr, er, gr; 
  RECT *p1, *p2;

  /* This is a hack to get a properly aligned result buffer */
  RECT *rect_result =
    (RECT *) malloc (sizeof(RECT));

  point_type.size = 0;
  point_type.alignment = 0;
  point_type.type = FFI_TYPE_STRUCT;
  point_type.elements = point_type_elements;
  point_type_elements[0] = &ffi_type_slong;
  point_type_elements[1] = &ffi_type_slong;
  point_type_elements[2] = NULL;

  rect_type.size = 0;
  rect_type.alignment = 0;
  rect_type.type = FFI_TYPE_STRUCT;
  rect_type.elements = rect_type_elements;
  rect_type_elements[0] = &ffi_type_slong;
  rect_type_elements[1] = &ffi_type_slong;
  rect_type_elements[2] = &ffi_type_slong;
  rect_type_elements[3] = &ffi_type_slong;
  rect_type_elements[4] = NULL;

  args[0] = &ffi_type_sint;
  args[1] = &rect_type;
  args[2] = &ffi_type_pointer;
  args[3] = &point_type;
  args[4] = &rect_type;
  args[5] = &ffi_type_pointer;
  args[6] = &point_type;
  args[7] = &rect_type;
  
  /* Initialize the cif */
  CHECK(ffi_prep_cif(&cif, ABI_NUM, 8, &rect_type, args) == FFI_OK);

  i = 1;
  ar.left = 2;
  ar.right = 3;
  ar.top = 4;
  ar.bottom = 5;
  br.left = 6;
  br.right = 7;
  br.top = 8;
  br.bottom = 9;
  cp.x = 10;
  cp.y = 11;
  dr.left = 12;
  dr.right = 13;
  dr.top = 14;
  dr.bottom = 15;
  er.left = 16;
  er.right = 17;
  er.top = 18;
  er.bottom = 19;
  fp.x = 20;
  fp.y = 21;
  gr.left = 22;
  gr.right = 23;
  gr.top = 24;
  gr.bottom = 25;
  
  values[0] = &i;
  values[1] = &ar;
  p1 = &br;
  values[2] = &p1;
  values[3] = &cp;
  values[4] = &dr;
  p2 = &er;
  values[5] = &p2;
  values[6] = &fp;
  values[7] = &gr;

  ffi_call (&cif, FFI_FN(pr_test), rect_result, values);
  
  CHECK(rect_result->top == 20);
 
  free (rect_result);
  exit(0);
}
