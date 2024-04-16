# frozen_string_literal: true

require "securerandom"
require "openssl"

module Digest
  module UUID
    DNS_NAMESPACE  = "k\xA7\xB8\x10\x9D\xAD\x11\xD1\x80\xB4\x00\xC0O\xD40\xC8" # :nodoc:
    URL_NAMESPACE  = "k\xA7\xB8\x11\x9D\xAD\x11\xD1\x80\xB4\x00\xC0O\xD40\xC8" # :nodoc:
    OID_NAMESPACE  = "k\xA7\xB8\x12\x9D\xAD\x11\xD1\x80\xB4\x00\xC0O\xD40\xC8" # :nodoc:
    X500_NAMESPACE = "k\xA7\xB8\x14\x9D\xAD\x11\xD1\x80\xB4\x00\xC0O\xD40\xC8" # :nodoc:

    mattr_accessor :use_rfc4122_namespaced_uuids, instance_accessor: false, default: false

    # Generates a v5 non-random UUID (Universally Unique IDentifier).
    #
    # Using OpenSSL::Digest::MD5 generates version 3 UUIDs; OpenSSL::Digest::SHA1 generates version 5 UUIDs.
    # uuid_from_hash always generates the same UUID for a given name and namespace combination.
    #
    # See RFC 4122 for details of UUID at: https://www.ietf.org/rfc/rfc4122.txt
    def self.uuid_from_hash(hash_class, namespace, name)
      if hash_class == Digest::MD5 || hash_class == OpenSSL::Digest::MD5
        version = 3
      elsif hash_class == Digest::SHA1 || hash_class == OpenSSL::Digest::SHA1
        version = 5
      else
        raise ArgumentError, "Expected OpenSSL::Digest::SHA1 or OpenSSL::Digest::MD5, got #{hash_class.name}."
      end

      uuid_namespace = pack_uuid_namespace(namespace)

      hash = hash_class.new
      hash.update(uuid_namespace)
      hash.update(name)

      ary = hash.digest.unpack("NnnnnN")
      ary[2] = (ary[2] & 0x0FFF) | (version << 12)
      ary[3] = (ary[3] & 0x3FFF) | 0x8000

      "%08x-%04x-%04x-%04x-%04x%08x" % ary
    end

    # Convenience method for uuid_from_hash using OpenSSL::Digest::MD5.
    def self.uuid_v3(uuid_namespace, name)
      uuid_from_hash(OpenSSL::Digest::MD5, uuid_namespace, name)
    end

    # Convenience method for uuid_from_hash using OpenSSL::Digest::SHA1.
    def self.uuid_v5(uuid_namespace, name)
      uuid_from_hash(OpenSSL::Digest::SHA1, uuid_namespace, name)
    end

    # Convenience method for SecureRandom.uuid.
    def self.uuid_v4
      SecureRandom.uuid
    end

    def self.pack_uuid_namespace(namespace)
      if [DNS_NAMESPACE, OID_NAMESPACE, URL_NAMESPACE, X500_NAMESPACE].include?(namespace)
        namespace
      elsif use_rfc4122_namespaced_uuids == true
        match_data = namespace.match(/\A(\h{8})-(\h{4})-(\h{4})-(\h{4})-(\h{4})(\h{8})\z/)

        raise ArgumentError, "Only UUIDs are valid namespace identifiers" unless match_data.present?

        match_data.captures.map { |s| s.to_i(16) }.pack("NnnnnN")
      else
        ActiveSupport::Deprecation.warn <<~WARNING.squish
          Providing a namespace ID that is not one of the constants defined on Digest::UUID generates an incorrect UUID value according to RFC 4122.
          To enable the correct behavior, set the Rails.application.config.active_support.use_rfc4122_namespaced_uuids configuration option to true.
        WARNING

        namespace
      end
    end

    private_class_method :pack_uuid_namespace
  end
end
