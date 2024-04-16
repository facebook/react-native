/*
 * Copyright (c) 1987, Fujitsu LTD. (Itaru ICHIKAWA).
 * Copyright (c) 1996-2018, The nkf Project.
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 * 1. The origin of this software must not be misrepresented; you must not
 * claim that you wrote the original software. If you use this software
 * in a product, an acknowledgment in the product documentation would be
 * appreciated but is not required.
 *
 * 2. Altered source versions must be plainly marked as such, and must not be
 * misrepresented as being the original software.
 *
 * 3. This notice may not be removed or altered from any source distribution.
 */
#define NKF_VERSION "2.1.5"
#define NKF_RELEASE_DATE "2018-12-15"
#define COPY_RIGHT \
    "Copyright (C) 1987, FUJITSU LTD. (I.Ichikawa).\n" \
    "Copyright (C) 1996-2018, The nkf Project."

#include "config.h"
#include "nkf.h"
#include "utf8tbl.h"
#ifdef __WIN32__
#include <windows.h>
#include <locale.h>
#endif
#if defined(__OS2__)
# define INCL_DOS
# define INCL_DOSERRORS
# include <os2.h>
#endif
#include <assert.h>


/* state of output_mode and input_mode

   c2           0 means ASCII
   JIS_X_0201_1976_K
   ISO_8859_1
   JIS_X_0208
   EOF      all termination
   c1           32bit data

 */

/* MIME ENCODE */

#define         FIXED_MIME      7
#define         STRICT_MIME     8

/* byte order */
enum byte_order {
    ENDIAN_BIG    = 1,
    ENDIAN_LITTLE = 2,
    ENDIAN_2143   = 3,
    ENDIAN_3412   = 4
};

/* ASCII CODE */

#define         BS      0x08
#define         TAB     0x09
#define         LF      0x0a
#define         CR      0x0d
#define         ESC     0x1b
#define         SP      0x20
#define         DEL     0x7f
#define         SI      0x0f
#define         SO      0x0e
#define         SS2     0x8e
#define         SS3     0x8f
#define         CRLF    0x0D0A


/* encodings */

enum nkf_encodings {
    ASCII,
    ISO_8859_1,
    ISO_2022_JP,
    CP50220,
    CP50221,
    CP50222,
    ISO_2022_JP_1,
    ISO_2022_JP_3,
    ISO_2022_JP_2004,
    SHIFT_JIS,
    WINDOWS_31J,
    CP10001,
    EUC_JP,
    EUCJP_NKF,
    CP51932,
    EUCJP_MS,
    EUCJP_ASCII,
    SHIFT_JISX0213,
    SHIFT_JIS_2004,
    EUC_JISX0213,
    EUC_JIS_2004,
    UTF_8,
    UTF_8N,
    UTF_8_BOM,
    UTF8_MAC,
    UTF_16,
    UTF_16BE,
    UTF_16BE_BOM,
    UTF_16LE,
    UTF_16LE_BOM,
    UTF_32,
    UTF_32BE,
    UTF_32BE_BOM,
    UTF_32LE,
    UTF_32LE_BOM,
    BINARY,
    NKF_ENCODING_TABLE_SIZE,
    JIS_X_0201_1976_K = 0x1013, /* I */ /* JIS C 6220-1969 */
    /* JIS_X_0201_1976_R = 0x1014, */ /* J */ /* JIS C 6220-1969 */
    /* JIS_X_0208_1978   = 0x1040, */ /* @ */ /* JIS C 6226-1978 */
    /* JIS_X_0208_1983   = 0x1087, */ /* B */ /* JIS C 6226-1983 */
    JIS_X_0208        = 0x1168, /* @B */
    JIS_X_0212        = 0x1159, /* D */
    /* JIS_X_0213_2000_1 = 0x1228, */ /* O */
    JIS_X_0213_2 = 0x1229, /* P */
    JIS_X_0213_1 = 0x1233 /* Q */
};

static nkf_char s_iconv(nkf_char c2, nkf_char c1, nkf_char c0);
static nkf_char e_iconv(nkf_char c2, nkf_char c1, nkf_char c0);
static nkf_char w_iconv(nkf_char c2, nkf_char c1, nkf_char c0);
static nkf_char w_iconv16(nkf_char c2, nkf_char c1, nkf_char c0);
static nkf_char w_iconv32(nkf_char c2, nkf_char c1, nkf_char c0);
static void j_oconv(nkf_char c2, nkf_char c1);
static void s_oconv(nkf_char c2, nkf_char c1);
static void e_oconv(nkf_char c2, nkf_char c1);
static void w_oconv(nkf_char c2, nkf_char c1);
static void w_oconv16(nkf_char c2, nkf_char c1);
static void w_oconv32(nkf_char c2, nkf_char c1);

typedef const struct {
    const char *name;
    nkf_char (*iconv)(nkf_char c2, nkf_char c1, nkf_char c0);
    void (*oconv)(nkf_char c2, nkf_char c1);
} nkf_native_encoding;

nkf_native_encoding NkfEncodingASCII =		{ "ASCII", e_iconv, e_oconv };
nkf_native_encoding NkfEncodingISO_2022_JP =	{ "ISO-2022-JP", e_iconv, j_oconv };
nkf_native_encoding NkfEncodingShift_JIS =	{ "Shift_JIS", s_iconv, s_oconv };
nkf_native_encoding NkfEncodingEUC_JP =		{ "EUC-JP", e_iconv, e_oconv };
nkf_native_encoding NkfEncodingUTF_8 =		{ "UTF-8", w_iconv, w_oconv };
nkf_native_encoding NkfEncodingUTF_16 =		{ "UTF-16", w_iconv16, w_oconv16 };
nkf_native_encoding NkfEncodingUTF_32 =		{ "UTF-32", w_iconv32, w_oconv32 };

typedef const struct {
    int id;
    const char *name;
    nkf_native_encoding *base_encoding;
} nkf_encoding;

nkf_encoding nkf_encoding_table[] = {
    {ASCII,		"US-ASCII",		&NkfEncodingASCII},
    {ISO_8859_1,	"ISO-8859-1",		&NkfEncodingASCII},
    {ISO_2022_JP,	"ISO-2022-JP",		&NkfEncodingISO_2022_JP},
    {CP50220,		"CP50220",		&NkfEncodingISO_2022_JP},
    {CP50221,		"CP50221",		&NkfEncodingISO_2022_JP},
    {CP50222,		"CP50222",		&NkfEncodingISO_2022_JP},
    {ISO_2022_JP_1,	"ISO-2022-JP-1",	&NkfEncodingISO_2022_JP},
    {ISO_2022_JP_3,	"ISO-2022-JP-3",	&NkfEncodingISO_2022_JP},
    {ISO_2022_JP_2004,	"ISO-2022-JP-2004",	&NkfEncodingISO_2022_JP},
    {SHIFT_JIS,		"Shift_JIS",		&NkfEncodingShift_JIS},
    {WINDOWS_31J,	"Windows-31J",		&NkfEncodingShift_JIS},
    {CP10001,		"CP10001",		&NkfEncodingShift_JIS},
    {EUC_JP,		"EUC-JP",		&NkfEncodingEUC_JP},
    {EUCJP_NKF,		"eucJP-nkf",		&NkfEncodingEUC_JP},
    {CP51932,		"CP51932",		&NkfEncodingEUC_JP},
    {EUCJP_MS,		"eucJP-MS",		&NkfEncodingEUC_JP},
    {EUCJP_ASCII,	"eucJP-ASCII",		&NkfEncodingEUC_JP},
    {SHIFT_JISX0213,	"Shift_JISX0213",	&NkfEncodingShift_JIS},
    {SHIFT_JIS_2004,	"Shift_JIS-2004",	&NkfEncodingShift_JIS},
    {EUC_JISX0213,	"EUC-JISX0213",		&NkfEncodingEUC_JP},
    {EUC_JIS_2004,	"EUC-JIS-2004",		&NkfEncodingEUC_JP},
    {UTF_8,		"UTF-8",		&NkfEncodingUTF_8},
    {UTF_8N,		"UTF-8N",		&NkfEncodingUTF_8},
    {UTF_8_BOM,		"UTF-8-BOM",		&NkfEncodingUTF_8},
    {UTF8_MAC,		"UTF8-MAC",		&NkfEncodingUTF_8},
    {UTF_16,		"UTF-16",		&NkfEncodingUTF_16},
    {UTF_16BE,		"UTF-16BE",		&NkfEncodingUTF_16},
    {UTF_16BE_BOM,	"UTF-16BE-BOM",		&NkfEncodingUTF_16},
    {UTF_16LE,		"UTF-16LE",		&NkfEncodingUTF_16},
    {UTF_16LE_BOM,	"UTF-16LE-BOM",		&NkfEncodingUTF_16},
    {UTF_32,		"UTF-32",		&NkfEncodingUTF_32},
    {UTF_32BE,		"UTF-32BE",		&NkfEncodingUTF_32},
    {UTF_32BE_BOM,	"UTF-32BE-BOM",		&NkfEncodingUTF_32},
    {UTF_32LE,		"UTF-32LE",		&NkfEncodingUTF_32},
    {UTF_32LE_BOM,	"UTF-32LE-BOM",		&NkfEncodingUTF_32},
    {BINARY,		"BINARY",		&NkfEncodingASCII},
    {-1,		NULL,			NULL}
};

static const struct {
    const char *name;
    int id;
} encoding_name_to_id_table[] = {
    {"US-ASCII",		ASCII},
    {"ASCII",			ASCII},
    {"646",			ASCII},
    {"ROMAN8",			ASCII},
    {"ISO-2022-JP",		ISO_2022_JP},
    {"ISO2022JP-CP932",		CP50220},
    {"CP50220",			CP50220},
    {"CP50221",			CP50221},
    {"CSISO2022JP",		CP50221},
    {"CP50222",			CP50222},
    {"ISO-2022-JP-1",		ISO_2022_JP_1},
    {"ISO-2022-JP-3",		ISO_2022_JP_3},
    {"ISO-2022-JP-2004",	ISO_2022_JP_2004},
    {"SHIFT_JIS",		SHIFT_JIS},
    {"SJIS",			SHIFT_JIS},
    {"MS_Kanji",		SHIFT_JIS},
    {"PCK",			SHIFT_JIS},
    {"WINDOWS-31J",		WINDOWS_31J},
    {"CSWINDOWS31J",		WINDOWS_31J},
    {"CP932",			WINDOWS_31J},
    {"MS932",			WINDOWS_31J},
    {"CP10001",			CP10001},
    {"EUCJP",			EUC_JP},
    {"EUC-JP",			EUC_JP},
    {"EUCJP-NKF",		EUCJP_NKF},
    {"CP51932",			CP51932},
    {"EUC-JP-MS",		EUCJP_MS},
    {"EUCJP-MS",		EUCJP_MS},
    {"EUCJPMS",			EUCJP_MS},
    {"EUC-JP-ASCII",		EUCJP_ASCII},
    {"EUCJP-ASCII",		EUCJP_ASCII},
    {"SHIFT_JISX0213",		SHIFT_JISX0213},
    {"SHIFT_JIS-2004",		SHIFT_JIS_2004},
    {"EUC-JISX0213",		EUC_JISX0213},
    {"EUC-JIS-2004",		EUC_JIS_2004},
    {"UTF-8",			UTF_8},
    {"UTF-8N",			UTF_8N},
    {"UTF-8-BOM",		UTF_8_BOM},
    {"UTF8-MAC",		UTF8_MAC},
    {"UTF-8-MAC",		UTF8_MAC},
    {"UTF-16",			UTF_16},
    {"UTF-16BE",		UTF_16BE},
    {"UTF-16BE-BOM",		UTF_16BE_BOM},
    {"UTF-16LE",		UTF_16LE},
    {"UTF-16LE-BOM",		UTF_16LE_BOM},
    {"UTF-32",			UTF_32},
    {"UTF-32BE",		UTF_32BE},
    {"UTF-32BE-BOM",		UTF_32BE_BOM},
    {"UTF-32LE",		UTF_32LE},
    {"UTF-32LE-BOM",		UTF_32LE_BOM},
    {"BINARY",			BINARY},
    {NULL,			-1}
};

#if defined(DEFAULT_CODE_JIS)
#define	    DEFAULT_ENCIDX ISO_2022_JP
#elif defined(DEFAULT_CODE_SJIS)
#define	    DEFAULT_ENCIDX SHIFT_JIS
#elif defined(DEFAULT_CODE_WINDOWS_31J)
#define	    DEFAULT_ENCIDX WINDOWS_31J
#elif defined(DEFAULT_CODE_EUC)
#define	    DEFAULT_ENCIDX EUC_JP
#elif defined(DEFAULT_CODE_UTF8)
#define	    DEFAULT_ENCIDX UTF_8
#endif


#define		is_alnum(c)  \
    (('a'<=c && c<='z')||('A'<= c && c<='Z')||('0'<=c && c<='9'))

/* I don't trust portablity of toupper */
#define nkf_toupper(c)  (('a'<=c && c<='z')?(c-('a'-'A')):c)
#define nkf_isoctal(c)  ('0'<=c && c<='7')
#define nkf_isdigit(c)  ('0'<=c && c<='9')
#define nkf_isxdigit(c)  (nkf_isdigit(c) || ('a'<=c && c<='f') || ('A'<=c && c <= 'F'))
#define nkf_isblank(c) (c == SP || c == TAB)
#define nkf_isspace(c) (nkf_isblank(c) || c == CR || c == LF)
#define nkf_isalpha(c) (('a' <= c && c <= 'z') || ('A' <= c && c <= 'Z'))
#define nkf_isalnum(c) (nkf_isdigit(c) || nkf_isalpha(c))
#define nkf_isprint(c) (SP<=c && c<='~')
#define nkf_isgraph(c) ('!'<=c && c<='~')
#define hex2bin(c) (('0'<=c&&c<='9') ? (c-'0') : \
		    ('A'<=c&&c<='F') ? (c-'A'+10) : \
		    ('a'<=c&&c<='f') ? (c-'a'+10) : 0)
#define bin2hex(c) ("0123456789ABCDEF"[c&15])
#define is_eucg3(c2) (((unsigned short)c2 >> 8) == SS3)
#define nkf_noescape_mime(c) ((c == CR) || (c == LF) || \
			      ((c > SP) && (c < DEL) && (c != '?') && (c != '=') && (c != '_') \
			       && (c != '(') && (c != ')') && (c != '.') && (c != 0x22)))

#define is_ibmext_in_sjis(c2) (CP932_TABLE_BEGIN <= c2 && c2 <= CP932_TABLE_END)
#define nkf_byte_jisx0201_katakana_p(c) (SP <= c && c <= 0x5F)

#define         HOLD_SIZE       1024
#if defined(INT_IS_SHORT)
#define         IOBUF_SIZE      2048
#else
#define         IOBUF_SIZE      16384
#endif

#define         DEFAULT_J       'B'
#define         DEFAULT_R       'B'


#define         GETA1   0x22
#define         GETA2   0x2e


/* MIME preprocessor */

#ifdef EASYWIN /*Easy Win */
extern POINT _BufferSize;
#endif

struct input_code{
    const char *name;
    nkf_char stat;
    nkf_char score;
    nkf_char index;
    nkf_char buf[3];
    void (*status_func)(struct input_code *, nkf_char);
    nkf_char (*iconv_func)(nkf_char c2, nkf_char c1, nkf_char c0);
    int _file_stat;
};

static const char *input_codename = NULL; /* NULL: unestablished, "": BINARY */
static nkf_encoding *input_encoding = NULL;
static nkf_encoding *output_encoding = NULL;

#if defined(UTF8_INPUT_ENABLE) || defined(UTF8_OUTPUT_ENABLE)
/* UCS Mapping
 * 0: Shift_JIS, eucJP-ascii
 * 1: eucJP-ms
 * 2: CP932, CP51932
 * 3: CP10001
 */
#define UCS_MAP_ASCII   0
#define UCS_MAP_MS      1
#define UCS_MAP_CP932   2
#define UCS_MAP_CP10001 3
static int ms_ucs_map_f = UCS_MAP_ASCII;
#endif
#ifdef UTF8_INPUT_ENABLE
/* no NEC special, NEC-selected IBM extended and IBM extended characters */
static  int     no_cp932ext_f = FALSE;
/* ignore ZERO WIDTH NO-BREAK SPACE */
static  int     no_best_fit_chars_f = FALSE;
static  int     input_endian = ENDIAN_BIG;
static  int     input_bom_f = FALSE;
static  nkf_char     unicode_subchar = '?'; /* the regular substitution character */
static  void    (*encode_fallback)(nkf_char c) = NULL;
static  void    w_status(struct input_code *, nkf_char);
#endif
#ifdef UTF8_OUTPUT_ENABLE
static  int     output_bom_f = FALSE;
static  int     output_endian = ENDIAN_BIG;
#endif

static  void    std_putc(nkf_char c);
static  nkf_char     std_getc(FILE *f);
static  nkf_char     std_ungetc(nkf_char c,FILE *f);

static  nkf_char     broken_getc(FILE *f);
static  nkf_char     broken_ungetc(nkf_char c,FILE *f);

static  nkf_char     mime_getc(FILE *f);

static void mime_putc(nkf_char c);

/* buffers */

#if !defined(PERL_XS) && !defined(WIN32DLL)
static unsigned char   stdibuf[IOBUF_SIZE];
static unsigned char   stdobuf[IOBUF_SIZE];
#endif

#define NKF_UNSPECIFIED (-TRUE)

/* flags */
static int             unbuf_f = FALSE;
static int             estab_f = FALSE;
static int             nop_f = FALSE;
static int             binmode_f = TRUE;       /* binary mode */
static int             rot_f = FALSE;          /* rot14/43 mode */
static int             hira_f = FALSE;          /* hira/kata henkan */
static int             alpha_f = FALSE;        /* convert JIx0208 alphbet to ASCII */
static int             mime_f = MIME_DECODE_DEFAULT;   /* convert MIME B base64 or Q */
static int             mime_decode_f = FALSE;  /* mime decode is explicitly on */
static int             mimebuf_f = FALSE;      /* MIME buffered input */
static int             broken_f = FALSE;       /* convert ESC-less broken JIS */
static int             iso8859_f = FALSE;      /* ISO8859 through */
static int             mimeout_f = FALSE;       /* base64 mode */
static int             x0201_f = NKF_UNSPECIFIED;   /* convert JIS X 0201 */
static int             iso2022jp_f = FALSE;    /* replace non ISO-2022-JP with GETA */

#ifdef UNICODE_NORMALIZATION
static int nfc_f = FALSE;
static nkf_char (*i_nfc_getc)(FILE *) = std_getc; /* input of ugetc */
static nkf_char (*i_nfc_ungetc)(nkf_char c ,FILE *f) = std_ungetc;
#endif

#ifdef INPUT_OPTION
static int cap_f = FALSE;
static nkf_char (*i_cgetc)(FILE *) = std_getc; /* input of cgetc */
static nkf_char (*i_cungetc)(nkf_char c ,FILE *f) = std_ungetc;

static int url_f = FALSE;
static nkf_char (*i_ugetc)(FILE *) = std_getc; /* input of ugetc */
static nkf_char (*i_uungetc)(nkf_char c ,FILE *f) = std_ungetc;
#endif

#define PREFIX_EUCG3    NKF_INT32_C(0x8F00)
#define CLASS_MASK      NKF_INT32_C(0xFF000000)
#define CLASS_UNICODE   NKF_INT32_C(0x01000000)
#define VALUE_MASK      NKF_INT32_C(0x00FFFFFF)
#define UNICODE_BMP_MAX NKF_INT32_C(0x0000FFFF)
#define UNICODE_MAX     NKF_INT32_C(0x0010FFFF)
#define nkf_char_euc3_new(c) ((c) | PREFIX_EUCG3)
#define nkf_char_unicode_new(c) ((c) | CLASS_UNICODE)
#define nkf_char_unicode_p(c) ((c & CLASS_MASK) == CLASS_UNICODE)
#define nkf_char_unicode_bmp_p(c) ((c & VALUE_MASK) <= UNICODE_BMP_MAX)
#define nkf_char_unicode_value_p(c) ((c & VALUE_MASK) <= UNICODE_MAX)

#define UTF16_TO_UTF32(lead, trail) (((lead) << 10) + (trail) - NKF_INT32_C(0x35FDC00))

#ifdef NUMCHAR_OPTION
static int numchar_f = FALSE;
static nkf_char (*i_ngetc)(FILE *) = std_getc; /* input of ugetc */
static nkf_char (*i_nungetc)(nkf_char c ,FILE *f) = std_ungetc;
#endif

#ifdef CHECK_OPTION
static int noout_f = FALSE;
static void no_putc(nkf_char c);
static int debug_f = FALSE;
static void debug(const char *str);
static nkf_char (*iconv_for_check)(nkf_char c2,nkf_char c1,nkf_char c0) = 0;
#endif

static int guess_f = 0; /* 0: OFF, 1: ON, 2: VERBOSE */
static  void    set_input_codename(const char *codename);

#ifdef EXEC_IO
static int exec_f = 0;
#endif

#ifdef SHIFTJIS_CP932
/* invert IBM extended characters to others */
static int cp51932_f = FALSE;

/* invert NEC-selected IBM extended characters to IBM extended characters */
static int cp932inv_f = TRUE;

/* static nkf_char cp932_conv(nkf_char c2, nkf_char c1); */
#endif /* SHIFTJIS_CP932 */

static int x0212_f = FALSE;
static int x0213_f = FALSE;

static unsigned char prefix_table[256];

static void e_status(struct input_code *, nkf_char);
static void s_status(struct input_code *, nkf_char);

struct input_code input_code_list[] = {
    {"EUC-JP",    0, 0, 0, {0, 0, 0}, e_status, e_iconv, 0},
    {"Shift_JIS", 0, 0, 0, {0, 0, 0}, s_status, s_iconv, 0},
#ifdef UTF8_INPUT_ENABLE
    {"UTF-8",     0, 0, 0, {0, 0, 0}, w_status, w_iconv, 0},
    {"UTF-16",     0, 0, 0, {0, 0, 0}, NULL, w_iconv16, 0},
    {"UTF-32",     0, 0, 0, {0, 0, 0}, NULL, w_iconv32, 0},
#endif
    {NULL,        0, 0, 0, {0, 0, 0}, NULL, NULL, 0}
};

static int              mimeout_mode = 0; /* 0, -1, 'Q', 'B', 1, 2 */
static int              base64_count = 0;

/* X0208 -> ASCII converter */

/* fold parameter */
static int             f_line = 0;    /* chars in line */
static int             f_prev = 0;
static int             fold_preserve_f = FALSE; /* preserve new lines */
static int             fold_f  = FALSE;
static int             fold_len  = 0;

/* options */
static unsigned char   kanji_intro = DEFAULT_J;
static unsigned char   ascii_intro = DEFAULT_R;

/* Folding */

#define FOLD_MARGIN  10
#define DEFAULT_FOLD 60

static int             fold_margin  = FOLD_MARGIN;

/* process default */

static nkf_char
no_connection2(ARG_UNUSED nkf_char c2, ARG_UNUSED nkf_char c1, ARG_UNUSED nkf_char c0)
{
    fprintf(stderr,"nkf internal module connection failure.\n");
    exit(EXIT_FAILURE);
    return 0; /* LINT */
}

static void
no_connection(nkf_char c2, nkf_char c1)
{
    no_connection2(c2,c1,0);
}

static nkf_char (*iconv)(nkf_char c2,nkf_char c1,nkf_char c0) = no_connection2;
static void (*oconv)(nkf_char c2,nkf_char c1) = no_connection;

static void (*o_zconv)(nkf_char c2,nkf_char c1) = no_connection;
static void (*o_fconv)(nkf_char c2,nkf_char c1) = no_connection;
static void (*o_eol_conv)(nkf_char c2,nkf_char c1) = no_connection;
static void (*o_rot_conv)(nkf_char c2,nkf_char c1) = no_connection;
static void (*o_hira_conv)(nkf_char c2,nkf_char c1) = no_connection;
static void (*o_base64conv)(nkf_char c2,nkf_char c1) = no_connection;
static void (*o_iso2022jp_check_conv)(nkf_char c2,nkf_char c1) = no_connection;

/* static redirections */

static  void   (*o_putc)(nkf_char c) = std_putc;

static  nkf_char    (*i_getc)(FILE *f) = std_getc; /* general input */
static  nkf_char    (*i_ungetc)(nkf_char c,FILE *f) =std_ungetc;

static  nkf_char    (*i_bgetc)(FILE *) = std_getc; /* input of mgetc */
static  nkf_char    (*i_bungetc)(nkf_char c ,FILE *f) = std_ungetc;

static  void   (*o_mputc)(nkf_char c) = std_putc ; /* output of mputc */

static  nkf_char    (*i_mgetc)(FILE *) = std_getc; /* input of mgetc */
static  nkf_char    (*i_mungetc)(nkf_char c ,FILE *f) = std_ungetc;

/* for strict mime */
static  nkf_char    (*i_mgetc_buf)(FILE *) = std_getc; /* input of mgetc_buf */
static  nkf_char    (*i_mungetc_buf)(nkf_char c,FILE *f) = std_ungetc;

/* Global states */
static int output_mode = ASCII;    /* output kanji mode */
static int input_mode =  ASCII;    /* input kanji mode */
static int mime_decode_mode =   FALSE;    /* MIME mode B base64, Q hex */

/* X0201 / X0208 conversion tables */

/* X0201 kana conversion table */
/* 90-9F A0-DF */
static const unsigned char cv[]= {
    0x21,0x21,0x21,0x23,0x21,0x56,0x21,0x57,
    0x21,0x22,0x21,0x26,0x25,0x72,0x25,0x21,
    0x25,0x23,0x25,0x25,0x25,0x27,0x25,0x29,
    0x25,0x63,0x25,0x65,0x25,0x67,0x25,0x43,
    0x21,0x3c,0x25,0x22,0x25,0x24,0x25,0x26,
    0x25,0x28,0x25,0x2a,0x25,0x2b,0x25,0x2d,
    0x25,0x2f,0x25,0x31,0x25,0x33,0x25,0x35,
    0x25,0x37,0x25,0x39,0x25,0x3b,0x25,0x3d,
    0x25,0x3f,0x25,0x41,0x25,0x44,0x25,0x46,
    0x25,0x48,0x25,0x4a,0x25,0x4b,0x25,0x4c,
    0x25,0x4d,0x25,0x4e,0x25,0x4f,0x25,0x52,
    0x25,0x55,0x25,0x58,0x25,0x5b,0x25,0x5e,
    0x25,0x5f,0x25,0x60,0x25,0x61,0x25,0x62,
    0x25,0x64,0x25,0x66,0x25,0x68,0x25,0x69,
    0x25,0x6a,0x25,0x6b,0x25,0x6c,0x25,0x6d,
    0x25,0x6f,0x25,0x73,0x21,0x2b,0x21,0x2c,
    0x00,0x00};


/* X0201 kana conversion table for dakuten */
/* 90-9F A0-DF */
static const unsigned char dv[]= {
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x25,0x74,
    0x00,0x00,0x00,0x00,0x25,0x2c,0x25,0x2e,
    0x25,0x30,0x25,0x32,0x25,0x34,0x25,0x36,
    0x25,0x38,0x25,0x3a,0x25,0x3c,0x25,0x3e,
    0x25,0x40,0x25,0x42,0x25,0x45,0x25,0x47,
    0x25,0x49,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x25,0x50,0x25,0x53,
    0x25,0x56,0x25,0x59,0x25,0x5c,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00};

/* X0201 kana conversion table for han-dakuten */
/* 90-9F A0-DF */
static const unsigned char ev[]= {
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x25,0x51,0x25,0x54,
    0x25,0x57,0x25,0x5a,0x25,0x5d,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00};

/* X0201 kana to X0213 conversion table for han-dakuten */
/* 90-9F A0-DF */
static const unsigned char ev_x0213[]= {
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x25,0x77,0x25,0x78,
    0x25,0x79,0x25,0x7a,0x25,0x7b,0x00,0x00,
    0x00,0x00,0x00,0x00,0x25,0x7c,0x00,0x00,
    0x00,0x00,0x00,0x00,0x25,0x7d,0x00,0x00,
    0x25,0x7e,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00};


/* X0208 kigou conversion table */
/* 0x8140 - 0x819e */
static const unsigned char fv[] = {

    0x00,0x00,0x00,0x00,0x2c,0x2e,0x00,0x3a,
    0x3b,0x3f,0x21,0x00,0x00,0x27,0x60,0x00,
    0x5e,0x00,0x5f,0x00,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x2d,0x00,0x2f,
    0x5c,0x00,0x00,0x7c,0x00,0x00,0x60,0x27,
    0x22,0x22,0x28,0x29,0x00,0x00,0x5b,0x5d,
    0x7b,0x7d,0x3c,0x3e,0x00,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x2b,0x2d,0x00,0x00,
    0x00,0x3d,0x00,0x3c,0x3e,0x00,0x00,0x00,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
    0x24,0x00,0x00,0x25,0x23,0x26,0x2a,0x40,
    0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00
} ;



static int option_mode = 0;
static int             file_out_f = FALSE;
#ifdef OVERWRITE
static int             overwrite_f = FALSE;
static int             preserve_time_f = FALSE;
static int             backup_f = FALSE;
static char            *backup_suffix = "";
#endif

static int eolmode_f = 0;   /* CR, LF, CRLF */
static int input_eol = 0; /* 0: unestablished, EOF: MIXED */
static nkf_char prev_cr = 0; /* CR or 0 */
#ifdef EASYWIN /*Easy Win */
static int             end_check;
#endif /*Easy Win */

static void *
nkf_xmalloc(size_t size)
{
    void *ptr;

    if (size == 0) size = 1;

    ptr = malloc(size);
    if (ptr == NULL) {
	perror("can't malloc");
	exit(EXIT_FAILURE);
    }

    return ptr;
}

static void *
nkf_xrealloc(void *ptr, size_t size)
{
    if (size == 0) size = 1;

    ptr = realloc(ptr, size);
    if (ptr == NULL) {
	perror("can't realloc");
	exit(EXIT_FAILURE);
    }

    return ptr;
}

#define nkf_xfree(ptr) free(ptr)

static int
nkf_str_caseeql(const char *src, const char *target)
{
    int i;
    for (i = 0; src[i] && target[i]; i++) {
	if (nkf_toupper(src[i]) != nkf_toupper(target[i])) return FALSE;
    }
    if (src[i] || target[i]) return FALSE;
    else return TRUE;
}

static nkf_encoding*
nkf_enc_from_index(int idx)
{
    if (idx < 0 || NKF_ENCODING_TABLE_SIZE <= idx) {
	return 0;
    }
    return &nkf_encoding_table[idx];
}

static int
nkf_enc_find_index(const char *name)
{
    int i;
    if (name[0] == 'X' && *(name+1) == '-') name += 2;
    for (i = 0; encoding_name_to_id_table[i].id >= 0; i++) {
	if (nkf_str_caseeql(encoding_name_to_id_table[i].name, name)) {
	    return encoding_name_to_id_table[i].id;
	}
    }
    return -1;
}

static nkf_encoding*
nkf_enc_find(const char *name)
{
    int idx = -1;
    idx = nkf_enc_find_index(name);
    if (idx < 0) return 0;
    return nkf_enc_from_index(idx);
}

#define nkf_enc_name(enc) (enc)->name
#define nkf_enc_to_index(enc) (enc)->id
#define nkf_enc_to_base_encoding(enc) (enc)->base_encoding
#define nkf_enc_to_iconv(enc) nkf_enc_to_base_encoding(enc)->iconv
#define nkf_enc_to_oconv(enc) nkf_enc_to_base_encoding(enc)->oconv
#define nkf_enc_asciicompat(enc) (\
				  nkf_enc_to_base_encoding(enc) == &NkfEncodingASCII ||\
				  nkf_enc_to_base_encoding(enc) == &NkfEncodingISO_2022_JP)
#define nkf_enc_unicode_p(enc) (\
				nkf_enc_to_base_encoding(enc) == &NkfEncodingUTF_8 ||\
				nkf_enc_to_base_encoding(enc) == &NkfEncodingUTF_16 ||\
				nkf_enc_to_base_encoding(enc) == &NkfEncodingUTF_32)
#define nkf_enc_cp5022x_p(enc) (\
				nkf_enc_to_index(enc) == CP50220 ||\
				nkf_enc_to_index(enc) == CP50221 ||\
				nkf_enc_to_index(enc) == CP50222)

#ifdef DEFAULT_CODE_LOCALE
static const char*
nkf_locale_charmap(void)
{
#ifdef HAVE_LANGINFO_H
    return nl_langinfo(CODESET);
#elif defined(__WIN32__)
    static char buf[16];
    sprintf(buf, "CP%d", GetACP());
    return buf;
#elif defined(__OS2__)
# if defined(INT_IS_SHORT)
    /* OS/2 1.x */
    return NULL;
# else
    /* OS/2 32bit */
    static char buf[16];
    ULONG ulCP[1], ulncp;
    DosQueryCp(sizeof(ulCP), ulCP, &ulncp);
    if (ulCP[0] == 932 || ulCP[0] == 943)
        strcpy(buf, "Shift_JIS");
    else
        sprintf(buf, "CP%lu", ulCP[0]);
    return buf;
# endif
#endif
    return NULL;
}

static nkf_encoding*
nkf_locale_encoding(void)
{
    nkf_encoding *enc = 0;
    const char *encname = nkf_locale_charmap();
    if (encname)
	enc = nkf_enc_find(encname);
    return enc;
}
#endif /* DEFAULT_CODE_LOCALE */

static nkf_encoding*
nkf_utf8_encoding(void)
{
    return &nkf_encoding_table[UTF_8];
}

static nkf_encoding*
nkf_default_encoding(void)
{
    nkf_encoding *enc = 0;
#ifdef DEFAULT_CODE_LOCALE
    enc = nkf_locale_encoding();
#elif defined(DEFAULT_ENCIDX)
    enc = nkf_enc_from_index(DEFAULT_ENCIDX);
#endif
    if (!enc) enc = nkf_utf8_encoding();
    return enc;
}

typedef struct {
    long capa;
    long len;
    nkf_char *ptr;
} nkf_buf_t;

static nkf_buf_t *
nkf_buf_new(int length)
{
    nkf_buf_t *buf = nkf_xmalloc(sizeof(nkf_buf_t));
    buf->ptr = nkf_xmalloc(sizeof(nkf_char) * length);
    buf->capa = length;
    buf->len = 0;
    return buf;
}

#if 0
static void
nkf_buf_dispose(nkf_buf_t *buf)
{
    nkf_xfree(buf->ptr);
    nkf_xfree(buf);
}
#endif

#define nkf_buf_length(buf) ((buf)->len)
#define nkf_buf_empty_p(buf) ((buf)->len == 0)

static nkf_char
nkf_buf_at(nkf_buf_t *buf, int index)
{
    assert(index <= buf->len);
    return buf->ptr[index];
}

static void
nkf_buf_clear(nkf_buf_t *buf)
{
    buf->len = 0;
}

static void
nkf_buf_push(nkf_buf_t *buf, nkf_char c)
{
    if (buf->capa <= buf->len) {
	exit(EXIT_FAILURE);
    }
    buf->ptr[buf->len++] = c;
}

static nkf_char
nkf_buf_pop(nkf_buf_t *buf)
{
    assert(!nkf_buf_empty_p(buf));
    return buf->ptr[--buf->len];
}

/* Normalization Form C */
#ifndef PERL_XS
#ifdef WIN32DLL
#define fprintf dllprintf
#endif

static void
version(void)
{
    fprintf(HELP_OUTPUT,"Network Kanji Filter Version " NKF_VERSION " (" NKF_RELEASE_DATE ") \n" COPY_RIGHT "\n");
}

static void
usage(void)
{
    fprintf(HELP_OUTPUT,
	    "Usage:  nkf -[flags] [--] [in file] .. [out file for -O flag]\n"
#ifdef UTF8_OUTPUT_ENABLE
	    " j/s/e/w  Specify output encoding ISO-2022-JP, Shift_JIS, EUC-JP\n"
	    "          UTF options is -w[8[0],{16,32}[{B,L}[0]]]\n"
#else
#endif
#ifdef UTF8_INPUT_ENABLE
	    " J/S/E/W  Specify input encoding ISO-2022-JP, Shift_JIS, EUC-JP\n"
	    "          UTF option is -W[8,[16,32][B,L]]\n"
#else
	    " J/S/E    Specify output encoding ISO-2022-JP, Shift_JIS, EUC-JP\n"
#endif
	    );
    fprintf(HELP_OUTPUT,
	    " m[BQSN0] MIME decode [B:base64,Q:quoted,S:strict,N:nonstrict,0:no decode]\n"
	    " M[BQ]    MIME encode [B:base64 Q:quoted]\n"
	    " f/F      Folding: -f60 or -f or -f60-10 (fold margin 10) F preserve nl\n"
	    );
    fprintf(HELP_OUTPUT,
	    " Z[0-4]   Default/0: Convert JISX0208 Alphabet to ASCII\n"
	    "          1: Kankaku to one space  2: to two spaces  3: HTML Entity\n"
	    "          4: JISX0208 Katakana to JISX0201 Katakana\n"
	    " X,x      Convert Halfwidth Katakana to Fullwidth or preserve it\n"
	    );
    fprintf(HELP_OUTPUT,
	    " O        Output to File (DEFAULT 'nkf.out')\n"
	    " L[uwm]   Line mode u:LF w:CRLF m:CR (DEFAULT noconversion)\n"
	    );
    fprintf(HELP_OUTPUT,
	    " --ic=<encoding>        Specify the input encoding\n"
	    " --oc=<encoding>        Specify the output encoding\n"
	    " --hiragana --katakana  Hiragana/Katakana Conversion\n"
	    " --katakana-hiragana    Converts each other\n"
	    );
    fprintf(HELP_OUTPUT,
#ifdef INPUT_OPTION
	    " --{cap, url}-input     Convert hex after ':' or '%%'\n"
#endif
#ifdef NUMCHAR_OPTION
	    " --numchar-input        Convert Unicode Character Reference\n"
#endif
#ifdef UTF8_INPUT_ENABLE
	    " --fb-{skip, html, xml, perl, java, subchar}\n"
	    "                        Specify unassigned character's replacement\n"
#endif
	    );
    fprintf(HELP_OUTPUT,
#ifdef OVERWRITE
	    " --in-place[=SUF]       Overwrite original files\n"
	    " --overwrite[=SUF]      Preserve timestamp of original files\n"
#endif
	    " -g --guess             Guess the input code\n"
	    " -v --version           Print the version\n"
	    " --help/-V              Print this help / configuration\n"
	    );
    version();
}

static void
show_configuration(void)
{
    fprintf(HELP_OUTPUT,
	    "Summary of my nkf " NKF_VERSION " (" NKF_RELEASE_DATE ") configuration:\n"
	    "  Compile-time options:\n"
	    "    Compiled at:                 " __DATE__ " " __TIME__ "\n"
	   );
    fprintf(HELP_OUTPUT,
	    "    Default output encoding:     "
#ifdef DEFAULT_CODE_LOCALE
	    "LOCALE (%s)\n", nkf_enc_name(nkf_default_encoding())
#elif defined(DEFAULT_ENCIDX)
	    "CONFIG (%s)\n", nkf_enc_name(nkf_default_encoding())
#else
	    "NONE\n"
#endif
	   );
    fprintf(HELP_OUTPUT,
	    "    Default output end of line:  "
#if DEFAULT_NEWLINE == CR
	    "CR"
#elif DEFAULT_NEWLINE == CRLF
	    "CRLF"
#else
	    "LF"
#endif
	    "\n"
	    "    Decode MIME encoded string:  "
#if MIME_DECODE_DEFAULT
	    "ON"
#else
	    "OFF"
#endif
	    "\n"
	    "    Convert JIS X 0201 Katakana: "
#if X0201_DEFAULT
	    "ON"
#else
	    "OFF"
#endif
	    "\n"
	    "    --help, --version output:    "
#if HELP_OUTPUT_HELP_OUTPUT
	    "HELP_OUTPUT"
#else
	    "STDOUT"
#endif
	    "\n");
}
#endif /*PERL_XS*/

#ifdef OVERWRITE
static char*
get_backup_filename(const char *suffix, const char *filename)
{
    char *backup_filename;
    int asterisk_count = 0;
    int i, j;
    int filename_length = strlen(filename);

    for(i = 0; suffix[i]; i++){
	if(suffix[i] == '*') asterisk_count++;
    }

    if(asterisk_count){
	backup_filename = nkf_xmalloc(strlen(suffix) + (asterisk_count * (filename_length - 1)) + 1);
	for(i = 0, j = 0; suffix[i];){
	    if(suffix[i] == '*'){
		backup_filename[j] = '\0';
		strncat(backup_filename, filename, filename_length);
		i++;
		j += filename_length;
	    }else{
		backup_filename[j++] = suffix[i++];
	    }
	}
	backup_filename[j] = '\0';
    }else{
	j = filename_length + strlen(suffix);
	backup_filename = nkf_xmalloc(j + 1);
	strcpy(backup_filename, filename);
	strcat(backup_filename, suffix);
	backup_filename[j] = '\0';
    }
    return backup_filename;
}
#endif

#ifdef UTF8_INPUT_ENABLE
static void
nkf_each_char_to_hex(void (*f)(nkf_char c2,nkf_char c1), nkf_char c)
{
    int shift = 20;
    c &= VALUE_MASK;
    while(shift >= 0){
	if(c >= NKF_INT32_C(1)<<shift){
	    while(shift >= 0){
		(*f)(0, bin2hex(c>>shift));
		shift -= 4;
	    }
	}else{
	    shift -= 4;
	}
    }
    return;
}

static void
encode_fallback_html(nkf_char c)
{
    (*oconv)(0, '&');
    (*oconv)(0, '#');
    c &= VALUE_MASK;
    if(c >= NKF_INT32_C(1000000))
	(*oconv)(0, 0x30+(c/NKF_INT32_C(1000000))%10);
    if(c >= NKF_INT32_C(100000))
	(*oconv)(0, 0x30+(c/NKF_INT32_C(100000) )%10);
    if(c >= 10000)
	(*oconv)(0, 0x30+(c/10000  )%10);
    if(c >= 1000)
	(*oconv)(0, 0x30+(c/1000   )%10);
    if(c >= 100)
	(*oconv)(0, 0x30+(c/100    )%10);
    if(c >= 10)
	(*oconv)(0, 0x30+(c/10     )%10);
    if(c >= 0)
	(*oconv)(0, 0x30+ c         %10);
    (*oconv)(0, ';');
    return;
}

static void
encode_fallback_xml(nkf_char c)
{
    (*oconv)(0, '&');
    (*oconv)(0, '#');
    (*oconv)(0, 'x');
    nkf_each_char_to_hex(oconv, c);
    (*oconv)(0, ';');
    return;
}

static void
encode_fallback_java(nkf_char c)
{
    (*oconv)(0, '\\');
    c &= VALUE_MASK;
    if(!nkf_char_unicode_bmp_p(c)){
        int high = (c >> 10) + NKF_INT32_C(0xD7C0);   /* high surrogate */
        int low = (c & 0x3FF) + NKF_INT32_C(0xDC00); /* low surrogate */
	(*oconv)(0, 'u');
	(*oconv)(0, bin2hex(high>>12));
	(*oconv)(0, bin2hex(high>> 8));
	(*oconv)(0, bin2hex(high>> 4));
	(*oconv)(0, bin2hex(high    ));
	(*oconv)(0, '\\');
	(*oconv)(0, 'u');
	(*oconv)(0, bin2hex(low>>12));
	(*oconv)(0, bin2hex(low>> 8));
	(*oconv)(0, bin2hex(low>> 4));
	(*oconv)(0, bin2hex(low    ));
    }else{
	(*oconv)(0, 'u');
	(*oconv)(0, bin2hex(c>>12));
	(*oconv)(0, bin2hex(c>> 8));
	(*oconv)(0, bin2hex(c>> 4));
	(*oconv)(0, bin2hex(c    ));
    }
    return;
}

static void
encode_fallback_perl(nkf_char c)
{
    (*oconv)(0, '\\');
    (*oconv)(0, 'x');
    (*oconv)(0, '{');
    nkf_each_char_to_hex(oconv, c);
    (*oconv)(0, '}');
    return;
}

static void
encode_fallback_subchar(nkf_char c)
{
    c = unicode_subchar;
    (*oconv)((c>>8)&0xFF, c&0xFF);
    return;
}
#endif

static const struct {
    const char *name;
    const char *alias;
} long_option[] = {
    {"ic=", ""},
    {"oc=", ""},
    {"base64","jMB"},
    {"euc","e"},
    {"euc-input","E"},
    {"fj","jm"},
    {"help",""},
    {"jis","j"},
    {"jis-input","J"},
    {"mac","sLm"},
    {"mime","jM"},
    {"mime-input","m"},
    {"msdos","sLw"},
    {"sjis","s"},
    {"sjis-input","S"},
    {"unix","eLu"},
    {"version","v"},
    {"windows","sLw"},
    {"hiragana","h1"},
    {"katakana","h2"},
    {"katakana-hiragana","h3"},
    {"guess=", ""},
    {"guess", "g2"},
    {"cp932", ""},
    {"no-cp932", ""},
#ifdef X0212_ENABLE
    {"x0212", ""},
#endif
#ifdef UTF8_OUTPUT_ENABLE
    {"utf8", "w"},
    {"utf16", "w16"},
    {"ms-ucs-map", ""},
    {"fb-skip", ""},
    {"fb-html", ""},
    {"fb-xml", ""},
    {"fb-perl", ""},
    {"fb-java", ""},
    {"fb-subchar", ""},
    {"fb-subchar=", ""},
#endif
#ifdef UTF8_INPUT_ENABLE
    {"utf8-input", "W"},
    {"utf16-input", "W16"},
    {"no-cp932ext", ""},
    {"no-best-fit-chars",""},
#endif
#ifdef UNICODE_NORMALIZATION
    {"utf8mac-input", ""},
#endif
#ifdef OVERWRITE
    {"overwrite", ""},
    {"overwrite=", ""},
    {"in-place", ""},
    {"in-place=", ""},
#endif
#ifdef INPUT_OPTION
    {"cap-input", ""},
    {"url-input", ""},
#endif
#ifdef NUMCHAR_OPTION
    {"numchar-input", ""},
#endif
#ifdef CHECK_OPTION
    {"no-output", ""},
    {"debug", ""},
#endif
#ifdef SHIFTJIS_CP932
    {"cp932inv", ""},
#endif
#ifdef EXEC_IO
    {"exec-in", ""},
    {"exec-out", ""},
#endif
    {"prefix=", ""},
};

static void
set_input_encoding(nkf_encoding *enc)
{
    switch (nkf_enc_to_index(enc)) {
    case ISO_8859_1:
	iso8859_f = TRUE;
	break;
    case CP50221:
    case CP50222:
	if (x0201_f == NKF_UNSPECIFIED) x0201_f = FALSE;	/* -x specified implicitly */
    case CP50220:
#ifdef SHIFTJIS_CP932
	cp51932_f = TRUE;
#endif
#ifdef UTF8_OUTPUT_ENABLE
	ms_ucs_map_f = UCS_MAP_CP932;
#endif
	break;
    case ISO_2022_JP_1:
	x0212_f = TRUE;
	break;
    case ISO_2022_JP_3:
	x0212_f = TRUE;
	x0213_f = TRUE;
	break;
    case ISO_2022_JP_2004:
	x0212_f = TRUE;
	x0213_f = TRUE;
	break;
    case SHIFT_JIS:
	break;
    case WINDOWS_31J:
	if (x0201_f == NKF_UNSPECIFIED) x0201_f = FALSE;	/* -x specified implicitly */
#ifdef SHIFTJIS_CP932
	cp51932_f = TRUE;
#endif
#ifdef UTF8_OUTPUT_ENABLE
	ms_ucs_map_f = UCS_MAP_CP932;
#endif
	break;
	break;
    case CP10001:
#ifdef SHIFTJIS_CP932
	cp51932_f = TRUE;
#endif
#ifdef UTF8_OUTPUT_ENABLE
	ms_ucs_map_f = UCS_MAP_CP10001;
#endif
	break;
    case EUC_JP:
	break;
    case EUCJP_NKF:
	break;
    case CP51932:
	if (x0201_f == NKF_UNSPECIFIED) x0201_f = FALSE;	/* -x specified implicitly */
#ifdef SHIFTJIS_CP932
	cp51932_f = TRUE;
#endif
#ifdef UTF8_OUTPUT_ENABLE
	ms_ucs_map_f = UCS_MAP_CP932;
#endif
	break;
    case EUCJP_MS:
	if (x0201_f == NKF_UNSPECIFIED) x0201_f = FALSE;	/* -x specified implicitly */
#ifdef SHIFTJIS_CP932
	cp51932_f = FALSE;
#endif
#ifdef UTF8_OUTPUT_ENABLE
	ms_ucs_map_f = UCS_MAP_MS;
#endif
	break;
    case EUCJP_ASCII:
	if (x0201_f == NKF_UNSPECIFIED) x0201_f = FALSE;	/* -x specified implicitly */
#ifdef SHIFTJIS_CP932
	cp51932_f = FALSE;
#endif
#ifdef UTF8_OUTPUT_ENABLE
	ms_ucs_map_f = UCS_MAP_ASCII;
#endif
	break;
    case SHIFT_JISX0213:
    case SHIFT_JIS_2004:
	x0213_f = TRUE;
#ifdef SHIFTJIS_CP932
	cp51932_f = FALSE;
	if (cp932inv_f == TRUE) cp932inv_f = FALSE;
#endif
	break;
    case EUC_JISX0213:
    case EUC_JIS_2004:
	x0213_f = TRUE;
#ifdef SHIFTJIS_CP932
	cp51932_f = FALSE;
#endif
	break;
#ifdef UTF8_INPUT_ENABLE
#ifdef UNICODE_NORMALIZATION
    case UTF8_MAC:
	nfc_f = TRUE;
	break;
#endif
    case UTF_16:
    case UTF_16BE:
    case UTF_16BE_BOM:
	input_endian = ENDIAN_BIG;
	break;
    case UTF_16LE:
    case UTF_16LE_BOM:
	input_endian = ENDIAN_LITTLE;
	break;
    case UTF_32:
    case UTF_32BE:
    case UTF_32BE_BOM:
	input_endian = ENDIAN_BIG;
	break;
    case UTF_32LE:
    case UTF_32LE_BOM:
	input_endian = ENDIAN_LITTLE;
	break;
#endif
    }
}

static void
set_output_encoding(nkf_encoding *enc)
{
    switch (nkf_enc_to_index(enc)) {
    case CP50220:
#ifdef SHIFTJIS_CP932
	if (cp932inv_f == TRUE) cp932inv_f = FALSE;
#endif
#ifdef UTF8_OUTPUT_ENABLE
	ms_ucs_map_f = UCS_MAP_CP932;
#endif
	break;
    case CP50221:
	if (x0201_f == NKF_UNSPECIFIED) x0201_f = FALSE;	/* -x specified implicitly */
#ifdef SHIFTJIS_CP932
	if (cp932inv_f == TRUE) cp932inv_f = FALSE;
#endif
#ifdef UTF8_OUTPUT_ENABLE
	ms_ucs_map_f = UCS_MAP_CP932;
#endif
	break;
    case ISO_2022_JP:
#ifdef SHIFTJIS_CP932
	if (cp932inv_f == TRUE) cp932inv_f = FALSE;
#endif
	break;
    case ISO_2022_JP_1:
	x0212_f = TRUE;
#ifdef SHIFTJIS_CP932
	if (cp932inv_f == TRUE) cp932inv_f = FALSE;
#endif
	break;
    case ISO_2022_JP_3:
    case ISO_2022_JP_2004:
	x0212_f = TRUE;
	x0213_f = TRUE;
#ifdef SHIFTJIS_CP932
	if (cp932inv_f == TRUE) cp932inv_f = FALSE;
#endif
	break;
    case SHIFT_JIS:
	break;
    case WINDOWS_31J:
	if (x0201_f == NKF_UNSPECIFIED) x0201_f = FALSE;	/* -x specified implicitly */
#ifdef UTF8_OUTPUT_ENABLE
	ms_ucs_map_f = UCS_MAP_CP932;
#endif
	break;
    case CP10001:
#ifdef UTF8_OUTPUT_ENABLE
	ms_ucs_map_f = UCS_MAP_CP10001;
#endif
	break;
    case EUC_JP:
	x0212_f = TRUE;
#ifdef SHIFTJIS_CP932
	if (cp932inv_f == TRUE) cp932inv_f = FALSE;
#endif
#ifdef UTF8_OUTPUT_ENABLE
	ms_ucs_map_f = UCS_MAP_ASCII;
#endif
	break;
    case EUCJP_NKF:
	x0212_f = FALSE;
#ifdef SHIFTJIS_CP932
	if (cp932inv_f == TRUE) cp932inv_f = FALSE;
#endif
#ifdef UTF8_OUTPUT_ENABLE
	ms_ucs_map_f = UCS_MAP_ASCII;
#endif
	break;
    case CP51932:
	if (x0201_f == NKF_UNSPECIFIED) x0201_f = FALSE;	/* -x specified implicitly */
#ifdef SHIFTJIS_CP932
	if (cp932inv_f == TRUE) cp932inv_f = FALSE;
#endif
#ifdef UTF8_OUTPUT_ENABLE
	ms_ucs_map_f = UCS_MAP_CP932;
#endif
	break;
    case EUCJP_MS:
	if (x0201_f == NKF_UNSPECIFIED) x0201_f = FALSE;	/* -x specified implicitly */
	x0212_f = TRUE;
#ifdef UTF8_OUTPUT_ENABLE
	ms_ucs_map_f = UCS_MAP_MS;
#endif
	break;
    case EUCJP_ASCII:
	if (x0201_f == NKF_UNSPECIFIED) x0201_f = FALSE;	/* -x specified implicitly */
	x0212_f = TRUE;
#ifdef UTF8_OUTPUT_ENABLE
	ms_ucs_map_f = UCS_MAP_ASCII;
#endif
	break;
    case SHIFT_JISX0213:
    case SHIFT_JIS_2004:
	x0213_f = TRUE;
#ifdef SHIFTJIS_CP932
	if (cp932inv_f == TRUE) cp932inv_f = FALSE;
#endif
	break;
    case EUC_JISX0213:
    case EUC_JIS_2004:
	x0212_f = TRUE;
	x0213_f = TRUE;
#ifdef SHIFTJIS_CP932
	if (cp932inv_f == TRUE) cp932inv_f = FALSE;
#endif
	break;
#ifdef UTF8_OUTPUT_ENABLE
    case UTF_8_BOM:
	output_bom_f = TRUE;
	break;
    case UTF_16:
    case UTF_16BE_BOM:
	output_bom_f = TRUE;
	break;
    case UTF_16LE:
	output_endian = ENDIAN_LITTLE;
	output_bom_f = FALSE;
	break;
    case UTF_16LE_BOM:
	output_endian = ENDIAN_LITTLE;
	output_bom_f = TRUE;
	break;
    case UTF_32:
    case UTF_32BE_BOM:
	output_bom_f = TRUE;
	break;
    case UTF_32LE:
	output_endian = ENDIAN_LITTLE;
	output_bom_f = FALSE;
	break;
    case UTF_32LE_BOM:
	output_endian = ENDIAN_LITTLE;
	output_bom_f = TRUE;
	break;
#endif
    }
}

static struct input_code*
find_inputcode_byfunc(nkf_char (*iconv_func)(nkf_char c2,nkf_char c1,nkf_char c0))
{
    if (iconv_func){
	struct input_code *p = input_code_list;
	while (p->name){
	    if (iconv_func == p->iconv_func){
		return p;
	    }
	    p++;
	}
    }
    return 0;
}

static void
set_iconv(nkf_char f, nkf_char (*iconv_func)(nkf_char c2,nkf_char c1,nkf_char c0))
{
#ifdef INPUT_CODE_FIX
    if (f || !input_encoding)
#endif
	if (estab_f != f){
	    estab_f = f;
	}

    if (iconv_func
#ifdef INPUT_CODE_FIX
	&& (f == -TRUE || !input_encoding) /* -TRUE means "FORCE" */
#endif
       ){
	iconv = iconv_func;
    }
#ifdef CHECK_OPTION
    if (estab_f && iconv_for_check != iconv){
	struct input_code *p = find_inputcode_byfunc(iconv);
	if (p){
	    set_input_codename(p->name);
	    debug(p->name);
	}
	iconv_for_check = iconv;
    }
#endif
}

#ifdef X0212_ENABLE
static nkf_char
x0212_shift(nkf_char c)
{
    nkf_char ret = c;
    c &= 0x7f;
    if (is_eucg3(ret)){
	if (0x75 <= c && c <= 0x7f){
	    ret = c + (0x109 - 0x75);
	}
    }else{
	if (0x75 <= c && c <= 0x7f){
	    ret = c + (0x113 - 0x75);
	}
    }
    return ret;
}


static nkf_char
x0212_unshift(nkf_char c)
{
    nkf_char ret = c;
    if (0x7f <= c && c <= 0x88){
	ret = c + (0x75 - 0x7f);
    }else if (0x89 <= c && c <= 0x92){
	ret = PREFIX_EUCG3 | 0x80 | (c + (0x75 - 0x89));
    }
    return ret;
}
#endif /* X0212_ENABLE */

static int
is_x0213_2_in_x0212(nkf_char c1)
{
    static const char x0213_2_table[] =
	{0, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 1, 1, 1};
    int ku = c1 - 0x20;
    if (ku <= 15)
	return x0213_2_table[ku]; /* 1, 3-5, 8, 12-15 */
    if (78 <= ku && ku <= 94)
	return 1;
    return 0;
}

static nkf_char
e2s_conv(nkf_char c2, nkf_char c1, nkf_char *p2, nkf_char *p1)
{
    nkf_char ndx;
    if (is_eucg3(c2)){
	ndx = c2 & 0x7f;
	if (x0213_f && is_x0213_2_in_x0212(ndx)){
	    if((0x21 <= ndx && ndx <= 0x2F)){
		if (p2) *p2 = ((ndx - 1) >> 1) + 0xec - ndx / 8 * 3;
		if (p1) *p1 = c1 + ((ndx & 1) ? ((c1 < 0x60) ? 0x1f : 0x20) : 0x7e);
		return 0;
	    }else if(0x6E <= ndx && ndx <= 0x7E){
		if (p2) *p2 = ((ndx - 1) >> 1) + 0xbe;
		if (p1) *p1 = c1 + ((ndx & 1) ? ((c1 < 0x60) ? 0x1f : 0x20) : 0x7e);
		return 0;
	    }
	    return 1;
	}
#ifdef X0212_ENABLE
	else if(nkf_isgraph(ndx)){
	    nkf_char val = 0;
	    const unsigned short *ptr;
	    ptr = x0212_shiftjis[ndx - 0x21];
	    if (ptr){
		val = ptr[(c1 & 0x7f) - 0x21];
	    }
	    if (val){
		c2 = val >> 8;
		c1 = val & 0xff;
		if (p2) *p2 = c2;
		if (p1) *p1 = c1;
		return 0;
	    }
	    c2 = x0212_shift(c2);
	}
#endif /* X0212_ENABLE */
    }
    if(0x7F < c2) return 1;
    if (p2) *p2 = ((c2 - 1) >> 1) + ((c2 <= 0x5e) ? 0x71 : 0xb1);
    if (p1) *p1 = c1 + ((c2 & 1) ? ((c1 < 0x60) ? 0x1f : 0x20) : 0x7e);
    return 0;
}

static nkf_char
s2e_conv(nkf_char c2, nkf_char c1, nkf_char *p2, nkf_char *p1)
{
#if defined(SHIFTJIS_CP932) || defined(X0212_ENABLE)
    nkf_char val;
#endif
    static const char shift_jisx0213_s1a3_table[5][2] ={ { 1, 8}, { 3, 4}, { 5,12}, {13,14}, {15, 0} };
    if (0xFC < c1) return 1;
#ifdef SHIFTJIS_CP932
    if (!cp932inv_f && !x0213_f && is_ibmext_in_sjis(c2)){
	val = shiftjis_cp932[c2 - CP932_TABLE_BEGIN][c1 - 0x40];
	if (val){
	    c2 = val >> 8;
	    c1 = val & 0xff;
	}
    }
    if (cp932inv_f
	&& CP932INV_TABLE_BEGIN <= c2 && c2 <= CP932INV_TABLE_END){
	val = cp932inv[c2 - CP932INV_TABLE_BEGIN][c1 - 0x40];
	if (val){
	    c2 = val >> 8;
	    c1 = val & 0xff;
	}
    }
#endif /* SHIFTJIS_CP932 */
#ifdef X0212_ENABLE
    if (!x0213_f && is_ibmext_in_sjis(c2)){
	val = shiftjis_x0212[c2 - 0xfa][c1 - 0x40];
	if (val){
	    if (val > 0x7FFF){
		c2 = PREFIX_EUCG3 | ((val >> 8) & 0x7f);
		c1 = val & 0xff;
	    }else{
		c2 = val >> 8;
		c1 = val & 0xff;
	    }
	    if (p2) *p2 = c2;
	    if (p1) *p1 = c1;
	    return 0;
	}
    }
#endif
    if(c2 >= 0x80){
	if(x0213_f && c2 >= 0xF0){
	    if(c2 <= 0xF3 || (c2 == 0xF4 && c1 < 0x9F)){ /* k=1, 3<=k<=5, k=8, 12<=k<=15 */
		c2 = PREFIX_EUCG3 | 0x20 | shift_jisx0213_s1a3_table[c2 - 0xF0][0x9E < c1];
	    }else{ /* 78<=k<=94 */
		c2 = PREFIX_EUCG3 | (c2 * 2 - 0x17B);
		if (0x9E < c1) c2++;
	    }
	}else{
#define         SJ0162  0x00e1          /* 01 - 62 ku offset */
#define         SJ6394  0x0161          /* 63 - 94 ku offset */
	    c2 = c2 + c2 - ((c2 <= 0x9F) ? SJ0162 : SJ6394);
	    if (0x9E < c1) c2++;
	}
	if (c1 < 0x9F)
	    c1 = c1 - ((c1 > DEL) ? SP : 0x1F);
	else {
	    c1 = c1 - 0x7E;
	}
    }

#ifdef X0212_ENABLE
    c2 = x0212_unshift(c2);
#endif
    if (p2) *p2 = c2;
    if (p1) *p1 = c1;
    return 0;
}

#if defined(UTF8_INPUT_ENABLE) || defined(UTF8_OUTPUT_ENABLE)
static void
nkf_unicode_to_utf8(nkf_char val, nkf_char *p1, nkf_char *p2, nkf_char *p3, nkf_char *p4)
{
    val &= VALUE_MASK;
    if (val < 0x80){
	*p1 = val;
	*p2 = 0;
	*p3 = 0;
	*p4 = 0;
    }else if (val < 0x800){
	*p1 = 0xc0 | (val >> 6);
	*p2 = 0x80 | (val & 0x3f);
	*p3 = 0;
	*p4 = 0;
    } else if (nkf_char_unicode_bmp_p(val)) {
	*p1 = 0xe0 |  (val >> 12);
	*p2 = 0x80 | ((val >>  6) & 0x3f);
	*p3 = 0x80 | ( val        & 0x3f);
	*p4 = 0;
    } else if (nkf_char_unicode_value_p(val)) {
	*p1 = 0xf0 |  (val >> 18);
	*p2 = 0x80 | ((val >> 12) & 0x3f);
	*p3 = 0x80 | ((val >>  6) & 0x3f);
	*p4 = 0x80 | ( val        & 0x3f);
    } else {
	*p1 = 0;
	*p2 = 0;
	*p3 = 0;
	*p4 = 0;
    }
}

static nkf_char
nkf_utf8_to_unicode(nkf_char c1, nkf_char c2, nkf_char c3, nkf_char c4)
{
    nkf_char wc;
    if (c1 <= 0x7F) {
	/* single byte */
	wc = c1;
    }
    else if (c1 <= 0xC1) {
	/* trail byte or invalid */
	return -1;
    }
    else if (c1 <= 0xDF) {
	/* 2 bytes */
	wc  = (c1 & 0x1F) << 6;
	wc |= (c2 & 0x3F);
    }
    else if (c1 <= 0xEF) {
	/* 3 bytes */
	wc  = (c1 & 0x0F) << 12;
	wc |= (c2 & 0x3F) << 6;
	wc |= (c3 & 0x3F);
    }
    else if (c2 <= 0xF4) {
	/* 4 bytes */
	wc  = (c1 & 0x0F) << 18;
	wc |= (c2 & 0x3F) << 12;
	wc |= (c3 & 0x3F) << 6;
	wc |= (c4 & 0x3F);
    }
    else {
	return -1;
    }
    return wc;
}
#endif

#ifdef UTF8_INPUT_ENABLE
static int
unicode_to_jis_common2(nkf_char c1, nkf_char c0,
		       const unsigned short *const *pp, nkf_char psize,
		       nkf_char *p2, nkf_char *p1)
{
    nkf_char c2;
    const unsigned short *p;
    unsigned short val;

    if (pp == 0) return 1;

    c1 -= 0x80;
    if (c1 < 0 || psize <= c1) return 1;
    p = pp[c1];
    if (p == 0)  return 1;

    c0 -= 0x80;
    if (c0 < 0 || sizeof_utf8_to_euc_C2 <= c0) return 1;
    val = p[c0];
    if (val == 0) return 1;
    if (no_cp932ext_f && (
			  (val>>8) == 0x2D || /* NEC special characters */
			  val > NKF_INT32_C(0xF300) /* IBM extended characters */
			 )) return 1;

    c2 = val >> 8;
    if (val > 0x7FFF){
	c2 &= 0x7f;
	c2 |= PREFIX_EUCG3;
    }
    if (c2 == SO) c2 = JIS_X_0201_1976_K;
    c1 = val & 0xFF;
    if (p2) *p2 = c2;
    if (p1) *p1 = c1;
    return 0;
}

static int
unicode_to_jis_common(nkf_char c2, nkf_char c1, nkf_char c0, nkf_char *p2, nkf_char *p1)
{
    const unsigned short *const *pp;
    const unsigned short *const *const *ppp;
    static const char no_best_fit_chars_table_C2[] =
    {1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 2, 1, 1, 2,
	0, 0, 1, 1, 0, 1, 0, 1, 2, 1, 1, 1, 1, 1, 1, 1};
    static const char no_best_fit_chars_table_C2_ms[] =
    {1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
	1, 0, 1, 1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0,
	0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0};
    static const char no_best_fit_chars_table_932_C2[] =
    {1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1,
	0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0};
    static const char no_best_fit_chars_table_932_C3[] =
    {1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
	1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1};
    nkf_char ret = 0;

    if(c2 < 0x80){
	*p2 = 0;
	*p1 = c2;
    }else if(c2 < 0xe0){
	if(no_best_fit_chars_f){
	    if(ms_ucs_map_f == UCS_MAP_CP932){
		switch(c2){
		case 0xC2:
		    if(no_best_fit_chars_table_932_C2[c1&0x3F]) return 1;
		    break;
		case 0xC3:
		    if(no_best_fit_chars_table_932_C3[c1&0x3F]) return 1;
		    break;
		}
	    }else if(!cp932inv_f){
		switch(c2){
		case 0xC2:
		    if(no_best_fit_chars_table_C2[c1&0x3F]) return 1;
		    break;
		case 0xC3:
		    if(no_best_fit_chars_table_932_C3[c1&0x3F]) return 1;
		    break;
		}
	    }else if(ms_ucs_map_f == UCS_MAP_MS){
		if(c2 == 0xC2 && no_best_fit_chars_table_C2_ms[c1&0x3F]) return 1;
	    }else if(ms_ucs_map_f == UCS_MAP_CP10001){
		switch(c2){
		case 0xC2:
		    switch(c1){
		    case 0xA2:
		    case 0xA3:
		    case 0xA5:
		    case 0xA6:
		    case 0xAC:
		    case 0xAF:
		    case 0xB8:
			return 1;
		    }
		    break;
		}
	    }
	}
	pp =
	    ms_ucs_map_f == UCS_MAP_CP932 ? utf8_to_euc_2bytes_932 :
	    ms_ucs_map_f == UCS_MAP_MS ? utf8_to_euc_2bytes_ms :
	    ms_ucs_map_f == UCS_MAP_CP10001 ? utf8_to_euc_2bytes_mac :
	    x0213_f ? utf8_to_euc_2bytes_x0213 :
	    utf8_to_euc_2bytes;
	ret =  unicode_to_jis_common2(c2, c1, pp, sizeof_utf8_to_euc_2bytes, p2, p1);
    }else if(c0 < 0xF0){
	if(no_best_fit_chars_f){
	    if(ms_ucs_map_f == UCS_MAP_CP932){
		if(c2 == 0xE3 && c1 == 0x82 && c0 == 0x94) return 1;
	    }else if(ms_ucs_map_f == UCS_MAP_MS){
		switch(c2){
		case 0xE2:
		    switch(c1){
		    case 0x80:
			if(c0 == 0x94 || c0 == 0x96 || c0 == 0xBE) return 1;
			break;
		    case 0x88:
			if(c0 == 0x92) return 1;
			break;
		    }
		    break;
		case 0xE3:
		    if(c1 == 0x80 || c0 == 0x9C) return 1;
		    break;
		}
	    }else if(ms_ucs_map_f == UCS_MAP_CP10001){
		switch(c2){
		case 0xE3:
		    switch(c1){
		    case 0x82:
			if(c0 == 0x94) return 1;
			break;
		    case 0x83:
			if(c0 == 0xBB) return 1;
			break;
		    }
		    break;
		}
	    }else{
		switch(c2){
		case 0xE2:
		    switch(c1){
		    case 0x80:
			if(c0 == 0x95) return 1;
			break;
		    case 0x88:
			if(c0 == 0xA5) return 1;
			break;
		    }
		    break;
		case 0xEF:
		    switch(c1){
		    case 0xBC:
			if(c0 == 0x8D) return 1;
			break;
		    case 0xBD:
			if(c0 == 0x9E && !cp932inv_f) return 1;
			break;
		    case 0xBF:
			if(0xA0 <= c0 && c0 <= 0xA5) return 1;
			break;
		    }
		    break;
		}
	    }
	}
	ppp =
	    ms_ucs_map_f == UCS_MAP_CP932 ? utf8_to_euc_3bytes_932 :
	    ms_ucs_map_f == UCS_MAP_MS ? utf8_to_euc_3bytes_ms :
	    ms_ucs_map_f == UCS_MAP_CP10001 ? utf8_to_euc_3bytes_mac :
	    x0213_f ? utf8_to_euc_3bytes_x0213 :
	    utf8_to_euc_3bytes;
	ret = unicode_to_jis_common2(c1, c0, ppp[c2 - 0xE0], sizeof_utf8_to_euc_C2, p2, p1);
    }else return -1;
#ifdef SHIFTJIS_CP932
    if (!ret&& is_eucg3(*p2)) {
	if (cp932inv_f) {
	    if (encode_fallback) ret = 1;
	}
	else {
	    nkf_char s2, s1;
	    if (e2s_conv(*p2, *p1, &s2, &s1) == 0) {
		s2e_conv(s2, s1, p2, p1);
	    }else{
		ret = 1;
	    }
	}
    }
#endif
    return ret;
}

#ifdef UTF8_OUTPUT_ENABLE
#define X0213_SURROGATE_FIND(tbl, size, euc) do { \
	int i; \
	for (i = 0; i < size; i++) \
	    if (tbl[i][0] == euc) { \
		low = tbl[i][2]; \
		break; \
	    } \
    } while (0)

static nkf_char
e2w_conv(nkf_char c2, nkf_char c1)
{
    const unsigned short *p;

    if (c2 == JIS_X_0201_1976_K) {
	if (ms_ucs_map_f == UCS_MAP_CP10001) {
	    switch (c1) {
	    case 0x20:
		return 0xA0;
	    case 0x7D:
		return 0xA9;
	    }
	}
	p = euc_to_utf8_1byte;
#ifdef X0212_ENABLE
    } else if (is_eucg3(c2)){
	if(ms_ucs_map_f == UCS_MAP_ASCII&& c2 == NKF_INT32_C(0x8F22) && c1 == 0x43){
	    return 0xA6;
	}
	c2 = (c2&0x7f) - 0x21;
	if (0<=c2 && c2<sizeof_euc_to_utf8_2bytes)
	    p =
		x0213_f ? x0212_to_utf8_2bytes_x0213[c2] :
		x0212_to_utf8_2bytes[c2];
	else
	    return 0;
#endif
    } else {
	c2 &= 0x7f;
	c2 = (c2&0x7f) - 0x21;
	if (0<=c2 && c2<sizeof_euc_to_utf8_2bytes)
	    p =
		x0213_f ? euc_to_utf8_2bytes_x0213[c2] :
		ms_ucs_map_f == UCS_MAP_ASCII ? euc_to_utf8_2bytes[c2] :
		ms_ucs_map_f == UCS_MAP_CP10001 ? euc_to_utf8_2bytes_mac[c2] :
		euc_to_utf8_2bytes_ms[c2];
	else
	    return 0;
    }
    if (!p) return 0;
    c1 = (c1 & 0x7f) - 0x21;
    if (0<=c1 && c1<sizeof_euc_to_utf8_1byte) {
	nkf_char val = p[c1];
	if (x0213_f && 0xD800<=val && val<=0xDBFF) {
	    nkf_char euc = (c2+0x21)<<8 | (c1+0x21);
	    nkf_char low = 0;
	    if (p==x0212_to_utf8_2bytes_x0213[c2]) {
		X0213_SURROGATE_FIND(x0213_2_surrogate_table, sizeof_x0213_2_surrogate_table, euc);
	    } else {
		X0213_SURROGATE_FIND(x0213_1_surrogate_table, sizeof_x0213_1_surrogate_table, euc);
	    }
	    if (!low) return 0;
	    return UTF16_TO_UTF32(val, low);
	} else {
	    return val;
	}
    }
    return 0;
}

static nkf_char
e2w_combining(nkf_char comb, nkf_char c2, nkf_char c1)
{
    nkf_char euc;
    int i;
    for (i = 0; i < sizeof_x0213_combining_chars; i++)
	if (x0213_combining_chars[i] == comb)
	    break;
    if (i >= sizeof_x0213_combining_chars)
	return 0;
    euc = (c2&0x7f)<<8 | (c1&0x7f);
    for (i = 0; i < sizeof_x0213_combining_table; i++)
	if (x0213_combining_table[i][0] == euc)
	    return x0213_combining_table[i][1];
    return 0;
}
#endif

static nkf_char
w2e_conv(nkf_char c2, nkf_char c1, nkf_char c0, nkf_char *p2, nkf_char *p1)
{
    nkf_char ret = 0;

    if (!c1){
	*p2 = 0;
	*p1 = c2;
    }else if (0xc0 <= c2 && c2 <= 0xef) {
	ret =  unicode_to_jis_common(c2, c1, c0, p2, p1);
#ifdef NUMCHAR_OPTION
	if (ret > 0){
	    if (p2) *p2 = 0;
	    if (p1) *p1 = nkf_char_unicode_new(nkf_utf8_to_unicode(c2, c1, c0, 0));
	    ret = 0;
	}
#endif
    }
    return ret;
}

#ifdef UTF8_INPUT_ENABLE
static nkf_char
w16e_conv(nkf_char val, nkf_char *p2, nkf_char *p1)
{
    nkf_char c1, c2, c3, c4;
    nkf_char ret = 0;
    val &= VALUE_MASK;
    if (val < 0x80) {
	*p2 = 0;
	*p1 = val;
    }
    else if (nkf_char_unicode_bmp_p(val)){
	nkf_unicode_to_utf8(val, &c1, &c2, &c3, &c4);
	ret =  unicode_to_jis_common(c1, c2, c3, p2, p1);
	if (ret > 0){
	    *p2 = 0;
	    *p1 = nkf_char_unicode_new(val);
	    ret = 0;
	}
    }
    else {
	int i;
	if (x0213_f) {
	    c1 = (val >> 10) + NKF_INT32_C(0xD7C0);   /* high surrogate */
	    c2 = (val & 0x3FF) + NKF_INT32_C(0xDC00); /* low surrogate */
	    for (i = 0; i < sizeof_x0213_1_surrogate_table; i++)
		if (x0213_1_surrogate_table[i][1] == c1 && x0213_1_surrogate_table[i][2] == c2) {
		    val = x0213_1_surrogate_table[i][0];
		    *p2 = val >> 8;
		    *p1 = val & 0xFF;
		    return 0;
		}
	    for (i = 0; i < sizeof_x0213_2_surrogate_table; i++)
		if (x0213_2_surrogate_table[i][1] == c1 && x0213_2_surrogate_table[i][2] == c2) {
		    val = x0213_2_surrogate_table[i][0];
		    *p2 = PREFIX_EUCG3 | (val >> 8);
		    *p1 = val & 0xFF;
		    return 0;
		}
	}
	*p2 = 0;
	*p1 = nkf_char_unicode_new(val);
    }
    return ret;
}
#endif

static nkf_char
e_iconv(nkf_char c2, nkf_char c1, nkf_char c0)
{
    if (c2 == JIS_X_0201_1976_K || c2 == SS2){
	if (iso2022jp_f && !x0201_f) {
	    c2 = GETA1; c1 = GETA2;
	} else {
	    c2 = JIS_X_0201_1976_K;
	    c1 &= 0x7f;
	}
#ifdef X0212_ENABLE
    }else if (c2 == 0x8f){
	if (c0 == 0){
	    return -1;
	}
	if (!cp51932_f && !x0213_f && 0xF5 <= c1 && c1 <= 0xFE && 0xA1 <= c0 && c0 <= 0xFE) {
	    /* encoding is eucJP-ms, so invert to Unicode Private User Area */
	    c1 = nkf_char_unicode_new((c1 - 0xF5) * 94 + c0 - 0xA1 + 0xE3AC);
	    c2 = 0;
	} else {
	    c2 = (c2 << 8) | (c1 & 0x7f);
	    c1 = c0 & 0x7f;
#ifdef SHIFTJIS_CP932
	    if (cp51932_f){
		nkf_char s2, s1;
		if (e2s_conv(c2, c1, &s2, &s1) == 0){
		    s2e_conv(s2, s1, &c2, &c1);
		    if (c2 < 0x100){
			c1 &= 0x7f;
			c2 &= 0x7f;
		    }
		}
	    }
#endif /* SHIFTJIS_CP932 */
	}
#endif /* X0212_ENABLE */
    } else if ((c2 == EOF) || (c2 == 0) || c2 < SP || c2 == ISO_8859_1) {
	/* NOP */
    } else {
	if (!cp51932_f && ms_ucs_map_f && 0xF5 <= c2 && c2 <= 0xFE && 0xA1 <= c1 && c1 <= 0xFE) {
	    /* encoding is eucJP-ms, so invert to Unicode Private User Area */
	    c1 = nkf_char_unicode_new((c2 - 0xF5) * 94 + c1 - 0xA1 + 0xE000);
	    c2 = 0;
	} else {
	    c1 &= 0x7f;
	    c2 &= 0x7f;
#ifdef SHIFTJIS_CP932
	    if (cp51932_f && 0x79 <= c2 && c2 <= 0x7c){
		nkf_char s2, s1;
		if (e2s_conv(c2, c1, &s2, &s1) == 0){
		    s2e_conv(s2, s1, &c2, &c1);
		    if (c2 < 0x100){
			c1 &= 0x7f;
			c2 &= 0x7f;
		    }
		}
	    }
#endif /* SHIFTJIS_CP932 */
	}
    }
    (*oconv)(c2, c1);
    return 0;
}

static nkf_char
s_iconv(ARG_UNUSED nkf_char c2, nkf_char c1, ARG_UNUSED nkf_char c0)
{
    if (c2 == JIS_X_0201_1976_K || (0xA1 <= c2 && c2 <= 0xDF)) {
	if (iso2022jp_f && !x0201_f) {
	    c2 = GETA1; c1 = GETA2;
	} else {
	    c1 &= 0x7f;
	}
    } else if ((c2 == EOF) || (c2 == 0) || c2 < SP) {
	/* NOP */
    } else if (!x0213_f && 0xF0 <= c2 && c2 <= 0xF9 && 0x40 <= c1 && c1 <= 0xFC) {
	/* CP932 UDC */
	if(c1 == 0x7F) return 0;
	c1 = nkf_char_unicode_new((c2 - 0xF0) * 188 + (c1 - 0x40 - (0x7E < c1)) + 0xE000);
	c2 = 0;
    } else {
	nkf_char ret = s2e_conv(c2, c1, &c2, &c1);
	if (ret) return ret;
    }
    (*oconv)(c2, c1);
    return 0;
}

static int
x0213_wait_combining_p(nkf_char wc)
{
    int i;
    for (i = 0; i < sizeof_x0213_combining_table; i++) {
	if (x0213_combining_table[i][1] == wc) {
	    return TRUE;
	}
    }
    return FALSE;
}

static int
x0213_combining_p(nkf_char wc)
{
    int i;
    for (i = 0; i < sizeof_x0213_combining_chars; i++) {
	if (x0213_combining_chars[i] == wc) {
	    return TRUE;
	}
    }
    return FALSE;
}

static nkf_char
w_iconv(nkf_char c1, nkf_char c2, nkf_char c3)
{
    nkf_char ret = 0, c4 = 0;
    static const char w_iconv_utf8_1st_byte[] =
    { /* 0xC0 - 0xFF */
	20, 20, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
	21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
	30, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 31, 32, 33, 33,
	40, 41, 41, 41, 42, 43, 43, 43, 50, 50, 50, 50, 60, 60, 70, 70};

    if (c3 > 0xFF) {
	c4 = c3 & 0xFF;
	c3 >>= 8;
    }

    if (c1 < 0 || 0xff < c1) {
    }else if (c1 == 0) { /* 0 : 1 byte*/
	c3 = 0;
    } else if ((c1 & 0xC0) == 0x80) { /* 0x80-0xbf : trail byte */
	return 0;
    } else{
	switch (w_iconv_utf8_1st_byte[c1 - 0xC0]) {
	case 21:
	    if (c2 < 0x80 || 0xBF < c2) return 0;
	    break;
	case 30:
	    if (c3 == 0) return -1;
	    if (c2 < 0xA0 || 0xBF < c2 || (c3 & 0xC0) != 0x80)
		return 0;
	    break;
	case 31:
	case 33:
	    if (c3 == 0) return -1;
	    if ((c2 & 0xC0) != 0x80 || (c3 & 0xC0) != 0x80)
		return 0;
	    break;
	case 32:
	    if (c3 == 0) return -1;
	    if (c2 < 0x80 || 0x9F < c2 || (c3 & 0xC0) != 0x80)
		return 0;
	    break;
	case 40:
	    if (c3 == 0) return -2;
	    if (c2 < 0x90 || 0xBF < c2 || (c3 & 0xC0) != 0x80 || (c4 & 0xC0) != 0x80)
		return 0;
	    break;
	case 41:
	    if (c3 == 0) return -2;
	    if (c2 < 0x80 || 0xBF < c2 || (c3 & 0xC0) != 0x80 || (c4 & 0xC0) != 0x80)
		return 0;
	    break;
	case 42:
	    if (c3 == 0) return -2;
	    if (c2 < 0x80 || 0x8F < c2 || (c3 & 0xC0) != 0x80 || (c4 & 0xC0) != 0x80)
		return 0;
	    break;
	default:
	    return 0;
	    break;
	}
    }
    if (c1 == 0 || c1 == EOF){
    } else if ((c1 & 0xf8) == 0xf0) { /* 4 bytes */
	c2 = nkf_char_unicode_new(nkf_utf8_to_unicode(c1, c2, c3, c4));
	c1 = 0;
    } else {
	if (x0213_f && x0213_wait_combining_p(nkf_utf8_to_unicode(c1, c2, c3, c4)))
	    return -3;
	ret = w2e_conv(c1, c2, c3, &c1, &c2);
    }
    if (ret == 0){
	(*oconv)(c1, c2);
    }
    return ret;
}

static nkf_char
w_iconv_nocombine(nkf_char c1, nkf_char c2, nkf_char c3)
{
    /* continue from the line below 'return -3;' in w_iconv() */
    nkf_char ret = w2e_conv(c1, c2, c3, &c1, &c2);
    if (ret == 0){
	(*oconv)(c1, c2);
    }
    return ret;
}

#define NKF_ICONV_INVALID_CODE_RANGE -13
#define NKF_ICONV_WAIT_COMBINING_CHAR -14
#define NKF_ICONV_NOT_COMBINED -15
static size_t
unicode_iconv(nkf_char wc, int nocombine)
{
    nkf_char c1, c2;
    int ret = 0;

    if (wc < 0x80) {
	c2 = 0;
	c1 = wc;
    }else if ((wc>>11) == 27) {
	/* unpaired surrogate */
	return NKF_ICONV_INVALID_CODE_RANGE;
    }else if (wc < 0xFFFF) {
	if (!nocombine && x0213_f && x0213_wait_combining_p(wc))
	    return NKF_ICONV_WAIT_COMBINING_CHAR;
	ret = w16e_conv(wc, &c2, &c1);
	if (ret) return ret;
    }else if (wc < 0x10FFFF) {
	c2 = 0;
	c1 = nkf_char_unicode_new(wc);
    } else {
	return NKF_ICONV_INVALID_CODE_RANGE;
    }
    (*oconv)(c2, c1);
    return 0;
}

static nkf_char
unicode_iconv_combine(nkf_char wc, nkf_char wc2)
{
    nkf_char c1, c2;
    int i;

    if (wc2 < 0x80) {
	return NKF_ICONV_NOT_COMBINED;
    }else if ((wc2>>11) == 27) {
	/* unpaired surrogate */
	return NKF_ICONV_INVALID_CODE_RANGE;
    }else if (wc2 < 0xFFFF) {
	if (!x0213_combining_p(wc2))
	    return NKF_ICONV_NOT_COMBINED;
	for (i = 0; i < sizeof_x0213_combining_table; i++) {
	    if (x0213_combining_table[i][1] == wc &&
		x0213_combining_table[i][2] == wc2) {
		c2 = x0213_combining_table[i][0] >> 8;
		c1 = x0213_combining_table[i][0] & 0x7f;
		(*oconv)(c2, c1);
		return 0;
	    }
	}
    }else if (wc2 < 0x10FFFF) {
	return NKF_ICONV_NOT_COMBINED;
    } else {
	return NKF_ICONV_INVALID_CODE_RANGE;
    }
    return NKF_ICONV_NOT_COMBINED;
}

static nkf_char
w_iconv_combine(nkf_char c1, nkf_char c2, nkf_char c3, nkf_char c4, nkf_char c5, nkf_char c6)
{
    nkf_char wc, wc2;
    wc = nkf_utf8_to_unicode(c1, c2, c3, 0);
    wc2 = nkf_utf8_to_unicode(c4, c5, c6, 0);
    if (wc2 < 0)
	return wc2;
    return unicode_iconv_combine(wc, wc2);
}

#define NKF_ICONV_NEED_ONE_MORE_BYTE (size_t)-1
#define NKF_ICONV_NEED_TWO_MORE_BYTES (size_t)-2
static size_t
nkf_iconv_utf_16(nkf_char c1, nkf_char c2, nkf_char c3, nkf_char c4)
{
    nkf_char wc;

    if (c1 == EOF) {
	(*oconv)(EOF, 0);
	return 0;
    }

    if (input_endian == ENDIAN_BIG) {
	if (0xD8 <= c1 && c1 <= 0xDB) {
	    if (0xDC <= c3 && c3 <= 0xDF) {
		wc = UTF16_TO_UTF32(c1 << 8 | c2, c3 << 8 | c4);
	    } else return NKF_ICONV_NEED_TWO_MORE_BYTES;
	} else {
	    wc = c1 << 8 | c2;
	}
    } else {
	if (0xD8 <= c2 && c2 <= 0xDB) {
	    if (0xDC <= c4 && c4 <= 0xDF) {
		wc = UTF16_TO_UTF32(c2 << 8 | c1, c4 << 8 | c3);
	    } else return NKF_ICONV_NEED_TWO_MORE_BYTES;
	} else {
	    wc = c2 << 8 | c1;
	}
    }

    return (*unicode_iconv)(wc, FALSE);
}

static size_t
nkf_iconv_utf_16_combine(nkf_char c1, nkf_char c2, nkf_char c3, nkf_char c4)
{
    nkf_char wc, wc2;

    if (input_endian == ENDIAN_BIG) {
	if (0xD8 <= c3 && c3 <= 0xDB) {
	    return NKF_ICONV_NOT_COMBINED;
	} else {
	    wc = c1 << 8 | c2;
	    wc2 = c3 << 8 | c4;
	}
    } else {
	if (0xD8 <= c2 && c2 <= 0xDB) {
	    return NKF_ICONV_NOT_COMBINED;
	} else {
	    wc = c2 << 8 | c1;
	    wc2 = c4 << 8 | c3;
	}
    }

    return unicode_iconv_combine(wc, wc2);
}

static size_t
nkf_iconv_utf_16_nocombine(nkf_char c1, nkf_char c2)
{
    nkf_char wc;
    if (input_endian == ENDIAN_BIG)
	wc = c1 << 8 | c2;
    else
	wc = c2 << 8 | c1;
    return (*unicode_iconv)(wc, TRUE);
}

static nkf_char
w_iconv16(nkf_char c2, nkf_char c1, ARG_UNUSED nkf_char c0)
{
    (*oconv)(c2, c1);
    return 16; /* different from w_iconv32 */
}

static nkf_char
w_iconv32(nkf_char c2, nkf_char c1, ARG_UNUSED nkf_char c0)
{
    (*oconv)(c2, c1);
    return 32; /* different from w_iconv16 */
}

static nkf_char
utf32_to_nkf_char(nkf_char c1, nkf_char c2, nkf_char c3, nkf_char c4)
{
    nkf_char wc;

    switch(input_endian){
    case ENDIAN_BIG:
	wc = c2 << 16 | c3 << 8 | c4;
	break;
    case ENDIAN_LITTLE:
	wc = c3 << 16 | c2 << 8 | c1;
	break;
    case ENDIAN_2143:
	wc = c1 << 16 | c4 << 8 | c3;
	break;
    case ENDIAN_3412:
	wc = c4 << 16 | c1 << 8 | c2;
	break;
    default:
	return NKF_ICONV_INVALID_CODE_RANGE;
    }
    return wc;
}

static size_t
nkf_iconv_utf_32(nkf_char c1, nkf_char c2, nkf_char c3, nkf_char c4)
{
    nkf_char wc;

    if (c1 == EOF) {
	(*oconv)(EOF, 0);
	return 0;
    }

    wc = utf32_to_nkf_char(c1, c2, c3, c4);
    if (wc < 0)
	return wc;

    return (*unicode_iconv)(wc, FALSE);
}

static nkf_char
nkf_iconv_utf_32_combine(nkf_char c1, nkf_char c2, nkf_char c3, nkf_char c4, nkf_char c5, nkf_char c6, nkf_char c7, nkf_char c8)
{
    nkf_char wc, wc2;

    wc = utf32_to_nkf_char(c1, c2, c3, c4);
    if (wc < 0)
	return wc;
    wc2 = utf32_to_nkf_char(c5, c6, c7, c8);
    if (wc2 < 0)
	return wc2;

    return unicode_iconv_combine(wc, wc2);
}

static size_t
nkf_iconv_utf_32_nocombine(nkf_char c1, nkf_char c2, nkf_char c3, nkf_char c4)
{
    nkf_char wc;

    wc = utf32_to_nkf_char(c1, c2, c3, c4);
    return (*unicode_iconv)(wc, TRUE);
}
#endif

#define output_ascii_escape_sequence(mode) do { \
	    if (output_mode != ASCII && output_mode != ISO_8859_1) { \
		    (*o_putc)(ESC); \
		    (*o_putc)('('); \
		    (*o_putc)(ascii_intro); \
		    output_mode = mode; \
	    } \
    } while (0)

static void
output_escape_sequence(int mode)
{
    if (output_mode == mode)
	return;
    switch(mode) {
    case ISO_8859_1:
	(*o_putc)(ESC);
	(*o_putc)('.');
	(*o_putc)('A');
	break;
    case JIS_X_0201_1976_K:
	(*o_putc)(ESC);
	(*o_putc)('(');
	(*o_putc)('I');
	break;
    case JIS_X_0208:
	(*o_putc)(ESC);
	(*o_putc)('$');
	(*o_putc)(kanji_intro);
	break;
    case JIS_X_0212:
	(*o_putc)(ESC);
	(*o_putc)('$');
	(*o_putc)('(');
	(*o_putc)('D');
	break;
    case JIS_X_0213_1:
	(*o_putc)(ESC);
	(*o_putc)('$');
	(*o_putc)('(');
	(*o_putc)('Q');
	break;
    case JIS_X_0213_2:
	(*o_putc)(ESC);
	(*o_putc)('$');
	(*o_putc)('(');
	(*o_putc)('P');
	break;
    }
    output_mode = mode;
}

static void
j_oconv(nkf_char c2, nkf_char c1)
{
#ifdef NUMCHAR_OPTION
    if (c2 == 0 && nkf_char_unicode_p(c1)){
	w16e_conv(c1, &c2, &c1);
	if (c2 == 0 && nkf_char_unicode_p(c1)){
	    c2 = c1 & VALUE_MASK;
	    if (ms_ucs_map_f && 0xE000 <= c2 && c2 <= 0xE757) {
		/* CP5022x UDC */
		c1 &= 0xFFF;
		c2 = 0x7F + c1 / 94;
		c1 = 0x21 + c1 % 94;
	    } else {
		if (encode_fallback) (*encode_fallback)(c1);
		return;
	    }
	}
    }
#endif
    if (c2 == 0) {
	output_ascii_escape_sequence(ASCII);
	(*o_putc)(c1);
    }
    else if (c2 == EOF) {
	output_ascii_escape_sequence(ASCII);
	(*o_putc)(EOF);
    }
    else if (c2 == ISO_8859_1) {
	output_ascii_escape_sequence(ISO_8859_1);
	(*o_putc)(c1|0x80);
    }
    else if (c2 == JIS_X_0201_1976_K) {
	output_escape_sequence(JIS_X_0201_1976_K);
	(*o_putc)(c1);
#ifdef X0212_ENABLE
    } else if (is_eucg3(c2)){
	output_escape_sequence(x0213_f ? JIS_X_0213_2 : JIS_X_0212);
	(*o_putc)(c2 & 0x7f);
	(*o_putc)(c1);
#endif
    } else {
	if(ms_ucs_map_f
	   ? c2<0x20 || 0x92<c2 || c1<0x20 || 0x7e<c1
	   : c2<0x20 || 0x7e<c2 || c1<0x20 || 0x7e<c1) return;
	output_escape_sequence(x0213_f ? JIS_X_0213_1 : JIS_X_0208);
	(*o_putc)(c2);
	(*o_putc)(c1);
    }
}

static void
e_oconv(nkf_char c2, nkf_char c1)
{
    if (c2 == 0 && nkf_char_unicode_p(c1)){
	w16e_conv(c1, &c2, &c1);
	if (c2 == 0 && nkf_char_unicode_p(c1)){
	    c2 = c1 & VALUE_MASK;
	    if (x0212_f && 0xE000 <= c2 && c2 <= 0xE757) {
		/* eucJP-ms UDC */
		c1 &= 0xFFF;
		c2 = c1 / 94;
		c2 += c2 < 10 ? 0x75 : 0x8FEB;
		c1 = 0x21 + c1 % 94;
		if (is_eucg3(c2)){
		    (*o_putc)(0x8f);
		    (*o_putc)((c2 & 0x7f) | 0x080);
		    (*o_putc)(c1 | 0x080);
		}else{
		    (*o_putc)((c2 & 0x7f) | 0x080);
		    (*o_putc)(c1 | 0x080);
		}
		return;
	    } else {
		if (encode_fallback) (*encode_fallback)(c1);
		return;
	    }
	}
    }

    if (c2 == EOF) {
	(*o_putc)(EOF);
    } else if (c2 == 0) {
	output_mode = ASCII;
	(*o_putc)(c1);
    } else if (c2 == JIS_X_0201_1976_K) {
	output_mode = EUC_JP;
	(*o_putc)(SS2); (*o_putc)(c1|0x80);
    } else if (c2 == ISO_8859_1) {
	output_mode = ISO_8859_1;
	(*o_putc)(c1 | 0x080);
#ifdef X0212_ENABLE
    } else if (is_eucg3(c2)){
	output_mode = EUC_JP;
#ifdef SHIFTJIS_CP932
	if (!cp932inv_f){
	    nkf_char s2, s1;
	    if (e2s_conv(c2, c1, &s2, &s1) == 0){
		s2e_conv(s2, s1, &c2, &c1);
	    }
	}
#endif
	if (c2 == 0) {
	    output_mode = ASCII;
	    (*o_putc)(c1);
	}else if (is_eucg3(c2)){
	    if (x0212_f){
		(*o_putc)(0x8f);
		(*o_putc)((c2 & 0x7f) | 0x080);
		(*o_putc)(c1 | 0x080);
	    }
	}else{
	    (*o_putc)((c2 & 0x7f) | 0x080);
	    (*o_putc)(c1 | 0x080);
	}
#endif
    } else {
	if (!nkf_isgraph(c1) || !nkf_isgraph(c2)) {
	    set_iconv(FALSE, 0);
	    return; /* too late to rescue this char */
	}
	output_mode = EUC_JP;
	(*o_putc)(c2 | 0x080);
	(*o_putc)(c1 | 0x080);
    }
}

static void
s_oconv(nkf_char c2, nkf_char c1)
{
#ifdef NUMCHAR_OPTION
    if (c2 == 0 && nkf_char_unicode_p(c1)){
	w16e_conv(c1, &c2, &c1);
	if (c2 == 0 && nkf_char_unicode_p(c1)){
	    c2 = c1 & VALUE_MASK;
	    if (!x0213_f && 0xE000 <= c2 && c2 <= 0xE757) {
		/* CP932 UDC */
		c1 &= 0xFFF;
		c2 = c1 / 188 + (cp932inv_f ? 0xF0 : 0xEB);
		c1 = c1 % 188;
		c1 += 0x40 + (c1 > 0x3e);
		(*o_putc)(c2);
		(*o_putc)(c1);
		return;
	    } else {
		if(encode_fallback)(*encode_fallback)(c1);
		return;
	    }
	}
    }
#endif
    if (c2 == EOF) {
	(*o_putc)(EOF);
	return;
    } else if (c2 == 0) {
	output_mode = ASCII;
	(*o_putc)(c1);
    } else if (c2 == JIS_X_0201_1976_K) {
	output_mode = SHIFT_JIS;
	(*o_putc)(c1|0x80);
    } else if (c2 == ISO_8859_1) {
	output_mode = ISO_8859_1;
	(*o_putc)(c1 | 0x080);
#ifdef X0212_ENABLE
    } else if (is_eucg3(c2)){
	output_mode = SHIFT_JIS;
	if (e2s_conv(c2, c1, &c2, &c1) == 0){
	    (*o_putc)(c2);
	    (*o_putc)(c1);
	}
#endif
    } else {
	if (!nkf_isprint(c1) || !nkf_isprint(c2)) {
	    set_iconv(FALSE, 0);
	    return; /* too late to rescue this char */
	}
	output_mode = SHIFT_JIS;
	e2s_conv(c2, c1, &c2, &c1);

#ifdef SHIFTJIS_CP932
	if (cp932inv_f
	    && CP932INV_TABLE_BEGIN <= c2 && c2 <= CP932INV_TABLE_END){
	    nkf_char c = cp932inv[c2 - CP932INV_TABLE_BEGIN][c1 - 0x40];
	    if (c){
		c2 = c >> 8;
		c1 = c & 0xff;
	    }
	}
#endif /* SHIFTJIS_CP932 */

	(*o_putc)(c2);
	if (prefix_table[(unsigned char)c1]){
	    (*o_putc)(prefix_table[(unsigned char)c1]);
	}
	(*o_putc)(c1);
    }
}

#ifdef UTF8_OUTPUT_ENABLE
#define OUTPUT_UTF8(val) do { \
	nkf_unicode_to_utf8(val, &c1, &c2, &c3, &c4); \
	(*o_putc)(c1); \
	if (c2) (*o_putc)(c2); \
	if (c3) (*o_putc)(c3); \
	if (c4) (*o_putc)(c4); \
    } while (0)

static void
w_oconv(nkf_char c2, nkf_char c1)
{
    nkf_char c3, c4;
    nkf_char val, val2;

    if (output_bom_f) {
	output_bom_f = FALSE;
	(*o_putc)('\357');
	(*o_putc)('\273');
	(*o_putc)('\277');
    }

    if (c2 == EOF) {
	(*o_putc)(EOF);
	return;
    }

    if (c2 == 0 && nkf_char_unicode_p(c1)){
	val = c1 & VALUE_MASK;
	OUTPUT_UTF8(val);
	return;
    }

    if (c2 == 0) {
	(*o_putc)(c1);
    } else {
	val = e2w_conv(c2, c1);
	if (val){
	    val2 = e2w_combining(val, c2, c1);
	    if (val2)
		OUTPUT_UTF8(val2);
	    OUTPUT_UTF8(val);
	}
    }
}

#define OUTPUT_UTF16_BYTES(c1, c2) do { \
	if (output_endian == ENDIAN_LITTLE){ \
	    (*o_putc)(c1); \
	    (*o_putc)(c2); \
	}else{ \
	    (*o_putc)(c2); \
	    (*o_putc)(c1); \
	} \
    } while (0)

#define OUTPUT_UTF16(val) do { \
	if (nkf_char_unicode_bmp_p(val)) { \
	    c2 = (val >> 8) & 0xff; \
	    c1 = val & 0xff; \
	    OUTPUT_UTF16_BYTES(c1, c2); \
	} else { \
	    val &= VALUE_MASK; \
	    if (val <= UNICODE_MAX) { \
		c2 = (val >> 10) + NKF_INT32_C(0xD7C0);   /* high surrogate */ \
		c1 = (val & 0x3FF) + NKF_INT32_C(0xDC00); /* low surrogate */ \
		OUTPUT_UTF16_BYTES(c2 & 0xff, (c2 >> 8) & 0xff); \
		OUTPUT_UTF16_BYTES(c1 & 0xff, (c1 >> 8) & 0xff); \
	    } \
	} \
    } while (0)

static void
w_oconv16(nkf_char c2, nkf_char c1)
{
    if (output_bom_f) {
	output_bom_f = FALSE;
	OUTPUT_UTF16_BYTES(0xFF, 0xFE);
    }

    if (c2 == EOF) {
	(*o_putc)(EOF);
	return;
    }

    if (c2 == 0 && nkf_char_unicode_p(c1)) {
	OUTPUT_UTF16(c1);
    } else if (c2) {
	nkf_char val, val2;
	val = e2w_conv(c2, c1);
	if (!val) return;
	val2 = e2w_combining(val, c2, c1);
	if (val2)
	    OUTPUT_UTF16(val2);
	OUTPUT_UTF16(val);
    } else {
	OUTPUT_UTF16_BYTES(c1, c2);
    }
}

#define OUTPUT_UTF32(c) do { \
	if (output_endian == ENDIAN_LITTLE){ \
	    (*o_putc)( (c)        & 0xFF); \
	    (*o_putc)(((c) >>  8) & 0xFF); \
	    (*o_putc)(((c) >> 16) & 0xFF); \
	    (*o_putc)(0); \
	}else{ \
	    (*o_putc)(0); \
	    (*o_putc)(((c) >> 16) & 0xFF); \
	    (*o_putc)(((c) >>  8) & 0xFF); \
	    (*o_putc)( (c)        & 0xFF); \
	} \
    } while (0)

static void
w_oconv32(nkf_char c2, nkf_char c1)
{
    if (output_bom_f) {
	output_bom_f = FALSE;
	if (output_endian == ENDIAN_LITTLE){
	    (*o_putc)(0xFF);
	    (*o_putc)(0xFE);
	    (*o_putc)(0);
	    (*o_putc)(0);
	}else{
	    (*o_putc)(0);
	    (*o_putc)(0);
	    (*o_putc)(0xFE);
	    (*o_putc)(0xFF);
	}
    }

    if (c2 == EOF) {
	(*o_putc)(EOF);
	return;
    }

    if (c2 == ISO_8859_1) {
	c1 |= 0x80;
    } else if (c2 == 0 && nkf_char_unicode_p(c1)) {
	c1 &= VALUE_MASK;
    } else if (c2) {
	nkf_char val, val2;
	val = e2w_conv(c2, c1);
	if (!val) return;
	val2 = e2w_combining(val, c2, c1);
	if (val2)
	    OUTPUT_UTF32(val2);
	c1 = val;
    }
    OUTPUT_UTF32(c1);
}
#endif

#define SCORE_L2       (1)                   /* Kanji Level 2 */
#define SCORE_KANA     (SCORE_L2 << 1)       /* Halfwidth Katakana */
#define SCORE_DEPEND   (SCORE_KANA << 1)     /* MD Characters */
#define SCORE_CP932    (SCORE_DEPEND << 1)   /* IBM extended characters */
#define SCORE_X0212    (SCORE_CP932 << 1)    /* JIS X 0212 */
#define SCORE_X0213    (SCORE_X0212 << 1)    /* JIS X 0213 */
#define SCORE_NO_EXIST (SCORE_X0213 << 1)    /* Undefined Characters */
#define SCORE_iMIME    (SCORE_NO_EXIST << 1) /* MIME selected */
#define SCORE_ERROR    (SCORE_iMIME << 1) /* Error */

#define SCORE_INIT (SCORE_iMIME)

static const nkf_char score_table_A0[] = {
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, SCORE_DEPEND, SCORE_DEPEND, SCORE_DEPEND,
    SCORE_DEPEND, SCORE_DEPEND, SCORE_DEPEND, SCORE_X0213,
};

static const nkf_char score_table_F0[] = {
    SCORE_L2, SCORE_L2, SCORE_L2, SCORE_L2,
    SCORE_L2, SCORE_DEPEND, SCORE_X0213, SCORE_X0213,
    SCORE_DEPEND, SCORE_DEPEND, SCORE_CP932, SCORE_CP932,
    SCORE_CP932, SCORE_X0213, SCORE_X0213, SCORE_ERROR,
};

static const nkf_char score_table_8FA0[] = {
    0, SCORE_X0213, SCORE_X0212, SCORE_X0213,
    SCORE_X0213, SCORE_X0213, SCORE_X0212, SCORE_X0212,
    SCORE_X0213, SCORE_X0212, SCORE_X0212, SCORE_X0212,
    SCORE_X0213, SCORE_X0213, SCORE_X0213, SCORE_X0213,
};

static const nkf_char score_table_8FE0[] = {
    SCORE_X0212, SCORE_X0212, SCORE_X0212, SCORE_X0212,
    SCORE_X0212, SCORE_X0212, SCORE_X0212, SCORE_X0212,
    SCORE_X0212, SCORE_X0212, SCORE_X0212, SCORE_X0212,
    SCORE_X0212, SCORE_X0212, SCORE_X0213, SCORE_X0213,
};

static const nkf_char score_table_8FF0[] = {
    SCORE_X0213, SCORE_X0213, SCORE_X0213, SCORE_X0212,
    SCORE_X0212, SCORE_X0213, SCORE_X0213, SCORE_X0213,
    SCORE_X0213, SCORE_X0213, SCORE_X0213, SCORE_X0213,
    SCORE_X0213, SCORE_X0213, SCORE_X0213, SCORE_X0213,
};

static void
set_code_score(struct input_code *ptr, nkf_char score)
{
    if (ptr){
	ptr->score |= score;
    }
}

static void
clr_code_score(struct input_code *ptr, nkf_char score)
{
    if (ptr){
	ptr->score &= ~score;
    }
}

static void
code_score(struct input_code *ptr)
{
    nkf_char c2 = ptr->buf[0];
    nkf_char c1 = ptr->buf[1];
    if (c2 < 0){
	set_code_score(ptr, SCORE_ERROR);
    }else if (c2 == SS2){
	set_code_score(ptr, SCORE_KANA);
    }else if (c2 == 0x8f){
	if ((c1 & 0x70) == 0x20){
	    set_code_score(ptr, score_table_8FA0[c1 & 0x0f]);
	}else if ((c1 & 0x70) == 0x60){
	    set_code_score(ptr, score_table_8FE0[c1 & 0x0f]);
	}else if ((c1 & 0x70) == 0x70){
	    set_code_score(ptr, score_table_8FF0[c1 & 0x0f]);
	}else{
	    set_code_score(ptr, SCORE_X0212);
	}
#ifdef UTF8_OUTPUT_ENABLE
    }else if (!e2w_conv(c2, c1)){
	set_code_score(ptr, SCORE_NO_EXIST);
#endif
    }else if ((c2 & 0x70) == 0x20){
	set_code_score(ptr, score_table_A0[c2 & 0x0f]);
    }else if ((c2 & 0x70) == 0x70){
	set_code_score(ptr, score_table_F0[c2 & 0x0f]);
    }else if ((c2 & 0x70) >= 0x50){
	set_code_score(ptr, SCORE_L2);
    }
}

static void
status_disable(struct input_code *ptr)
{
    ptr->stat = -1;
    ptr->buf[0] = -1;
    code_score(ptr);
    if (iconv == ptr->iconv_func) set_iconv(FALSE, 0);
}

static void
status_push_ch(struct input_code *ptr, nkf_char c)
{
    ptr->buf[ptr->index++] = c;
}

static void
status_clear(struct input_code *ptr)
{
    ptr->stat = 0;
    ptr->index = 0;
}

static void
status_reset(struct input_code *ptr)
{
    status_clear(ptr);
    ptr->score = SCORE_INIT;
}

static void
status_reinit(struct input_code *ptr)
{
    status_reset(ptr);
    ptr->_file_stat = 0;
}

static void
status_check(struct input_code *ptr, nkf_char c)
{
    if (c <= DEL && estab_f){
	status_reset(ptr);
    }
}

static void
s_status(struct input_code *ptr, nkf_char c)
{
    switch(ptr->stat){
    case -1:
	status_check(ptr, c);
	break;
    case 0:
	if (c <= DEL){
	    break;
	}else if (nkf_char_unicode_p(c)){
	    break;
	}else if (0xa1 <= c && c <= 0xdf){
	    status_push_ch(ptr, SS2);
	    status_push_ch(ptr, c);
	    code_score(ptr);
	    status_clear(ptr);
	}else if ((0x81 <= c && c < 0xa0) || (0xe0 <= c && c <= 0xea)){
	    ptr->stat = 1;
	    status_push_ch(ptr, c);
	}else if (0xed <= c && c <= 0xee){
	    ptr->stat = 3;
	    status_push_ch(ptr, c);
#ifdef SHIFTJIS_CP932
	}else if (is_ibmext_in_sjis(c)){
	    ptr->stat = 2;
	    status_push_ch(ptr, c);
#endif /* SHIFTJIS_CP932 */
#ifdef X0212_ENABLE
	}else if (0xf0 <= c && c <= 0xfc){
	    ptr->stat = 1;
	    status_push_ch(ptr, c);
#endif /* X0212_ENABLE */
	}else{
	    status_disable(ptr);
	}
	break;
    case 1:
	if ((0x40 <= c && c <= 0x7e) || (0x80 <= c && c <= 0xfc)){
	    status_push_ch(ptr, c);
	    s2e_conv(ptr->buf[0], ptr->buf[1], &ptr->buf[0], &ptr->buf[1]);
	    code_score(ptr);
	    status_clear(ptr);
	}else{
	    status_disable(ptr);
	}
	break;
    case 2:
#ifdef SHIFTJIS_CP932
	if ((0x40 <= c && c <= 0x7e) || (0x80 <= c && c <= 0xfc)) {
	    status_push_ch(ptr, c);
	    if (s2e_conv(ptr->buf[0], ptr->buf[1], &ptr->buf[0], &ptr->buf[1]) == 0) {
		set_code_score(ptr, SCORE_CP932);
		status_clear(ptr);
		break;
	    }
	}
#endif /* SHIFTJIS_CP932 */
	status_disable(ptr);
	break;
    case 3:
	if ((0x40 <= c && c <= 0x7e) || (0x80 <= c && c <= 0xfc)){
	    status_push_ch(ptr, c);
	    s2e_conv(ptr->buf[0], ptr->buf[1], &ptr->buf[0], &ptr->buf[1]);
	    set_code_score(ptr, SCORE_CP932);
	    status_clear(ptr);
	}else{
	    status_disable(ptr);
	}
	break;
    }
}

static void
e_status(struct input_code *ptr, nkf_char c)
{
    switch (ptr->stat){
    case -1:
	status_check(ptr, c);
	break;
    case 0:
	if (c <= DEL){
	    break;
	}else if (nkf_char_unicode_p(c)){
	    break;
	}else if (SS2 == c || (0xa1 <= c && c <= 0xfe)){
	    ptr->stat = 1;
	    status_push_ch(ptr, c);
#ifdef X0212_ENABLE
	}else if (0x8f == c){
	    ptr->stat = 2;
	    status_push_ch(ptr, c);
#endif /* X0212_ENABLE */
	}else{
	    status_disable(ptr);
	}
	break;
    case 1:
	if (0xa1 <= c && c <= 0xfe){
	    status_push_ch(ptr, c);
	    code_score(ptr);
	    status_clear(ptr);
	}else{
	    status_disable(ptr);
	}
	break;
#ifdef X0212_ENABLE
    case 2:
	if (0xa1 <= c && c <= 0xfe){
	    ptr->stat = 1;
	    status_push_ch(ptr, c);
	}else{
	    status_disable(ptr);
	}
#endif /* X0212_ENABLE */
    }
}

#ifdef UTF8_INPUT_ENABLE
static void
w_status(struct input_code *ptr, nkf_char c)
{
    switch (ptr->stat){
    case -1:
	status_check(ptr, c);
	break;
    case 0:
	if (c <= DEL){
	    break;
	}else if (nkf_char_unicode_p(c)){
	    break;
	}else if (0xc0 <= c && c <= 0xdf){
	    ptr->stat = 1;
	    status_push_ch(ptr, c);
	}else if (0xe0 <= c && c <= 0xef){
	    ptr->stat = 2;
	    status_push_ch(ptr, c);
	}else if (0xf0 <= c && c <= 0xf4){
	    ptr->stat = 3;
	    status_push_ch(ptr, c);
	}else{
	    status_disable(ptr);
	}
	break;
    case 1:
    case 2:
	if (0x80 <= c && c <= 0xbf){
	    status_push_ch(ptr, c);
	    if (ptr->index > ptr->stat){
		int bom = (ptr->buf[0] == 0xef && ptr->buf[1] == 0xbb
			   && ptr->buf[2] == 0xbf);
		w2e_conv(ptr->buf[0], ptr->buf[1], ptr->buf[2],
			 &ptr->buf[0], &ptr->buf[1]);
		if (!bom){
		    code_score(ptr);
		}
		status_clear(ptr);
	    }
	}else{
	    status_disable(ptr);
	}
	break;
    case 3:
	if (0x80 <= c && c <= 0xbf){
	    if (ptr->index < ptr->stat){
		status_push_ch(ptr, c);
	    } else {
		status_clear(ptr);
	    }
	}else{
	    status_disable(ptr);
	}
	break;
    }
}
#endif

static void
code_status(nkf_char c)
{
    int action_flag = 1;
    struct input_code *result = 0;
    struct input_code *p = input_code_list;
    while (p->name){
	if (!p->status_func) {
	    ++p;
	    continue;
	}
	if (!p->status_func)
	    continue;
	(p->status_func)(p, c);
	if (p->stat > 0){
	    action_flag = 0;
	}else if(p->stat == 0){
	    if (result){
		action_flag = 0;
	    }else{
		result = p;
	    }
	}
	++p;
    }

    if (action_flag){
	if (result && !estab_f){
	    set_iconv(TRUE, result->iconv_func);
	}else if (c <= DEL){
	    struct input_code *ptr = input_code_list;
	    while (ptr->name){
		status_reset(ptr);
		++ptr;
	    }
	}
    }
}

typedef struct {
    nkf_buf_t *std_gc_buf;
    nkf_char broken_state;
    nkf_buf_t *broken_buf;
    nkf_char mimeout_state;
    nkf_buf_t *nfc_buf;
} nkf_state_t;

static nkf_state_t *nkf_state = NULL;

#define STD_GC_BUFSIZE (256)

static void
nkf_state_init(void)
{
    if (nkf_state) {
	nkf_buf_clear(nkf_state->std_gc_buf);
	nkf_buf_clear(nkf_state->broken_buf);
	nkf_buf_clear(nkf_state->nfc_buf);
    }
    else {
	nkf_state = nkf_xmalloc(sizeof(nkf_state_t));
	nkf_state->std_gc_buf = nkf_buf_new(STD_GC_BUFSIZE);
	nkf_state->broken_buf = nkf_buf_new(3);
	nkf_state->nfc_buf = nkf_buf_new(9);
    }
    nkf_state->broken_state = 0;
    nkf_state->mimeout_state = 0;
}

#ifndef WIN32DLL
static nkf_char
std_getc(FILE *f)
{
    if (!nkf_buf_empty_p(nkf_state->std_gc_buf)){
	return nkf_buf_pop(nkf_state->std_gc_buf);
    }
    return getc(f);
}
#endif /*WIN32DLL*/

static nkf_char
std_ungetc(nkf_char c, ARG_UNUSED FILE *f)
{
    nkf_buf_push(nkf_state->std_gc_buf, c);
    return c;
}

#ifndef WIN32DLL
static void
std_putc(nkf_char c)
{
    if(c!=EOF)
	putchar(c);
}
#endif /*WIN32DLL*/

static nkf_char   hold_buf[HOLD_SIZE*2];
static int             hold_count = 0;
static nkf_char
push_hold_buf(nkf_char c2)
{
    if (hold_count >= HOLD_SIZE*2)
	return (EOF);
    hold_buf[hold_count++] = c2;
    return ((hold_count >= HOLD_SIZE*2) ? EOF : hold_count);
}

static int
h_conv(FILE *f, nkf_char c1, nkf_char c2)
{
    int ret;
    int hold_index;
    int fromhold_count;
    nkf_char c3, c4;

    /** it must NOT be in the kanji shifte sequence      */
    /** it must NOT be written in JIS7                   */
    /** and it must be after 2 byte 8bit code            */

    hold_count = 0;
    push_hold_buf(c1);
    push_hold_buf(c2);

    while ((c2 = (*i_getc)(f)) != EOF) {
	if (c2 == ESC){
	    (*i_ungetc)(c2,f);
	    break;
	}
	code_status(c2);
	if (push_hold_buf(c2) == EOF || estab_f) {
	    break;
	}
    }

    if (!estab_f) {
	struct input_code *p = input_code_list;
	struct input_code *result = p;
	if (c2 == EOF) {
	    code_status(c2);
	}
	while (p->name) {
	    if (p->status_func && p->score < result->score) {
		result = p;
	    }
	    p++;
	}
	set_iconv(TRUE, result->iconv_func);
    }


    /** now,
     ** 1) EOF is detected, or
     ** 2) Code is established, or
     ** 3) Buffer is FULL (but last word is pushed)
     **
     ** in 1) and 3) cases, we continue to use
     ** Kanji codes by oconv and leave estab_f unchanged.
     **/

    ret = c2;
    hold_index = 0;
    while (hold_index < hold_count){
	c1 = hold_buf[hold_index++];
	if (nkf_char_unicode_p(c1)) {
	    (*oconv)(0, c1);
	    continue;
	}
	else if (c1 <= DEL){
	    (*iconv)(0, c1, 0);
	    continue;
	}else if (iconv == s_iconv && 0xa1 <= c1 && c1 <= 0xdf){
	    (*iconv)(JIS_X_0201_1976_K, c1, 0);
	    continue;
	}
	fromhold_count = 1;
	if (hold_index < hold_count){
	    c2 = hold_buf[hold_index++];
	    fromhold_count++;
	}else{
	    c2 = (*i_getc)(f);
	    if (c2 == EOF){
		c4 = EOF;
		break;
	    }
	    code_status(c2);
	}
	c3 = 0;
	switch ((*iconv)(c1, c2, 0)) {  /* can be EUC/SJIS/UTF-8 */
	case -2:
	    /* 4 bytes UTF-8 */
	    if (hold_index < hold_count){
		c3 = hold_buf[hold_index++];
	    } else if ((c3 = (*i_getc)(f)) == EOF) {
		ret = EOF;
		break;
	    }
	    code_status(c3);
	    if (hold_index < hold_count){
		c4 = hold_buf[hold_index++];
	    } else if ((c4 = (*i_getc)(f)) == EOF) {
		c3 = ret = EOF;
		break;
	    }
	    code_status(c4);
	    (*iconv)(c1, c2, (c3<<8)|c4);
	    break;
	case -3:
	    /* 4 bytes UTF-8 (check combining character) */
	    if (hold_index < hold_count){
		c3 = hold_buf[hold_index++];
		fromhold_count++;
	    } else if ((c3 = (*i_getc)(f)) == EOF) {
		w_iconv_nocombine(c1, c2, 0);
		break;
	    }
	    if (hold_index < hold_count){
		c4 = hold_buf[hold_index++];
		fromhold_count++;
	    } else if ((c4 = (*i_getc)(f)) == EOF) {
		w_iconv_nocombine(c1, c2, 0);
		if (fromhold_count <= 2)
		    (*i_ungetc)(c3,f);
		else
		    hold_index--;
		continue;
	    }
	    if (w_iconv_combine(c1, c2, 0, c3, c4, 0)) {
		w_iconv_nocombine(c1, c2, 0);
		if (fromhold_count <= 2) {
		    (*i_ungetc)(c4,f);
		    (*i_ungetc)(c3,f);
		} else if (fromhold_count == 3) {
		    (*i_ungetc)(c4,f);
		    hold_index--;
		} else {
		    hold_index -= 2;
		}
	    }
	    break;
	case -1:
	    /* 3 bytes EUC or UTF-8 */
	    if (hold_index < hold_count){
		c3 = hold_buf[hold_index++];
		fromhold_count++;
	    } else if ((c3 = (*i_getc)(f)) == EOF) {
		ret = EOF;
		break;
	    } else {
		code_status(c3);
	    }
	    if ((*iconv)(c1, c2, c3) == -3) {
		/* 6 bytes UTF-8 (check combining character) */
		nkf_char c5, c6;
		if (hold_index < hold_count){
		    c4 = hold_buf[hold_index++];
		    fromhold_count++;
		} else if ((c4 = (*i_getc)(f)) == EOF) {
		    w_iconv_nocombine(c1, c2, c3);
		    continue;
		}
		if (hold_index < hold_count){
		    c5 = hold_buf[hold_index++];
		    fromhold_count++;
		} else if ((c5 = (*i_getc)(f)) == EOF) {
		    w_iconv_nocombine(c1, c2, c3);
		    if (fromhold_count == 4)
			hold_index--;
		    else
			(*i_ungetc)(c4,f);
		    continue;
		}
		if (hold_index < hold_count){
		    c6 = hold_buf[hold_index++];
		    fromhold_count++;
		} else if ((c6 = (*i_getc)(f)) == EOF) {
		    w_iconv_nocombine(c1, c2, c3);
		    if (fromhold_count == 5) {
			hold_index -= 2;
		    } else if (fromhold_count == 4) {
			hold_index--;
			(*i_ungetc)(c5,f);
		    } else {
			(*i_ungetc)(c5,f);
			(*i_ungetc)(c4,f);
		    }
		    continue;
		}
		if (w_iconv_combine(c1, c2, c3, c4, c5, c6)) {
		    w_iconv_nocombine(c1, c2, c3);
		    if (fromhold_count == 6) {
			hold_index -= 3;
		    } else if (fromhold_count == 5) {
			hold_index -= 2;
			(*i_ungetc)(c6,f);
		    } else if (fromhold_count == 4) {
			hold_index--;
			(*i_ungetc)(c6,f);
			(*i_ungetc)(c5,f);
		    } else {
			(*i_ungetc)(c6,f);
			(*i_ungetc)(c5,f);
			(*i_ungetc)(c4,f);
		    }
		}
	    }
	    break;
	}
	if (c3 == EOF) break;
    }
    return ret;
}

/*
 * Check and Ignore BOM
 */
static void
check_bom(FILE *f)
{
    int c2;
    input_bom_f = FALSE;
    switch(c2 = (*i_getc)(f)){
    case 0x00:
	if((c2 = (*i_getc)(f)) == 0x00){
	    if((c2 = (*i_getc)(f)) == 0xFE){
		if((c2 = (*i_getc)(f)) == 0xFF){
		    if(!input_encoding){
			set_iconv(TRUE, w_iconv32);
		    }
		    if (iconv == w_iconv32) {
			input_bom_f = TRUE;
			input_endian = ENDIAN_BIG;
			return;
		    }
		    (*i_ungetc)(0xFF,f);
		}else (*i_ungetc)(c2,f);
		(*i_ungetc)(0xFE,f);
	    }else if(c2 == 0xFF){
		if((c2 = (*i_getc)(f)) == 0xFE){
		    if(!input_encoding){
			set_iconv(TRUE, w_iconv32);
		    }
		    if (iconv == w_iconv32) {
			input_endian = ENDIAN_2143;
			return;
		    }
		    (*i_ungetc)(0xFF,f);
		}else (*i_ungetc)(c2,f);
		(*i_ungetc)(0xFF,f);
	    }else (*i_ungetc)(c2,f);
	    (*i_ungetc)(0x00,f);
	}else (*i_ungetc)(c2,f);
	(*i_ungetc)(0x00,f);
	break;
    case 0xEF:
	if((c2 = (*i_getc)(f)) == 0xBB){
	    if((c2 = (*i_getc)(f)) == 0xBF){
		if(!input_encoding){
		    set_iconv(TRUE, w_iconv);
		}
		if (iconv == w_iconv) {
		    input_bom_f = TRUE;
		    return;
		}
		(*i_ungetc)(0xBF,f);
	    }else (*i_ungetc)(c2,f);
	    (*i_ungetc)(0xBB,f);
	}else (*i_ungetc)(c2,f);
	(*i_ungetc)(0xEF,f);
	break;
    case 0xFE:
	if((c2 = (*i_getc)(f)) == 0xFF){
	    if((c2 = (*i_getc)(f)) == 0x00){
		if((c2 = (*i_getc)(f)) == 0x00){
		    if(!input_encoding){
			set_iconv(TRUE, w_iconv32);
		    }
		    if (iconv == w_iconv32) {
			input_endian = ENDIAN_3412;
			return;
		    }
		    (*i_ungetc)(0x00,f);
		}else (*i_ungetc)(c2,f);
		(*i_ungetc)(0x00,f);
	    }else (*i_ungetc)(c2,f);
	    if(!input_encoding){
		set_iconv(TRUE, w_iconv16);
	    }
	    if (iconv == w_iconv16) {
		input_endian = ENDIAN_BIG;
		input_bom_f = TRUE;
		return;
	    }
	    (*i_ungetc)(0xFF,f);
	}else (*i_ungetc)(c2,f);
	(*i_ungetc)(0xFE,f);
	break;
    case 0xFF:
	if((c2 = (*i_getc)(f)) == 0xFE){
	    if((c2 = (*i_getc)(f)) == 0x00){
		if((c2 = (*i_getc)(f)) == 0x00){
		    if(!input_encoding){
			set_iconv(TRUE, w_iconv32);
		    }
		    if (iconv == w_iconv32) {
			input_endian = ENDIAN_LITTLE;
			input_bom_f = TRUE;
			return;
		    }
		    (*i_ungetc)(0x00,f);
		}else (*i_ungetc)(c2,f);
		(*i_ungetc)(0x00,f);
	    }else (*i_ungetc)(c2,f);
	    if(!input_encoding){
		set_iconv(TRUE, w_iconv16);
	    }
	    if (iconv == w_iconv16) {
		input_endian = ENDIAN_LITTLE;
		input_bom_f = TRUE;
		return;
	    }
	    (*i_ungetc)(0xFE,f);
	}else (*i_ungetc)(c2,f);
	(*i_ungetc)(0xFF,f);
	break;
    default:
	(*i_ungetc)(c2,f);
	break;
    }
}

static nkf_char
broken_getc(FILE *f)
{
    nkf_char c, c1;

    if (!nkf_buf_empty_p(nkf_state->broken_buf)) {
	return nkf_buf_pop(nkf_state->broken_buf);
    }
    c = (*i_bgetc)(f);
    if (c=='$' && nkf_state->broken_state != ESC
	&& (input_mode == ASCII || input_mode == JIS_X_0201_1976_K)) {
	c1= (*i_bgetc)(f);
	nkf_state->broken_state = 0;
	if (c1=='@'|| c1=='B') {
	    nkf_buf_push(nkf_state->broken_buf, c1);
	    nkf_buf_push(nkf_state->broken_buf, c);
	    return ESC;
	} else {
	    (*i_bungetc)(c1,f);
	    return c;
	}
    } else if (c=='(' && nkf_state->broken_state != ESC
	       && (input_mode == JIS_X_0208 || input_mode == JIS_X_0201_1976_K)) {
	c1= (*i_bgetc)(f);
	nkf_state->broken_state = 0;
	if (c1=='J'|| c1=='B') {
	    nkf_buf_push(nkf_state->broken_buf, c1);
	    nkf_buf_push(nkf_state->broken_buf, c);
	    return ESC;
	} else {
	    (*i_bungetc)(c1,f);
	    return c;
	}
    } else {
	nkf_state->broken_state = c;
	return c;
    }
}

static nkf_char
broken_ungetc(nkf_char c, ARG_UNUSED FILE *f)
{
    if (nkf_buf_length(nkf_state->broken_buf) < 2)
	nkf_buf_push(nkf_state->broken_buf, c);
    return c;
}

static void
eol_conv(nkf_char c2, nkf_char c1)
{
    if (guess_f && input_eol != EOF) {
	if (c2 == 0 && c1 == LF) {
	    if (!input_eol) input_eol = prev_cr ? CRLF : LF;
	    else if (input_eol != (prev_cr ? CRLF : LF)) input_eol = EOF;
	} else if (c2 == 0 && c1 == CR && input_eol == LF) input_eol = EOF;
	else if (!prev_cr);
	else if (!input_eol) input_eol = CR;
	else if (input_eol != CR) input_eol = EOF;
    }
    if (prev_cr || (c2 == 0 && c1 == LF)) {
	prev_cr = 0;
	if (eolmode_f != LF) (*o_eol_conv)(0, CR);
	if (eolmode_f != CR) (*o_eol_conv)(0, LF);
    }
    if (c2 == 0 && c1 == CR) prev_cr = CR;
    else if (c2 != 0 || c1 != LF) (*o_eol_conv)(c2, c1);
}

static void
put_newline(void (*func)(nkf_char))
{
    switch (eolmode_f ? eolmode_f : DEFAULT_NEWLINE) {
      case CRLF:
	(*func)(0x0D);
	(*func)(0x0A);
	break;
      case CR:
	(*func)(0x0D);
	break;
      case LF:
	(*func)(0x0A);
	break;
    }
}

static void
oconv_newline(void (*func)(nkf_char, nkf_char))
{
    switch (eolmode_f ? eolmode_f : DEFAULT_NEWLINE) {
      case CRLF:
	(*func)(0, 0x0D);
	(*func)(0, 0x0A);
	break;
      case CR:
	(*func)(0, 0x0D);
	break;
      case LF:
	(*func)(0, 0x0A);
	break;
    }
}

/*
   Return value of fold_conv()

   LF  add newline  and output char
   CR  add newline  and output nothing
   SP  space
   0   skip
   1   (or else) normal output

   fold state in prev (previous character)

   >0x80 Japanese (X0208/X0201)
   <0x80 ASCII
   LF    new line
   SP    space

   This fold algorithm does not preserve heading space in a line.
   This is the main difference from fmt.
 */

#define char_size(c2,c1) (c2?2:1)

static void
fold_conv(nkf_char c2, nkf_char c1)
{
    nkf_char prev0;
    nkf_char fold_state;

    if (c1== CR && !fold_preserve_f) {
	fold_state=0;  /* ignore cr */
    }else if (c1== LF&&f_prev==CR && fold_preserve_f) {
	f_prev = LF;
	fold_state=0;  /* ignore cr */
    } else if (c1== BS) {
	if (f_line>0) f_line--;
	fold_state =  1;
    } else if (c2==EOF && f_line != 0) {    /* close open last line */
	fold_state = LF;
    } else if ((c1==LF && !fold_preserve_f)
	       || ((c1==CR||(c1==LF&&f_prev!=CR))
		   && fold_preserve_f)) {
	/* new line */
	if (fold_preserve_f) {
	    f_prev = c1;
	    f_line = 0;
	    fold_state =  CR;
	} else if ((f_prev == c1)
		   || (f_prev == LF)
		  ) {        /* duplicate newline */
	    if (f_line) {
		f_line = 0;
		fold_state =  LF;    /* output two newline */
	    } else {
		f_line = 0;
		fold_state =  1;
	    }
	} else  {
	    if (f_prev&0x80) {     /* Japanese? */
		f_prev = c1;
		fold_state =  0;       /* ignore given single newline */
	    } else if (f_prev==SP) {
		fold_state =  0;
	    } else {
		f_prev = c1;
		if (++f_line<=fold_len)
		    fold_state =  SP;
		else {
		    f_line = 0;
		    fold_state =  CR;        /* fold and output nothing */
		}
	    }
	}
    } else if (c1=='\f') {
	f_prev = LF;
	f_line = 0;
	fold_state =  LF;            /* output newline and clear */
    } else if ((c2==0 && nkf_isblank(c1)) || (c2 == '!' && c1 == '!')) {
	/* X0208 kankaku or ascii space */
	if (f_prev == SP) {
	    fold_state = 0;         /* remove duplicate spaces */
	} else {
	    f_prev = SP;
	    if (++f_line<=fold_len)
		fold_state = SP;         /* output ASCII space only */
	    else {
		f_prev = SP; f_line = 0;
		fold_state = CR;        /* fold and output nothing */
	    }
	}
    } else {
	prev0 = f_prev; /* we still need this one... , but almost done */
	f_prev = c1;
	if (c2 || c2 == JIS_X_0201_1976_K)
	    f_prev |= 0x80;  /* this is Japanese */
	f_line += c2 == JIS_X_0201_1976_K ? 1: char_size(c2,c1);
	if (f_line<=fold_len) {   /* normal case */
	    fold_state = 1;
	} else {
	    if (f_line>fold_len+fold_margin) { /* too many kinsoku suspension */
		f_line = char_size(c2,c1);
		fold_state =  LF;       /* We can't wait, do fold now */
	    } else if (c2 == JIS_X_0201_1976_K) {
		/* simple kinsoku rules  return 1 means no folding  */
		if (c1==(0xde&0x7f)) fold_state = 1; /* ゛*/
		else if (c1==(0xdf&0x7f)) fold_state = 1; /* ゜*/
		else if (c1==(0xa4&0x7f)) fold_state = 1; /* 。*/
		else if (c1==(0xa3&0x7f)) fold_state = 1; /* ，*/
		else if (c1==(0xa1&0x7f)) fold_state = 1; /* 」*/
		else if (c1==(0xb0&0x7f)) fold_state = 1; /* - */
		else if (SP<=c1 && c1<=(0xdf&0x7f)) {      /* X0201 */
		    f_line = 1;
		    fold_state = LF;/* add one new f_line before this character */
		} else {
		    f_line = 1;
		    fold_state = LF;/* add one new f_line before this character */
		}
	    } else if (c2==0) {
		/* kinsoku point in ASCII */
		if (  c1==')'||    /* { [ ( */
		    c1==']'||
		    c1=='}'||
		    c1=='.'||
		    c1==','||
		    c1=='!'||
		    c1=='?'||
		    c1=='/'||
		    c1==':'||
		    c1==';') {
		    fold_state = 1;
		    /* just after special */
		} else if (!is_alnum(prev0)) {
		    f_line = char_size(c2,c1);
		    fold_state = LF;
		} else if ((prev0==SP) ||   /* ignored new f_line */
			   (prev0==LF)||        /* ignored new f_line */
			   (prev0&0x80)) {        /* X0208 - ASCII */
		    f_line = char_size(c2,c1);
		    fold_state = LF;/* add one new f_line before this character */
		} else {
		    fold_state = 1;  /* default no fold in ASCII */
		}
	    } else {
		if (c2=='!') {
		    if (c1=='"')  fold_state = 1; /* 、 */
		    else if (c1=='#')  fold_state = 1; /* 。 */
		    else if (c1=='W')  fold_state = 1; /* 」 */
		    else if (c1=='K')  fold_state = 1; /* ） */
		    else if (c1=='$')  fold_state = 1; /* ， */
		    else if (c1=='%')  fold_state = 1; /* ． */
		    else if (c1=='\'') fold_state = 1; /* ＋ */
		    else if (c1=='(')  fold_state = 1; /* ； */
		    else if (c1==')')  fold_state = 1; /* ？ */
		    else if (c1=='*')  fold_state = 1; /* ！ */
		    else if (c1=='+')  fold_state = 1; /* ゛ */
		    else if (c1==',')  fold_state = 1; /* ゜ */
		    /* default no fold in kinsoku */
		    else {
			fold_state = LF;
			f_line = char_size(c2,c1);
			/* add one new f_line before this character */
		    }
		} else {
		    f_line = char_size(c2,c1);
		    fold_state = LF;
		    /* add one new f_line before this character */
		}
	    }
	}
    }
    /* terminator process */
    switch(fold_state) {
    case LF:
	oconv_newline(o_fconv);
	(*o_fconv)(c2,c1);
	break;
    case 0:
	return;
    case CR:
	oconv_newline(o_fconv);
	break;
    case TAB:
    case SP:
	(*o_fconv)(0,SP);
	break;
    default:
	(*o_fconv)(c2,c1);
    }
}

static nkf_char z_prev2=0,z_prev1=0;

static void
z_conv(nkf_char c2, nkf_char c1)
{

    /* if (c2) c1 &= 0x7f; assertion */

    if (c2 == JIS_X_0201_1976_K && (c1 == 0x20 || c1 == 0x7D || c1 == 0x7E)) {
	(*o_zconv)(c2,c1);
	return;
    }

    if (x0201_f) {
	if (z_prev2 == JIS_X_0201_1976_K) {
	    if (c2 == JIS_X_0201_1976_K) {
		if (c1 == (0xde&0x7f)) { /* 濁点 */
		    z_prev2 = 0;
		    (*o_zconv)(dv[(z_prev1-SP)*2], dv[(z_prev1-SP)*2+1]);
		    return;
		} else if (c1 == (0xdf&0x7f) && ev[(z_prev1-SP)*2]) {  /* 半濁点 */
		    z_prev2 = 0;
		    (*o_zconv)(ev[(z_prev1-SP)*2], ev[(z_prev1-SP)*2+1]);
		    return;
		} else if (x0213_f && c1 == (0xdf&0x7f) && ev_x0213[(z_prev1-SP)*2]) {  /* 半濁点 */
		    z_prev2 = 0;
		    (*o_zconv)(ev_x0213[(z_prev1-SP)*2], ev_x0213[(z_prev1-SP)*2+1]);
		    return;
		}
	    }
	    z_prev2 = 0;
	    (*o_zconv)(cv[(z_prev1-SP)*2], cv[(z_prev1-SP)*2+1]);
	}
	if (c2 == JIS_X_0201_1976_K) {
	    if (dv[(c1-SP)*2] || ev[(c1-SP)*2] || (x0213_f && ev_x0213[(c1-SP)*2])) {
		/* wait for 濁点 or 半濁点 */
		z_prev1 = c1;
		z_prev2 = c2;
		return;
	    } else {
		(*o_zconv)(cv[(c1-SP)*2], cv[(c1-SP)*2+1]);
		return;
	    }
	}
    }

    if (c2 == EOF) {
	(*o_zconv)(c2, c1);
	return;
    }

    if (alpha_f&1 && c2 == 0x23) {
	/* JISX0208 Alphabet */
	c2 = 0;
    } else if (c2 == 0x21) {
	/* JISX0208 Kigou */
	if (0x21==c1) {
	    if (alpha_f&2) {
		c2 = 0;
		c1 = SP;
	    } else if (alpha_f&4) {
		(*o_zconv)(0, SP);
		(*o_zconv)(0, SP);
		return;
	    }
	} else if (alpha_f&1 && 0x20<c1 && c1<0x7f && fv[c1-0x20]) {
	    c2 =  0;
	    c1 = fv[c1-0x20];
	}
    }

    if (alpha_f&8 && c2 == 0) {
	/* HTML Entity */
	const char *entity = 0;
	switch (c1){
	case '>': entity = "&gt;"; break;
	case '<': entity = "&lt;"; break;
	case '\"': entity = "&quot;"; break;
	case '&': entity = "&amp;"; break;
	}
	if (entity){
	    while (*entity) (*o_zconv)(0, *entity++);
	    return;
	}
    }

    if (alpha_f & 16) {
	/* JIS X 0208 Katakana to JIS X 0201 Katakana */
	if (c2 == 0x21) {
	    nkf_char c = 0;
	    switch (c1) {
	    case 0x23:
		/* U+3002 (0x8142) Ideographic Full Stop -> U+FF61 (0xA1) Halfwidth Ideographic Full Stop */
		c = 0xA1;
		break;
	    case 0x56:
		/* U+300C (0x8175) Left Corner Bracket -> U+FF62 (0xA2) Halfwidth Left Corner Bracket */
		c = 0xA2;
		break;
	    case 0x57:
		/* U+300D (0x8176) Right Corner Bracket -> U+FF63 (0xA3) Halfwidth Right Corner Bracket */
		c = 0xA3;
		break;
	    case 0x22:
		/* U+3001 (0x8141) Ideographic Comma -> U+FF64 (0xA4) Halfwidth Ideographic Comma */
		c = 0xA4;
		break;
	    case 0x26:
		/* U+30FB (0x8145) Katakana Middle Dot -> U+FF65 (0xA5) Halfwidth Katakana Middle Dot */
		c = 0xA5;
		break;
	    case 0x3C:
		/* U+30FC (0x815B) Katakana-Hiragana Prolonged Sound Mark -> U+FF70 (0xB0) Halfwidth Katakana-Hiragana Prolonged Sound Mark */
		c = 0xB0;
		break;
	    case 0x2B:
		/* U+309B (0x814A) Katakana-Hiragana Voiced Sound Mark -> U+FF9E (0xDE) Halfwidth Katakana Voiced Sound Mark */
		c = 0xDE;
		break;
	    case 0x2C:
		/* U+309C (0x814B) Katakana-Hiragana Semi-Voiced Sound Mark -> U+FF9F (0xDF) Halfwidth Katakana Semi-Voiced Sound Mark */
		c = 0xDF;
		break;
	    }
	    if (c) {
		(*o_zconv)(JIS_X_0201_1976_K, c);
		return;
	    }
	} else if (c2 == 0x25) {
	    /* JISX0208 Katakana */
	    static const int fullwidth_to_halfwidth[] =
	    {
		0x0000, 0x2700, 0x3100, 0x2800, 0x3200, 0x2900, 0x3300, 0x2A00,
		0x3400, 0x2B00, 0x3500, 0x3600, 0x365E, 0x3700, 0x375E, 0x3800,
		0x385E, 0x3900, 0x395E, 0x3A00, 0x3A5E, 0x3B00, 0x3B5E, 0x3C00,
		0x3C5E, 0x3D00, 0x3D5E, 0x3E00, 0x3E5E, 0x3F00, 0x3F5E, 0x4000,
		0x405E, 0x4100, 0x415E, 0x2F00, 0x4200, 0x425E, 0x4300, 0x435E,
		0x4400, 0x445E, 0x4500, 0x4600, 0x4700, 0x4800, 0x4900, 0x4A00,
		0x4A5E, 0x4A5F, 0x4B00, 0x4B5E, 0x4B5F, 0x4C00, 0x4C5E, 0x4C5F,
		0x4D00, 0x4D5E, 0x4D5F, 0x4E00, 0x4E5E, 0x4E5F, 0x4F00, 0x5000,
		0x5100, 0x5200, 0x5300, 0x2C00, 0x5400, 0x2D00, 0x5500, 0x2E00,
		0x5600, 0x5700, 0x5800, 0x5900, 0x5A00, 0x5B00, 0x0000, 0x5C00,
		0x0000, 0x0000, 0x2600, 0x5D00, 0x335E, 0x0000, 0x0000, 0x365F,
		0x375F, 0x385F, 0x395F, 0x3A5F, 0x3E5F, 0x425F, 0x445F, 0x0000
	    };
	    if (fullwidth_to_halfwidth[c1-0x20]){
		c2 = fullwidth_to_halfwidth[c1-0x20];
		(*o_zconv)(JIS_X_0201_1976_K, c2>>8);
		if (c2 & 0xFF) {
		    (*o_zconv)(JIS_X_0201_1976_K, c2&0xFF);
		}
		return;
	    }
	} else if (c2 == 0 && nkf_char_unicode_p(c1) &&
	    ((c1&VALUE_MASK) == 0x3099 || (c1&VALUE_MASK) == 0x309A)) { /* 合成用濁点・半濁点 */
	    (*o_zconv)(JIS_X_0201_1976_K, 0x5E + (c1&VALUE_MASK) - 0x3099);
	    return;
	}
    }
    (*o_zconv)(c2,c1);
}


#define rot13(c)  ( \
		   ( c < 'A') ? c: \
		   (c <= 'M')  ? (c + 13): \
		   (c <= 'Z')  ? (c - 13): \
		   (c < 'a')   ? (c): \
		   (c <= 'm')  ? (c + 13): \
		   (c <= 'z')  ? (c - 13): \
		   (c) \
		  )

#define  rot47(c) ( \
		   ( c < '!') ? c: \
		   ( c <= 'O') ? (c + 47) : \
		   ( c <= '~') ?  (c - 47) : \
		   c \
		  )

static void
rot_conv(nkf_char c2, nkf_char c1)
{
    if (c2 == 0 || c2 == JIS_X_0201_1976_K || c2 == ISO_8859_1) {
	c1 = rot13(c1);
    } else if (c2) {
	c1 = rot47(c1);
	c2 = rot47(c2);
    }
    (*o_rot_conv)(c2,c1);
}

static void
hira_conv(nkf_char c2, nkf_char c1)
{
    if (hira_f & 1) {
	if (c2 == 0x25) {
	    if (0x20 < c1 && c1 < 0x74) {
		c2 = 0x24;
		(*o_hira_conv)(c2,c1);
		return;
	    } else if (c1 == 0x74 && nkf_enc_unicode_p(output_encoding)) {
		c2 = 0;
		c1 = nkf_char_unicode_new(0x3094);
		(*o_hira_conv)(c2,c1);
		return;
	    }
	} else if (c2 == 0x21 && (c1 == 0x33 || c1 == 0x34)) {
	    c1 += 2;
	    (*o_hira_conv)(c2,c1);
	    return;
	}
    }
    if (hira_f & 2) {
	if (c2 == 0 && c1 == nkf_char_unicode_new(0x3094)) {
	    c2 = 0x25;
	    c1 = 0x74;
	} else if (c2 == 0x24 && 0x20 < c1 && c1 < 0x74) {
	    c2 = 0x25;
	} else if (c2 == 0x21 && (c1 == 0x35 || c1 == 0x36)) {
	    c1 -= 2;
	}
    }
    (*o_hira_conv)(c2,c1);
}


static void
iso2022jp_check_conv(nkf_char c2, nkf_char c1)
{
#define RANGE_NUM_MAX 18
    static const nkf_char range[RANGE_NUM_MAX][2] = {
	{0x222f, 0x2239,},
	{0x2242, 0x2249,},
	{0x2251, 0x225b,},
	{0x226b, 0x2271,},
	{0x227a, 0x227d,},
	{0x2321, 0x232f,},
	{0x233a, 0x2340,},
	{0x235b, 0x2360,},
	{0x237b, 0x237e,},
	{0x2474, 0x247e,},
	{0x2577, 0x257e,},
	{0x2639, 0x2640,},
	{0x2659, 0x267e,},
	{0x2742, 0x2750,},
	{0x2772, 0x277e,},
	{0x2841, 0x287e,},
	{0x4f54, 0x4f7e,},
	{0x7425, 0x747e},
    };
    nkf_char i;
    nkf_char start, end, c;

    if(c2 >= 0x00 && c2 <= 0x20 && c1 >= 0x7f && c1 <= 0xff) {
	c2 = GETA1;
	c1 = GETA2;
    }
    if((c2 >= 0x29 && c2 <= 0x2f) || (c2 >= 0x75 && c2 <= 0x7e)) {
	c2 = GETA1;
	c1 = GETA2;
    }

    for (i = 0; i < RANGE_NUM_MAX; i++) {
	start = range[i][0];
	end   = range[i][1];
	c     = (c2 << 8) + c1;
	if (c >= start && c <= end) {
	    c2 = GETA1;
	    c1 = GETA2;
	}
    }
    (*o_iso2022jp_check_conv)(c2,c1);
}


/* This converts  =?ISO-2022-JP?B?HOGE HOGE?= */

static const unsigned char *mime_pattern[] = {
    (const unsigned char *)"\075?EUC-JP?B?",
    (const unsigned char *)"\075?SHIFT_JIS?B?",
    (const unsigned char *)"\075?ISO-8859-1?Q?",
    (const unsigned char *)"\075?ISO-8859-1?B?",
    (const unsigned char *)"\075?ISO-2022-JP?B?",
    (const unsigned char *)"\075?ISO-2022-JP?B?",
    (const unsigned char *)"\075?ISO-2022-JP?Q?",
#if defined(UTF8_INPUT_ENABLE)
    (const unsigned char *)"\075?UTF-8?B?",
    (const unsigned char *)"\075?UTF-8?Q?",
#endif
    (const unsigned char *)"\075?US-ASCII?Q?",
    NULL
};


/* 該当するコードの優先度を上げるための目印 */
static nkf_char (*const mime_priority_func[])(nkf_char c2, nkf_char c1, nkf_char c0) = {
    e_iconv, s_iconv, 0, 0, 0, 0, 0,
#if defined(UTF8_INPUT_ENABLE)
    w_iconv, w_iconv,
#endif
    0,
};

static const nkf_char mime_encode[] = {
    EUC_JP, SHIFT_JIS, ISO_8859_1, ISO_8859_1, JIS_X_0208, JIS_X_0201_1976_K, JIS_X_0201_1976_K,
#if defined(UTF8_INPUT_ENABLE)
    UTF_8, UTF_8,
#endif
    ASCII,
    0
};

static const nkf_char mime_encode_method[] = {
    'B', 'B','Q', 'B', 'B', 'B', 'Q',
#if defined(UTF8_INPUT_ENABLE)
    'B', 'Q',
#endif
    'Q',
    0
};


/* MIME preprocessor fifo */

#define MIME_BUF_SIZE   (1024)    /* 2^n ring buffer */
#define MIME_BUF_MASK   (MIME_BUF_SIZE-1)
#define mime_input_buf(n)        mime_input_state.buf[(n)&MIME_BUF_MASK]
static struct {
    unsigned char buf[MIME_BUF_SIZE];
    unsigned int  top;
    unsigned int  last;  /* decoded */
    unsigned int  input; /* undecoded */
} mime_input_state;
static nkf_char (*mime_iconv_back)(nkf_char c2,nkf_char c1,nkf_char c0) = NULL;

#define MAXRECOVER 20

static void
mime_input_buf_unshift(nkf_char c)
{
    mime_input_buf(--mime_input_state.top) = (unsigned char)c;
}

static nkf_char
mime_ungetc(nkf_char c, ARG_UNUSED FILE *f)
{
    mime_input_buf_unshift(c);
    return c;
}

static nkf_char
mime_ungetc_buf(nkf_char c, FILE *f)
{
    if (mimebuf_f)
	(*i_mungetc_buf)(c,f);
    else
	mime_input_buf(--mime_input_state.input) = (unsigned char)c;
    return c;
}

static nkf_char
mime_getc_buf(FILE *f)
{
    /* we don't keep eof of mime_input_buf, because it contains ?= as
       a terminator. It was checked in mime_integrity. */
    return ((mimebuf_f)?
	    (*i_mgetc_buf)(f):mime_input_buf(mime_input_state.input++));
}

static void
switch_mime_getc(void)
{
    if (i_getc!=mime_getc) {
	i_mgetc = i_getc; i_getc = mime_getc;
	i_mungetc = i_ungetc; i_ungetc = mime_ungetc;
	if(mime_f==STRICT_MIME) {
	    i_mgetc_buf = i_mgetc; i_mgetc = mime_getc_buf;
	    i_mungetc_buf = i_mungetc; i_mungetc = mime_ungetc_buf;
	}
    }
}

static void
unswitch_mime_getc(void)
{
    if(mime_f==STRICT_MIME) {
	i_mgetc = i_mgetc_buf;
	i_mungetc = i_mungetc_buf;
    }
    i_getc = i_mgetc;
    i_ungetc = i_mungetc;
    if(mime_iconv_back)set_iconv(FALSE, mime_iconv_back);
    mime_iconv_back = NULL;
}

static nkf_char
mime_integrity(FILE *f, const unsigned char *p)
{
    nkf_char c,d;
    unsigned int q;
    /* In buffered mode, read until =? or NL or buffer full
     */
    mime_input_state.input = mime_input_state.top;
    mime_input_state.last = mime_input_state.top;

    while(*p) mime_input_buf(mime_input_state.input++) = *p++;
    d = 0;
    q = mime_input_state.input;
    while((c=(*i_getc)(f))!=EOF) {
	if (((mime_input_state.input-mime_input_state.top)&MIME_BUF_MASK)==0) {
	    break;   /* buffer full */
	}
	if (c=='=' && d=='?') {
	    /* checked. skip header, start decode */
	    mime_input_buf(mime_input_state.input++) = (unsigned char)c;
	    /* mime_last_input = mime_input_state.input; */
	    mime_input_state.input = q;
	    switch_mime_getc();
	    return 1;
	}
	if (!( (c=='+'||c=='/'|| c=='=' || c=='?' || is_alnum(c))))
	    break;
	/* Should we check length mod 4? */
	mime_input_buf(mime_input_state.input++) = (unsigned char)c;
	d=c;
    }
    /* In case of Incomplete MIME, no MIME decode  */
    mime_input_buf(mime_input_state.input++) = (unsigned char)c;
    mime_input_state.last = mime_input_state.input;     /* point undecoded buffer */
    mime_decode_mode = 1;              /* no decode on mime_input_buf last in mime_getc */
    switch_mime_getc();         /* anyway we need buffered getc */
    return 1;
}

static nkf_char
mime_begin_strict(FILE *f)
{
    nkf_char c1 = 0;
    int i,j,k;
    const unsigned char *p,*q;
    nkf_char r[MAXRECOVER];    /* recovery buffer, max mime pattern length */

    mime_decode_mode = FALSE;
    /* =? has been checked */
    j = 0;
    p = mime_pattern[j];
    r[0]='='; r[1]='?';

    for(i=2;p[i]>SP;i++) {                   /* start at =? */
	if (((r[i] = c1 = (*i_getc)(f))==EOF) || nkf_toupper(c1) != p[i]) {
	    /* pattern fails, try next one */
	    q = p;
	    while (mime_pattern[++j]) {
		p = mime_pattern[j];
		for(k=2;k<i;k++)              /* assume length(p) > i */
		    if (p[k]!=q[k]) break;
		if (k==i && nkf_toupper(c1)==p[k]) break;
	    }
	    p = mime_pattern[j];
	    if (p) continue;  /* found next one, continue */
	    /* all fails, output from recovery buffer */
	    (*i_ungetc)(c1,f);
	    for(j=0;j<i;j++) {
		(*oconv)(0,r[j]);
	    }
	    return c1;
	}
    }
    mime_decode_mode = p[i-2];

    mime_iconv_back = iconv;
    set_iconv(FALSE, mime_priority_func[j]);
    clr_code_score(find_inputcode_byfunc(mime_priority_func[j]), SCORE_iMIME);

    if (mime_decode_mode=='B') {
	mimebuf_f = unbuf_f;
	if (!unbuf_f) {
	    /* do MIME integrity check */
	    return mime_integrity(f,mime_pattern[j]);
	}
    }
    switch_mime_getc();
    mimebuf_f = TRUE;
    return c1;
}

static nkf_char
mime_begin(FILE *f)
{
    nkf_char c1 = 0;
    int i,k;

    /* In NONSTRICT mode, only =? is checked. In case of failure, we  */
    /* re-read and convert again from mime_buffer.  */

    /* =? has been checked */
    k = mime_input_state.last;
    mime_input_buf(mime_input_state.last++)='='; mime_input_buf(mime_input_state.last++)='?';
    for(i=2;i<MAXRECOVER;i++) {                   /* start at =? */
	/* We accept any character type even if it is breaked by new lines */
	c1 = (*i_getc)(f); mime_input_buf(mime_input_state.last++) = (unsigned char)c1;
	if (c1==LF||c1==SP||c1==CR||
	    c1=='-'||c1=='_'||is_alnum(c1)) continue;
	if (c1=='=') {
	    /* Failed. But this could be another MIME preemble */
	    (*i_ungetc)(c1,f);
	    mime_input_state.last--;
	    break;
	}
	if (c1!='?') break;
	else {
	    /* c1=='?' */
	    c1 = (*i_getc)(f); mime_input_buf(mime_input_state.last++) = (unsigned char)c1;
	    if (!(++i<MAXRECOVER) || c1==EOF) break;
	    if (c1=='b'||c1=='B') {
		mime_decode_mode = 'B';
	    } else if (c1=='q'||c1=='Q') {
		mime_decode_mode = 'Q';
	    } else {
		break;
	    }
	    c1 = (*i_getc)(f); mime_input_buf(mime_input_state.last++) = (unsigned char)c1;
	    if (!(++i<MAXRECOVER) || c1==EOF) break;
	    if (c1!='?') {
		mime_decode_mode = FALSE;
	    }
	    break;
	}
    }
    switch_mime_getc();
    if (!mime_decode_mode) {
	/* false MIME premble, restart from mime_buffer */
	mime_decode_mode = 1;  /* no decode, but read from the mime_buffer */
	/* Since we are in MIME mode until buffer becomes empty,    */
	/* we never go into mime_begin again for a while.           */
	return c1;
    }
    /* discard mime preemble, and goto MIME mode */
    mime_input_state.last = k;
    /* do no MIME integrity check */
    return c1;   /* used only for checking EOF */
}

#ifdef CHECK_OPTION
static void
no_putc(ARG_UNUSED nkf_char c)
{
    ;
}

static void
debug(const char *str)
{
    if (debug_f){
	fprintf(stderr, "%s\n", str ? str : "NULL");
    }
}
#endif

static void
set_input_codename(const char *codename)
{
    if (!input_codename) {
	input_codename = codename;
    } else if (strcmp(codename, input_codename) != 0) {
	input_codename = "";
    }
}

static const char*
get_guessed_code(void)
{
    if (input_codename && !*input_codename) {
	input_codename = "BINARY";
    } else {
	struct input_code *p = find_inputcode_byfunc(iconv);
	if (!input_codename) {
	    input_codename = "ASCII";
	} else if (strcmp(input_codename, "Shift_JIS") == 0) {
	    if (p->score & (SCORE_DEPEND|SCORE_CP932))
		input_codename = "CP932";
	} else if (strcmp(input_codename, "EUC-JP") == 0) {
	    if (p->score & SCORE_X0213)
		input_codename = "EUC-JIS-2004";
	    else if (p->score & (SCORE_X0212))
		input_codename = "EUCJP-MS";
	    else if (p->score & (SCORE_DEPEND|SCORE_CP932))
		input_codename = "CP51932";
	} else if (strcmp(input_codename, "ISO-2022-JP") == 0) {
	    if (p->score & (SCORE_KANA))
		input_codename = "CP50221";
	    else if (p->score & (SCORE_DEPEND|SCORE_CP932))
		input_codename = "CP50220";
	}
    }
    return input_codename;
}

#if !defined(PERL_XS) && !defined(WIN32DLL)
static void
print_guessed_code(char *filename)
{
    if (filename != NULL) printf("%s: ", filename);
    if (input_codename && !*input_codename) {
	printf("BINARY\n");
    } else {
	input_codename = get_guessed_code();
	if (guess_f == 1) {
	    printf("%s\n", input_codename);
	} else {
	    printf("%s%s%s%s\n",
		   input_codename,
		   iconv != w_iconv16 && iconv != w_iconv32 ? "" :
		   input_endian == ENDIAN_LITTLE ? " LE" :
		   input_endian == ENDIAN_BIG ? " BE" :
		   "[BUG]",
		   input_bom_f ? " (BOM)" : "",
		   input_eol == CR   ? " (CR)" :
		   input_eol == LF   ? " (LF)" :
		   input_eol == CRLF ? " (CRLF)" :
		   input_eol == EOF  ? " (MIXED NL)" :
		   "");
	}
    }
}
#endif /*WIN32DLL*/

#ifdef INPUT_OPTION

static nkf_char
hex_getc(nkf_char ch, FILE *f, nkf_char (*g)(FILE *f), nkf_char (*u)(nkf_char c, FILE *f))
{
    nkf_char c1, c2, c3;
    c1 = (*g)(f);
    if (c1 != ch){
	return c1;
    }
    c2 = (*g)(f);
    if (!nkf_isxdigit(c2)){
	(*u)(c2, f);
	return c1;
    }
    c3 = (*g)(f);
    if (!nkf_isxdigit(c3)){
	(*u)(c2, f);
	(*u)(c3, f);
	return c1;
    }
    return (hex2bin(c2) << 4) | hex2bin(c3);
}

static nkf_char
cap_getc(FILE *f)
{
    return hex_getc(':', f, i_cgetc, i_cungetc);
}

static nkf_char
cap_ungetc(nkf_char c, FILE *f)
{
    return (*i_cungetc)(c, f);
}

static nkf_char
url_getc(FILE *f)
{
    return hex_getc('%', f, i_ugetc, i_uungetc);
}

static nkf_char
url_ungetc(nkf_char c, FILE *f)
{
    return (*i_uungetc)(c, f);
}
#endif

#ifdef NUMCHAR_OPTION
static nkf_char
numchar_getc(FILE *f)
{
    nkf_char (*g)(FILE *) = i_ngetc;
    nkf_char (*u)(nkf_char c ,FILE *f) = i_nungetc;
    int i = 0, j;
    nkf_char buf[12];
    nkf_char c = -1;

    buf[i] = (*g)(f);
    if (buf[i] == '&'){
	buf[++i] = (*g)(f);
	if (buf[i] == '#'){
	    c = 0;
	    buf[++i] = (*g)(f);
	    if (buf[i] == 'x' || buf[i] == 'X'){
		for (j = 0; j < 7; j++){
		    buf[++i] = (*g)(f);
		    if (!nkf_isxdigit(buf[i])){
			if (buf[i] != ';'){
			    c = -1;
			}
			break;
		    }
		    c <<= 4;
		    c |= hex2bin(buf[i]);
		}
	    }else{
		for (j = 0; j < 8; j++){
		    if (j){
			buf[++i] = (*g)(f);
		    }
		    if (!nkf_isdigit(buf[i])){
			if (buf[i] != ';'){
			    c = -1;
			}
			break;
		    }
		    c *= 10;
		    c += hex2bin(buf[i]);
		}
	    }
	}
    }
    if (c != -1){
	return nkf_char_unicode_new(c);
    }
    while (i > 0){
	(*u)(buf[i], f);
	--i;
    }
    return buf[0];
}

static nkf_char
numchar_ungetc(nkf_char c, FILE *f)
{
    return (*i_nungetc)(c, f);
}
#endif

#ifdef UNICODE_NORMALIZATION

static nkf_char
nfc_getc(FILE *f)
{
    nkf_char (*g)(FILE *f) = i_nfc_getc;
    nkf_char (*u)(nkf_char c ,FILE *f) = i_nfc_ungetc;
    nkf_buf_t *buf = nkf_state->nfc_buf;
    const unsigned char *array;
    int lower=0, upper=NORMALIZATION_TABLE_LENGTH-1;
    nkf_char c = (*g)(f);

    if (c == EOF || c > 0xFF || (c & 0xc0) == 0x80) return c;

    nkf_buf_push(buf, c);
    do {
	while (lower <= upper) {
	    int mid = (lower+upper) / 2;
	    int len;
	    array = normalization_table[mid].nfd;
	    for (len=0; len < NORMALIZATION_TABLE_NFD_LENGTH && array[len]; len++) {
		if (len >= nkf_buf_length(buf)) {
		    c = (*g)(f);
		    if (c == EOF) {
			len = 0;
			lower = 1, upper = 0;
			break;
		    }
		    nkf_buf_push(buf, c);
		}
		if (array[len] != nkf_buf_at(buf, len)) {
		    if (array[len] < nkf_buf_at(buf, len)) lower = mid + 1;
		    else  upper = mid - 1;
		    len = 0;
		    break;
		}
	    }
	    if (len > 0) {
		int i;
		array = normalization_table[mid].nfc;
		nkf_buf_clear(buf);
		for (i=0; i < NORMALIZATION_TABLE_NFC_LENGTH && array[i]; i++)
		    nkf_buf_push(buf, array[i]);
		break;
	    }
	}
    } while (lower <= upper);

    while (nkf_buf_length(buf) > 1) (*u)(nkf_buf_pop(buf), f);
    c = nkf_buf_pop(buf);

    return c;
}

static nkf_char
nfc_ungetc(nkf_char c, FILE *f)
{
    return (*i_nfc_ungetc)(c, f);
}
#endif /* UNICODE_NORMALIZATION */


static nkf_char
base64decode(nkf_char c)
{
    int             i;
    if (c > '@') {
	if (c < '[') {
	    i = c - 'A';                        /* A..Z 0-25 */
	} else if (c == '_') {
	    i = '?'         /* 63 */ ;          /* _  63 */
	} else {
	    i = c - 'G'     /* - 'a' + 26 */ ;  /* a..z 26-51 */
	}
    } else if (c > '/') {
	i = c - '0' + '4'   /* - '0' + 52 */ ;  /* 0..9 52-61 */
    } else if (c == '+' || c == '-') {
	i = '>'             /* 62 */ ;          /* + and -  62 */
    } else {
	i = '?'             /* 63 */ ;          /* / 63 */
    }
    return (i);
}

static nkf_char
mime_getc(FILE *f)
{
    nkf_char c1, c2, c3, c4, cc;
    nkf_char t1, t2, t3, t4, mode, exit_mode;
    nkf_char lwsp_count;
    char *lwsp_buf;
    char *lwsp_buf_new;
    nkf_char lwsp_size = 128;

    if (mime_input_state.top != mime_input_state.last) {  /* Something is in FIFO */
	return  mime_input_buf(mime_input_state.top++);
    }
    if (mime_decode_mode==1 ||mime_decode_mode==FALSE) {
	mime_decode_mode=FALSE;
	unswitch_mime_getc();
	return (*i_getc)(f);
    }

    if (mimebuf_f == FIXED_MIME)
	exit_mode = mime_decode_mode;
    else
	exit_mode = FALSE;
    if (mime_decode_mode == 'Q') {
	if ((c1 = (*i_mgetc)(f)) == EOF) return (EOF);
      restart_mime_q:
	if (c1=='_' && mimebuf_f != FIXED_MIME) return SP;
	if (c1<=SP || DEL<=c1) {
	    mime_decode_mode = exit_mode; /* prepare for quit */
	    return c1;
	}
	if (c1!='=' && (c1!='?' || mimebuf_f == FIXED_MIME)) {
	    return c1;
	}

	mime_decode_mode = exit_mode; /* prepare for quit */
	if ((c2 = (*i_mgetc)(f)) == EOF) return (EOF);
	if (c1=='?'&&c2=='=' && mimebuf_f != FIXED_MIME) {
	    /* end Q encoding */
	    input_mode = exit_mode;
	    lwsp_count = 0;
	    lwsp_buf = nkf_xmalloc((lwsp_size+5)*sizeof(char));
	    while ((c1=(*i_getc)(f))!=EOF) {
		switch (c1) {
		case LF:
		case CR:
		    if (c1==LF) {
			if ((c1=(*i_getc)(f))!=EOF && nkf_isblank(c1)) {
			    i_ungetc(SP,f);
			    continue;
			} else {
			    i_ungetc(c1,f);
			}
			c1 = LF;
		    } else {
			if ((c1=(*i_getc)(f))!=EOF && c1 == LF) {
			    if ((c1=(*i_getc)(f))!=EOF && nkf_isblank(c1)) {
				i_ungetc(SP,f);
				continue;
			    } else {
				i_ungetc(c1,f);
			    }
			    i_ungetc(LF,f);
			} else {
			    i_ungetc(c1,f);
			}
			c1 = CR;
		    }
		    break;
		case SP:
		case TAB:
		    lwsp_buf[lwsp_count] = (unsigned char)c1;
		    if (lwsp_count++>lwsp_size){
			lwsp_size <<= 1;
			lwsp_buf_new = nkf_xrealloc(lwsp_buf, (lwsp_size+5)*sizeof(char));
			lwsp_buf = lwsp_buf_new;
		    }
		    continue;
		}
		break;
	    }
	    if (lwsp_count > 0 && (c1 != '=' || (lwsp_buf[lwsp_count-1] != SP && lwsp_buf[lwsp_count-1] != TAB))) {
		i_ungetc(c1,f);
		for(lwsp_count--;lwsp_count>0;lwsp_count--)
		    i_ungetc(lwsp_buf[lwsp_count],f);
		c1 = lwsp_buf[0];
	    }
	    nkf_xfree(lwsp_buf);
	    return c1;
	}
	if (c1=='='&&c2<SP) { /* this is soft wrap */
	    while((c1 =  (*i_mgetc)(f)) <=SP) {
		if (c1 == EOF) return (EOF);
	    }
	    mime_decode_mode = 'Q'; /* still in MIME */
	    goto restart_mime_q;
	}
	if (c1=='?') {
	    mime_decode_mode = 'Q'; /* still in MIME */
	    (*i_mungetc)(c2,f);
	    return c1;
	}
	if ((c3 = (*i_mgetc)(f)) == EOF) return (EOF);
	if (c2<=SP) return c2;
	mime_decode_mode = 'Q'; /* still in MIME */
	return ((hex2bin(c2)<<4) + hex2bin(c3));
    }

    if (mime_decode_mode != 'B') {
	mime_decode_mode = FALSE;
	return (*i_mgetc)(f);
    }


    /* Base64 encoding */
    /*
       MIME allows line break in the middle of
       Base64, but we are very pessimistic in decoding
       in unbuf mode because MIME encoded code may broken by
       less or editor's control sequence (such as ESC-[-K in unbuffered
       mode. ignore incomplete MIME.
     */
    mode = mime_decode_mode;
    mime_decode_mode = exit_mode;  /* prepare for quit */

    while ((c1 = (*i_mgetc)(f))<=SP) {
	if (c1==EOF)
	    return (EOF);
    }
  mime_c2_retry:
    if ((c2 = (*i_mgetc)(f))<=SP) {
	if (c2==EOF)
	    return (EOF);
	if (mime_f != STRICT_MIME) goto mime_c2_retry;
	if (mimebuf_f!=FIXED_MIME) input_mode = ASCII;
	return c2;
    }
    if ((c1 == '?') && (c2 == '=')) {
	input_mode = ASCII;
	lwsp_count = 0;
	lwsp_buf = nkf_xmalloc((lwsp_size+5)*sizeof(char));
	while ((c1=(*i_getc)(f))!=EOF) {
	    switch (c1) {
	    case LF:
	    case CR:
		if (c1==LF) {
		    if ((c1=(*i_getc)(f))!=EOF && nkf_isblank(c1)) {
			i_ungetc(SP,f);
			continue;
		    } else {
			i_ungetc(c1,f);
		    }
		    c1 = LF;
		} else {
		    if ((c1=(*i_getc)(f))!=EOF) {
			if (c1==SP) {
			    i_ungetc(SP,f);
			    continue;
			} else if ((c1=(*i_getc)(f))!=EOF && nkf_isblank(c1)) {
			    i_ungetc(SP,f);
			    continue;
			} else {
			    i_ungetc(c1,f);
			}
			i_ungetc(LF,f);
		    } else {
			i_ungetc(c1,f);
		    }
		    c1 = CR;
		}
		break;
	    case SP:
	    case TAB:
		lwsp_buf[lwsp_count] = (unsigned char)c1;
		if (lwsp_count++>lwsp_size){
		    lwsp_size <<= 1;
		    lwsp_buf_new = nkf_xrealloc(lwsp_buf, (lwsp_size+5)*sizeof(char));
		    lwsp_buf = lwsp_buf_new;
		}
		continue;
	    }
	    break;
	}
	if (lwsp_count > 0 && (c1 != '=' || (lwsp_buf[lwsp_count-1] != SP && lwsp_buf[lwsp_count-1] != TAB))) {
	    i_ungetc(c1,f);
	    for(lwsp_count--;lwsp_count>0;lwsp_count--)
		i_ungetc(lwsp_buf[lwsp_count],f);
	    c1 = lwsp_buf[0];
	}
	nkf_xfree(lwsp_buf);
	return c1;
    }
  mime_c3_retry:
    if ((c3 = (*i_mgetc)(f))<=SP) {
	if (c3==EOF)
	    return (EOF);
	if (mime_f != STRICT_MIME) goto mime_c3_retry;
	if (mimebuf_f!=FIXED_MIME) input_mode = ASCII;
	return c3;
    }
  mime_c4_retry:
    if ((c4 = (*i_mgetc)(f))<=SP) {
	if (c4==EOF)
	    return (EOF);
	if (mime_f != STRICT_MIME) goto mime_c4_retry;
	if (mimebuf_f!=FIXED_MIME) input_mode = ASCII;
	return c4;
    }

    mime_decode_mode = mode; /* still in MIME sigh... */

    /* BASE 64 decoding */

    t1 = 0x3f & base64decode(c1);
    t2 = 0x3f & base64decode(c2);
    t3 = 0x3f & base64decode(c3);
    t4 = 0x3f & base64decode(c4);
    cc = ((t1 << 2) & 0x0fc) | ((t2 >> 4) & 0x03);
    if (c2 != '=') {
	mime_input_buf(mime_input_state.last++) = (unsigned char)cc;
	cc = ((t2 << 4) & 0x0f0) | ((t3 >> 2) & 0x0f);
	if (c3 != '=') {
	    mime_input_buf(mime_input_state.last++) = (unsigned char)cc;
	    cc = ((t3 << 6) & 0x0c0) | (t4 & 0x3f);
	    if (c4 != '=')
		mime_input_buf(mime_input_state.last++) = (unsigned char)cc;
	}
    } else {
	return c1;
    }
    return  mime_input_buf(mime_input_state.top++);
}

static const char basis_64[] =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

#define MIMEOUT_BUF_LENGTH 74
static struct {
    unsigned char buf[MIMEOUT_BUF_LENGTH+1];
    int count;
} mimeout_state;

/*nkf_char mime_lastchar2, mime_lastchar1;*/

static void
open_mime(nkf_char mode)
{
    const unsigned char *p;
    int i;
    int j;
    p  = mime_pattern[0];
    for(i=0;mime_pattern[i];i++) {
	if (mode == mime_encode[i]) {
	    p = mime_pattern[i];
	    break;
	}
    }
    mimeout_mode = mime_encode_method[i];
    i = 0;
    if (base64_count>45) {
	if (mimeout_state.count>0 && nkf_isblank(mimeout_state.buf[i])){
	    (*o_mputc)(mimeout_state.buf[i]);
	    i++;
	}
	put_newline(o_mputc);
	(*o_mputc)(SP);
	base64_count = 1;
	if (mimeout_state.count>0 && nkf_isspace(mimeout_state.buf[i])) {
	    i++;
	}
    }
    for (;i<mimeout_state.count;i++) {
	if (nkf_isspace(mimeout_state.buf[i])) {
	    (*o_mputc)(mimeout_state.buf[i]);
	    base64_count ++;
	} else {
	    break;
	}
    }
    while(*p) {
	(*o_mputc)(*p++);
	base64_count ++;
    }
    j = mimeout_state.count;
    mimeout_state.count = 0;
    for (;i<j;i++) {
	mime_putc(mimeout_state.buf[i]);
    }
}

static void
mime_prechar(nkf_char c2, nkf_char c1)
{
    if (mimeout_mode > 0){
	if (c2 == EOF){
	    if (base64_count + mimeout_state.count/3*4> 73){
		(*o_base64conv)(EOF,0);
		oconv_newline(o_base64conv);
		(*o_base64conv)(0,SP);
		base64_count = 1;
	    }
	} else {
	    if ((c2 != 0 || c1 > DEL) && base64_count + mimeout_state.count/3*4> 66) {
		(*o_base64conv)(EOF,0);
		oconv_newline(o_base64conv);
		(*o_base64conv)(0,SP);
		base64_count = 1;
		mimeout_mode = -1;
	    }
	}
    } else if (c2) {
	if (c2 != EOF && base64_count + mimeout_state.count/3*4> 60) {
	    mimeout_mode =  (output_mode==ASCII ||output_mode == ISO_8859_1) ? 'Q' : 'B';
	    open_mime(output_mode);
	    (*o_base64conv)(EOF,0);
	    oconv_newline(o_base64conv);
	    (*o_base64conv)(0,SP);
	    base64_count = 1;
	    mimeout_mode = -1;
	}
    }
}

static void
close_mime(void)
{
    (*o_mputc)('?');
    (*o_mputc)('=');
    base64_count += 2;
    mimeout_mode = 0;
}

static void
eof_mime(void)
{
    switch(mimeout_mode) {
    case 'Q':
    case 'B':
	break;
    case 2:
	(*o_mputc)(basis_64[((nkf_state->mimeout_state & 0x3)<< 4)]);
	(*o_mputc)('=');
	(*o_mputc)('=');
	base64_count += 3;
	break;
    case 1:
	(*o_mputc)(basis_64[((nkf_state->mimeout_state & 0xF) << 2)]);
	(*o_mputc)('=');
	base64_count += 2;
	break;
    }
    if (mimeout_mode > 0) {
	if (mimeout_f!=FIXED_MIME) {
	    close_mime();
	} else if (mimeout_mode != 'Q')
	    mimeout_mode = 'B';
    }
}

static void
mimeout_addchar(nkf_char c)
{
    switch(mimeout_mode) {
    case 'Q':
	if (c==CR||c==LF) {
	    (*o_mputc)(c);
	    base64_count = 0;
	} else if(!nkf_isalnum(c)) {
	    (*o_mputc)('=');
	    (*o_mputc)(bin2hex(((c>>4)&0xf)));
	    (*o_mputc)(bin2hex((c&0xf)));
	    base64_count += 3;
	} else {
	    (*o_mputc)(c);
	    base64_count++;
	}
	break;
    case 'B':
	nkf_state->mimeout_state=c;
	(*o_mputc)(basis_64[c>>2]);
	mimeout_mode=2;
	base64_count ++;
	break;
    case 2:
	(*o_mputc)(basis_64[((nkf_state->mimeout_state & 0x3)<< 4) | ((c & 0xF0) >> 4)]);
	nkf_state->mimeout_state=c;
	mimeout_mode=1;
	base64_count ++;
	break;
    case 1:
	(*o_mputc)(basis_64[((nkf_state->mimeout_state & 0xF) << 2) | ((c & 0xC0) >>6)]);
	(*o_mputc)(basis_64[c & 0x3F]);
	mimeout_mode='B';
	base64_count += 2;
	break;
    default:
	(*o_mputc)(c);
	base64_count++;
	break;
    }
}

static void
mime_putc(nkf_char c)
{
    int i, j;
    nkf_char lastchar;

    if (mimeout_f == FIXED_MIME){
	if (mimeout_mode == 'Q'){
	    if (base64_count > 71){
		if (c!=CR && c!=LF) {
		    (*o_mputc)('=');
		    put_newline(o_mputc);
		}
		base64_count = 0;
	    }
	}else{
	    if (base64_count > 71){
		eof_mime();
		put_newline(o_mputc);
		base64_count = 0;
	    }
	    if (c == EOF) { /* c==EOF */
		eof_mime();
	    }
	}
	if (c != EOF) { /* c==EOF */
	    mimeout_addchar(c);
	}
	return;
    }

    /* mimeout_f != FIXED_MIME */

    if (c == EOF) { /* c==EOF */
	if (mimeout_mode == -1 && mimeout_state.count > 1) open_mime(output_mode);
	j = mimeout_state.count;
	mimeout_state.count = 0;
	i = 0;
	if (mimeout_mode > 0) {
	    if (!nkf_isblank(mimeout_state.buf[j-1])) {
		for (;i<j;i++) {
		    if (nkf_isspace(mimeout_state.buf[i]) && base64_count < 71){
			break;
		    }
		    mimeout_addchar(mimeout_state.buf[i]);
		}
		eof_mime();
		for (;i<j;i++) {
		    mimeout_addchar(mimeout_state.buf[i]);
		}
	    } else {
		for (;i<j;i++) {
		    mimeout_addchar(mimeout_state.buf[i]);
		}
		eof_mime();
	    }
	} else {
	    for (;i<j;i++) {
		mimeout_addchar(mimeout_state.buf[i]);
	    }
	}
	return;
    }

    if (mimeout_state.count > 0){
	lastchar = mimeout_state.buf[mimeout_state.count - 1];
    }else{
	lastchar = -1;
    }

    if (mimeout_mode=='Q') {
	if (c <= DEL && (output_mode==ASCII ||output_mode == ISO_8859_1)) {
	    if (c == CR || c == LF) {
		close_mime();
		(*o_mputc)(c);
		base64_count = 0;
		return;
	    } else if (c <= SP) {
		close_mime();
		if (base64_count > 70) {
		    put_newline(o_mputc);
		    base64_count = 0;
		}
		if (!nkf_isblank(c)) {
		    (*o_mputc)(SP);
		    base64_count++;
		}
	    } else {
		if (base64_count > 70) {
		    close_mime();
		    put_newline(o_mputc);
		    (*o_mputc)(SP);
		    base64_count = 1;
		    open_mime(output_mode);
		}
		if (!nkf_noescape_mime(c)) {
		    mimeout_addchar(c);
		    return;
		}
	    }
	    if (c != 0x1B) {
		(*o_mputc)(c);
		base64_count++;
		return;
	    }
	}
    }

    if (mimeout_mode <= 0) {
	if (c <= DEL && (output_mode==ASCII || output_mode == ISO_8859_1 ||
		    output_mode == UTF_8)) {
	    if (nkf_isspace(c)) {
		int flag = 0;
		if (mimeout_mode == -1) {
		    flag = 1;
		}
		if (c==CR || c==LF) {
		    if (flag) {
			open_mime(output_mode);
			output_mode = 0;
		    } else {
			base64_count = 0;
		    }
		}
		for (i=0;i<mimeout_state.count;i++) {
		    (*o_mputc)(mimeout_state.buf[i]);
		    if (mimeout_state.buf[i] == CR || mimeout_state.buf[i] == LF){
			base64_count = 0;
		    }else{
			base64_count++;
		    }
		}
		if (flag) {
		    eof_mime();
		    base64_count = 0;
		    mimeout_mode = 0;
		}
		mimeout_state.buf[0] = (char)c;
		mimeout_state.count = 1;
	    }else{
		if (base64_count > 1
		    && base64_count + mimeout_state.count > 76
		    && mimeout_state.buf[0] != CR && mimeout_state.buf[0] != LF){
		    static const char *str = "boundary=\"";
		    static int len = 10;
		    i = 0;

		    for (; i < mimeout_state.count - len; ++i) {
			if (!strncmp((char *)(mimeout_state.buf+i), str, len)) {
			    i += len - 2;
			    break;
			}
		    }

		    if (i == 0 || i == mimeout_state.count - len) {
			put_newline(o_mputc);
			base64_count = 0;
			if (!nkf_isspace(mimeout_state.buf[0])){
			    (*o_mputc)(SP);
			    base64_count++;
			}
		    }
		    else {
			int j;
			for (j = 0; j <= i; ++j) {
			    (*o_mputc)(mimeout_state.buf[j]);
			}
			put_newline(o_mputc);
			base64_count = 1;
			for (; j <= mimeout_state.count; ++j) {
			    mimeout_state.buf[j - i] = mimeout_state.buf[j];
			}
			mimeout_state.count -= i;
		    }
		}
		mimeout_state.buf[mimeout_state.count++] = (char)c;
		if (mimeout_state.count>MIMEOUT_BUF_LENGTH) {
		    open_mime(output_mode);
		}
	    }
	    return;
	}else{
	    if (lastchar==CR || lastchar == LF){
		for (i=0;i<mimeout_state.count;i++) {
		    (*o_mputc)(mimeout_state.buf[i]);
		}
		base64_count = 0;
		mimeout_state.count = 0;
	    }
	    if (lastchar==SP) {
		for (i=0;i<mimeout_state.count-1;i++) {
		    (*o_mputc)(mimeout_state.buf[i]);
		    base64_count++;
		}
		mimeout_state.buf[0] = SP;
		mimeout_state.count = 1;
	    }
	    open_mime(output_mode);
	}
    }else{
	/* mimeout_mode == 'B', 1, 2 */
	if (c <= DEL && (output_mode==ASCII || output_mode == ISO_8859_1 ||
		    output_mode == UTF_8)) {
	    if (lastchar == CR || lastchar == LF){
		if (nkf_isblank(c)) {
		    for (i=0;i<mimeout_state.count;i++) {
			mimeout_addchar(mimeout_state.buf[i]);
		    }
		    mimeout_state.count = 0;
		} else {
		    eof_mime();
		    for (i=0;i<mimeout_state.count;i++) {
			(*o_mputc)(mimeout_state.buf[i]);
		    }
		    base64_count = 0;
		    mimeout_state.count = 0;
		}
		mimeout_state.buf[mimeout_state.count++] = (char)c;
		return;
	    }
	    if (nkf_isspace(c)) {
		for (i=0;i<mimeout_state.count;i++) {
		    if (SP<mimeout_state.buf[i] && mimeout_state.buf[i]<DEL) {
			eof_mime();
			for (i=0;i<mimeout_state.count;i++) {
			    (*o_mputc)(mimeout_state.buf[i]);
			    base64_count++;
			}
			mimeout_state.count = 0;
		    }
		}
		mimeout_state.buf[mimeout_state.count++] = (char)c;
		if (mimeout_state.count>MIMEOUT_BUF_LENGTH) {
		    eof_mime();
		    for (j=0;j<mimeout_state.count;j++) {
			(*o_mputc)(mimeout_state.buf[j]);
			base64_count++;
		    }
		    mimeout_state.count = 0;
		}
		return;
	    }
	    if (mimeout_state.count>0 && SP<c && c!='=') {
		mimeout_state.buf[mimeout_state.count++] = (char)c;
		if (mimeout_state.count>MIMEOUT_BUF_LENGTH) {
		    j = mimeout_state.count;
		    mimeout_state.count = 0;
		    for (i=0;i<j;i++) {
			mimeout_addchar(mimeout_state.buf[i]);
		    }
		}
		return;
	    }
	}
    }
    if (mimeout_state.count>0) {
	j = mimeout_state.count;
	mimeout_state.count = 0;
	for (i=0;i<j;i++) {
	    if (mimeout_state.buf[i]==CR || mimeout_state.buf[i]==LF)
		break;
	    mimeout_addchar(mimeout_state.buf[i]);
	}
	if (i<j) {
	    eof_mime();
	    base64_count=0;
	    for (;i<j;i++) {
		(*o_mputc)(mimeout_state.buf[i]);
	    }
	    open_mime(output_mode);
	}
    }
    mimeout_addchar(c);
}

static void
base64_conv(nkf_char c2, nkf_char c1)
{
    mime_prechar(c2, c1);
    (*o_base64conv)(c2,c1);
}

#ifdef HAVE_ICONV_H
typedef struct nkf_iconv_t {
    iconv_t cd;
    char *input_buffer;
    size_t input_buffer_size;
    char *output_buffer;
    size_t output_buffer_size;
};

static nkf_iconv_t
nkf_iconv_new(char *tocode, char *fromcode)
{
    nkf_iconv_t converter;

    converter->input_buffer_size = IOBUF_SIZE;
    converter->input_buffer = nkf_xmalloc(converter->input_buffer_size);
    converter->output_buffer_size = IOBUF_SIZE * 2;
    converter->output_buffer = nkf_xmalloc(converter->output_buffer_size);
    converter->cd = iconv_open(tocode, fromcode);
    if (converter->cd == (iconv_t)-1)
    {
	switch (errno) {
	case EINVAL:
	    perror(fprintf("iconv doesn't support %s to %s conversion.", fromcode, tocode));
	    return -1;
	default:
	    perror("can't iconv_open");
	}
    }
}

static size_t
nkf_iconv_convert(nkf_iconv_t *converter, FILE *input)
{
    size_t invalid = (size_t)0;
    char *input_buffer = converter->input_buffer;
    size_t input_length = (size_t)0;
    char *output_buffer = converter->output_buffer;
    size_t output_length = converter->output_buffer_size;
    int c;

    do {
	if (c != EOF) {
	    while ((c = (*i_getc)(f)) != EOF) {
		input_buffer[input_length++] = c;
		if (input_length < converter->input_buffer_size) break;
	    }
	}

	size_t ret = iconv(converter->cd, &input_buffer, &input_length, &output_buffer, &output_length);
	while (output_length-- > 0) {
	    (*o_putc)(output_buffer[converter->output_buffer_size-output_length]);
	}
	if (ret == (size_t) - 1) {
	    switch (errno) {
	    case EINVAL:
		if (input_buffer != converter->input_buffer)
		    memmove(converter->input_buffer, input_buffer, input_length);
		break;
	    case E2BIG:
		converter->output_buffer_size *= 2;
		output_buffer = realloc(converter->outbuf, converter->output_buffer_size);
		if (output_buffer == NULL) {
		    perror("can't realloc");
		    return -1;
		}
		converter->output_buffer = output_buffer;
		break;
	    default:
		perror("can't iconv");
		return -1;
	    }
	} else {
	    invalid += ret;
	}
    } while (1);

    return invalid;
}


static void
nkf_iconv_close(nkf_iconv_t *convert)
{
    nkf_xfree(converter->inbuf);
    nkf_xfree(converter->outbuf);
    iconv_close(converter->cd);
}
#endif


static void
reinit(void)
{
    {
	struct input_code *p = input_code_list;
	while (p->name){
	    status_reinit(p++);
	}
    }
    unbuf_f = FALSE;
    estab_f = FALSE;
    nop_f = FALSE;
    binmode_f = TRUE;
    rot_f = FALSE;
    hira_f = FALSE;
    alpha_f = FALSE;
    mime_f = MIME_DECODE_DEFAULT;
    mime_decode_f = FALSE;
    mimebuf_f = FALSE;
    broken_f = FALSE;
    iso8859_f = FALSE;
    mimeout_f = FALSE;
    x0201_f = NKF_UNSPECIFIED;
    iso2022jp_f = FALSE;
#if defined(UTF8_INPUT_ENABLE) || defined(UTF8_OUTPUT_ENABLE)
    ms_ucs_map_f = UCS_MAP_ASCII;
#endif
#ifdef UTF8_INPUT_ENABLE
    no_cp932ext_f = FALSE;
    no_best_fit_chars_f = FALSE;
    encode_fallback = NULL;
    unicode_subchar  = '?';
    input_endian = ENDIAN_BIG;
#endif
#ifdef UTF8_OUTPUT_ENABLE
    output_bom_f = FALSE;
    output_endian = ENDIAN_BIG;
#endif
#ifdef UNICODE_NORMALIZATION
    nfc_f = FALSE;
#endif
#ifdef INPUT_OPTION
    cap_f = FALSE;
    url_f = FALSE;
    numchar_f = FALSE;
#endif
#ifdef CHECK_OPTION
    noout_f = FALSE;
    debug_f = FALSE;
#endif
    guess_f = 0;
#ifdef EXEC_IO
    exec_f = 0;
#endif
#ifdef SHIFTJIS_CP932
    cp51932_f = TRUE;
    cp932inv_f = TRUE;
#endif
#ifdef X0212_ENABLE
    x0212_f = FALSE;
    x0213_f = FALSE;
#endif
    {
	int i;
	for (i = 0; i < 256; i++){
	    prefix_table[i] = 0;
	}
    }
    hold_count = 0;
    mimeout_state.count = 0;
    mimeout_mode = 0;
    base64_count = 0;
    f_line = 0;
    f_prev = 0;
    fold_preserve_f = FALSE;
    fold_f = FALSE;
    fold_len = 0;
    kanji_intro = DEFAULT_J;
    ascii_intro = DEFAULT_R;
    fold_margin  = FOLD_MARGIN;
    o_zconv = no_connection;
    o_fconv = no_connection;
    o_eol_conv = no_connection;
    o_rot_conv = no_connection;
    o_hira_conv = no_connection;
    o_base64conv = no_connection;
    o_iso2022jp_check_conv = no_connection;
    o_putc = std_putc;
    i_getc = std_getc;
    i_ungetc = std_ungetc;
    i_bgetc = std_getc;
    i_bungetc = std_ungetc;
    o_mputc = std_putc;
    i_mgetc = std_getc;
    i_mungetc  = std_ungetc;
    i_mgetc_buf = std_getc;
    i_mungetc_buf = std_ungetc;
    output_mode = ASCII;
    input_mode =  ASCII;
    mime_decode_mode = FALSE;
    file_out_f = FALSE;
    eolmode_f = 0;
    input_eol = 0;
    prev_cr = 0;
    option_mode = 0;
    z_prev2=0,z_prev1=0;
#ifdef CHECK_OPTION
    iconv_for_check = 0;
#endif
    input_codename = NULL;
    input_encoding = NULL;
    output_encoding = NULL;
    nkf_state_init();
#ifdef WIN32DLL
    reinitdll();
#endif /*WIN32DLL*/
}

static int
module_connection(void)
{
    if (input_encoding) set_input_encoding(input_encoding);
    if (!output_encoding) {
	output_encoding = nkf_default_encoding();
    }
    if (!output_encoding) {
	if (noout_f || guess_f) output_encoding = nkf_enc_from_index(ISO_2022_JP);
	else return -1;
    }
    set_output_encoding(output_encoding);
    oconv = nkf_enc_to_oconv(output_encoding);
    o_putc = std_putc;
    if (nkf_enc_unicode_p(output_encoding))
	output_mode = UTF_8;

    if (x0201_f == NKF_UNSPECIFIED) {
	x0201_f = X0201_DEFAULT;
    }

    /* replace continuation module, from output side */

    /* output redirection */
#ifdef CHECK_OPTION
    if (noout_f || guess_f){
	o_putc = no_putc;
    }
#endif
    if (mimeout_f) {
	o_mputc = o_putc;
	o_putc = mime_putc;
	if (mimeout_f == TRUE) {
	    o_base64conv = oconv; oconv = base64_conv;
	}
	/* base64_count = 0; */
    }

    if (eolmode_f || guess_f) {
	o_eol_conv = oconv; oconv = eol_conv;
    }
    if (rot_f) {
	o_rot_conv = oconv; oconv = rot_conv;
    }
    if (iso2022jp_f) {
	o_iso2022jp_check_conv = oconv; oconv = iso2022jp_check_conv;
    }
    if (hira_f) {
	o_hira_conv = oconv; oconv = hira_conv;
    }
    if (fold_f) {
	o_fconv = oconv; oconv = fold_conv;
	f_line = 0;
    }
    if (alpha_f || x0201_f) {
	o_zconv = oconv; oconv = z_conv;
    }

    i_getc = std_getc;
    i_ungetc = std_ungetc;
    /* input redirection */
#ifdef INPUT_OPTION
    if (cap_f){
	i_cgetc = i_getc; i_getc = cap_getc;
	i_cungetc = i_ungetc; i_ungetc= cap_ungetc;
    }
    if (url_f){
	i_ugetc = i_getc; i_getc = url_getc;
	i_uungetc = i_ungetc; i_ungetc= url_ungetc;
    }
#endif
#ifdef NUMCHAR_OPTION
    if (numchar_f){
	i_ngetc = i_getc; i_getc = numchar_getc;
	i_nungetc = i_ungetc; i_ungetc= numchar_ungetc;
    }
#endif
#ifdef UNICODE_NORMALIZATION
    if (nfc_f){
	i_nfc_getc = i_getc; i_getc = nfc_getc;
	i_nfc_ungetc = i_ungetc; i_ungetc= nfc_ungetc;
    }
#endif
    if (mime_f && mimebuf_f==FIXED_MIME) {
	i_mgetc = i_getc; i_getc = mime_getc;
	i_mungetc = i_ungetc; i_ungetc = mime_ungetc;
    }
    if (broken_f & 1) {
	i_bgetc = i_getc; i_getc = broken_getc;
	i_bungetc = i_ungetc; i_ungetc = broken_ungetc;
    }
    if (input_encoding) {
	set_iconv(-TRUE, nkf_enc_to_iconv(input_encoding));
    } else {
	set_iconv(FALSE, e_iconv);
    }

    {
	struct input_code *p = input_code_list;
	while (p->name){
	    status_reinit(p++);
	}
    }
    return 0;
}

/*
   Conversion main loop. Code detection only.
 */

#if !defined(PERL_XS) && !defined(WIN32DLL)
static nkf_char
noconvert(FILE *f)
{
    nkf_char    c;

    if (nop_f == 2)
	module_connection();
    while ((c = (*i_getc)(f)) != EOF)
	(*o_putc)(c);
    (*o_putc)(EOF);
    return 1;
}
#endif

#define NEXT continue        /* no output, get next */
#define SKIP c2=0;continue        /* no output, get next */
#define MORE c2=c1;continue  /* need one more byte */
#define SEND (void)0         /* output c1 and c2, get next */
#define LAST break           /* end of loop, go closing  */
#define set_input_mode(mode) do { \
    input_mode = mode; \
    shift_mode = 0; \
    set_input_codename("ISO-2022-JP"); \
    debug("ISO-2022-JP"); \
} while (0)

static int
kanji_convert(FILE *f)
{
    nkf_char c1=0, c2=0, c3=0, c4=0;
    int shift_mode = 0; /* 0, 1, 2, 3 */
    int g2 = 0;
    int is_8bit = FALSE;

    if (input_encoding && !nkf_enc_asciicompat(input_encoding)) {
	is_8bit = TRUE;
    }

    input_mode = ASCII;
    output_mode = ASCII;

    if (module_connection() < 0) {
#if !defined(PERL_XS) && !defined(WIN32DLL)
	fprintf(stderr, "no output encoding given\n");
#endif
	return -1;
    }
    check_bom(f);

#ifdef UTF8_INPUT_ENABLE
    if(iconv == w_iconv32){
	while ((c1 = (*i_getc)(f)) != EOF &&
	       (c2 = (*i_getc)(f)) != EOF &&
	       (c3 = (*i_getc)(f)) != EOF &&
	       (c4 = (*i_getc)(f)) != EOF) {
	    nkf_char c5, c6, c7, c8;
	    if (nkf_iconv_utf_32(c1, c2, c3, c4) == (size_t)NKF_ICONV_WAIT_COMBINING_CHAR) {
		if ((c5 = (*i_getc)(f)) != EOF &&
		    (c6 = (*i_getc)(f)) != EOF &&
		    (c7 = (*i_getc)(f)) != EOF &&
		    (c8 = (*i_getc)(f)) != EOF) {
		    if (nkf_iconv_utf_32_combine(c1, c2, c3, c4, c5, c6, c7, c8)) {
			(*i_ungetc)(c8, f);
			(*i_ungetc)(c7, f);
			(*i_ungetc)(c6, f);
			(*i_ungetc)(c5, f);
			nkf_iconv_utf_32_nocombine(c1, c2, c3, c4);
		    }
		} else {
		    nkf_iconv_utf_32_nocombine(c1, c2, c3, c4);
		}
	    }
	}
	goto finished;
    }
    else if (iconv == w_iconv16) {
	while ((c1 = (*i_getc)(f)) != EOF &&
	       (c2 = (*i_getc)(f)) != EOF) {
	    size_t ret = nkf_iconv_utf_16(c1, c2, 0, 0);
	    if (ret == NKF_ICONV_NEED_TWO_MORE_BYTES &&
		(c3 = (*i_getc)(f)) != EOF &&
		(c4 = (*i_getc)(f)) != EOF) {
		nkf_iconv_utf_16(c1, c2, c3, c4);
	    } else if (ret == (size_t)NKF_ICONV_WAIT_COMBINING_CHAR) {
		if ((c3 = (*i_getc)(f)) != EOF &&
		    (c4 = (*i_getc)(f)) != EOF) {
		    if (nkf_iconv_utf_16_combine(c1, c2, c3, c4)) {
			(*i_ungetc)(c4, f);
			(*i_ungetc)(c3, f);
			nkf_iconv_utf_16_nocombine(c1, c2);
		    }
		} else {
		    nkf_iconv_utf_16_nocombine(c1, c2);
		}
	    }
	}
	goto finished;
    }
#endif

    while ((c1 = (*i_getc)(f)) != EOF) {
#ifdef INPUT_CODE_FIX
	if (!input_encoding)
#endif
	    code_status(c1);
	if (c2) {
	    /* second byte */
	    if (c2 > ((input_encoding && nkf_enc_cp5022x_p(input_encoding)) ? 0x92 : DEL)) {
		/* in case of 8th bit is on */
		if (!estab_f&&!mime_decode_mode) {
		    /* in case of not established yet */
		    /* It is still ambiguous */
		    if (h_conv(f, c2, c1)==EOF) {
			LAST;
		    }
		    else {
			SKIP;
		    }
		}
		else {
		    /* in case of already established */
		    if (c1 < 0x40) {
			/* ignore bogus code */
			SKIP;
		    } else {
			SEND;
		    }
		}
	    }
	    else {
		/* 2nd byte of 7 bit code or SJIS */
		SEND;
	    }
	}
	else if (nkf_char_unicode_p(c1)) {
	    (*oconv)(0, c1);
	    NEXT;
	}
	else {
	    /* first byte */
	    if (input_mode == JIS_X_0208 && DEL <= c1 && c1 < 0x92) {
		/* CP5022x */
		MORE;
	    }else if (input_codename && input_codename[0] == 'I' &&
		    0xA1 <= c1 && c1 <= 0xDF) {
		/* JIS X 0201 Katakana in 8bit JIS */
		c2 = JIS_X_0201_1976_K;
		c1 &= 0x7f;
		SEND;
	    } else if (c1 > DEL) {
		/* 8 bit code */
		if (!estab_f && !iso8859_f) {
		    /* not established yet */
		    MORE;
		} else { /* estab_f==TRUE */
		    if (iso8859_f) {
			c2 = ISO_8859_1;
			c1 &= 0x7f;
			SEND;
		    }
		    else if ((iconv == s_iconv && 0xA0 <= c1 && c1 <= 0xDF) ||
			     (ms_ucs_map_f == UCS_MAP_CP10001 && (c1 == 0xFD || c1 == 0xFE))) {
			/* JIS X 0201 */
			c2 = JIS_X_0201_1976_K;
			c1 &= 0x7f;
			SEND;
		    }
		    else {
			/* already established */
			MORE;
		    }
		}
	    } else if (SP < c1 && c1 < DEL) {
		/* in case of Roman characters */
		if (shift_mode) {
		    /* output 1 shifted byte */
		    if (iso8859_f) {
			c2 = ISO_8859_1;
			SEND;
		    } else if (nkf_byte_jisx0201_katakana_p(c1)){
			/* output 1 shifted byte */
			c2 = JIS_X_0201_1976_K;
			SEND;
		    } else {
			/* look like bogus code */
			SKIP;
		    }
		} else if (input_mode == JIS_X_0208 || input_mode == JIS_X_0212 ||
			   input_mode == JIS_X_0213_1 || input_mode == JIS_X_0213_2) {
		    /* in case of Kanji shifted */
		    MORE;
		} else if (c1 == '=' && mime_f && !mime_decode_mode) {
		    /* Check MIME code */
		    if ((c1 = (*i_getc)(f)) == EOF) {
			(*oconv)(0, '=');
			LAST;
		    } else if (c1 == '?') {
			/* =? is mime conversion start sequence */
			if(mime_f == STRICT_MIME) {
			    /* check in real detail */
			    if (mime_begin_strict(f) == EOF)
				LAST;
			    SKIP;
			} else if (mime_begin(f) == EOF)
			    LAST;
			SKIP;
		    } else {
			(*oconv)(0, '=');
			(*i_ungetc)(c1,f);
			SKIP;
		    }
		} else {
		    /* normal ASCII code */
		    SEND;
		}
	    } else if (c1 == SI && (!is_8bit || mime_decode_mode)) {
		shift_mode = 0;
		SKIP;
	    } else if (c1 == SO && (!is_8bit || mime_decode_mode)) {
		shift_mode = 1;
		SKIP;
	    } else if (c1 == ESC && (!is_8bit || mime_decode_mode)) {
		if ((c1 = (*i_getc)(f)) == EOF) {
		    (*oconv)(0, ESC);
		    LAST;
		}
		else if (c1 == '&') {
		    /* IRR */
		    if ((c1 = (*i_getc)(f)) == EOF) {
			LAST;
		    } else {
			SKIP;
		    }
		}
		else if (c1 == '$') {
		    /* GZDMx */
		    if ((c1 = (*i_getc)(f)) == EOF) {
			/* don't send bogus code
			   (*oconv)(0, ESC);
			   (*oconv)(0, '$'); */
			LAST;
		    } else if (c1 == '@' || c1 == 'B') {
			/* JIS X 0208 */
			set_input_mode(JIS_X_0208);
			SKIP;
		    } else if (c1 == '(') {
			/* GZDM4 */
			if ((c1 = (*i_getc)(f)) == EOF) {
			    /* don't send bogus code
			       (*oconv)(0, ESC);
			       (*oconv)(0, '$');
			       (*oconv)(0, '(');
			     */
			    LAST;
			} else if (c1 == '@'|| c1 == 'B') {
			    /* JIS X 0208 */
			    set_input_mode(JIS_X_0208);
			    SKIP;
#ifdef X0212_ENABLE
			} else if (c1 == 'D'){
			    set_input_mode(JIS_X_0212);
			    SKIP;
#endif /* X0212_ENABLE */
			} else if (c1 == 'O' || c1 == 'Q'){
			    set_input_mode(JIS_X_0213_1);
			    SKIP;
			} else if (c1 == 'P'){
			    set_input_mode(JIS_X_0213_2);
			    SKIP;
			} else {
			    /* could be some special code */
			    (*oconv)(0, ESC);
			    (*oconv)(0, '$');
			    (*oconv)(0, '(');
			    (*oconv)(0, c1);
			    SKIP;
			}
		    } else if (broken_f&0x2) {
			/* accept any ESC-(-x as broken code ... */
			input_mode = JIS_X_0208;
			shift_mode = 0;
			SKIP;
		    } else {
			(*oconv)(0, ESC);
			(*oconv)(0, '$');
			(*oconv)(0, c1);
			SKIP;
		    }
		} else if (c1 == '(') {
		    /* GZD4 */
		    if ((c1 = (*i_getc)(f)) == EOF) {
			/* don't send bogus code
			   (*oconv)(0, ESC);
			   (*oconv)(0, '('); */
			LAST;
		    }
		    else if (c1 == 'I') {
			/* JIS X 0201 Katakana */
			set_input_mode(JIS_X_0201_1976_K);
			shift_mode = 1;
			SKIP;
		    }
		    else if (c1 == 'B' || c1 == 'J' || c1 == 'H') {
			/* ISO-646IRV:1983 or JIS X 0201 Roman or JUNET */
			set_input_mode(ASCII);
			SKIP;
		    }
		    else if (broken_f&0x2) {
			set_input_mode(ASCII);
			SKIP;
		    }
		    else {
			(*oconv)(0, ESC);
			(*oconv)(0, '(');
			SEND;
		    }
		}
		else if (c1 == '.') {
		    /* G2D6 */
		    if ((c1 = (*i_getc)(f)) == EOF) {
			LAST;
		    }
		    else if (c1 == 'A') {
			/* ISO-8859-1 */
			g2 = ISO_8859_1;
			SKIP;
		    }
		    else {
			(*oconv)(0, ESC);
			(*oconv)(0, '.');
			SEND;
		    }
		}
		else if (c1 == 'N') {
		    /* SS2 */
		    c1 = (*i_getc)(f);
		    if (g2 == ISO_8859_1) {
			c2 = ISO_8859_1;
			SEND;
		    }else{
			(*i_ungetc)(c1, f);
			/* lonely ESC  */
			(*oconv)(0, ESC);
			SEND;
		    }
		}
		else {
		    i_ungetc(c1,f);
		    /* lonely ESC  */
		    (*oconv)(0, ESC);
		    SKIP;
		}
	    } else if (c1 == ESC && iconv == s_iconv) {
		/* ESC in Shift_JIS */
		if ((c1 = (*i_getc)(f)) == EOF) {
		    (*oconv)(0, ESC);
		    LAST;
		} else if (c1 == '$') {
		    /* J-PHONE emoji */
		    if ((c1 = (*i_getc)(f)) == EOF) {
			LAST;
		    } else if (('E' <= c1 && c1 <= 'G') ||
			       ('O' <= c1 && c1 <= 'Q')) {
			/*
			   NUM : 0 1 2 3 4 5
			   BYTE: G E F O P Q
			   C%7 : 1 6 0 2 3 4
			   C%7 : 0 1 2 3 4 5 6
			   NUM : 2 0 3 4 5 X 1
			 */
			static const nkf_char jphone_emoji_first_table[7] =
			{0xE1E0, 0xDFE0, 0xE2E0, 0xE3E0, 0xE4E0, 0xDFE0, 0xE0E0};
			c3 = nkf_char_unicode_new(jphone_emoji_first_table[c1 % 7]);
			if ((c1 = (*i_getc)(f)) == EOF) LAST;
			while (SP <= c1 && c1 <= 'z') {
			    (*oconv)(0, c1 + c3);
			    if ((c1 = (*i_getc)(f)) == EOF) LAST;
			}
			SKIP;
		    }
		    else {
			(*oconv)(0, ESC);
			(*oconv)(0, '$');
			SEND;
		    }
		}
		else {
		    i_ungetc(c1,f);
		    /* lonely ESC  */
		    (*oconv)(0, ESC);
		    SKIP;
		}
	    } else if (c1 == LF || c1 == CR) {
		if (broken_f&4) {
		    input_mode = ASCII; set_iconv(FALSE, 0);
		    SEND;
		} else if (mime_decode_f && !mime_decode_mode){
		    if (c1 == LF) {
			if ((c1=(*i_getc)(f))!=EOF && c1 == SP) {
			    i_ungetc(SP,f);
			    continue;
			} else {
			    i_ungetc(c1,f);
			}
			c1 = LF;
			SEND;
		    } else  { /* if (c1 == CR)*/
			if ((c1=(*i_getc)(f))!=EOF) {
			    if (c1==SP) {
				i_ungetc(SP,f);
				continue;
			    } else if (c1 == LF && (c1=(*i_getc)(f))!=EOF && c1 == SP) {
				i_ungetc(SP,f);
				continue;
			    } else {
				i_ungetc(c1,f);
			    }
			    i_ungetc(LF,f);
			} else {
			    i_ungetc(c1,f);
			}
			c1 = CR;
			SEND;
		    }
		}
	    } else
		SEND;
	}
	/* send: */
	switch(input_mode){
	case ASCII:
	    switch ((*iconv)(c2, c1, 0)) {  /* can be EUC / SJIS / UTF-8 */
	    case -2:
		/* 4 bytes UTF-8 */
		if ((c3 = (*i_getc)(f)) != EOF) {
		    code_status(c3);
		    c3 <<= 8;
		    if ((c4 = (*i_getc)(f)) != EOF) {
			code_status(c4);
			(*iconv)(c2, c1, c3|c4);
		    }
		}
		break;
	    case -3:
		/* 4 bytes UTF-8 (check combining character) */
		if ((c3 = (*i_getc)(f)) != EOF) {
		    if ((c4 = (*i_getc)(f)) != EOF) {
			if (w_iconv_combine(c2, c1, 0, c3, c4, 0)) {
			    (*i_ungetc)(c4, f);
			    (*i_ungetc)(c3, f);
			    w_iconv_nocombine(c2, c1, 0);
			}
		    } else {
			(*i_ungetc)(c3, f);
			w_iconv_nocombine(c2, c1, 0);
		    }
		} else {
		    w_iconv_nocombine(c2, c1, 0);
		}
		break;
	    case -1:
		/* 3 bytes EUC or UTF-8 */
		if ((c3 = (*i_getc)(f)) != EOF) {
		    code_status(c3);
		    if ((*iconv)(c2, c1, c3) == -3) {
			/* 6 bytes UTF-8 (check combining character) */
			nkf_char c5, c6;
			if ((c4 = (*i_getc)(f)) != EOF) {
			    if ((c5 = (*i_getc)(f)) != EOF) {
				if ((c6 = (*i_getc)(f)) != EOF) {
				    if (w_iconv_combine(c2, c1, c3, c4, c5, c6)) {
					(*i_ungetc)(c6, f);
					(*i_ungetc)(c5, f);
					(*i_ungetc)(c4, f);
					w_iconv_nocombine(c2, c1, c3);
				    }
				} else {
				    (*i_ungetc)(c5, f);
				    (*i_ungetc)(c4, f);
				    w_iconv_nocombine(c2, c1, c3);
				}
			    } else {
				(*i_ungetc)(c4, f);
				w_iconv_nocombine(c2, c1, c3);
			    }
			} else {
			    w_iconv_nocombine(c2, c1, c3);
			}
		    }
		}
		break;
	    }
	    break;
	case JIS_X_0208:
	case JIS_X_0213_1:
	    if (ms_ucs_map_f &&
		0x7F <= c2 && c2 <= 0x92 &&
		0x21 <= c1 && c1 <= 0x7E) {
		/* CP932 UDC */
		c1 = nkf_char_unicode_new((c2 - 0x7F) * 94 + c1 - 0x21 + 0xE000);
		c2 = 0;
	    }
	    (*oconv)(c2, c1); /* this is JIS, not SJIS/EUC case */
	    break;
#ifdef X0212_ENABLE
	case JIS_X_0212:
	    (*oconv)(PREFIX_EUCG3 | c2, c1);
	    break;
#endif /* X0212_ENABLE */
	case JIS_X_0213_2:
	    (*oconv)(PREFIX_EUCG3 | c2, c1);
	    break;
	default:
	    (*oconv)(input_mode, c1);  /* other special case */
	}

	c2 = 0;
	c3 = 0;
	continue;
	/* goto next_word */
    }

finished:
    /* epilogue */
    (*iconv)(EOF, 0, 0);
    if (!input_codename)
    {
	if (is_8bit) {
	    struct input_code *p = input_code_list;
	    struct input_code *result = p;
	    while (p->name){
		if (p->score < result->score) result = p;
		++p;
	    }
	    set_input_codename(result->name);
#ifdef CHECK_OPTION
	    debug(result->name);
#endif
	}
    }
    return 0;
}

/*
 * int options(unsigned char *cp)
 *
 * return values:
 *    0: success
 *   -1: ArgumentError
 */
static int
options(unsigned char *cp)
{
    nkf_char i, j;
    unsigned char *p;
    unsigned char *cp_back = NULL;
    nkf_encoding *enc;

    if (option_mode==1)
	return 0;
    while(*cp && *cp++!='-');
    while (*cp || cp_back) {
	if(!*cp){
	    cp = cp_back;
	    cp_back = NULL;
	    continue;
	}
	p = 0;
	switch (*cp++) {
	case '-':  /* literal options */
	    if (!*cp || *cp == SP) {        /* ignore the rest of arguments */
		option_mode = 1;
		return 0;
	    }
	    for (i=0;i<(int)(sizeof(long_option)/sizeof(long_option[0]));i++) {
		p = (unsigned char *)long_option[i].name;
		for (j=0;*p && *p != '=' && *p == cp[j];p++, j++);
		if (*p == cp[j] || cp[j] == SP){
		    p = &cp[j] + 1;
		    break;
		}
		p = 0;
	    }
	    if (p == 0) {
#if !defined(PERL_XS) && !defined(WIN32DLL)
		fprintf(stderr, "unknown long option: --%s\n", cp);
#endif
		return -1;
	    }
	    while(*cp && *cp != SP && cp++);
	    if (long_option[i].alias[0]){
		cp_back = cp;
		cp = (unsigned char *)long_option[i].alias;
	    }else{
#ifndef PERL_XS
		if (strcmp(long_option[i].name, "help") == 0){
		    usage();
		    exit(EXIT_SUCCESS);
		}
#endif
		if (strcmp(long_option[i].name, "ic=") == 0){
		    enc = nkf_enc_find((char *)p);
		    if (!enc) continue;
		    input_encoding = enc;
		    continue;
		}
		if (strcmp(long_option[i].name, "oc=") == 0){
		    enc = nkf_enc_find((char *)p);
		    /* if (enc <= 0) continue; */
		    if (!enc) continue;
		    output_encoding = enc;
		    continue;
		}
		if (strcmp(long_option[i].name, "guess=") == 0){
		    if (p[0] == '0' || p[0] == '1') {
			guess_f = 1;
		    } else {
			guess_f = 2;
		    }
		    continue;
		}
#ifdef OVERWRITE
		if (strcmp(long_option[i].name, "overwrite") == 0){
		    file_out_f = TRUE;
		    overwrite_f = TRUE;
		    preserve_time_f = TRUE;
		    continue;
		}
		if (strcmp(long_option[i].name, "overwrite=") == 0){
		    file_out_f = TRUE;
		    overwrite_f = TRUE;
		    preserve_time_f = TRUE;
		    backup_f = TRUE;
		    backup_suffix = (char *)p;
		    continue;
		}
		if (strcmp(long_option[i].name, "in-place") == 0){
		    file_out_f = TRUE;
		    overwrite_f = TRUE;
		    preserve_time_f = FALSE;
		    continue;
		}
		if (strcmp(long_option[i].name, "in-place=") == 0){
		    file_out_f = TRUE;
		    overwrite_f = TRUE;
		    preserve_time_f = FALSE;
		    backup_f = TRUE;
		    backup_suffix = (char *)p;
		    continue;
		}
#endif
#ifdef INPUT_OPTION
		if (strcmp(long_option[i].name, "cap-input") == 0){
		    cap_f = TRUE;
		    continue;
		}
		if (strcmp(long_option[i].name, "url-input") == 0){
		    url_f = TRUE;
		    continue;
		}
#endif
#ifdef NUMCHAR_OPTION
		if (strcmp(long_option[i].name, "numchar-input") == 0){
		    numchar_f = TRUE;
		    continue;
		}
#endif
#ifdef CHECK_OPTION
		if (strcmp(long_option[i].name, "no-output") == 0){
		    noout_f = TRUE;
		    continue;
		}
		if (strcmp(long_option[i].name, "debug") == 0){
		    debug_f = TRUE;
		    continue;
		}
#endif
		if (strcmp(long_option[i].name, "cp932") == 0){
#ifdef SHIFTJIS_CP932
		    cp51932_f = TRUE;
		    cp932inv_f = -TRUE;
#endif
#ifdef UTF8_OUTPUT_ENABLE
		    ms_ucs_map_f = UCS_MAP_CP932;
#endif
		    continue;
		}
		if (strcmp(long_option[i].name, "no-cp932") == 0){
#ifdef SHIFTJIS_CP932
		    cp51932_f = FALSE;
		    cp932inv_f = FALSE;
#endif
#ifdef UTF8_OUTPUT_ENABLE
		    ms_ucs_map_f = UCS_MAP_ASCII;
#endif
		    continue;
		}
#ifdef SHIFTJIS_CP932
		if (strcmp(long_option[i].name, "cp932inv") == 0){
		    cp932inv_f = -TRUE;
		    continue;
		}
#endif

#ifdef X0212_ENABLE
		if (strcmp(long_option[i].name, "x0212") == 0){
		    x0212_f = TRUE;
		    continue;
		}
#endif

#ifdef EXEC_IO
		if (strcmp(long_option[i].name, "exec-in") == 0){
		    exec_f = 1;
		    return 0;
		}
		if (strcmp(long_option[i].name, "exec-out") == 0){
		    exec_f = -1;
		    return 0;
		}
#endif
#if defined(UTF8_OUTPUT_ENABLE) && defined(UTF8_INPUT_ENABLE)
		if (strcmp(long_option[i].name, "no-cp932ext") == 0){
		    no_cp932ext_f = TRUE;
		    continue;
		}
		if (strcmp(long_option[i].name, "no-best-fit-chars") == 0){
		    no_best_fit_chars_f = TRUE;
		    continue;
		}
		if (strcmp(long_option[i].name, "fb-skip") == 0){
		    encode_fallback = NULL;
		    continue;
		}
		if (strcmp(long_option[i].name, "fb-html") == 0){
		    encode_fallback = encode_fallback_html;
		    continue;
		}
		if (strcmp(long_option[i].name, "fb-xml") == 0){
		    encode_fallback = encode_fallback_xml;
		    continue;
		}
		if (strcmp(long_option[i].name, "fb-java") == 0){
		    encode_fallback = encode_fallback_java;
		    continue;
		}
		if (strcmp(long_option[i].name, "fb-perl") == 0){
		    encode_fallback = encode_fallback_perl;
		    continue;
		}
		if (strcmp(long_option[i].name, "fb-subchar") == 0){
		    encode_fallback = encode_fallback_subchar;
		    continue;
		}
		if (strcmp(long_option[i].name, "fb-subchar=") == 0){
		    encode_fallback = encode_fallback_subchar;
		    unicode_subchar = 0;
		    if (p[0] != '0'){
			/* decimal number */
			for (i = 0; i < 7 && nkf_isdigit(p[i]); i++){
			    unicode_subchar *= 10;
			    unicode_subchar += hex2bin(p[i]);
			}
		    }else if(p[1] == 'x' || p[1] == 'X'){
			/* hexadecimal number */
			for (i = 2; i < 8 && nkf_isxdigit(p[i]); i++){
			    unicode_subchar <<= 4;
			    unicode_subchar |= hex2bin(p[i]);
			}
		    }else{
			/* octal number */
			for (i = 1; i < 8 && nkf_isoctal(p[i]); i++){
			    unicode_subchar *= 8;
			    unicode_subchar += hex2bin(p[i]);
			}
		    }
		    w16e_conv(unicode_subchar, &i, &j);
		    unicode_subchar = i<<8 | j;
		    continue;
		}
#endif
#ifdef UTF8_OUTPUT_ENABLE
		if (strcmp(long_option[i].name, "ms-ucs-map") == 0){
		    ms_ucs_map_f = UCS_MAP_MS;
		    continue;
		}
#endif
#ifdef UNICODE_NORMALIZATION
		if (strcmp(long_option[i].name, "utf8mac-input") == 0){
		    nfc_f = TRUE;
		    continue;
		}
#endif
		if (strcmp(long_option[i].name, "prefix=") == 0){
		    if (nkf_isgraph(p[0])){
			for (i = 1; nkf_isgraph(p[i]); i++){
			    prefix_table[p[i]] = p[0];
			}
		    }
		    continue;
		}
#if !defined(PERL_XS) && !defined(WIN32DLL)
		fprintf(stderr, "unsupported long option: --%s\n", long_option[i].name);
#endif
		return -1;
	    }
	    continue;
	case 'b':           /* buffered mode */
	    unbuf_f = FALSE;
	    continue;
	case 'u':           /* non bufferd mode */
	    unbuf_f = TRUE;
	    continue;
	case 't':           /* transparent mode */
	    if (*cp=='1') {
		/* alias of -t */
		cp++;
		nop_f = TRUE;
	    } else if (*cp=='2') {
		/*
		 * -t with put/get
		 *
		 * nkf -t2MB hoge.bin | nkf -t2mB | diff -s - hoge.bin
		 *
		 */
		cp++;
		nop_f = 2;
	    } else
		nop_f = TRUE;
	    continue;
	case 'j':           /* JIS output */
	case 'n':
	    output_encoding = nkf_enc_from_index(ISO_2022_JP);
	    continue;
	case 'e':           /* AT&T EUC output */
	    output_encoding = nkf_enc_from_index(EUCJP_NKF);
	    continue;
	case 's':           /* SJIS output */
	    output_encoding = nkf_enc_from_index(SHIFT_JIS);
	    continue;
	case 'l':           /* ISO8859 Latin-1 support, no conversion */
	    iso8859_f = TRUE;  /* Only compatible with ISO-2022-JP */
	    input_encoding = nkf_enc_from_index(ISO_8859_1);
	    continue;
	case 'i':           /* Kanji IN ESC-$-@/B */
	    if (*cp=='@'||*cp=='B')
		kanji_intro = *cp++;
	    continue;
	case 'o':           /* ASCII IN ESC-(-J/B/H */
	    /* ESC ( H was used in initial JUNET messages */
	    if (*cp=='J'||*cp=='B'||*cp=='H')
		ascii_intro = *cp++;
	    continue;
	case 'h':
	    /*
	       bit:1   katakana->hiragana
	       bit:2   hiragana->katakana
	     */
	    if ('9'>= *cp && *cp>='0')
		hira_f |= (*cp++ -'0');
	    else
		hira_f |= 1;
	    continue;
	case 'r':
	    rot_f = TRUE;
	    continue;
#if defined(MSDOS) || defined(__OS2__)
	case 'T':
	    binmode_f = FALSE;
	    continue;
#endif
#ifndef PERL_XS
	case 'V':
	    show_configuration();
	    exit(EXIT_SUCCESS);
	    break;
	case 'v':
	    version();
	    exit(EXIT_SUCCESS);
	    break;
#endif
#ifdef UTF8_OUTPUT_ENABLE
	case 'w':           /* UTF-{8,16,32} output */
	    if (cp[0] == '8') {
		cp++;
		if (cp[0] == '0'){
		    cp++;
		    output_encoding = nkf_enc_from_index(UTF_8N);
		} else {
		    output_bom_f = TRUE;
		    output_encoding = nkf_enc_from_index(UTF_8_BOM);
		}
	    } else {
		int enc_idx;
		if ('1'== cp[0] && '6'==cp[1]) {
		    cp += 2;
		    enc_idx = UTF_16;
		} else if ('3'== cp[0] && '2'==cp[1]) {
		    cp += 2;
		    enc_idx = UTF_32;
		} else {
		    output_encoding = nkf_enc_from_index(UTF_8);
		    continue;
		}
		if (cp[0]=='L') {
		    cp++;
		    output_endian = ENDIAN_LITTLE;
		    output_bom_f = TRUE;
		} else if (cp[0] == 'B') {
		    cp++;
		    output_bom_f = TRUE;
		}
		if (cp[0] == '0'){
		    output_bom_f = FALSE;
		    cp++;
		    enc_idx = enc_idx == UTF_16
			? (output_endian == ENDIAN_LITTLE ? UTF_16LE : UTF_16BE)
			: (output_endian == ENDIAN_LITTLE ? UTF_32LE : UTF_32BE);
		} else {
		    enc_idx = enc_idx == UTF_16
			? (output_endian == ENDIAN_LITTLE ? UTF_16LE_BOM : UTF_16BE_BOM)
			: (output_endian == ENDIAN_LITTLE ? UTF_32LE_BOM : UTF_32BE_BOM);
		}
		output_encoding = nkf_enc_from_index(enc_idx);
	    }
	    continue;
#endif
#ifdef UTF8_INPUT_ENABLE
	case 'W':           /* UTF input */
	    if (cp[0] == '8') {
		cp++;
		input_encoding = nkf_enc_from_index(UTF_8);
	    }else{
		int enc_idx;
		if ('1'== cp[0] && '6'==cp[1]) {
		    cp += 2;
		    input_endian = ENDIAN_BIG;
		    enc_idx = UTF_16;
		} else if ('3'== cp[0] && '2'==cp[1]) {
		    cp += 2;
		    input_endian = ENDIAN_BIG;
		    enc_idx = UTF_32;
		} else {
		    input_encoding = nkf_enc_from_index(UTF_8);
		    continue;
		}
		if (cp[0]=='L') {
		    cp++;
		    input_endian = ENDIAN_LITTLE;
		} else if (cp[0] == 'B') {
		    cp++;
		    input_endian = ENDIAN_BIG;
		}
		enc_idx = (enc_idx == UTF_16
		    ? (input_endian == ENDIAN_LITTLE ? UTF_16LE : UTF_16BE)
		    : (input_endian == ENDIAN_LITTLE ? UTF_32LE : UTF_32BE));
		input_encoding = nkf_enc_from_index(enc_idx);
	    }
	    continue;
#endif
	    /* Input code assumption */
	case 'J':   /* ISO-2022-JP input */
	    input_encoding = nkf_enc_from_index(ISO_2022_JP);
	    continue;
	case 'E':   /* EUC-JP input */
	    input_encoding = nkf_enc_from_index(EUCJP_NKF);
	    continue;
	case 'S':   /* Shift_JIS input */
	    input_encoding = nkf_enc_from_index(SHIFT_JIS);
	    continue;
	case 'Z':   /* Convert X0208 alphabet to ascii */
	    /* alpha_f
	       bit:0   Convert JIS X 0208 Alphabet to ASCII
	       bit:1   Convert Kankaku to one space
	       bit:2   Convert Kankaku to two spaces
	       bit:3   Convert HTML Entity
	       bit:4   Convert JIS X 0208 Katakana to JIS X 0201 Katakana
	     */
	    while ('0'<= *cp && *cp <='4') {
		alpha_f |= 1 << (*cp++ - '0');
	    }
	    alpha_f |= 1;
	    continue;
	case 'x':   /* Convert X0201 kana to X0208 or X0201 Conversion */
	    x0201_f = FALSE;    /* No X0201->X0208 conversion */
	    /* accept  X0201
	       ESC-(-I     in JIS, EUC, MS Kanji
	       SI/SO       in JIS, EUC, MS Kanji
	       SS2         in EUC, JIS, not in MS Kanji
	       MS Kanji (0xa0-0xdf)
	       output  X0201
	       ESC-(-I     in JIS (0x20-0x5f)
	       SS2         in EUC (0xa0-0xdf)
	       0xa0-0xd    in MS Kanji (0xa0-0xdf)
	     */
	    continue;
	case 'X':   /* Convert X0201 kana to X0208 */
	    x0201_f = TRUE;
	    continue;
	case 'F':   /* prserve new lines */
	    fold_preserve_f = TRUE;
	case 'f':   /* folding -f60 or -f */
	    fold_f = TRUE;
	    fold_len = 0;
	    while('0'<= *cp && *cp <='9') { /* we don't use atoi here */
		fold_len *= 10;
		fold_len += *cp++ - '0';
	    }
	    if (!(0<fold_len && fold_len<BUFSIZ))
		fold_len = DEFAULT_FOLD;
	    if (*cp=='-') {
		fold_margin = 0;
		cp++;
		while('0'<= *cp && *cp <='9') { /* we don't use atoi here */
		    fold_margin *= 10;
		    fold_margin += *cp++ - '0';
		}
	    }
	    continue;
	case 'm':   /* MIME support */
	    /* mime_decode_f = TRUE; */ /* this has too large side effects... */
	    if (*cp=='B'||*cp=='Q') {
		mime_decode_mode = *cp++;
		mimebuf_f = FIXED_MIME;
	    } else if (*cp=='N') {
		mime_f = TRUE; cp++;
	    } else if (*cp=='S') {
		mime_f = STRICT_MIME; cp++;
	    } else if (*cp=='0') {
		mime_decode_f = FALSE;
		mime_f = FALSE; cp++;
	    } else {
		mime_f = STRICT_MIME;
	    }
	    continue;
	case 'M':   /* MIME output */
	    if (*cp=='B') {
		mimeout_mode = 'B';
		mimeout_f = FIXED_MIME; cp++;
	    } else if (*cp=='Q') {
		mimeout_mode = 'Q';
		mimeout_f = FIXED_MIME; cp++;
	    } else {
		mimeout_f = TRUE;
	    }
	    continue;
	case 'B':   /* Broken JIS support */
	    /*  bit:0   no ESC JIS
	       bit:1   allow any x on ESC-(-x or ESC-$-x
	       bit:2   reset to ascii on NL
	     */
	    if ('9'>= *cp && *cp>='0')
		broken_f |= 1<<(*cp++ -'0');
	    else
		broken_f |= TRUE;
	    continue;
#ifndef PERL_XS
	case 'O':/* for Output file */
	    file_out_f = TRUE;
	    continue;
#endif
	case 'c':/* add cr code */
	    eolmode_f = CRLF;
	    continue;
	case 'd':/* delete cr code */
	    eolmode_f = LF;
	    continue;
	case 'I':   /* ISO-2022-JP output */
	    iso2022jp_f = TRUE;
	    continue;
	case 'L':  /* line mode */
	    if (*cp=='u') {         /* unix */
		eolmode_f = LF; cp++;
	    } else if (*cp=='m') { /* mac */
		eolmode_f = CR; cp++;
	    } else if (*cp=='w') { /* windows */
		eolmode_f = CRLF; cp++;
	    } else if (*cp=='0') { /* no conversion  */
		eolmode_f = 0; cp++;
	    }
	    continue;
#ifndef PERL_XS
	case 'g':
	    if ('2' <= *cp && *cp <= '9') {
		guess_f = 2;
		cp++;
	    } else if (*cp == '0' || *cp == '1') {
		guess_f = 1;
		cp++;
	    } else {
		guess_f = 1;
	    }
	    continue;
#endif
	case SP:
	    /* module multiple options in a string are allowed for Perl module  */
	    while(*cp && *cp++!='-');
	    continue;
	default:
#if !defined(PERL_XS) && !defined(WIN32DLL)
	    fprintf(stderr, "unknown option: -%c\n", *(cp-1));
#endif
	    /* bogus option but ignored */
	    return -1;
	}
    }
    return 0;
}

#ifdef WIN32DLL
#include "nkf32dll.c"
#elif defined(PERL_XS)
#else /* WIN32DLL */
int
main(int argc, char **argv)
{
    FILE  *fin;
    unsigned char  *cp;

    char *outfname = NULL;
    char *origfname;

#ifdef EASYWIN /*Easy Win */
    _BufferSize.y = 400;/*Set Scroll Buffer Size*/
#endif
#ifdef DEFAULT_CODE_LOCALE
    setlocale(LC_CTYPE, "");
#endif
    nkf_state_init();

    for (argc--,argv++; (argc > 0) && **argv == '-'; argc--, argv++) {
	cp = (unsigned char *)*argv;
	options(cp);
#ifdef EXEC_IO
	if (exec_f){
	    int fds[2], pid;
	    if (pipe(fds) < 0 || (pid = fork()) < 0){
		abort();
	    }
	    if (pid == 0){
		if (exec_f > 0){
		    close(fds[0]);
		    dup2(fds[1], 1);
		}else{
		    close(fds[1]);
		    dup2(fds[0], 0);
		}
		execvp(argv[1], &argv[1]);
	    }
	    if (exec_f > 0){
		close(fds[1]);
		dup2(fds[0], 0);
	    }else{
		close(fds[0]);
		dup2(fds[1], 1);
	    }
	    argc = 0;
	    break;
	}
#endif
    }

    if (guess_f) {
#ifdef CHECK_OPTION
	int debug_f_back = debug_f;
#endif
#ifdef EXEC_IO
	int exec_f_back = exec_f;
#endif
#ifdef X0212_ENABLE
	int x0212_f_back = x0212_f;
#endif
	int x0213_f_back = x0213_f;
	int guess_f_back = guess_f;
	reinit();
	guess_f = guess_f_back;
	mime_f = FALSE;
#ifdef CHECK_OPTION
	debug_f = debug_f_back;
#endif
#ifdef EXEC_IO
	exec_f = exec_f_back;
#endif
	x0212_f = x0212_f_back;
	x0213_f = x0213_f_back;
    }

    if (binmode_f == TRUE)
#if defined(__OS2__) && (defined(__IBMC__) || defined(__IBMCPP__))
	if (freopen("","wb",stdout) == NULL)
	    return (-1);
#else
    setbinmode(stdout);
#endif

    if (unbuf_f)
	setbuf(stdout, (char *) NULL);
    else
	setvbuffer(stdout, (char *) stdobuf, IOBUF_SIZE);

    if (argc == 0) {
	if (binmode_f == TRUE)
#if defined(__OS2__) && (defined(__IBMC__) || defined(__IBMCPP__))
	    if (freopen("","rb",stdin) == NULL) return (-1);
#else
	setbinmode(stdin);
#endif
	setvbuffer(stdin, (char *) stdibuf, IOBUF_SIZE);
	if (nop_f)
	    noconvert(stdin);
	else {
	    kanji_convert(stdin);
	    if (guess_f) print_guessed_code(NULL);
	}
    } else {
	int nfiles = argc;
	int is_argument_error = FALSE;
	while (argc--) {
	    input_codename = NULL;
	    input_eol = 0;
#ifdef CHECK_OPTION
	    iconv_for_check = 0;
#endif
	    if ((fin = fopen((origfname = *argv++), "r")) == NULL) {
		perror(*(argv-1));
		is_argument_error = TRUE;
		continue;
	    } else {
#ifdef OVERWRITE
		int fd = 0;
		int fd_backup = 0;
#endif

		/* reopen file for stdout */
		if (file_out_f == TRUE) {
#ifdef OVERWRITE
		    if (overwrite_f){
			outfname = nkf_xmalloc(strlen(origfname)
					  + strlen(".nkftmpXXXXXX")
					  + 1);
			strcpy(outfname, origfname);
#ifdef MSDOS
			{
			    int i;
			    for (i = strlen(outfname); i; --i){
				if (outfname[i - 1] == '/'
				    || outfname[i - 1] == '\\'){
				    break;
				}
			    }
			    outfname[i] = '\0';
			}
			strcat(outfname, "ntXXXXXX");
			mktemp(outfname);
			fd = open(outfname, O_WRONLY | O_CREAT | O_TRUNC | O_EXCL,
				  S_IREAD | S_IWRITE);
#else
			strcat(outfname, ".nkftmpXXXXXX");
			fd = mkstemp(outfname);
#endif
			if (fd < 0
			    || (fd_backup = dup(fileno(stdout))) < 0
			    || dup2(fd, fileno(stdout)) < 0
			   ){
			    perror(origfname);
			    return -1;
			}
		    }else
#endif
		    if(argc == 1) {
			outfname = *argv++;
			argc--;
		    } else {
			outfname = "nkf.out";
		    }

		    if(freopen(outfname, "w", stdout) == NULL) {
			perror (outfname);
			return (-1);
		    }
		    if (binmode_f == TRUE) {
#if defined(__OS2__) && (defined(__IBMC__) || defined(__IBMCPP__))
			if (freopen("","wb",stdout) == NULL)
			    return (-1);
#else
			setbinmode(stdout);
#endif
		    }
		}
		if (binmode_f == TRUE)
#if defined(__OS2__) && (defined(__IBMC__) || defined(__IBMCPP__))
		    if (freopen("","rb",fin) == NULL)
			return (-1);
#else
		setbinmode(fin);
#endif
		setvbuffer(fin, (char *) stdibuf, IOBUF_SIZE);
		if (nop_f)
		    noconvert(fin);
		else {
		    char *filename = NULL;
		    kanji_convert(fin);
		    if (nfiles > 1) filename = origfname;
		    if (guess_f) print_guessed_code(filename);
		}
		fclose(fin);
#ifdef OVERWRITE
		if (overwrite_f) {
		    struct stat     sb;
#if defined(MSDOS) && !defined(__MINGW32__) && !defined(__WIN32__) && !defined(__WATCOMC__) && !defined(__EMX__) && !defined(__OS2__) && !defined(__DJGPP__)
		    time_t tb[2];
#else
		    struct utimbuf  tb;
#endif

		    fflush(stdout);
		    close(fd);
		    if (dup2(fd_backup, fileno(stdout)) < 0){
			perror("dup2");
		    }
		    if (stat(origfname, &sb)) {
			fprintf(stderr, "Can't stat %s\n", origfname);
		    }
		    /* パーミッションを復元 */
		    if (chmod(outfname, sb.st_mode)) {
			fprintf(stderr, "Can't set permission %s\n", outfname);
		    }

		    /* タイムスタンプを復元 */
		    if(preserve_time_f){
#if defined(MSDOS) && !defined(__MINGW32__) && !defined(__WIN32__) && !defined(__WATCOMC__) && !defined(__EMX__) && !defined(__OS2__) && !defined(__DJGPP__)
			tb[0] = tb[1] = sb.st_mtime;
			if (utime(outfname, tb)) {
			    fprintf(stderr, "Can't set timestamp %s\n", outfname);
			}
#else
			tb.actime  = sb.st_atime;
			tb.modtime = sb.st_mtime;
			if (utime(outfname, &tb)) {
			    fprintf(stderr, "Can't set timestamp %s\n", outfname);
			}
#endif
		    }
		    if(backup_f){
			char *backup_filename = get_backup_filename(backup_suffix, origfname);
#ifdef MSDOS
			unlink(backup_filename);
#endif
			if (rename(origfname, backup_filename)) {
			    perror(backup_filename);
			    fprintf(stderr, "Can't rename %s to %s\n",
				    origfname, backup_filename);
			}
			nkf_xfree(backup_filename);
		    }else{
#ifdef MSDOS
			if (unlink(origfname)){
			    perror(origfname);
			}
#endif
		    }
		    if (rename(outfname, origfname)) {
			perror(origfname);
			fprintf(stderr, "Can't rename %s to %s\n",
				outfname, origfname);
		    }
		    nkf_xfree(outfname);
		}
#endif
	    }
	}
	if (is_argument_error)
	    return(-1);
    }
#ifdef EASYWIN /*Easy Win */
    if (file_out_f == FALSE)
	scanf("%d",&end_check);
    else
	fclose(stdout);
#else /* for Other OS */
    if (file_out_f == TRUE)
	fclose(stdout);
#endif /*Easy Win */
    return (0);
}
#endif /* WIN32DLL */
