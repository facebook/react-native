# -*- coding: utf-8 -*-

require 'rexml/document'

module CFPropertyList
  # XML parser
  class ReXMLParser < ParserInterface
    # read a XML file
    # opts::
    # * :file - The filename of the file to load
    # * :data - The data to parse
    def load(opts)

      doc = nil
      if(opts.has_key?(:file)) then
        File.open(opts[:file], "rb") { |fd| doc = REXML::Document.new(fd) }
      else
        doc = REXML::Document.new(opts[:data])
      end

      if doc
        root = doc.root.elements[1]
        return import_xml(root)
      end
    rescue REXML::ParseException => e
      raise CFFormatError.new('invalid XML: ' + e.message)
    end

    # serialize CFPropertyList object to XML
    # opts = {}:: Specify options: :formatted - Use indention and line breaks
    def to_str(opts={})
      doc = REXML::Document.new
      @doc = doc

      doc.context[:attribute_quote] = :quote

      doc.add_element 'plist', {'version' => '1.0'}
      doc.root << opts[:root].to_xml(self)

      formatter = if opts[:formatted] then
        f = REXML::Formatters::Pretty.new(2)
        f.compact = true
        f.width = Float::INFINITY
        f
      else
        REXML::Formatters::Default.new
      end

      str = formatter.write(doc.root, "")
      str1 = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n" + str + "\n"
      str1.force_encoding('UTF-8') if str1.respond_to?(:force_encoding)

      return str1
    end

    def new_node(name)
      REXML::Element.new(name)
    end

    def new_text(val)
      val
    end

    def append_node(parent, child)
      if child.is_a?(String) then
        parent.add_text child
      else
        parent.elements << child
      end
      parent
    end

    protected

    # get the value of a DOM node
    def get_value(n)
      content = n.text

      content.force_encoding('UTF-8') if content.respond_to?(:force_encoding)
      content
    end

    # import the XML values
    def import_xml(node)
      ret = nil

      case node.name
      when 'dict'
        hsh = Hash.new
        key = nil

        if node.has_elements? then
          node.elements.each do |n|
            next if n.name == '#text' # avoid a bug of libxml
            next if n.name == '#comment'

            if n.name == "key" then
              key = get_value(n)
              key = '' if key.nil? # REXML returns nil if key is empty
            else
              raise CFFormatError.new("Format error!") if key.nil?
              hsh[key] = import_xml(n)
              key = nil
            end
          end
        end

        if hsh['CF$UID'] and hsh.keys.length == 1
          ret = CFUid.new(hsh['CF$UID'].value)
        else
          ret = CFDictionary.new(hsh)
        end

      when 'array'
        ary = Array.new

        if node.has_elements? then
          node.elements.each do |n|
            next if n.name == '#text' # avoid a bug of libxml
            ary.push import_xml(n)
          end
        end

        ret = CFArray.new(ary)

      when 'true'
        ret = CFBoolean.new(true)
      when 'false'
        ret = CFBoolean.new(false)
      when 'real'
        ret = CFReal.new(get_value(node).to_f)
      when 'integer'
        ret = CFInteger.new(get_value(node).to_i)
      when 'string'
        ret = CFString.new(get_value(node))
        ret.value = '' if ret.value.nil? # REXML returns nil for empty elements' .text attribute
      when 'data'
        ret = CFData.new(get_value(node))
      when 'date'
        ret = CFDate.new(CFDate.parse_date(get_value(node)))
      end

      return ret
    end
  end
end

# eof
