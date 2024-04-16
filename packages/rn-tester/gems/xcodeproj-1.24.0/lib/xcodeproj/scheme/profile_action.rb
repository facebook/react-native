require 'xcodeproj/scheme/abstract_scheme_action'

module Xcodeproj
  class XCScheme
    # This class wraps the ProfileAction node of a .xcscheme XML file
    #
    class ProfileAction < AbstractSchemeAction
      # @param [REXML::Element] node
      #        The 'ProfileAction' XML node that this object will wrap.
      #        If nil, will create a default XML node to use.
      #
      def initialize(node = nil)
        create_xml_element_with_fallback(node, 'ProfileAction') do
          # Setup default values for other (handled) attributes
          self.build_configuration = 'Release'
          self.should_use_launch_scheme_args_env = true

          # Add some attributes (that are not handled by this wrapper class yet but expected in the XML)
          @xml_element.attributes['savedToolIdentifier'] = ''
          @xml_element.attributes['useCustomWorkingDirectory'] = bool_to_string(false)
          @xml_element.attributes['debugDocumentVersioning'] = bool_to_string(true)
        end
      end

      # @return [Bool]
      #         Whether this Profile Action should use the same arguments and environment variables
      #         as the Launch Action.
      #
      def should_use_launch_scheme_args_env?
        string_to_bool(@xml_element.attributes['shouldUseLaunchSchemeArgsEnv'])
      end

      # @param [Bool] flag
      #        Set Whether this Profile Action should use the same arguments and environment variables
      #        as the Launch Action.
      #
      def should_use_launch_scheme_args_env=(flag)
        @xml_element.attributes['shouldUseLaunchSchemeArgsEnv'] = bool_to_string(flag)
      end

      # @return [BuildableProductRunnable]
      #         The BuildableProductRunnable to launch when launching the Profile action
      #
      def buildable_product_runnable
        BuildableProductRunnable.new @xml_element.elements['BuildableProductRunnable'], 0
      end

      # @param [BuildableProductRunnable] runnable
      #        Set the BuildableProductRunnable referencing the target to launch when profiling
      #
      def buildable_product_runnable=(runnable)
        @xml_element.delete_element('BuildableProductRunnable')
        @xml_element.add_element(runnable.xml_element) if runnable
      end
    end
  end
end
