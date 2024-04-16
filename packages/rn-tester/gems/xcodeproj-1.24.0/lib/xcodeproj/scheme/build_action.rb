require 'xcodeproj/scheme/xml_element_wrapper'

module Xcodeproj
  class XCScheme
    # This class wraps the BuildAction node of a .xcscheme XML file
    #
    # Note: It's not a AbstractSchemeAction like the others because it is
    # a special case of action (with no build_configuration, etc)
    #
    class BuildAction < XMLElementWrapper
      # @param [REXML::Element] node
      #        The 'BuildAction' XML node that this object will wrap.
      #        If nil, will create a default XML node to use.
      #
      def initialize(node = nil)
        create_xml_element_with_fallback(node, 'BuildAction') do
          self.parallelize_buildables = true
          self.build_implicit_dependencies = true
        end
      end

      # @return [Bool]
      #         Whether or not to run post actions on build failure
      #
      def run_post_actions_on_failure?
        string_to_bool(@xml_element.attributes['runPostActionsOnFailure'])
      end

      # @param [Bool] flag
      #        Set whether or not to run post actions on build failure
      #
      def run_post_actions_on_failure=(flag)
        @xml_element.attributes['runPostActionsOnFailure'] = bool_to_string(flag)
      end

      # @return [Bool]
      #         Whether or not to build the various targets in parallel
      #
      def parallelize_buildables?
        string_to_bool(@xml_element.attributes['parallelizeBuildables'])
      end

      # @param [Bool] flag
      #        Set whether or not to build the various targets in parallel
      #
      def parallelize_buildables=(flag)
        @xml_element.attributes['parallelizeBuildables'] = bool_to_string(flag)
      end

      # @return [Bool]
      #          Whether or not to detect and build implicit dependencies for each target
      #
      def build_implicit_dependencies?
        string_to_bool(@xml_element.attributes['buildImplicitDependencies'])
      end

      # @param [Bool] flag
      #        Whether or not to detect and build implicit dependencies for each target
      #
      def build_implicit_dependencies=(flag)
        @xml_element.attributes['buildImplicitDependencies'] = bool_to_string(flag)
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
      #        Set the list of actions to run before this scheme action.
      #        Each entry can be either a 'Run Script' or a 'Send Email' action.
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

      # @return [Array<BuildAction::Entry>]
      #         The list of BuildActionEntry nodes associated with this Build Action.
      #         Each entry represent a target to build and tells for which action it's needed to be built.
      #
      def entries
        entries = @xml_element.elements['BuildActionEntries']
        return nil unless entries
        entries.get_elements('BuildActionEntry').map do |entry_node|
          BuildAction::Entry.new(entry_node)
        end
      end

      # @param [Array<BuildAction::Entry>] entries
      #        Sets the list of BuildActionEntry nodes associated with this Build Action.
      #
      def entries=(entries)
        @xml_element.delete_element('BuildActionEntries')
        unless entries.empty?
          entries_element = @xml_element.add_element('BuildActionEntries')
          entries.each do |entry_node|
            entries_element.add_element(entry_node.xml_element)
          end
        end
        entries
      end

      # @param [BuildAction::Entry] entry
      #        The BuildActionEntry to add to the list of targets to build for the various actions
      #
      def add_entry(entry)
        entries = @xml_element.elements['BuildActionEntries'] || @xml_element.add_element('BuildActionEntries')
        entries.add_element(entry.xml_element)
      end

      #-------------------------------------------------------------------------#

      class Entry < XMLElementWrapper
        # @param [Xcodeproj::Project::Object::AbstractTarget, REXML::Element] target_or_node
        #        Either the Xcode target to reference,
        #        or an existing XML 'BuildActionEntry' node element to reference,
        #        or nil to create an new, empty Entry with default values
        #
        def initialize(target_or_node = nil)
          create_xml_element_with_fallback(target_or_node, 'BuildActionEntry') do
            # Check target type to configure the default entry attributes accordingly
            is_test_target = false
            is_app_target = false
            if target_or_node && target_or_node.is_a?(::Xcodeproj::Project::Object::PBXNativeTarget)
              test_types = [Constants::PRODUCT_TYPE_UTI[:octest_bundle],
                            Constants::PRODUCT_TYPE_UTI[:unit_test_bundle],
                            Constants::PRODUCT_TYPE_UTI[:ui_test_bundle]]
              app_types = [Constants::PRODUCT_TYPE_UTI[:application]]
              is_test_target = test_types.include?(target_or_node.product_type)
              is_app_target = app_types.include?(target_or_node.product_type)
            end

            self.build_for_testing   = is_test_target
            self.build_for_running   = is_app_target
            self.build_for_profiling = is_app_target
            self.build_for_archiving = is_app_target
            self.build_for_analyzing = true

            add_buildable_reference BuildableReference.new(target_or_node) if target_or_node
          end
        end

        # @return [Bool]
        #         Whether or not to build this target when building for Testing
        #
        def build_for_testing?
          string_to_bool(@xml_element.attributes['buildForTesting'])
        end

        # @param [Bool]
        #        Set whether or not to build this target when building for Testing
        #
        def build_for_testing=(flag)
          @xml_element.attributes['buildForTesting'] = bool_to_string(flag)
        end

        # @return [Bool]
        #         Whether or not to build this target when building for Running
        #
        def build_for_running?
          string_to_bool(@xml_element.attributes['buildForRunning'])
        end

        # @param [Bool]
        #        Set whether or not to build this target when building for Running
        #
        def build_for_running=(flag)
          @xml_element.attributes['buildForRunning'] = bool_to_string(flag)
        end

        # @return [Bool]
        #         Whether or not to build this target when building for Profiling
        #
        def build_for_profiling?
          string_to_bool(@xml_element.attributes['buildForProfiling'])
        end

        # @param [Bool]
        #        Set whether or not to build this target when building for Profiling
        #
        def build_for_profiling=(flag)
          @xml_element.attributes['buildForProfiling'] = bool_to_string(flag)
        end

        # @return [Bool]
        #         Whether or not to build this target when building for Archiving
        #
        def build_for_archiving?
          string_to_bool(@xml_element.attributes['buildForArchiving'])
        end

        # @param [Bool]
        #        Set whether or not to build this target when building for Archiving
        #
        def build_for_archiving=(flag)
          @xml_element.attributes['buildForArchiving'] = bool_to_string(flag)
        end

        # @return [Bool]
        #         Whether or not to build this target when building for Analyzing
        #
        def build_for_analyzing?
          string_to_bool(@xml_element.attributes['buildForAnalyzing'])
        end

        # @param [Bool]
        #        Set whether or not to build this target when building for Analyzing
        #
        def build_for_analyzing=(flag)
          @xml_element.attributes['buildForAnalyzing'] = bool_to_string(flag)
        end

        # @return [Array<BuildableReference>]
        #         The list of BuildableReferences this entry will build.
        #         (The list usually contains only one element)
        #
        def buildable_references
          @xml_element.get_elements('BuildableReference').map do |node|
            BuildableReference.new(node)
          end
        end

        # @param [BuildableReference] ref
        #         The BuildableReference to add to the list of targets this entry will build
        #
        def add_buildable_reference(ref)
          @xml_element.add_element(ref.xml_element)
        end

        # @param [BuildableReference] ref
        #         The BuildableReference to remove from the list of targets this entry will build
        #
        def remove_buildable_reference(ref)
          @xml_element.delete_element(ref.xml_element)
        end
      end
    end
  end
end
