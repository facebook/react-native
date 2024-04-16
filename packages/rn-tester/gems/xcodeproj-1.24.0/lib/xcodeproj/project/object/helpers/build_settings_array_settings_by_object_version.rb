require 'set'

module Xcodeproj
  class Project
    module Object
      class XCBuildConfiguration
        # yes, they are case-sensitive.
        # no, Xcode doesn't do this for other PathList settings nor other
        # settings ending in SEARCH_PATHS.
        module BuildSettingsArraySettingsByObjectVersion
          ARRAY_SETTINGS = %w(
            ALTERNATE_PERMISSIONS_FILES
            ARCHS
            BUILD_VARIANTS
            EXCLUDED_SOURCE_FILE_NAMES
            FRAMEWORK_SEARCH_PATHS
            GCC_PREPROCESSOR_DEFINITIONS
            GCC_PREPROCESSOR_DEFINITIONS_NOT_USED_IN_PRECOMPS
            HEADER_SEARCH_PATHS
            INFOPLIST_PREPROCESSOR_DEFINITIONS
            LIBRARY_SEARCH_PATHS
            OTHER_CFLAGS
            OTHER_CPLUSPLUSFLAGS
            OTHER_LDFLAGS
            REZ_SEARCH_PATHS
            SECTORDER_FLAGS
            WARNING_CFLAGS
            WARNING_LDFLAGS
          ).to_set.freeze
          private_constant :ARRAY_SETTINGS

          ARRAY_SETTINGS_OBJECT_VERSION_50 = %w(
            ALTERNATE_PERMISSIONS_FILES
            ARCHS
            BUILD_VARIANTS
            EXCLUDED_SOURCE_FILE_NAMES
            FRAMEWORK_SEARCH_PATHS
            GCC_PREPROCESSOR_DEFINITIONS
            GCC_PREPROCESSOR_DEFINITIONS_NOT_USED_IN_PRECOMPS
            HEADER_SEARCH_PATHS
            INCLUDED_SOURCE_FILE_NAMES
            INFOPLIST_PREPROCESSOR_DEFINITIONS
            LD_RUNPATH_SEARCH_PATHS
            LIBRARY_SEARCH_PATHS
            LOCALIZED_STRING_MACRO_NAMES
            OTHER_CFLAGS
            OTHER_CPLUSPLUSFLAGS
            OTHER_LDFLAGS
            REZ_SEARCH_PATHS
            SECTORDER_FLAGS
            SYSTEM_FRAMEWORK_SEARCH_PATHS
            SYSTEM_HEADER_SEARCH_PATHS
            USER_HEADER_SEARCH_PATHS
            WARNING_CFLAGS
            WARNING_LDFLAGS
          ).to_set.freeze
          private_constant :ARRAY_SETTINGS_OBJECT_VERSION_50

          def self.[](object_version)
            object_version = object_version.to_i

            if object_version >= 50
              ARRAY_SETTINGS_OBJECT_VERSION_50
            else
              ARRAY_SETTINGS
            end
          end
        end
      end
    end
  end
end
