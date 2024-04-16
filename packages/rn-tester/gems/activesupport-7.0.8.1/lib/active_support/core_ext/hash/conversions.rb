# frozen_string_literal: true

require "active_support/core_ext/object/blank"
require "active_support/core_ext/object/to_param"
require "active_support/core_ext/object/to_query"
require "active_support/core_ext/object/try"
require "active_support/core_ext/array/wrap"
require "active_support/core_ext/hash/reverse_merge"
require "active_support/core_ext/string/inflections"

class Hash
  # Returns a string containing an XML representation of its receiver:
  #
  #   { foo: 1, bar: 2 }.to_xml
  #   # =>
  #   # <?xml version="1.0" encoding="UTF-8"?>
  #   # <hash>
  #   #   <foo type="integer">1</foo>
  #   #   <bar type="integer">2</bar>
  #   # </hash>
  #
  # To do so, the method loops over the pairs and builds nodes that depend on
  # the _values_. Given a pair +key+, +value+:
  #
  # * If +value+ is a hash there's a recursive call with +key+ as <tt>:root</tt>.
  #
  # * If +value+ is an array there's a recursive call with +key+ as <tt>:root</tt>,
  #   and +key+ singularized as <tt>:children</tt>.
  #
  # * If +value+ is a callable object it must expect one or two arguments. Depending
  #   on the arity, the callable is invoked with the +options+ hash as first argument
  #   with +key+ as <tt>:root</tt>, and +key+ singularized as second argument. The
  #   callable can add nodes by using <tt>options[:builder]</tt>.
  #
  #     {foo: lambda { |options, key| options[:builder].b(key) }}.to_xml
  #     # => "<b>foo</b>"
  #
  # * If +value+ responds to +to_xml+ the method is invoked with +key+ as <tt>:root</tt>.
  #
  #     class Foo
  #       def to_xml(options)
  #         options[:builder].bar 'fooing!'
  #       end
  #     end
  #
  #     { foo: Foo.new }.to_xml(skip_instruct: true)
  #     # =>
  #     # <hash>
  #     #   <bar>fooing!</bar>
  #     # </hash>
  #
  # * Otherwise, a node with +key+ as tag is created with a string representation of
  #   +value+ as text node. If +value+ is +nil+ an attribute "nil" set to "true" is added.
  #   Unless the option <tt>:skip_types</tt> exists and is true, an attribute "type" is
  #   added as well according to the following mapping:
  #
  #     XML_TYPE_NAMES = {
  #       "Symbol"     => "symbol",
  #       "Integer"    => "integer",
  #       "BigDecimal" => "decimal",
  #       "Float"      => "float",
  #       "TrueClass"  => "boolean",
  #       "FalseClass" => "boolean",
  #       "Date"       => "date",
  #       "DateTime"   => "dateTime",
  #       "Time"       => "dateTime"
  #     }
  #
  # By default the root node is "hash", but that's configurable via the <tt>:root</tt> option.
  #
  # The default XML builder is a fresh instance of <tt>Builder::XmlMarkup</tt>. You can
  # configure your own builder with the <tt>:builder</tt> option. The method also accepts
  # options like <tt>:dasherize</tt> and friends, they are forwarded to the builder.
  def to_xml(options = {})
    require "active_support/builder" unless defined?(Builder::XmlMarkup)

    options = options.dup
    options[:indent]  ||= 2
    options[:root]    ||= "hash"
    options[:builder] ||= Builder::XmlMarkup.new(indent: options[:indent])

    builder = options[:builder]
    builder.instruct! unless options.delete(:skip_instruct)

    root = ActiveSupport::XmlMini.rename_key(options[:root].to_s, options)

    builder.tag!(root) do
      each { |key, value| ActiveSupport::XmlMini.to_tag(key, value, options) }
      yield builder if block_given?
    end
  end

  class << self
    # Returns a Hash containing a collection of pairs when the key is the node name and the value is
    # its content
    #
    #   xml = <<-XML
    #     <?xml version="1.0" encoding="UTF-8"?>
    #       <hash>
    #         <foo type="integer">1</foo>
    #         <bar type="integer">2</bar>
    #       </hash>
    #   XML
    #
    #   hash = Hash.from_xml(xml)
    #   # => {"hash"=>{"foo"=>1, "bar"=>2}}
    #
    # +DisallowedType+ is raised if the XML contains attributes with <tt>type="yaml"</tt> or
    # <tt>type="symbol"</tt>. Use <tt>Hash.from_trusted_xml</tt> to
    # parse this XML.
    #
    # Custom +disallowed_types+ can also be passed in the form of an
    # array.
    #
    #   xml = <<-XML
    #     <?xml version="1.0" encoding="UTF-8"?>
    #       <hash>
    #         <foo type="integer">1</foo>
    #         <bar type="string">"David"</bar>
    #       </hash>
    #   XML
    #
    #   hash = Hash.from_xml(xml, ['integer'])
    #   # => ActiveSupport::XMLConverter::DisallowedType: Disallowed type attribute: "integer"
    #
    # Note that passing custom disallowed types will override the default types,
    # which are Symbol and YAML.
    def from_xml(xml, disallowed_types = nil)
      ActiveSupport::XMLConverter.new(xml, disallowed_types).to_h
    end

    # Builds a Hash from XML just like <tt>Hash.from_xml</tt>, but also allows Symbol and YAML.
    def from_trusted_xml(xml)
      from_xml xml, []
    end
  end
end

module ActiveSupport
  class XMLConverter # :nodoc:
    # Raised if the XML contains attributes with type="yaml" or
    # type="symbol". Read Hash#from_xml for more details.
    class DisallowedType < StandardError
      def initialize(type)
        super "Disallowed type attribute: #{type.inspect}"
      end
    end

    DISALLOWED_TYPES = %w(symbol yaml)

    def initialize(xml, disallowed_types = nil)
      @xml = normalize_keys(XmlMini.parse(xml))
      @disallowed_types = disallowed_types || DISALLOWED_TYPES
    end

    def to_h
      deep_to_h(@xml)
    end

    private
      def normalize_keys(params)
        case params
        when Hash
          Hash[params.map { |k, v| [k.to_s.tr("-", "_"), normalize_keys(v)] } ]
        when Array
          params.map { |v| normalize_keys(v) }
        else
          params
        end
      end

      def deep_to_h(value)
        case value
        when Hash
          process_hash(value)
        when Array
          process_array(value)
        when String
          value
        else
          raise "can't typecast #{value.class.name} - #{value.inspect}"
        end
      end

      def process_hash(value)
        if value.include?("type") && !value["type"].is_a?(Hash) && @disallowed_types.include?(value["type"])
          raise DisallowedType, value["type"]
        end

        if become_array?(value)
          _, entries = Array.wrap(value.detect { |k, v| not v.is_a?(String) })
          if entries.nil? || value["__content__"].try(:empty?)
            []
          else
            case entries
            when Array
              entries.collect { |v| deep_to_h(v) }
            when Hash
              [deep_to_h(entries)]
            else
              raise "can't typecast #{entries.inspect}"
            end
          end
        elsif become_content?(value)
          process_content(value)

        elsif become_empty_string?(value)
          ""
        elsif become_hash?(value)
          xml_value = value.transform_values { |v| deep_to_h(v) }

          # Turn { files: { file: #<StringIO> } } into { files: #<StringIO> } so it is compatible with
          # how multipart uploaded files from HTML appear
          xml_value["file"].is_a?(StringIO) ? xml_value["file"] : xml_value
        end
      end

      def become_content?(value)
        value["type"] == "file" || (value["__content__"] && (value.keys.size == 1 || value["__content__"].present?))
      end

      def become_array?(value)
        value["type"] == "array"
      end

      def become_empty_string?(value)
        # { "string" => true }
        # No tests fail when the second term is removed.
        value["type"] == "string" && value["nil"] != "true"
      end

      def become_hash?(value)
        !nothing?(value) && !garbage?(value)
      end

      def nothing?(value)
        # blank or nil parsed values are represented by nil
        value.blank? || value["nil"] == "true"
      end

      def garbage?(value)
        # If the type is the only element which makes it then
        # this still makes the value nil, except if type is
        # an XML node(where type['value'] is a Hash)
        value["type"] && !value["type"].is_a?(::Hash) && value.size == 1
      end

      def process_content(value)
        content = value["__content__"]
        if parser = ActiveSupport::XmlMini::PARSING[value["type"]]
          parser.arity == 1 ? parser.call(content) : parser.call(content, value)
        else
          content
        end
      end

      def process_array(value)
        value.map! { |i| deep_to_h(i) }
        value.length > 1 ? value : value.first
      end
  end
end
