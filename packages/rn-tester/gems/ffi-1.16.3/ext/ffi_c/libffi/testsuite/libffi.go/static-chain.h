#ifdef __aarch64__
# define STATIC_CHAIN_REG  "x18"
#elif defined(__alpha__)
# define STATIC_CHAIN_REG  "$1"
#elif defined(__arm__)
# define STATIC_CHAIN_REG  "ip"
#elif defined(__sparc__)
# if defined(__arch64__) || defined(__sparcv9)
#  define STATIC_CHAIN_REG "g5"
# else
#  define STATIC_CHAIN_REG "g2"
# endif
#elif defined(__x86_64__)
# define STATIC_CHAIN_REG  "r10"
#elif defined(__i386__)
# ifndef ABI_NUM
#  define STATIC_CHAIN_REG  "ecx"	/* FFI_DEFAULT_ABI only */
# endif
#endif
