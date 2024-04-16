#ifndef _CONFIG_H_
#define _CONFIG_H_

/* UTF8 input and output */
#define UTF8_INPUT_ENABLE
#define UTF8_OUTPUT_ENABLE

/* invert characters invalid in Shift_JIS to CP932 */
#define SHIFTJIS_CP932

/* fix input encoding when given by option */
#define INPUT_CODE_FIX

/* --overwrite option */
/* by Satoru Takabayashi <ccsatoru@vega.aichi-u.ac.jp> */
#define OVERWRITE

/* --cap-input, --url-input option */
#define INPUT_OPTION

/* --numchar-input option */
#define NUMCHAR_OPTION

/* --debug, --no-output option */
#define CHECK_OPTION

/* JIS X0212 */
#define X0212_ENABLE

/* --exec-in, --exec-out option
 * require pipe, fork, execvp and so on.
 * please undef this on MS-DOS, MinGW
 * this is still buggy around child process
 */
/* #define EXEC_IO */

/* Unicode Normalization */
#define UNICODE_NORMALIZATION

/*
 * Select Default Output Encoding
 *
 */

/* #define DEFAULT_CODE_JIS    */
/* #define DEFAULT_CODE_SJIS   */
/* #define DEFAULT_CODE_WINDOWS_31J */
/* #define DEFAULT_CODE_EUC    */
/* #define DEFAULT_CODE_UTF8   */

#endif /* _CONFIG_H_ */
