require 'xcodeproj/scheme/abstract_scheme_action'

module Xcodeproj
  class XCScheme
    # This class wraps the ArchiveAction node of a .xcscheme XML file
    #
    class ArchiveAction < AbstractSchemeAction
      # @param [REXML::Element] node
      #        The 'ArchiveAction' XML node that this object will wrap.
      #        If nil, will create a default XML node to use.
      #
      def initialize(node = nil)
        create_xml_element_with_fallback(node, 'ArchiveAction') do
          self.build_configuration = 'Release'
          self.reveal_archive_in_organizer = true
        end
      end

      # @return [Bool]
      #         Whether the Archive will be revealed in Xcode's Organizer
      #         after it's done building.
      #
      def reveal_archive_in_organizer?
        string_to_bool(@xml_element.attributes['revealArchiveInOrganizer'])
      end

      # @param [Bool] flag
      #        Set whether the Archive will be revealed in Xcode's Organizer
      #        after it's done building.
      #
      def reveal_archive_in_organizer=(flag)
        @xml_element.attributes['revealArchiveInOrganizer'] = bool_to_string(flag)
      end

      # @return [String]
      #         The custom name to give to the archive.
      #         If nil, the generated archive will have the same name as the one
      #         set in the associated target's Build Settings for the built product.
      #
      def custom_archive_name
        @xml_element.attributes['customArchiveName']
      end

      # @param [String] name
      #        Set the custom name to use for the built archive
      #        If nil, the customization of the archive name will be removed and
      #        the generated archive will have the same name as the one set in the
      #        associated target's Build Settings for the build product.
      #
      def custom_archive_name=(name)
        if name
          @xml_element.attributes['customArchiveName'] = name
        else
          @xml_element.delete_attribute('customArchiveName')
        end
      end
    end
  end
end
