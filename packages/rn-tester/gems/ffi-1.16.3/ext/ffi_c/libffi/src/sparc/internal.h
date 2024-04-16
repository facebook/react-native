#define SPARC_RET_VOID		0
#define SPARC_RET_STRUCT	1
#define SPARC_RET_UINT8		2
#define SPARC_RET_SINT8		3
#define SPARC_RET_UINT16	4
#define SPARC_RET_SINT16	5
#define SPARC_RET_UINT32	6
#define SP_V9_RET_SINT32	7	/* v9 only */
#define SP_V8_RET_CPLX16	7	/* v8 only */
#define SPARC_RET_INT64		8
#define SPARC_RET_INT128	9

/* Note that F_7 is missing, and is handled by SPARC_RET_STRUCT.  */
#define SPARC_RET_F_8		10
#define SPARC_RET_F_6		11
#define SPARC_RET_F_4		12
#define SPARC_RET_F_2		13
#define SP_V9_RET_F_3		14	/* v9 only */
#define SP_V8_RET_CPLX8		14	/* v8 only */
#define SPARC_RET_F_1		15

#define SPARC_FLAG_RET_MASK	15
#define SPARC_FLAG_RET_IN_MEM	32
#define SPARC_FLAG_FP_ARGS	64

#define SPARC_SIZEMASK_SHIFT	8
