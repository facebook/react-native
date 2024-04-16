# frozen-string-literal: true

module Nanaimo
  # Transforms plist strings into Plist objects.
  #
  class Reader
    autoload :StringScanner, 'strscan'

    # Raised when attempting to read a plist with an unsupported file format.
    #
    class UnsupportedPlistFormatError < Error
      # @return [Symbol] The unsupported format.
      #
      attr_reader :format

      def initialize(format)
        @format = format
      end

      def to_s
        "#{format} plists are currently unsupported"
      end
    end

    # Raised when parsing fails.
    #
    class ParseError < Error
      # @return [[Integer, Integer]] The (line, column) offset into the plist
      #         where the error occurred
      #
      attr_accessor :location

      # @return [String] The contents of the plist.
      #
      attr_accessor :plist_string

      def to_s
        "[!] #{super}#{context}"
      end

      def context(n = 2)
        line_number, column = location
        line_number -= 1
        lines = plist_string.split(NEWLINE)

        s = line_number.succ.to_s.size
        indent     = "#{' ' * s}#  "
        indicator  = "#{line_number.succ}>  "

        m =  ::String.new("\n")

        m << "#{indent}-------------------------------------------\n"
        m << lines[[line_number - n, 0].max...line_number].map do |l|
          "#{indent}#{l}\n"
        end.join

        line = lines[line_number].to_s
        m << "#{indicator}#{line}\n"

        m << ' ' * indent.size
        m << line[0, column.pred].gsub(/[^\t]/, ' ')
        m << "^\n"

        m << Array(lines[line_number.succ..[lines.count.pred, line_number + n].min]).map do |l|
          l.strip.empty? ? '' : "#{indent}#{l}\n"
        end.join
        m << "#{indent}-------------------------------------------\n"
      end
    end

    # @param plist_contents [String]
    #
    # @return [Symbol] The file format of the plist in the given string.
    #
    def self.plist_type(plist_contents)
      case plist_contents
      when /\Abplist/
        :binary
      when /\A<\?xml/
        :xml
      else
        :ascii
      end
    end

    # @param file_path [String]
    #
    # @return [Plist] A parsed plist from the given file
    #
    def self.from_file(file_path)
      new(File.read(file_path))
    end

    # @param contents [String] The plist to be parsed
    #
    def initialize(contents)
      @scanner = StringScanner.new(contents)
    end

    # Parses the contents of the plist
    #
    # @return [Plist] The parsed Plist object.
    #
    def parse!
      plist_format = ensure_ascii_plist!
      read_string_encoding
      root_object = parse_object

      eat_whitespace!
      raise_parser_error ParseError, 'Found additional characters after parsing the root plist object' unless @scanner.eos?

      Nanaimo::Plist.new(root_object, plist_format)
    end

    private

    def ensure_ascii_plist!
      self.class.plist_type(@scanner.string).tap do |plist_format|
        raise UnsupportedPlistFormatError, plist_format unless plist_format == :ascii
      end
    end

    def read_string_encoding
      # TODO
    end

    def parse_object(already_parsed_comment: false)
      _comment = skip_to_non_space_matching_annotations unless already_parsed_comment
      start_pos = @scanner.pos
      raise_parser_error ParseError, 'Unexpected end of string while parsing' if @scanner.eos?
      if @scanner.skip(/\{/)
        parse_dictionary
      elsif @scanner.skip(/\(/)
        parse_array
      elsif @scanner.skip(/</)
        parse_data
      elsif quote = @scanner.scan(/['"]/)
        parse_quotedstring(quote)
      else
        parse_string
      end.tap do |o|
        o.annotation = skip_to_non_space_matching_annotations
        Nanaimo.debug { "parsed #{o.inspect} from #{start_pos}..#{@scanner.pos}" }
      end
    end

    def parse_string
      eat_whitespace!
      unless match = @scanner.scan(%r{[\w_$/:.-]+}o)
        raise_parser_error ParseError, "Invalid character #{current_character.inspect} in unquoted string"
      end
      Nanaimo::String.new(match, nil)
    end

    def parse_quotedstring(quote)
      unless string = @scanner.scan(/(?:([^#{quote}\\]|\\.)*)#{quote}/)
        raise_parser_error ParseError, "Unterminated quoted string, expected #{quote} but never found it"
      end
      string = Unicode.unquotify_string(string.chomp!(quote))
      Nanaimo::QuotedString.new(string, nil)
    end

    def parse_array
      objects = []
      until @scanner.eos?
        _comment = skip_to_non_space_matching_annotations
        break if @scanner.skip(/\)/)

        objects << parse_object(already_parsed_comment: true)

        eat_whitespace!
        break if @scanner.skip(/\)/)
        unless @scanner.skip(/,/)
          raise_parser_error ParseError, "Array missing ',' in between objects"
        end
      end

      Nanaimo::Array.new(objects, nil)
    end

    def parse_dictionary
      objects = {}
      until @scanner.eos?
        _comment = skip_to_non_space_matching_annotations
        break if @scanner.skip(/}/)

        key = parse_object(already_parsed_comment: true)
        eat_whitespace!
        unless @scanner.skip(/=/)
          raise_parser_error ParseError, "Dictionary missing value for key #{key.as_ruby.inspect}, expected '=' and found #{current_character.inspect}"
        end

        value = parse_object
        objects[key] = value

        eat_whitespace!
        break if @scanner.skip(/}/)
        unless @scanner.skip(/;/)
          raise_parser_error ParseError, "Dictionary missing ';' after key-value pair for #{key.as_ruby.inspect}, found #{current_character.inspect}"
        end
      end

      Nanaimo::Dictionary.new(objects, nil)
    end

    def parse_data
      unless data = @scanner.scan(/[\h ]*>/)
        raise_parser_error ParseError, "Data missing closing '>'"
      end
      data.chomp!('>')
      data.delete!(' ')
      unless data.size.even?
        @scanner.unscan
        raise_parser_error ParseError, 'Data has an uneven number of hex digits'
      end
      data = [data].pack('H*')
      Nanaimo::Data.new(data, nil)
    end

    def current_character
      @scanner.peek(1)
    end

    def read_singleline_comment
      unless comment = @scanner.scan_until(NEWLINE)
        raise_parser_error ParseError, 'Failed to terminate single line comment'
      end
      comment
    end

    def eat_whitespace!
      @scanner.skip(MANY_WHITESPACES)
    end

    NEWLINE_CHARACTERS = %W(\x0A \x0D \u2028 \u2029).freeze
    NEWLINE = Regexp.union(*NEWLINE_CHARACTERS)

    WHITESPACE_CHARACTERS = NEWLINE_CHARACTERS + %W(\x09 \x0B \x0C \x20)
    WHITESPACE = Regexp.union(*WHITESPACE_CHARACTERS)

    MANY_WHITESPACES = /#{WHITESPACE}+/

    def read_multiline_comment
      unless annotation = @scanner.scan(%r{(?:.+?)(?=\*/)}m)
        raise_parser_error ParseError, 'Failed to terminate multiline comment'
      end
      @scanner.skip(%r{\*/})

      annotation
    end

    def skip_to_non_space_matching_annotations
      annotation = ''.freeze
      until @scanner.eos?
        eat_whitespace!

        # Comment Detection
        if @scanner.skip(%r{//})
          annotation = read_singleline_comment
          next
        elsif @scanner.skip(%r{/\*})
          annotation = read_multiline_comment
          next
        end

        break
      end
      annotation
    end

    def location_in(scanner)
      pos = scanner.charpos
      line = scanner.string[0..scanner.charpos].scan(NEWLINE).size + 1
      column = pos - (scanner.string.rindex(NEWLINE, pos - 1) || -1)
      column = [1, column].max
      [line, column]
    end

    def raise_parser_error(klass, message)
      exception = klass.new(message).tap do |error|
        error.location = location_in(@scanner)
        error.plist_string = @scanner.string
      end
      raise(exception)
    end
  end
end
