module Pod
  class Installer
    module ProjectCache
      # Metadata used to reconstruct a PBXTargetDependency.
      #
      class TargetMetadata
        # @return [String]
        #         The label of the native target.
        #
        attr_reader :target_label

        # @return [String]
        #         The UUID of the native target installed.
        #
        attr_reader :native_target_uuid

        # @return [String]
        #         The path of the container project the native target was installed into.
        #
        attr_reader :container_project_path

        # Initialize a new instance.
        #
        # @param [String] target_label @see #target_label
        # @param [String] native_target_uuid @see #native_target_uuid
        # @param [String] container_project_path @see #container_project_path
        #
        def initialize(target_label, native_target_uuid, container_project_path)
          @target_label = target_label
          @native_target_uuid = native_target_uuid
          @container_project_path = container_project_path
        end

        def to_hash
          {
            'LABEL' => target_label,
            'UUID' => native_target_uuid,
            'PROJECT_PATH' => container_project_path,
          }
        end

        def to_s
          "#{target_label} : #{native_target_uuid} : #{container_project_path}"
        end

        # Constructs a TargetMetadata instance from a hash.
        #
        # @param [Hash] hash
        #        The hash used to construct a new TargetMetadata instance.
        #
        # @return [TargetMetadata]
        #
        def self.from_hash(hash)
          TargetMetadata.new(hash['LABEL'], hash['UUID'], hash['PROJECT_PATH'])
        end

        # Constructs a TargetMetadata instance from a native target.
        #
        # @param [Sandbox] sandbox
        #        The sandbox used for this installation.
        #
        # @param [PBXNativeTarget] native_target
        #        The native target used to construct a TargetMetadata instance.
        #
        # @return [TargetMetadata]
        #
        def self.from_native_target(sandbox, native_target)
          TargetMetadata.new(native_target.name, native_target.uuid,
                             native_target.project.path.relative_path_from(sandbox.root).to_s)
        end
      end
    end
  end
end
