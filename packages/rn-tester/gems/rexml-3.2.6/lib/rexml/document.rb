# frozen_string_literal: false
require_relative "security"
require_relative "element"
require_relative "xmldecl"
require_relative "source"
require_relative "comment"
require_relative "doctype"
require_relative "instruction"
require_relative "rexml"
require_relative "parseexception"
require_relative "output"
require_relative "parsers/baseparser"
require_relative "parsers/streamparser"
require_relative "parsers/treeparser"

module REXML
  # Represents an XML document.
  #
  # A document may have:
  #
  # - A single child that may be accessed via method #root.
  # - An XML declaration.
  # - A document type.
  # - Processing instructions.
  #
  # == In a Hurry?
  #
  # If you're somewhat familiar with XML
  # and have a particular task in mind,
  # you may want to see the
  # {tasks pages}[../doc/rexml/tasks/tocs/master_toc_rdoc.html],
  # and in particular, the
  # {tasks page for documents}[../doc/rexml/tasks/tocs/document_toc_rdoc.html].
  #
  class Document < Element
    # A convenient default XML declaration. Use:
    #
    #   mydoc << XMLDecl.default
    #
    DECLARATION = XMLDecl.default

    # :call-seq:
    #   new(string = nil, context = {}) -> new_document
    #   new(io_stream = nil, context = {}) -> new_document
    #   new(document = nil, context = {}) -> new_document
    #
    # Returns a new \REXML::Document object.
    #
    # When no arguments are given,
    # returns an empty document:
    #
    #   d = REXML::Document.new
    #   d.to_s # => ""
    #
    # When argument +string+ is given, it must be a string
    # containing a valid XML document:
    #
    #   xml_string = '<root><foo>Foo</foo><bar>Bar</bar></root>'
    #   d = REXML::Document.new(xml_string)
    #   d.to_s # => "<root><foo>Foo</foo><bar>Bar</bar></root>"
    #
    # When argument +io_stream+ is given, it must be an \IO object
    # that is opened for reading, and when read must return a valid XML document:
    #
    #   File.write('t.xml', xml_string)
    #   d = File.open('t.xml', 'r') do |io|
    #     REXML::Document.new(io)
    #   end
    #   d.to_s # => "<root><foo>Foo</foo><bar>Bar</bar></root>"
    #
    # When argument +document+ is given, it must be an existing
    # document object, whose context and attributes (but not children)
    # are cloned into the new document:
    #
    #   d = REXML::Document.new(xml_string)
    #   d.children    # => [<root> ... </>]
    #   d.context = {raw: :all, compress_whitespace: :all}
    #   d.add_attributes({'bar' => 0, 'baz' => 1})
    #   d1 = REXML::Document.new(d)
    #   d1.children   # => []
    #   d1.context    # => {:raw=>:all, :compress_whitespace=>:all}
    #   d1.attributes # => {"bar"=>bar='0', "baz"=>baz='1'}
    #
    # When argument +context+ is given, it must be a hash
    # containing context entries for the document;
    # see {Element Context}[../doc/rexml/context_rdoc.html]:
    #
    #   context = {raw: :all, compress_whitespace: :all}
    #   d = REXML::Document.new(xml_string, context)
    #   d.context # => {:raw=>:all, :compress_whitespace=>:all}
    #
    def initialize( source = nil, context = {} )
      @entity_expansion_count = 0
      super()
      @context = context
      return if source.nil?
      if source.kind_of? Document
        @context = source.context
        super source
      else
        build(  source )
      end
    end

    # :call-seq:
    #   node_type -> :document
    #
    # Returns the symbol +:document+.
    #
    def node_type
      :document
    end

    # :call-seq:
    #   clone -> new_document
    #
    # Returns the new document resulting from executing
    # <tt>Document.new(self)</tt>.  See Document.new.
    #
    def clone
      Document.new self
    end

    # :call-seq:
    #   expanded_name -> empty_string
    #
    # Returns an empty string.
    #
    def expanded_name
      ''
      #d = doc_type
      #d ? d.name : "UNDEFINED"
    end
    alias :name :expanded_name

    # :call-seq:
    #   add(xml_decl) -> self
    #   add(doc_type) -> self
    #   add(object) -> self
    #
    # Adds an object to the document; returns +self+.
    #
    # When argument +xml_decl+ is given,
    # it must be an REXML::XMLDecl object,
    # which becomes the XML declaration for the document,
    # replacing the previous XML declaration if any:
    #
    #   d = REXML::Document.new
    #   d.xml_decl.to_s # => ""
    #   d.add(REXML::XMLDecl.new('2.0'))
    #   d.xml_decl.to_s # => "<?xml version='2.0'?>"
    #
    # When argument +doc_type+ is given,
    # it must be an REXML::DocType object,
    # which becomes the document type for the document,
    # replacing the previous document type, if any:
    #
    #   d = REXML::Document.new
    #   d.doctype.to_s # => ""
    #   d.add(REXML::DocType.new('foo'))
    #   d.doctype.to_s # => "<!DOCTYPE foo>"
    #
    # When argument +object+ (not an REXML::XMLDecl or REXML::DocType object)
    # is given it is added as the last child:
    #
    #   d = REXML::Document.new
    #   d.add(REXML::Element.new('foo'))
    #   d.to_s # => "<foo/>"
    #
    def add( child )
      if child.kind_of? XMLDecl
        if @children[0].kind_of? XMLDecl
          @children[0] = child
        else
          @children.unshift child
        end
        child.parent = self
      elsif child.kind_of? DocType
        # Find first Element or DocType node and insert the decl right
        # before it.  If there is no such node, just insert the child at the
        # end.  If there is a child and it is an DocType, then replace it.
        insert_before_index = @children.find_index { |x|
          x.kind_of?(Element) || x.kind_of?(DocType)
        }
        if insert_before_index # Not null = not end of list
          if @children[ insert_before_index ].kind_of? DocType
            @children[ insert_before_index ] = child
          else
            @children[ insert_before_index-1, 0 ] = child
          end
        else  # Insert at end of list
          @children << child
        end
        child.parent = self
      else
        rv = super
        raise "attempted adding second root element to document" if @elements.size > 1
        rv
      end
    end
    alias :<< :add

    # :call-seq:
    #   add_element(name_or_element = nil, attributes = nil) -> new_element
    #
    # Adds an element to the document by calling REXML::Element.add_element:
    #
    #   REXML::Element.add_element(name_or_element, attributes)
    def add_element(arg=nil, arg2=nil)
      rv = super
      raise "attempted adding second root element to document" if @elements.size > 1
      rv
    end

    # :call-seq:
    #   root -> root_element or nil
    #
    # Returns the root element of the document, if it exists, otherwise +nil+:
    #
    #   d = REXML::Document.new('<root></root>')
    #   d.root # => <root/>
    #   d = REXML::Document.new('')
    #   d.root # => nil
    #
    def root
      elements[1]
      #self
      #@children.find { |item| item.kind_of? Element }
    end

    # :call-seq:
    #   doctype -> doc_type or nil
    #
    # Returns the DocType object for the document, if it exists, otherwise +nil+:
    #
    #   d = REXML::Document.new('<!DOCTYPE document SYSTEM "subjects.dtd">')
    #   d.doctype.class # => REXML::DocType
    #   d = REXML::Document.new('')
    #   d.doctype.class # => nil
    #
    def doctype
      @children.find { |item| item.kind_of? DocType }
    end

    # :call-seq:
    #   xml_decl -> xml_decl
    #
    # Returns the XMLDecl object for the document, if it exists,
    # otherwise the default XMLDecl object:
    #
    #   d = REXML::Document.new('<?xml version="1.0" encoding="UTF-8"?>')
    #   d.xml_decl.class # => REXML::XMLDecl
    #   d.xml_decl.to_s  # => "<?xml version='1.0' encoding='UTF-8'?>"
    #   d = REXML::Document.new('')
    #   d.xml_decl.class # => REXML::XMLDecl
    #   d.xml_decl.to_s  # => ""
    #
    def xml_decl
      rv = @children[0]
      return rv if rv.kind_of? XMLDecl
      @children.unshift(XMLDecl.default)[0]
    end

    # :call-seq:
    #   version -> version_string
    #
    # Returns the XMLDecl version of this document as a string,
    # if it has been set, otherwise the default version:
    #
    #   d = REXML::Document.new('<?xml version="2.0" encoding="UTF-8"?>')
    #   d.version # => "2.0"
    #   d = REXML::Document.new('')
    #   d.version # => "1.0"
    #
    def version
      xml_decl().version
    end

    # :call-seq:
    #   encoding -> encoding_string
    #
    # Returns the XMLDecl encoding of the document,
    # if it has been set, otherwise the default encoding:
    #
    #   d = REXML::Document.new('<?xml version="1.0" encoding="UTF-16"?>')
    #   d.encoding # => "UTF-16"
    #   d = REXML::Document.new('')
    #   d.encoding # => "UTF-8"
    #
    def encoding
      xml_decl().encoding
    end

    # :call-seq:
    #   stand_alone?
    #
    # Returns the XMLDecl standalone value of the document as a string,
    # if it has been set, otherwise the default standalone value:
    #
    #   d = REXML::Document.new('<?xml standalone="yes"?>')
    #   d.stand_alone? # => "yes"
    #   d = REXML::Document.new('')
    #   d.stand_alone? # => nil
    #
    def stand_alone?
      xml_decl().stand_alone?
    end

    # :call-seq:
    #    doc.write(output=$stdout, indent=-1, transtive=false, ie_hack=false, encoding=nil)
    #    doc.write(options={:output => $stdout, :indent => -1, :transtive => false, :ie_hack => false, :encoding => nil})
    #
    # Write the XML tree out, optionally with indent.  This writes out the
    # entire XML document, including XML declarations, doctype declarations,
    # and processing instructions (if any are given).
    #
    # A controversial point is whether Document should always write the XML
    # declaration (<?xml version='1.0'?>) whether or not one is given by the
    # user (or source document).  REXML does not write one if one was not
    # specified, because it adds unnecessary bandwidth to applications such
    # as XML-RPC.
    #
    # Accept Nth argument style and options Hash style as argument.
    # The recommended style is options Hash style for one or more
    # arguments case.
    #
    # _Examples_
    #   Document.new("<a><b/></a>").write
    #
    #   output = ""
    #   Document.new("<a><b/></a>").write(output)
    #
    #   output = ""
    #   Document.new("<a><b/></a>").write(:output => output, :indent => 2)
    #
    # See also the classes in the rexml/formatters package for the proper way
    # to change the default formatting of XML output.
    #
    # _Examples_
    #
    #   output = ""
    #   tr = Transitive.new
    #   tr.write(Document.new("<a><b/></a>"), output)
    #
    # output::
    #   output an object which supports '<< string'; this is where the
    #   document will be written.
    # indent::
    #   An integer.  If -1, no indenting will be used; otherwise, the
    #   indentation will be twice this number of spaces, and children will be
    #   indented an additional amount.  For a value of 3, every item will be
    #   indented 3 more levels, or 6 more spaces (2 * 3). Defaults to -1
    # transitive::
    #   If transitive is true and indent is >= 0, then the output will be
    #   pretty-printed in such a way that the added whitespace does not affect
    #   the absolute *value* of the document -- that is, it leaves the value
    #   and number of Text nodes in the document unchanged.
    # ie_hack::
    #   This hack inserts a space before the /> on empty tags to address
    #   a limitation of Internet Explorer.  Defaults to false
    # encoding::
    #   Encoding name as String. Change output encoding to specified encoding
    #   instead of encoding in XML declaration.
    #   Defaults to nil. It means encoding in XML declaration is used.
    def write(*arguments)
      if arguments.size == 1 and arguments[0].class == Hash
        options = arguments[0]

        output     = options[:output]
        indent     = options[:indent]
        transitive = options[:transitive]
        ie_hack    = options[:ie_hack]
        encoding   = options[:encoding]
      else
        output, indent, transitive, ie_hack, encoding, = *arguments
      end

      output   ||= $stdout
      indent   ||= -1
      transitive = false if transitive.nil?
      ie_hack    = false if ie_hack.nil?
      encoding ||= xml_decl.encoding

      if encoding != 'UTF-8' && !output.kind_of?(Output)
        output = Output.new( output, encoding )
      end
      formatter = if indent > -1
          if transitive
            require_relative "formatters/transitive"
            REXML::Formatters::Transitive.new( indent, ie_hack )
          else
            REXML::Formatters::Pretty.new( indent, ie_hack )
          end
        else
          REXML::Formatters::Default.new( ie_hack )
        end
      formatter.write( self, output )
    end


    def Document::parse_stream( source, listener )
      Parsers::StreamParser.new( source, listener ).parse
    end

    # Set the entity expansion limit. By default the limit is set to 10000.
    #
    # Deprecated. Use REXML::Security.entity_expansion_limit= instead.
    def Document::entity_expansion_limit=( val )
      Security.entity_expansion_limit = val
    end

    # Get the entity expansion limit. By default the limit is set to 10000.
    #
    # Deprecated. Use REXML::Security.entity_expansion_limit= instead.
    def Document::entity_expansion_limit
      return Security.entity_expansion_limit
    end

    # Set the entity expansion limit. By default the limit is set to 10240.
    #
    # Deprecated. Use REXML::Security.entity_expansion_text_limit= instead.
    def Document::entity_expansion_text_limit=( val )
      Security.entity_expansion_text_limit = val
    end

    # Get the entity expansion limit. By default the limit is set to 10240.
    #
    # Deprecated. Use REXML::Security.entity_expansion_text_limit instead.
    def Document::entity_expansion_text_limit
      return Security.entity_expansion_text_limit
    end

    attr_reader :entity_expansion_count

    def record_entity_expansion
      @entity_expansion_count += 1
      if @entity_expansion_count > Security.entity_expansion_limit
        raise "number of entity expansions exceeded, processing aborted."
      end
    end

    def document
      self
    end

    private
    def build( source )
      Parsers::TreeParser.new( source, self ).parse
    end
  end
end
