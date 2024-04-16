module Xcodeproj
  class Project
    module Object
      # Contains the information about the build settings of a file used by an
      # {AbstractBuildPhase}.
      #
      class PBXBuildFile < AbstractObject
        # @!group Attributes

        # @return [Hash] the list of build settings for this file.
        #
        # @note   The contents of this array depend on the phase of the build
        #         file.
        #
        #         For PBXHeadersBuildPhase is `{ "ATTRIBUTES" => [:value] }`
        #         where `:value` can be `Public`, `Private`, or nil
        #         (Protected).
        #
        attribute :settings, Hash

        # @return [PBXFileReference] the file to build.
        #
        # @todo   I think that is possible to add any kind of group (for
        #         example folders linked to a path).
        #
        has_one :file_ref, [
          PBXFileReference,
          PBXGroup,
          PBXVariantGroup,
          XCVersionGroup,
          PBXReferenceProxy,
        ]

        # @return [XCSwiftPackageProductDependency] the Swift Package file to build.
        #
        has_one :product_ref, XCSwiftPackageProductDependency

        # @return [String] the platform filter for this build file.
        #
        attribute :platform_filter, String

        # @return [Array<String>] the platform filters for this build file.
        #
        attribute :platform_filters, Array

        #---------------------------------------------------------------------#

        public

        # @!group AbstractObject Hooks

        # @return [String] A name suitable for displaying the object to the
        #         user.
        #
        def display_name
          if product_ref
            product_ref.display_name
          elsif file_ref
            file_ref.display_name
          else
            super
          end
        end

        # @return [Hash{String => Hash}, String] A hash suitable to display the
        #         object to the user.
        #
        def pretty_print
          if settings.nil? || settings.empty?
            display_name
          else
            { display_name => settings }
          end
        end

        def ascii_plist_annotation
          " #{display_name} in #{GroupableHelper.parent(self).display_name} "
        end

        #---------------------------------------------------------------------#
      end
    end
  end
end
