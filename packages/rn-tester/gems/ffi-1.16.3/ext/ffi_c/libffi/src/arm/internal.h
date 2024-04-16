#define ARM_TYPE_VFP_S	0
#define ARM_TYPE_VFP_D	1
#define ARM_TYPE_VFP_N	2
#define ARM_TYPE_INT64	3
#define ARM_TYPE_INT	4
#define ARM_TYPE_VOID	5
#define ARM_TYPE_STRUCT	6

#if defined(FFI_EXEC_STATIC_TRAMP)
/*
 * For the trampoline table mapping, a mapping size of 4K (base page size)
 * is chosen.
 */
#define ARM_TRAMP_MAP_SHIFT	12
#define ARM_TRAMP_MAP_SIZE	(1 << ARM_TRAMP_MAP_SHIFT)
#define ARM_TRAMP_SIZE		20
#endif
