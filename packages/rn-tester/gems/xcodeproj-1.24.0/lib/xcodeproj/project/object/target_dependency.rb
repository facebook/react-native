module Xcodeproj
  class Project
    module Object
      # Represents a dependency of a target on another one.
      #
      class PBXTargetDependency < AbstractObject
        # @!group Attributes

        # @return [PBXNativeTarget] the target that needs to be built to
        #         satisfy the dependency.
        #
        has_one :target, AbstractTarget

        # @return [PBXContainerItemProxy] a proxy for the target that needs to
        #         be built.
        #
        # @note   Apparently to support targets in other projects of the same
        #         workspace.
        #
        has_one :target_proxy, PBXContainerItemProxy

        # @return [String] the name of the target.
        #
        # @note   This seems only to be used when the target dependency is a
        #         target from a nested Xcode project.
        #
        attribute :name, String

        # @return [String] the platform filter for this target dependency.
        #
        attribute :platform_filter, String

        # @return [Array<String>] the platform filters for this target dependency.
        #
        attribute :platform_filters, Array

        # @return [XCSwiftPackageProductDependency] the Swift Package product
        #         for this target dependency.
        #
        has_one :product_ref, XCSwiftPackageProductDependency

        public

        # @!group AbstractObject Hooks
        #--------------------------------------#

        # @return [String] The name of the dependency.
        #
        def display_name
          return name if name
          return target.name if target
          return target_proxy.remote_info if target_proxy
          return product_ref.product_name if product_ref
        end

        def ascii_plist_annotation
          " #{isa} "
        end

        # @return [String] the uuid of the target if the dependency is a native
        #         target, the uuid of the target in the sub-project if the
        #         dependency is a target proxy, nil if the dependency is a Swift
        #         Package.
        #
        def native_target_uuid
          return target.uuid if target
          return target_proxy.remote_global_id_string if target_proxy
          return nil if product_ref
          raise "Expected target or target_proxy, from which to fetch a uuid for target '#{display_name}'." \
            "Find and clear the PBXTargetDependency entry with uuid '#{@uuid}' in your .xcodeproj."
        end

        # @note This override is necessary because Xcode allows for circular
        #       target dependencies.
        #
        # @return [Hash<String => String>] Returns a cascade representation of
        #         the object without UUIDs.
        #
        def to_tree_hash
          hash = {}
          hash['displayName'] = display_name
          hash['isa'] = isa
          hash['targetProxy'] = target_proxy.to_tree_hash if target_proxy
          hash
        end

        # @note This is a no-op, because the targets could theoretically depend
        #   on each other, leading to a stack level too deep error.
        #
        # @see AbstractObject#sort_recursively
        #
        def sort_recursively(_options = nil)
        end
      end
    end
  end
end
