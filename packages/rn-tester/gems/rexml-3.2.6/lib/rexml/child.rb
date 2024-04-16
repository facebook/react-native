# frozen_string_literal: false
require_relative "node"

module REXML
  ##
  # A Child object is something contained by a parent, and this class
  # contains methods to support that.  Most user code will not use this
  # class directly.
  class Child
    include Node
    attr_reader :parent         # The Parent of this object

    # Constructor.  Any inheritors of this class should call super to make
    # sure this method is called.
    # parent::
    #   if supplied, the parent of this child will be set to the
    #   supplied value, and self will be added to the parent
    def initialize( parent = nil )
      @parent = nil
      # Declare @parent, but don't define it.  The next line sets the
      # parent.
      parent.add( self ) if parent
    end

    # Replaces this object with another object.  Basically, calls
    # Parent.replace_child
    #
    # Returns:: self
    def replace_with( child )
      @parent.replace_child( self, child )
      self
    end

    # Removes this child from the parent.
    #
    # Returns:: self
    def remove
      unless @parent.nil?
        @parent.delete self
      end
      self
    end

    # Sets the parent of this child to the supplied argument.
    #
    # other::
    #   Must be a Parent object.  If this object is the same object as the
    #   existing parent of this child, no action is taken. Otherwise, this
    #   child is removed from the current parent (if one exists), and is added
    #   to the new parent.
    # Returns:: The parent added
    def parent=( other )
      return @parent if @parent == other
      @parent.delete self if defined? @parent and @parent
      @parent = other
    end

    alias :next_sibling :next_sibling_node
    alias :previous_sibling :previous_sibling_node

    # Sets the next sibling of this child.  This can be used to insert a child
    # after some other child.
    #  a = Element.new("a")
    #  b = a.add_element("b")
    #  c = Element.new("c")
    #  b.next_sibling = c
    #  # => <a><b/><c/></a>
    def next_sibling=( other )
      parent.insert_after self, other
    end

    # Sets the previous sibling of this child.  This can be used to insert a
    # child before some other child.
    #  a = Element.new("a")
    #  b = a.add_element("b")
    #  c = Element.new("c")
    #  b.previous_sibling = c
    #  # => <a><b/><c/></a>
    def previous_sibling=(other)
      parent.insert_before self, other
    end

    # Returns:: the document this child belongs to, or nil if this child
    # belongs to no document
    def document
      return parent.document unless parent.nil?
      nil
    end

    # This doesn't yet handle encodings
    def bytes
      document.encoding

      to_s
    end
  end
end
