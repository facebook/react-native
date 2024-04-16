## Process this file with automake to produce Makefile.in.

AUTOMAKE_OPTIONS = foreign dejagnu

EXTRA_DEJAGNU_SITE_CONFIG=../local.exp

CLEANFILES = *.exe core* *.log *.sum

EXTRA_DIST = config/default.exp lib/libffi.exp lib/target-libpath.exp	\
lib/wrapper.exp libffi.bhaible/Makefile libffi.bhaible/README		\
libffi.bhaible/alignof.h libffi.bhaible/bhaible.exp			\
libffi.bhaible/test-call.c libffi.bhaible/test-callback.c		\
libffi.bhaible/testcases.c libffi.call/align_mixed.c			\
libffi.call/align_stdcall.c libffi.call/call.exp			\
libffi.call/err_bad_typedef.c libffi.call/ffitest.h			\
libffi.call/float.c libffi.call/float1.c libffi.call/float2.c		\
libffi.call/float3.c libffi.call/float4.c libffi.call/float_va.c	\
libffi.call/many.c libffi.call/many2.c libffi.call/many_double.c	\
libffi.call/many_mixed.c libffi.call/negint.c libffi.call/offsets.c	\
libffi.call/pr1172638.c libffi.call/promotion.c				\
libffi.call/pyobjc_tc.c libffi.call/return_dbl.c			\
libffi.call/return_dbl1.c libffi.call/return_dbl2.c			\
libffi.call/return_fl.c libffi.call/return_fl1.c                        \
libffi.call/return_fl2.c libffi.call/return_fl3.c                       \
libffi.call/return_ldl.c libffi.call/return_ll.c                        \
libffi.call/return_ll1.c libffi.call/return_sc.c                        \
libffi.call/return_sl.c libffi.call/return_uc.c                         \
libffi.call/return_ul.c libffi.call/struct1.c libffi.call/struct10.c    \
libffi.call/struct2.c libffi.call/struct3.c libffi.call/struct4.c       \
libffi.call/struct5.c libffi.call/struct6.c libffi.call/struct7.c       \
libffi.call/struct8.c libffi.call/struct9.c                             \
libffi.call/uninitialized.c libffi.call/va_1.c libffi.call/va_2.c       \
libffi.call/va_3.c libffi.call/va_struct1.c libffi.call/va_struct2.c    \
libffi.call/va_struct3.c libffi.call/struct_by_value_big.c              \
libffi.call/struct_return_8H.c libffi.call/struct_return_2H.c           \
libffi.call/struct_by_value_2.c libffi.call/struct_by_value_3.c         \
libffi.call/struct_by_value_4.c libffi.call/struct_by_value_small.c     \
libffi.call/strlen2.c libffi.call/strlen3.c libffi.call/strlen4.c       \
libffi.call/strlen.c libffi.call/va_3.c                                 \
libffi.call/struct_by_value_2.c libffi.call/struct_by_value_3.c         \
libffi.call/struct_by_value_4.c libffi.closures/closure.exp             \
libffi.call/struct_by_value_3f.c libffi.call/struct_by_value_4f.c       \
libffi.call/s55.c libffi.call/bpo-38748.c                               \
libffi.closures/closure_fn0.c libffi.closures/closure_fn1.c             \
libffi.closures/closure_fn2.c libffi.closures/closure_fn3.c             \
libffi.closures/closure_fn4.c libffi.closures/closure_fn5.c             \
libffi.closures/closure_fn6.c libffi.closures/closure_loc_fn0.c         \
libffi.closures/closure_simple.c libffi.closures/cls_12byte.c           \
libffi.closures/cls_16byte.c libffi.closures/cls_18byte.c               \
libffi.closures/cls_19byte.c libffi.closures/cls_1_1byte.c              \
libffi.closures/cls_20byte.c libffi.closures/cls_20byte1.c              \
libffi.closures/cls_24byte.c libffi.closures/cls_2byte.c                \
libffi.closures/cls_3_1byte.c libffi.closures/cls_3byte1.c              \
libffi.closures/cls_3byte2.c libffi.closures/cls_3float.c               \
libffi.closures/cls_4_1byte.c libffi.closures/cls_4byte.c               \
libffi.closures/cls_5_1_byte.c libffi.closures/cls_5byte.c              \
libffi.closures/cls_64byte.c libffi.closures/cls_6_1_byte.c             \
libffi.closures/cls_6byte.c libffi.closures/cls_7_1_byte.c              \
libffi.closures/cls_7byte.c libffi.closures/cls_8byte.c                 \
libffi.closures/cls_9byte1.c libffi.closures/cls_9byte2.c               \
libffi.closures/cls_align_double.c libffi.closures/cls_align_float.c    \
libffi.closures/cls_align_longdouble.c                                  \
libffi.closures/cls_align_pointer.c                                     \
libffi.closures/cls_align_sint16.c libffi.closures/cls_align_sint32.c   \
libffi.closures/cls_align_sint64.c libffi.closures/cls_align_uint16.c   \
libffi.closures/cls_align_uint32.c libffi.closures/cls_align_uint64.c   \
libffi.closures/cls_dbls_struct.c libffi.closures/cls_double.c          \
libffi.closures/cls_double_va.c libffi.closures/cls_float.c             \
libffi.closures/cls_longdouble_va.c                                     \
libffi.closures/cls_many_mixed_args.c                                   \
libffi.closures/cls_many_mixed_float_double.c                           \
libffi.closures/cls_multi_schar.c libffi.closures/cls_multi_sshort.c    \
libffi.closures/cls_multi_sshortchar.c                                  \
libffi.closures/cls_multi_uchar.c libffi.closures/cls_multi_ushort.c    \
libffi.closures/cls_multi_ushortchar.c libffi.closures/cls_pointer.c    \
libffi.closures/cls_pointer_stack.c libffi.closures/cls_schar.c         \
libffi.closures/cls_sint.c libffi.closures/cls_sshort.c                 \
libffi.closures/cls_struct_va1.c libffi.closures/cls_uchar.c            \
libffi.closures/cls_uint.c libffi.closures/cls_uint_va.c                \
libffi.closures/cls_ulong_va.c libffi.closures/cls_ulonglong.c          \
libffi.closures/cls_ushort.c libffi.closures/err_bad_abi.c              \
libffi.closures/ffitest.h libffi.closures/nested_struct.c               \
libffi.closures/nested_struct1.c libffi.closures/nested_struct10.c      \
libffi.closures/nested_struct11.c libffi.closures/nested_struct12.c     \
libffi.closures/nested_struct13.c libffi.closures/nested_struct2.c      \
libffi.closures/nested_struct3.c libffi.closures/nested_struct4.c       \
libffi.closures/nested_struct5.c libffi.closures/nested_struct6.c       \
libffi.closures/nested_struct7.c libffi.closures/nested_struct8.c       \
libffi.closures/nested_struct9.c libffi.closures/problem1.c             \
libffi.closures/single_entry_structs1.c                                 \
libffi.closures/single_entry_structs2.c                                 \
libffi.closures/single_entry_structs3.c libffi.closures/stret_large.c   \
libffi.closures/stret_large2.c libffi.closures/stret_medium.c           \
libffi.closures/stret_medium2.c libffi.closures/testclosure.c           \
libffi.closures/unwindtest.cc libffi.closures/unwindtest_ffi_call.cc    \
libffi.closures/cls_align_longdouble_split.c                            \
libffi.closures/cls_align_longdouble_split2.c                           \
libffi.closures/cls_longdouble.c libffi.closures/huge_struct.c          \
libffi.complex/cls_align_complex.inc                                    \
libffi.complex/cls_align_complex_double.c                               \
libffi.complex/cls_align_complex_float.c                                \
libffi.complex/cls_align_complex_longdouble.c                           \
libffi.complex/cls_complex.inc libffi.complex/cls_complex_double.c      \
libffi.complex/cls_complex_float.c                                      \
libffi.complex/cls_complex_longdouble.c                                 \
libffi.complex/cls_complex_struct.inc                                   \
libffi.complex/cls_complex_struct_double.c                              \
libffi.complex/cls_complex_struct_float.c                               \
libffi.complex/cls_complex_struct_longdouble.c                          \
libffi.complex/cls_complex_va.inc                                       \
libffi.complex/cls_complex_va_double.c                                  \
libffi.complex/cls_complex_va_float.c                                   \
libffi.complex/cls_complex_va_longdouble.c libffi.complex/complex.exp   \
libffi.complex/complex.inc libffi.complex/complex_defs_double.inc       \
libffi.complex/complex_defs_float.inc                                   \
libffi.complex/complex_defs_longdouble.inc                              \
libffi.complex/complex_double.c libffi.complex/complex_float.c          \
libffi.complex/complex_int.c libffi.complex/complex_longdouble.c        \
libffi.complex/ffitest.h libffi.complex/many_complex.inc                \
libffi.complex/many_complex_double.c                                    \
libffi.complex/many_complex_float.c                                     \
libffi.complex/many_complex_longdouble.c                                \
libffi.complex/return_complex.inc libffi.complex/return_complex1.inc    \
libffi.complex/return_complex1_double.c                                 \
libffi.complex/return_complex1_float.c                                  \
libffi.complex/return_complex1_longdouble.c                             \
libffi.complex/return_complex2.inc                                      \
libffi.complex/return_complex2_double.c                                 \
libffi.complex/return_complex2_float.c                                  \
libffi.complex/return_complex2_longdouble.c                             \
libffi.complex/return_complex_double.c                                  \
libffi.complex/return_complex_float.c                                   \
libffi.complex/return_complex_longdouble.c libffi.go/aa-direct.c        \
libffi.go/closure1.c libffi.go/ffitest.h libffi.go/go.exp               \
libffi.go/static-chain.h
