module Pod
  class Project
    # Adds a dependency on the given metadata cache.
    #
    # @param  [Sandbox] sandbox
    #         The sandbox used for this installation.
    #
    # @param  [AbstractTarget] target
    #         The parent target used to add a cached dependency.
    #
    # @param  [MetadataCache] metadata
    #         The metadata holding all the required metadata to construct a target as a dependency.
    #
    # @return [void]
    #
    def self.add_cached_dependency(sandbox, target, metadata)
      return if dependency_for_cached_target?(sandbox, target, metadata)
      container_proxy = target.project.new(Xcodeproj::Project::PBXContainerItemProxy)

      subproject_reference = target.project.reference_for_path(sandbox.root + metadata.container_project_path)
      raise ArgumentError, "add_dependency received target (#{target}) that belongs to a project that is not this project (#{self}) and is not a subproject of this project" unless subproject_reference
      container_proxy.container_portal = subproject_reference.uuid

      container_proxy.proxy_type = Xcodeproj::Constants::PROXY_TYPES[:native_target]
      container_proxy.remote_global_id_string = metadata.native_target_uuid
      container_proxy.remote_info = metadata.target_label

      dependency = target.project.new(Xcodeproj::Project::PBXTargetDependency)
      dependency.name = metadata.target_label
      dependency.target_proxy = container_proxy

      target.dependencies << dependency
    end

    # Checks whether this target has a dependency on the given target.
    #
    # @param  [Sandbox] sandbox
    #         The sandbox used for this installation.
    #
    # @param  [AbstractTarget] target
    #         The parent target used to add a cached dependency.
    #
    # @param  [TargetMetadata] cached_target
    #         the target to search for.
    #
    # @return [Boolean]
    #
    def self.dependency_for_cached_target?(sandbox, target, cached_target)
      target.dependencies.find do |dep|
        if dep.target_proxy.remote?
          subproject_reference = target.project.reference_for_path(sandbox.root + cached_target.container_project_path)
          uuid = subproject_reference.uuid if subproject_reference
          dep.target_proxy.remote_global_id_string == cached_target.native_target_uuid && dep.target_proxy.container_portal == uuid
        else
          dep.target.uuid == cached_target.native_target_uuid
        end
      end
    end
  end
end
