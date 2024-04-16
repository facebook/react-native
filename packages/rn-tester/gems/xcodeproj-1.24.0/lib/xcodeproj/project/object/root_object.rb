module Xcodeproj
  class Project
    module Object
      # This class represents the root object of a project document.
      #
      class PBXProject < AbstractObject
        # @!group Attributes

        # @return [ObjectList<AbstractTarget>] a list of all the targets in
        #         the project.
        #
        has_many :targets, AbstractTarget

        # @return [Hash{String => String}] attributes the attributes of the
        #         target.
        #
        # @note   The hash might contain the following keys:
        #
        #         - `CLASSPREFIX`
        #         - `LastUpgradeCheck`
        #         - `ORGANIZATIONNAME`
        #
        attribute :attributes, Hash,
                  'LastSwiftUpdateCheck' => Constants::LAST_SWIFT_UPGRADE_CHECK,
                  'LastUpgradeCheck' => Constants::LAST_UPGRADE_CHECK

        # @return [XCConfigurationList] the configuration list of the project.
        #
        has_one :build_configuration_list, XCConfigurationList

        # @return [String] the compatibility version of the project.
        #
        attribute :compatibility_version, String, 'Xcode 3.2'

        # @return [String] the development region of the project.
        #
        attribute :development_region, String, 'en'

        # @return [String] whether the project has scanned for encodings.
        #
        attribute :has_scanned_for_encodings, String, '0'

        # @return [Array<String>] the list of known regions.
        #
        attribute :known_regions, Array, %w(en Base)

        # @return [PBXGroup] the main group of the project. The one displayed
        #         by Xcode in the Project Navigator.
        #
        has_one :main_group, PBXGroup

        # @return [PBXGroup] the group containing the references to products of
        #         the project.
        #
        has_one :product_ref_group, PBXGroup

        # @return [String] the directory of the project.
        #
        attribute :project_dir_path, String, ''

        # @return [String] the root of the project.
        #
        attribute :project_root, String, ''

        # @return [Array<XCRemoteSwiftPackageReference, XCLocalSwiftPackageReference>] the list of Swift package references.
        #
        has_many :package_references, [XCRemoteSwiftPackageReference, XCLocalSwiftPackageReference]

        # @return [Array<ObjectDictionary>] any reference to other projects.
        #
        has_many_references_by_keys :project_references,
                                    :project_ref   => PBXFileReference,
                                    :product_group => PBXGroup

        def name
          project.path.basename('.xcodeproj').to_s
        end

        def ascii_plist_annotation
          ' Project object '
        end

        def to_hash_as(method = :to_hash)
          hash_as = super
          if !hash_as['packageReferences'].nil? && hash_as['packageReferences'].empty?
            hash_as.delete('packageReferences') if !hash_as['packageReferences'].nil? && hash_as['packageReferences'].empty?
          end
          hash_as
        end

        def to_ascii_plist
          plist = super
          plist.value.delete('projectReferences') if plist.value['projectReferences'].empty?
          plist.value.delete('packageReferences') if !plist.value['packageReferences'].nil? && plist.value['packageReferences'].empty?
          plist
        end
      end
    end
  end
end
