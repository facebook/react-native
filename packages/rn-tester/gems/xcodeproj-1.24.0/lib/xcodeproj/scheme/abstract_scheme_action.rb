require 'xcodeproj/scheme/xml_element_wrapper'
require 'xcodeproj/scheme/environment_variables'
require 'xcodeproj/scheme/command_line_arguments'

module Xcodeproj
  class XCScheme
    # This abstract class aims to be the base class for every XxxAction class
    # that have a #build_configuration attribute
    #
    class AbstractSchemeAction < XMLElementWrapper
      # @return [String]
      #         The build configuration associated with this action
      #         (usually either 'Debug' or 'Release')
      #
      def build_configuration
        @xml_element.attributes['buildConfiguration']
      end

      # @param [String] config_name
      #        The build configuration to associate with this action
      #        (usually either 'Debug' or 'Release')
      #
      def build_configuration=(config_name)
        @xml_element.attributes['buildConfiguration'] = config_name
      end

      # @return [Array<ExecutionAction>]
      #         The list of actions to run before this scheme action.
      #         Each entry can be either a 'Run Script' or a 'Send Email' action.
      #
      def pre_actions
        pre_actions = @xml_element.elements['PreActions']
        return nil unless pre_actions
        pre_actions.get_elements('ExecutionAction').map do |entry_node|
          ExecutionAction.new(entry_node)
        end
      end

      # @param [Array<ExecutionAction>] pre_actions
      #         Set the list of actions to run before this scheme action.
      #         Each entry can be either a 'Run Script' or a 'Send Email' action.
      #
      def pre_actions=(pre_actions)
        @xml_element.delete_element('PreActions')
        unless pre_actions.empty?
          pre_actions_element = @xml_element.add_element('PreActions')
          pre_actions.each do |entry_node|
            pre_actions_element.add_element(entry_node.xml_element)
          end
        end
        pre_actions
      end

      # @param [ExecutionAction] pre_action
      #        Add an action to the list of actions to run before this scheme action.
      #        It can be either a 'Run Script' or a 'Send Email' action.
      #
      def add_pre_action(pre_action)
        pre_actions = @xml_element.elements['PreActions'] || @xml_element.add_element('PreActions')
        pre_actions.add_element(pre_action.xml_element)
      end

      # @return [Array<ExecutionAction>]
      #         The list of actions to run after this scheme action.
      #         Each entry can be either a 'Run Script' or a 'Send Email' action.
      #
      def post_actions
        post_actions = @xml_element.elements['PostActions']
        return nil unless post_actions
        post_actions.get_elements('ExecutionAction').map do |entry_node|
          ExecutionAction.new(entry_node)
        end
      end

      # @param [Array<ExecutionAction>] post_actions
      #        Set the list of actions to run after this scheme action.
      #        Each entry can be either a 'Run Script' or a 'Send Email' action.
      #
      def post_actions=(post_actions)
        @xml_element.delete_element('PostActions')
        unless post_actions.empty?
          post_actions_element = @xml_element.add_element('PostActions')
          post_actions.each do |entry_node|
            post_actions_element.add_element(entry_node.xml_element)
          end
        end
        post_actions
      end

      # @param [ExecutionAction] post_action
      #        Add an action to the list of actions to run after this scheme action.
      #        It can be either a 'Run Script' or a 'Send Email' action.
      #
      def add_post_action(post_action)
        post_actions = @xml_element.elements['PostActions'] || @xml_element.add_element('PostActions')
        post_actions.add_element(post_action.xml_element)
      end
    end
  end
end
