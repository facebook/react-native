# -*- coding: utf-8 -*-

require 'libxml'

module CFPropertyList
  # XML parser
  class LibXMLParser < XMLParserInterface
    LibXML::XML::Error.set_handler(&LibXML::XML::Error::QUIET_HANDLER)
    PARSER_OPTIONS = LibXML::XML::Parser::Options::NOBLANKS|LibXML::XML::Parser::Options::NONET
    # read a XML file
    # opts::
    # * :file - The filename of the file to load
    # * :data - The data to parse
    def load(opts)
      doc = nil

      if(opts.has_key?(:file)) then
        doc = LibXML::XML::Document.file(opts[:file],:options => PARSER_OPTIONS)
      else
        doc = LibXML::XML::Document.string(opts[:data],:options => PARSER_OPTIONS)
      end

      if doc
        root = doc.root.first
        return import_xml(root)
      end
    rescue LibXML::XML::Error => e
      raise CFFormatError.new('invalid XML: ' + e.message)
    end

    # serialize CFPropertyList object to XML
    # opts = {}:: Specify options: :formatted - Use indention and line breaks
    def to_str(opts={})
      doc = LibXML::XML::Document.new

      doc.root = LibXML::XML::Node.new('plist')
      doc.encoding = LibXML::XML::Encoding::UTF_8

      doc.root['version'] = '1.0'
      doc.root << opts[:root].to_xml(self)

      # ugly hack, but there's no other possibility I know
      str = doc.to_s(:indent => opts[:formatted])
      str1 = String.new
      first = false
      str.each_line do |line|
        str1 << line
        unless(first) then
          str1 << "<!DOCTYPE plist PUBLIC \"-//Apple//DTD PLIST 1.0//EN\" \"http://www.apple.com/DTDs/PropertyList-1.0.dtd\">\n" if line =~ /^\s*<\?xml/
        end

        first = true
      end

      str1.force_encoding('UTF-8') if str1.respond_to?(:force_encoding)
      return str1
    end

    def new_node(name)
      LibXML::XML::Node.new(name)
    end

    def new_text(val)
      LibXML::XML::Node.new_text(val)
    end

    def append_node(parent, child)
      parent << child
    end

    protected

    # get the value of a DOM node
    def get_value(n)
      content = if n.children?
        n.first.content
      else
        n.content
      end

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

        if node.children? then
          node.children.each do |n|
            next if n.text? # avoid a bug of libxml
            next if n.comment?

            if n.name == "key" then
              key = get_value(n)
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

        if node.children? then
          node.children.each do |n|
            next if n.text? # avoid a bug of libxml
            next if n.comment?
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
