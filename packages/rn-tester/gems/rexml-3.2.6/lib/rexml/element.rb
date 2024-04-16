# frozen_string_literal: false
require_relative "parent"
require_relative "namespace"
require_relative "attribute"
require_relative "cdata"
require_relative "xpath"
require_relative "parseexception"

module REXML
  # An implementation note about namespaces:
  # As we parse, when we find namespaces we put them in a hash and assign
  # them a unique ID.  We then convert the namespace prefix for the node
  # to the unique ID.  This makes namespace lookup much faster for the
  # cost of extra memory use.  We save the namespace prefix for the
  # context node and convert it back when we write it.
  @@namespaces = {}

  # An \REXML::Element object represents an XML element.
  #
  # An element:
  #
  # - Has a name (string).
  # - May have a parent (another element).
  # - Has zero or more children
  #   (other elements, text, CDATA, processing instructions, and comments).
  # - Has zero or more siblings
  #   (other elements, text, CDATA, processing instructions, and comments).
  # - Has zero or more named attributes.
  #
  # == In a Hurry?
  #
  # If you're somewhat familiar with XML
  # and have a particular task in mind,
  # you may want to see the
  # {tasks pages}[../doc/rexml/tasks/tocs/master_toc_rdoc.html],
  # and in particular, the
  # {tasks page for elements}[../doc/rexml/tasks/tocs/element_toc_rdoc.html].
  #
  # === Name
  #
  # An element has a name, which is initially set when the element is created:
  #
  #   e = REXML::Element.new('foo')
  #   e.name # => "foo"
  #
  # The name may be changed:
  #
  #   e.name = 'bar'
  #   e.name # => "bar"
  #
  #
  # === \Parent
  #
  # An element may have a parent.
  #
  # Its parent may be assigned explicitly when the element is created:
  #
  #   e0 = REXML::Element.new('foo')
  #   e1 = REXML::Element.new('bar', e0)
  #   e1.parent # => <foo> ... </>
  #
  # Note: the representation of an element always shows the element's name.
  # If the element has children, the representation indicates that
  # by including an ellipsis (<tt>...</tt>).
  #
  # The parent may be assigned explicitly at any time:
  #
  #   e2 = REXML::Element.new('baz')
  #   e1.parent = e2
  #   e1.parent # => <baz/>
  #
  # When an element is added as a child, its parent is set automatically:
  #
  #   e1.add_element(e0)
  #   e0.parent # => <bar> ... </>
  #
  # For an element that has no parent, method +parent+ returns +nil+.
  #
  # === Children
  #
  # An element has zero or more children.
  # The children are an ordered collection
  # of all objects whose parent is the element itself.
  #
  # The children may include any combination of elements, text, comments,
  # processing instructions, and CDATA.
  # (This example keeps things clean by controlling whitespace
  # via a +context+ setting.)
  #
  #    xml_string = <<-EOT
  #    <root>
  #      <ele_0/>
  #      text 0
  #      <!--comment 0-->
  #      <?target_0 pi_0?>
  #      <![CDATA[cdata 0]]>
  #      <ele_1/>
  #      text 1
  #      <!--comment 1-->
  #      <?target_0 pi_1?>
  #      <![CDATA[cdata 1]]>
  #    </root>
  #    EOT
  #    context = {ignore_whitespace_nodes: :all, compress_whitespace: :all}
  #    d = REXML::Document.new(xml_string, context)
  #    root = d.root
  #    root.children.size # => 10
  #    root.each {|child| p "#{child.class}: #{child}" }
  #
  # Output:
  #
  #   "REXML::Element: <ele_0/>"
  #   "REXML::Text: \n text 0\n "
  #   "REXML::Comment: comment 0"
  #   "REXML::Instruction: <?target_0 pi_0?>"
  #   "REXML::CData: cdata 0"
  #   "REXML::Element: <ele_1/>"
  #   "REXML::Text: \n text 1\n "
  #   "REXML::Comment: comment 1"
  #   "REXML::Instruction: <?target_0 pi_1?>"
  #   "REXML::CData: cdata 1"
  #
  # A child may be added using inherited methods
  # Parent#insert_before or Parent#insert_after:
  #
  #   xml_string = '<root><a/><c/><d/></root>'
  #   d = REXML::Document.new(xml_string)
  #   root = d.root
  #   c = d.root[1] # => <c/>
  #   root.insert_before(c, REXML::Element.new('b'))
  #   root.to_a # => [<a/>, <b/>, <c/>, <d/>]
  #
  # A child may be replaced using Parent#replace_child:
  #
  #   root.replace_child(c, REXML::Element.new('x'))
  #   root.to_a # => [<a/>, <b/>, <x/>, <d/>]
  #
  # A child may be removed using Parent#delete:
  #
  #   x = root[2] # => <x/>
  #   root.delete(x)
  #   root.to_a # => [<a/>, <b/>, <d/>]
  #
  # === Siblings
  #
  # An element has zero or more siblings,
  # which are the other children of the element's parent.
  #
  # In the example above, element +ele_1+ is between a CDATA sibling
  # and a text sibling:
  #
  #   ele_1 = root[5]        # => <ele_1/>
  #   ele_1.previous_sibling # => "cdata 0"
  #   ele_1.next_sibling     # => "\n text 1\n "
  #
  # === \Attributes
  #
  # An element has zero or more named attributes.
  #
  # A new element has no attributes:
  #
  #   e = REXML::Element.new('foo')
  #   e.attributes      # => {}
  #
  # Attributes may be added:
  #
  #   e.add_attribute('bar', 'baz')
  #   e.add_attribute('bat', 'bam')
  #   e.attributes.size # => 2
  #   e['bar']          # => "baz"
  #   e['bat']          # => "bam"
  #
  # An existing attribute may be modified:
  #
  #   e.add_attribute('bar', 'bad')
  #   e.attributes.size # => 2
  #   e['bar']          # => "bad"
  #
  # An existing attribute may be deleted:
  #
  #   e.delete_attribute('bar')
  #   e.attributes.size # => 1
  #   e['bar']          # => nil
  #
  # == What's Here
  #
  # To begin with, what's elsewhere?
  #
  # \Class \REXML::Element inherits from its ancestor classes:
  #
  # - REXML::Child
  # - REXML::Parent
  #
  # \REXML::Element itself and its ancestors also include modules:
  #
  # - {Enumerable}[https://docs.ruby-lang.org/en/master/Enumerable.html]
  # - REXML::Namespace
  # - REXML::Node
  # - REXML::XMLTokens
  #
  # === Methods for Creating an \Element
  #
  # ::new:: Returns a new empty element.
  # #clone:: Returns a clone of another element.
  #
  # === Methods for Attributes
  #
  # {[attribute_name]}[#method-i-5B-5D]:: Returns an attribute value.
  # #add_attribute:: Adds a new attribute.
  # #add_attributes:: Adds multiple new attributes.
  # #attribute:: Returns the attribute value for a given name and optional namespace.
  # #delete_attribute:: Removes an attribute.
  #
  # === Methods for Children
  #
  # {[index]}[#method-i-5B-5D]:: Returns the child at the given offset.
  # #add_element:: Adds an element as the last child.
  # #delete_element:: Deletes a child element.
  # #each_element:: Calls the given block with each child element.
  # #each_element_with_attribute:: Calls the given block with each child element
  #                                that meets given criteria,
  #                                which can include the attribute name.
  # #each_element_with_text:: Calls the given block with each child element
  #                           that meets given criteria,
  #                           which can include text.
  # #get_elements:: Returns an array of element children that match a given xpath.
  #
  # === Methods for \Text Children
  #
  # #add_text:: Adds a text node to the element.
  # #get_text:: Returns a text node that meets specified criteria.
  # #text:: Returns the text string from the first node that meets specified criteria.
  # #texts:: Returns an array of the text children of the element.
  # #text=:: Adds, removes, or replaces the first text child of the element
  #
  # === Methods for Other Children
  #
  # #cdatas:: Returns an array of the cdata children of the element.
  # #comments:: Returns an array of the comment children of the element.
  # #instructions:: Returns an array of the instruction children of the element.
  #
  # === Methods for Namespaces
  #
  # #add_namespace:: Adds a namespace to the element.
  # #delete_namespace:: Removes a namespace from the element.
  # #namespace:: Returns the string namespace URI for the element.
  # #namespaces:: Returns a hash of all defined namespaces in the element.
  # #prefixes:: Returns an array of the string prefixes (names)
  #             of all defined namespaces in the element
  #
  # === Methods for Querying
  #
  # #document:: Returns the document, if any, that the element belongs to.
  # #root:: Returns the most distant element (not document) ancestor of the element.
  # #root_node:: Returns the most distant ancestor of the element.
  # #xpath:: Returns the string xpath to the element
  #          relative to the most distant parent
  # #has_attributes?:: Returns whether the element has attributes.
  # #has_elements?:: Returns whether the element has elements.
  # #has_text?:: Returns whether the element has text.
  # #next_element:: Returns the next sibling that is an element.
  # #previous_element:: Returns the previous sibling that is an element.
  # #raw:: Returns whether raw mode is set for the element.
  # #whitespace:: Returns whether whitespace is respected for the element.
  # #ignore_whitespace_nodes:: Returns whether whitespace nodes
  #                            are to be ignored for the element.
  # #node_type:: Returns symbol <tt>:element</tt>.
  #
  # === One More Method
  #
  # #inspect:: Returns a string representation of the element.
  #
  # === Accessors
  #
  # #elements:: Returns the REXML::Elements object for the element.
  # #attributes:: Returns the REXML::Attributes object for the element.
  # #context:: Returns or sets the context hash for the element.
  #
  class Element < Parent
    include Namespace

    UNDEFINED = "UNDEFINED";            # The default name

    # Mechanisms for accessing attributes and child elements of this
    # element.
    attr_reader :attributes, :elements
    # The context holds information about the processing environment, such as
    # whitespace handling.
    attr_accessor :context

    # :call-seq:
    #   Element.new(name = 'UNDEFINED', parent = nil, context = nil) -> new_element
    #   Element.new(element, parent = nil, context = nil) -> new_element
    #
    # Returns a new \REXML::Element object.
    #
    # When no arguments are given,
    # returns an element with name <tt>'UNDEFINED'</tt>:
    #
    #   e = REXML::Element.new # => <UNDEFINED/>
    #   e.class                # => REXML::Element
    #   e.name                 # => "UNDEFINED"
    #
    # When only argument +name+ is given,
    # returns an element of the given name:
    #
    #   REXML::Element.new('foo') # => <foo/>
    #
    # When only argument +element+ is given, it must be an \REXML::Element object;
    # returns a shallow copy of the given element:
    #
    #   e0 = REXML::Element.new('foo')
    #   e1 = REXML::Element.new(e0) # => <foo/>
    #
    # When argument +parent+ is also given, it must be an REXML::Parent object:
    #
    #   e = REXML::Element.new('foo', REXML::Parent.new)
    #   e.parent # => #<REXML::Parent @parent=nil, @children=[<foo/>]>
    #
    # When argument +context+ is also given, it must be a hash
    # representing the context for the element;
    # see {Element Context}[../doc/rexml/context_rdoc.html]:
    #
    #   e = REXML::Element.new('foo', nil, {raw: :all})
    #   e.context # => {:raw=>:all}
    #
    def initialize( arg = UNDEFINED, parent=nil, context=nil )
      super(parent)

      @elements = Elements.new(self)
      @attributes = Attributes.new(self)
      @context = context

      if arg.kind_of? String
        self.name = arg
      elsif arg.kind_of? Element
        self.name = arg.expanded_name
        arg.attributes.each_attribute{ |attribute|
          @attributes << Attribute.new( attribute )
        }
        @context = arg.context
      end
    end

    # :call-seq:
    #   inspect -> string
    #
    # Returns a string representation of the element.
    #
    # For an element with no attributes and no children, shows the element name:
    #
    #   REXML::Element.new.inspect # => "<UNDEFINED/>"
    #
    # Shows attributes, if any:
    #
    #   e = REXML::Element.new('foo')
    #   e.add_attributes({'bar' => 0, 'baz' => 1})
    #   e.inspect # => "<foo bar='0' baz='1'/>"
    #
    # Shows an ellipsis (<tt>...</tt>), if there are child elements:
    #
    #   e.add_element(REXML::Element.new('bar'))
    #   e.add_element(REXML::Element.new('baz'))
    #   e.inspect # => "<foo bar='0' baz='1'> ... </>"
    #
    def inspect
      rv = "<#@expanded_name"

      @attributes.each_attribute do |attr|
        rv << " "
        attr.write( rv, 0 )
      end

      if children.size > 0
        rv << "> ... </>"
      else
        rv << "/>"
      end
    end

    # :call-seq:
    #   clone -> new_element
    #
    # Returns a shallow copy of the element, containing the name and attributes,
    # but not the parent or children:
    #
    #   e = REXML::Element.new('foo')
    #   e.add_attributes({'bar' => 0, 'baz' => 1})
    #   e.clone # => <foo bar='0' baz='1'/>
    #
    def clone
      self.class.new self
    end

    # :call-seq:
    #   root_node -> document or element
    #
    # Returns the most distant ancestor of +self+.
    #
    # When the element is part of a document,
    # returns the root node of the document.
    # Note that the root node is different from the document element;
    # in this example +a+ is document element and the root node is its parent:
    #
    #   d = REXML::Document.new('<a><b><c/></b></a>')
    #   top_element = d.first      # => <a> ... </>
    #   child = top_element.first  # => <b> ... </>
    #   d.root_node == d           # => true
    #   top_element.root_node == d # => true
    #   child.root_node == d       # => true
    #
    # When the element is not part of a document, but does have ancestor elements,
    # returns the most distant ancestor element:
    #
    #   e0 = REXML::Element.new('foo')
    #   e1 = REXML::Element.new('bar')
    #   e1.parent = e0
    #   e2 = REXML::Element.new('baz')
    #   e2.parent = e1
    #   e2.root_node == e0 # => true
    #
    # When the element has no ancestor elements,
    # returns +self+:
    #
    #   e = REXML::Element.new('foo')
    #   e.root_node == e # => true
    #
    # Related: #root, #document.
    #
    def root_node
      parent.nil? ? self : parent.root_node
    end

    # :call-seq:
    #   root -> element
    #
    # Returns the most distant _element_ (not document) ancestor of the element:
    #
    #   d = REXML::Document.new('<a><b><c/></b></a>')
    #   top_element = d.first
    #   child = top_element.first
    #   top_element.root == top_element # => true
    #   child.root == top_element       # => true
    #
    # For a document, returns the topmost element:
    #
    #   d.root == top_element # => true
    #
    # Related: #root_node, #document.
    #
    def root
      return elements[1] if self.kind_of? Document
      return self if parent.kind_of? Document or parent.nil?
      return parent.root
    end

    # :call-seq:
    #   document -> document or nil
    #
    # If the element is part of a document, returns that document:
    #
    #   d = REXML::Document.new('<a><b><c/></b></a>')
    #   top_element = d.first
    #   child = top_element.first
    #   top_element.document == d # => true
    #   child.document == d       # => true
    #
    # If the element is not part of a document, returns +nil+:
    #
    #   REXML::Element.new.document # => nil
    #
    # For a document, returns +self+:
    #
    #   d.document == d           # => true
    #
    # Related: #root, #root_node.
    #
    def document
      rt = root
      rt.parent if rt
    end

    # :call-seq:
    #   whitespace
    #
    # Returns +true+ if whitespace is respected for this element,
    # +false+ otherwise.
    #
    # See {Element Context}[../doc/rexml/context_rdoc.html].
    #
    # The evaluation is tested against the element's +expanded_name+,
    # and so is namespace-sensitive.
    def whitespace
      @whitespace = nil
      if @context
        if @context[:respect_whitespace]
          @whitespace = (@context[:respect_whitespace] == :all or
                         @context[:respect_whitespace].include? expanded_name)
        end
        @whitespace = false if (@context[:compress_whitespace] and
                                (@context[:compress_whitespace] == :all or
                                 @context[:compress_whitespace].include? expanded_name)
                               )
      end
      @whitespace = true unless @whitespace == false
      @whitespace
    end

    # :call-seq:
    #   ignore_whitespace_nodes
    #
    # Returns +true+ if whitespace nodes are ignored for the element.
    #
    # See {Element Context}[../doc/rexml/context_rdoc.html].
    #
    def ignore_whitespace_nodes
      @ignore_whitespace_nodes = false
      if @context
        if @context[:ignore_whitespace_nodes]
          @ignore_whitespace_nodes =
            (@context[:ignore_whitespace_nodes] == :all or
             @context[:ignore_whitespace_nodes].include? expanded_name)
        end
      end
    end

    # :call-seq:
    #   raw
    #
    # Returns +true+ if raw mode is set for the element.
    #
    # See {Element Context}[../doc/rexml/context_rdoc.html].
    #
    # The evaluation is tested against +expanded_name+, and so is namespace
    # sensitive.
    def raw
      @raw = (@context and @context[:raw] and
              (@context[:raw] == :all or
               @context[:raw].include? expanded_name))
      @raw
    end

    #once :whitespace, :raw, :ignore_whitespace_nodes

    #################################################
    # Namespaces                                    #
    #################################################

    # :call-seq:
    #   prefixes -> array_of_namespace_prefixes
    #
    # Returns an array of the string prefixes (names) of all defined namespaces
    # in the element and its ancestors:
    #
    #   xml_string = <<-EOT
    #     <root>
    #        <a xmlns:x='1' xmlns:y='2'>
    #          <b/>
    #          <c xmlns:z='3'/>
    #        </a>
    #     </root>
    #   EOT
    #   d = REXML::Document.new(xml_string, {compress_whitespace: :all})
    #   d.elements['//a'].prefixes # => ["x", "y"]
    #   d.elements['//b'].prefixes # => ["x", "y"]
    #   d.elements['//c'].prefixes # => ["x", "y", "z"]
    #
    def prefixes
      prefixes = []
      prefixes = parent.prefixes if parent
      prefixes |= attributes.prefixes
      return prefixes
    end

    # :call-seq:
    #    namespaces -> array_of_namespace_names
    #
    # Returns a hash of all defined namespaces
    # in the element and its ancestors:
    #
    #   xml_string = <<-EOT
    #     <root>
    #        <a xmlns:x='1' xmlns:y='2'>
    #          <b/>
    #          <c xmlns:z='3'/>
    #        </a>
    #     </root>
    #   EOT
    #   d = REXML::Document.new(xml_string)
    #   d.elements['//a'].namespaces # => {"x"=>"1", "y"=>"2"}
    #   d.elements['//b'].namespaces # => {"x"=>"1", "y"=>"2"}
    #   d.elements['//c'].namespaces # => {"x"=>"1", "y"=>"2", "z"=>"3"}
    #
    def namespaces
      namespaces = {}
      namespaces = parent.namespaces if parent
      namespaces = namespaces.merge( attributes.namespaces )
      return namespaces
    end

    # :call-seq:
    #   namespace(prefix = nil) -> string_uri or nil
    #
    # Returns the string namespace URI for the element,
    # possibly deriving from one of its ancestors.
    #
    #   xml_string = <<-EOT
    #     <root>
    #        <a xmlns='1' xmlns:y='2'>
    #          <b/>
    #          <c xmlns:z='3'/>
    #        </a>
    #     </root>
    #   EOT
    #   d = REXML::Document.new(xml_string)
    #   b = d.elements['//b']
    #   b.namespace      # => "1"
    #   b.namespace('y') # => "2"
    #   b.namespace('nosuch') # => nil
    #
    def namespace(prefix=nil)
      if prefix.nil?
        prefix = prefix()
      end
      if prefix == ''
        prefix = "xmlns"
      else
        prefix = "xmlns:#{prefix}" unless prefix[0,5] == 'xmlns'
      end
      ns = attributes[ prefix ]
      ns = parent.namespace(prefix) if ns.nil? and parent
      ns = '' if ns.nil? and prefix == 'xmlns'
      return ns
    end

    # :call-seq:
    #   add_namespace(prefix, uri = nil) -> self
    #
    # Adds a namespace to the element; returns +self+.
    #
    # With the single argument +prefix+,
    # adds a namespace using the given +prefix+ and the namespace URI:
    #
    #   e = REXML::Element.new('foo')
    #   e.add_namespace('bar')
    #   e.namespaces # => {"xmlns"=>"bar"}
    #
    # With both arguments +prefix+ and +uri+ given,
    # adds a namespace using both arguments:
    #
    #   e.add_namespace('baz', 'bat')
    #   e.namespaces # => {"xmlns"=>"bar", "baz"=>"bat"}
    #
    def add_namespace( prefix, uri=nil )
      unless uri
        @attributes["xmlns"] = prefix
      else
        prefix = "xmlns:#{prefix}" unless prefix =~ /^xmlns:/
        @attributes[ prefix ] = uri
      end
      self
    end

    # :call-seq:
    #   delete_namespace(namespace = 'xmlns') -> self
    #
    # Removes a namespace from the element.
    #
    # With no argument, removes the default namespace:
    #
    #   d = REXML::Document.new "<a xmlns:foo='bar' xmlns='twiddle'/>"
    #   d.to_s # => "<a xmlns:foo='bar' xmlns='twiddle'/>"
    #   d.root.delete_namespace # => <a xmlns:foo='bar'/>
    #   d.to_s # => "<a xmlns:foo='bar'/>"
    #
    # With argument +namespace+, removes the specified namespace:
    #
    #   d.root.delete_namespace('foo')
    #   d.to_s # => "<a/>"
    #
    # Does nothing if no such namespace is found:
    #
    #   d.root.delete_namespace('nosuch')
    #   d.to_s # => "<a/>"
    #
    def delete_namespace namespace="xmlns"
      namespace = "xmlns:#{namespace}" unless namespace == 'xmlns'
      attribute = attributes.get_attribute(namespace)
      attribute.remove unless attribute.nil?
      self
    end

    #################################################
    # Elements                                      #
    #################################################

    # :call-seq:
    #   add_element(name, attributes = nil) -> new_element
    #   add_element(element, attributes = nil) -> element
    #
    # Adds a child element, optionally setting attributes
    # on the added element; returns the added element.
    #
    # With string argument +name+, creates a new element with that name
    # and adds the new element as a child:
    #
    #   e0 = REXML::Element.new('foo')
    #   e0.add_element('bar')
    #   e0[0] # => <bar/>
    #
    #
    # With argument +name+ and hash argument +attributes+,
    # sets attributes on the new element:
    #
    #   e0.add_element('baz', {'bat' => '0', 'bam' => '1'})
    #   e0[1] # => <baz bat='0' bam='1'/>
    #
    # With element argument +element+, adds that element as a child:
    #
    #   e0 = REXML::Element.new('foo')
    #   e1 = REXML::Element.new('bar')
    #   e0.add_element(e1)
    #   e0[0] # => <bar/>
    #
    # With argument +element+ and hash argument +attributes+,
    # sets attributes on the added element:
    #
    #   e0.add_element(e1, {'bat' => '0', 'bam' => '1'})
    #   e0[1] # => <bar bat='0' bam='1'/>
    #
    def add_element element, attrs=nil
      raise "First argument must be either an element name, or an Element object" if element.nil?
      el = @elements.add(element)
      attrs.each do |key, value|
        el.attributes[key]=value
      end       if attrs.kind_of? Hash
      el
    end

    # :call-seq:
    #   delete_element(index) -> removed_element or nil
    #   delete_element(element) -> removed_element or nil
    #   delete_element(xpath) -> removed_element or nil
    #
    # Deletes a child element.
    #
    # When 1-based integer argument +index+ is given,
    # removes and returns the child element at that offset if it exists;
    # indexing does not include text nodes;
    # returns +nil+ if the element does not exist:
    #
    #   d = REXML::Document.new '<a><b/>text<c/></a>'
    #   a = d.root          # => <a> ... </>
    #   a.delete_element(1) # => <b/>
    #   a.delete_element(1) # => <c/>
    #   a.delete_element(1) # => nil
    #
    # When element argument +element+ is given,
    # removes and returns that child element if it exists,
    # otherwise returns +nil+:
    #
    #   d = REXML::Document.new '<a><b/>text<c/></a>'
    #   a = d.root          # => <a> ... </>
    #   c = a[2]            # => <c/>
    #   a.delete_element(c) # => <c/>
    #   a.delete_element(c) # => nil
    #
    # When xpath argument +xpath+ is given,
    # removes and returns the element at xpath if it exists,
    # otherwise returns +nil+:
    #
    #   d = REXML::Document.new '<a><b/>text<c/></a>'
    #   a = d.root              # => <a> ... </>
    #   a.delete_element('//c') # => <c/>
    #   a.delete_element('//c') # => nil
    #
    def delete_element element
      @elements.delete element
    end

    # :call-seq:
    #   has_elements?
    #
    # Returns +true+ if the element has one or more element children,
    # +false+ otherwise:
    #
    #   d = REXML::Document.new '<a><b/>text<c/></a>'
    #   a = d.root              # => <a> ... </>
    #   a.has_elements? # => true
    #   b = a[0]        # => <b/>
    #   b.has_elements? # => false
    #
    def has_elements?
      !@elements.empty?
    end

    # :call-seq:
    #   each_element_with_attribute(attr_name, value = nil, max = 0, xpath = nil) {|e| ... }
    #
    # Calls the given block with each child element that meets given criteria.
    #
    # When only string argument +attr_name+ is given,
    # calls the block with each child element that has that attribute:
    #
    #   d = REXML::Document.new '<a><b id="1"/><c id="2"/><d id="1"/><e/></a>'
    #   a = d.root
    #   a.each_element_with_attribute('id') {|e| p e }
    #
    # Output:
    #
    #   <b id='1'/>
    #   <c id='2'/>
    #   <d id='1'/>
    #
    # With argument +attr_name+ and string argument +value+ given,
    # calls the block with each child element that has that attribute
    # with that value:
    #
    #   a.each_element_with_attribute('id', '1') {|e| p e }
    #
    # Output:
    #
    #   <b id='1'/>
    #   <d id='1'/>
    #
    # With arguments +attr_name+, +value+, and integer argument +max+ given,
    # calls the block with at most +max+ child elements:
    #
    #   a.each_element_with_attribute('id', '1', 1) {|e| p e }
    #
    # Output:
    #
    #   <b id='1'/>
    #
    # With all arguments given, including +xpath+,
    # calls the block with only those child elements
    # that meet the first three criteria,
    # and also match the given +xpath+:
    #
    #   a.each_element_with_attribute('id', '1', 2, '//d') {|e| p e }
    #
    # Output:
    #
    #   <d id='1'/>
    #
    def each_element_with_attribute( key, value=nil, max=0, name=nil, &block ) # :yields: Element
      each_with_something( proc {|child|
        if value.nil?
          child.attributes[key] != nil
        else
          child.attributes[key]==value
        end
      }, max, name, &block )
    end

    # :call-seq:
    #   each_element_with_text(text = nil, max = 0, xpath = nil) {|e| ... }
    #
    # Calls the given block with each child element that meets given criteria.
    #
    # With no arguments, calls the block with each child element that has text:
    #
    #   d = REXML::Document.new '<a><b>b</b><c>b</c><d>d</d><e/></a>'
    #   a = d.root
    #   a.each_element_with_text {|e| p e }
    #
    # Output:
    #
    #   <b> ... </>
    #   <c> ... </>
    #   <d> ... </>
    #
    # With the single string argument +text+,
    # calls the block with each element that has exactly that text:
    #
    #   a.each_element_with_text('b') {|e| p e }
    #
    # Output:
    #
    #   <b> ... </>
    #   <c> ... </>
    #
    # With argument +text+ and integer argument +max+,
    # calls the block with at most +max+ elements:
    #
    #   a.each_element_with_text('b', 1) {|e| p e }
    #
    # Output:
    #
    #   <b> ... </>
    #
    # With all arguments given, including +xpath+,
    # calls the block with only those child elements
    # that meet the first two criteria,
    # and also match the given +xpath+:
    #
    #   a.each_element_with_text('b', 2, '//c') {|e| p e }
    #
    # Output:
    #
    #   <c> ... </>
    #
    def each_element_with_text( text=nil, max=0, name=nil, &block ) # :yields: Element
      each_with_something( proc {|child|
        if text.nil?
          child.has_text?
        else
          child.text == text
        end
      }, max, name, &block )
    end

    # :call-seq:
    #   each_element {|e| ... }
    #
    # Calls the given block with each child element:
    #
    #   d = REXML::Document.new '<a><b>b</b><c>b</c><d>d</d><e/></a>'
    #   a = d.root
    #   a.each_element {|e| p e }
    #
    # Output:
    #
    #   <b> ... </>
    #   <c> ... </>
    #   <d> ... </>
    #   <e/>
    #
    def each_element( xpath=nil, &block ) # :yields: Element
      @elements.each( xpath, &block )
    end

    # :call-seq:
    #   get_elements(xpath)
    #
    # Returns an array of the elements that match the given +xpath+:
    #
    #   xml_string = <<-EOT
    #   <root>
    #     <a level='1'>
    #       <a level='2'/>
    #     </a>
    #   </root>
    #   EOT
    #   d = REXML::Document.new(xml_string)
    #   d.root.get_elements('//a') # => [<a level='1'> ... </>, <a level='2'/>]
    #
    def get_elements( xpath )
      @elements.to_a( xpath )
    end

    # :call-seq:
    #   next_element
    #
    # Returns the next sibling that is an element if it exists,
    # +niL+ otherwise:
    #
    #   d = REXML::Document.new '<a><b/>text<c/></a>'
    #   d.root.elements['b'].next_element #-> <c/>
    #   d.root.elements['c'].next_element #-> nil
    #
    def next_element
      element = next_sibling
      element = element.next_sibling until element.nil? or element.kind_of? Element
      return element
    end

    # :call-seq:
    #   previous_element
    #
    # Returns the previous sibling that is an element if it exists,
    # +niL+ otherwise:
    #
    #   d = REXML::Document.new '<a><b/>text<c/></a>'
    #   d.root.elements['c'].previous_element #-> <b/>
    #   d.root.elements['b'].previous_element #-> nil
    #
    def previous_element
      element = previous_sibling
      element = element.previous_sibling until element.nil? or element.kind_of? Element
      return element
    end


    #################################################
    # Text                                          #
    #################################################

    # :call-seq:
    #   has_text? -> true or false
    #
    # Returns +true+ if the element has one or more text noded,
    # +false+ otherwise:
    #
    #   d = REXML::Document.new '<a><b/>text<c/></a>'
    #   a = d.root
    #   a.has_text? # => true
    #   b = a[0]
    #   b.has_text? # => false
    #
    def has_text?
      not text().nil?
    end

    # :call-seq:
    #   text(xpath = nil) -> text_string or nil
    #
    # Returns the text string from the first text node child
    # in a specified element, if it exists, +nil+ otherwise.
    #
    # With no argument, returns the text from the first text node in +self+:
    #
    #   d = REXML::Document.new "<p>some text <b>this is bold!</b> more text</p>"
    #   d.root.text.class # => String
    #   d.root.text       # => "some text "
    #
    # With argument +xpath+, returns text from the first text node
    # in the element that matches +xpath+:
    #
    #   d.root.text(1) # => "this is bold!"
    #
    # Note that an element may have multiple text nodes,
    # possibly separated by other non-text children, as above.
    # Even so, the returned value is the string text from the first such node.
    #
    # Note also that the text note is retrieved by method get_text,
    # and so is always normalized text.
    #
    def text( path = nil )
      rv = get_text(path)
      return rv.value unless rv.nil?
      nil
    end

    # :call-seq:
    #   get_text(xpath = nil) -> text_node or nil
    #
    # Returns the first text node child in a specified element, if it exists,
    # +nil+ otherwise.
    #
    # With no argument, returns the first text node from +self+:
    #
    #   d = REXML::Document.new "<p>some text <b>this is bold!</b> more text</p>"
    #   d.root.get_text.class # => REXML::Text
    #   d.root.get_text       # => "some text "
    #
    # With argument +xpath+, returns the first text node from the element
    # that matches +xpath+:
    #
    #   d.root.get_text(1) # => "this is bold!"
    #
    def get_text path = nil
      rv = nil
      if path
        element = @elements[ path ]
        rv = element.get_text unless element.nil?
      else
        rv = @children.find { |node| node.kind_of? Text }
      end
      return rv
    end

    # :call-seq:
    #   text = string -> string
    #   text = nil -> nil
    #
    # Adds, replaces, or removes the first text node child in the element.
    #
    # With string argument +string+,
    # creates a new \REXML::Text node containing that string,
    # honoring the current settings for whitespace and row,
    # then places the node as the first text child in the element;
    # returns +string+.
    #
    # If the element has no text child, the text node is added:
    #
    #   d = REXML::Document.new '<a><b/></a>'
    #   d.root.text = 'foo' #-> '<a><b/>foo</a>'
    #
    # If the element has a text child, it is replaced:
    #
    #   d.root.text = 'bar' #-> '<a><b/>bar</a>'
    #
    # With argument +nil+, removes the first text child:
    #
    #   d.root.text = nil   #-> '<a><b/><c/></a>'
    #
    def text=( text )
      if text.kind_of? String
        text = Text.new( text, whitespace(), nil, raw() )
      elsif !text.nil? and !text.kind_of? Text
        text = Text.new( text.to_s, whitespace(), nil, raw() )
      end
      old_text = get_text
      if text.nil?
        old_text.remove unless old_text.nil?
      else
        if old_text.nil?
          self << text
        else
          old_text.replace_with( text )
        end
      end
      return self
    end

    # :call-seq:
    #   add_text(string) -> nil
    #   add_text(text_node) -> self
    #
    # Adds text to the element.
    #
    # When string argument +string+ is given, returns +nil+.
    #
    # If the element has no child text node,
    # creates a \REXML::Text object using the string,
    # honoring the current settings for whitespace and raw,
    # then adds that node to the element:
    #
    #   d = REXML::Document.new('<a><b/></a>')
    #   a = d.root
    #   a.add_text('foo')
    #   a.to_a # => [<b/>, "foo"]
    #
    # If the element has child text nodes,
    # appends the string to the _last_ text node:
    #
    #   d = REXML::Document.new('<a>foo<b/>bar</a>')
    #   a = d.root
    #   a.add_text('baz')
    #   a.to_a # => ["foo", <b/>, "barbaz"]
    #   a.add_text('baz')
    #   a.to_a # => ["foo", <b/>, "barbazbaz"]
    #
    # When text node argument +text_node+ is given,
    # appends the node as the last text node in the element;
    # returns +self+:
    #
    #   d = REXML::Document.new('<a>foo<b/>bar</a>')
    #   a = d.root
    #   a.add_text(REXML::Text.new('baz'))
    #   a.to_a # => ["foo", <b/>, "bar", "baz"]
    #   a.add_text(REXML::Text.new('baz'))
    #   a.to_a # => ["foo", <b/>, "bar", "baz", "baz"]
    #
    def add_text( text )
      if text.kind_of? String
        if @children[-1].kind_of? Text
          @children[-1] << text
          return
        end
        text = Text.new( text, whitespace(), nil, raw() )
      end
      self << text unless text.nil?
      return self
    end

    # :call-seq:
    #   node_type -> :element
    #
    # Returns symbol <tt>:element</tt>:
    #
    #   d = REXML::Document.new('<a/>')
    #   a = d.root  # => <a/>
    #   a.node_type # => :element
    #
    def node_type
      :element
    end

    # :call-seq:
    #   xpath -> string_xpath
    #
    # Returns the string xpath to the element
    # relative to the most distant parent:
    #
    #   d = REXML::Document.new('<a><b><c/></b></a>')
    #   a = d.root # => <a> ... </>
    #   b = a[0]   # => <b> ... </>
    #   c = b[0]   # => <c/>
    #   d.xpath    # => ""
    #   a.xpath    # => "/a"
    #   b.xpath    # => "/a/b"
    #   c.xpath    # => "/a/b/c"
    #
    # If there is no parent, returns the expanded name of the element:
    #
    #   e = REXML::Element.new('foo')
    #   e.xpath    # => "foo"
    #
    def xpath
      path_elements = []
      cur = self
      path_elements << __to_xpath_helper( self )
      while cur.parent
        cur = cur.parent
        path_elements << __to_xpath_helper( cur )
      end
      return path_elements.reverse.join( "/" )
    end

    #################################################
    # Attributes                                    #
    #################################################

    # :call-seq:
    #   [index] -> object
    #   [attr_name] -> attr_value
    #   [attr_sym] -> attr_value
    #
    # With integer argument +index+ given,
    # returns the child at offset +index+, or +nil+ if none:
    #
    #   d = REXML::Document.new '><root><a/>text<b/>more<c/></root>'
    #   root = d.root
    #   (0..root.size).each do |index|
    #     node = root[index]
    #     p "#{index}: #{node} (#{node.class})"
    #   end
    #
    # Output:
    #
    #   "0: <a/> (REXML::Element)"
    #   "1: text (REXML::Text)"
    #   "2: <b/> (REXML::Element)"
    #   "3: more (REXML::Text)"
    #   "4: <c/> (REXML::Element)"
    #   "5:  (NilClass)"
    #
    # With string argument +attr_name+ given,
    # returns the string value for the given attribute name if it exists,
    # otherwise +nil+:
    #
    #   d = REXML::Document.new('<root attr="value"></root>')
    #   root = d.root
    #   root['attr']   # => "value"
    #   root['nosuch'] # => nil
    #
    # With symbol argument +attr_sym+ given,
    # returns <tt>[attr_sym.to_s]</tt>:
    #
    #   root[:attr]   # => "value"
    #   root[:nosuch] # => nil
    #
    def [](name_or_index)
      case name_or_index
      when String
        attributes[name_or_index]
      when Symbol
        attributes[name_or_index.to_s]
      else
        super
      end
    end


    # :call-seq:
    #   attribute(name, namespace = nil)
    #
    # Returns the string value for the given attribute name.
    #
    # With only argument +name+ given,
    # returns the value of the named attribute if it exists, otherwise +nil+:
    #
    #   xml_string = <<-EOT
    #     <root xmlns="ns0">
    #       <a xmlns="ns1" attr="value"></a>
    #       <b xmlns="ns2" attr="value"></b>
    #       <c attr="value"/>
    #    </root>
    #   EOT
    #   d = REXML::Document.new(xml_string)
    #   root = d.root
    #   a = root[1] # => <a xmlns='ns1' attr='value'/>
    #   a.attribute('attr') # => attr='value'
    #   a.attribute('nope') # => nil
    #
    # With arguments +name+ and +namespace+ given,
    # returns the value of the named attribute if it exists, otherwise +nil+:
    #
    #   xml_string = "<root xmlns:a='a' a:x='a:x' x='x'/>"
    #   document = REXML::Document.new(xml_string)
    #   document.root.attribute("x")      # => x='x'
    #   document.root.attribute("x", "a") # => a:x='a:x'
    #
    def attribute( name, namespace=nil )
      prefix = nil
      if namespaces.respond_to? :key
        prefix = namespaces.key(namespace) if namespace
      else
        prefix = namespaces.index(namespace) if namespace
      end
      prefix = nil if prefix == 'xmlns'

      ret_val =
        attributes.get_attribute( "#{prefix ? prefix + ':' : ''}#{name}" )

      return ret_val unless ret_val.nil?
      return nil if prefix.nil?

      # now check that prefix'es namespace is not the same as the
      # default namespace
      return nil unless ( namespaces[ prefix ] == namespaces[ 'xmlns' ] )

      attributes.get_attribute( name )

    end

    # :call-seq:
    #   has_attributes? -> true or false
    #
    # Returns +true+ if the element has attributes, +false+ otherwise:
    #
    #   d = REXML::Document.new('<root><a attr="val"/><b/></root>')
    #   a, b = *d.root
    #   a.has_attributes? # => true
    #   b.has_attributes? # => false
    #
    def has_attributes?
      return !@attributes.empty?
    end

    # :call-seq:
    #   add_attribute(name, value) -> value
    #   add_attribute(attribute) -> attribute
    #
    # Adds an attribute to this element, overwriting any existing attribute
    # by the same name.
    #
    # With string argument +name+ and object +value+ are given,
    # adds the attribute created with that name and value:
    #
    #   e = REXML::Element.new
    #   e.add_attribute('attr', 'value') # => "value"
    #   e['attr'] # => "value"
    #   e.add_attribute('attr', 'VALUE') # => "VALUE"
    #   e['attr'] # => "VALUE"
    #
    # With only attribute object +attribute+ given,
    # adds the given attribute:
    #
    #   a = REXML::Attribute.new('attr', 'value')
    #   e.add_attribute(a) # => attr='value'
    #   e['attr'] # => "value"
    #   a = REXML::Attribute.new('attr', 'VALUE')
    #   e.add_attribute(a) # => attr='VALUE'
    #   e['attr'] # => "VALUE"
    #
    def add_attribute( key, value=nil )
      if key.kind_of? Attribute
        @attributes << key
      else
        @attributes[key] = value
      end
    end

    # :call-seq:
    #   add_attributes(hash) -> hash
    #   add_attributes(array)
    #
    # Adds zero or more attributes to the element;
    # returns the argument.
    #
    # If hash argument +hash+ is given,
    # each key must be a string;
    # adds each attribute created with the key/value pair:
    #
    #   e = REXML::Element.new
    #   h = {'foo' => 'bar', 'baz' => 'bat'}
    #   e.add_attributes(h)
    #
    # If argument +array+ is given,
    # each array member must be a 2-element array <tt>[name, value];
    # each name must be a string:
    #
    #   e = REXML::Element.new
    #   a = [['foo' => 'bar'], ['baz' => 'bat']]
    #   e.add_attributes(a)
    #
    def add_attributes hash
      if hash.kind_of? Hash
        hash.each_pair {|key, value| @attributes[key] = value }
      elsif hash.kind_of? Array
        hash.each { |value| @attributes[ value[0] ] = value[1] }
      end
    end

    # :call-seq:
    #   delete_attribute(name) -> removed_attribute or nil
    #
    # Removes a named attribute if it exists;
    # returns the removed attribute if found, otherwise +nil+:
    #
    #   e = REXML::Element.new('foo')
    #   e.add_attribute('bar', 'baz')
    #   e.delete_attribute('bar') # => <bar/>
    #   e.delete_attribute('bar') # => nil
    #
    def delete_attribute(key)
      attr = @attributes.get_attribute(key)
      attr.remove unless attr.nil?
    end

    #################################################
    # Other Utilities                               #
    #################################################

    # :call-seq:
    #   cdatas -> array_of_cdata_children
    #
    # Returns a frozen array of the REXML::CData children of the element:
    #
    #   xml_string = <<-EOT
    #     <root>
    #       <![CDATA[foo]]>
    #       <![CDATA[bar]]>
    #     </root>
    #   EOT
    #   d = REXML::Document.new(xml_string)
    #   cds = d.root.cdatas      # => ["foo", "bar"]
    #   cds.frozen?              # => true
    #   cds.map {|cd| cd.class } # => [REXML::CData, REXML::CData]
    #
    def cdatas
      find_all { |child| child.kind_of? CData }.freeze
    end

    # :call-seq:
    #   comments -> array_of_comment_children
    #
    # Returns a frozen array of the REXML::Comment children of the element:
    #
    #   xml_string = <<-EOT
    #     <root>
    #       <!--foo-->
    #       <!--bar-->
    #     </root>
    #   EOT
    #   d = REXML::Document.new(xml_string)
    #   cs = d.root.comments
    #   cs.frozen?            # => true
    #   cs.map {|c| c.class } # => [REXML::Comment, REXML::Comment]
    #   cs.map {|c| c.to_s }  # => ["foo", "bar"]
    #
    def comments
      find_all { |child| child.kind_of? Comment }.freeze
    end

    # :call-seq:
    #   instructions -> array_of_instruction_children
    #
    # Returns a frozen array of the REXML::Instruction children of the element:
    #
    #   xml_string = <<-EOT
    #     <root>
    #       <?target0 foo?>
    #       <?target1 bar?>
    #     </root>
    #   EOT
    #   d = REXML::Document.new(xml_string)
    #   is = d.root.instructions
    #   is.frozen?             # => true
    #   is.map {|i| i.class } # => [REXML::Instruction, REXML::Instruction]
    #   is.map {|i| i.to_s }  # => ["<?target0 foo?>", "<?target1 bar?>"]
    #
    def instructions
      find_all { |child| child.kind_of? Instruction }.freeze
    end

    # :call-seq:
    #   texts -> array_of_text_children
    #
    # Returns a frozen array of the REXML::Text children of the element:
    #
    #   xml_string = '<root><a/>text<b/>more<c/></root>'
    #   d = REXML::Document.new(xml_string)
    #   ts = d.root.texts
    #   ts.frozen?            # => true
    #   ts.map {|t| t.class } # => [REXML::Text, REXML::Text]
    #   ts.map {|t| t.to_s }  # => ["text", "more"]
    #
    def texts
      find_all { |child| child.kind_of? Text }.freeze
    end

    # == DEPRECATED
    # See REXML::Formatters
    #
    # Writes out this element, and recursively, all children.
    # output::
    #     output an object which supports '<< string'; this is where the
    #   document will be written.
    # indent::
    #   An integer.  If -1, no indenting will be used; otherwise, the
    #   indentation will be this number of spaces, and children will be
    #   indented an additional amount.  Defaults to -1
    # transitive::
    #   If transitive is true and indent is >= 0, then the output will be
    #   pretty-printed in such a way that the added whitespace does not affect
    #   the parse tree of the document
    # ie_hack::
    #   This hack inserts a space before the /> on empty tags to address
    #   a limitation of Internet Explorer.  Defaults to false
    #
    #  out = ''
    #  doc.write( out )     #-> doc is written to the string 'out'
    #  doc.write( $stdout ) #-> doc written to the console
    def write(output=$stdout, indent=-1, transitive=false, ie_hack=false)
      Kernel.warn("#{self.class.name}.write is deprecated.  See REXML::Formatters", uplevel: 1)
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


    private
    def __to_xpath_helper node
      rv = node.expanded_name.clone
      if node.parent
        results = node.parent.find_all {|n|
          n.kind_of?(REXML::Element) and n.expanded_name == node.expanded_name
        }
        if results.length > 1
          idx = results.index( node )
          rv << "[#{idx+1}]"
        end
      end
      rv
    end

    # A private helper method
    def each_with_something( test, max=0, name=nil )
      num = 0
      @elements.each( name ){ |child|
        yield child if test.call(child) and num += 1
        return if max>0 and num == max
      }
    end
  end

  ########################################################################
  # ELEMENTS                                                             #
  ########################################################################

  # A class which provides filtering of children for Elements, and
  # XPath search support.  You are expected to only encounter this class as
  # the <tt>element.elements</tt> object.  Therefore, you are
  # _not_ expected to instantiate this yourself.
  #
  #   xml_string = <<-EOT
  #   <?xml version="1.0" encoding="UTF-8"?>
  #   <bookstore>
  #     <book category="cooking">
  #       <title lang="en">Everyday Italian</title>
  #       <author>Giada De Laurentiis</author>
  #       <year>2005</year>
  #       <price>30.00</price>
  #     </book>
  #     <book category="children">
  #       <title lang="en">Harry Potter</title>
  #       <author>J K. Rowling</author>
  #       <year>2005</year>
  #       <price>29.99</price>
  #     </book>
  #     <book category="web">
  #       <title lang="en">XQuery Kick Start</title>
  #       <author>James McGovern</author>
  #       <author>Per Bothner</author>
  #       <author>Kurt Cagle</author>
  #       <author>James Linn</author>
  #       <author>Vaidyanathan Nagarajan</author>
  #       <year>2003</year>
  #       <price>49.99</price>
  #     </book>
  #     <book category="web" cover="paperback">
  #       <title lang="en">Learning XML</title>
  #       <author>Erik T. Ray</author>
  #       <year>2003</year>
  #       <price>39.95</price>
  #     </book>
  #   </bookstore>
  #   EOT
  #   d = REXML::Document.new(xml_string)
  #   elements = d.root.elements
  #   elements # => #<REXML::Elements @element=<bookstore> ... </>>
  #
  class Elements
    include Enumerable
    # :call-seq:
    #   new(parent) -> new_elements_object
    #
    # Returns a new \Elements object with the given +parent+.
    # Does _not_ assign <tt>parent.elements = self</tt>:
    #
    #   d = REXML::Document.new(xml_string)
    #   eles = REXML::Elements.new(d.root)
    #   eles # => #<REXML::Elements @element=<bookstore> ... </>>
    #   eles == d.root.elements # => false
    #
    def initialize parent
      @element = parent
    end

    # :call-seq:
    #   parent
    #
    # Returns the parent element cited in creating the \Elements object.
    # This element is also the default starting point for searching
    # in the \Elements object.
    #
    #   d = REXML::Document.new(xml_string)
    #   elements = REXML::Elements.new(d.root)
    #   elements.parent == d.root # => true
    #
    def parent
      @element
    end

    # :call-seq:
    #   elements[index] -> element or nil
    #   elements[xpath] -> element or nil
    #   elements[n, name] -> element or nil
    #
    # Returns the first \Element object selected by the arguments,
    # if any found, or +nil+ if none found.
    #
    # Notes:
    # - The +index+ is 1-based, not 0-based, so that:
    #   - The first element has index <tt>1</tt>
    #   - The _nth_ element has index +n+.
    # - The selection ignores non-\Element nodes.
    #
    # When the single argument +index+ is given,
    # returns the element given by the index, if any; otherwise, +nil+:
    #
    #   d = REXML::Document.new(xml_string)
    #   eles = d.root.elements
    #   eles # => #<REXML::Elements @element=<bookstore> ... </>>
    #   eles[1] # => <book category='cooking'> ... </>
    #   eles.size # => 4
    #   eles[4] # => <book category='web' cover='paperback'> ... </>
    #   eles[5] # => nil
    #
    # The node at this index is not an \Element, and so is not returned:
    #
    #   eles = d.root.first.first # => <title lang='en'> ... </>
    #   eles.to_a # => ["Everyday Italian"]
    #   eles[1] # => nil
    #
    # When the single argument +xpath+ is given,
    # returns the first element found via that +xpath+, if any; otherwise, +nil+:
    #
    #   eles = d.root.elements # => #<REXML::Elements @element=<bookstore> ... </>>
    #   eles['/bookstore']                    # => <bookstore> ... </>
    #   eles['//book']                        # => <book category='cooking'> ... </>
    #   eles['//book [@category="children"]'] # => <book category='children'> ... </>
    #   eles['/nosuch']                       # => nil
    #   eles['//nosuch']                      # => nil
    #   eles['//book [@category="nosuch"]']   # => nil
    #   eles['.']                             # => <bookstore> ... </>
    #   eles['..'].class                      # => REXML::Document
    #
    # With arguments +n+ and +name+ given,
    # returns the _nth_ found element that has the given +name+,
    # or +nil+ if there is no such _nth_ element:
    #
    #   eles = d.root.elements # => #<REXML::Elements @element=<bookstore> ... </>>
    #   eles[1, 'book'] # => <book category='cooking'> ... </>
    #   eles[4, 'book'] # => <book category='web' cover='paperback'> ... </>
    #   eles[5, 'book'] # => nil
    #
    def []( index, name=nil)
      if index.kind_of? Integer
        raise "index (#{index}) must be >= 1" if index < 1
        name = literalize(name) if name
        num = 0
        @element.find { |child|
          child.kind_of? Element and
          (name.nil? ? true : child.has_name?( name )) and
          (num += 1) == index
        }
      else
        return XPath::first( @element, index )
        #{ |element|
        #       return element if element.kind_of? Element
        #}
        #return nil
      end
    end

    # :call-seq:
    #  elements[] = index, replacement_element -> replacement_element or nil
    #
    # Replaces or adds an element.
    #
    # When <tt>eles[index]</tt> exists, replaces it with +replacement_element+
    # and returns +replacement_element+:
    #
    #   d = REXML::Document.new(xml_string)
    #   eles = d.root.elements # => #<REXML::Elements @element=<bookstore> ... </>>
    #   eles[1] # => <book category='cooking'> ... </>
    #   eles[1] = REXML::Element.new('foo')
    #   eles[1] # => <foo/>
    #
    # Does nothing (or raises an exception)
    # if +replacement_element+ is not an \Element:
    #   eles[2] # => <book category='web' cover='paperback'> ... </>
    #   eles[2] = REXML::Text.new('bar')
    #   eles[2] # => <book category='web' cover='paperback'> ... </>
    #
    # When <tt>eles[index]</tt> does not exist,
    # adds +replacement_element+ to the element and returns
    #
    #   d = REXML::Document.new(xml_string)
    #   eles = d.root.elements # => #<REXML::Elements @element=<bookstore> ... </>>
    #   eles.size # => 4
    #   eles[50] = REXML::Element.new('foo') # => <foo/>
    #   eles.size # => 5
    #   eles[5] # => <foo/>
    #
    # Does nothing (or raises an exception)
    # if +replacement_element+ is not an \Element:
    #
    #   eles[50] = REXML::Text.new('bar') # => "bar"
    #   eles.size # => 5
    #
    def []=( index, element )
      previous = self[index]
      if previous.nil?
        @element.add element
      else
        previous.replace_with element
      end
      return previous
    end

    # :call-seq:
    #   empty? -> true or false
    #
    # Returns +true+ if there are no children, +false+ otherwise.
    #
    #   d = REXML::Document.new('')
    #   d.elements.empty? # => true
    #   d = REXML::Document.new(xml_string)
    #   d.elements.empty? # => false
    #
    def empty?
      @element.find{ |child| child.kind_of? Element}.nil?
    end

    # :call-seq:
    #   index(element)
    #
    # Returns the 1-based index of the given +element+, if found;
    # otherwise, returns -1:
    #
    #   d = REXML::Document.new(xml_string)
    #   elements = d.root.elements
    #   ele_1, ele_2, ele_3, ele_4 = *elements
    #   elements.index(ele_4) # => 4
    #   elements.delete(ele_3)
    #   elements.index(ele_4) # => 3
    #   elements.index(ele_3) # => -1
    #
    def index element
      rv = 0
      found = @element.find do |child|
        child.kind_of? Element and
        (rv += 1) and
        child == element
      end
      return rv if found == element
      return -1
    end

    # :call-seq:
    #   delete(index) -> removed_element or nil
    #   delete(element) -> removed_element or nil
    #   delete(xpath) -> removed_element or nil
    #
    # Removes an element; returns the removed element, or +nil+ if none removed.
    #
    # With integer argument +index+ given,
    # removes the child element at that offset:
    #
    #   d = REXML::Document.new(xml_string)
    #   elements = d.root.elements
    #   elements.size # => 4
    #   elements[2] # => <book category='children'> ... </>
    #   elements.delete(2) # => <book category='children'> ... </>
    #   elements.size # => 3
    #   elements[2] # => <book category='web'> ... </>
    #   elements.delete(50) # => nil
    #
    # With element argument +element+ given,
    # removes that child element:
    #
    #   d = REXML::Document.new(xml_string)
    #   elements = d.root.elements
    #   ele_1, ele_2, ele_3, ele_4 = *elements
    #   elements.size # => 4
    #   elements[2] # => <book category='children'> ... </>
    #   elements.delete(ele_2) # => <book category='children'> ... </>
    #   elements.size # => 3
    #   elements[2] # => <book category='web'> ... </>
    #   elements.delete(ele_2) # => nil
    #
    # With string argument +xpath+ given,
    # removes the first element found via that xpath:
    #
    #   d = REXML::Document.new(xml_string)
    #   elements = d.root.elements
    #   elements.delete('//book') # => <book category='cooking'> ... </>
    #   elements.delete('//book [@category="children"]') # => <book category='children'> ... </>
    #   elements.delete('//nosuch') # => nil
    #
    def delete element
      if element.kind_of? Element
        @element.delete element
      else
        el = self[element]
        el.remove if el
      end
    end

    # :call-seq:
    #   delete_all(xpath)
    #
    # Removes all elements found via the given +xpath+;
    # returns the array of removed elements, if any, else +nil+.
    #
    #   d = REXML::Document.new(xml_string)
    #   elements = d.root.elements
    #   elements.size # => 4
    #   deleted_elements = elements.delete_all('//book [@category="web"]')
    #   deleted_elements.size # => 2
    #   elements.size # => 2
    #   deleted_elements = elements.delete_all('//book')
    #   deleted_elements.size # => 2
    #   elements.size # => 0
    #   elements.delete_all('//book') # => []
    #
    def delete_all( xpath )
      rv = []
      XPath::each( @element, xpath) {|element|
        rv << element if element.kind_of? Element
      }
      rv.each do |element|
        @element.delete element
        element.remove
      end
      return rv
    end

    # :call-seq:
    #   add -> new_element
    #   add(name) -> new_element
    #   add(element) -> element
    #
    # Adds an element; returns the element added.
    #
    # With no argument, creates and adds a new element.
    # The new element has:
    #
    # - No name.
    # - \Parent from the \Elements object.
    # - Context from the that parent.
    #
    # Example:
    #
    #   d = REXML::Document.new(xml_string)
    #   elements = d.root.elements
    #   parent = elements.parent     # => <bookstore> ... </>
    #   parent.context = {raw: :all}
    #   elements.size                # => 4
    #   new_element = elements.add   # => </>
    #   elements.size                # => 5
    #   new_element.name             # => nil
    #   new_element.parent           # => <bookstore> ... </>
    #   new_element.context          # => {:raw=>:all}
    #
    # With string argument +name+, creates and adds a new element.
    # The new element has:
    #
    # - Name +name+.
    # - \Parent from the \Elements object.
    # - Context from the that parent.
    #
    # Example:
    #
    #   d = REXML::Document.new(xml_string)
    #   elements = d.root.elements
    #   parent = elements.parent          # => <bookstore> ... </>
    #   parent.context = {raw: :all}
    #   elements.size                     # => 4
    #   new_element = elements.add('foo') # => <foo/>
    #   elements.size                     # => 5
    #   new_element.name                  # => "foo"
    #   new_element.parent                # => <bookstore> ... </>
    #   new_element.context               # => {:raw=>:all}
    #
    # With argument +element+,
    # creates and adds a clone of the given +element+.
    # The new element has name, parent, and context from the given +element+.
    #
    #   d = REXML::Document.new(xml_string)
    #   elements = d.root.elements
    #   elements.size                 # => 4
    #   e0 = REXML::Element.new('foo')
    #   e1 = REXML::Element.new('bar', e0, {raw: :all})
    #   element = elements.add(e1) # => <bar/>
    #   elements.size                 # => 5
    #   element.name                  # => "bar"
    #   element.parent                # => <bookstore> ... </>
    #   element.context               # => {:raw=>:all}
    #
    def add element=nil
      if element.nil?
        Element.new("", self, @element.context)
      elsif not element.kind_of?(Element)
        Element.new(element, self, @element.context)
      else
        @element << element
        element.context = @element.context
        element
      end
    end

    alias :<< :add

    # :call-seq:
    #    each(xpath = nil) {|element| ... } -> self
    #
    # Iterates over the elements.
    #
    # With no argument, calls the block with each element:
    #
    #   d = REXML::Document.new(xml_string)
    #   elements = d.root.elements
    #   elements.each {|element| p element }
    #
    # Output:
    #
    #   <book category='cooking'> ... </>
    #   <book category='children'> ... </>
    #   <book category='web'> ... </>
    #   <book category='web' cover='paperback'> ... </>
    #
    # With argument +xpath+, calls the block with each element
    # that matches the given +xpath+:
    #
    #   elements.each('//book [@category="web"]') {|element| p element }
    #
    # Output:
    #
    #   <book category='web'> ... </>
    #   <book category='web' cover='paperback'> ... </>
    #
    def each( xpath=nil )
      XPath::each( @element, xpath ) {|e| yield e if e.kind_of? Element }
    end

    # :call-seq:
    #   collect(xpath = nil) {|element| ... } -> array
    #
    # Iterates over the elements; returns the array of block return values.
    #
    # With no argument, iterates over all elements:
    #
    #   d = REXML::Document.new(xml_string)
    #   elements = d.root.elements
    #   elements.collect {|element| element.size } # => [9, 9, 17, 9]
    #
    # With argument +xpath+, iterates over elements that match
    # the given +xpath+:
    #
    #   xpath = '//book [@category="web"]'
    #   elements.collect(xpath) {|element| element.size } # => [17, 9]
    #
    def collect( xpath=nil )
      collection = []
      XPath::each( @element, xpath ) {|e|
        collection << yield(e)  if e.kind_of?(Element)
      }
      collection
    end

    # :call-seq:
    #   inject(xpath = nil, initial = nil) -> object
    #
    # Calls the block with elements; returns the last block return value.
    #
    # With no argument, iterates over the elements, calling the block
    # <tt>elements.size - 1</tt> times.
    #
    # - The first call passes the first and second elements.
    # - The second call passes the first block return value and the third element.
    # - The third call passes the second block return value and the fourth element.
    # - And so on.
    #
    # In this example, the block returns the passed element,
    # which is then the object argument to the next call:
    #
    #   d = REXML::Document.new(xml_string)
    #   elements = d.root.elements
    #   elements.inject do |object, element|
    #     p [elements.index(object), elements.index(element)]
    #     element
    #   end
    #
    # Output:
    #
    #   [1, 2]
    #   [2, 3]
    #   [3, 4]
    #
    # With the single argument +xpath+, calls the block only with
    # elements matching that xpath:
    #
    #   elements.inject('//book [@category="web"]') do |object, element|
    #     p [elements.index(object), elements.index(element)]
    #     element
    #   end
    #
    # Output:
    #
    #  [3, 4]
    #
    # With argument +xpath+ given as +nil+
    # and argument +initial+ also given,
    # calls the block once for each element.
    #
    # - The first call passes the +initial+ and the first element.
    # - The second call passes the first block return value and the second element.
    # - The third call passes the second block return value and the third element.
    # - And so on.
    #
    # In this example, the first object index is <tt>-1</tt>
    #
    #   elements.inject(nil, 'Initial') do |object, element|
    #     p [elements.index(object), elements.index(element)]
    #     element
    #   end
    #
    # Output:
    #
    #   [-1, 1]
    #   [1, 2]
    #   [2, 3]
    #   [3, 4]
    #
    # In this form the passed object can be used as an accumulator:
    #
    #   elements.inject(nil, 0) do |total, element|
    #     total += element.size
    #   end # => 44
    #
    # With both arguments +xpath+ and +initial+ are given,
    # calls the block only with elements matching that xpath:
    #
    #   elements.inject('//book [@category="web"]', 0) do |total, element|
    #     total += element.size
    #   end # => 26
    #
    def inject( xpath=nil, initial=nil )
      first = true
      XPath::each( @element, xpath ) {|e|
        if (e.kind_of? Element)
          if (first and initial == nil)
            initial = e
            first = false
          else
            initial = yield( initial, e ) if e.kind_of? Element
          end
        end
      }
      initial
    end

    # :call-seq:
    #   size -> integer
    #
    # Returns the count of \Element children:
    #
    #   d = REXML::Document.new '<a>sean<b/>elliott<b/>russell<b/></a>'
    #   d.root.elements.size # => 3 # Three elements.
    #   d.root.size          # => 6 # Three elements plus three text nodes..
    #
    def size
      count = 0
      @element.each {|child| count+=1 if child.kind_of? Element }
      count
    end

    # :call-seq:
    #   to_a(xpath = nil) -> array_of_elements
    #
    # Returns an array of element children (not including non-element children).
    #
    # With no argument, returns an array of all element children:
    #
    #   d = REXML::Document.new '<a>sean<b/>elliott<c/></a>'
    #   elements = d.root.elements
    #   elements.to_a # => [<b/>, <c/>]               # Omits non-element children.
    #   children = d.root.children
    #   children # => ["sean", <b/>, "elliott", <c/>] # Includes non-element children.
    #
    # With argument +xpath+, returns an array of element children
    # that match the xpath:
    #
    #   elements.to_a('//c') # => [<c/>]
    #
    def to_a( xpath=nil )
      rv = XPath.match( @element, xpath )
      return rv.find_all{|e| e.kind_of? Element} if xpath
      rv
    end

    private
    # Private helper class.  Removes quotes from quoted strings
    def literalize name
      name = name[1..-2] if name[0] == ?' or name[0] == ?"               #'
      name
    end
  end

  ########################################################################
  # ATTRIBUTES                                                           #
  ########################################################################

  # A class that defines the set of Attributes of an Element and provides
  # operations for accessing elements in that set.
  class Attributes < Hash

    # :call-seq:
    #   new(element)
    #
    # Creates and returns a new \REXML::Attributes object.
    # The element given by argument +element+ is stored,
    # but its own attributes are not modified:
    #
    #   ele = REXML::Element.new('foo')
    #   attrs = REXML::Attributes.new(ele)
    #   attrs.object_id == ele.attributes.object_id # => false
    #
    # Other instance methods in class \REXML::Attributes may refer to:
    #
    # - +element.document+.
    # - +element.prefix+.
    # - +element.expanded_name+.
    #
    def initialize element
      @element = element
    end

    # :call-seq:
    #   [name] -> attribute_value or nil
    #
    # Returns the value for the attribute given by +name+,
    # if it exists; otherwise +nil+.
    # The value returned is the unnormalized attribute value,
    # with entities expanded:
    #
    #   xml_string = <<-EOT
    #     <root xmlns:foo="http://foo" xmlns:bar="http://bar">
    #        <ele foo:att='1' bar:att='2' att='&lt;'/>
    #     </root>
    #   EOT
    #   d = REXML::Document.new(xml_string)
    #   ele = d.elements['//ele'] # => <a foo:att='1' bar:att='2' att='&lt;'/>
    #   ele.attributes['att']     # => "<"
    #   ele.attributes['bar:att'] # => "2"
    #   ele.attributes['nosuch']  # => nil
    #
    # Related: get_attribute (returns an \Attribute object).
    #
    def [](name)
      attr = get_attribute(name)
      return attr.value unless attr.nil?
      return nil
    end

    # :call-seq:
    #   to_a -> array_of_attribute_objects
    #
    # Returns an array of \REXML::Attribute objects representing
    # the attributes:
    #
    #   xml_string = <<-EOT
    #     <root xmlns:foo="http://foo" xmlns:bar="http://bar">
    #        <ele foo:att='1' bar:att='2' att='&lt;'/>
    #     </root>
    #   EOT
    #   d = REXML::Document.new(xml_string)
    #   ele = d.root.elements['//ele']   # => <a foo:att='1' bar:att='2' att='&lt;'/>
    #   attrs = ele.attributes.to_a      # => [foo:att='1', bar:att='2', att='&lt;']
    #   attrs.first.class                # => REXML::Attribute
    #
    def to_a
      enum_for(:each_attribute).to_a
    end

    # :call-seq:
    #   length
    #
    # Returns the count of attributes:
    #
    #   xml_string = <<-EOT
    #     <root xmlns:foo="http://foo" xmlns:bar="http://bar">
    #        <ele foo:att='1' bar:att='2' att='&lt;'/>
    #     </root>
    #   EOT
    #   d = REXML::Document.new(xml_string)
    #   ele = d.root.elements['//ele']   # => <a foo:att='1' bar:att='2' att='&lt;'/>
    #   ele.attributes.length # => 3
    #
    def length
      c = 0
      each_attribute { c+=1 }
      c
    end
    alias :size :length

    # :call-seq:
    #   each_attribute {|attr| ... }
    #
    # Calls the given block with each \REXML::Attribute object:
    #
    #   xml_string = <<-EOT
    #     <root xmlns:foo="http://foo" xmlns:bar="http://bar">
    #        <ele foo:att='1' bar:att='2' att='&lt;'/>
    #     </root>
    #   EOT
    #   d = REXML::Document.new(xml_string)
    #   ele = d.root.elements['//ele']   # => <a foo:att='1' bar:att='2' att='&lt;'/>
    #   ele.attributes.each_attribute do |attr|
    #     p [attr.class, attr]
    #   end
    #
    # Output:
    #
    #   [REXML::Attribute, foo:att='1']
    #   [REXML::Attribute, bar:att='2']
    #   [REXML::Attribute, att='&lt;']
    #
    def each_attribute # :yields: attribute
      return to_enum(__method__) unless block_given?
      each_value do |val|
        if val.kind_of? Attribute
          yield val
        else
          val.each_value { |atr| yield atr }
        end
      end
    end

    # :call-seq:
    #   each {|expanded_name, value| ... }
    #
    # Calls the given block with each expanded-name/value pair:
    #
    #   xml_string = <<-EOT
    #     <root xmlns:foo="http://foo" xmlns:bar="http://bar">
    #        <ele foo:att='1' bar:att='2' att='&lt;'/>
    #     </root>
    #   EOT
    #   d = REXML::Document.new(xml_string)
    #   ele = d.root.elements['//ele']   # => <a foo:att='1' bar:att='2' att='&lt;'/>
    #   ele.attributes.each do |expanded_name, value|
    #     p [expanded_name, value]
    #   end
    #
    # Output:
    #
    #   ["foo:att", "1"]
    #   ["bar:att", "2"]
    #   ["att", "<"]
    #
    def each
      return to_enum(__method__) unless block_given?
      each_attribute do |attr|
        yield [attr.expanded_name, attr.value]
      end
    end

    # :call-seq:
    #   get_attribute(name) -> attribute_object or nil
    #
    # Returns the \REXML::Attribute object for the given +name+:
    #
    #   xml_string = <<-EOT
    #     <root xmlns:foo="http://foo" xmlns:bar="http://bar">
    #        <ele foo:att='1' bar:att='2' att='&lt;'/>
    #     </root>
    #   EOT
    #   d = REXML::Document.new(xml_string)
    #   ele = d.root.elements['//ele'] # => <a foo:att='1' bar:att='2' att='&lt;'/>
    #   attrs = ele.attributes
    #   attrs.get_attribute('foo:att')       # => foo:att='1'
    #   attrs.get_attribute('foo:att').class # => REXML::Attribute
    #   attrs.get_attribute('bar:att')       # => bar:att='2'
    #   attrs.get_attribute('att')           # => att='&lt;'
    #   attrs.get_attribute('nosuch')        # => nil
    #
    def get_attribute( name )
      attr = fetch( name, nil )
      if attr.nil?
        return nil if name.nil?
        # Look for prefix
        name =~ Namespace::NAMESPLIT
        prefix, n = $1, $2
        if prefix
          attr = fetch( n, nil )
          # check prefix
          if attr == nil
          elsif attr.kind_of? Attribute
            return attr if prefix == attr.prefix
          else
            attr = attr[ prefix ]
            return attr
          end
        end
        element_document = @element.document
        if element_document and element_document.doctype
          expn = @element.expanded_name
          expn = element_document.doctype.name if expn.size == 0
          attr_val = element_document.doctype.attribute_of(expn, name)
          return Attribute.new( name, attr_val ) if attr_val
        end
        return nil
      end
      if attr.kind_of? Hash
        attr = attr[ @element.prefix ]
      end
      return attr
    end

    # :call-seq:
    #   [name] = value -> value
    #
    # When +value+ is non-+nil+,
    # assigns that to the attribute for the given +name+,
    # overwriting the previous value if it exists:
    #
    #   xml_string = <<-EOT
    #     <root xmlns:foo="http://foo" xmlns:bar="http://bar">
    #        <ele foo:att='1' bar:att='2' att='&lt;'/>
    #     </root>
    #   EOT
    #   d = REXML::Document.new(xml_string)
    #   ele = d.root.elements['//ele'] # => <a foo:att='1' bar:att='2' att='&lt;'/>
    #   attrs = ele.attributes
    #   attrs['foo:att'] = '2' # => "2"
    #   attrs['baz:att'] = '3' # => "3"
    #
    # When +value+ is +nil+, deletes the attribute if it exists:
    #
    #   attrs['baz:att'] = nil
    #   attrs.include?('baz:att') # => false
    #
    def []=( name, value )
      if value.nil?             # Delete the named attribute
        attr = get_attribute(name)
        delete attr
        return
      end

      unless value.kind_of? Attribute
        if @element.document and @element.document.doctype
          value = Text::normalize( value, @element.document.doctype )
        else
          value = Text::normalize( value, nil )
        end
        value = Attribute.new(name, value)
      end
      value.element = @element
      old_attr = fetch(value.name, nil)
      if old_attr.nil?
        store(value.name, value)
      elsif old_attr.kind_of? Hash
        old_attr[value.prefix] = value
      elsif old_attr.prefix != value.prefix
        # Check for conflicting namespaces
        if value.prefix != "xmlns" and old_attr.prefix != "xmlns"
          old_namespace = old_attr.namespace
          new_namespace = value.namespace
          if old_namespace == new_namespace
            raise ParseException.new(
                    "Namespace conflict in adding attribute \"#{value.name}\": "+
                    "Prefix \"#{old_attr.prefix}\" = \"#{old_namespace}\" and "+
                    "prefix \"#{value.prefix}\" = \"#{new_namespace}\"")
          end
        end
        store value.name, {old_attr.prefix => old_attr,
                           value.prefix    => value}
      else
        store value.name, value
      end
      return @element
    end

    # :call-seq:
    #   prefixes -> array_of_prefix_strings
    #
    # Returns an array of prefix strings in the attributes.
    # The array does not include the default
    # namespace declaration, if one exists.
    #
    #   xml_string = '<a xmlns="foo" xmlns:x="bar" xmlns:y="twee" z="glorp"/>'
    #   d = REXML::Document.new(xml_string)
    #   d.root.attributes.prefixes # => ["x", "y"]
    #
    def prefixes
      ns = []
      each_attribute do |attribute|
        ns << attribute.name if attribute.prefix == 'xmlns'
      end
      if @element.document and @element.document.doctype
        expn = @element.expanded_name
        expn = @element.document.doctype.name if expn.size == 0
        @element.document.doctype.attributes_of(expn).each {
          |attribute|
          ns << attribute.name if attribute.prefix == 'xmlns'
        }
      end
      ns
    end

    # :call-seq:
    #   namespaces
    #
    # Returns a hash of name/value pairs for the namespaces:
    #
    #   xml_string = '<a xmlns="foo" xmlns:x="bar" xmlns:y="twee" z="glorp"/>'
    #   d = REXML::Document.new(xml_string)
    #   d.root.attributes.namespaces # => {"xmlns"=>"foo", "x"=>"bar", "y"=>"twee"}
    #
    def namespaces
      namespaces = {}
      each_attribute do |attribute|
        namespaces[attribute.name] = attribute.value if attribute.prefix == 'xmlns' or attribute.name == 'xmlns'
      end
      if @element.document and @element.document.doctype
        expn = @element.expanded_name
        expn = @element.document.doctype.name if expn.size == 0
        @element.document.doctype.attributes_of(expn).each {
          |attribute|
          namespaces[attribute.name] = attribute.value if attribute.prefix == 'xmlns' or attribute.name == 'xmlns'
        }
      end
      namespaces
    end

    # :call-seq:
    #    delete(name) -> element
    #    delete(attribute) -> element
    #
    # Removes a specified attribute if it exists;
    # returns the attributes' element.
    #
    # When string argument +name+ is given,
    # removes the attribute of that name if it exists:
    #
    #   xml_string = <<-EOT
    #     <root xmlns:foo="http://foo" xmlns:bar="http://bar">
    #        <ele foo:att='1' bar:att='2' att='&lt;'/>
    #     </root>
    #   EOT
    #   d = REXML::Document.new(xml_string)
    #   ele = d.root.elements['//ele'] # => <a foo:att='1' bar:att='2' att='&lt;'/>
    #   attrs = ele.attributes
    #   attrs.delete('foo:att') # => <ele bar:att='2' att='&lt;'/>
    #   attrs.delete('foo:att') # => <ele bar:att='2' att='&lt;'/>
    #
    # When attribute argument +attribute+ is given,
    # removes that attribute if it exists:
    #
    #   attr = REXML::Attribute.new('bar:att', '2')
    #   attrs.delete(attr) # => <ele att='&lt;'/> # => <ele att='&lt;'/>
    #   attrs.delete(attr) # => <ele att='&lt;'/> # => <ele/>
    #
    def delete( attribute )
      name = nil
      prefix = nil
      if attribute.kind_of? Attribute
        name = attribute.name
        prefix = attribute.prefix
      else
        attribute =~ Namespace::NAMESPLIT
        prefix, name = $1, $2
        prefix = '' unless prefix
      end
      old = fetch(name, nil)
      if old.kind_of? Hash # the supplied attribute is one of many
        old.delete(prefix)
        if old.size == 1
          repl = nil
          old.each_value{|v| repl = v}
          store name, repl
        end
      elsif old.nil?
        return @element
      else # the supplied attribute is a top-level one
        super(name)
      end
      @element
    end

    # :call-seq:
    #   add(attribute) -> attribute
    #
    # Adds attribute +attribute+, replacing the previous
    # attribute of the same name if it exists;
    # returns +attribute+:
    #
    #   xml_string = <<-EOT
    #     <root xmlns:foo="http://foo" xmlns:bar="http://bar">
    #        <ele foo:att='1' bar:att='2' att='&lt;'/>
    #     </root>
    #   EOT
    #   d = REXML::Document.new(xml_string)
    #   ele = d.root.elements['//ele'] # => <a foo:att='1' bar:att='2' att='&lt;'/>
    #   attrs = ele.attributes
    #   attrs # => {"att"=>{"foo"=>foo:att='1', "bar"=>bar:att='2', ""=>att='&lt;'}}
    #   attrs.add(REXML::Attribute.new('foo:att', '2')) # => foo:att='2'
    #   attrs.add(REXML::Attribute.new('baz', '3')) # => baz='3'
    #   attrs.include?('baz') # => true
    #
    def add( attribute )
      self[attribute.name] = attribute
    end

    alias :<< :add

    # :call-seq:
    #   delete_all(name) -> array_of_removed_attributes
    #
    # Removes all attributes matching the given +name+;
    # returns an array of the removed attributes:
    #
    #   xml_string = <<-EOT
    #     <root xmlns:foo="http://foo" xmlns:bar="http://bar">
    #        <ele foo:att='1' bar:att='2' att='&lt;'/>
    #     </root>
    #   EOT
    #   d = REXML::Document.new(xml_string)
    #   ele = d.root.elements['//ele'] # => <a foo:att='1' bar:att='2' att='&lt;'/>
    #   attrs = ele.attributes
    #   attrs.delete_all('att') # => [att='&lt;']
    #
    def delete_all( name )
      rv = []
      each_attribute { |attribute|
        rv << attribute if attribute.expanded_name == name
      }
      rv.each{ |attr| attr.remove }
      return rv
    end

    # :call-seq:
    #   get_attribute_ns(namespace, name)
    #
    # Returns the \REXML::Attribute object among the attributes
    # that matches the given +namespace+ and +name+:
    #
    #   xml_string = <<-EOT
    #     <root xmlns:foo="http://foo" xmlns:bar="http://bar">
    #        <ele foo:att='1' bar:att='2' att='&lt;'/>
    #     </root>
    #   EOT
    #   d = REXML::Document.new(xml_string)
    #   ele = d.root.elements['//ele'] # => <a foo:att='1' bar:att='2' att='&lt;'/>
    #   attrs = ele.attributes
    #   attrs.get_attribute_ns('http://foo', 'att')    # => foo:att='1'
    #   attrs.get_attribute_ns('http://foo', 'nosuch') # => nil
    #
    def get_attribute_ns(namespace, name)
      result = nil
      each_attribute() { |attribute|
        if name == attribute.name &&
          namespace == attribute.namespace() &&
          ( !namespace.empty? || !attribute.fully_expanded_name.index(':') )
          # foo will match xmlns:foo, but only if foo isn't also an attribute
          result = attribute if !result or !namespace.empty? or
                                !attribute.fully_expanded_name.index(':')
        end
      }
      result
    end
  end
end
