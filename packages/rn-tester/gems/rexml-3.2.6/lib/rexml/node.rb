# frozen_string_literal: false
require_relative "parseexception"
require_relative "formatters/pretty"
require_relative "formatters/default"

module REXML
  # Represents a node in the tree.  Nodes are never encountered except as
  # superclasses of other objects.  Nodes have siblings.
  module Node
    # @return the next sibling (nil if unset)
    def next_sibling_node
      return nil if @parent.nil?
      @parent[ @parent.index(self) + 1 ]
    end

    # @return the previous sibling (nil if unset)
    def previous_sibling_node
      return nil if @parent.nil?
      ind = @parent.index(self)
      return nil if ind == 0
      @parent[ ind - 1 ]
    end

    # indent::
    #   *DEPRECATED* This parameter is now ignored.  See the formatters in the
    #   REXML::Formatters package for changing the output style.
    def to_s indent=nil
      unless indent.nil?
        Kernel.warn( "#{self.class.name}.to_s(indent) parameter is deprecated", uplevel: 1)
        f = REXML::Formatters::Pretty.new( indent )
        f.write( self, rv = "" )
      else
        f = REXML::Formatters::Default.new
        f.write( self, rv = "" )
      end
      return rv
    end

    def indent to, ind
                        if @parent and @parent.context and not @parent.context[:indentstyle].nil? then
                                indentstyle = @parent.context[:indentstyle]
                        else
                                indentstyle = '  '
                        end
                        to << indentstyle*ind unless ind<1
    end

    def parent?
      false;
    end


    # Visit all subnodes of +self+ recursively
    def each_recursive(&block) # :yields: node
      self.elements.each {|node|
        block.call(node)
        node.each_recursive(&block)
      }
    end

    # Find (and return) first subnode (recursively) for which the block
    # evaluates to true. Returns +nil+ if none was found.
    def find_first_recursive(&block) # :yields: node
      each_recursive {|node|
        return node if block.call(node)
      }
      return nil
    end

    # Returns the position that +self+ holds in its parent's array, indexed
    # from 1.
    def index_in_parent
      parent.index(self)+1
    end
  end
end
