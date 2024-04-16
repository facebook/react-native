module Xcodeproj
  class Project
    module Object
      # Apparently a proxy for another object which might belong another
      # project contained in the same workspace of the project document.
      #
      # This class is referenced by {PBXTargetDependency} for information about
      # it usage see the specs of that class.
      #
      # @note  This class references the other objects by UUID instead of
      #        creating proper relationships because the other objects might be
      #        part of another project. This implies that the references to
      #        other objects should not increase the retain count of the
      #        targets.
      #
      # @todo: This class needs some work to support targets across workspaces,
      #        as the container portal might not be initialized leading
      #        xcodeproj to raise because ti can't find the UUID.
      #
      class PBXContainerItemProxy < AbstractObject
        # @!group Attributes

        # @return [String] apparently the UUID of the root object
        #         {PBXProject} of the project containing the represented
        #         object.
        #
        # @todo   this is an attribute because a it is usually a reference to
        #         the root object or to a file reference to another project.
        #         The reference to the root object causes a retain cycle that
        #         could cause issues (e.g. in to_tree_hash). Usually those
        #         objects are retained by at least another object (the
        #         {Project} for the root object and a {PBXGroup} for the
        #         reference to another project) and so the referenced object
        #         should be serialized.
        #
        #         If this assumption is incorrect, there could be loss of
        #         information opening and saving an existing project.
        #
        # @todo   This is the external reference that 'contains' other proxy
        #         items.
        attribute :container_portal, String

        # @return [String] the type of the proxy.
        #
        # @note   @see {Constants::PROXY_TYPE.values} for valid values.
        #
        attribute :proxy_type, String

        # @return [String] apparently the UUID of the represented
        #         object.
        #
        # @note   If the object is in another project the UUID would not be
        #         present in the {Project#objects_by_uuid} hash. For this
        #         reason this is not an `has_one` attribute. It is assumes that
        #         if the object belongs to the project at least another object
        #         should be retaining it. This assumption is reasonable because
        #         this is a proxy class.
        #
        #         If this assumption is incorrect, there could be loss of
        #         information opening and saving an existing project.
        #
        attribute :remote_global_id_string, String

        # @return [String] apparently the name of the object represented by
        #         the proxy.
        #
        attribute :remote_info, String

        # Checks whether the reference points to a remote project.
        #
        # @return [Bool]
        #
        def remote?
          project.root_object.uuid != container_portal
        end

        # Get the proxied object
        #
        # @return [AbstractObject]
        #
        def proxied_object
          container_portal_object.objects_by_uuid[remote_global_id_string]
        end

        def container_portal_object
          if remote?
            container_portal_file_ref = project.objects_by_uuid[container_portal]
            Project.open(container_portal_file_ref.real_path)
          else
            project
          end
        end

        def container_portal_annotation
          if remote?
            " #{File.basename(project.objects_by_uuid[container_portal].real_path)} "
          else
            project.root_object.ascii_plist_annotation
          end
        end

        def to_hash_as(method = :to_hash)
          hash = super
          if method == :to_ascii_plist
            hash['containerPortal'] = Nanaimo::String.new(container_portal, container_portal_annotation)
          end
          hash
        end

        def ascii_plist_annotation
          " #{isa} "
        end
      end
    end
  end
end
