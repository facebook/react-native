module Xcodeproj
  class XCScheme
    # This class wraps the LocationScenarioReference node of a .xcscheme XML file
    #
    # A LocationScenarioReference is a reference to a simulated GPS location associated
    # with a scheme's launch action
    #
    class LocationScenarioReference < XMLElementWrapper
      # @param [Xcodeproj::Project::Object::AbstractTarget, REXML::Element] target_or_node
      #        Either the Xcode target to reference,
      #        or an existing XML 'LocationScenarioReference' node element to reference
      #
      def initialize(target_or_node)
        create_xml_element_with_fallback(target_or_node, 'LocationScenarioReference') do
          self.identifier = ''
          self.reference_type = '0'
        end
      end

      # @return [String]
      #         The identifier of a built-in location scenario reference, or a path to a GPX file
      #
      def identifier
        @xml_element.attributes['identifier']
      end

      # @param [String] value
      #        Set the identifier for the location scenario reference
      #
      def identifier=(value)
        @xml_element.attributes['identifier'] = value
      end

      # @return [String]
      #         The reference type is 0 when using a custom GPX file, or 1 when using a built-in location reference
      #
      def reference_type
        @xml_element.attributes['referenceType']
      end

      # @param [String] value
      #        Set the reference type for the location scenario reference
      #
      def reference_type=(value)
        @xml_element.attributes['referenceType'] = value
      end
    end
  end
end
