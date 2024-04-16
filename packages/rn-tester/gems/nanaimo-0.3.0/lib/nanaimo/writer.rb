# frozen_string_literal: true

module Nanaimo
  # Transforms native ruby objects or Plist objects into their ASCII Plist
  # string representation.
  #
  class Writer
    autoload :PBXProjWriter, 'nanaimo/writer/pbxproj'
    autoload :XMLWriter, 'nanaimo/writer/xml'

    # Raised when attempting to write a plist containing an object of an
    # unsupported type.
    #
    class UnsupportedPlistTypeError < Error
      def initialize(plist_format, object)
        @plist_format = plist_format
        @object = object
      end

      def to_s
        "Unable to write #{@object.inspect}. " \
          "`#{@object.class}` is an invalid object type to serialize in a #{@plist_format} plist."
      end
    end

    # The magic comment that denotes a UTF8-encoded plist.
    #
    UTF8 = "// !$*UTF8*$!\n".freeze

    # @param plist [Plist,String,Hash,Array] The plist object to write
    # @param pretty [Boolean] Whether to serialize annotations and add
    #                         spaces and newlines to make output more legible
    # @param output [#<<] The output stream to write the plist to
    #
    def initialize(plist, pretty: true, output: ::String.new, strict: true)
      @plist = plist
      @pretty = pretty
      @output = output
      @indent = 0
      @newlines = true
      @strict = strict
    end

    # Writes the plist to the given output.
    #
    def write
      write_utf8
      write_object(@plist.root_object)
      write_newline
    end

    attr_reader :indent, :pretty, :output, :newlines, :strict
    private :indent, :pretty, :output, :newlines, :strict

    private

    def plist_format
      :ascii
    end

    def write_utf8
      output << UTF8
    end

    def write_newline
      output << if newlines
                  "\n"
                else
                  ' '
                end
    end

    def write_object(object)
      case object
      when Array, ::Array
        write_array(object)
      when Dictionary, ::Hash
        write_dictionary(object)
      when QUOTED_STRING_REGEXP, QuotedString
        write_quoted_string(object)
      when String, ::String, Symbol
        write_string(object)
      when Data
        write_data(object)
      else
        raise UnsupportedPlistTypeError.new(plist_format, object) if strict
        write_string_quoted_if_necessary(object)
      end
      write_annotation(object) if pretty
      output
    end

    QUOTED_STRING_REGEXP = %r{\A\z|[^\w\./]|\A___}
    private_constant :QUOTED_STRING_REGEXP

    def write_string_quoted_if_necessary(object)
      string = object.to_s
      string =~ QUOTED_STRING_REGEXP ? write_quoted_string(string) : write_string(string)
    end

    def write_string(object)
      output << value_for(object).to_s
    end

    def write_quoted_string(object)
      output << '"' << Unicode.quotify_string(value_for(object)) << '"'
    end

    def write_data(object)
      output << '<'
      value_for(object).unpack('H*').first.chars.each_with_index do |c, i|
        output << "\n" if i > 0 && (i % 16).zero?
        output << ' ' if i > 0 && (i % 4).zero?
        output << c
      end
      output << '>'
    end

    def write_array(object)
      write_array_start
      value = value_for(object)
      value.each do |v|
        write_array_element(v)
      end
      write_array_end
    end

    def write_array_start
      output << '('
      write_newline if newlines
      push_indent!
    end

    def write_array_end
      pop_indent!
      write_indent
      output << ')'
    end

    def write_array_element(object)
      write_indent
      write_object(object)
      output << ','
      write_newline
    end

    def write_dictionary(object)
      write_dictionary_start
      value = value_for(object)
      value.each do |key, val|
        write_dictionary_key_value_pair(key, val)
      end
      write_dictionary_end
    end

    def write_dictionary_start
      output << '{'
      write_newline if newlines
      push_indent!
    end

    def write_dictionary_end
      pop_indent!
      write_indent
      output << '}'
    end

    def write_dictionary_key_value_pair(key, value)
      write_indent
      write_object(key)
      output << ' = '
      write_object(value)
      output << ';'
      write_newline
    end

    def write_annotation(object)
      return output unless object.is_a?(Nanaimo::Object)
      annotation = object.annotation
      return output unless annotation && !annotation.empty?
      output << " /*#{annotation}*/"
    end

    def value_for(object)
      if object.is_a?(Nanaimo::Object)
        object.value
      else
        object
      end
    end

    def push_indent!
      @indent += 1
    end

    def pop_indent!
      @indent -= 1
      @indent = 0 if @indent < 0
    end

    def write_indent
      output << "\t" * indent if newlines
      output
    end
  end
end
