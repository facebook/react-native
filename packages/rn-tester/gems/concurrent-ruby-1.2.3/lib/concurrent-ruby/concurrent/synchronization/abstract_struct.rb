module Concurrent
  module Synchronization

    # @!visibility private
    # @!macro internal_implementation_note
    module AbstractStruct

      # @!visibility private
      def initialize(*values)
        super()
        ns_initialize(*values)
      end

      # @!macro struct_length
      #
      #   Returns the number of struct members.
      #
      #   @return [Fixnum] the number of struct members
      def length
        self.class::MEMBERS.length
      end
      alias_method :size, :length

      # @!macro struct_members
      #
      #   Returns the struct members as an array of symbols.
      #
      #   @return [Array] the struct members as an array of symbols
      def members
        self.class::MEMBERS.dup
      end

      protected

      # @!macro struct_values
      #
      # @!visibility private
      def ns_values
        @values.dup
      end

      # @!macro struct_values_at
      #
      # @!visibility private
      def ns_values_at(indexes)
        @values.values_at(*indexes)
      end

      # @!macro struct_to_h
      #
      # @!visibility private
      def ns_to_h
        length.times.reduce({}){|memo, i| memo[self.class::MEMBERS[i]] = @values[i]; memo}
      end

      # @!macro struct_get
      #
      # @!visibility private
      def ns_get(member)
        if member.is_a? Integer
          if member >= @values.length
            raise IndexError.new("offset #{member} too large for struct(size:#{@values.length})")
          end
          @values[member]
        else
          send(member)
        end
      rescue NoMethodError
        raise NameError.new("no member '#{member}' in struct")
      end

      # @!macro struct_equality
      #
      # @!visibility private
      def ns_equality(other)
        self.class == other.class && self.values == other.values
      end

      # @!macro struct_each
      #
      # @!visibility private
      def ns_each
        values.each{|value| yield value }
      end

      # @!macro struct_each_pair
      #
      # @!visibility private
      def ns_each_pair
        @values.length.times do |index|
          yield self.class::MEMBERS[index], @values[index]
        end
      end

      # @!macro struct_select
      #
      # @!visibility private
      def ns_select
        values.select{|value| yield value }
      end

      # @!macro struct_inspect
      #
      # @!visibility private
      def ns_inspect
        struct = pr_underscore(self.class.ancestors[1])
        clazz = ((self.class.to_s =~ /^#<Class:/) == 0) ? '' : " #{self.class}"
        "#<#{struct}#{clazz} #{ns_to_h}>"
      end

      # @!macro struct_merge
      #
      # @!visibility private
      def ns_merge(other, &block)
        self.class.new(*self.to_h.merge(other, &block).values)
      end

      # @!visibility private
      def ns_initialize_copy
        @values = @values.map do |val|
          begin
            val.clone
          rescue TypeError
            val
          end
        end
      end

      # @!visibility private
      def pr_underscore(clazz)
        word = clazz.to_s.dup # dup string to workaround JRuby 9.2.0.0 bug https://github.com/jruby/jruby/issues/5229
        word.gsub!(/::/, '/')
        word.gsub!(/([A-Z]+)([A-Z][a-z])/,'\1_\2')
        word.gsub!(/([a-z\d])([A-Z])/,'\1_\2')
        word.tr!("-", "_")
        word.downcase!
        word
      end

      # @!visibility private
      def self.define_struct_class(parent, base, name, members, &block)
        clazz = Class.new(base || Object) do
          include parent
          self.const_set(:MEMBERS, members.collect{|member| member.to_s.to_sym}.freeze)
          def ns_initialize(*values)
            raise ArgumentError.new('struct size differs') if values.length > length
            @values = values.fill(nil, values.length..length-1)
          end
        end
        unless name.nil?
          begin
            parent.send :remove_const, name if parent.const_defined?(name, false)
            parent.const_set(name, clazz)
            clazz
          rescue NameError
            raise NameError.new("identifier #{name} needs to be constant")
          end
        end
        members.each_with_index do |member, index|
          clazz.send :remove_method, member if clazz.instance_methods.include? member
          clazz.send(:define_method, member) do
            @values[index]
          end
        end
        clazz.class_exec(&block) unless block.nil?
        clazz.singleton_class.send :alias_method, :[], :new
        clazz
      end
    end
  end
end
