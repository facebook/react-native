module Xcodeproj
  class Project
    module Object
      # This class represents an attribute of {AbstractObject} subclasses.
      # Attributes are created by the {AbstractObject} DSL methods and allow to
      # mirror the underlying attributes of the xcodeproj document model.
      #
      # Attributes provide support for runtime type checking. They also allow
      # {AbstractObject} initialization and serialization to plist.
      #
      # @todo Add support for a list of required values so objects can be
      #       validated before serialization ?
      #
      class AbstractObjectAttribute
        # @return [Symbol] the type of the attribute. It can be `:simple`,
        #   `:to_one`, `:to_many`.
        #
        attr_reader :type

        # @return [Symbol] the name of the attribute.
        #
        attr_reader :name

        # @return [Class] the class that owns the attribute.
        #
        attr_accessor :owner

        # Creates a new attribute with the given type and name.
        #
        # Attributes are expected to be instantiated only by the
        # {AbstractObject} DSL methods.
        #
        # @param  [Symbol] type
        #         the type of the attribute.
        #
        # @param  [Symbol] name
        #         the name of the attribute.
        #
        # @param  [Class] owner
        #         the class that owns the attribute.
        #
        def initialize(type, name, owner)
          @type  = type
          @name  = name
          @owner = owner
        end

        # @return [String] The name of the attribute in camel case.
        #
        # @example
        #   attribute.new(:simple, :project_root)
        #   attribute.plist_name #=> projectRoot
        #
        def plist_name
          @plist_name ||= CaseConverter.convert_to_plist(name, :lower)
        end

        # @return [Array<Class>] the list of the classes accepted by the
        #   attribute.
        #
        attr_accessor :classes

        # @return [{Symbol, Array<Class>}] the list of the classes accepted by
        #   each key for attributes which store a dictionary.
        #
        attr_accessor :classes_by_key

        # @return [String, Array, Hash] the default value, if any, for simple
        #   attributes.
        #
        attr_accessor :default_value

        # Convenience method that returns the value of this attribute for a
        #   given object.
        #
        # @param [AbstractObject] object
        #   the object for which the value of this attribute is requested.
        #
        # @return [String, Array, Hash, AbstractObject, ObjectList]
        #   the value.
        #
        def get_value(object)
          object.send(name)
        end

        # Convenience method that sets the value of this attribute for a
        #   given object. It makes sense only for `:simple` or `:to_one`
        #   attributes.
        #
        # @raise It the type of this attribute is `:to_many`.
        #
        # @param [AbstractObject] object
        #   the object for which to set the value.
        #
        # @param [String, Hash, Array, AbstractObject] new_value
        #   the value to set for the attribute.
        #
        # @return [void]
        #
        def set_value(object, new_value)
          if type == :to_many
            raise '[Xcodeproj] Set value called for a to-many attribute'
          end
          object.send("#{name}=", new_value)
        end

        # Convenience method that sets the value of this attribute for a given
        # object to the default (if any).  It makes sense only for `:simple`
        # attributes.
        #
        # @param  [AbstractObject] object
        #         the object for which to set the default value.
        #
        # @note   It is extremely important to duplicate the default values
        #         otherwise kittens cry!
        #
        # @return [void]
        #
        def set_default(object)
          unless type == :simple
            raise "[Xcodeproj] Set value called for a #{type} attribute"
          end
          set_value(object, default_value.dup) if default_value
        end

        # Checks that a given value is compatible with the attribute.
        #
        # This method powers the runtime type checking of the {AbstractObject}
        # and is used its by synthesised methods.
        #
        # @raise If the class of the value is not compatible with the attribute.
        #
        # @return [void]
        #
        def validate_value(object)
          return unless object
          acceptable = classes.find { |klass| object.class == klass || object.class < klass }
          if type == :simple
            raise "[Xcodeproj] Type checking error: got `#{object.class}` " \
              "for attribute: #{inspect}" unless acceptable
          else
            raise "[Xcodeproj] Type checking error: got `#{object.isa}` for " \
              "attribute: #{inspect}" unless acceptable
          end
        end

        # Checks that a given value is compatible with a key for attributes
        # which store references by key.
        #
        # This method is used by the #{ObjectDictionary} class.
        #
        # @raise If the class of the value is not compatible with the given
        #  key.
        #
        def validate_value_for_key(object, key)
          unless type == :references_by_keys
            raise '[Xcodeproj] This method should be called only for ' \
              'attributes of type `references_by_keys`'
          end

          unless classes_by_key.keys.include?(key)
            raise "[Xcodeproj] unsupported key `#{key}` " \
              "(accepted `#{classes_by_key.keys}`) for attribute `#{inspect}`"
          end

          return unless object
          classes = Array(classes_by_key[key])
          acceptable = classes.find { |klass| object.class == klass || object.class < klass }
          unless acceptable
            raise "[Xcodeproj] Type checking error: got `#{object.isa}` " \
              "for key `#{key}` (which accepts `#{classes}`) of " \
              "attribute: `#{inspect}`"
          end
        end

        # @return [String] A string suitable for debugging the object.
        #
        def inspect
          if type == :simple
            "Attribute `#{plist_name}` (type: `#{type}`, classes: " \
              "`#{classes}`, owner class: `#{owner.isa}`)"
          else
            "Attribute `#{plist_name}` (type: `#{type}`, classes: " \
              "`#{classes.map(&:isa)}`, owner class: `#{owner.isa}`)"
          end
        end
      end

      class AbstractObject
        # The {AbstractObject} DSL methods allow to specify with fidelity the
        # underlying model of the xcodeproj document format. {AbstractObject}
        # subclasses should specify their attributes through the following
        # methods:
        #
        # - `{AbstractObject.attribute}`
        # - `{AbstractObject.has_one}`
        # - `{AbstractObject.has_many}`
        #
        # @note The subclasses should not interfere with the methods
        #       synthesised by the DSL and should only implement helpers in top
        #       of them.
        #
        # @note Attributes are typed and are validated at runtime.
        #
        class << self
          # @return [Array<AbstractObjectAttribute>] the attributes associated
          #   with the class.
          #
          # @note It includes the attributes defined in the superclass and the
          #   list is cleaned for duplicates. Subclasses should not duplicate
          #   an attribute of the superclass but for the method implementation
          #   they will duplicate them.
          #
          # @visibility private
          #
          def attributes
            unless @full_attributes
              attributes = @attributes || []
              if superclass.respond_to?(:attributes)
                super_attributes = superclass.attributes
              else
                super_attributes = []
              end
              # The uniqueness of the attributes is very important because the
              # initialization from plist deletes the values from the
              # dictionary.
              @full_attributes = attributes.concat(super_attributes).uniq
            end
            @full_attributes
          end

          # @return [Array<AbstractObjectAttribute>] the simple attributes
          #   associated with with the class.
          #
          # @visibility private
          #
          def simple_attributes
            @simple_attributes ||= attributes.select { |a| a.type == :simple }
          end

          # @return [Array<AbstractObjectAttribute>] the attributes
          #   representing a to one relationship associated with with the
          #   class.
          #
          # @visibility private
          #
          def to_one_attributes
            @to_one_attributes ||= attributes.select { |a| a.type == :to_one }
          end

          # @return [Array<AbstractObjectAttribute>] the attributes
          #   representing a to many relationship associated with with the
          #   class.
          #
          # @visibility private
          #
          def to_many_attributes
            @to_many_attributes ||= attributes.select { |a| a.type == :to_many }
          end

          # @visibility private
          #
          def references_by_keys_attributes
            @references_by_keys_attributes ||= attributes.select { |a| a.type == :references_by_keys }
          end

          private

          # Defines a new simple attribute and synthesises the corresponding
          # methods.
          #
          # @note Simple attributes are directly stored in a hash. They can
          #       contain only a string, array of strings or a hash containing
          #       strings and thus they are not affected by reference counting.
          #       Clients can access the hash directly through the
          #       {AbstractObject#simple_attributes_hash} method.
          #
          # @param [Symbol] name
          #   the name of the attribute.
          #
          # @param [Class] klass
          #   the accepted {Class} for the values of the attribute.
          #
          # @param [String, Array<String>, Hash{String=>String}] default_value
          #   the default value for new objects.
          #
          # @example
          #   attribute :project_root
          #   #=> leads to the creation of the following methods
          #
          #   def project_root
          #     @simple_attributes_hash[projectRoot]
          #   end
          #
          #   def project_root=(value)
          #     attribute.validate_value(value)
          #     @simple_attributes_hash[projectRoot] = value
          #   end
          #
          # @macro [attach] attribute
          #   @!attribute [rw] $1
          #
          def attribute(name, klass, default_value = nil)
            attrb = AbstractObjectAttribute.new(:simple, name, self)
            attrb.classes = [klass]
            attrb.default_value = default_value
            add_attribute(attrb)

            define_method(attrb.name) do
              @simple_attributes_hash ||= {}
              @simple_attributes_hash[attrb.plist_name]
            end

            define_method("#{attrb.name}=") do |value|
              @simple_attributes_hash ||= {}
              attrb.validate_value(value)

              existing = @simple_attributes_hash[attrb.plist_name]
              if existing.is_a?(Hash) && value.is_a?(Hash)
                return value if existing.keys == value.keys && existing == value
              elsif existing == value
                return value
              end
              mark_project_as_dirty!
              @simple_attributes_hash[attrb.plist_name] = value
            end
          end

          # rubocop:disable Style/PredicateName

          # Defines a new relationship to a single and synthesises the
          # corresponding methods.
          #
          # @note The synthesised setter takes care of handling reference
          #       counting directly.
          #
          # @param [String] singular_name
          #   the name of the relationship.
          #
          # @param [Class, Array<Class>] isas
          #   the list of the classes corresponding to the accepted isas for
          #   this relationship.
          #
          # @macro [attach] has_one
          #   @!attribute [rw] $1
          #
          def has_one(singular_name, isas)
            isas = [isas] unless isas.is_a?(Array)
            attrb = AbstractObjectAttribute.new(:to_one, singular_name, self)
            attrb.classes = isas
            add_attribute(attrb)

            attr_reader(attrb.name)
            # 1.9.2 fix, see https://github.com/CocoaPods/Xcodeproj/issues/40.
            public(attrb.name)

            variable_name = :"@#{attrb.name}"
            define_method("#{attrb.name}=") do |value|
              attrb.validate_value(value)

              previous_value = send(attrb.name)
              return value if previous_value == value
              mark_project_as_dirty!
              previous_value.remove_referrer(self) if previous_value
              instance_variable_set(variable_name, value)
              value.add_referrer(self) if value
            end
          end

          # Defines a new ordered relationship to many.
          #
          # @note This attribute only generates the reader method. Clients are
          #       not supposed to create {ObjectList} objects which are created
          #       by the methods synthesised by this attribute on demand.
          #       Clients, however can mutate the list according to its
          #       interface. The list is responsible to manage the reference
          #       counting for its values.
          #
          # @param [String] plural_name
          #   the name of the relationship.
          #
          # @param [Class, Array<Class>] isas
          #   the list of the classes corresponding to the accepted isas for
          #   this relationship.
          #
          # @macro [attach] has_many
          #   @!attribute [r] $1
          #
          def has_many(plural_name, isas)
            isas = [isas] unless isas.is_a?(Array)

            attrb = AbstractObjectAttribute.new(:to_many, plural_name, self)
            attrb.classes = isas
            add_attribute(attrb)

            variable_name = :"@#{attrb.name}"
            define_method(attrb.name) do
              # Here we are in the context of the instance
              list = instance_variable_get(variable_name)
              unless list
                list = ObjectList.new(attrb, self)
                instance_variable_set(variable_name, list)
              end
              list
            end
          end

          # Defines a new ordered relationship to many.
          #
          # @note This attribute only generates the reader method. Clients are
          #       not supposed to create {ObjectList} objects which are created
          #       by the methods synthesised by this attribute on demand.
          #       Clients, however can mutate the list according to its
          #       interface. The list is responsible to manage the reference
          #       counting for its values.
          #
          # @param [String] plural_name
          #   the name of the relationship.
          #
          # @param [{Symbol, Array<Class>}] classes_by_key
          #   the list of the classes corresponding to the accepted isas for
          #   this relationship.
          #
          # @macro [attach] has_many
          #   @!attribute [r] $1
          #
          def has_many_references_by_keys(plural_name, classes_by_key)
            attrb = AbstractObjectAttribute.new(:references_by_keys, plural_name, self)
            attrb.classes = classes_by_key.values
            attrb.classes_by_key = classes_by_key
            add_attribute(attrb)

            variable_name = :"@#{attrb.name}"
            define_method(attrb.name) do
              # Here we are in the context of the instance
              list = instance_variable_get(variable_name)
              unless list
                list = ObjectList.new(attrb, self)
                instance_variable_set(variable_name, list)
              end
              list
            end
          end

          # rubocop:enable Style/PredicateName

          protected

          # Adds an attribute to the list of attributes of the class.
          #
          # @note This method is intended to be invoked only by the
          #       {AbstractObject} meta programming methods
          #
          # @return [void]
          #
          def add_attribute(attribute)
            unless attribute.classes
              raise "[Xcodeproj] BUG - missing classes for #{attribute.inspect}"
            end

            unless attribute.classes.all? { |klass| klass.is_a?(Class) }
              raise "[Xcodeproj] BUG - classes:#{attribute.classes} for #{attribute.inspect}"
            end

            @attributes ||= []
            @attributes << attribute
          end
        end # AbstractObject << self

        private

        # @return [Hash] the simple attributes hash.
        #
        attr_reader :simple_attributes_hash

        public

        # @!group xcodeproj format attributes

        # @return (see AbstractObject.attributes)
        #
        # @visibility private
        #
        def attributes
          self.class.attributes
        end

        # @return (see AbstractObject.simple_attributes)
        #
        # @visibility private
        #
        def simple_attributes
          self.class.simple_attributes
        end

        # @return (see AbstractObject.to_one_attributes)
        #
        # @visibility private
        #
        def to_one_attributes
          self.class.to_one_attributes
        end

        # @return (see AbstractObject.to_many_attributes)
        #
        # @visibility private
        #
        def to_many_attributes
          self.class.to_many_attributes
        end

        # @return (see AbstractObject.to_many_attributes)
        #
        # @visibility private
        #
        def references_by_keys_attributes
          self.class.references_by_keys_attributes
        end
      end
    end
  end
end
