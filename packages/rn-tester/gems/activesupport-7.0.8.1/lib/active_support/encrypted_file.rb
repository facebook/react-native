# frozen_string_literal: true

require "pathname"
require "tempfile"
require "active_support/message_encryptor"

module ActiveSupport
  class EncryptedFile
    class MissingContentError < RuntimeError
      def initialize(content_path)
        super "Missing encrypted content file in #{content_path}."
      end
    end

    class MissingKeyError < RuntimeError
      def initialize(key_path:, env_key:)
        super \
          "Missing encryption key to decrypt file with. " +
          "Ask your team for your master key and write it to #{key_path} or put it in the ENV['#{env_key}']."
      end
    end

    class InvalidKeyLengthError < RuntimeError
      def initialize
        super "Encryption key must be exactly #{EncryptedFile.expected_key_length} characters."
      end
    end

    CIPHER = "aes-128-gcm"

    def self.generate_key
      SecureRandom.hex(ActiveSupport::MessageEncryptor.key_len(CIPHER))
    end

    def self.expected_key_length # :nodoc:
      @expected_key_length ||= generate_key.length
    end


    attr_reader :content_path, :key_path, :env_key, :raise_if_missing_key

    def initialize(content_path:, key_path:, env_key:, raise_if_missing_key:)
      @content_path = Pathname.new(content_path).yield_self { |path| path.symlink? ? path.realpath : path }
      @key_path = Pathname.new(key_path)
      @env_key, @raise_if_missing_key = env_key, raise_if_missing_key
    end

    # Returns the encryption key, first trying the environment variable
    # specified by +env_key+, then trying the key file specified by +key_path+.
    # If +raise_if_missing_key+ is true, raises MissingKeyError if the
    # environment variable is not set and the key file does not exist.
    def key
      read_env_key || read_key_file || handle_missing_key
    end

    # Reads the file and returns the decrypted content.
    #
    # Raises:
    # - MissingKeyError if the key is missing and +raise_if_missing_key+ is true.
    # - MissingContentError if the encrypted file does not exist or otherwise
    #   if the key is missing.
    # - ActiveSupport::MessageEncryptor::InvalidMessage if the content cannot be
    #   decrypted or verified.
    def read
      if !key.nil? && content_path.exist?
        decrypt content_path.binread
      else
        raise MissingContentError, content_path
      end
    end

    def write(contents)
      IO.binwrite "#{content_path}.tmp", encrypt(contents)
      FileUtils.mv "#{content_path}.tmp", content_path
    end

    def change(&block)
      writing read, &block
    end


    private
      def writing(contents)
        Tempfile.create(["", "-" + content_path.basename.to_s.chomp(".enc")]) do |tmp_file|
          tmp_path = Pathname.new(tmp_file)
          tmp_path.binwrite contents

          yield tmp_path

          updated_contents = tmp_path.binread

          write(updated_contents) if updated_contents != contents
        end
      end


      def encrypt(contents)
        check_key_length
        encryptor.encrypt_and_sign contents
      end

      def decrypt(contents)
        encryptor.decrypt_and_verify contents
      end

      def encryptor
        @encryptor ||= ActiveSupport::MessageEncryptor.new([ key ].pack("H*"), cipher: CIPHER)
      end


      def read_env_key
        ENV[env_key].presence
      end

      def read_key_file
        return @key_file_contents if defined?(@key_file_contents)
        @key_file_contents = (key_path.binread.strip if key_path.exist?)
      end

      def handle_missing_key
        raise MissingKeyError.new(key_path: key_path, env_key: env_key) if raise_if_missing_key
      end

      def check_key_length
        raise InvalidKeyLengthError if key&.length != self.class.expected_key_length
      end
  end
end
