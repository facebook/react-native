module Xcodeproj
  class XCScheme
    # Abstract base class used for other XCScheme classes wrapping an XML element
    #
    class XMLElementWrapper
      # @return [REXML::Element]
      #         The XML node wrapped and manipulated by this XMLElementWrapper object
      #
      attr_reader :xml_element

      # @return [String]
      #         The XML representation of the node this XMLElementWrapper wraps,
      #         formatted in the same way that Xcode would.
      def to_s
        formatter = XMLFormatter.new(2)
        formatter.compact = false
        out = ''
        formatter.write(@xml_element, out)
        out.gsub!("<?xml version='1.0' encoding='UTF-8'?>", '')
        out << "\n"
        out
      end

      private

      # This is a method intended to be used to facilitate the implementation of the initializers.
      #
      # - Create the @xml_element attribute based on the node passed as parameter, only if
      #   that parameter is of type REXML::Element and its name matches the tag_name given.
      # - Otherwise, create a brand new REXML::Element with the proper tag name and
      #   execute the block given as a fallback to let the caller the chance to configure it
      #
      # @param [REXML::Element, *] node
      #        The node this XMLElementWrapper is expected to wrap
      #        or any other object (typically an AbstractTarget instance, or nil) the initializer might expect
      #
      # @param [String] tag_name
      #        The expected name for the node, which will also be the name used to create the new node
      #        if that `node` parameter is not a REXML::Element itself.
      #
      # @yield a parameter-less block if the `node` parameter is not actually a REXML::Element
      #
      # @raise Informative
      #        If the `node` parameter is a REXML::Element instance but the node's name
      #        doesn't match the one provided by the `tag_name` parameter.
      #
      def create_xml_element_with_fallback(node, tag_name)
        if node && node.is_a?(REXML::Element)
          raise Informative, 'Wrong XML tag name' unless node.name == tag_name
          @xml_element = node
        else
          @xml_element = REXML::Element.new(tag_name)
          yield if block_given?
        end
      end

      # @param [Bool]
      #        The boolean we want to represent as a string
      #
      # @return [String]
      #         The string representaiton of that boolean used in the XML ('YES' or 'NO')
      #
      def bool_to_string(flag)
        flag ? 'YES' : 'NO'
      end

      # @param [String]
      #        The string representaiton of a boolean used in the XML ('YES' or 'NO')
      #
      # @return [Bool]
      #        The boolean interpretation of that string
      #
      # @raise Informative
      #        If the string is not representing a boolean (i.e. is neither 'YES' nor 'NO')
      #
      def string_to_bool(str)
        raise Informative, 'Invalid tag value. Expected YES or NO.' unless %w(YES NO).include?(str)
        str == 'YES'
      end
    end
  end
end
