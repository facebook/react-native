module Typhoeus
  class Request

    # This module contains custom serializer.
    module Marshal

      # Return the important data needed to serialize this Request, except the
      # request callbacks and `hydra`, since they cannot be marshalled.
      def marshal_dump
        unmarshallable = %w(@on_complete @on_success @on_failure @on_progress @on_headers @on_body @hydra)
        (instance_variables - unmarshallable - unmarshallable.map(&:to_sym)).map do |name|
          [name, instance_variable_get(name)]
        end
      end

      # Load.
      def marshal_load(attributes)
        attributes.each { |name, value| instance_variable_set(name, value) }
      end
    end
  end
end
