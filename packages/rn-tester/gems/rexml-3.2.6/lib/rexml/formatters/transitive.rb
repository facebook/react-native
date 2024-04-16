# frozen_string_literal: false
require_relative 'pretty'

module REXML
  module Formatters
    # The Transitive formatter writes an XML document that parses to an
    # identical document as the source document.  This means that no extra
    # whitespace nodes are inserted, and whitespace within text nodes is
    # preserved.  Within these constraints, the document is pretty-printed,
    # with whitespace inserted into the metadata to introduce formatting.
    #
    # Note that this is only useful if the original XML is not already
    # formatted.  Since this formatter does not alter whitespace nodes, the
    # results of formatting already formatted XML will be odd.
    class Transitive < Default
      def initialize( indentation=2, ie_hack=false )
        @indentation = indentation
        @level = 0
        @ie_hack = ie_hack
      end

      protected
      def write_element( node, output )
        output << "<#{node.expanded_name}"

        node.attributes.each_attribute do |attr|
          output << " "
          attr.write( output )
        end unless node.attributes.empty?

        output << "\n"
        output << ' '*@level
        if node.children.empty?
          output << " " if @ie_hack
          output << "/"
        else
          output << ">"
          # If compact and all children are text, and if the formatted output
          # is less than the specified width, then try to print everything on
          # one line
          @level += @indentation
          node.children.each { |child|
            write( child, output )
          }
          @level -= @indentation
          output << "</#{node.expanded_name}"
          output << "\n"
          output << ' '*@level
        end
        output << ">"
      end

      def write_text( node, output )
        output << node.to_s()
      end
    end
  end
end
