require 'xcodeproj/scheme/abstract_scheme_action'

module Xcodeproj
  class XCScheme
    # This class wraps the TestAction node of a .xcscheme XML file
    #
    class TestAction < AbstractSchemeAction
      # @param [REXML::Element] node
      #        The 'TestAction' XML node that this object will wrap.
      #        If nil, will create a default XML node to use.
      #
      def initialize(node = nil)
        create_xml_element_with_fallback(node, 'TestAction') do
          self.build_configuration = 'Debug'
          @xml_element.attributes['selectedDebuggerIdentifier'] = 'Xcode.DebuggerFoundation.Debugger.LLDB'
          @xml_element.attributes['selectedLauncherIdentifier'] = 'Xcode.DebuggerFoundation.Launcher.LLDB'
          self.should_use_launch_scheme_args_env = true
          @xml_element.add_element('Testables')
        end
      end

      # @return [Bool]
      #         Whether this Test Action should use the same arguments and environment variables
      #         as the Launch Action.
      #
      def should_use_launch_scheme_args_env?
        string_to_bool(@xml_element.attributes['shouldUseLaunchSchemeArgsEnv'])
      end

      # @param [Bool] flag
      #        Set whether this Test Action should use the same arguments and environment variables
      #        as the Launch Action.
      #
      def should_use_launch_scheme_args_env=(flag)
        @xml_element.attributes['shouldUseLaunchSchemeArgsEnv'] = bool_to_string(flag)
      end

      # @return [Bool]
      #         Whether this Test Action should disable detection of UI API misuse
      #         from background threads
      #
      def disable_main_thread_checker?
        string_to_bool(@xml_element.attributes['disableMainThreadChecker'])
      end

      # @param [Bool] flag
      #        Set whether this Test Action should disable detection of UI API misuse
      #        from background threads
      #
      def disable_main_thread_checker=(flag)
        @xml_element.attributes['disableMainThreadChecker'] = bool_to_string(flag)
      end

      # @return [Bool]
      #         Whether Clang Code Coverage is enabled ('Gather coverage data' turned ON)
      #
      def code_coverage_enabled?
        string_to_bool(@xml_element.attributes['codeCoverageEnabled'])
      end

      # @param [Bool] flag
      #         Set whether Clang Code Coverage is enabled ('Gather coverage data' turned ON)
      #
      def code_coverage_enabled=(flag)
        @xml_element.attributes['codeCoverageEnabled'] = bool_to_string(flag)
      end

      # @return [Array<TestableReference>]
      #         The list of TestableReference (test bundles) associated with this Test Action
      #
      def testables
        return [] unless @xml_element.elements['Testables']

        @xml_element.elements['Testables'].get_elements('TestableReference').map do |node|
          TestableReference.new(node)
        end
      end

      # @param [Array<TestableReference>] testables
      #         Sets the list of TestableReference (test bundles) associated with this Test Action
      #
      def testables=(testables)
        @xml_element.delete_element('Testables')
        testables_element = @xml_element.add_element('Testables')
        testables.each do |testable|
          testables_element.add_element(testable.xml_element)
        end
        testables
      end

      # @param [TestableReference] testable
      #        Add a TestableReference (test bundle) to this Test Action
      #
      def add_testable(testable)
        testables = @xml_element.elements['Testables'] || @xml_element.add_element('Testables')
        testables.add_element(testable.xml_element)
      end

      # @return [Array<MacroExpansion>]
      #         The list of MacroExpansion bound with this TestAction
      #
      def macro_expansions
        @xml_element.get_elements('MacroExpansion').map do |node|
          MacroExpansion.new(node)
        end
      end

      # @param [MacroExpansion] macro_expansion
      #        Add a MacroExpansion to this TestAction
      #
      def add_macro_expansion(macro_expansion)
        if testables = @xml_element.elements['Testables']
          @xml_element.insert_before(testables, macro_expansion.xml_element)
        else
          @xml_element.add_element(macro_expansion.xml_element)
        end
      end

      # @return [EnvironmentVariables]
      #         Returns the EnvironmentVariables that will be defined at test launch
      #
      def environment_variables
        EnvironmentVariables.new(@xml_element.elements[XCScheme::VARIABLES_NODE])
      end

      # @param [EnvironmentVariables,nil] env_vars
      #        Sets the EnvironmentVariables that will be defined at test launch
      # @return [EnvironmentVariables]
      #
      def environment_variables=(env_vars)
        @xml_element.delete_element(XCScheme::VARIABLES_NODE)
        @xml_element.add_element(env_vars.xml_element) if env_vars
        env_vars
      end

      # @todo handle 'AdditionalOptions' tag

      # @return [CommandLineArguments]
      #         Returns the CommandLineArguments that will be passed at app launch
      #
      def command_line_arguments
        CommandLineArguments.new(@xml_element.elements[XCScheme::COMMAND_LINE_ARGS_NODE])
      end

      # @return [CommandLineArguments] arguments
      #         Sets the CommandLineArguments that will be passed at app launch
      #
      def command_line_arguments=(arguments)
        @xml_element.delete_element(XCScheme::COMMAND_LINE_ARGS_NODE)
        @xml_element.add_element(arguments.xml_element) if arguments
        arguments
      end

      # @return [Array<BuildableReference>]
      #         The list of BuildableReference (code coverage targets) associated with this Test Action
      #
      def code_coverage_targets
        return [] unless @xml_element.elements['CodeCoverageTargets']

        @xml_element.elements['CodeCoverageTargets'].get_elements('BuildableReference').map do |node|
          BuildableReference.new(node)
        end
      end

      # @param [Array<BuildableReference>] buildable_references
      #         Sets the list of BuildableReference (code coverage targets) associated with this Test Action
      #
      def code_coverage_targets=(buildable_references)
        @xml_element.attributes['onlyGenerateCoverageForSpecifiedTargets'] = bool_to_string(true)

        @xml_element.delete_element('CodeCoverageTargets')
        coverage_targets_element = @xml_element.add_element('CodeCoverageTargets')
        buildable_references.each do |reference|
          coverage_targets_element.add_element(reference.xml_element)
        end

        code_coverage_targets
      end

      # @param [BuildableReference] buildable_reference
      #        Add a BuildableReference (code coverage target) to this Test Action
      #
      def add_code_coverage_target(buildable_reference)
        @xml_element.attributes['onlyGenerateCoverageForSpecifiedTargets'] = bool_to_string(true)

        coverage_targets_element = @xml_element.elements['CodeCoverageTargets'] || @xml_element.add_element('CodeCoverageTargets')
        coverage_targets_element.add_element(buildable_reference.xml_element)

        code_coverage_targets
      end

      #-------------------------------------------------------------------------#

      class TestableReference < XMLElementWrapper
        # @param [Xcodeproj::Project::Object::AbstractTarget, REXML::Element] target_or_node
        #        Either the Xcode target to reference,
        #        or an existing XML 'TestableReference' node element to reference,
        #        or nil to create an new, empty TestableReference
        #
        # @param [Xcodeproj::Project] the root project to reference from
        #                             (when nil the project of the target is used)
        #
        def initialize(target_or_node = nil, root_project = nil)
          create_xml_element_with_fallback(target_or_node, 'TestableReference') do
            self.skipped = false
            add_buildable_reference BuildableReference.new(target_or_node, root_project) unless target_or_node.nil?
          end
        end

        # @return [Bool]
        #         Whether or not this TestableReference (test bundle) should be skipped or not
        #
        def skipped?
          string_to_bool(@xml_element.attributes['skipped'])
        end

        # @param [Bool] flag
        #        Set whether or not this TestableReference (test bundle) should be skipped or not
        #
        def skipped=(flag)
          @xml_element.attributes['skipped'] = bool_to_string(flag)
        end

        # @return [Bool]
        #         Whether or not this TestableReference (test bundle) should be run in parallel or not
        #
        def parallelizable?
          string_to_bool(@xml_element.attributes['parallelizable'])
        end

        # @param [Bool] flag
        #         Set whether or not this TestableReference (test bundle) should be run in parallel or not
        #
        def parallelizable=(flag)
          @xml_element.attributes['parallelizable'] = bool_to_string(flag)
        end

        # @return [String]
        #         The execution order for this TestableReference (test bundle)
        #
        def test_execution_ordering
          @xml_element.attributes['testExecutionOrdering']
        end

        # @param [String] order
        #         Set the execution order for this TestableReference (test bundle)
        #
        def test_execution_ordering=(order)
          @xml_element.attributes['testExecutionOrdering'] = order
        end

        # @return [Bool]
        #         Whether or not this TestableReference (test bundle) should be run in randomized order.
        #
        def randomized?
          test_execution_ordering == 'random'
        end

        # @return [Array<BuildableReference>]
        #         The list of BuildableReferences this action will build.
        #         (The list usually contains only one element)
        #
        def buildable_references
          @xml_element.get_elements('BuildableReference').map do |node|
            BuildableReference.new(node)
          end
        end

        # @param [BuildableReference] ref
        #         The BuildableReference to add to the list of targets this action will build
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

        # @return [Array<Test>]
        #         The list of SkippedTest this action will skip.
        #
        def skipped_tests
          return [] if @xml_element.elements['SkippedTests'].nil?
          @xml_element.elements['SkippedTests'].get_elements('Test').map do |node|
            Test.new(node)
          end
        end

        # @param [Array<Test>] tests
        #         Set the list of SkippedTest this action will skip.
        #
        def skipped_tests=(tests)
          @xml_element.delete_element('SkippedTests')
          if tests.nil?
            return
          end
          entries = @xml_element.add_element('SkippedTests')
          tests.each do |skipped|
            entries.add_element(skipped.xml_element)
          end
        end

        # @param [Test] skipped_test
        #         The SkippedTest to add to the list of tests this action will skip
        #
        def add_skipped_test(skipped_test)
          entries = @xml_element.elements['SkippedTests'] || @xml_element.add_element('SkippedTests')
          entries.add_element(skipped_test.xml_element)
        end

        # @return [Bool]
        #         Whether or not this TestableReference (test bundle) should use a whitelist or not
        #
        def use_test_selection_whitelist?
          string_to_bool(@xml_element.attributes['useTestSelectionWhitelist'])
        end

        # @param [Bool] flag
        #        Set whether or not this TestableReference (test bundle) should use a whitelist or not
        #
        def use_test_selection_whitelist=(flag)
          @xml_element.attributes['useTestSelectionWhitelist'] = bool_to_string(flag)
        end

        # @return [Array<Test>]
        #         The list of SelectedTest this action will run.
        #
        def selected_tests
          return [] if @xml_element.elements['SelectedTests'].nil?
          @xml_element.elements['SelectedTests'].get_elements('Test').map do |node|
            Test.new(node)
          end
        end

        # @param [Array<Test>] tests
        #         Set the list of SelectedTest this action will run.
        #
        def selected_tests=(tests)
          @xml_element.delete_element('SelectedTests')
          return if tests.nil?
          entries = @xml_element.add_element('SelectedTests')
          tests.each do |selected|
            entries.add_element(selected.xml_element)
          end
        end

        # @param [Test] selected_test
        #         The SelectedTest to add to the list of tests this action will run.
        #
        def add_selected_test(selected_test)
          entries = @xml_element.elements['SelectedTests'] || @xml_element.add_element('SelectedTests')
          entries.add_element(selected_test.xml_element)
        end

        class Test < XMLElementWrapper
          # @param [REXML::Element] node
          #        The 'Test' XML node that this object will wrap.
          #        If nil, will create a default XML node to use.
          #
          def initialize(node = nil)
            create_xml_element_with_fallback(node, 'Test') do
              self.identifier = node.attributes['Identifier'] unless node.nil?
            end
          end

          # @return [String]
          #         Skipped test class name
          #
          def identifier
            @xml_element.attributes['Identifier']
          end

          # @param [String] value
          #        Set the name of the skipped test class name
          #
          def identifier=(value)
            @xml_element.attributes['Identifier'] = value
          end
        end

        # Aliased to`Test` for compatibility
        # @todo Remove in Xcodeproj 2
        #
        SkippedTest = Test

        # @todo handle 'AdditionalOptions' tag
      end
    end
  end
end
