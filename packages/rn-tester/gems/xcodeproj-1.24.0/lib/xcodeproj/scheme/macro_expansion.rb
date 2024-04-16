module Xcodeproj
  class XCScheme
    # This class wraps the MacroExpansion node of a .xcscheme XML file
    #
    class MacroExpansion < XMLElementWrapper
      # @param [Xcodeproj::Project::Object::AbstractTarget, REXML::Element] target_or_node
      #        Either the Xcode target to reference,
      #        or an existing XML 'MacroExpansion' node element
      #        or nil to create an empty MacroExpansion object
      #
      def initialize(target_or_node = nil)
        create_xml_element_with_fallback(target_or_node, 'MacroExpansion') do
          self.buildable_reference = BuildableReference.new(target_or_node) if target_or_node
        end
      end

      # @return [BuildableReference]
      #         The BuildableReference this MacroExpansion refers to
      #
      def buildable_reference
        @buildable_reference ||= BuildableReference.new @xml_element.elements['BuildableReference']
      end

      # @param [BuildableReference] ref
      #        Set the BuildableReference this MacroExpansion refers to
      #
      def buildable_reference=(ref)
        @xml_element.delete_element('BuildableReference')
        @xml_element.add_element(ref.xml_element)
        @buildable_reference = ref
      end
    end
  end
end
