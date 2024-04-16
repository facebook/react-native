module Xcodeproj
  class Project
    module Object
      # Apparently a proxy for a reference object which might belong another
      # project contained in the same workspace of the project document.
      #
      # This class is used for referencing the products of another project.
      #
      class PBXReferenceProxy < AbstractObject
        # @!group Attributes

        # @return [String] the name of the reference.
        #
        attribute :name, String

        # @return [String] the path of the referenced filed.
        #
        attribute :path, String

        # @return [String] the file type of the referenced filed.
        #
        attribute :file_type, String

        # @return [PBXContainerItemProxy] the proxy to the project that
        #         contains the object.
        #
        has_one :remote_ref, PBXContainerItemProxy

        # @return [String] the source tree for the path of the reference.
        #
        # @example
        #   "BUILT_PRODUCTS_DIR"
        #
        attribute :source_tree, String

        #---------------------------------------------------------------------#

        public

        # @!group Helpers

        # Checks whether the reference is a proxy.
        #
        # @return [Bool] always true for this ISA.
        #
        def proxy?
          true
        end

        #---------------------------------------------------------------------#

        def ascii_plist_annotation
          " #{name || path && File.basename(path)} "
        end

        # @return [String] A name suitable for displaying the object to the
        #         user.
        #
        def display_name
          return name if name
          return path if path
          super
        end

        # @return [Array<PBXBuildFile>] the build files associated with the
        #         current reference proxy.
        #
        def build_files
          referrers.grep(PBXBuildFile)
        end

        # In addition to removing the reference proxy, this will also remove any
        # items related to this reference.
        #
        # @see AbstractObject#remove_from_project
        #
        # @return [void]
        #
        def remove_from_project
          build_files.each(&:remove_from_project)
          super
        end
      end
    end
  end
end
