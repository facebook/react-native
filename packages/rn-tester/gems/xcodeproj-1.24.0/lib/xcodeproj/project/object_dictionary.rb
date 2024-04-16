module Xcodeproj
  class Project
    # This class represents relationships to other objects stored in a
    # Dictionary.
    #
    # It works in conjunction with the {AbstractObject} class to ensure that
    # the project is not serialized with unreachable objects by updating the
    # with reference count on modifications.
    #
    # @note To provide full support as the other classes the dictionary should:
    #
    #       Give the following attribute:
    #
    #            has_many_references_by_keys :project_references, {
    #              :project_ref   => PBXFileReference,
    #              :product_group => PBXGroup
    #            }
    #
    #       This should be possible:
    #
    #            #=> Note the API:
    #            root_object.project_references.project_ref = file
    #
    #            #=> This should raise:
    #            root_object.project_references.product_group = file
    #
    #       I.e. generate setters and getters from the specification hash.
    #
    #       Also the interface is a dirty hybrid between the
    #       {AbstractObjectAttribute} and the {ObjectList}.
    #
    # @note Concerning the mutations methods it is safe to call only those
    #       which are overridden to inform objects reference count. Ideally all
    #       the hash methods should be covered, but this is not done yet.
    #       Moreover it is a moving target because the methods of array
    #       usually are implemented in C.
    #
    # @todo This class should use a {Hash} as a backing store instead of
    #       inheriting from it. This would prevent the usage of methods which
    #       don't notify the objects.
    #
    class ObjectDictionary < Hash
      # @param  [Object::AbstractObjectAttribute] attribute @see #attribute
      # @param  [Object] owner @see #owner
      #
      def initialize(attribute, owner)
        @attribute = attribute
        @owner = owner
      end

      # @return [Object::AbstractObjectAttribute] The attribute that generated
      #         the list.
      #
      attr_reader :attribute

      # @return [Object] The object that owns the list.
      #
      attr_reader :owner

      # @return [Array<Symbol>] The list of the allowed keys.
      #
      def allowed_keys
        attribute.classes_by_key.keys
      end

      # @return [String] A string suitable for debugging.
      #
      def inspect
        "<ObjectDictionary attribute:`#{@attribute.name}` " \
          "owner:`#{@owner.display_name}` values:#{super.inspect}>"
      end

      # @!group Notification enabled methods
      #------------------------------------------------------------------------#

      # Associates an object to the given key and updates its references count.
      #
      # @param  [String] key
      #         The key.
      #
      # @param  [AbstractObject] object
      #         The object to add to the dictionary.
      #
      # @return [AbstractObject] The given object.
      #
      def []=(key, object)
        key = normalize_key(key)
        if object
          perform_additions_operations(object, key)
        else
          perform_deletion_operations(self[key])
        end
        super(key, object)
      end

      # Removes the given key from the dictionary and informs the object that
      # is not longer referenced by the owner.
      #
      # @param  [String] key
      #         The key.
      #
      def delete(key)
        key = normalize_key(key)
        object = self[key]
        perform_deletion_operations(object)
        super
      end

      # @!group AbstractObject Methods
      #-----------------------------------------------------------------------#

      # @return [Hash<String => String>] The plist representation of the
      #         dictionary where the objects are replaced by their UUIDs.
      #
      def to_hash
        result = {}
        each do |key, obj|
          if obj
            plist_key = Object::CaseConverter.convert_to_plist(key, nil)
            result[plist_key] = Nanaimo::String.new(obj.uuid, obj.ascii_plist_annotation)
          end
        end
        result
      end

      def to_ascii_plist
        to_hash
      end

      # @return [Hash<String => String>] Returns a cascade representation of
      #         the object without UUIDs.
      #
      def to_tree_hash
        result = {}
        each do |key, obj|
          if obj
            plist_key = Object::CaseConverter.convert_to_plist(key, nil)
            result[plist_key] = obj.to_tree_hash
          end
        end
        result
      end

      # Removes all the references to a given object.
      #
      def remove_reference(object)
        each { |key, obj| self[key] = nil if obj == object }
      end

      # Informs the objects contained in the dictionary that another object is
      # referencing them.
      #
      def add_referrer(referrer)
        values.each { |obj| obj.add_referrer(referrer) }
      end

      # Informs the objects contained in the dictionary that another object
      # stopped referencing them.
      #
      def remove_referrer(referrer)
        values.each { |obj| obj.remove_referrer(referrer) }
      end

      private

      # @!group Private helpers
      #------------------------------------------------------------------------#

      # @return [Symbol] Normalizes a key to a symbol converting the camel case
      #         format with underscores.
      #
      # @param  [String, Symbol] key
      #         The key to normalize.
      #
      def normalize_key(key)
        if key.is_a?(String)
          key = Object::CaseConverter.convert_to_ruby(key)
        end

        unless allowed_keys.include?(key)
          raise "[Xcodeproj] Unsupported key `#{key}` (allowed " \
            "`#{allowed_keys}`) for `#{inspect}`"
        end
        key
      end

      # Informs an object that it was added to the dictionary. In practice it
      # adds the owner of the list as referrer to the objects. It also
      # validates the value.
      #
      # @return [void]
      #
      def perform_additions_operations(object, key)
        owner.mark_project_as_dirty!
        object.add_referrer(owner)
        attribute.validate_value_for_key(object, key)
      end

      # Informs an object that it was removed from to the dictionary, so it can
      # remove it from its referrers and take the appropriate actions.
      #
      # @return [void]
      #
      def perform_deletion_operations(objects)
        owner.mark_project_as_dirty!
        objects.remove_referrer(owner)
      end
    end
  end
end
