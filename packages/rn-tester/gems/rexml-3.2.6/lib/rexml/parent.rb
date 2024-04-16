# frozen_string_literal: false
require_relative "child"

module REXML
  # A parent has children, and has methods for accessing them.  The Parent
  # class is never encountered except as the superclass for some other
  # object.
  class Parent < Child
    include Enumerable

    # Constructor
    # @param parent if supplied, will be set as the parent of this object
    def initialize parent=nil
      super(parent)
      @children = []
    end

    def add( object )
      object.parent = self
      @children << object
      object
    end

    alias :push :add
    alias :<< :push

    def unshift( object )
      object.parent = self
      @children.unshift object
    end

    def delete( object )
      found = false
      @children.delete_if {|c| c.equal?(object) and found = true }
      object.parent = nil if found
      found ? object : nil
    end

    def each(&block)
      @children.each(&block)
    end

    def delete_if( &block )
      @children.delete_if(&block)
    end

    def delete_at( index )
      @children.delete_at index
    end

    def each_index( &block )
      @children.each_index(&block)
    end

    # Fetches a child at a given index
    # @param index the Integer index of the child to fetch
    def []( index )
      @children[index]
    end

    alias :each_child :each



    # Set an index entry.  See Array.[]=
    # @param index the index of the element to set
    # @param opt either the object to set, or an Integer length
    # @param child if opt is an Integer, this is the child to set
    # @return the parent (self)
    def []=( *args )
      args[-1].parent = self
      @children[*args[0..-2]] = args[-1]
    end

    # Inserts an child before another child
    # @param child1 this is either an xpath or an Element.  If an Element,
    # child2 will be inserted before child1 in the child list of the parent.
    # If an xpath, child2 will be inserted before the first child to match
    # the xpath.
    # @param child2 the child to insert
    # @return the parent (self)
    def insert_before( child1, child2 )
      if child1.kind_of? String
        child1 = XPath.first( self, child1 )
        child1.parent.insert_before child1, child2
      else
        ind = index(child1)
        child2.parent.delete(child2) if child2.parent
        @children[ind,0] = child2
        child2.parent = self
      end
      self
    end

    # Inserts an child after another child
    # @param child1 this is either an xpath or an Element.  If an Element,
    # child2 will be inserted after child1 in the child list of the parent.
    # If an xpath, child2 will be inserted after the first child to match
    # the xpath.
    # @param child2 the child to insert
    # @return the parent (self)
    def insert_after( child1, child2 )
      if child1.kind_of? String
        child1 = XPath.first( self, child1 )
        child1.parent.insert_after child1, child2
      else
        ind = index(child1)+1
        child2.parent.delete(child2) if child2.parent
        @children[ind,0] = child2
        child2.parent = self
      end
      self
    end

    def to_a
      @children.dup
    end

    # Fetches the index of a given child
    # @param child the child to get the index of
    # @return the index of the child, or nil if the object is not a child
    # of this parent.
    def index( child )
      count = -1
      @children.find { |i| count += 1 ; i.hash == child.hash }
      count
    end

    # @return the number of children of this parent
    def size
      @children.size
    end

    alias :length :size

    # Replaces one child with another, making sure the nodelist is correct
    # @param to_replace the child to replace (must be a Child)
    # @param replacement the child to insert into the nodelist (must be a
    # Child)
    def replace_child( to_replace, replacement )
      @children.map! {|c| c.equal?( to_replace ) ? replacement : c }
      to_replace.parent = nil
      replacement.parent = self
    end

    # Deeply clones this object.  This creates a complete duplicate of this
    # Parent, including all descendants.
    def deep_clone
      cl = clone()
      each do |child|
        if child.kind_of? Parent
          cl << child.deep_clone
        else
          cl << child.clone
        end
      end
      cl
    end

    alias :children :to_a

    def parent?
      true
    end
  end
end
