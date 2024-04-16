/***** BEGIN LICENSE BLOCK *****
 * Version: EPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Eclipse Public
 * License Version 2.0 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of
 * the License at http://www.eclipse.org/legal/epl-v20.html
 *
 * Software distributed under the License is distributed on an "AS
 * IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * rights and limitations under the License.
 *
 * Copyright (C) 2007-2011 Koichiro Ohba <koichiro@meadowy.org>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the LGPL, and not to allow others to
 * use your version of this file under the terms of the EPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the EPL, the LGPL.
 ***** END LICENSE BLOCK *****/

package org.jruby.ext.nkf;

import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.CharsetEncoder;
import java.nio.charset.UnsupportedCharsetException;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

import org.jcodings.Encoding;
import org.jcodings.specific.ASCIIEncoding;
import org.jcodings.specific.UTF8Encoding;
import org.jcodings.transcode.EConv;
import org.jcodings.transcode.EConvFlags;
import org.jruby.Ruby;
import org.jruby.RubyArray;
import org.jruby.RubyModule;
import org.jruby.RubyString;

import org.jruby.anno.JRubyMethod;
import org.jruby.anno.JRubyModule;
import org.jruby.runtime.Helpers;
import org.jruby.runtime.ThreadContext;
import org.jruby.runtime.builtin.IRubyObject;
import org.jruby.util.ByteList;
import org.jruby.util.KCode;
import org.jruby.util.Pack;
import org.jruby.util.io.EncodingUtils;

@JRubyModule(name="NKF")
public class RubyNKF {
    public static enum NKFCharset {
        AUTO(0, "x-JISAutoDetect"),
        // no ISO-2022-JP in jcodings
        JIS(1, "ISO-2022-JP"),
        EUC(2, "EUC-JP"),
        SJIS(3, "Shift_JIS"),
        BINARY(4, null),
        NOCONV(4, null),
        UNKNOWN(0, null),
        ASCII(5, "iso-8859-1"),
        UTF8(6, "UTF-8"),
        UTF16(8, "UTF-16"),
        UTF32(12, "UTF-32"),
        OTHER(16, null),
        BASE64(20, "base64"),
        QENCODE(21, "qencode"),
        MIME_DETECT(22, "MimeAutoDetect");

        private NKFCharset(int value, String charset) {
            this.value = value;
            this.charset = charset;
        }

        public int getValue() {
            return value;
        }

        public String getCharset() {
            return charset;
        }

        private final int value;
        private final String charset;
    }

    private static final ByteList BEGIN_MIME_STRING = new ByteList(ByteList.plain("=?"));
    private static final ByteList END_MIME_STRING = new ByteList(ByteList.plain("?="));
    private static final ByteList PACK_BASE64 = new ByteList(ByteList.plain("m"));
    private static final ByteList PACK_QENCODE = new ByteList(ByteList.plain("M"));

    public static final Map<Integer, String> NKFCharsetMap = new HashMap<Integer, String>(20, 1);

    public static void load(Ruby runtime) {
        createNKF(runtime);
    }

    public static void createNKF(Ruby runtime) {
        final RubyModule NKF = runtime.defineModule("NKF");
        final String version = "2.1.2";
        final String relDate = "2011-09-08";

        NKF.defineConstant("NKF_VERSION", runtime.newString(version));
        NKF.defineConstant("NKF_RELEASE_DATE", runtime.newString(relDate));
        NKF.defineConstant("VERSION", runtime.newString(version + ' ' + '(' + "JRuby" + '_' + relDate + ')'));

        for ( NKFCharset charset : NKFCharset.values() ) {
            NKFCharsetMap.put(charset.value, charset.name());

            if (charset.value > 12 ) continue;
            NKF.defineConstant(charset.name(), charsetMappedValue(runtime, charset));
        }

        NKF.defineAnnotatedMethods(RubyNKF.class);
    }

    @JRubyMethod(name = "guess", module = true)
    public static IRubyObject guess(ThreadContext context, IRubyObject recv, IRubyObject s) {
        return charsetMappedValue(context.runtime, guess(context, s));
    }

    public static NKFCharset guess(ThreadContext context, IRubyObject s) {
        // TODO: Fix charset usage for JRUBY-4553
        Ruby runtime = context.runtime;
        if (!s.respondsTo("to_str")) {
            throw runtime.newTypeError("can't convert " + s.getMetaClass() + " into String");
        }
        ByteList bytes = s.convertToString().getByteList();
        ByteBuffer buf = ByteBuffer.wrap(bytes.getUnsafeBytes(), bytes.begin(), bytes.length());
        CharsetDecoder decoder;
        try {
            decoder = Charset.forName("x-JISAutoDetect").newDecoder();
        } catch (UnsupportedCharsetException e) {
            throw runtime.newStandardError("charsets.jar is required to use NKF#guess. Please install JRE which supports m17n.");
        }
        try {
            decoder.decode(buf);

            if ( ! decoder.isCharsetDetected() ) {
                return NKFCharset.UNKNOWN;
            }
            Charset charset = decoder.detectedCharset();
            String name = charset.name();
            if ("Shift_JIS".equals(name)) {
                return NKFCharset.SJIS;
            }
            if ("Windows-31j".equalsIgnoreCase(name)) {
                return NKFCharset.JIS;
            }
            if ("EUC-JP".equals(name)) {
                return NKFCharset.EUC;
            }
            if ("ISO-2022-JP".equals(name)) {
                return NKFCharset.JIS;
            }
        }
        catch (CharacterCodingException e) {
            // fall through and try direct encoding
        }

        if (bytes.getEncoding() == UTF8Encoding.INSTANCE) {
            return NKFCharset.UTF8;
        }
        if (bytes.getEncoding().toString().startsWith("UTF-16")) {
            return NKFCharset.UTF16;
        }
        if (bytes.getEncoding().toString().startsWith("UTF-32")) {
            return NKFCharset.UTF32;
        }
        return NKFCharset.UNKNOWN;
    }

    private static IRubyObject charsetMappedValue(final Ruby runtime, final NKFCharset charset) {
        final Encoding encoding;
        switch (charset) {
            case AUTO: case NOCONV: case UNKNOWN: return runtime.getNil();
            case BINARY:
                encoding = runtime.getEncodingService().getAscii8bitEncoding();
                return runtime.getEncodingService().convertEncodingToRubyEncoding(encoding);
        }

        encoding = runtime.getEncodingService().getEncodingFromString(charset.getCharset());
        return runtime.getEncodingService().convertEncodingToRubyEncoding(encoding);
    }

    @JRubyMethod(name = "guess1", module = true)
    public static IRubyObject guess1(ThreadContext context, IRubyObject recv, IRubyObject str) {
        return guess(context, recv, str);
    }

    @JRubyMethod(name = "guess2", module = true)
    public static IRubyObject guess2(ThreadContext context, IRubyObject recv, IRubyObject str) {
        return guess(context, recv, str);
    }

    @JRubyMethod(name = "nkf", module = true)
    public static IRubyObject nkf(ThreadContext context, IRubyObject recv, IRubyObject opt, IRubyObject str) {
        Ruby runtime = context.runtime;

        if (!opt.respondsTo("to_str")) {
            throw runtime.newTypeError("can't convert " + opt.getMetaClass() + " into String");
        }

        if (!str.respondsTo("to_str")) {
            throw runtime.newTypeError("can't convert " + str.getMetaClass() + " into String");
        }

        Map<String, NKFCharset> options = parseOpt(opt.convertToString().toString());

        if (options.get("input").getValue() == NKFCharset.AUTO.getValue()) {
            options.put("input", guess(context, str));
        }

        ByteList bstr = str.convertToString().getByteList();
        final Converter converter;
        if (Converter.isMimeText(bstr, options)) {
            converter = new MimeConverter(context, options);
        } else {
            converter = new DefaultConverter(context, options);
        }

        RubyString result = converter.convert(bstr);

        if (options.get("mime-encode") == NKFCharset.BASE64) {
            result = Converter.encodeMimeString(runtime, result, PACK_BASE64);
        } else if (options.get("mime-encode") == NKFCharset.QENCODE) {
            result = Converter.encodeMimeString(runtime, result, PACK_QENCODE);
        }

        return result;
    }

    public static Command parseOption(String s) {
        Options options = new Options();
        options.addOption("b");
        options.addOption("u");
        options.addOption("j", "jis");
        options.addOption("s", "sjis");
        options.addOption("e", "euc");
        options.addOption("w", null, "[0-9][0-9]");
        options.addOption("J", "jis-input");
        options.addOption("S", "sjis-input");
        options.addOption("E", "euc-input");
        options.addOption("W", null, "[0-9][0-9]");
        options.addOption("t");
        options.addOption("i_");
        options.addOption("o_");
        options.addOption("r");
        options.addOption("h1", "hiragana");
        options.addOption("h2", "katakana");
        options.addOption("h3", "katakana-hiragana");
        options.addOption("T");
        options.addOption("l");
        options.addOption("f", null, "[0-9]+-[0-9]*");
        options.addOption("F");
        options.addOption("Z", null, "[0-3]");
        options.addOption("X");
        options.addOption("x");
        options.addOption("B", null, "[0-2]");
        options.addOption("I");
        options.addOption("L", null, "[uwm]");
        options.addOption("d");
        options.addOption("c");
        options.addOption("m", null, "[BQN0]");
        options.addOption("M", null, "[BQ]");
        options.addOption(null, "fj");
        options.addOption(null, "unix");
        options.addOption(null, "mac");
        options.addOption(null, "msdos");
        options.addOption(null, "windows");
        options.addOption(null, "mime");
        options.addOption(null, "base64");
        options.addOption(null, "mime-input");
        options.addOption(null, "base64-input");
        options.addOption(null, "ic", "ic=(.*)");
        options.addOption(null, "oc", "oc=(.*)");
        options.addOption(null, "fb-skip");
        options.addOption(null, "fb-html");
        options.addOption(null, "fb-xml");
        options.addOption(null, "fb-perl");
        options.addOption(null, "fb-java");
        options.addOption(null, "fb-subchar", "fb-subchar=(.*)");
        options.addOption(null, "no-cp932ext");
        options.addOption(null, "cap-input");
        options.addOption(null, "url-input");
        options.addOption(null, "numchar-input");
        options.addOption(null, "no-best-fit-chars");

        CommandParser parser = new CommandParser();
        Command cmd = parser.parse(options, s);
        return cmd;
    }

    private static Map<String, NKFCharset> parseOpt(String s) {
        Map<String, NKFCharset> options = new HashMap<String, NKFCharset>();

        // default options
        options.put("input", NKFCharset.AUTO);
        options.put("output", NKFCharset.JIS);
        options.put("mime-decode", NKFCharset.MIME_DETECT);
        options.put("mime-encode", NKFCharset.NOCONV);

        Command cmd = parseOption(s);
        if (cmd.hasOption("j")) {
            options.put("output", NKFCharset.JIS);
        }
        if (cmd.hasOption("s")) {
            options.put("output", NKFCharset.SJIS);
        }
        if (cmd.hasOption("e")) {
            options.put("output", NKFCharset.EUC);
        }
        if (cmd.hasOption("w")) {
            Option opt = cmd.getOption("w");
            if ("32".equals(opt.getValue())) {
                options.put("output", NKFCharset.UTF32);
            } else if("16".equals(opt.getValue())) {
                options.put("output", NKFCharset.UTF16);
            } else {
                options.put("output", NKFCharset.UTF8);
            }
        }
        if (cmd.hasOption("J")) {
            options.put("input", NKFCharset.JIS);
        }
        if (cmd.hasOption("S")) {
            options.put("input", NKFCharset.SJIS);
        }
        if (cmd.hasOption("E")) {
            options.put("input", NKFCharset.EUC);
        }
        if (cmd.hasOption("W")) {
            Option opt = cmd.getOption("W");
            if ("32".equals(opt.getValue())) {
                options.put("input", NKFCharset.UTF32);
            } else if("16".equals(opt.getValue())) {
                options.put("input", NKFCharset.UTF16);
            } else {
                options.put("input", NKFCharset.UTF8);
            }
        }
        if (cmd.hasOption("m")) {
            Option opt = cmd.getOption("m");
            if (opt.getValue() == null) {
                options.put("mime-decode", NKFCharset.MIME_DETECT);
            } else if ("B".equals(opt.getValue())) {
                options.put("mime-decode", NKFCharset.BASE64);
            } else if ("Q".equals(opt.getValue())) {
                options.put("mime-decode", NKFCharset.QENCODE);
            } else if ("N".equals(opt.getValue())) {
                // TODO: non-strict option
            } else if ("0".equals(opt.getValue())) {
                options.put("mime-decode", NKFCharset.NOCONV);
            }
        }
        if (cmd.hasOption("M")) {
            Option opt = cmd.getOption("M");
            if (opt.getValue() == null) {
                options.put("mime-encode", NKFCharset.NOCONV);
            } else if ("B".equals(opt.getValue())) {
                options.put("mime-encode", NKFCharset.BASE64);
            } else if ("Q".equals(opt.getValue())) {
                options.put("mime-encode", NKFCharset.QENCODE);
            }
        }
        if (cmd.hasOption("base64")) {
            options.put("mime-encode", NKFCharset.BASE64);
        }
        if (cmd.hasOption("oc")) {
            Option opt = cmd.getOption("oc");
            if ("ISO-2022-JP".compareToIgnoreCase(opt.getValue()) == 0) {
                options.put("output", NKFCharset.JIS);
            } else if ("EUC-JP".compareToIgnoreCase(opt.getValue()) == 0) {
                options.put("output", NKFCharset.EUC);
            } else if ("CP932".compareToIgnoreCase(opt.getValue()) == 0) {
                options.put("output", NKFCharset.SJIS);
            } else if ("Shift_JIS".compareToIgnoreCase(opt.getValue()) == 0) {
                options.put("output", NKFCharset.SJIS);
            } else if ("Windows-31J".compareToIgnoreCase(opt.getValue()) == 0) {
                options.put("output", NKFCharset.JIS);
            } else if ("UTF-8".compareToIgnoreCase(opt.getValue()) == 0) {
                options.put("output", NKFCharset.UTF8);
            } else if ("UTF-8N".compareToIgnoreCase(opt.getValue()) == 0) {
                options.put("output", NKFCharset.UTF8);
            } else if ("UTF-16".compareToIgnoreCase(opt.getValue()) == 0) {
                options.put("output", NKFCharset.UTF16);
            } else if ("UTF-16BE-BOM".compareToIgnoreCase(opt.getValue()) == 0) {
                options.put("output", NKFCharset.UTF16);
            } else if ("UTF-32".compareToIgnoreCase(opt.getValue()) == 0) {
                options.put("output", NKFCharset.UTF32);
            } else if ("UTF-32BE-BOM".compareToIgnoreCase(opt.getValue()) == 0) {
                options.put("output", NKFCharset.UTF32);
            }
        }
        if (cmd.hasOption("ic")) {
            Option opt = cmd.getOption("ic");
            if ("ISO-2022-JP".compareToIgnoreCase(opt.getValue()) == 0) {
                options.put("input", NKFCharset.JIS);
            } else if ("EUC-JP".compareToIgnoreCase(opt.getValue()) == 0) {
                options.put("input", NKFCharset.EUC);
            } else if ("CP932".compareToIgnoreCase(opt.getValue()) == 0) {
                options.put("input", NKFCharset.SJIS);
            } else if ("Shift_JIS".compareToIgnoreCase(opt.getValue()) == 0) {
                options.put("input", NKFCharset.SJIS);
            } else if ("Windows-31J".compareToIgnoreCase(opt.getValue()) == 0) {
                options.put("input", NKFCharset.SJIS);
            } else if ("UTF-8".compareToIgnoreCase(opt.getValue()) == 0) {
                options.put("input", NKFCharset.UTF8);
            } else if ("UTF-8N".compareToIgnoreCase(opt.getValue()) == 0) {
                options.put("input", NKFCharset.UTF8);
            } else if ("UTF-16".compareToIgnoreCase(opt.getValue()) == 0) {
                options.put("input", NKFCharset.UTF16);
            } else if ("UTF-16BE-BOM".compareToIgnoreCase(opt.getValue()) == 0) {
                options.put("input", NKFCharset.UTF16);
            } else if ("UTF-32".compareToIgnoreCase(opt.getValue()) == 0) {
                options.put("input", NKFCharset.UTF32);
            } else if ("UTF-32BE-BOM".compareToIgnoreCase(opt.getValue()) == 0) {
                options.put("input", NKFCharset.UTF32);
            }
        }

        return options;
    }

    static abstract class Converter {

        protected final ThreadContext context;
        protected final Map<String, NKFCharset> options;

        public Converter(ThreadContext ctx, Map<String, NKFCharset> opt) {
            context = ctx;
            options = opt;
        }

        static boolean isMimeText(ByteList str, Map<String, NKFCharset> options) {
            if (str.length() <= 6) {
                return false;
            }
            if (options.get("mime-decode") == NKFCharset.NOCONV) {
                return false;
            }
            if (str.indexOf(BEGIN_MIME_STRING) < 0) {
                return false;
            }
            if (str.lastIndexOf(END_MIME_STRING) < 0) {
                return false;
            }
            return true;
        }

        private static RubyString encodeMimeString(Ruby runtime, RubyString str, ByteList format) {
            RubyArray array = RubyArray.newArray(runtime, str);
            return Pack.pack(runtime, array, format).chomp(runtime.getCurrentContext());
        }

        abstract RubyString convert(ByteList str);

        ByteList convert_byte(ByteList str, String inputCharset, NKFCharset output) {
            String outputCharset = output.getCharset();

            if (inputCharset == null) {
                inputCharset = str.getEncoding().toString();
            }

            if (outputCharset.equals(inputCharset)) {
                return str.dup();
            }

            byte[] outCharsetBytes = outputCharset.getBytes();

            EConv ec = EncodingUtils.econvOpenOpts(context, inputCharset.getBytes(), outCharsetBytes, 0, context.nil);

            if (ec == null) {
                throw context.runtime.newArgumentError("invalid encoding pair: " + inputCharset + " to " + outputCharset);
            }

            ByteList converted = EncodingUtils.econvStrConvert(context, ec, str, EConvFlags.INVALID_REPLACE);

            converted.setEncoding(context.runtime.getEncodingService().findEncodingOrAliasEntry(outCharsetBytes).getEncoding());

            return converted;
        }
    }

    static class DefaultConverter extends Converter {

        public DefaultConverter(ThreadContext ctx, Map<String, NKFCharset> opt) {
            super(ctx, opt);
        }

        RubyString convert(ByteList str) {
            NKFCharset input = options.get("input");
            NKFCharset output = options.get("output");
            ByteList b = convert_byte(str,
                    input.getCharset(),
                    output);
            return context.runtime.newString(b);
        }
    }

    static class MimeConverter extends Converter {

        public MimeConverter(ThreadContext ctx, Map<String, NKFCharset> opt) {
            super(ctx, opt);
        }

        private String detectCharset(String charset) {
            if (charset.compareToIgnoreCase(NKFCharset.UTF8.getCharset()) == 0) {
                return NKFCharset.UTF8.getCharset();
            } else if (charset.compareToIgnoreCase(NKFCharset.JIS.getCharset()) == 0) {
                return NKFCharset.JIS.getCharset();
            } else if (charset.compareToIgnoreCase(NKFCharset.EUC.getCharset()) == 0) {
                return NKFCharset.EUC.getCharset();
            } else {
                return NKFCharset.ASCII.getCharset();
            }
        }

        private ByteList decodeMimeString(String str) {
            String[] mime = str.split("^=\\?|\\?|\\?=$");
            String charset = detectCharset(mime[1]);
            int encode = mime[2].charAt(0);
            RubyString body = EncodingUtils.newExternalStringWithEncoding(context.runtime, mime[3], ASCIIEncoding.INSTANCE);

            final RubyArray<?> array;
            if ('B' == encode || 'b' == encode) { // BASE64
                array = Pack.unpack(context, body, PACK_BASE64);
            } else { // Qencode
                array = Pack.unpack(context, body, PACK_QENCODE);
            }
            RubyString s = (RubyString) array.entry(0);
            ByteList decodeStr = s.asString().getByteList();

            return convert_byte(decodeStr, charset, options.get("output"));
        }

        RubyString makeRubyString(ArrayList<ByteList> list) {
            ByteList r = new ByteList();
            for (ByteList l : list) {
                r.append(l);
            }
            return context.runtime.newString(r);
        }

        RubyString convert(ByteList str) {
            String s = Helpers.decodeByteList(context.runtime, str);
            String[] token = s.split("\\s");
            ArrayList<ByteList> raw_data = new ArrayList<ByteList>();

            for (int i = 0; i < token.length; i++) {
                raw_data.add(decodeMimeString(token[i]));
            }

            return makeRubyString(raw_data);
        }

    }

    @Deprecated
    public static final NKFCharset AUTO = NKFCharset.AUTO;
    // no ISO-2022-JP in jcodings
    @Deprecated
    public static final NKFCharset JIS = NKFCharset.JIS;
    @Deprecated
    public static final NKFCharset EUC = NKFCharset.EUC;
    @Deprecated
    public static final NKFCharset SJIS = NKFCharset.SJIS;
    @Deprecated
    public static final NKFCharset BINARY = NKFCharset.BINARY;
    @Deprecated
    public static final NKFCharset NOCONV = NKFCharset.NOCONV;
    @Deprecated
    public static final NKFCharset UNKNOWN = NKFCharset.UNKNOWN;
    @Deprecated
    public static final NKFCharset ASCII = NKFCharset.ASCII;
    @Deprecated
    public static final NKFCharset UTF8 = NKFCharset.UTF8;
    @Deprecated
    public static final NKFCharset UTF16 = NKFCharset.UTF16;
    @Deprecated
    public static final NKFCharset UTF32 = NKFCharset.UTF32;
    @Deprecated
    public static final NKFCharset OTHER = NKFCharset.OTHER;
    @Deprecated
    public static final NKFCharset BASE64 = NKFCharset.BASE64;
    @Deprecated
    public static final NKFCharset QENCODE = NKFCharset.QENCODE;
    @Deprecated
    public static final NKFCharset MIME_DETECT = NKFCharset.MIME_DETECT;
}
