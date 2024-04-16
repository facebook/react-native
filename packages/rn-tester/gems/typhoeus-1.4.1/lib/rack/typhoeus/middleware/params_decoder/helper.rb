module Rack
  module Typhoeus
    module Middleware
      class ParamsDecoder
        module Helper

          # Recursively decodes Typhoeus encoded arrays in given Hash.
          #
          # @example Use directly in a Rails controller.
          #    class ApplicationController
          #       before_filter :decode_typhoeus_arrays
          #    end
          #
          # @author Dwayne Macgowan
          #
          def decode_typhoeus_arrays
            decode!(params)
          end

          # Recursively decodes Typhoeus encoded arrays in given Hash.
          #
          # @param hash [Hash]. This Hash will be modified!
          #
          # @return [Hash] Hash with properly decoded nested arrays.
          def decode!(hash)
            return hash unless hash.is_a?(Hash)
            hash.each_pair do |key,value|
              if value.is_a?(Hash)
                decode!(value)
                hash[key] = convert(value)
              end
            end
            hash
          end

          def decode(hash)
            decode!(hash.dup)
          end

          private

          # Checks if Hash is an Array encoded as a Hash.
          # Specifically will check for the Hash to have this
          # form: {'0' => v0, '1' => v1, .., 'n' => vN }
          #
          # @param hash [Hash]
          #
          # @return [Boolean] True if its a encoded Array, else false.
          def encoded?(hash)
            return false if hash.empty?
	          if hash.keys.size > 1
              keys = hash.keys.map{|i| i.to_i if i.respond_to?(:to_i)}.sort
              keys == hash.keys.size.times.to_a
	          else
              hash.keys.first =~ /0/
	          end
          end

          # If the Hash is an array encoded by typhoeus an array is returned
          # else the self is returned
          #
          # @param hash [Hash] The Hash to convert into an Array.
          #
          # @return [Arraya/Hash]
          def convert(hash)
            if encoded?(hash)
              hash.sort{ |a, b| a[0].to_i <=> b[0].to_i }.map{ |key, value| value }
            else
              hash
            end
          end
        end
      end
    end
  end
end
