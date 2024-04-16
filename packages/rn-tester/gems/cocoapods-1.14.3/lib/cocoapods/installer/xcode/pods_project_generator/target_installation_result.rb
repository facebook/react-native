module Pod
  class Installer
    class Xcode
      class PodsProjectGenerator
        # A simple container produced after a target installation is completed.
        #
        class TargetInstallationResult
          # @return [Target] target
          #         The target this installation result is for.
          #
          attr_reader :target

          # @return [PBXNativeTarget] native_target
          #         The native target that was produced for this target.
          #
          attr_reader :native_target

          # @return [Array<PBXNativeTarget>] resource_bundle_targets
          #         The resource bundle targets that were produced for this target. Can be empty if the target had
          #         no resource bundles.
          #
          attr_reader :resource_bundle_targets

          # @return [Array<PBXNativeTarget>] test_native_targets
          #         The test native targets that were produced for this target. Can be empty if there were no test
          #         native targets created (e.g. no test specs present).
          #
          attr_reader :test_native_targets

          # @return [Hash{String=>Array<PBXNativeTarget>}] test_resource_bundle_targets
          #         The test resource bundle targets that were produced for this target keyed by test spec name.
          #         Can be empty if the target had no resource bundles for any tests.
          #
          attr_reader :test_resource_bundle_targets

          # @return [Array<PBXNativeTarget>] test_app_host_targets
          #         The test app host native targets that were produced for this target. Can be empty.
          #
          attr_reader :test_app_host_targets

          # @return [Hash{Specification => PBXNativeTarget}] app_native_targets
          #         The app native targets that were produced for this target. Can be empty if there were no app
          #         native targets created (e.g. no app specs present).
          #
          attr_reader :app_native_targets

          # @return [Hash{String=>Array<PBXNativeTarget>}] app_resource_bundle_targets
          #         The app resource bundle targets that were produced for this target keyed by app spec name.
          #         Can be empty if the target had no resource bundles for any apps.
          #
          attr_reader :app_resource_bundle_targets

          # Initialize a new instance
          #
          # @param [Target] target @see #target
          # @param [PBXNativeTarget] native_target @see #native_target
          # @param [Array<PBXNativeTarget>] resource_bundle_targets @see #resource_bundle_targets
          # @param [Array<PBXNativeTarget>] test_native_targets @see #test_native_targets
          # @param [Hash{String=>Array<PBXNativeTarget>}] test_resource_bundle_targets @see #test_resource_bundle_targets
          # @param [Array<PBXNativeTarget>] test_app_host_targets @see #test_app_host_targets
          # @param [Hash{Specification => PBXNativeTarget}] app_native_targets @see #app_native_targets
          # @param [Hash{String=>Array<PBXNativeTarget>}] app_resource_bundle_targets @see #app_resource_bundle_targets
          #
          def initialize(target, native_target, resource_bundle_targets = [], test_native_targets = [],
                         test_resource_bundle_targets = {}, test_app_host_targets = [],
                         app_native_targets = {}, app_resource_bundle_targets = {})
            @target = target
            @native_target = native_target
            @resource_bundle_targets = resource_bundle_targets
            @test_native_targets = test_native_targets
            @test_resource_bundle_targets = test_resource_bundle_targets
            @test_app_host_targets = test_app_host_targets
            @app_native_targets = app_native_targets
            @app_resource_bundle_targets = app_resource_bundle_targets
          end

          # Returns the corresponding native target to use based on the provided specification.
          #
          # @param  [Specification] spec
          #         The specification to base from in order to find the native target.
          #
          # @return [PBXNativeTarget, Nil] the native target to use or `nil` if none is found.
          #
          def native_target_for_spec(spec)
            return native_target if spec.library_specification?
            return test_native_target_from_spec(spec) if spec.test_specification?
            app_native_target_from_spec(spec) if spec.app_specification?
          end

          # @return [Hash{PBXNativeTarget => Specification}] a hash where the keys are the test native targets and the value
          #         is the test spec associated with this native target.
          #
          def test_specs_by_native_target
            test_specs_by_native_target = Hash[target.test_specs.map { |spec| [test_native_target_from_spec(spec), spec] }]
            test_specs_by_native_target.delete_if { |k, _| k.nil? }
          end

          # @return [Hash{PBXNativeTarget => Specification}] a hash where the keys are the app native targets and the value
          #         is the app spec associated with this native target.
          #
          def app_specs_by_native_target
            app_specs_by_native_target = Hash[target.app_specs.map { |spec| [app_native_target_from_spec(spec), spec] }]
            app_specs_by_native_target.delete_if { |k, _| k.nil? }
          end

          # @return [Hash{PBXNativeTarget => Specification}] a hash where the keys are the native targets and the value
          #         is the non-library spec associated with this native target.
          #
          def non_library_specs_by_native_target
            test_specs_by_native_target.merge(app_specs_by_native_target)
          end

          # @param label [String] the label of the app host target.
          #
          # @return [PBXNativeTarget] the app host target with the given target label.
          #
          def app_host_target_labelled(label)
            app_native_targets.values.find do |app_native_target|
              app_native_target.name == label
            end || test_app_host_targets.find do |app_native_target|
              app_native_target.name == label
            end
          end

          private

          def test_native_target_from_spec(spec)
            test_native_targets.find do |test_native_target|
              test_native_target.name == target.test_target_label(spec)
            end
          end

          def app_native_target_from_spec(spec)
            app_native_targets[spec]
          end
        end
      end
    end
  end
end
