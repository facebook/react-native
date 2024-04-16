module Xcodeproj
  class XCScheme
    # This class wraps the RemoteRunnable node of a .xcscheme XML file
    #
    # A RemoteRunnable is a product that is both buildable
    # (it contains a BuildableReference) and
    # runnable remotely (it can be launched and debugged on a remote device, i.e. an Apple Watch)
    #
    class RemoteRunnable < XMLElementWrapper
      # @param [Xcodeproj::Project::Object::AbstractTarget, REXML::Element] target_or_node
      #        Either the Xcode target to reference,
      #        or an existing XML 'RemoteRunnable' node element to reference
      #        or nil to create an new, empty RemoteRunnable
      #
      # @param [#to_s] runnable_debugging_mode
      #        The debugging mode (usually '2')
      #
      # @param [#to_s] bundle_identifier
      #        The bundle identifier (usually 'com.apple.Carousel')
      #
      # @param [#to_s] remote_path
      #        The remote path (not required, unknown usage)
      #
      def initialize(target_or_node = nil, runnable_debugging_mode = nil, bundle_identifier = nil, remote_path = nil)
        create_xml_element_with_fallback(target_or_node, 'RemoteRunnable') do
          self.buildable_reference = BuildableReference.new(target_or_node) if target_or_node
          @xml_element.attributes['runnableDebuggingMode'] = runnable_debugging_mode.to_s if runnable_debugging_mode
          @xml_element.attributes['BundleIdentifier'] = bundle_identifier.to_s if bundle_identifier
          @xml_element.attributes['RemotePath'] = remote_path.to_s if remote_path
        end
      end

      # @return [String]
      #         The runnable debugging mode (usually '2')
      #
      def runnable_debugging_mode
        @xml_element.attributes['runnableDebuggingMode']
      end

      # @param [String] value
      #        Set the runnable debugging mode
      #
      def runnable_debugging_mode=(value)
        @xml_element.attributes['runnableDebuggingMode'] = value.to_s
      end

      # @return [String]
      #         The runnable bundle identifier (usually 'com.apple.Carousel')
      #
      def bundle_identifier
        @xml_element.attributes['BundleIdentifier']
      end

      # @param [String] value
      #        Set the runnable bundle identifier
      #
      def bundle_identifier=(value)
        @xml_element.attributes['BundleIdentifier'] = value.to_s
      end

      # @return [String]
      #         The runnable remote path (not required, unknown usage)
      #
      def remote_path
        @xml_element.attributes['RemotePath']
      end

      # @param [String] value
      #        Set the runnable remote path
      #
      def remote_path=(value)
        @xml_element.attributes['RemotePath'] = value.to_s
      end

      # @return [BuildableReference]
      #         The buildable reference this remote runnable is gonna build and run
      #
      def buildable_reference
        @buildable_reference ||= BuildableReference.new @xml_element.elements['BuildableReference']
      end

      # @param [BuildableReference] ref
      #        Set the buildable reference this remote runnable is gonna build and run
      #
      def buildable_reference=(ref)
        @xml_element.delete_element('BuildableReference')
        @xml_element.add_element(ref.xml_element)
        @buildable_reference = ref
      end
    end
  end
end
