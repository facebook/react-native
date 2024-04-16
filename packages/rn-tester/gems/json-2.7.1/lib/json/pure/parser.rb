#frozen_string_literal: false
require 'strscan'

module JSON
  module Pure
    # This class implements the JSON parser that is used to parse a JSON string
    # into a Ruby data structure.
    class Parser < StringScanner
      STRING                = /" ((?:[^\x0-\x1f"\\] |
                                   # escaped special characters:
                                  \\["\\\/bfnrt] |
                                  \\u[0-9a-fA-F]{4} |
                                   # match all but escaped special characters:
                                  \\[\x20-\x21\x23-\x2e\x30-\x5b\x5d-\x61\x63-\x65\x67-\x6d\x6f-\x71\x73\x75-\xff])*)
                              "/nx
      INTEGER               = /(-?0|-?[1-9]\d*)/
      FLOAT                 = /(-?
                                (?:0|[1-9]\d*)
                                (?:
                                  \.\d+(?i:e[+-]?\d+) |
                                  \.\d+ |
                                  (?i:e[+-]?\d+)
                                )
                                )/x
      NAN                   = /NaN/
      INFINITY              = /Infinity/
      MINUS_INFINITY        = /-Infinity/
      OBJECT_OPEN           = /\{/
      OBJECT_CLOSE          = /\}/
      ARRAY_OPEN            = /\[/
      ARRAY_CLOSE           = /\]/
      PAIR_DELIMITER        = /:/
      COLLECTION_DELIMITER  = /,/
      TRUE                  = /true/
      FALSE                 = /false/
      NULL                  = /null/
      IGNORE                = %r(
        (?:
         //[^\n\r]*[\n\r]| # line comments
         /\*               # c-style comments
         (?:
          [^*/]|        # normal chars
          /[^*]|        # slashes that do not start a nested comment
          \*[^/]|       # asterisks that do not end this comment
          /(?=\*/)      # single slash before this comment's end
         )*
           \*/               # the End of this comment
           |[ \t\r\n]+       # whitespaces: space, horizontal tab, lf, cr
        )+
      )mx

      UNPARSED = Object.new.freeze

      # Creates a new JSON::Pure::Parser instance for the string _source_.
      #
      # It will be configured by the _opts_ hash. _opts_ can have the following
      # keys:
      # * *max_nesting*: The maximum depth of nesting allowed in the parsed data
      #   structures. Disable depth checking with :max_nesting => false|nil|0,
      #   it defaults to 100.
      # * *allow_nan*: If set to true, allow NaN, Infinity and -Infinity in
      #   defiance of RFC 7159 to be parsed by the Parser. This option defaults
      #   to false.
      # * *freeze*: If set to true, all parsed objects will be frozen. Parsed
      #   string will be deduplicated if possible.
      # * *symbolize_names*: If set to true, returns symbols for the names
      #   (keys) in a JSON object. Otherwise strings are returned, which is
      #   also the default. It's not possible to use this option in
      #   conjunction with the *create_additions* option.
      # * *create_additions*: If set to true, the Parser creates
      #   additions when a matching class and create_id are found. This
      #   option defaults to false.
      # * *object_class*: Defaults to Hash
      # * *array_class*: Defaults to Array
      # * *decimal_class*: Specifies which class to use instead of the default
      #    (Float) when parsing decimal numbers. This class must accept a single
      #    string argument in its constructor.
      def initialize(source, opts = {})
        opts ||= {}
        source = convert_encoding source
        super source
        if !opts.key?(:max_nesting) # defaults to 100
          @max_nesting = 100
        elsif opts[:max_nesting]
          @max_nesting = opts[:max_nesting]
        else
          @max_nesting = 0
        end
        @allow_nan = !!opts[:allow_nan]
        @symbolize_names = !!opts[:symbolize_names]
        @freeze = !!opts[:freeze]
        if opts.key?(:create_additions)
          @create_additions = !!opts[:create_additions]
        else
          @create_additions = false
        end
        @symbolize_names && @create_additions and raise ArgumentError,
          'options :symbolize_names and :create_additions cannot be used '\
          'in conjunction'
        @create_id = @create_additions ? JSON.create_id : nil
        @object_class = opts[:object_class] || Hash
        @array_class  = opts[:array_class] || Array
        @decimal_class = opts[:decimal_class]
        @match_string = opts[:match_string]
      end

      alias source string

      def reset
        super
        @current_nesting = 0
      end

      # Parses the current JSON string _source_ and returns the
      # complete data structure as a result.
      def parse
        reset
        obj = nil
        while !eos? && skip(IGNORE) do end
        if eos?
          raise ParserError, "source is not valid JSON!"
        else
          obj = parse_value
          UNPARSED.equal?(obj) and raise ParserError,
            "source is not valid JSON!"
          obj.freeze if @freeze
        end
        while !eos? && skip(IGNORE) do end
        eos? or raise ParserError, "source is not valid JSON!"
        obj
      end

      private

      def convert_encoding(source)
        if source.respond_to?(:to_str)
          source = source.to_str
        else
          raise TypeError,
            "#{source.inspect} is not like a string"
        end
        if source.encoding != ::Encoding::ASCII_8BIT
          source = source.encode(::Encoding::UTF_8)
          source.force_encoding(::Encoding::ASCII_8BIT)
        end
        source
      end

      # Unescape characters in strings.
      UNESCAPE_MAP = Hash.new { |h, k| h[k] = k.chr }
      UNESCAPE_MAP.update({
        ?"  => '"',
        ?\\ => '\\',
        ?/  => '/',
        ?b  => "\b",
        ?f  => "\f",
        ?n  => "\n",
        ?r  => "\r",
        ?t  => "\t",
        ?u  => nil,
      })

      EMPTY_8BIT_STRING = ''
      if ::String.method_defined?(:encode)
        EMPTY_8BIT_STRING.force_encoding Encoding::ASCII_8BIT
      end

      STR_UMINUS = ''.respond_to?(:-@)
      def parse_string
        if scan(STRING)
          return '' if self[1].empty?
          string = self[1].gsub(%r((?:\\[\\bfnrt"/]|(?:\\u(?:[A-Fa-f\d]{4}))+|\\[\x20-\xff]))n) do |c|
            if u = UNESCAPE_MAP[$&[1]]
              u
            else # \uXXXX
              bytes = EMPTY_8BIT_STRING.dup
              i = 0
              while c[6 * i] == ?\\ && c[6 * i + 1] == ?u
                bytes << c[6 * i + 2, 2].to_i(16) << c[6 * i + 4, 2].to_i(16)
                i += 1
              end
              JSON.iconv('utf-8', 'utf-16be', bytes).force_encoding(::Encoding::ASCII_8BIT)
            end
          end
          if string.respond_to?(:force_encoding)
            string.force_encoding(::Encoding::UTF_8)
          end

          if @freeze
            if STR_UMINUS
              string = -string
            else
              string.freeze
            end
          end

          if @create_additions and @match_string
            for (regexp, klass) in @match_string
              klass.json_creatable? or next
              string =~ regexp and return klass.json_create(string)
            end
          end
          string
        else
          UNPARSED
        end
      rescue => e
        raise ParserError, "Caught #{e.class} at '#{peek(20)}': #{e}"
      end

      def parse_value
        case
        when scan(FLOAT)
          if @decimal_class then
            if @decimal_class == BigDecimal then
              BigDecimal(self[1])
            else
              @decimal_class.new(self[1]) || Float(self[1])
            end
          else
            Float(self[1])
          end
        when scan(INTEGER)
          Integer(self[1])
        when scan(TRUE)
          true
        when scan(FALSE)
          false
        when scan(NULL)
          nil
        when !UNPARSED.equal?(string = parse_string)
          string
        when scan(ARRAY_OPEN)
          @current_nesting += 1
          ary = parse_array
          @current_nesting -= 1
          ary
        when scan(OBJECT_OPEN)
          @current_nesting += 1
          obj = parse_object
          @current_nesting -= 1
          obj
        when @allow_nan && scan(NAN)
          NaN
        when @allow_nan && scan(INFINITY)
          Infinity
        when @allow_nan && scan(MINUS_INFINITY)
          MinusInfinity
        else
          UNPARSED
        end
      end

      def parse_array
        raise NestingError, "nesting of #@current_nesting is too deep" if
          @max_nesting.nonzero? && @current_nesting > @max_nesting
        result = @array_class.new
        delim = false
        loop do
          case
          when eos?
            raise ParserError, "unexpected end of string while parsing array"
          when !UNPARSED.equal?(value = parse_value)
            delim = false
            result << value
            skip(IGNORE)
            if scan(COLLECTION_DELIMITER)
              delim = true
            elsif match?(ARRAY_CLOSE)
              ;
            else
              raise ParserError, "expected ',' or ']' in array at '#{peek(20)}'!"
            end
          when scan(ARRAY_CLOSE)
            if delim
              raise ParserError, "expected next element in array at '#{peek(20)}'!"
            end
            break
          when skip(IGNORE)
            ;
          else
            raise ParserError, "unexpected token in array at '#{peek(20)}'!"
          end
        end
        result
      end

      def parse_object
        raise NestingError, "nesting of #@current_nesting is too deep" if
          @max_nesting.nonzero? && @current_nesting > @max_nesting
        result = @object_class.new
        delim = false
        loop do
          case
          when eos?
            raise ParserError, "unexpected end of string while parsing object"
          when !UNPARSED.equal?(string = parse_string)
            skip(IGNORE)
            unless scan(PAIR_DELIMITER)
              raise ParserError, "expected ':' in object at '#{peek(20)}'!"
            end
            skip(IGNORE)
            unless UNPARSED.equal?(value = parse_value)
              result[@symbolize_names ? string.to_sym : string] = value
              delim = false
              skip(IGNORE)
              if scan(COLLECTION_DELIMITER)
                delim = true
              elsif match?(OBJECT_CLOSE)
                ;
              else
                raise ParserError, "expected ',' or '}' in object at '#{peek(20)}'!"
              end
            else
              raise ParserError, "expected value in object at '#{peek(20)}'!"
            end
          when scan(OBJECT_CLOSE)
            if delim
              raise ParserError, "expected next name, value pair in object at '#{peek(20)}'!"
            end
            if @create_additions and klassname = result[@create_id]
              klass = JSON.deep_const_get klassname
              break unless klass and klass.json_creatable?
              result = klass.json_create(result)
            end
            break
          when skip(IGNORE)
            ;
          else
            raise ParserError, "unexpected token in object at '#{peek(20)}'!"
          end
        end
        result
      end
    end
  end
end
