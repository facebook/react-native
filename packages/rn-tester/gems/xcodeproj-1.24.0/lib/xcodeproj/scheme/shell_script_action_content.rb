module Xcodeproj
  class XCScheme
    # This class wraps a 'ActionContent' node of type
    # 'Xcode.IDEStandardExecutionActionsCore.ExecutionActionType.ShellScriptAction' of a .xcscheme XML file
    #
    class ShellScriptActionContent < XMLElementWrapper
      # @param [REXML::Element] node
      #        The 'ActionContent' XML node that this object will wrap.
      #        If nil, will create a default XML node to use.
      #
      def initialize(node = nil)
        create_xml_element_with_fallback(node, 'ActionContent') do
          self.title = 'Run Script'
        end
      end

      # @return [String]
      #         The title of this ActionContent
      #
      def title
        @xml_element.attributes['title']
      end

      # @param [String] value
      #        Set the title of this ActionContent
      #
      def title=(value)
        @xml_element.attributes['title'] = value
      end

      # @return [String]
      #         The contents of the shell script represented by this ActionContent
      #
      def script_text
        @xml_element.attributes['scriptText']
      end

      # @param [String] value
      #         Set the contents of the shell script represented by this ActionContent
      #
      def script_text=(value)
        @xml_element.attributes['scriptText'] = value
      end

      # @return [String]
      #         The preferred shell to invoke with this ActionContent
      #
      def shell_to_invoke
        @xml_element.attributes['shellToInvoke']
      end

      # @param [String] value
      #        Set the preferred shell to invoke with this ActionContent
      #
      def shell_to_invoke=(value)
        @xml_element.attributes['shellToInvoke'] = value
      end

      # @return [BuildableReference]
      #         The BuildableReference (Xcode target) associated with this ActionContent
      #
      def buildable_reference
        BuildableReference.new(@xml_element.elements['EnvironmentBuildable'].elements['BuildableReference'])
      end

      # @param [BuildableReference] ref
      #        Set the BuildableReference (Xcode target) associated with this ActionContent
      #
      def buildable_reference=(ref)
        @xml_element.delete_element('EnvironmentBuildable')

        env_buildable = @xml_element.add_element('EnvironmentBuildable')
        env_buildable.add_element(ref.xml_element)
      end
    end
  end
end
