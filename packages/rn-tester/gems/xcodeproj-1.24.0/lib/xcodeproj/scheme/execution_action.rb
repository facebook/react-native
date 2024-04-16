module Xcodeproj
  class XCScheme
    # This class wraps the ExecutionAction node of a .xcscheme XML file
    #
    class ExecutionAction < XMLElementWrapper
      # @param [REXML::Element] node
      #        The 'ExecutionAction' XML node that this object will wrap.
      #        If nil, will create an empty one
      #
      # @param [Symbol] action_type
      #        One of `EXECUTION_ACTION_TYPE.keys`
      #
      def initialize(node = nil, action_type = nil)
        create_xml_element_with_fallback(node, 'ExecutionAction') do
          type = action_type || node.action_type
          raise "[Xcodeproj] Invalid ActionType `#{type}`" unless Constants::EXECUTION_ACTION_TYPE.keys.include?(type)
          @xml_element.attributes['ActionType'] = Constants::EXECUTION_ACTION_TYPE[type]
        end
      end

      # @return [String]
      #         The ActionType of this ExecutionAction. One of two values:
      #
      #         Xcode.IDEStandardExecutionActionsCore.ExecutionActionType.ShellScriptAction,
      #         Xcode.IDEStandardExecutionActionsCore.ExecutionActionType.SendEmailAction
      #
      def action_type
        @xml_element.attributes['ActionType']
      end

      # @return [ShellScriptActionContent]
      #         If action_type is 'Xcode.IDEStandardExecutionActionsCore.ExecutionActionType.ShellScriptAction'
      #         returns the contents of the shell script to run pre/post action.
      #
      # @return [SendEmailActionContent]
      #         If action_type is 'Xcode.IDEStandardExecutionActionsCore.ExecutionActionType.SendEmailAction'
      #         returns the contents of the email to send pre/post action.
      #
      def action_content
        case action_type
        when Constants::EXECUTION_ACTION_TYPE[:shell_script]
          ShellScriptActionContent.new(@xml_element.elements['ActionContent'])
        when Constants::EXECUTION_ACTION_TYPE[:send_email]
          SendEmailActionContent.new(@xml_element.elements['ActionContent'])
        else
          raise "[Xcodeproj] Invalid ActionType `#{action_type}`"
        end
      end

      # @param [ShellScriptActionContent, SendEmailActionContent] value
      #        Set either the contents of the shell script to run pre/post action
      #        or the contents of the email to send pre/post action.
      #
      def action_content=(value)
        raise "[Xcodeproj] Invalid ActionContent `#{value.class}` for " \
          "ActionType `#{action_type}`" unless valid_action_content?(value)

        @xml_element.delete_element('ActionContent')
        @xml_element.add_element(value.xml_element)
      end

      #-------------------------------------------------------------------------#

      private

      # @!group Private helpers

      # @return [Bool]
      #         True if value (ActionContent) is valid for current action_type
      #
      # @param [ShellScriptActionContent, SendEmailActionContent] value
      #        Checks if value matches the expected action_type if present.
      #
      def valid_action_content?(value)
        case action_type
        when Constants::EXECUTION_ACTION_TYPE[:shell_script]
          value.is_a?(ShellScriptActionContent)
        when Constants::EXECUTION_ACTION_TYPE[:send_email]
          value.is_a?(SendEmailActionContent)
        else
          false
        end
      end
    end
  end
end
