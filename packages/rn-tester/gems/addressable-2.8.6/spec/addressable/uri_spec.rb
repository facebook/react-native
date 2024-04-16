# frozen_string_literal: true

# Copyright (C) Bob Aman
#
#    Licensed under the Apache License, Version 2.0 (the "License");
#    you may not use this file except in compliance with the License.
#    You may obtain a copy of the License at
#
#        http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing, software
#    distributed under the License is distributed on an "AS IS" BASIS,
#    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#    See the License for the specific language governing permissions and
#    limitations under the License.


require "spec_helper"

require "addressable/uri"
require "uri"
require "ipaddr"
require "yaml"

if !"".respond_to?("force_encoding")
  class String
    def force_encoding(encoding)
      @encoding = encoding
    end

    def encoding
      @encoding ||= Encoding::ASCII_8BIT
    end
  end

  class Encoding
    def initialize(name)
      @name = name
    end

    def to_s
      return @name
    end

    UTF_8 = Encoding.new("UTF-8")
    ASCII_8BIT = Encoding.new("US-ASCII")
  end
end

module Fake
  module URI
    class HTTP
      def initialize(uri)
        @uri = uri
      end

      def to_s
        return @uri.to_s
      end

      alias :to_str :to_s
    end
  end
end

describe Addressable::URI, "when created with a non-numeric port number" do
  it "should raise an error" do
    expect do
      Addressable::URI.new(:port => "bogus")
    end.to raise_error(Addressable::URI::InvalidURIError)
  end
end

describe Addressable::URI, "when created with a invalid encoded port number" do
  it "should raise an error" do
    expect do
      Addressable::URI.new(:port => "%eb")
    end.to raise_error(Addressable::URI::InvalidURIError)
  end
end

describe Addressable::URI, "when created with a non-string scheme" do
  it "should raise an error" do
    expect do
      Addressable::URI.new(:scheme => :bogus)
    end.to raise_error(TypeError)
  end
end

describe Addressable::URI, "when created with a non-string user" do
  it "should raise an error" do
    expect do
      Addressable::URI.new(:user => :bogus)
    end.to raise_error(TypeError)
  end
end

describe Addressable::URI, "when created with a non-string password" do
  it "should raise an error" do
    expect do
      Addressable::URI.new(:password => :bogus)
    end.to raise_error(TypeError)
  end
end

describe Addressable::URI, "when created with a non-string userinfo" do
  it "should raise an error" do
    expect do
      Addressable::URI.new(:userinfo => :bogus)
    end.to raise_error(TypeError)
  end
end

describe Addressable::URI, "when created with a non-string host" do
  it "should raise an error" do
    expect do
      Addressable::URI.new(:host => :bogus)
    end.to raise_error(TypeError)
  end
end

describe Addressable::URI, "when created with a non-string authority" do
  it "should raise an error" do
    expect do
      Addressable::URI.new(:authority => :bogus)
    end.to raise_error(TypeError)
  end
end

describe Addressable::URI, "when created with a non-string path" do
  it "should raise an error" do
    expect do
      Addressable::URI.new(:path => :bogus)
    end.to raise_error(TypeError)
  end
end

describe Addressable::URI, "when created with a non-string query" do
  it "should raise an error" do
    expect do
      Addressable::URI.new(:query => :bogus)
    end.to raise_error(TypeError)
  end
end

describe Addressable::URI, "when created with a non-string fragment" do
  it "should raise an error" do
    expect do
      Addressable::URI.new(:fragment => :bogus)
    end.to raise_error(TypeError)
  end
end

describe Addressable::URI, "when created with a scheme but no hierarchical " +
    "segment" do
  it "should raise an error" do
    expect do
      Addressable::URI.parse("http:")
    end.to raise_error(Addressable::URI::InvalidURIError)
  end
end

describe Addressable::URI, "quote handling" do
  describe 'in host name' do
    it "should raise an error for single quote" do
      expect do
        Addressable::URI.parse("http://local\"host/")
      end.to raise_error(Addressable::URI::InvalidURIError)
    end
  end
end

describe Addressable::URI, "newline normalization" do
  it "should not accept newlines in scheme" do
    expect do
      Addressable::URI.parse("ht%0atp://localhost/")
    end.to raise_error(Addressable::URI::InvalidURIError)
  end

  it "should not unescape newline in path" do
    uri = Addressable::URI.parse("http://localhost/%0a").normalize
    expect(uri.to_s).to eq("http://localhost/%0A")
  end

  it "should not unescape newline in hostname" do
    uri = Addressable::URI.parse("http://local%0ahost/").normalize
    expect(uri.to_s).to eq("http://local%0Ahost/")
  end

  it "should not unescape newline in username" do
    uri = Addressable::URI.parse("http://foo%0abar@localhost/").normalize
    expect(uri.to_s).to eq("http://foo%0Abar@localhost/")
  end

  it "should not unescape newline in username" do
    uri = Addressable::URI.parse("http://example:foo%0abar@example/").normalize
    expect(uri.to_s).to eq("http://example:foo%0Abar@example/")
  end

  it "should not accept newline in hostname" do
    uri = Addressable::URI.parse("http://localhost/")
    expect do
      uri.host = "local\nhost"
    end.to raise_error(Addressable::URI::InvalidURIError)
  end
end

describe Addressable::URI, "when created with ambiguous path" do
  it "should raise an error" do
    expect do
      Addressable::URI.parse("::http")
    end.to raise_error(Addressable::URI::InvalidURIError)
  end
end

describe Addressable::URI, "when created with an invalid host" do
  it "should raise an error" do
    expect do
      Addressable::URI.new(:host => "<invalid>")
    end.to raise_error(Addressable::URI::InvalidURIError)
  end
end

describe Addressable::URI, "when created with a host consisting of " +
    "sub-delims characters" do
  it "should not raise an error" do
    expect do
      Addressable::URI.new(
        :host => Addressable::URI::CharacterClasses::SUB_DELIMS.gsub(/\\/, '')
      )
    end.not_to raise_error
  end
end

describe Addressable::URI, "when created with a host consisting of " +
    "unreserved characters" do
  it "should not raise an error" do
    expect do
      Addressable::URI.new(
        :host => Addressable::URI::CharacterClasses::UNRESERVED.gsub(/\\/, '')
      )
    end.not_to raise_error
  end
end

describe Addressable::URI, "when created from nil components" do
  before do
    @uri = Addressable::URI.new
  end

  it "should have a nil site value" do
    expect(@uri.site).to eq(nil)
  end

  it "should have an empty path" do
    expect(@uri.path).to eq("")
  end

  it "should be an empty uri" do
    expect(@uri.to_s).to eq("")
  end

  it "should have a nil default port" do
    expect(@uri.default_port).to eq(nil)
  end

  it "should be empty" do
    expect(@uri).to be_empty
  end

  it "should raise an error if the scheme is set to whitespace" do
    expect do
      @uri.scheme = "\t \n"
    end.to raise_error(Addressable::URI::InvalidURIError, /'\t \n'/)
  end

  it "should raise an error if the scheme is set to all digits" do
    expect do
      @uri.scheme = "123"
    end.to raise_error(Addressable::URI::InvalidURIError, /'123'/)
  end

  it "should raise an error if the scheme begins with a digit" do
    expect do
      @uri.scheme = "1scheme"
    end.to raise_error(Addressable::URI::InvalidURIError, /'1scheme'/)
  end

  it "should raise an error if the scheme begins with a plus" do
    expect do
      @uri.scheme = "+scheme"
    end.to raise_error(Addressable::URI::InvalidURIError, /'\+scheme'/)
  end

  it "should raise an error if the scheme begins with a dot" do
    expect do
      @uri.scheme = ".scheme"
    end.to raise_error(Addressable::URI::InvalidURIError, /'\.scheme'/)
  end

  it "should raise an error if the scheme begins with a dash" do
    expect do
      @uri.scheme = "-scheme"
    end.to raise_error(Addressable::URI::InvalidURIError, /'-scheme'/)
  end

  it "should raise an error if the scheme contains an illegal character" do
    expect do
      @uri.scheme = "scheme!"
    end.to raise_error(Addressable::URI::InvalidURIError, /'scheme!'/)
  end

  it "should raise an error if the scheme contains whitespace" do
    expect do
      @uri.scheme = "sch eme"
    end.to raise_error(Addressable::URI::InvalidURIError, /'sch eme'/)
  end

  it "should raise an error if the scheme contains a newline" do
    expect do
      @uri.scheme = "sch\neme"
    end.to raise_error(Addressable::URI::InvalidURIError)
  end

  it "should raise an error if set into an invalid state" do
    expect do
      @uri.user = "user"
    end.to raise_error(Addressable::URI::InvalidURIError)
  end

  it "should raise an error if set into an invalid state" do
    expect do
      @uri.password = "pass"
    end.to raise_error(Addressable::URI::InvalidURIError)
  end

  it "should raise an error if set into an invalid state" do
    expect do
      @uri.scheme = "http"
      @uri.fragment = "fragment"
    end.to raise_error(Addressable::URI::InvalidURIError)
  end

  it "should raise an error if set into an invalid state" do
    expect do
      @uri.fragment = "fragment"
      @uri.scheme = "http"
    end.to raise_error(Addressable::URI::InvalidURIError)
  end
end

describe Addressable::URI, "when initialized from individual components" do
  before do
    @uri = Addressable::URI.new(
      :scheme => "http",
      :user => "user",
      :password => "password",
      :host => "example.com",
      :port => 8080,
      :path => "/path",
      :query => "query=value",
      :fragment => "fragment"
    )
  end

  it "returns 'http' for #scheme" do
    expect(@uri.scheme).to eq("http")
  end

  it "returns 'http' for #normalized_scheme" do
    expect(@uri.normalized_scheme).to eq("http")
  end

  it "returns 'user' for #user" do
    expect(@uri.user).to eq("user")
  end

  it "returns 'user' for #normalized_user" do
    expect(@uri.normalized_user).to eq("user")
  end

  it "returns 'password' for #password" do
    expect(@uri.password).to eq("password")
  end

  it "returns 'password' for #normalized_password" do
    expect(@uri.normalized_password).to eq("password")
  end

  it "returns 'user:password' for #userinfo" do
    expect(@uri.userinfo).to eq("user:password")
  end

  it "returns 'user:password' for #normalized_userinfo" do
    expect(@uri.normalized_userinfo).to eq("user:password")
  end

  it "returns 'example.com' for #host" do
    expect(@uri.host).to eq("example.com")
  end

  it "returns 'example.com' for #normalized_host" do
    expect(@uri.normalized_host).to eq("example.com")
  end

  it "returns 'com' for #tld" do
    expect(@uri.tld).to eq("com")
  end

  it "returns 'user:password@example.com:8080' for #authority" do
    expect(@uri.authority).to eq("user:password@example.com:8080")
  end

  it "returns 'user:password@example.com:8080' for #normalized_authority" do
    expect(@uri.normalized_authority).to eq("user:password@example.com:8080")
  end

  it "returns 8080 for #port" do
    expect(@uri.port).to eq(8080)
  end

  it "returns 8080 for #normalized_port" do
    expect(@uri.normalized_port).to eq(8080)
  end

  it "returns 80 for #default_port" do
    expect(@uri.default_port).to eq(80)
  end

  it "returns 'http://user:password@example.com:8080' for #site" do
    expect(@uri.site).to eq("http://user:password@example.com:8080")
  end

  it "returns 'http://user:password@example.com:8080' for #normalized_site" do
    expect(@uri.normalized_site).to eq("http://user:password@example.com:8080")
  end

  it "returns '/path' for #path" do
    expect(@uri.path).to eq("/path")
  end

  it "returns '/path' for #normalized_path" do
    expect(@uri.normalized_path).to eq("/path")
  end

  it "returns 'query=value' for #query" do
    expect(@uri.query).to eq("query=value")
  end

  it "returns 'query=value' for #normalized_query" do
    expect(@uri.normalized_query).to eq("query=value")
  end

  it "returns 'fragment' for #fragment" do
    expect(@uri.fragment).to eq("fragment")
  end

  it "returns 'fragment' for #normalized_fragment" do
    expect(@uri.normalized_fragment).to eq("fragment")
  end

  it "returns #hash" do
    expect(@uri.hash).not_to be nil
  end

  it "returns #to_s" do
    expect(@uri.to_s).to eq(
      "http://user:password@example.com:8080/path?query=value#fragment"
    )
  end

  it "should not be empty" do
    expect(@uri).not_to be_empty
  end

  it "should not be frozen" do
    expect(@uri).not_to be_frozen
  end

  it "should allow destructive operations" do
    expect { @uri.normalize! }.not_to raise_error
  end
end

describe Addressable::URI, "when initialized from " +
    "frozen individual components" do
  before do
    @uri = Addressable::URI.new(
      :scheme => "http".freeze,
      :user => "user".freeze,
      :password => "password".freeze,
      :host => "example.com".freeze,
      :port => "8080".freeze,
      :path => "/path".freeze,
      :query => "query=value".freeze,
      :fragment => "fragment".freeze
    )
  end

  it "returns 'http' for #scheme" do
    expect(@uri.scheme).to eq("http")
  end

  it "returns 'http' for #normalized_scheme" do
    expect(@uri.normalized_scheme).to eq("http")
  end

  it "returns 'user' for #user" do
    expect(@uri.user).to eq("user")
  end

  it "returns 'user' for #normalized_user" do
    expect(@uri.normalized_user).to eq("user")
  end

  it "returns 'password' for #password" do
    expect(@uri.password).to eq("password")
  end

  it "returns 'password' for #normalized_password" do
    expect(@uri.normalized_password).to eq("password")
  end

  it "returns 'user:password' for #userinfo" do
    expect(@uri.userinfo).to eq("user:password")
  end

  it "returns 'user:password' for #normalized_userinfo" do
    expect(@uri.normalized_userinfo).to eq("user:password")
  end

  it "returns 'example.com' for #host" do
    expect(@uri.host).to eq("example.com")
  end

  it "returns 'example.com' for #normalized_host" do
    expect(@uri.normalized_host).to eq("example.com")
  end

  it "returns 'user:password@example.com:8080' for #authority" do
    expect(@uri.authority).to eq("user:password@example.com:8080")
  end

  it "returns 'user:password@example.com:8080' for #normalized_authority" do
    expect(@uri.normalized_authority).to eq("user:password@example.com:8080")
  end

  it "returns 8080 for #port" do
    expect(@uri.port).to eq(8080)
  end

  it "returns 8080 for #normalized_port" do
    expect(@uri.normalized_port).to eq(8080)
  end

  it "returns 80 for #default_port" do
    expect(@uri.default_port).to eq(80)
  end

  it "returns 'http://user:password@example.com:8080' for #site" do
    expect(@uri.site).to eq("http://user:password@example.com:8080")
  end

  it "returns 'http://user:password@example.com:8080' for #normalized_site" do
    expect(@uri.normalized_site).to eq("http://user:password@example.com:8080")
  end

  it "returns '/path' for #path" do
    expect(@uri.path).to eq("/path")
  end

  it "returns '/path' for #normalized_path" do
    expect(@uri.normalized_path).to eq("/path")
  end

  it "returns 'query=value' for #query" do
    expect(@uri.query).to eq("query=value")
  end

  it "returns 'query=value' for #normalized_query" do
    expect(@uri.normalized_query).to eq("query=value")
  end

  it "returns 'fragment' for #fragment" do
    expect(@uri.fragment).to eq("fragment")
  end

  it "returns 'fragment' for #normalized_fragment" do
    expect(@uri.normalized_fragment).to eq("fragment")
  end

  it "returns #hash" do
    expect(@uri.hash).not_to be nil
  end

  it "returns #to_s" do
    expect(@uri.to_s).to eq(
      "http://user:password@example.com:8080/path?query=value#fragment"
    )
  end

  it "should not be empty" do
    expect(@uri).not_to be_empty
  end

  it "should not be frozen" do
    expect(@uri).not_to be_frozen
  end

  it "should allow destructive operations" do
    expect { @uri.normalize! }.not_to raise_error
  end
end

describe Addressable::URI, "when parsed from a frozen string" do
  before do
    @uri = Addressable::URI.parse(
      "http://user:password@example.com:8080/path?query=value#fragment".freeze
    )
  end

  it "returns 'http' for #scheme" do
    expect(@uri.scheme).to eq("http")
  end

  it "returns 'http' for #normalized_scheme" do
    expect(@uri.normalized_scheme).to eq("http")
  end

  it "returns 'user' for #user" do
    expect(@uri.user).to eq("user")
  end

  it "returns 'user' for #normalized_user" do
    expect(@uri.normalized_user).to eq("user")
  end

  it "returns 'password' for #password" do
    expect(@uri.password).to eq("password")
  end

  it "returns 'password' for #normalized_password" do
    expect(@uri.normalized_password).to eq("password")
  end

  it "returns 'user:password' for #userinfo" do
    expect(@uri.userinfo).to eq("user:password")
  end

  it "returns 'user:password' for #normalized_userinfo" do
    expect(@uri.normalized_userinfo).to eq("user:password")
  end

  it "returns 'example.com' for #host" do
    expect(@uri.host).to eq("example.com")
  end

  it "returns 'example.com' for #normalized_host" do
    expect(@uri.normalized_host).to eq("example.com")
  end

  it "returns 'user:password@example.com:8080' for #authority" do
    expect(@uri.authority).to eq("user:password@example.com:8080")
  end

  it "returns 'user:password@example.com:8080' for #normalized_authority" do
    expect(@uri.normalized_authority).to eq("user:password@example.com:8080")
  end

  it "returns 8080 for #port" do
    expect(@uri.port).to eq(8080)
  end

  it "returns 8080 for #normalized_port" do
    expect(@uri.normalized_port).to eq(8080)
  end

  it "returns 80 for #default_port" do
    expect(@uri.default_port).to eq(80)
  end

  it "returns 'http://user:password@example.com:8080' for #site" do
    expect(@uri.site).to eq("http://user:password@example.com:8080")
  end

  it "returns 'http://user:password@example.com:8080' for #normalized_site" do
    expect(@uri.normalized_site).to eq("http://user:password@example.com:8080")
  end

  it "returns '/path' for #path" do
    expect(@uri.path).to eq("/path")
  end

  it "returns '/path' for #normalized_path" do
    expect(@uri.normalized_path).to eq("/path")
  end

  it "returns 'query=value' for #query" do
    expect(@uri.query).to eq("query=value")
  end

  it "returns 'query=value' for #normalized_query" do
    expect(@uri.normalized_query).to eq("query=value")
  end

  it "returns 'fragment' for #fragment" do
    expect(@uri.fragment).to eq("fragment")
  end

  it "returns 'fragment' for #normalized_fragment" do
    expect(@uri.normalized_fragment).to eq("fragment")
  end

  it "returns #hash" do
    expect(@uri.hash).not_to be nil
  end

  it "returns #to_s" do
    expect(@uri.to_s).to eq(
      "http://user:password@example.com:8080/path?query=value#fragment"
    )
  end

  it "should not be empty" do
    expect(@uri).not_to be_empty
  end

  it "should not be frozen" do
    expect(@uri).not_to be_frozen
  end

  it "should allow destructive operations" do
    expect { @uri.normalize! }.not_to raise_error
  end
end

describe Addressable::URI, "when frozen" do
  before do
    @uri = Addressable::URI.new.freeze
  end

  it "returns nil for #scheme" do
    expect(@uri.scheme).to eq(nil)
  end

  it "returns nil for #normalized_scheme" do
    expect(@uri.normalized_scheme).to eq(nil)
  end

  it "returns nil for #user" do
    expect(@uri.user).to eq(nil)
  end

  it "returns nil for #normalized_user" do
    expect(@uri.normalized_user).to eq(nil)
  end

  it "returns nil for #password" do
    expect(@uri.password).to eq(nil)
  end

  it "returns nil for #normalized_password" do
    expect(@uri.normalized_password).to eq(nil)
  end

  it "returns nil for #userinfo" do
    expect(@uri.userinfo).to eq(nil)
  end

  it "returns nil for #normalized_userinfo" do
    expect(@uri.normalized_userinfo).to eq(nil)
  end

  it "returns nil for #host" do
    expect(@uri.host).to eq(nil)
  end

  it "returns nil for #normalized_host" do
    expect(@uri.normalized_host).to eq(nil)
  end

  it "returns nil for #authority" do
    expect(@uri.authority).to eq(nil)
  end

  it "returns nil for #normalized_authority" do
    expect(@uri.normalized_authority).to eq(nil)
  end

  it "returns nil for #port" do
    expect(@uri.port).to eq(nil)
  end

  it "returns nil for #normalized_port" do
    expect(@uri.normalized_port).to eq(nil)
  end

  it "returns nil for #default_port" do
    expect(@uri.default_port).to eq(nil)
  end

  it "returns nil for #site" do
    expect(@uri.site).to eq(nil)
  end

  it "returns nil for #normalized_site" do
    expect(@uri.normalized_site).to eq(nil)
  end

  it "returns '' for #path" do
    expect(@uri.path).to eq('')
  end

  it "returns '' for #normalized_path" do
    expect(@uri.normalized_path).to eq('')
  end

  it "returns nil for #query" do
    expect(@uri.query).to eq(nil)
  end

  it "returns nil for #normalized_query" do
    expect(@uri.normalized_query).to eq(nil)
  end

  it "returns nil for #fragment" do
    expect(@uri.fragment).to eq(nil)
  end

  it "returns nil for #normalized_fragment" do
    expect(@uri.normalized_fragment).to eq(nil)
  end

  it "returns #hash" do
    expect(@uri.hash).not_to be nil
  end

  it "returns #to_s" do
    expect(@uri.to_s).to eq('')
  end

  it "should be empty" do
    expect(@uri).to be_empty
  end

  it "should be frozen" do
    expect(@uri).to be_frozen
  end

  it "should not be frozen after duping" do
    expect(@uri.dup).not_to be_frozen
  end

  it "should not allow destructive operations" do
    expect { @uri.normalize! }.to raise_error { |error|
      expect(error.message).to match(/can't modify frozen/)
      expect(error).to satisfy { |e| RuntimeError === e || TypeError === e }
    }
  end
end

describe Addressable::URI, "when frozen" do
  before do
    @uri = Addressable::URI.parse(
      "HTTP://example.com.:%38%30/%70a%74%68?a=%31#1%323"
    ).freeze
  end

  it "returns 'HTTP' for #scheme" do
    expect(@uri.scheme).to eq("HTTP")
  end

  it "returns 'http' for #normalized_scheme" do
    expect(@uri.normalized_scheme).to eq("http")
    expect(@uri.normalize.scheme).to eq("http")
  end

  it "returns nil for #user" do
    expect(@uri.user).to eq(nil)
  end

  it "returns nil for #normalized_user" do
    expect(@uri.normalized_user).to eq(nil)
  end

  it "returns nil for #password" do
    expect(@uri.password).to eq(nil)
  end

  it "returns nil for #normalized_password" do
    expect(@uri.normalized_password).to eq(nil)
  end

  it "returns nil for #userinfo" do
    expect(@uri.userinfo).to eq(nil)
  end

  it "returns nil for #normalized_userinfo" do
    expect(@uri.normalized_userinfo).to eq(nil)
  end

  it "returns 'example.com.' for #host" do
    expect(@uri.host).to eq("example.com.")
  end

  it "returns nil for #normalized_host" do
    expect(@uri.normalized_host).to eq("example.com")
    expect(@uri.normalize.host).to eq("example.com")
  end

  it "returns 'example.com.:80' for #authority" do
    expect(@uri.authority).to eq("example.com.:80")
  end

  it "returns 'example.com:80' for #normalized_authority" do
    expect(@uri.normalized_authority).to eq("example.com")
    expect(@uri.normalize.authority).to eq("example.com")
  end

  it "returns 80 for #port" do
    expect(@uri.port).to eq(80)
  end

  it "returns nil for #normalized_port" do
    expect(@uri.normalized_port).to eq(nil)
    expect(@uri.normalize.port).to eq(nil)
  end

  it "returns 80 for #default_port" do
    expect(@uri.default_port).to eq(80)
  end

  it "returns 'HTTP://example.com.:80' for #site" do
    expect(@uri.site).to eq("HTTP://example.com.:80")
  end

  it "returns 'http://example.com' for #normalized_site" do
    expect(@uri.normalized_site).to eq("http://example.com")
    expect(@uri.normalize.site).to eq("http://example.com")
  end

  it "returns '/%70a%74%68' for #path" do
    expect(@uri.path).to eq("/%70a%74%68")
  end

  it "returns '/path' for #normalized_path" do
    expect(@uri.normalized_path).to eq("/path")
    expect(@uri.normalize.path).to eq("/path")
  end

  it "returns 'a=%31' for #query" do
    expect(@uri.query).to eq("a=%31")
  end

  it "returns 'a=1' for #normalized_query" do
    expect(@uri.normalized_query).to eq("a=1")
    expect(@uri.normalize.query).to eq("a=1")
  end

  it "returns '/%70a%74%68?a=%31' for #request_uri" do
    expect(@uri.request_uri).to eq("/%70a%74%68?a=%31")
  end

  it "returns '1%323' for #fragment" do
    expect(@uri.fragment).to eq("1%323")
  end

  it "returns '123' for #normalized_fragment" do
    expect(@uri.normalized_fragment).to eq("123")
    expect(@uri.normalize.fragment).to eq("123")
  end

  it "returns #hash" do
    expect(@uri.hash).not_to be nil
  end

  it "returns #to_s" do
    expect(@uri.to_s).to eq('HTTP://example.com.:80/%70a%74%68?a=%31#1%323')
    expect(@uri.normalize.to_s).to eq('http://example.com/path?a=1#123')
  end

  it "should not be empty" do
    expect(@uri).not_to be_empty
  end

  it "should be frozen" do
    expect(@uri).to be_frozen
  end

  it "should not be frozen after duping" do
    expect(@uri.dup).not_to be_frozen
  end

  it "should not allow destructive operations" do
    expect { @uri.normalize! }.to raise_error { |error|
      expect(error.message).to match(/can't modify frozen/)
      expect(error).to satisfy { |e| RuntimeError === e || TypeError === e }
    }
  end
end

describe Addressable::URI, "when normalized and then deeply frozen" do
  before do
    @uri = Addressable::URI.parse(
      "http://user:password@example.com:8080/path?query=value#fragment"
    ).normalize!

    @uri.instance_variables.each do |var|
      @uri.instance_variable_set(var, @uri.instance_variable_get(var).freeze)
    end

    @uri.freeze
  end

  it "#normalized_scheme should not error" do
    expect { @uri.normalized_scheme }.not_to raise_error
  end

  it "#normalized_user should not error" do
    expect { @uri.normalized_user }.not_to raise_error
  end

  it "#normalized_password should not error" do
    expect { @uri.normalized_password }.not_to raise_error
  end

  it "#normalized_userinfo should not error" do
    expect { @uri.normalized_userinfo }.not_to raise_error
  end

  it "#normalized_host should not error" do
    expect { @uri.normalized_host }.not_to raise_error
  end

  it "#normalized_authority should not error" do
    expect { @uri.normalized_authority }.not_to raise_error
  end

  it "#normalized_port should not error" do
    expect { @uri.normalized_port }.not_to raise_error
  end

  it "#normalized_site should not error" do
    expect { @uri.normalized_site }.not_to raise_error
  end

  it "#normalized_path should not error" do
    expect { @uri.normalized_path }.not_to raise_error
  end

  it "#normalized_query should not error" do
    expect { @uri.normalized_query }.not_to raise_error
  end

  it "#normalized_fragment should not error" do
    expect { @uri.normalized_fragment }.not_to raise_error
  end

  it "should be frozen" do
    expect(@uri).to be_frozen
  end

  it "should not allow destructive operations" do
    expect { @uri.normalize! }.to raise_error(RuntimeError)
  end
end

describe Addressable::URI, "when created from string components" do
  before do
    @uri = Addressable::URI.new(
      :scheme => "http", :host => "example.com"
    )
  end

  it "should have a site value of 'http://example.com'" do
    expect(@uri.site).to eq("http://example.com")
  end

  it "should be equal to the equivalent parsed URI" do
    expect(@uri).to eq(Addressable::URI.parse("http://example.com"))
  end

  it "should raise an error if invalid components omitted" do
    expect do
      @uri.omit(:bogus)
    end.to raise_error(ArgumentError)
    expect do
      @uri.omit(:scheme, :bogus, :path)
    end.to raise_error(ArgumentError)
  end
end

describe Addressable::URI, "when created with a nil host but " +
    "non-nil authority components" do
  it "should raise an error" do
    expect do
      Addressable::URI.new(:user => "user", :password => "pass", :port => 80)
    end.to raise_error(Addressable::URI::InvalidURIError)
  end
end

describe Addressable::URI, "when created with both an authority and a user" do
  it "should raise an error" do
    expect do
      Addressable::URI.new(
        :user => "user", :authority => "user@example.com:80"
      )
    end.to raise_error(ArgumentError)
  end
end

describe Addressable::URI, "when created with an authority and no port" do
  before do
    @uri = Addressable::URI.new(:authority => "user@example.com")
  end

  it "should not infer a port" do
    expect(@uri.port).to eq(nil)
    expect(@uri.default_port).to eq(nil)
    expect(@uri.inferred_port).to eq(nil)
  end

  it "should have a site value of '//user@example.com'" do
    expect(@uri.site).to eq("//user@example.com")
  end

  it "should have a 'null' origin" do
    expect(@uri.origin).to eq('null')
  end
end

describe Addressable::URI, "when created with a host with trailing dots" do
  before do
    @uri = Addressable::URI.new(:authority => "example...")
  end

  it "should have a stable normalized form" do
    expect(@uri.normalize.normalize.normalize.host).to eq(
      @uri.normalize.host
    )
  end
end

describe Addressable::URI, "when created with a host with a backslash" do
  it "should raise an error" do
    expect do
      Addressable::URI.new(:authority => "example\\example")
    end.to raise_error(Addressable::URI::InvalidURIError)
  end
end

describe Addressable::URI, "when created with a host with a slash" do
  it "should raise an error" do
    expect do
      Addressable::URI.new(:authority => "example/example")
    end.to raise_error(Addressable::URI::InvalidURIError)
  end
end

describe Addressable::URI, "when created with a host with a space" do
  it "should raise an error" do
    expect do
      Addressable::URI.new(:authority => "example example")
    end.to raise_error(Addressable::URI::InvalidURIError)
  end
end

describe Addressable::URI, "when created with both a userinfo and a user" do
  it "should raise an error" do
    expect do
      Addressable::URI.new(:user => "user", :userinfo => "user:pass")
    end.to raise_error(ArgumentError)
  end
end

describe Addressable::URI, "when created with a path that hasn't been " +
    "prefixed with a '/' but a host specified" do
  before do
    @uri = Addressable::URI.new(
      :scheme => "http", :host => "example.com", :path => "path"
    )
  end

  it "should prefix a '/' to the path" do
    expect(@uri).to eq(Addressable::URI.parse("http://example.com/path"))
  end

  it "should have a site value of 'http://example.com'" do
    expect(@uri.site).to eq("http://example.com")
  end

  it "should have an origin of 'http://example.com" do
    expect(@uri.origin).to eq('http://example.com')
  end
end

describe Addressable::URI, "when created with a path that hasn't been " +
    "prefixed with a '/' but no host specified" do
  before do
    @uri = Addressable::URI.new(
      :scheme => "http", :path => "path"
    )
  end

  it "should not prefix a '/' to the path" do
    expect(@uri).to eq(Addressable::URI.parse("http:path"))
  end

  it "should have a site value of 'http:'" do
    expect(@uri.site).to eq("http:")
  end

  it "should have a 'null' origin" do
    expect(@uri.origin).to eq('null')
  end
end

describe Addressable::URI, "when parsed from an Addressable::URI object" do
  it "should not have unexpected side-effects" do
    original_uri = Addressable::URI.parse("http://example.com/")
    new_uri = Addressable::URI.parse(original_uri)
    new_uri.host = 'www.example.com'
    expect(new_uri.host).to eq('www.example.com')
    expect(new_uri.to_s).to eq('http://www.example.com/')
    expect(original_uri.host).to eq('example.com')
    expect(original_uri.to_s).to eq('http://example.com/')
  end

  it "should not have unexpected side-effects" do
    original_uri = Addressable::URI.parse("http://example.com/")
    new_uri = Addressable::URI.heuristic_parse(original_uri)
    new_uri.host = 'www.example.com'
    expect(new_uri.host).to eq('www.example.com')
    expect(new_uri.to_s).to eq('http://www.example.com/')
    expect(original_uri.host).to eq('example.com')
    expect(original_uri.to_s).to eq('http://example.com/')
  end

  it "should not have unexpected side-effects" do
    original_uri = Addressable::URI.parse("http://example.com/")
    new_uri = Addressable::URI.parse(original_uri)
    new_uri.origin = 'https://www.example.com:8080'
    expect(new_uri.host).to eq('www.example.com')
    expect(new_uri.to_s).to eq('https://www.example.com:8080/')
    expect(original_uri.host).to eq('example.com')
    expect(original_uri.to_s).to eq('http://example.com/')
  end

  it "should not have unexpected side-effects" do
    original_uri = Addressable::URI.parse("http://example.com/")
    new_uri = Addressable::URI.heuristic_parse(original_uri)
    new_uri.origin = 'https://www.example.com:8080'
    expect(new_uri.host).to eq('www.example.com')
    expect(new_uri.to_s).to eq('https://www.example.com:8080/')
    expect(original_uri.host).to eq('example.com')
    expect(original_uri.to_s).to eq('http://example.com/')
  end
end

describe Addressable::URI, "when parsed from something that looks " +
    "like a URI object" do
  it "should parse without error" do
    uri = Addressable::URI.parse(Fake::URI::HTTP.new("http://example.com/"))
    expect do
      Addressable::URI.parse(uri)
    end.not_to raise_error
  end
end

describe Addressable::URI, "when parsed from a standard library URI object" do
  it "should parse without error" do
    uri = Addressable::URI.parse(URI.parse("http://example.com/"))
    expect do
      Addressable::URI.parse(uri)
    end.not_to raise_error
  end
end

describe Addressable::URI, "when parsed from ''" do
  before do
    @uri = Addressable::URI.parse("")
  end

  it "should have no scheme" do
    expect(@uri.scheme).to eq(nil)
  end

  it "should not be considered to be ip-based" do
    expect(@uri).not_to be_ip_based
  end

  it "should have a path of ''" do
    expect(@uri.path).to eq("")
  end

  it "should have a request URI of '/'" do
    expect(@uri.request_uri).to eq("/")
  end

  it "should be considered relative" do
    expect(@uri).to be_relative
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end

  it "should have a 'null' origin" do
    expect(@uri.origin).to eq('null')
  end
end

# Section 1.1.2 of RFC 3986
describe Addressable::URI, "when parsed from " +
    "'ftp://ftp.is.co.za/rfc/rfc1808.txt'" do
  before do
    @uri = Addressable::URI.parse("ftp://ftp.is.co.za/rfc/rfc1808.txt")
  end

  it "should use the 'ftp' scheme" do
    expect(@uri.scheme).to eq("ftp")
  end

  it "should be considered to be ip-based" do
    expect(@uri).to be_ip_based
  end

  it "should have a host of 'ftp.is.co.za'" do
    expect(@uri.host).to eq("ftp.is.co.za")
  end

  it "should have inferred_port of 21" do
    expect(@uri.inferred_port).to eq(21)
  end

  it "should have a path of '/rfc/rfc1808.txt'" do
    expect(@uri.path).to eq("/rfc/rfc1808.txt")
  end

  it "should not have a request URI" do
    expect(@uri.request_uri).to eq(nil)
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end

  it "should have an origin of 'ftp://ftp.is.co.za'" do
    expect(@uri.origin).to eq('ftp://ftp.is.co.za')
  end
end

# Section 1.1.2 of RFC 3986
describe Addressable::URI, "when parsed from " +
    "'http://www.ietf.org/rfc/rfc2396.txt'" do
  before do
    @uri = Addressable::URI.parse("http://www.ietf.org/rfc/rfc2396.txt")
  end

  it "should use the 'http' scheme" do
    expect(@uri.scheme).to eq("http")
  end

  it "should be considered to be ip-based" do
    expect(@uri).to be_ip_based
  end

  it "should have a host of 'www.ietf.org'" do
    expect(@uri.host).to eq("www.ietf.org")
  end

  it "should have inferred_port of 80" do
    expect(@uri.inferred_port).to eq(80)
  end

  it "should have a path of '/rfc/rfc2396.txt'" do
    expect(@uri.path).to eq("/rfc/rfc2396.txt")
  end

  it "should have a request URI of '/rfc/rfc2396.txt'" do
    expect(@uri.request_uri).to eq("/rfc/rfc2396.txt")
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end

  it "should correctly omit components" do
    expect(@uri.omit(:scheme).to_s).to eq("//www.ietf.org/rfc/rfc2396.txt")
    expect(@uri.omit(:path).to_s).to eq("http://www.ietf.org")
  end

  it "should correctly omit components destructively" do
    @uri.omit!(:scheme)
    expect(@uri.to_s).to eq("//www.ietf.org/rfc/rfc2396.txt")
  end

  it "should have an origin of 'http://www.ietf.org'" do
    expect(@uri.origin).to eq('http://www.ietf.org')
  end
end

# Section 1.1.2 of RFC 3986
describe Addressable::URI, "when parsed from " +
    "'ldap://[2001:db8::7]/c=GB?objectClass?one'" do
  before do
    @uri = Addressable::URI.parse("ldap://[2001:db8::7]/c=GB?objectClass?one")
  end

  it "should use the 'ldap' scheme" do
    expect(@uri.scheme).to eq("ldap")
  end

  it "should be considered to be ip-based" do
    expect(@uri).to be_ip_based
  end

  it "should have a host of '[2001:db8::7]'" do
    expect(@uri.host).to eq("[2001:db8::7]")
  end

  it "should have inferred_port of 389" do
    expect(@uri.inferred_port).to eq(389)
  end

  it "should have a path of '/c=GB'" do
    expect(@uri.path).to eq("/c=GB")
  end

  it "should not have a request URI" do
    expect(@uri.request_uri).to eq(nil)
  end

  it "should not allow request URI assignment" do
    expect do
      @uri.request_uri = "/"
    end.to raise_error(Addressable::URI::InvalidURIError)
  end

  it "should have a query of 'objectClass?one'" do
    expect(@uri.query).to eq("objectClass?one")
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end

  it "should correctly omit components" do
    expect(@uri.omit(:scheme, :authority).to_s).to eq("/c=GB?objectClass?one")
    expect(@uri.omit(:path).to_s).to eq("ldap://[2001:db8::7]?objectClass?one")
  end

  it "should correctly omit components destructively" do
    @uri.omit!(:scheme, :authority)
    expect(@uri.to_s).to eq("/c=GB?objectClass?one")
  end

  it "should raise an error if omission would create an invalid URI" do
    expect do
      @uri.omit(:authority, :path)
    end.to raise_error(Addressable::URI::InvalidURIError)
  end

  it "should have an origin of 'ldap://[2001:db8::7]'" do
    expect(@uri.origin).to eq('ldap://[2001:db8::7]')
  end
end

# Section 1.1.2 of RFC 3986
describe Addressable::URI, "when parsed from " +
    "'mailto:John.Doe@example.com'" do
  before do
    @uri = Addressable::URI.parse("mailto:John.Doe@example.com")
  end

  it "should use the 'mailto' scheme" do
    expect(@uri.scheme).to eq("mailto")
  end

  it "should not be considered to be ip-based" do
    expect(@uri).not_to be_ip_based
  end

  it "should not have an inferred_port" do
    expect(@uri.inferred_port).to eq(nil)
  end

  it "should have a path of 'John.Doe@example.com'" do
    expect(@uri.path).to eq("John.Doe@example.com")
  end

  it "should not have a request URI" do
    expect(@uri.request_uri).to eq(nil)
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end

  it "should have a 'null' origin" do
    expect(@uri.origin).to eq('null')
  end
end

# Section 2 of RFC 6068
describe Addressable::URI, "when parsed from " +
    "'mailto:?to=addr1@an.example,addr2@an.example'" do
  before do
    @uri = Addressable::URI.parse(
      "mailto:?to=addr1@an.example,addr2@an.example"
    )
  end

  it "should use the 'mailto' scheme" do
    expect(@uri.scheme).to eq("mailto")
  end

  it "should not be considered to be ip-based" do
    expect(@uri).not_to be_ip_based
  end

  it "should not have an inferred_port" do
    expect(@uri.inferred_port).to eq(nil)
  end

  it "should have a path of ''" do
    expect(@uri.path).to eq("")
  end

  it "should not have a request URI" do
    expect(@uri.request_uri).to eq(nil)
  end

  it "should have the To: field value parameterized" do
    expect(@uri.query_values(Hash)["to"]).to eq(
      "addr1@an.example,addr2@an.example"
    )
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end

  it "should have a 'null' origin" do
    expect(@uri.origin).to eq('null')
  end
end

# Section 1.1.2 of RFC 3986
describe Addressable::URI, "when parsed from " +
    "'news:comp.infosystems.www.servers.unix'" do
  before do
    @uri = Addressable::URI.parse("news:comp.infosystems.www.servers.unix")
  end

  it "should use the 'news' scheme" do
    expect(@uri.scheme).to eq("news")
  end

  it "should not have an inferred_port" do
    expect(@uri.inferred_port).to eq(nil)
  end

  it "should not be considered to be ip-based" do
    expect(@uri).not_to be_ip_based
  end

  it "should have a path of 'comp.infosystems.www.servers.unix'" do
    expect(@uri.path).to eq("comp.infosystems.www.servers.unix")
  end

  it "should not have a request URI" do
    expect(@uri.request_uri).to eq(nil)
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end

  it "should have a 'null' origin" do
    expect(@uri.origin).to eq('null')
  end
end

# Section 1.1.2 of RFC 3986
describe Addressable::URI, "when parsed from " +
    "'tel:+1-816-555-1212'" do
  before do
    @uri = Addressable::URI.parse("tel:+1-816-555-1212")
  end

  it "should use the 'tel' scheme" do
    expect(@uri.scheme).to eq("tel")
  end

  it "should not be considered to be ip-based" do
    expect(@uri).not_to be_ip_based
  end

  it "should not have an inferred_port" do
    expect(@uri.inferred_port).to eq(nil)
  end

  it "should have a path of '+1-816-555-1212'" do
    expect(@uri.path).to eq("+1-816-555-1212")
  end

  it "should not have a request URI" do
    expect(@uri.request_uri).to eq(nil)
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end

  it "should have a 'null' origin" do
    expect(@uri.origin).to eq('null')
  end
end

# Section 1.1.2 of RFC 3986
describe Addressable::URI, "when parsed from " +
    "'telnet://192.0.2.16:80/'" do
  before do
    @uri = Addressable::URI.parse("telnet://192.0.2.16:80/")
  end

  it "should use the 'telnet' scheme" do
    expect(@uri.scheme).to eq("telnet")
  end

  it "should have a host of '192.0.2.16'" do
    expect(@uri.host).to eq("192.0.2.16")
  end

  it "should have a port of 80" do
    expect(@uri.port).to eq(80)
  end

  it "should have a inferred_port of 80" do
    expect(@uri.inferred_port).to eq(80)
  end

  it "should have a default_port of 23" do
    expect(@uri.default_port).to eq(23)
  end

  it "should be considered to be ip-based" do
    expect(@uri).to be_ip_based
  end

  it "should have a path of '/'" do
    expect(@uri.path).to eq("/")
  end

  it "should not have a request URI" do
    expect(@uri.request_uri).to eq(nil)
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end

  it "should have an origin of 'telnet://192.0.2.16:80'" do
    expect(@uri.origin).to eq('telnet://192.0.2.16:80')
  end
end

# Section 1.1.2 of RFC 3986
describe Addressable::URI, "when parsed from " +
    "'urn:oasis:names:specification:docbook:dtd:xml:4.1.2'" do
  before do
    @uri = Addressable::URI.parse(
      "urn:oasis:names:specification:docbook:dtd:xml:4.1.2")
  end

  it "should use the 'urn' scheme" do
    expect(@uri.scheme).to eq("urn")
  end

  it "should not have an inferred_port" do
    expect(@uri.inferred_port).to eq(nil)
  end

  it "should not be considered to be ip-based" do
    expect(@uri).not_to be_ip_based
  end

  it "should have a path of " +
      "'oasis:names:specification:docbook:dtd:xml:4.1.2'" do
    expect(@uri.path).to eq("oasis:names:specification:docbook:dtd:xml:4.1.2")
  end

  it "should not have a request URI" do
    expect(@uri.request_uri).to eq(nil)
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end

  it "should have a 'null' origin" do
    expect(@uri.origin).to eq('null')
  end
end

describe Addressable::URI, "when heuristically parsed from " +
    "'192.0.2.16:8000/path'" do
  before do
    @uri = Addressable::URI.heuristic_parse("192.0.2.16:8000/path")
  end

  it "should use the 'http' scheme" do
    expect(@uri.scheme).to eq("http")
  end

  it "should have a host of '192.0.2.16'" do
    expect(@uri.host).to eq("192.0.2.16")
  end

  it "should have a port of '8000'" do
    expect(@uri.port).to eq(8000)
  end

  it "should be considered to be ip-based" do
    expect(@uri).to be_ip_based
  end

  it "should have a path of '/path'" do
    expect(@uri.path).to eq("/path")
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end

  it "should have an origin of 'http://192.0.2.16:8000'" do
    expect(@uri.origin).to eq('http://192.0.2.16:8000')
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com'" do
  before do
    @uri = Addressable::URI.parse("http://example.com")
  end

  it "when inspected, should have the correct URI" do
    expect(@uri.inspect).to include("http://example.com")
  end

  it "when inspected, should have the correct class name" do
    expect(@uri.inspect).to include("Addressable::URI")
  end

  it "when inspected, should have the correct object id" do
    expect(@uri.inspect).to include("%#0x" % @uri.object_id)
  end

  it "should use the 'http' scheme" do
    expect(@uri.scheme).to eq("http")
  end

  it "should be considered to be ip-based" do
    expect(@uri).to be_ip_based
  end

  it "should have an authority segment of 'example.com'" do
    expect(@uri.authority).to eq("example.com")
  end

  it "should have a host of 'example.com'" do
    expect(@uri.host).to eq("example.com")
  end

  it "should be considered ip-based" do
    expect(@uri).to be_ip_based
  end

  it "should have no username" do
    expect(@uri.user).to eq(nil)
  end

  it "should have no password" do
    expect(@uri.password).to eq(nil)
  end

  it "should use port 80" do
    expect(@uri.inferred_port).to eq(80)
  end

  it "should not have a specified port" do
    expect(@uri.port).to eq(nil)
  end

  it "should have an empty path" do
    expect(@uri.path).to eq("")
  end

  it "should have no query string" do
    expect(@uri.query).to eq(nil)
    expect(@uri.query_values).to eq(nil)
  end

  it "should have a request URI of '/'" do
    expect(@uri.request_uri).to eq("/")
  end

  it "should have no fragment" do
    expect(@uri.fragment).to eq(nil)
  end

  it "should be considered absolute" do
    expect(@uri).to be_absolute
  end

  it "should not be considered relative" do
    expect(@uri).not_to be_relative
  end

  it "should not be exactly equal to 42" do
    expect(@uri.eql?(42)).to eq(false)
  end

  it "should not be equal to 42" do
    expect(@uri == 42).to eq(false)
  end

  it "should not be roughly equal to 42" do
    expect(@uri === 42).to eq(false)
  end

  it "should be exactly equal to http://example.com" do
    expect(@uri.eql?(Addressable::URI.parse("http://example.com"))).to eq(true)
  end

  it "should be roughly equal to http://example.com/" do
    expect(@uri === Addressable::URI.parse("http://example.com/")).to eq(true)
  end

  it "should be roughly equal to the string 'http://example.com/'" do
    expect(@uri === "http://example.com/").to eq(true)
  end

  it "should not be roughly equal to the string " +
      "'http://example.com:bogus/'" do
    expect do
      expect(@uri === "http://example.com:bogus/").to eq(false)
    end.not_to raise_error
  end

  it "should result in itself when joined with itself" do
    expect(@uri.join(@uri).to_s).to eq("http://example.com")
    expect(@uri.join!(@uri).to_s).to eq("http://example.com")
  end

  it "should be equivalent to http://EXAMPLE.com" do
    expect(@uri).to eq(Addressable::URI.parse("http://EXAMPLE.com"))
  end

  it "should be equivalent to http://EXAMPLE.com:80/" do
    expect(@uri).to eq(Addressable::URI.parse("http://EXAMPLE.com:80/"))
  end

  it "should have the same hash as http://example.com" do
    expect(@uri.hash).to eq(Addressable::URI.parse("http://example.com").hash)
  end

  it "should have the same hash as http://EXAMPLE.com after assignment" do
    @uri.origin = "http://EXAMPLE.com"
    expect(@uri.hash).to eq(Addressable::URI.parse("http://EXAMPLE.com").hash)
  end

  it "should have a different hash from http://EXAMPLE.com" do
    expect(@uri.hash).not_to eq(Addressable::URI.parse("http://EXAMPLE.com").hash)
  end

  it "should not allow origin assignment without scheme" do
    expect do
      @uri.origin = "example.com"
    end.to raise_error(Addressable::URI::InvalidURIError)
  end

  it "should not allow origin assignment without host" do
    expect do
      @uri.origin = "http://"
    end.to raise_error(Addressable::URI::InvalidURIError)
  end

  it "should not allow origin assignment with bogus type" do
    expect do
      @uri.origin = :bogus
    end.to raise_error(TypeError)
  end

  # Section 6.2.3 of RFC 3986
  it "should be equivalent to http://example.com/" do
    expect(@uri).to eq(Addressable::URI.parse("http://example.com/"))
  end

  # Section 6.2.3 of RFC 3986
  it "should be equivalent to http://example.com:/" do
    expect(@uri).to eq(Addressable::URI.parse("http://example.com:/"))
  end

  # Section 6.2.3 of RFC 3986
  it "should be equivalent to http://example.com:80/" do
    expect(@uri).to eq(Addressable::URI.parse("http://example.com:80/"))
  end

  # Section 6.2.2.1 of RFC 3986
  it "should be equivalent to http://EXAMPLE.COM/" do
    expect(@uri).to eq(Addressable::URI.parse("http://EXAMPLE.COM/"))
  end

  it "should have a route of '/path/' to 'http://example.com/path/'" do
    expect(@uri.route_to("http://example.com/path/")).to eq(
      Addressable::URI.parse("/path/")
    )
  end

  it "should have a route of '..' from 'http://example.com/path/'" do
    expect(@uri.route_from("http://example.com/path/")).to eq(
      Addressable::URI.parse("..")
    )
  end

  it "should have a route of '#' to 'http://example.com/'" do
    expect(@uri.route_to("http://example.com/")).to eq(
      Addressable::URI.parse("#")
    )
  end

  it "should have a route of 'http://elsewhere.com/' to " +
      "'http://elsewhere.com/'" do
    expect(@uri.route_to("http://elsewhere.com/")).to eq(
      Addressable::URI.parse("http://elsewhere.com/")
    )
  end

  it "when joined with 'relative/path' should be " +
      "'http://example.com/relative/path'" do
    expect(@uri.join('relative/path')).to eq(
      Addressable::URI.parse("http://example.com/relative/path")
    )
  end

  it "when joined with a bogus object a TypeError should be raised" do
    expect do
      @uri.join(42)
    end.to raise_error(TypeError)
  end

  it "should have the correct username after assignment" do
    @uri.user = "newuser"
    expect(@uri.user).to eq("newuser")
    expect(@uri.password).to eq(nil)
    expect(@uri.to_s).to eq("http://newuser@example.com")
  end

  it "should have the correct username after assignment" do
    @uri.user = "user@123!"
    expect(@uri.user).to eq("user@123!")
    expect(@uri.normalized_user).to eq("user%40123%21")
    expect(@uri.password).to eq(nil)
    expect(@uri.normalize.to_s).to eq("http://user%40123%21@example.com/")
  end

  it "should have the correct password after assignment" do
    @uri.password = "newpass"
    expect(@uri.password).to eq("newpass")
    expect(@uri.user).to eq("")
    expect(@uri.to_s).to eq("http://:newpass@example.com")
  end

  it "should have the correct password after assignment" do
    @uri.password = "#secret@123!"
    expect(@uri.password).to eq("#secret@123!")
    expect(@uri.normalized_password).to eq("%23secret%40123%21")
    expect(@uri.user).to eq("")
    expect(@uri.normalize.to_s).to eq("http://:%23secret%40123%21@example.com/")
    expect(@uri.omit(:password).to_s).to eq("http://example.com")
  end

  it "should have the correct user/pass after repeated assignment" do
    @uri.user = nil
    expect(@uri.user).to eq(nil)
    @uri.password = "newpass"
    expect(@uri.password).to eq("newpass")
    # Username cannot be nil if the password is set
    expect(@uri.user).to eq("")
    expect(@uri.to_s).to eq("http://:newpass@example.com")
    @uri.user = "newuser"
    expect(@uri.user).to eq("newuser")
    @uri.password = nil
    expect(@uri.password).to eq(nil)
    expect(@uri.to_s).to eq("http://newuser@example.com")
    @uri.user = "newuser"
    expect(@uri.user).to eq("newuser")
    @uri.password = ""
    expect(@uri.password).to eq("")
    expect(@uri.to_s).to eq("http://newuser:@example.com")
    @uri.password = "newpass"
    expect(@uri.password).to eq("newpass")
    @uri.user = nil
    # Username cannot be nil if the password is set
    expect(@uri.user).to eq("")
    expect(@uri.to_s).to eq("http://:newpass@example.com")
  end

  it "should have the correct user/pass after userinfo assignment" do
    @uri.user = "newuser"
    expect(@uri.user).to eq("newuser")
    @uri.password = "newpass"
    expect(@uri.password).to eq("newpass")
    @uri.userinfo = nil
    expect(@uri.userinfo).to eq(nil)
    expect(@uri.user).to eq(nil)
    expect(@uri.password).to eq(nil)
  end

  it "should correctly convert to a hash" do
    expect(@uri.to_hash).to eq({
      :scheme => "http",
      :user => nil,
      :password => nil,
      :host => "example.com",
      :port => nil,
      :path => "",
      :query => nil,
      :fragment => nil
    })
  end

  it "should be identical to its duplicate" do
    expect(@uri).to eq(@uri.dup)
  end

  it "should have an origin of 'http://example.com'" do
    expect(@uri.origin).to eq('http://example.com')
  end
end

# Section 5.1.2 of RFC 2616
describe Addressable::URI, "when parsed from " +
    "'HTTP://www.w3.org/pub/WWW/TheProject.html'" do
  before do
    @uri = Addressable::URI.parse("HTTP://www.w3.org/pub/WWW/TheProject.html")
  end

  it "should have the correct request URI" do
    expect(@uri.request_uri).to eq("/pub/WWW/TheProject.html")
  end

  it "should have the correct request URI after assignment" do
    @uri.request_uri = "/pub/WWW/TheProject.html?"
    expect(@uri.request_uri).to eq("/pub/WWW/TheProject.html?")
    expect(@uri.path).to eq("/pub/WWW/TheProject.html")
    expect(@uri.query).to eq("")
  end

  it "should have the correct request URI after assignment" do
    @uri.request_uri = "/some/where/else.html"
    expect(@uri.request_uri).to eq("/some/where/else.html")
    expect(@uri.path).to eq("/some/where/else.html")
    expect(@uri.query).to eq(nil)
  end

  it "should have the correct request URI after assignment" do
    @uri.request_uri = "/some/where/else.html?query?string"
    expect(@uri.request_uri).to eq("/some/where/else.html?query?string")
    expect(@uri.path).to eq("/some/where/else.html")
    expect(@uri.query).to eq("query?string")
  end

  it "should have the correct request URI after assignment" do
    @uri.request_uri = "?x=y"
    expect(@uri.request_uri).to eq("/?x=y")
    expect(@uri.path).to eq("/")
    expect(@uri.query).to eq("x=y")
  end

  it "should raise an error if the site value is set to something bogus" do
    expect do
      @uri.site = 42
    end.to raise_error(TypeError)
  end

  it "should raise an error if the request URI is set to something bogus" do
    expect do
      @uri.request_uri = 42
    end.to raise_error(TypeError)
  end

  it "should correctly convert to a hash" do
    expect(@uri.to_hash).to eq({
      :scheme => "HTTP",
      :user => nil,
      :password => nil,
      :host => "www.w3.org",
      :port => nil,
      :path => "/pub/WWW/TheProject.html",
      :query => nil,
      :fragment => nil
    })
  end

  it "should have an origin of 'http://www.w3.org'" do
    expect(@uri.origin).to eq('http://www.w3.org')
  end
end

describe Addressable::URI, "when parsing IPv6 addresses" do
  it "should not raise an error for " +
      "'http://[3ffe:1900:4545:3:200:f8ff:fe21:67cf]/'" do
    Addressable::URI.parse("http://[3ffe:1900:4545:3:200:f8ff:fe21:67cf]/")
  end

  it "should not raise an error for " +
      "'http://[fe80:0:0:0:200:f8ff:fe21:67cf]/'" do
    Addressable::URI.parse("http://[fe80:0:0:0:200:f8ff:fe21:67cf]/")
  end

  it "should not raise an error for " +
      "'http://[fe80::200:f8ff:fe21:67cf]/'" do
    Addressable::URI.parse("http://[fe80::200:f8ff:fe21:67cf]/")
  end

  it "should not raise an error for " +
      "'http://[::1]/'" do
    Addressable::URI.parse("http://[::1]/")
  end

  it "should not raise an error for " +
      "'http://[fe80::1]/'" do
    Addressable::URI.parse("http://[fe80::1]/")
  end

  it "should raise an error for " +
      "'http://[<invalid>]/'" do
    expect do
      Addressable::URI.parse("http://[<invalid>]/")
    end.to raise_error(Addressable::URI::InvalidURIError)
  end
end

describe Addressable::URI, "when parsing IPv6 address" do
  subject { Addressable::URI.parse("http://[3ffe:1900:4545:3:200:f8ff:fe21:67cf]/") }
  its(:host) { should == '[3ffe:1900:4545:3:200:f8ff:fe21:67cf]' }
  its(:hostname) { should == '3ffe:1900:4545:3:200:f8ff:fe21:67cf' }
end

describe Addressable::URI, "when assigning IPv6 address" do
  it "should allow to set bare IPv6 address as hostname" do
    uri = Addressable::URI.parse("http://[::1]/")
    uri.hostname = '3ffe:1900:4545:3:200:f8ff:fe21:67cf'
    expect(uri.to_s).to eq('http://[3ffe:1900:4545:3:200:f8ff:fe21:67cf]/')
  end

  it "should allow to set bare IPv6 address as hostname with IPAddr object" do
    uri = Addressable::URI.parse("http://[::1]/")
    uri.hostname = IPAddr.new('3ffe:1900:4545:3:200:f8ff:fe21:67cf')
    expect(uri.to_s).to eq('http://[3ffe:1900:4545:3:200:f8ff:fe21:67cf]/')
  end

  it "should not allow to set bare IPv6 address as host" do
    uri = Addressable::URI.parse("http://[::1]/")
    skip "not checked"
    expect do
      uri.host = '3ffe:1900:4545:3:200:f8ff:fe21:67cf'
    end.to raise_error(Addressable::URI::InvalidURIError)
  end
end

describe Addressable::URI, "when parsing IPvFuture addresses" do
  it "should not raise an error for " +
      "'http://[v9.3ffe:1900:4545:3:200:f8ff:fe21:67cf]/'" do
    Addressable::URI.parse("http://[v9.3ffe:1900:4545:3:200:f8ff:fe21:67cf]/")
  end

  it "should not raise an error for " +
      "'http://[vff.fe80:0:0:0:200:f8ff:fe21:67cf]/'" do
    Addressable::URI.parse("http://[vff.fe80:0:0:0:200:f8ff:fe21:67cf]/")
  end

  it "should not raise an error for " +
      "'http://[v12.fe80::200:f8ff:fe21:67cf]/'" do
    Addressable::URI.parse("http://[v12.fe80::200:f8ff:fe21:67cf]/")
  end

  it "should not raise an error for " +
      "'http://[va0.::1]/'" do
    Addressable::URI.parse("http://[va0.::1]/")
  end

  it "should not raise an error for " +
      "'http://[v255.fe80::1]/'" do
    Addressable::URI.parse("http://[v255.fe80::1]/")
  end

  it "should raise an error for " +
      "'http://[v0.<invalid>]/'" do
    expect do
      Addressable::URI.parse("http://[v0.<invalid>]/")
    end.to raise_error(Addressable::URI::InvalidURIError)
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/")
  end

  # Based on http://intertwingly.net/blog/2004/07/31/URI-Equivalence
  it "should be equivalent to http://example.com" do
    expect(@uri).to eq(Addressable::URI.parse("http://example.com"))
  end

  # Based on http://intertwingly.net/blog/2004/07/31/URI-Equivalence
  it "should be equivalent to HTTP://example.com/" do
    expect(@uri).to eq(Addressable::URI.parse("HTTP://example.com/"))
  end

  # Based on http://intertwingly.net/blog/2004/07/31/URI-Equivalence
  it "should be equivalent to http://example.com:/" do
    expect(@uri).to eq(Addressable::URI.parse("http://example.com:/"))
  end

  # Based on http://intertwingly.net/blog/2004/07/31/URI-Equivalence
  it "should be equivalent to http://example.com:80/" do
    expect(@uri).to eq(Addressable::URI.parse("http://example.com:80/"))
  end

  # Based on http://intertwingly.net/blog/2004/07/31/URI-Equivalence
  it "should be equivalent to http://Example.com/" do
    expect(@uri).to eq(Addressable::URI.parse("http://Example.com/"))
  end

  it "should have the correct username after assignment" do
    @uri.user = nil
    expect(@uri.user).to eq(nil)
    expect(@uri.password).to eq(nil)
    expect(@uri.to_s).to eq("http://example.com/")
  end

  it "should have the correct password after assignment" do
    @uri.password = nil
    expect(@uri.password).to eq(nil)
    expect(@uri.user).to eq(nil)
    expect(@uri.to_s).to eq("http://example.com/")
  end

  it "should have a request URI of '/'" do
    expect(@uri.request_uri).to eq("/")
  end

  it "should correctly convert to a hash" do
    expect(@uri.to_hash).to eq({
      :scheme => "http",
      :user => nil,
      :password => nil,
      :host => "example.com",
      :port => nil,
      :path => "/",
      :query => nil,
      :fragment => nil
    })
  end

  it "should be identical to its duplicate" do
    expect(@uri).to eq(@uri.dup)
  end

  it "should have the same hash as its duplicate" do
    expect(@uri.hash).to eq(@uri.dup.hash)
  end

  it "should have a different hash from its equivalent String value" do
    expect(@uri.hash).not_to eq(@uri.to_s.hash)
  end

  it "should have the same hash as an equal URI" do
    expect(@uri.hash).to eq(Addressable::URI.parse("http://example.com/").hash)
  end

  it "should be equivalent to http://EXAMPLE.com" do
    expect(@uri).to eq(Addressable::URI.parse("http://EXAMPLE.com"))
  end

  it "should be equivalent to http://EXAMPLE.com:80/" do
    expect(@uri).to eq(Addressable::URI.parse("http://EXAMPLE.com:80/"))
  end

  it "should have the same hash as http://example.com/" do
    expect(@uri.hash).to eq(Addressable::URI.parse("http://example.com/").hash)
  end

  it "should have the same hash as http://example.com after assignment" do
    @uri.path = ""
    expect(@uri.hash).to eq(Addressable::URI.parse("http://example.com").hash)
  end

  it "should have the same hash as http://example.com/? after assignment" do
    @uri.query = ""
    expect(@uri.hash).to eq(Addressable::URI.parse("http://example.com/?").hash)
  end

  it "should have the same hash as http://example.com/? after assignment" do
    @uri.query_values = {}
    expect(@uri.hash).to eq(Addressable::URI.parse("http://example.com/?").hash)
  end

  it "should have the same hash as http://example.com/# after assignment" do
    @uri.fragment = ""
    expect(@uri.hash).to eq(Addressable::URI.parse("http://example.com/#").hash)
  end

  it "should have a different hash from http://example.com" do
    expect(@uri.hash).not_to eq(Addressable::URI.parse("http://example.com").hash)
  end

  it "should have an origin of 'http://example.com'" do
    expect(@uri.origin).to eq('http://example.com')
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com?#'" do
  before do
    @uri = Addressable::URI.parse("http://example.com?#")
  end

  it "should correctly convert to a hash" do
    expect(@uri.to_hash).to eq({
      :scheme => "http",
      :user => nil,
      :password => nil,
      :host => "example.com",
      :port => nil,
      :path => "",
      :query => "",
      :fragment => ""
    })
  end

  it "should have a request URI of '/?'" do
    expect(@uri.request_uri).to eq("/?")
  end

  it "should normalize to 'http://example.com/'" do
    expect(@uri.normalize.to_s).to eq("http://example.com/")
  end

  it "should have an origin of 'http://example.com'" do
    expect(@uri.origin).to eq("http://example.com")
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://@example.com/'" do
  before do
    @uri = Addressable::URI.parse("http://@example.com/")
  end

  it "should be equivalent to http://example.com" do
    expect(@uri).to eq(Addressable::URI.parse("http://example.com"))
  end

  it "should correctly convert to a hash" do
    expect(@uri.to_hash).to eq({
      :scheme => "http",
      :user => "",
      :password => nil,
      :host => "example.com",
      :port => nil,
      :path => "/",
      :query => nil,
      :fragment => nil
    })
  end

  it "should be identical to its duplicate" do
    expect(@uri).to eq(@uri.dup)
  end

  it "should have an origin of 'http://example.com'" do
    expect(@uri.origin).to eq('http://example.com')
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com./'" do
  before do
    @uri = Addressable::URI.parse("http://example.com./")
  end

  it "should be equivalent to http://example.com" do
    expect(@uri).to eq(Addressable::URI.parse("http://example.com"))
  end

  it "should not be considered to be in normal form" do
    expect(@uri.normalize).not_to be_eql(@uri)
  end

  it "should be identical to its duplicate" do
    expect(@uri).to eq(@uri.dup)
  end

  it "should have an origin of 'http://example.com'" do
    expect(@uri.origin).to eq('http://example.com')
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://:@example.com/'" do
  before do
    @uri = Addressable::URI.parse("http://:@example.com/")
  end

  it "should be equivalent to http://example.com" do
    expect(@uri).to eq(Addressable::URI.parse("http://example.com"))
  end

  it "should correctly convert to a hash" do
    expect(@uri.to_hash).to eq({
      :scheme => "http",
      :user => "",
      :password => "",
      :host => "example.com",
      :port => nil,
      :path => "/",
      :query => nil,
      :fragment => nil
    })
  end

  it "should be identical to its duplicate" do
    expect(@uri).to eq(@uri.dup)
  end

  it "should have an origin of 'http://example.com'" do
    expect(@uri.origin).to eq('http://example.com')
  end
end

describe Addressable::URI, "when parsed from " +
    "'HTTP://EXAMPLE.COM/'" do
  before do
    @uri = Addressable::URI.parse("HTTP://EXAMPLE.COM/")
  end

  it "should be equivalent to http://example.com" do
    expect(@uri).to eq(Addressable::URI.parse("http://example.com"))
  end

  it "should correctly convert to a hash" do
    expect(@uri.to_hash).to eq({
      :scheme => "HTTP",
      :user => nil,
      :password => nil,
      :host => "EXAMPLE.COM",
      :port => nil,
      :path => "/",
      :query => nil,
      :fragment => nil
    })
  end

  it "should be identical to its duplicate" do
    expect(@uri).to eq(@uri.dup)
  end

  it "should have an origin of 'http://example.com'" do
    expect(@uri.origin).to eq('http://example.com')
  end

  it "should have a tld of 'com'" do
    expect(@uri.tld).to eq('com')
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://www.example.co.uk/'" do
  before do
    @uri = Addressable::URI.parse("http://www.example.co.uk/")
  end

  it "should have an origin of 'http://www.example.co.uk'" do
    expect(@uri.origin).to eq('http://www.example.co.uk')
  end

  it "should have a tld of 'co.uk'" do
    expect(@uri.tld).to eq('co.uk')
  end

  it "should have a domain of 'example.co.uk'" do
    expect(@uri.domain).to eq('example.co.uk')
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://sub_domain.blogspot.com/'" do
  before do
    @uri = Addressable::URI.parse("http://sub_domain.blogspot.com/")
  end

  it "should have an origin of 'http://sub_domain.blogspot.com'" do
    expect(@uri.origin).to eq('http://sub_domain.blogspot.com')
  end

  it "should have a tld of 'com'" do
    expect(@uri.tld).to eq('com')
  end

  it "should have a domain of 'blogspot.com'" do
    expect(@uri.domain).to eq('blogspot.com')
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/~smith/'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/~smith/")
  end

  # Based on http://intertwingly.net/blog/2004/07/31/URI-Equivalence
  it "should be equivalent to http://example.com/%7Esmith/" do
    expect(@uri).to eq(Addressable::URI.parse("http://example.com/%7Esmith/"))
  end

  # Based on http://intertwingly.net/blog/2004/07/31/URI-Equivalence
  it "should be equivalent to http://example.com/%7esmith/" do
    expect(@uri).to eq(Addressable::URI.parse("http://example.com/%7esmith/"))
  end

  it "should be identical to its duplicate" do
    expect(@uri).to eq(@uri.dup)
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/%E8'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/%E8")
  end

  it "should not raise an exception when normalized" do
    expect do
      @uri.normalize
    end.not_to raise_error
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end

  it "should not change if encoded with the normalizing algorithm" do
    expect(Addressable::URI.normalized_encode(@uri).to_s).to eq(
      "http://example.com/%E8"
    )
    expect(Addressable::URI.normalized_encode(@uri, Addressable::URI).to_s).to be ===
      "http://example.com/%E8"
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/path%2Fsegment/'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/path%2Fsegment/")
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end

  it "should be equal to 'http://example.com/path%2Fsegment/'" do
    expect(@uri.normalize).to be_eql(
      Addressable::URI.parse("http://example.com/path%2Fsegment/")
    )
  end

  it "should not be equal to 'http://example.com/path/segment/'" do
    expect(@uri).not_to eq(
      Addressable::URI.parse("http://example.com/path/segment/")
    )
  end

  it "should not be equal to 'http://example.com/path/segment/'" do
    expect(@uri.normalize).not_to be_eql(
      Addressable::URI.parse("http://example.com/path/segment/")
    )
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/?%F6'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/?%F6")
  end

  it "should not raise an exception when normalized" do
    expect do
      @uri.normalize
    end.not_to raise_error
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end

  it "should not change if encoded with the normalizing algorithm" do
    expect(Addressable::URI.normalized_encode(@uri).to_s).to eq(
      "http://example.com/?%F6"
    )
    expect(Addressable::URI.normalized_encode(@uri, Addressable::URI).to_s).to be ===
      "http://example.com/?%F6"
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/#%F6'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/#%F6")
  end

  it "should not raise an exception when normalized" do
    expect do
      @uri.normalize
    end.not_to raise_error
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end

  it "should not change if encoded with the normalizing algorithm" do
    expect(Addressable::URI.normalized_encode(@uri).to_s).to eq(
      "http://example.com/#%F6"
    )
    expect(Addressable::URI.normalized_encode(@uri, Addressable::URI).to_s).to be ===
      "http://example.com/#%F6"
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/%C3%87'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/%C3%87")
  end

  # Based on http://intertwingly.net/blog/2004/07/31/URI-Equivalence
  it "should be equivalent to 'http://example.com/C%CC%A7'" do
    expect(@uri).to eq(Addressable::URI.parse("http://example.com/C%CC%A7"))
  end

  it "should not change if encoded with the normalizing algorithm" do
    expect(Addressable::URI.normalized_encode(@uri).to_s).to eq(
      "http://example.com/%C3%87"
    )
    expect(Addressable::URI.normalized_encode(@uri, Addressable::URI).to_s).to be ===
      "http://example.com/%C3%87"
  end

  it "should raise an error if encoding with an unexpected return type" do
    expect do
      Addressable::URI.normalized_encode(@uri, Integer)
    end.to raise_error(TypeError)
  end

  it "if percent encoded should be 'http://example.com/C%25CC%25A7'" do
    expect(Addressable::URI.encode(@uri).to_s).to eq(
      "http://example.com/%25C3%2587"
    )
  end

  it "if percent encoded should be 'http://example.com/C%25CC%25A7'" do
    expect(Addressable::URI.encode(@uri, Addressable::URI)).to eq(
      Addressable::URI.parse("http://example.com/%25C3%2587")
    )
  end

  it "should raise an error if encoding with an unexpected return type" do
    expect do
      Addressable::URI.encode(@uri, Integer)
    end.to raise_error(TypeError)
  end

  it "should be identical to its duplicate" do
    expect(@uri).to eq(@uri.dup)
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/?q=string'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/?q=string")
  end

  it "should use the 'http' scheme" do
    expect(@uri.scheme).to eq("http")
  end

  it "should have an authority segment of 'example.com'" do
    expect(@uri.authority).to eq("example.com")
  end

  it "should have a host of 'example.com'" do
    expect(@uri.host).to eq("example.com")
  end

  it "should have no username" do
    expect(@uri.user).to eq(nil)
  end

  it "should have no password" do
    expect(@uri.password).to eq(nil)
  end

  it "should use port 80" do
    expect(@uri.inferred_port).to eq(80)
  end

  it "should have a path of '/'" do
    expect(@uri.path).to eq("/")
  end

  it "should have a query string of 'q=string'" do
    expect(@uri.query).to eq("q=string")
  end

  it "should have no fragment" do
    expect(@uri.fragment).to eq(nil)
  end

  it "should be considered absolute" do
    expect(@uri).to be_absolute
  end

  it "should not be considered relative" do
    expect(@uri).not_to be_relative
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end

  it "should be identical to its duplicate" do
    expect(@uri).to eq(@uri.dup)
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com:80/'" do
  before do
    @uri = Addressable::URI.parse("http://example.com:80/")
  end

  it "should use the 'http' scheme" do
    expect(@uri.scheme).to eq("http")
  end

  it "should have an authority segment of 'example.com:80'" do
    expect(@uri.authority).to eq("example.com:80")
  end

  it "should have a host of 'example.com'" do
    expect(@uri.host).to eq("example.com")
  end

  it "should have no username" do
    expect(@uri.user).to eq(nil)
  end

  it "should have no password" do
    expect(@uri.password).to eq(nil)
  end

  it "should use port 80" do
    expect(@uri.inferred_port).to eq(80)
  end

  it "should have explicit port 80" do
    expect(@uri.port).to eq(80)
  end

  it "should have a path of '/'" do
    expect(@uri.path).to eq("/")
  end

  it "should have no query string" do
    expect(@uri.query).to eq(nil)
  end

  it "should have no fragment" do
    expect(@uri.fragment).to eq(nil)
  end

  it "should be considered absolute" do
    expect(@uri).to be_absolute
  end

  it "should not be considered relative" do
    expect(@uri).not_to be_relative
  end

  it "should be exactly equal to http://example.com:80/" do
    expect(@uri.eql?(Addressable::URI.parse("http://example.com:80/"))).to eq(true)
  end

  it "should be roughly equal to http://example.com/" do
    expect(@uri === Addressable::URI.parse("http://example.com/")).to eq(true)
  end

  it "should be roughly equal to the string 'http://example.com/'" do
    expect(@uri === "http://example.com/").to eq(true)
  end

  it "should not be roughly equal to the string " +
      "'http://example.com:bogus/'" do
    expect do
      expect(@uri === "http://example.com:bogus/").to eq(false)
    end.not_to raise_error
  end

  it "should result in itself when joined with itself" do
    expect(@uri.join(@uri).to_s).to eq("http://example.com:80/")
    expect(@uri.join!(@uri).to_s).to eq("http://example.com:80/")
  end

  # Section 6.2.3 of RFC 3986
  it "should be equal to http://example.com/" do
    expect(@uri).to eq(Addressable::URI.parse("http://example.com/"))
  end

  # Section 6.2.3 of RFC 3986
  it "should be equal to http://example.com:/" do
    expect(@uri).to eq(Addressable::URI.parse("http://example.com:/"))
  end

  # Section 6.2.3 of RFC 3986
  it "should be equal to http://example.com:80/" do
    expect(@uri).to eq(Addressable::URI.parse("http://example.com:80/"))
  end

  # Section 6.2.2.1 of RFC 3986
  it "should be equal to http://EXAMPLE.COM/" do
    expect(@uri).to eq(Addressable::URI.parse("http://EXAMPLE.COM/"))
  end

  it "should correctly convert to a hash" do
    expect(@uri.to_hash).to eq({
      :scheme => "http",
      :user => nil,
      :password => nil,
      :host => "example.com",
      :port => 80,
      :path => "/",
      :query => nil,
      :fragment => nil
    })
  end

  it "should be identical to its duplicate" do
    expect(@uri).to eq(@uri.dup)
  end

  it "should have an origin of 'http://example.com'" do
    expect(@uri.origin).to eq('http://example.com')
  end

  it "should not change if encoded with the normalizing algorithm" do
    expect(Addressable::URI.normalized_encode(@uri).to_s).to eq(
      "http://example.com:80/"
    )
    expect(Addressable::URI.normalized_encode(@uri, Addressable::URI).to_s).to be ===
      "http://example.com:80/"
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com:8080/'" do
  before do
    @uri = Addressable::URI.parse("http://example.com:8080/")
  end

  it "should use the 'http' scheme" do
    expect(@uri.scheme).to eq("http")
  end

  it "should have an authority segment of 'example.com:8080'" do
    expect(@uri.authority).to eq("example.com:8080")
  end

  it "should have a host of 'example.com'" do
    expect(@uri.host).to eq("example.com")
  end

  it "should have no username" do
    expect(@uri.user).to eq(nil)
  end

  it "should have no password" do
    expect(@uri.password).to eq(nil)
  end

  it "should use port 8080" do
    expect(@uri.inferred_port).to eq(8080)
  end

  it "should have explicit port 8080" do
    expect(@uri.port).to eq(8080)
  end

  it "should have default port 80" do
    expect(@uri.default_port).to eq(80)
  end

  it "should have a path of '/'" do
    expect(@uri.path).to eq("/")
  end

  it "should have no query string" do
    expect(@uri.query).to eq(nil)
  end

  it "should have no fragment" do
    expect(@uri.fragment).to eq(nil)
  end

  it "should be considered absolute" do
    expect(@uri).to be_absolute
  end

  it "should not be considered relative" do
    expect(@uri).not_to be_relative
  end

  it "should be exactly equal to http://example.com:8080/" do
    expect(@uri.eql?(Addressable::URI.parse(
      "http://example.com:8080/"))).to eq(true)
  end

  it "should have a route of 'http://example.com:8080/' from " +
      "'http://example.com/path/to/'" do
    expect(@uri.route_from("http://example.com/path/to/")).to eq(
      Addressable::URI.parse("http://example.com:8080/")
    )
  end

  it "should have a route of 'http://example.com:8080/' from " +
      "'http://example.com:80/path/to/'" do
    expect(@uri.route_from("http://example.com:80/path/to/")).to eq(
      Addressable::URI.parse("http://example.com:8080/")
    )
  end

  it "should have a route of '../../' from " +
      "'http://example.com:8080/path/to/'" do
    expect(@uri.route_from("http://example.com:8080/path/to/")).to eq(
      Addressable::URI.parse("../../")
    )
  end

  it "should have a route of 'http://example.com:8080/' from " +
      "'http://user:pass@example.com/path/to/'" do
    expect(@uri.route_from("http://user:pass@example.com/path/to/")).to eq(
      Addressable::URI.parse("http://example.com:8080/")
    )
  end

  it "should correctly convert to a hash" do
    expect(@uri.to_hash).to eq({
      :scheme => "http",
      :user => nil,
      :password => nil,
      :host => "example.com",
      :port => 8080,
      :path => "/",
      :query => nil,
      :fragment => nil
    })
  end

  it "should be identical to its duplicate" do
    expect(@uri).to eq(@uri.dup)
  end

  it "should have an origin of 'http://example.com:8080'" do
    expect(@uri.origin).to eq('http://example.com:8080')
  end

  it "should not change if encoded with the normalizing algorithm" do
    expect(Addressable::URI.normalized_encode(@uri).to_s).to eq(
      "http://example.com:8080/"
    )
    expect(Addressable::URI.normalized_encode(@uri, Addressable::URI).to_s).to be ===
      "http://example.com:8080/"
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com:%38%30/'" do
  before do
    @uri = Addressable::URI.parse("http://example.com:%38%30/")
  end

  it "should have the correct port" do
    expect(@uri.port).to eq(80)
  end

  it "should not be considered to be in normal form" do
    expect(@uri.normalize).not_to be_eql(@uri)
  end

  it "should normalize to 'http://example.com/'" do
    expect(@uri.normalize.to_s).to eq("http://example.com/")
  end

  it "should have an origin of 'http://example.com'" do
    expect(@uri.origin).to eq('http://example.com')
  end
end

describe Addressable::URI, "when parsed with empty port" do
  subject(:uri) do
    Addressable::URI.parse("//example.com:")
  end

  it "should not infer a port" do
    expect(uri.port).to be(nil)
  end

  it "should have a site value of '//example.com'" do
    expect(uri.site).to eq("//example.com")
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/%2E/'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/%2E/")
  end

  it "should be considered to be in normal form" do
    skip(
      'path segment normalization should happen before ' +
      'percent escaping normalization'
    )
    @uri.normalize.should be_eql(@uri)
  end

  it "should normalize to 'http://example.com/%2E/'" do
    skip(
      'path segment normalization should happen before ' +
      'percent escaping normalization'
    )
    expect(@uri.normalize).to eq("http://example.com/%2E/")
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/..'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/..")
  end

  it "should have the correct port" do
    expect(@uri.inferred_port).to eq(80)
  end

  it "should not be considered to be in normal form" do
    expect(@uri.normalize).not_to be_eql(@uri)
  end

  it "should normalize to 'http://example.com/'" do
    expect(@uri.normalize.to_s).to eq("http://example.com/")
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/../..'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/../..")
  end

  it "should have the correct port" do
    expect(@uri.inferred_port).to eq(80)
  end

  it "should not be considered to be in normal form" do
    expect(@uri.normalize).not_to be_eql(@uri)
  end

  it "should normalize to 'http://example.com/'" do
    expect(@uri.normalize.to_s).to eq("http://example.com/")
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/path(/..'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/path(/..")
  end

  it "should have the correct port" do
    expect(@uri.inferred_port).to eq(80)
  end

  it "should not be considered to be in normal form" do
    expect(@uri.normalize).not_to be_eql(@uri)
  end

  it "should normalize to 'http://example.com/'" do
    expect(@uri.normalize.to_s).to eq("http://example.com/")
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/(path)/..'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/(path)/..")
  end

  it "should have the correct port" do
    expect(@uri.inferred_port).to eq(80)
  end

  it "should not be considered to be in normal form" do
    expect(@uri.normalize).not_to be_eql(@uri)
  end

  it "should normalize to 'http://example.com/'" do
    expect(@uri.normalize.to_s).to eq("http://example.com/")
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/path(/../'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/path(/../")
  end

  it "should have the correct port" do
    expect(@uri.inferred_port).to eq(80)
  end

  it "should not be considered to be in normal form" do
    expect(@uri.normalize).not_to be_eql(@uri)
  end

  it "should normalize to 'http://example.com/'" do
    expect(@uri.normalize.to_s).to eq("http://example.com/")
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/(path)/../'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/(path)/../")
  end

  it "should have the correct port" do
    expect(@uri.inferred_port).to eq(80)
  end

  it "should not be considered to be in normal form" do
    expect(@uri.normalize).not_to be_eql(@uri)
  end

  it "should normalize to 'http://example.com/'" do
    expect(@uri.normalize.to_s).to eq("http://example.com/")
  end
end

describe Addressable::URI, "when parsed from " +
    "'/..//example.com'" do
  before do
    @uri = Addressable::URI.parse("/..//example.com")
  end

  it "should become invalid when normalized" do
    expect do
      @uri.normalize
    end.to raise_error(Addressable::URI::InvalidURIError, /authority/)
  end

  it "should have a path of '/..//example.com'" do
    expect(@uri.path).to eq("/..//example.com")
  end
end

describe Addressable::URI, "when parsed from '/a/b/c/./../../g'" do
  before do
    @uri = Addressable::URI.parse("/a/b/c/./../../g")
  end

  it "should not be considered to be in normal form" do
    expect(@uri.normalize).not_to be_eql(@uri)
  end

  # Section 5.2.4 of RFC 3986
  it "should normalize to '/a/g'" do
    expect(@uri.normalize.to_s).to eq("/a/g")
  end
end

describe Addressable::URI, "when parsed from 'mid/content=5/../6'" do
  before do
    @uri = Addressable::URI.parse("mid/content=5/../6")
  end

  it "should not be considered to be in normal form" do
    expect(@uri.normalize).not_to be_eql(@uri)
  end

  # Section 5.2.4 of RFC 3986
  it "should normalize to 'mid/6'" do
    expect(@uri.normalize.to_s).to eq("mid/6")
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://www.example.com///../'" do
  before do
    @uri = Addressable::URI.parse('http://www.example.com///../')
  end

  it "should not be considered to be in normal form" do
    expect(@uri.normalize).not_to be_eql(@uri)
  end

  it "should normalize to 'http://www.example.com//'" do
    expect(@uri.normalize.to_s).to eq("http://www.example.com//")
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/path/to/resource/'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/path/to/resource/")
  end

  it "should use the 'http' scheme" do
    expect(@uri.scheme).to eq("http")
  end

  it "should have an authority segment of 'example.com'" do
    expect(@uri.authority).to eq("example.com")
  end

  it "should have a host of 'example.com'" do
    expect(@uri.host).to eq("example.com")
  end

  it "should have no username" do
    expect(@uri.user).to eq(nil)
  end

  it "should have no password" do
    expect(@uri.password).to eq(nil)
  end

  it "should use port 80" do
    expect(@uri.inferred_port).to eq(80)
  end

  it "should have a path of '/path/to/resource/'" do
    expect(@uri.path).to eq("/path/to/resource/")
  end

  it "should have no query string" do
    expect(@uri.query).to eq(nil)
  end

  it "should have no fragment" do
    expect(@uri.fragment).to eq(nil)
  end

  it "should be considered absolute" do
    expect(@uri).to be_absolute
  end

  it "should not be considered relative" do
    expect(@uri).not_to be_relative
  end

  it "should be exactly equal to http://example.com:8080/" do
    expect(@uri.eql?(Addressable::URI.parse(
      "http://example.com/path/to/resource/"))).to eq(true)
  end

  it "should have a route of 'resource/' from " +
      "'http://example.com/path/to/'" do
    expect(@uri.route_from("http://example.com/path/to/")).to eq(
      Addressable::URI.parse("resource/")
    )
  end

  it "should have a route of '../' from " +
    "'http://example.com/path/to/resource/sub'" do
    expect(@uri.route_from("http://example.com/path/to/resource/sub")).to eq(
      Addressable::URI.parse("../")
    )
  end


  it "should have a route of 'resource/' from " +
    "'http://example.com/path/to/another'" do
    expect(@uri.route_from("http://example.com/path/to/another")).to eq(
      Addressable::URI.parse("resource/")
    )
  end

  it "should have a route of 'resource/' from " +
      "'http://example.com/path/to/res'" do
    expect(@uri.route_from("http://example.com/path/to/res")).to eq(
      Addressable::URI.parse("resource/")
    )
  end

  it "should have a route of 'resource/' from " +
      "'http://example.com:80/path/to/'" do
    expect(@uri.route_from("http://example.com:80/path/to/")).to eq(
      Addressable::URI.parse("resource/")
    )
  end

  it "should have a route of 'http://example.com/path/to/' from " +
      "'http://example.com:8080/path/to/'" do
    expect(@uri.route_from("http://example.com:8080/path/to/")).to eq(
      Addressable::URI.parse("http://example.com/path/to/resource/")
    )
  end

  it "should have a route of 'http://example.com/path/to/' from " +
      "'http://user:pass@example.com/path/to/'" do
    expect(@uri.route_from("http://user:pass@example.com/path/to/")).to eq(
      Addressable::URI.parse("http://example.com/path/to/resource/")
    )
  end

  it "should have a route of '../../path/to/resource/' from " +
      "'http://example.com/to/resource/'" do
    expect(@uri.route_from("http://example.com/to/resource/")).to eq(
      Addressable::URI.parse("../../path/to/resource/")
    )
  end

  it "should correctly convert to a hash" do
    expect(@uri.to_hash).to eq({
      :scheme => "http",
      :user => nil,
      :password => nil,
      :host => "example.com",
      :port => nil,
      :path => "/path/to/resource/",
      :query => nil,
      :fragment => nil
    })
  end

  it "should be identical to its duplicate" do
    expect(@uri).to eq(@uri.dup)
  end
end

describe Addressable::URI, "when parsed from " +
    "'relative/path/to/resource'" do
  before do
    @uri = Addressable::URI.parse("relative/path/to/resource")
  end

  it "should not have a scheme" do
    expect(@uri.scheme).to eq(nil)
  end

  it "should not be considered ip-based" do
    expect(@uri).not_to be_ip_based
  end

  it "should not have an authority segment" do
    expect(@uri.authority).to eq(nil)
  end

  it "should not have a host" do
    expect(@uri.host).to eq(nil)
  end

  it "should have no username" do
    expect(@uri.user).to eq(nil)
  end

  it "should have no password" do
    expect(@uri.password).to eq(nil)
  end

  it "should not have a port" do
    expect(@uri.port).to eq(nil)
  end

  it "should have a path of 'relative/path/to/resource'" do
    expect(@uri.path).to eq("relative/path/to/resource")
  end

  it "should have no query string" do
    expect(@uri.query).to eq(nil)
  end

  it "should have no fragment" do
    expect(@uri.fragment).to eq(nil)
  end

  it "should not be considered absolute" do
    expect(@uri).not_to be_absolute
  end

  it "should be considered relative" do
    expect(@uri).to be_relative
  end

  it "should raise an error if routing is attempted" do
    expect do
      @uri.route_to("http://example.com/")
    end.to raise_error(ArgumentError, /relative\/path\/to\/resource/)
    expect do
      @uri.route_from("http://example.com/")
    end.to raise_error(ArgumentError, /relative\/path\/to\/resource/)
  end

  it "when joined with 'another/relative/path' should be " +
      "'relative/path/to/another/relative/path'" do
    expect(@uri.join('another/relative/path')).to eq(
      Addressable::URI.parse("relative/path/to/another/relative/path")
    )
  end

  it "should be identical to its duplicate" do
    expect(@uri).to eq(@uri.dup)
  end
end

describe Addressable::URI, "when parsed from " +
    "'relative_path_with_no_slashes'" do
  before do
    @uri = Addressable::URI.parse("relative_path_with_no_slashes")
  end

  it "should not have a scheme" do
    expect(@uri.scheme).to eq(nil)
  end

  it "should not be considered ip-based" do
    expect(@uri).not_to be_ip_based
  end

  it "should not have an authority segment" do
    expect(@uri.authority).to eq(nil)
  end

  it "should not have a host" do
    expect(@uri.host).to eq(nil)
  end

  it "should have no username" do
    expect(@uri.user).to eq(nil)
  end

  it "should have no password" do
    expect(@uri.password).to eq(nil)
  end

  it "should not have a port" do
    expect(@uri.port).to eq(nil)
  end

  it "should have a path of 'relative_path_with_no_slashes'" do
    expect(@uri.path).to eq("relative_path_with_no_slashes")
  end

  it "should have no query string" do
    expect(@uri.query).to eq(nil)
  end

  it "should have no fragment" do
    expect(@uri.fragment).to eq(nil)
  end

  it "should not be considered absolute" do
    expect(@uri).not_to be_absolute
  end

  it "should be considered relative" do
    expect(@uri).to be_relative
  end

  it "when joined with 'another_relative_path' should be " +
      "'another_relative_path'" do
    expect(@uri.join('another_relative_path')).to eq(
      Addressable::URI.parse("another_relative_path")
    )
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/file.txt'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/file.txt")
  end

  it "should have a scheme of 'http'" do
    expect(@uri.scheme).to eq("http")
  end

  it "should have an authority segment of 'example.com'" do
    expect(@uri.authority).to eq("example.com")
  end

  it "should have a host of 'example.com'" do
    expect(@uri.host).to eq("example.com")
  end

  it "should have no username" do
    expect(@uri.user).to eq(nil)
  end

  it "should have no password" do
    expect(@uri.password).to eq(nil)
  end

  it "should use port 80" do
    expect(@uri.inferred_port).to eq(80)
  end

  it "should have a path of '/file.txt'" do
    expect(@uri.path).to eq("/file.txt")
  end

  it "should have a basename of 'file.txt'" do
    expect(@uri.basename).to eq("file.txt")
  end

  it "should have an extname of '.txt'" do
    expect(@uri.extname).to eq(".txt")
  end

  it "should have no query string" do
    expect(@uri.query).to eq(nil)
  end

  it "should have no fragment" do
    expect(@uri.fragment).to eq(nil)
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/file.txt;parameter'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/file.txt;parameter")
  end

  it "should have a scheme of 'http'" do
    expect(@uri.scheme).to eq("http")
  end

  it "should have an authority segment of 'example.com'" do
    expect(@uri.authority).to eq("example.com")
  end

  it "should have a host of 'example.com'" do
    expect(@uri.host).to eq("example.com")
  end

  it "should have no username" do
    expect(@uri.user).to eq(nil)
  end

  it "should have no password" do
    expect(@uri.password).to eq(nil)
  end

  it "should use port 80" do
    expect(@uri.inferred_port).to eq(80)
  end

  it "should have a path of '/file.txt;parameter'" do
    expect(@uri.path).to eq("/file.txt;parameter")
  end

  it "should have a basename of 'file.txt'" do
    expect(@uri.basename).to eq("file.txt")
  end

  it "should have an extname of '.txt'" do
    expect(@uri.extname).to eq(".txt")
  end

  it "should have no query string" do
    expect(@uri.query).to eq(nil)
  end

  it "should have no fragment" do
    expect(@uri.fragment).to eq(nil)
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/file.txt;x=y'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/file.txt;x=y")
  end

  it "should have a scheme of 'http'" do
    expect(@uri.scheme).to eq("http")
  end

  it "should have a scheme of 'http'" do
    expect(@uri.scheme).to eq("http")
  end

  it "should have an authority segment of 'example.com'" do
    expect(@uri.authority).to eq("example.com")
  end

  it "should have a host of 'example.com'" do
    expect(@uri.host).to eq("example.com")
  end

  it "should have no username" do
    expect(@uri.user).to eq(nil)
  end

  it "should have no password" do
    expect(@uri.password).to eq(nil)
  end

  it "should use port 80" do
    expect(@uri.inferred_port).to eq(80)
  end

  it "should have a path of '/file.txt;x=y'" do
    expect(@uri.path).to eq("/file.txt;x=y")
  end

  it "should have an extname of '.txt'" do
    expect(@uri.extname).to eq(".txt")
  end

  it "should have no query string" do
    expect(@uri.query).to eq(nil)
  end

  it "should have no fragment" do
    expect(@uri.fragment).to eq(nil)
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end
end

describe Addressable::URI, "when parsed from " +
    "'svn+ssh://developername@rubyforge.org/var/svn/project'" do
  before do
    @uri = Addressable::URI.parse(
      "svn+ssh://developername@rubyforge.org/var/svn/project"
    )
  end

  it "should have a scheme of 'svn+ssh'" do
    expect(@uri.scheme).to eq("svn+ssh")
  end

  it "should be considered to be ip-based" do
    expect(@uri).to be_ip_based
  end

  it "should have a path of '/var/svn/project'" do
    expect(@uri.path).to eq("/var/svn/project")
  end

  it "should have a username of 'developername'" do
    expect(@uri.user).to eq("developername")
  end

  it "should have no password" do
    expect(@uri.password).to eq(nil)
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end
end

describe Addressable::URI, "when parsed from " +
    "'ssh+svn://developername@RUBYFORGE.ORG/var/svn/project'" do
  before do
    @uri = Addressable::URI.parse(
      "ssh+svn://developername@RUBYFORGE.ORG/var/svn/project"
    )
  end

  it "should have a scheme of 'ssh+svn'" do
    expect(@uri.scheme).to eq("ssh+svn")
  end

  it "should have a normalized scheme of 'svn+ssh'" do
    expect(@uri.normalized_scheme).to eq("svn+ssh")
  end

  it "should have a normalized site of 'svn+ssh'" do
    expect(@uri.normalized_site).to eq("svn+ssh://developername@rubyforge.org")
  end

  it "should not be considered to be ip-based" do
    expect(@uri).not_to be_ip_based
  end

  it "should have a path of '/var/svn/project'" do
    expect(@uri.path).to eq("/var/svn/project")
  end

  it "should have a username of 'developername'" do
    expect(@uri.user).to eq("developername")
  end

  it "should have no password" do
    expect(@uri.password).to eq(nil)
  end

  it "should not be considered to be in normal form" do
    expect(@uri.normalize).not_to be_eql(@uri)
  end
end

describe Addressable::URI, "when parsed from " +
    "'mailto:user@example.com'" do
  before do
    @uri = Addressable::URI.parse("mailto:user@example.com")
  end

  it "should have a scheme of 'mailto'" do
    expect(@uri.scheme).to eq("mailto")
  end

  it "should not be considered to be ip-based" do
    expect(@uri).not_to be_ip_based
  end

  it "should have a path of 'user@example.com'" do
    expect(@uri.path).to eq("user@example.com")
  end

  it "should have no user" do
    expect(@uri.user).to eq(nil)
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end
end

describe Addressable::URI, "when parsed from " +
    "'tag:example.com,2006-08-18:/path/to/something'" do
  before do
    @uri = Addressable::URI.parse(
      "tag:example.com,2006-08-18:/path/to/something")
  end

  it "should have a scheme of 'tag'" do
    expect(@uri.scheme).to eq("tag")
  end

  it "should be considered to be ip-based" do
    expect(@uri).not_to be_ip_based
  end

  it "should have a path of " +
      "'example.com,2006-08-18:/path/to/something'" do
    expect(@uri.path).to eq("example.com,2006-08-18:/path/to/something")
  end

  it "should have no user" do
    expect(@uri.user).to eq(nil)
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end

  it "should have a 'null' origin" do
    expect(@uri.origin).to eq('null')
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/x;y/'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/x;y/")
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/?x=1&y=2'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/?x=1&y=2")
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end
end

describe Addressable::URI, "when parsed from " +
    "'view-source:http://example.com/'" do
  before do
    @uri = Addressable::URI.parse("view-source:http://example.com/")
  end

  it "should have a scheme of 'view-source'" do
    expect(@uri.scheme).to eq("view-source")
  end

  it "should have a path of 'http://example.com/'" do
    expect(@uri.path).to eq("http://example.com/")
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end

  it "should have a 'null' origin" do
    expect(@uri.origin).to eq('null')
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://user:pass@example.com/path/to/resource?query=x#fragment'" do
  before do
    @uri = Addressable::URI.parse(
      "http://user:pass@example.com/path/to/resource?query=x#fragment")
  end

  it "should use the 'http' scheme" do
    expect(@uri.scheme).to eq("http")
  end

  it "should have an authority segment of 'user:pass@example.com'" do
    expect(@uri.authority).to eq("user:pass@example.com")
  end

  it "should have a username of 'user'" do
    expect(@uri.user).to eq("user")
  end

  it "should have a password of 'pass'" do
    expect(@uri.password).to eq("pass")
  end

  it "should have a host of 'example.com'" do
    expect(@uri.host).to eq("example.com")
  end

  it "should use port 80" do
    expect(@uri.inferred_port).to eq(80)
  end

  it "should have a path of '/path/to/resource'" do
    expect(@uri.path).to eq("/path/to/resource")
  end

  it "should have a query string of 'query=x'" do
    expect(@uri.query).to eq("query=x")
  end

  it "should have a fragment of 'fragment'" do
    expect(@uri.fragment).to eq("fragment")
  end

  it "should be considered to be in normal form" do
    expect(@uri.normalize).to be_eql(@uri)
  end

  it "should have a route of '../../' to " +
      "'http://user:pass@example.com/path/'" do
    expect(@uri.route_to("http://user:pass@example.com/path/")).to eq(
      Addressable::URI.parse("../../")
    )
  end

  it "should have a route of 'to/resource?query=x#fragment' " +
      "from 'http://user:pass@example.com/path/'" do
    expect(@uri.route_from("http://user:pass@example.com/path/")).to eq(
      Addressable::URI.parse("to/resource?query=x#fragment")
    )
  end

  it "should have a route of '?query=x#fragment' " +
      "from 'http://user:pass@example.com/path/to/resource'" do
    expect(@uri.route_from("http://user:pass@example.com/path/to/resource")).to eq(
      Addressable::URI.parse("?query=x#fragment")
    )
  end

  it "should have a route of '#fragment' " +
      "from 'http://user:pass@example.com/path/to/resource?query=x'" do
    expect(@uri.route_from(
      "http://user:pass@example.com/path/to/resource?query=x")).to eq(
        Addressable::URI.parse("#fragment")
    )
  end

  it "should have a route of '#fragment' from " +
      "'http://user:pass@example.com/path/to/resource?query=x#fragment'" do
    expect(@uri.route_from(
      "http://user:pass@example.com/path/to/resource?query=x#fragment"
    )).to eq(Addressable::URI.parse("#fragment"))
  end

  it "should have a route of 'http://elsewhere.com/' to " +
      "'http://elsewhere.com/'" do
    expect(@uri.route_to("http://elsewhere.com/")).to eq(
      Addressable::URI.parse("http://elsewhere.com/")
    )
  end

  it "should have a route of " +
      "'http://user:pass@example.com/path/to/resource?query=x#fragment' " +
      "from 'http://example.com/path/to/'" do
    expect(@uri.route_from("http://elsewhere.com/path/to/")).to eq(
      Addressable::URI.parse(
        "http://user:pass@example.com/path/to/resource?query=x#fragment")
    )
  end

  it "should have the correct scheme after assignment" do
    @uri.scheme = "ftp"
    expect(@uri.scheme).to eq("ftp")
    expect(@uri.to_s).to eq(
      "ftp://user:pass@example.com/path/to/resource?query=x#fragment"
    )
    expect(@uri.to_str).to eq(
      "ftp://user:pass@example.com/path/to/resource?query=x#fragment"
    )
  end

  it "should have the correct site segment after assignment" do
    @uri.site = "https://newuser:newpass@example.com:443"
    expect(@uri.scheme).to eq("https")
    expect(@uri.authority).to eq("newuser:newpass@example.com:443")
    expect(@uri.user).to eq("newuser")
    expect(@uri.password).to eq("newpass")
    expect(@uri.userinfo).to eq("newuser:newpass")
    expect(@uri.normalized_userinfo).to eq("newuser:newpass")
    expect(@uri.host).to eq("example.com")
    expect(@uri.port).to eq(443)
    expect(@uri.inferred_port).to eq(443)
    expect(@uri.to_s).to eq(
      "https://newuser:newpass@example.com:443" +
      "/path/to/resource?query=x#fragment"
    )
  end

  it "should have the correct authority segment after assignment" do
    @uri.authority = "newuser:newpass@example.com:80"
    expect(@uri.authority).to eq("newuser:newpass@example.com:80")
    expect(@uri.user).to eq("newuser")
    expect(@uri.password).to eq("newpass")
    expect(@uri.userinfo).to eq("newuser:newpass")
    expect(@uri.normalized_userinfo).to eq("newuser:newpass")
    expect(@uri.host).to eq("example.com")
    expect(@uri.port).to eq(80)
    expect(@uri.inferred_port).to eq(80)
    expect(@uri.to_s).to eq(
      "http://newuser:newpass@example.com:80" +
      "/path/to/resource?query=x#fragment"
    )
  end

  it "should have the correct userinfo segment after assignment" do
    @uri.userinfo = "newuser:newpass"
    expect(@uri.userinfo).to eq("newuser:newpass")
    expect(@uri.authority).to eq("newuser:newpass@example.com")
    expect(@uri.user).to eq("newuser")
    expect(@uri.password).to eq("newpass")
    expect(@uri.host).to eq("example.com")
    expect(@uri.port).to eq(nil)
    expect(@uri.inferred_port).to eq(80)
    expect(@uri.to_s).to eq(
      "http://newuser:newpass@example.com" +
      "/path/to/resource?query=x#fragment"
    )
  end

  it "should have the correct username after assignment" do
    @uri.user = "newuser"
    expect(@uri.user).to eq("newuser")
    expect(@uri.authority).to eq("newuser:pass@example.com")
  end

  it "should have the correct password after assignment" do
    @uri.password = "newpass"
    expect(@uri.password).to eq("newpass")
    expect(@uri.authority).to eq("user:newpass@example.com")
  end

  it "should have the correct host after assignment" do
    @uri.host = "newexample.com"
    expect(@uri.host).to eq("newexample.com")
    expect(@uri.authority).to eq("user:pass@newexample.com")
  end

  it "should have the correct host after assignment" do
    @uri.hostname = "newexample.com"
    expect(@uri.host).to eq("newexample.com")
    expect(@uri.hostname).to eq("newexample.com")
    expect(@uri.authority).to eq("user:pass@newexample.com")
  end

  it "should raise an error if assigning a bogus object to the hostname" do
    expect do
      @uri.hostname = Object.new
    end.to raise_error(TypeError)
  end

  it "should have the correct port after assignment" do
    @uri.port = 8080
    expect(@uri.port).to eq(8080)
    expect(@uri.authority).to eq("user:pass@example.com:8080")
  end

  it "should have the correct origin after assignment" do
    @uri.origin = "http://newexample.com"
    expect(@uri.host).to eq("newexample.com")
    expect(@uri.authority).to eq("newexample.com")
  end

  it "should have the correct path after assignment" do
    @uri.path = "/newpath/to/resource"
    expect(@uri.path).to eq("/newpath/to/resource")
    expect(@uri.to_s).to eq(
      "http://user:pass@example.com/newpath/to/resource?query=x#fragment"
    )
  end

  it "should have the correct scheme and authority after nil assignment" do
    @uri.site = nil
    expect(@uri.scheme).to eq(nil)
    expect(@uri.authority).to eq(nil)
    expect(@uri.to_s).to eq("/path/to/resource?query=x#fragment")
  end

  it "should have the correct scheme and authority after assignment" do
    @uri.site = "file://"
    expect(@uri.scheme).to eq("file")
    expect(@uri.authority).to eq("")
    expect(@uri.to_s).to eq("file:///path/to/resource?query=x#fragment")
  end

  it "should have the correct path after nil assignment" do
    @uri.path = nil
    expect(@uri.path).to eq("")
    expect(@uri.to_s).to eq(
      "http://user:pass@example.com?query=x#fragment"
    )
  end

  it "should have the correct query string after assignment" do
    @uri.query = "newquery=x"
    expect(@uri.query).to eq("newquery=x")
    expect(@uri.to_s).to eq(
      "http://user:pass@example.com/path/to/resource?newquery=x#fragment"
    )
    @uri.query = nil
    expect(@uri.query).to eq(nil)
    expect(@uri.to_s).to eq(
      "http://user:pass@example.com/path/to/resource#fragment"
    )
  end

  it "should have the correct query string after hash assignment" do
    @uri.query_values = {"?uestion mark" => "=sign", "hello" => "g\xC3\xBCnther"}
    expect(@uri.query.split("&")).to include("%3Fuestion%20mark=%3Dsign")
    expect(@uri.query.split("&")).to include("hello=g%C3%BCnther")
    expect(@uri.query_values).to eq({
      "?uestion mark" => "=sign", "hello" => "g\xC3\xBCnther"
    })
  end

  it "should have the correct query string after flag hash assignment" do
    @uri.query_values = {'flag?1' => nil, 'fl=ag2' => nil, 'flag3' => nil}
    expect(@uri.query.split("&")).to include("flag%3F1")
    expect(@uri.query.split("&")).to include("fl%3Dag2")
    expect(@uri.query.split("&")).to include("flag3")
    expect(@uri.query_values(Array).sort).to eq([["fl=ag2"], ["flag3"], ["flag?1"]])
    expect(@uri.query_values(Hash)).to eq({
      'flag?1' => nil, 'fl=ag2' => nil, 'flag3' => nil
    })
  end

  it "should raise an error if query values are set to a bogus type" do
    expect do
      @uri.query_values = "bogus"
    end.to raise_error(TypeError)
  end

  it "should have the correct fragment after assignment" do
    @uri.fragment = "newfragment"
    expect(@uri.fragment).to eq("newfragment")
    expect(@uri.to_s).to eq(
      "http://user:pass@example.com/path/to/resource?query=x#newfragment"
    )

    @uri.fragment = nil
    expect(@uri.fragment).to eq(nil)
    expect(@uri.to_s).to eq(
      "http://user:pass@example.com/path/to/resource?query=x"
    )
  end

  it "should have the correct values after a merge" do
    expect(@uri.merge(:fragment => "newfragment").to_s).to eq(
      "http://user:pass@example.com/path/to/resource?query=x#newfragment"
    )
  end

  it "should have the correct values after a merge" do
    expect(@uri.merge(:fragment => nil).to_s).to eq(
      "http://user:pass@example.com/path/to/resource?query=x"
    )
  end

  it "should have the correct values after a merge" do
    expect(@uri.merge(:userinfo => "newuser:newpass").to_s).to eq(
      "http://newuser:newpass@example.com/path/to/resource?query=x#fragment"
    )
  end

  it "should have the correct values after a merge" do
    expect(@uri.merge(:userinfo => nil).to_s).to eq(
      "http://example.com/path/to/resource?query=x#fragment"
    )
  end

  it "should have the correct values after a merge" do
    expect(@uri.merge(:path => "newpath").to_s).to eq(
      "http://user:pass@example.com/newpath?query=x#fragment"
    )
  end

  it "should have the correct values after a merge" do
    expect(@uri.merge(:port => "42", :path => "newpath", :query => "").to_s).to eq(
      "http://user:pass@example.com:42/newpath?#fragment"
    )
  end

  it "should have the correct values after a merge" do
    expect(@uri.merge(:authority => "foo:bar@baz:42").to_s).to eq(
      "http://foo:bar@baz:42/path/to/resource?query=x#fragment"
    )
    # Ensure the operation was not destructive
    expect(@uri.to_s).to eq(
      "http://user:pass@example.com/path/to/resource?query=x#fragment"
    )
  end

  it "should have the correct values after a destructive merge" do
    @uri.merge!(:authority => "foo:bar@baz:42")
    # Ensure the operation was destructive
    expect(@uri.to_s).to eq(
      "http://foo:bar@baz:42/path/to/resource?query=x#fragment"
    )
  end

  it "should fail to merge with bogus values" do
    expect do
      @uri.merge(:port => "bogus")
    end.to raise_error(Addressable::URI::InvalidURIError)
  end

  it "should fail to merge with bogus values" do
    expect do
      @uri.merge(:authority => "bar@baz:bogus")
    end.to raise_error(Addressable::URI::InvalidURIError)
  end

  it "should fail to merge with bogus parameters" do
    expect do
      @uri.merge(42)
    end.to raise_error(TypeError)
  end

  it "should fail to merge with bogus parameters" do
    expect do
      @uri.merge("http://example.com/")
    end.to raise_error(TypeError)
  end

  it "should fail to merge with both authority and subcomponents" do
    expect do
      @uri.merge(:authority => "foo:bar@baz:42", :port => "42")
    end.to raise_error(ArgumentError)
  end

  it "should fail to merge with both userinfo and subcomponents" do
    expect do
      @uri.merge(:userinfo => "foo:bar", :user => "foo")
    end.to raise_error(ArgumentError)
  end

  it "should be identical to its duplicate" do
    expect(@uri).to eq(@uri.dup)
  end

  it "should have an origin of 'http://example.com'" do
    expect(@uri.origin).to eq('http://example.com')
  end
end

describe Addressable::URI, "when parsed from " +
  "'http://example.com/search?q=Q%26A'" do

  before do
    @uri = Addressable::URI.parse("http://example.com/search?q=Q%26A")
  end

  it "should have a query of 'q=Q%26A'" do
    expect(@uri.query).to eq("q=Q%26A")
  end

  it "should have query_values of {'q' => 'Q&A'}" do
    expect(@uri.query_values).to eq({ 'q' => 'Q&A' })
  end

  it "should normalize to the original uri " +
      "(with the ampersand properly percent-encoded)" do
    expect(@uri.normalize.to_s).to eq("http://example.com/search?q=Q%26A")
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/?&x=b'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/?&x=b")
  end

  it "should have a query of '&x=b'" do
    expect(@uri.query).to eq("&x=b")
  end

  it "should have query_values of {'x' => 'b'}" do
    expect(@uri.query_values).to eq({'x' => 'b'})
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/?q='one;two'&x=1'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/?q='one;two'&x=1")
  end

  it "should have a query of 'q='one;two'&x=1'" do
    expect(@uri.query).to eq("q='one;two'&x=1")
  end

  it "should have query_values of {\"q\" => \"'one;two'\", \"x\" => \"1\"}" do
    expect(@uri.query_values).to eq({"q" => "'one;two'", "x" => "1"})
  end

  it "should escape the ';' character when normalizing to avoid ambiguity " +
      "with the W3C HTML 4.01 specification" do
    # HTML 4.01 Section B.2.2
    expect(@uri.normalize.query).to eq("q='one%3Btwo'&x=1")
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/?&&x=b'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/?&&x=b")
  end

  it "should have a query of '&&x=b'" do
    expect(@uri.query).to eq("&&x=b")
  end

  it "should have query_values of {'x' => 'b'}" do
    expect(@uri.query_values).to eq({'x' => 'b'})
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/?q=a&&x=b'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/?q=a&&x=b")
  end

  it "should have a query of 'q=a&&x=b'" do
    expect(@uri.query).to eq("q=a&&x=b")
  end

  it "should have query_values of {'q' => 'a, 'x' => 'b'}" do
    expect(@uri.query_values).to eq({'q' => 'a', 'x' => 'b'})
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/?q&&x=b'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/?q&&x=b")
  end

  it "should have a query of 'q&&x=b'" do
    expect(@uri.query).to eq("q&&x=b")
  end

  it "should have query_values of {'q' => true, 'x' => 'b'}" do
    expect(@uri.query_values).to eq({'q' => nil, 'x' => 'b'})
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/?q=a+b'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/?q=a+b")
  end

  it "should have a query of 'q=a+b'" do
    expect(@uri.query).to eq("q=a+b")
  end

  it "should have query_values of {'q' => 'a b'}" do
    expect(@uri.query_values).to eq({'q' => 'a b'})
  end

  it "should have a normalized query of 'q=a+b'" do
    expect(@uri.normalized_query).to eq("q=a+b")
  end
end

describe Addressable::URI, "when parsed from 'https://example.com/?q=a+b'" do
  before do
    @uri = Addressable::URI.parse("https://example.com/?q=a+b")
  end

  it "should have query_values of {'q' => 'a b'}" do
    expect(@uri.query_values).to eq("q" => "a b")
  end
end

describe Addressable::URI, "when parsed from 'example.com?q=a+b'" do
  before do
    @uri = Addressable::URI.parse("example.com?q=a+b")
  end

  it "should have query_values of {'q' => 'a b'}" do
    expect(@uri.query_values).to eq("q" => "a b")
  end
end

describe Addressable::URI, "when parsed from 'mailto:?q=a+b'" do
  before do
    @uri = Addressable::URI.parse("mailto:?q=a+b")
  end

  it "should have query_values of {'q' => 'a+b'}" do
    expect(@uri.query_values).to eq("q" => "a+b")
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/?q=a%2bb'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/?q=a%2bb")
  end

  it "should have a query of 'q=a+b'" do
    expect(@uri.query).to eq("q=a%2bb")
  end

  it "should have query_values of {'q' => 'a+b'}" do
    expect(@uri.query_values).to eq({'q' => 'a+b'})
  end

  it "should have a normalized query of 'q=a%2Bb'" do
    expect(@uri.normalized_query).to eq("q=a%2Bb")
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/?v=%7E&w=%&x=%25&y=%2B&z=C%CC%A7'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/?v=%7E&w=%&x=%25&y=%2B&z=C%CC%A7")
  end

  it "should have a normalized query of 'v=~&w=%25&x=%25&y=%2B&z=%C3%87'" do
    expect(@uri.normalized_query).to eq("v=~&w=%25&x=%25&y=%2B&z=%C3%87")
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/?v=%7E&w=%&x=%25&y=+&z=C%CC%A7'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/?v=%7E&w=%&x=%25&y=+&z=C%CC%A7")
  end

  it "should have a normalized query of 'v=~&w=%25&x=%25&y=+&z=%C3%87'" do
    expect(@uri.normalized_query).to eq("v=~&w=%25&x=%25&y=+&z=%C3%87")
  end
end

describe Addressable::URI, "when parsed from 'http://example/?b=1&a=2&c=3'" do
  before do
    @uri = Addressable::URI.parse("http://example/?b=1&a=2&c=3")
  end

  it "should have a sorted normalized query of 'a=2&b=1&c=3'" do
    expect(@uri.normalized_query(:sorted)).to eq("a=2&b=1&c=3")
  end
end

describe Addressable::URI, "when parsed from 'http://example/?&a&&c&'" do
  before do
    @uri = Addressable::URI.parse("http://example/?&a&&c&")
  end

  it "should have a compacted normalized query of 'a&c'" do
    expect(@uri.normalized_query(:compacted)).to eq("a&c")
  end
end

describe Addressable::URI, "when parsed from 'http://example.com/?a=1&a=1'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/?a=1&a=1")
  end

  it "should have a compacted normalized query of 'a=1'" do
    expect(@uri.normalized_query(:compacted)).to eq("a=1")
  end
end

describe Addressable::URI, "when parsed from 'http://example.com/?a=1&a=2'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/?a=1&a=2")
  end

  it "should have a compacted normalized query of 'a=1&a=2'" do
    expect(@uri.normalized_query(:compacted)).to eq("a=1&a=2")
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/sound%2bvision'" do
  before do
    @uri = Addressable::URI.parse("http://example.com/sound%2bvision")
  end

  it "should have a normalized path of '/sound+vision'" do
    expect(@uri.normalized_path).to eq('/sound+vision')
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/?q='" do
  before do
    @uri = Addressable::URI.parse("http://example.com/?q=")
  end

  it "should have a query of 'q='" do
    expect(@uri.query).to eq("q=")
  end

  it "should have query_values of {'q' => ''}" do
    expect(@uri.query_values).to eq({'q' => ''})
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://user@example.com'" do
  before do
    @uri = Addressable::URI.parse("http://user@example.com")
  end

  it "should use the 'http' scheme" do
    expect(@uri.scheme).to eq("http")
  end

  it "should have a username of 'user'" do
    expect(@uri.user).to eq("user")
  end

  it "should have no password" do
    expect(@uri.password).to eq(nil)
  end

  it "should have a userinfo of 'user'" do
    expect(@uri.userinfo).to eq("user")
  end

  it "should have a normalized userinfo of 'user'" do
    expect(@uri.normalized_userinfo).to eq("user")
  end

  it "should have a host of 'example.com'" do
    expect(@uri.host).to eq("example.com")
  end

  it "should have default_port 80" do
    expect(@uri.default_port).to eq(80)
  end

  it "should use port 80" do
    expect(@uri.inferred_port).to eq(80)
  end

  it "should have the correct username after assignment" do
    @uri.user = "newuser"
    expect(@uri.user).to eq("newuser")
    expect(@uri.password).to eq(nil)
    expect(@uri.to_s).to eq("http://newuser@example.com")
  end

  it "should have the correct password after assignment" do
    @uri.password = "newpass"
    expect(@uri.password).to eq("newpass")
    expect(@uri.to_s).to eq("http://user:newpass@example.com")
  end

  it "should have the correct userinfo segment after assignment" do
    @uri.userinfo = "newuser:newpass"
    expect(@uri.userinfo).to eq("newuser:newpass")
    expect(@uri.user).to eq("newuser")
    expect(@uri.password).to eq("newpass")
    expect(@uri.host).to eq("example.com")
    expect(@uri.port).to eq(nil)
    expect(@uri.inferred_port).to eq(80)
    expect(@uri.to_s).to eq("http://newuser:newpass@example.com")
  end

  it "should have the correct userinfo segment after nil assignment" do
    @uri.userinfo = nil
    expect(@uri.userinfo).to eq(nil)
    expect(@uri.user).to eq(nil)
    expect(@uri.password).to eq(nil)
    expect(@uri.host).to eq("example.com")
    expect(@uri.port).to eq(nil)
    expect(@uri.inferred_port).to eq(80)
    expect(@uri.to_s).to eq("http://example.com")
  end

  it "should have the correct authority segment after assignment" do
    @uri.authority = "newuser@example.com"
    expect(@uri.authority).to eq("newuser@example.com")
    expect(@uri.user).to eq("newuser")
    expect(@uri.password).to eq(nil)
    expect(@uri.host).to eq("example.com")
    expect(@uri.port).to eq(nil)
    expect(@uri.inferred_port).to eq(80)
    expect(@uri.to_s).to eq("http://newuser@example.com")
  end

  it "should raise an error after nil assignment of authority segment" do
    expect do
      # This would create an invalid URI
      @uri.authority = nil
    end.to raise_error(Addressable::URI::InvalidURIError)
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://user:@example.com'" do
  before do
    @uri = Addressable::URI.parse("http://user:@example.com")
  end

  it "should use the 'http' scheme" do
    expect(@uri.scheme).to eq("http")
  end

  it "should have a username of 'user'" do
    expect(@uri.user).to eq("user")
  end

  it "should have a password of ''" do
    expect(@uri.password).to eq("")
  end

  it "should have a normalized userinfo of 'user:'" do
    expect(@uri.normalized_userinfo).to eq("user:")
  end

  it "should have a host of 'example.com'" do
    expect(@uri.host).to eq("example.com")
  end

  it "should use port 80" do
    expect(@uri.inferred_port).to eq(80)
  end

  it "should have the correct username after assignment" do
    @uri.user = "newuser"
    expect(@uri.user).to eq("newuser")
    expect(@uri.password).to eq("")
    expect(@uri.to_s).to eq("http://newuser:@example.com")
  end

  it "should have the correct password after assignment" do
    @uri.password = "newpass"
    expect(@uri.password).to eq("newpass")
    expect(@uri.to_s).to eq("http://user:newpass@example.com")
  end

  it "should have the correct authority segment after assignment" do
    @uri.authority = "newuser:@example.com"
    expect(@uri.authority).to eq("newuser:@example.com")
    expect(@uri.user).to eq("newuser")
    expect(@uri.password).to eq("")
    expect(@uri.host).to eq("example.com")
    expect(@uri.port).to eq(nil)
    expect(@uri.inferred_port).to eq(80)
    expect(@uri.to_s).to eq("http://newuser:@example.com")
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://:pass@example.com'" do
  before do
    @uri = Addressable::URI.parse("http://:pass@example.com")
  end

  it "should use the 'http' scheme" do
    expect(@uri.scheme).to eq("http")
  end

  it "should have a username of ''" do
    expect(@uri.user).to eq("")
  end

  it "should have a password of 'pass'" do
    expect(@uri.password).to eq("pass")
  end

  it "should have a userinfo of ':pass'" do
    expect(@uri.userinfo).to eq(":pass")
  end

  it "should have a normalized userinfo of ':pass'" do
    expect(@uri.normalized_userinfo).to eq(":pass")
  end

  it "should have a host of 'example.com'" do
    expect(@uri.host).to eq("example.com")
  end

  it "should use port 80" do
    expect(@uri.inferred_port).to eq(80)
  end

  it "should have the correct username after assignment" do
    @uri.user = "newuser"
    expect(@uri.user).to eq("newuser")
    expect(@uri.password).to eq("pass")
    expect(@uri.to_s).to eq("http://newuser:pass@example.com")
  end

  it "should have the correct password after assignment" do
    @uri.password = "newpass"
    expect(@uri.password).to eq("newpass")
    expect(@uri.user).to eq("")
    expect(@uri.to_s).to eq("http://:newpass@example.com")
  end

  it "should have the correct authority segment after assignment" do
    @uri.authority = ":newpass@example.com"
    expect(@uri.authority).to eq(":newpass@example.com")
    expect(@uri.user).to eq("")
    expect(@uri.password).to eq("newpass")
    expect(@uri.host).to eq("example.com")
    expect(@uri.port).to eq(nil)
    expect(@uri.inferred_port).to eq(80)
    expect(@uri.to_s).to eq("http://:newpass@example.com")
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://:@example.com'" do
  before do
    @uri = Addressable::URI.parse("http://:@example.com")
  end

  it "should use the 'http' scheme" do
    expect(@uri.scheme).to eq("http")
  end

  it "should have a username of ''" do
    expect(@uri.user).to eq("")
  end

  it "should have a password of ''" do
    expect(@uri.password).to eq("")
  end

  it "should have a normalized userinfo of nil" do
    expect(@uri.normalized_userinfo).to eq(nil)
  end

  it "should have a host of 'example.com'" do
    expect(@uri.host).to eq("example.com")
  end

  it "should use port 80" do
    expect(@uri.inferred_port).to eq(80)
  end

  it "should have the correct username after assignment" do
    @uri.user = "newuser"
    expect(@uri.user).to eq("newuser")
    expect(@uri.password).to eq("")
    expect(@uri.to_s).to eq("http://newuser:@example.com")
  end

  it "should have the correct password after assignment" do
    @uri.password = "newpass"
    expect(@uri.password).to eq("newpass")
    expect(@uri.user).to eq("")
    expect(@uri.to_s).to eq("http://:newpass@example.com")
  end

  it "should have the correct authority segment after assignment" do
    @uri.authority = ":@newexample.com"
    expect(@uri.authority).to eq(":@newexample.com")
    expect(@uri.user).to eq("")
    expect(@uri.password).to eq("")
    expect(@uri.host).to eq("newexample.com")
    expect(@uri.port).to eq(nil)
    expect(@uri.inferred_port).to eq(80)
    expect(@uri.to_s).to eq("http://:@newexample.com")
  end
end

describe Addressable::URI, "when parsed from " +
    "'#example'" do
  before do
    @uri = Addressable::URI.parse("#example")
  end

  it "should be considered relative" do
    expect(@uri).to be_relative
  end

  it "should have a host of nil" do
    expect(@uri.host).to eq(nil)
  end

  it "should have a site of nil" do
    expect(@uri.site).to eq(nil)
  end

  it "should have a normalized_site of nil" do
    expect(@uri.normalized_site).to eq(nil)
  end

  it "should have a path of ''" do
    expect(@uri.path).to eq("")
  end

  it "should have a query string of nil" do
    expect(@uri.query).to eq(nil)
  end

  it "should have a fragment of 'example'" do
    expect(@uri.fragment).to eq("example")
  end
end

describe Addressable::URI, "when parsed from " +
    "the network-path reference '//example.com/'" do
  before do
    @uri = Addressable::URI.parse("//example.com/")
  end

  it "should be considered relative" do
    expect(@uri).to be_relative
  end

  it "should have a host of 'example.com'" do
    expect(@uri.host).to eq("example.com")
  end

  it "should have a path of '/'" do
    expect(@uri.path).to eq("/")
  end

  it "should raise an error if routing is attempted" do
    expect do
      @uri.route_to("http://example.com/")
    end.to raise_error(ArgumentError, /\/\/example.com\//)
    expect do
      @uri.route_from("http://example.com/")
    end.to raise_error(ArgumentError, /\/\/example.com\//)
  end

  it "should have a 'null' origin" do
    expect(@uri.origin).to eq('null')
  end
end

describe Addressable::URI, "when parsed from " +
    "'feed://http://example.com/'" do
  before do
    @uri = Addressable::URI.parse("feed://http://example.com/")
  end

  it "should have a host of 'http'" do
    expect(@uri.host).to eq("http")
  end

  it "should have a path of '//example.com/'" do
    expect(@uri.path).to eq("//example.com/")
  end
end

describe Addressable::URI, "when parsed from " +
    "'feed:http://example.com/'" do
  before do
    @uri = Addressable::URI.parse("feed:http://example.com/")
  end

  it "should have a path of 'http://example.com/'" do
    expect(@uri.path).to eq("http://example.com/")
  end

  it "should normalize to 'http://example.com/'" do
    expect(@uri.normalize.to_s).to eq("http://example.com/")
    expect(@uri.normalize!.to_s).to eq("http://example.com/")
  end

  it "should have a 'null' origin" do
    expect(@uri.origin).to eq('null')
  end
end

describe Addressable::URI, "when parsed from " +
    "'example://a/b/c/%7Bfoo%7D'" do
  before do
    @uri = Addressable::URI.parse("example://a/b/c/%7Bfoo%7D")
  end

  # Section 6.2.2 of RFC 3986
  it "should be equivalent to eXAMPLE://a/./b/../b/%63/%7bfoo%7d" do
    expect(@uri).to eq(
      Addressable::URI.parse("eXAMPLE://a/./b/../b/%63/%7bfoo%7d")
    )
  end

  it "should have an origin of 'example://a'" do
    expect(@uri.origin).to eq('example://a')
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://example.com/indirect/path/./to/../resource/'" do
  before do
    @uri = Addressable::URI.parse(
      "http://example.com/indirect/path/./to/../resource/")
  end

  it "should use the 'http' scheme" do
    expect(@uri.scheme).to eq("http")
  end

  it "should have a host of 'example.com'" do
    expect(@uri.host).to eq("example.com")
  end

  it "should use port 80" do
    expect(@uri.inferred_port).to eq(80)
  end

  it "should have a path of '/indirect/path/./to/../resource/'" do
    expect(@uri.path).to eq("/indirect/path/./to/../resource/")
  end

  # Section 6.2.2.3 of RFC 3986
  it "should have a normalized path of '/indirect/path/resource/'" do
    expect(@uri.normalize.path).to eq("/indirect/path/resource/")
    expect(@uri.normalize!.path).to eq("/indirect/path/resource/")
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://under_score.example.com/'" do
  it "should not cause an error" do
    expect do
      Addressable::URI.parse("http://under_score.example.com/")
    end.not_to raise_error
  end
end

describe Addressable::URI, "when parsed from " +
    "'./this:that'" do
  before do
    @uri = Addressable::URI.parse("./this:that")
  end

  it "should be considered relative" do
    expect(@uri).to be_relative
  end

  it "should have no scheme" do
    expect(@uri.scheme).to eq(nil)
  end

  it "should have a 'null' origin" do
    expect(@uri.origin).to eq('null')
  end
end

describe Addressable::URI, "when parsed from " +
    "'this:that'" do
  before do
    @uri = Addressable::URI.parse("this:that")
  end

  it "should be considered absolute" do
    expect(@uri).to be_absolute
  end

  it "should have a scheme of 'this'" do
    expect(@uri.scheme).to eq("this")
  end

  it "should have a 'null' origin" do
    expect(@uri.origin).to eq('null')
  end
end

describe Addressable::URI, "when parsed from '?'" do
  before do
    @uri = Addressable::URI.parse("?")
  end

  it "should normalize to ''" do
    expect(@uri.normalize.to_s).to eq("")
  end

  it "should have the correct return type" do
    expect(@uri.query_values).to eq({})
    expect(@uri.query_values(Hash)).to eq({})
    expect(@uri.query_values(Array)).to eq([])
  end

  it "should have a 'null' origin" do
    expect(@uri.origin).to eq('null')
  end
end

describe Addressable::URI, "when parsed from '?one=1&two=2&three=3'" do
  before do
    @uri = Addressable::URI.parse("?one=1&two=2&three=3")
  end

  it "should have the correct query values" do
    expect(@uri.query_values).to eq({"one" => "1", "two" => "2", "three" => "3"})
  end

  it "should raise an error for invalid return type values" do
    expect do
      @uri.query_values(Integer)
    end.to raise_error(ArgumentError)
  end

  it "should have the correct array query values" do
    expect(@uri.query_values(Array)).to eq([
      ["one", "1"], ["two", "2"], ["three", "3"]
    ])
  end

  it "should have a 'null' origin" do
    expect(@uri.origin).to eq('null')
  end
end

describe Addressable::URI, "when parsed from '?one=1=uno&two=2=dos'" do
  before do
    @uri = Addressable::URI.parse("?one=1=uno&two=2=dos")
  end

  it "should have the correct query values" do
    expect(@uri.query_values).to eq({"one" => "1=uno", "two" => "2=dos"})
  end

  it "should have the correct array query values" do
    expect(@uri.query_values(Array)).to eq([
      ["one", "1=uno"], ["two", "2=dos"]
    ])
  end
end

describe Addressable::URI, "when parsed from '?one[two][three]=four'" do
  before do
    @uri = Addressable::URI.parse("?one[two][three]=four")
  end

  it "should have the correct query values" do
    expect(@uri.query_values).to eq({"one[two][three]" => "four"})
  end

  it "should have the correct array query values" do
    expect(@uri.query_values(Array)).to eq([
      ["one[two][three]", "four"]
    ])
  end
end

describe Addressable::URI, "when parsed from '?one.two.three=four'" do
  before do
    @uri = Addressable::URI.parse("?one.two.three=four")
  end

  it "should have the correct query values" do
    expect(@uri.query_values).to eq({
      "one.two.three" => "four"
    })
  end

  it "should have the correct array query values" do
    expect(@uri.query_values(Array)).to eq([
      ["one.two.three", "four"]
    ])
  end
end

describe Addressable::URI, "when parsed from " +
    "'?one[two][three]=four&one[two][five]=six'" do
  before do
    @uri = Addressable::URI.parse("?one[two][three]=four&one[two][five]=six")
  end

  it "should have the correct query values" do
    expect(@uri.query_values).to eq({
      "one[two][three]" => "four", "one[two][five]" => "six"
    })
  end

  it "should have the correct array query values" do
    expect(@uri.query_values(Array)).to eq([
      ["one[two][three]", "four"], ["one[two][five]", "six"]
    ])
  end
end

describe Addressable::URI, "when parsed from " +
    "'?one.two.three=four&one.two.five=six'" do
  before do
    @uri = Addressable::URI.parse("?one.two.three=four&one.two.five=six")
  end

  it "should have the correct query values" do
    expect(@uri.query_values).to eq({
      "one.two.three" => "four", "one.two.five" => "six"
    })
  end

  it "should have the correct array query values" do
    expect(@uri.query_values(Array)).to eq([
      ["one.two.three", "four"], ["one.two.five", "six"]
    ])
  end
end

describe Addressable::URI, "when parsed from " +
    "'?one=two&one=three'" do
  before do
    @uri = Addressable::URI.parse(
      "?one=two&one=three&one=four"
    )
  end

  it "should have correct array query values" do
    expect(@uri.query_values(Array)).to eq(
      [['one', 'two'], ['one', 'three'], ['one', 'four']]
    )
  end

  it "should have correct hash query values" do
    skip("This is probably more desirable behavior.")
    expect(@uri.query_values(Hash)).to eq(
      {'one' => ['two', 'three', 'four']}
      )
  end

  it "should handle assignment with keys of mixed type" do
    @uri.query_values = @uri.query_values(Hash).merge({:one => 'three'})
    expect(@uri.query_values(Hash)).to eq({'one' => 'three'})
  end
end

describe Addressable::URI, "when parsed from " +
    "'?one[two][three][]=four&one[two][three][]=five'" do
  before do
    @uri = Addressable::URI.parse(
      "?one[two][three][]=four&one[two][three][]=five"
    )
  end

  it "should have correct query values" do
    expect(@uri.query_values(Hash)).to eq({"one[two][three][]" => "five"})
  end

  it "should have correct array query values" do
    expect(@uri.query_values(Array)).to eq([
      ["one[two][three][]", "four"], ["one[two][three][]", "five"]
    ])
  end
end

describe Addressable::URI, "when parsed from " +
    "'?one[two][three][0]=four&one[two][three][1]=five'" do
  before do
    @uri = Addressable::URI.parse(
      "?one[two][three][0]=four&one[two][three][1]=five"
    )
  end

  it "should have the correct query values" do
    expect(@uri.query_values).to eq({
      "one[two][three][0]" => "four", "one[two][three][1]" => "five"
    })
  end
end

describe Addressable::URI, "when parsed from " +
    "'?one[two][three][1]=four&one[two][three][0]=five'" do
  before do
    @uri = Addressable::URI.parse(
      "?one[two][three][1]=four&one[two][three][0]=five"
    )
  end

  it "should have the correct query values" do
    expect(@uri.query_values).to eq({
      "one[two][three][1]" => "four", "one[two][three][0]" => "five"
    })
  end
end

describe Addressable::URI, "when parsed from " +
    "'?one[two][three][2]=four&one[two][three][1]=five'" do
  before do
    @uri = Addressable::URI.parse(
      "?one[two][three][2]=four&one[two][three][1]=five"
    )
  end

  it "should have the correct query values" do
    expect(@uri.query_values).to eq({
      "one[two][three][2]" => "four", "one[two][three][1]" => "five"
    })
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://www.詹姆斯.com/'" do
  before do
    @uri = Addressable::URI.parse("http://www.詹姆斯.com/")
  end

  it "should be equivalent to 'http://www.xn--8ws00zhy3a.com/'" do
    expect(@uri).to eq(
      Addressable::URI.parse("http://www.xn--8ws00zhy3a.com/")
    )
  end

  it "should not have domain name encoded during normalization" do
    expect(Addressable::URI.normalized_encode(@uri.to_s)).to eq(
      "http://www.詹姆斯.com/"
    )
  end

  it "should have an origin of 'http://www.xn--8ws00zhy3a.com'" do
    expect(@uri.origin).to eq('http://www.xn--8ws00zhy3a.com')
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://www.詹姆斯.com/ some spaces /'" do
  before do
    @uri = Addressable::URI.parse("http://www.詹姆斯.com/ some spaces /")
  end

  it "should be equivalent to " +
      "'http://www.xn--8ws00zhy3a.com/%20some%20spaces%20/'" do
    expect(@uri).to eq(
      Addressable::URI.parse(
        "http://www.xn--8ws00zhy3a.com/%20some%20spaces%20/")
    )
  end

  it "should not have domain name encoded during normalization" do
    expect(Addressable::URI.normalized_encode(@uri.to_s)).to eq(
      "http://www.詹姆斯.com/%20some%20spaces%20/"
    )
  end

  it "should have an origin of 'http://www.xn--8ws00zhy3a.com'" do
    expect(@uri.origin).to eq('http://www.xn--8ws00zhy3a.com')
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://www.xn--8ws00zhy3a.com/'" do
  before do
    @uri = Addressable::URI.parse("http://www.xn--8ws00zhy3a.com/")
  end

  it "should be displayed as http://www.詹姆斯.com/" do
    expect(@uri.display_uri.to_s).to eq("http://www.詹姆斯.com/")
  end

  it "should properly force the encoding" do
    display_string = @uri.display_uri.to_str
    expect(display_string).to eq("http://www.詹姆斯.com/")
    if display_string.respond_to?(:encoding)
      expect(display_string.encoding.to_s).to eq(Encoding::UTF_8.to_s)
    end
  end

  it "should have an origin of 'http://www.xn--8ws00zhy3a.com'" do
    expect(@uri.origin).to eq('http://www.xn--8ws00zhy3a.com')
  end
end

describe Addressable::URI, "when parsed from " +
    "'http://www.詹姆斯.com/atomtests/iri/詹.html'" do
  before do
    @uri = Addressable::URI.parse("http://www.詹姆斯.com/atomtests/iri/詹.html")
  end

  it "should normalize to " +
      "http://www.xn--8ws00zhy3a.com/atomtests/iri/%E8%A9%B9.html" do
    expect(@uri.normalize.to_s).to eq(
      "http://www.xn--8ws00zhy3a.com/atomtests/iri/%E8%A9%B9.html"
    )
    expect(@uri.normalize!.to_s).to eq(
      "http://www.xn--8ws00zhy3a.com/atomtests/iri/%E8%A9%B9.html"
    )
  end
end

describe Addressable::URI, "when parsed from a percent-encoded IRI" do
  before do
    @uri = Addressable::URI.parse(
      "http://www.%E3%81%BB%E3%82%93%E3%81%A8%E3%81%86%E3%81%AB%E3%81%AA" +
      "%E3%81%8C%E3%81%84%E3%82%8F%E3%81%91%E3%81%AE%E3%82%8F%E3%81%8B%E3" +
      "%82%89%E3%81%AA%E3%81%84%E3%81%A9%E3%82%81%E3%81%84%E3%82%93%E3%82" +
      "%81%E3%81%84%E3%81%AE%E3%82%89%E3%81%B9%E3%82%8B%E3%81%BE%E3%81%A0" +
      "%E3%81%AA%E3%81%8C%E3%81%8F%E3%81%97%E3%81%AA%E3%81%84%E3%81%A8%E3" +
      "%81%9F%E3%82%8A%E3%81%AA%E3%81%84.w3.mag.keio.ac.jp"
    )
  end

  it "should normalize to something sane" do
    expect(@uri.normalize.to_s).to eq(
      "http://www.xn--n8jaaaaai5bhf7as8fsfk3jnknefdde3f" +
      "g11amb5gzdb4wi9bya3kc6lra.w3.mag.keio.ac.jp/"
    )
    expect(@uri.normalize!.to_s).to eq(
      "http://www.xn--n8jaaaaai5bhf7as8fsfk3jnknefdde3f" +
      "g11amb5gzdb4wi9bya3kc6lra.w3.mag.keio.ac.jp/"
    )
  end

  it "should have the correct origin" do
    expect(@uri.origin).to eq(
      "http://www.xn--n8jaaaaai5bhf7as8fsfk3jnknefdde3f" +
      "g11amb5gzdb4wi9bya3kc6lra.w3.mag.keio.ac.jp"
    )
  end
end

describe Addressable::URI, "with a base uri of 'http://a/b/c/d;p?q'" do
  before do
    @uri = Addressable::URI.parse("http://a/b/c/d;p?q")
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with 'g:h' should resolve to g:h" do
    expect((@uri + "g:h").to_s).to eq("g:h")
    expect(Addressable::URI.join(@uri, "g:h").to_s).to eq("g:h")
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with 'g' should resolve to http://a/b/c/g" do
    expect((@uri + "g").to_s).to eq("http://a/b/c/g")
    expect(Addressable::URI.join(@uri.to_s, "g").to_s).to eq("http://a/b/c/g")
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with './g' should resolve to http://a/b/c/g" do
    expect((@uri + "./g").to_s).to eq("http://a/b/c/g")
    expect(Addressable::URI.join(@uri.to_s, "./g").to_s).to eq("http://a/b/c/g")
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with 'g/' should resolve to http://a/b/c/g/" do
    expect((@uri + "g/").to_s).to eq("http://a/b/c/g/")
    expect(Addressable::URI.join(@uri.to_s, "g/").to_s).to eq("http://a/b/c/g/")
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with '/g' should resolve to http://a/g" do
    expect((@uri + "/g").to_s).to eq("http://a/g")
    expect(Addressable::URI.join(@uri.to_s, "/g").to_s).to eq("http://a/g")
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with '//g' should resolve to http://g" do
    expect((@uri + "//g").to_s).to eq("http://g")
    expect(Addressable::URI.join(@uri.to_s, "//g").to_s).to eq("http://g")
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with '?y' should resolve to http://a/b/c/d;p?y" do
    expect((@uri + "?y").to_s).to eq("http://a/b/c/d;p?y")
    expect(Addressable::URI.join(@uri.to_s, "?y").to_s).to eq("http://a/b/c/d;p?y")
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with 'g?y' should resolve to http://a/b/c/g?y" do
    expect((@uri + "g?y").to_s).to eq("http://a/b/c/g?y")
    expect(Addressable::URI.join(@uri.to_s, "g?y").to_s).to eq("http://a/b/c/g?y")
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with '#s' should resolve to http://a/b/c/d;p?q#s" do
    expect((@uri + "#s").to_s).to eq("http://a/b/c/d;p?q#s")
    expect(Addressable::URI.join(@uri.to_s, "#s").to_s).to eq(
      "http://a/b/c/d;p?q#s"
    )
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with 'g#s' should resolve to http://a/b/c/g#s" do
    expect((@uri + "g#s").to_s).to eq("http://a/b/c/g#s")
    expect(Addressable::URI.join(@uri.to_s, "g#s").to_s).to eq("http://a/b/c/g#s")
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with 'g?y#s' should resolve to http://a/b/c/g?y#s" do
    expect((@uri + "g?y#s").to_s).to eq("http://a/b/c/g?y#s")
    expect(Addressable::URI.join(
      @uri.to_s, "g?y#s").to_s).to eq("http://a/b/c/g?y#s")
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with ';x' should resolve to http://a/b/c/;x" do
    expect((@uri + ";x").to_s).to eq("http://a/b/c/;x")
    expect(Addressable::URI.join(@uri.to_s, ";x").to_s).to eq("http://a/b/c/;x")
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with 'g;x' should resolve to http://a/b/c/g;x" do
    expect((@uri + "g;x").to_s).to eq("http://a/b/c/g;x")
    expect(Addressable::URI.join(@uri.to_s, "g;x").to_s).to eq("http://a/b/c/g;x")
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with 'g;x?y#s' should resolve to http://a/b/c/g;x?y#s" do
    expect((@uri + "g;x?y#s").to_s).to eq("http://a/b/c/g;x?y#s")
    expect(Addressable::URI.join(
      @uri.to_s, "g;x?y#s").to_s).to eq("http://a/b/c/g;x?y#s")
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with '' should resolve to http://a/b/c/d;p?q" do
    expect((@uri + "").to_s).to eq("http://a/b/c/d;p?q")
    expect(Addressable::URI.join(@uri.to_s, "").to_s).to eq("http://a/b/c/d;p?q")
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with '.' should resolve to http://a/b/c/" do
    expect((@uri + ".").to_s).to eq("http://a/b/c/")
    expect(Addressable::URI.join(@uri.to_s, ".").to_s).to eq("http://a/b/c/")
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with './' should resolve to http://a/b/c/" do
    expect((@uri + "./").to_s).to eq("http://a/b/c/")
    expect(Addressable::URI.join(@uri.to_s, "./").to_s).to eq("http://a/b/c/")
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with '..' should resolve to http://a/b/" do
    expect((@uri + "..").to_s).to eq("http://a/b/")
    expect(Addressable::URI.join(@uri.to_s, "..").to_s).to eq("http://a/b/")
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with '../' should resolve to http://a/b/" do
    expect((@uri + "../").to_s).to eq("http://a/b/")
    expect(Addressable::URI.join(@uri.to_s, "../").to_s).to eq("http://a/b/")
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with '../g' should resolve to http://a/b/g" do
    expect((@uri + "../g").to_s).to eq("http://a/b/g")
    expect(Addressable::URI.join(@uri.to_s, "../g").to_s).to eq("http://a/b/g")
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with '../..' should resolve to http://a/" do
    expect((@uri + "../..").to_s).to eq("http://a/")
    expect(Addressable::URI.join(@uri.to_s, "../..").to_s).to eq("http://a/")
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with '../../' should resolve to http://a/" do
    expect((@uri + "../../").to_s).to eq("http://a/")
    expect(Addressable::URI.join(@uri.to_s, "../../").to_s).to eq("http://a/")
  end

  # Section 5.4.1 of RFC 3986
  it "when joined with '../../g' should resolve to http://a/g" do
    expect((@uri + "../../g").to_s).to eq("http://a/g")
    expect(Addressable::URI.join(@uri.to_s, "../../g").to_s).to eq("http://a/g")
  end

  # Section 5.4.2 of RFC 3986
  it "when joined with '../../../g' should resolve to http://a/g" do
    expect((@uri + "../../../g").to_s).to eq("http://a/g")
    expect(Addressable::URI.join(@uri.to_s, "../../../g").to_s).to eq("http://a/g")
  end

  it "when joined with '../.././../g' should resolve to http://a/g" do
    expect((@uri + "../.././../g").to_s).to eq("http://a/g")
    expect(Addressable::URI.join(@uri.to_s, "../.././../g").to_s).to eq(
      "http://a/g"
    )
  end

  # Section 5.4.2 of RFC 3986
  it "when joined with '../../../../g' should resolve to http://a/g" do
    expect((@uri + "../../../../g").to_s).to eq("http://a/g")
    expect(Addressable::URI.join(
      @uri.to_s, "../../../../g").to_s).to eq("http://a/g")
  end

  # Section 5.4.2 of RFC 3986
  it "when joined with '/./g' should resolve to http://a/g" do
    expect((@uri + "/./g").to_s).to eq("http://a/g")
    expect(Addressable::URI.join(@uri.to_s, "/./g").to_s).to eq("http://a/g")
  end

  # Section 5.4.2 of RFC 3986
  it "when joined with '/../g' should resolve to http://a/g" do
    expect((@uri + "/../g").to_s).to eq("http://a/g")
    expect(Addressable::URI.join(@uri.to_s, "/../g").to_s).to eq("http://a/g")
  end

  # Section 5.4.2 of RFC 3986
  it "when joined with 'g.' should resolve to http://a/b/c/g." do
    expect((@uri + "g.").to_s).to eq("http://a/b/c/g.")
    expect(Addressable::URI.join(@uri.to_s, "g.").to_s).to eq("http://a/b/c/g.")
  end

  # Section 5.4.2 of RFC 3986
  it "when joined with '.g' should resolve to http://a/b/c/.g" do
    expect((@uri + ".g").to_s).to eq("http://a/b/c/.g")
    expect(Addressable::URI.join(@uri.to_s, ".g").to_s).to eq("http://a/b/c/.g")
  end

  # Section 5.4.2 of RFC 3986
  it "when joined with 'g..' should resolve to http://a/b/c/g.." do
    expect((@uri + "g..").to_s).to eq("http://a/b/c/g..")
    expect(Addressable::URI.join(@uri.to_s, "g..").to_s).to eq("http://a/b/c/g..")
  end

  # Section 5.4.2 of RFC 3986
  it "when joined with '..g' should resolve to http://a/b/c/..g" do
    expect((@uri + "..g").to_s).to eq("http://a/b/c/..g")
    expect(Addressable::URI.join(@uri.to_s, "..g").to_s).to eq("http://a/b/c/..g")
  end

  # Section 5.4.2 of RFC 3986
  it "when joined with './../g' should resolve to http://a/b/g" do
    expect((@uri + "./../g").to_s).to eq("http://a/b/g")
    expect(Addressable::URI.join(@uri.to_s, "./../g").to_s).to eq("http://a/b/g")
  end

  # Section 5.4.2 of RFC 3986
  it "when joined with './g/.' should resolve to http://a/b/c/g/" do
    expect((@uri + "./g/.").to_s).to eq("http://a/b/c/g/")
    expect(Addressable::URI.join(@uri.to_s, "./g/.").to_s).to eq("http://a/b/c/g/")
  end

  # Section 5.4.2 of RFC 3986
  it "when joined with 'g/./h' should resolve to http://a/b/c/g/h" do
    expect((@uri + "g/./h").to_s).to eq("http://a/b/c/g/h")
    expect(Addressable::URI.join(@uri.to_s, "g/./h").to_s).to eq("http://a/b/c/g/h")
  end

  # Section 5.4.2 of RFC 3986
  it "when joined with 'g/../h' should resolve to http://a/b/c/h" do
    expect((@uri + "g/../h").to_s).to eq("http://a/b/c/h")
    expect(Addressable::URI.join(@uri.to_s, "g/../h").to_s).to eq("http://a/b/c/h")
  end

  # Section 5.4.2 of RFC 3986
  it "when joined with 'g;x=1/./y' " +
      "should resolve to http://a/b/c/g;x=1/y" do
    expect((@uri + "g;x=1/./y").to_s).to eq("http://a/b/c/g;x=1/y")
    expect(Addressable::URI.join(
      @uri.to_s, "g;x=1/./y").to_s).to eq("http://a/b/c/g;x=1/y")
  end

  # Section 5.4.2 of RFC 3986
  it "when joined with 'g;x=1/../y' should resolve to http://a/b/c/y" do
    expect((@uri + "g;x=1/../y").to_s).to eq("http://a/b/c/y")
    expect(Addressable::URI.join(
      @uri.to_s, "g;x=1/../y").to_s).to eq("http://a/b/c/y")
  end

  # Section 5.4.2 of RFC 3986
  it "when joined with 'g?y/./x' " +
      "should resolve to http://a/b/c/g?y/./x" do
    expect((@uri + "g?y/./x").to_s).to eq("http://a/b/c/g?y/./x")
    expect(Addressable::URI.join(
      @uri.to_s, "g?y/./x").to_s).to eq("http://a/b/c/g?y/./x")
  end

  # Section 5.4.2 of RFC 3986
  it "when joined with 'g?y/../x' " +
      "should resolve to http://a/b/c/g?y/../x" do
    expect((@uri + "g?y/../x").to_s).to eq("http://a/b/c/g?y/../x")
    expect(Addressable::URI.join(
      @uri.to_s, "g?y/../x").to_s).to eq("http://a/b/c/g?y/../x")
  end

  # Section 5.4.2 of RFC 3986
  it "when joined with 'g#s/./x' " +
      "should resolve to http://a/b/c/g#s/./x" do
    expect((@uri + "g#s/./x").to_s).to eq("http://a/b/c/g#s/./x")
    expect(Addressable::URI.join(
      @uri.to_s, "g#s/./x").to_s).to eq("http://a/b/c/g#s/./x")
  end

  # Section 5.4.2 of RFC 3986
  it "when joined with 'g#s/../x' " +
      "should resolve to http://a/b/c/g#s/../x" do
    expect((@uri + "g#s/../x").to_s).to eq("http://a/b/c/g#s/../x")
    expect(Addressable::URI.join(
      @uri.to_s, "g#s/../x").to_s).to eq("http://a/b/c/g#s/../x")
  end

  # Section 5.4.2 of RFC 3986
  it "when joined with 'http:g' should resolve to http:g" do
    expect((@uri + "http:g").to_s).to eq("http:g")
    expect(Addressable::URI.join(@uri.to_s, "http:g").to_s).to eq("http:g")
  end

  # Edge case to be sure
  it "when joined with '//example.com/' should " +
      "resolve to http://example.com/" do
    expect((@uri + "//example.com/").to_s).to eq("http://example.com/")
    expect(Addressable::URI.join(
      @uri.to_s, "//example.com/").to_s).to eq("http://example.com/")
  end

  it "when joined with a bogus object a TypeError should be raised" do
    expect do
      Addressable::URI.join(@uri, 42)
    end.to raise_error(TypeError)
  end
end

describe Addressable::URI, "when converting the path " +
    "'relative/path/to/something'" do
  before do
    @path = 'relative/path/to/something'
  end

  it "should convert to " +
      "\'relative/path/to/something\'" do
    @uri = Addressable::URI.convert_path(@path)
    expect(@uri.to_str).to eq("relative/path/to/something")
  end

  it "should join with an absolute file path correctly" do
    @base = Addressable::URI.convert_path("/absolute/path/")
    @uri = Addressable::URI.convert_path(@path)
    expect((@base + @uri).to_str).to eq(
      "file:///absolute/path/relative/path/to/something"
    )
  end
end

describe Addressable::URI, "when converting a bogus path" do
  it "should raise a TypeError" do
    expect do
      Addressable::URI.convert_path(42)
    end.to raise_error(TypeError)
  end
end

describe Addressable::URI, "when given a UNIX root directory" do
  before do
    @path = "/"
  end

  it "should convert to \'file:///\'" do
    @uri = Addressable::URI.convert_path(@path)
    expect(@uri.to_str).to eq("file:///")
  end

  it "should have an origin of 'file://'" do
    @uri = Addressable::URI.convert_path(@path)
    expect(@uri.origin).to eq('file://')
  end
end

describe Addressable::URI, "when given a Windows root directory" do
  before do
    @path = "C:\\"
  end

  it "should convert to \'file:///c:/\'" do
    @uri = Addressable::URI.convert_path(@path)
    expect(@uri.to_str).to eq("file:///c:/")
  end

  it "should have an origin of 'file://'" do
    @uri = Addressable::URI.convert_path(@path)
    expect(@uri.origin).to eq('file://')
  end
end

describe Addressable::URI, "when given the path '/one/two/'" do
  before do
    @path = '/one/two/'
  end

  it "should convert to " +
      "\'file:///one/two/\'" do
    @uri = Addressable::URI.convert_path(@path)
    expect(@uri.to_str).to eq("file:///one/two/")
  end

  it "should have an origin of 'file://'" do
    @uri = Addressable::URI.convert_path(@path)
    expect(@uri.origin).to eq('file://')
  end
end

describe Addressable::URI, "when given the tld " do
  it "'uk' should have a tld of 'uk'" do
    uri = Addressable::URI.parse("http://example.com")
    uri.tld = "uk"

    expect(uri.tld).to eq("uk")
  end

  context "which " do
    let (:uri) { Addressable::URI.parse("http://www.comrade.net/path/to/source/") }

    it "contains a subdomain" do
      uri.tld = "co.uk"

      expect(uri.to_s).to eq("http://www.comrade.co.uk/path/to/source/")
    end

    it "is part of the domain" do
      uri.tld = "com"

      expect(uri.to_s).to eq("http://www.comrade.com/path/to/source/")
    end
  end
end

describe Addressable::URI, "when given the path " +
    "'c:\\windows\\My Documents 100%20\\foo.txt'" do
  before do
    @path = "c:\\windows\\My Documents 100%20\\foo.txt"
  end

  it "should convert to " +
      "\'file:///c:/windows/My%20Documents%20100%20/foo.txt\'" do
    @uri = Addressable::URI.convert_path(@path)
    expect(@uri.to_str).to eq("file:///c:/windows/My%20Documents%20100%20/foo.txt")
  end

  it "should have an origin of 'file://'" do
    @uri = Addressable::URI.convert_path(@path)
    expect(@uri.origin).to eq('file://')
  end
end

describe Addressable::URI, "when given the path " +
    "'file://c:\\windows\\My Documents 100%20\\foo.txt'" do
  before do
    @path = "file://c:\\windows\\My Documents 100%20\\foo.txt"
  end

  it "should convert to " +
      "\'file:///c:/windows/My%20Documents%20100%20/foo.txt\'" do
    @uri = Addressable::URI.convert_path(@path)
    expect(@uri.to_str).to eq("file:///c:/windows/My%20Documents%20100%20/foo.txt")
  end

  it "should have an origin of 'file://'" do
    @uri = Addressable::URI.convert_path(@path)
    expect(@uri.origin).to eq('file://')
  end
end

describe Addressable::URI, "when given the path " +
    "'file:c:\\windows\\My Documents 100%20\\foo.txt'" do
  before do
    @path = "file:c:\\windows\\My Documents 100%20\\foo.txt"
  end

  it "should convert to " +
      "\'file:///c:/windows/My%20Documents%20100%20/foo.txt\'" do
    @uri = Addressable::URI.convert_path(@path)
    expect(@uri.to_str).to eq("file:///c:/windows/My%20Documents%20100%20/foo.txt")
  end

  it "should have an origin of 'file://'" do
    @uri = Addressable::URI.convert_path(@path)
    expect(@uri.origin).to eq('file://')
  end
end

describe Addressable::URI, "when given the path " +
    "'file:/c:\\windows\\My Documents 100%20\\foo.txt'" do
  before do
    @path = "file:/c:\\windows\\My Documents 100%20\\foo.txt"
  end

  it "should convert to " +
      "\'file:///c:/windows/My%20Documents%20100%20/foo.txt\'" do
    @uri = Addressable::URI.convert_path(@path)
    expect(@uri.to_str).to eq("file:///c:/windows/My%20Documents%20100%20/foo.txt")
  end

  it "should have an origin of 'file://'" do
    @uri = Addressable::URI.convert_path(@path)
    expect(@uri.origin).to eq('file://')
  end
end

describe Addressable::URI, "when given the path " +
    "'file:///c|/windows/My%20Documents%20100%20/foo.txt'" do
  before do
    @path = "file:///c|/windows/My%20Documents%20100%20/foo.txt"
  end

  it "should convert to " +
      "\'file:///c:/windows/My%20Documents%20100%20/foo.txt\'" do
    @uri = Addressable::URI.convert_path(@path)
    expect(@uri.to_str).to eq("file:///c:/windows/My%20Documents%20100%20/foo.txt")
  end

  it "should have an origin of 'file://'" do
    @uri = Addressable::URI.convert_path(@path)
    expect(@uri.origin).to eq('file://')
  end
end

describe Addressable::URI, "when given an http protocol URI" do
  before do
    @path = "http://example.com/"
  end

  it "should not do any conversion at all" do
    @uri = Addressable::URI.convert_path(@path)
    expect(@uri.to_str).to eq("http://example.com/")
  end
end

class SuperString
  def initialize(string)
    @string = string.to_s
  end

  def to_str
    return @string
  end
end

describe Addressable::URI, "when parsing a non-String object" do
  it "should correctly parse anything with a 'to_str' method" do
    Addressable::URI.parse(SuperString.new(42))
  end

  it "should raise a TypeError for objects than cannot be converted" do
    expect do
      Addressable::URI.parse(42)
    end.to raise_error(TypeError)
  end

  it "should correctly parse heuristically anything with a 'to_str' method" do
    Addressable::URI.heuristic_parse(SuperString.new(42))
  end

  it "should raise a TypeError for objects than cannot be converted" do
    expect do
      Addressable::URI.heuristic_parse(42)
    end.to raise_error(TypeError)
  end
end

describe Addressable::URI, "when form encoding a hash" do
  it "should result in correct percent encoded sequence" do
    expect(Addressable::URI.form_encode(
      [["&one", "/1"], ["=two", "?2"], [":three", "#3"]]
    )).to eq("%26one=%2F1&%3Dtwo=%3F2&%3Athree=%233")
  end

  it "should result in correct percent encoded sequence" do
    expect(Addressable::URI.form_encode(
      {"q" => "one two three"}
    )).to eq("q=one+two+three")
  end

  it "should result in correct percent encoded sequence" do
    expect(Addressable::URI.form_encode(
      {"key" => nil}
    )).to eq("key=")
  end

  it "should result in correct percent encoded sequence" do
    expect(Addressable::URI.form_encode(
      {"q" => ["one", "two", "three"]}
    )).to eq("q=one&q=two&q=three")
  end

  it "should result in correctly encoded newlines" do
    expect(Addressable::URI.form_encode(
      {"text" => "one\ntwo\rthree\r\nfour\n\r"}
    )).to eq("text=one%0D%0Atwo%0D%0Athree%0D%0Afour%0D%0A%0D%0A")
  end

  it "should result in a sorted percent encoded sequence" do
    expect(Addressable::URI.form_encode(
      [["a", "1"], ["dup", "3"], ["dup", "2"]], true
    )).to eq("a=1&dup=2&dup=3")
  end
end

describe Addressable::URI, "when form encoding a non-Array object" do
  it "should raise a TypeError for objects than cannot be converted" do
    expect do
      Addressable::URI.form_encode(42)
    end.to raise_error(TypeError)
  end
end

# See https://tools.ietf.org/html/rfc6749#appendix-B
describe Addressable::URI, "when form encoding the example value from OAuth 2" do
  it "should result in correct values" do
    expect(Addressable::URI.form_encode(
      {"value" => " %&+£€"}
    )).to eq("value=+%25%26%2B%C2%A3%E2%82%AC")
  end
end

# See https://tools.ietf.org/html/rfc6749#appendix-B
describe Addressable::URI, "when form unencoding the example value from OAuth 2" do
  it "should result in correct values" do
    expect(Addressable::URI.form_unencode(
      "value=+%25%26%2B%C2%A3%E2%82%AC"
    )).to eq([["value", " %&+£€"]])
  end
end

describe Addressable::URI, "when form unencoding a string" do
  it "should result in correct values" do
    expect(Addressable::URI.form_unencode(
      "%26one=%2F1&%3Dtwo=%3F2&%3Athree=%233"
    )).to eq([["&one", "/1"], ["=two", "?2"], [":three", "#3"]])
  end

  it "should result in correct values" do
    expect(Addressable::URI.form_unencode(
      "q=one+two+three"
    )).to eq([["q", "one two three"]])
  end

  it "should result in correct values" do
    expect(Addressable::URI.form_unencode(
      "text=one%0D%0Atwo%0D%0Athree%0D%0Afour%0D%0A%0D%0A"
    )).to eq([["text", "one\ntwo\nthree\nfour\n\n"]])
  end

  it "should result in correct values" do
    expect(Addressable::URI.form_unencode(
      "a=1&dup=2&dup=3"
    )).to eq([["a", "1"], ["dup", "2"], ["dup", "3"]])
  end

  it "should result in correct values" do
    expect(Addressable::URI.form_unencode(
      "key"
    )).to eq([["key", nil]])
  end

  it "should result in correct values" do
    expect(Addressable::URI.form_unencode("GivenName=Ren%C3%A9")).to eq(
      [["GivenName", "René"]]
    )
  end
end

describe Addressable::URI, "when form unencoding a non-String object" do
  it "should correctly parse anything with a 'to_str' method" do
    Addressable::URI.form_unencode(SuperString.new(42))
  end

  it "should raise a TypeError for objects than cannot be converted" do
    expect do
      Addressable::URI.form_unencode(42)
    end.to raise_error(TypeError)
  end
end

describe Addressable::URI, "when normalizing a non-String object" do
  it "should correctly parse anything with a 'to_str' method" do
    Addressable::URI.normalize_component(SuperString.new(42))
  end

  it "should raise a TypeError for objects than cannot be converted" do
    expect do
      Addressable::URI.normalize_component(42)
    end.to raise_error(TypeError)
  end

  it "should raise a TypeError for objects than cannot be converted" do
    expect do
      Addressable::URI.normalize_component("component", 42)
    end.to raise_error(TypeError)
  end
end

describe Addressable::URI, "when normalizing a path with an encoded slash" do
  it "should result in correct percent encoded sequence" do
    expect(Addressable::URI.parse("/path%2Fsegment/").normalize.path).to eq(
      "/path%2Fsegment/"
    )
  end
end

describe Addressable::URI, "when normalizing a path with special unicode" do
  it "does not stop at or ignore null bytes" do
    expect(Addressable::URI.parse("/path%00segment/").normalize.path).to eq(
      "/path%00segment/"
    )
  end

  it "does apply NFC unicode normalization" do
    expect(Addressable::URI.parse("/%E2%84%A6").normalize.path).to eq(
      "/%CE%A9"
    )
  end

  it "does not apply NFKC unicode normalization" do
    expect(Addressable::URI.parse("/%C2%AF%C2%A0").normalize.path).to eq(
      "/%C2%AF%C2%A0"
    )
  end
end

describe Addressable::URI, "when normalizing a partially encoded string" do
  it "should result in correct percent encoded sequence" do
    expect(Addressable::URI.normalize_component(
      "partially % encoded%21"
    )).to eq("partially%20%25%20encoded!")
  end

  it "should result in correct percent encoded sequence" do
    expect(Addressable::URI.normalize_component(
      "partially %25 encoded!"
    )).to eq("partially%20%25%20encoded!")
  end
end

describe Addressable::URI, "when normalizing a unicode sequence" do
  it "should result in correct percent encoded sequence" do
    expect(Addressable::URI.normalize_component(
      "/C%CC%A7"
    )).to eq("/%C3%87")
  end

  it "should result in correct percent encoded sequence" do
    expect(Addressable::URI.normalize_component(
      "/%C3%87"
    )).to eq("/%C3%87")
  end
end

describe Addressable::URI, "when normalizing a multibyte string" do
  it "should result in correct percent encoded sequence" do
    expect(Addressable::URI.normalize_component("günther")).to eq(
      "g%C3%BCnther"
    )
  end

  it "should result in correct percent encoded sequence" do
    expect(Addressable::URI.normalize_component("g%C3%BCnther")).to eq(
      "g%C3%BCnther"
    )
  end
end

describe Addressable::URI, "when normalizing a string but leaving some characters encoded" do
  it "should result in correct percent encoded sequence" do
    expect(Addressable::URI.normalize_component("%58X%59Y%5AZ", "0-9a-zXY", "Y")).to eq(
      "XX%59Y%5A%5A"
    )
  end

  it "should not modify the character class" do
    character_class = "0-9a-zXY"

    character_class_copy = character_class.dup

    Addressable::URI.normalize_component("%58X%59Y%5AZ", character_class, "Y")

    expect(character_class).to eq(character_class_copy)
  end
end

describe Addressable::URI, "when encoding IP literals" do
  it "should work for IPv4" do
    input = "http://127.0.0.1/"
    expect(Addressable::URI.encode(input)).to eq(input)
  end

  it "should work for IPv6" do
    input = "http://[fe80::200:f8ff:fe21:67cf]/"
    expect(Addressable::URI.encode(input)).to eq(input)
  end
end

describe Addressable::URI, "when encoding a string with existing encodings to upcase" do
  it "should result in correct percent encoded sequence" do
    expect(Addressable::URI.encode_component("JK%4c", "0-9A-IKM-Za-z%", "L")).to eq("%4AK%4C")
  end
end

describe Addressable::URI, "when encoding a multibyte string" do
  it "should result in correct percent encoded sequence" do
    expect(Addressable::URI.encode_component("günther")).to eq("g%C3%BCnther")
  end

  it "should result in correct percent encoded sequence" do
    expect(Addressable::URI.encode_component(
      "günther", /[^a-zA-Z0-9\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=\-\.\_\~]/
    )).to eq("g%C3%BCnther")
  end
end

describe Addressable::URI, "when form encoding a multibyte string" do
  it "should result in correct percent encoded sequence" do
    expect(Addressable::URI.form_encode({"GivenName" => "René"})).to eq(
      "GivenName=Ren%C3%A9"
    )
  end
end

describe Addressable::URI, "when encoding a string with ASCII chars 0-15" do
  it "should result in correct percent encoded sequence" do
    expect(Addressable::URI.encode_component("one\ntwo")).to eq("one%0Atwo")
  end

  it "should result in correct percent encoded sequence" do
    expect(Addressable::URI.encode_component(
      "one\ntwo", /[^a-zA-Z0-9\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=\-\.\_\~]/
    )).to eq("one%0Atwo")
  end
end

describe Addressable::URI, "when unencoding a multibyte string" do
  it "should result in correct percent encoded sequence" do
    expect(Addressable::URI.unencode_component("g%C3%BCnther")).to eq("günther")
  end

  it "should consistently use UTF-8 internally" do
    expect(Addressable::URI.unencode_component("ski=%BA%DAɫ")).to eq("ski=\xBA\xDAɫ")
  end

  it "should not fail with UTF-8 incompatible string" do
    url = "/M%E9/\xE9?p=\xFC".b
    expect(Addressable::URI.unencode_component(url)).to eq("/M\xE9/\xE9?p=\xFC")
  end

  it "should result in correct percent encoded sequence as a URI" do
    expect(Addressable::URI.unencode(
      "/path?g%C3%BCnther", ::Addressable::URI
    )).to eq(Addressable::URI.new(
      :path => "/path", :query => "günther"
    ))
  end
end

describe Addressable::URI, "when partially unencoding a string" do
  it "should unencode all characters by default" do
    expect(Addressable::URI.unencode('%%25~%7e+%2b', String)).to eq('%%~~++')
  end

  it "should unencode characters not in leave_encoded" do
    expect(Addressable::URI.unencode('%%25~%7e+%2b', String, '~')).to eq('%%~%7e++')
  end

  it "should leave characters in leave_encoded alone" do
    expect(Addressable::URI.unencode('%%25~%7e+%2b', String, '%~+')).to eq('%%25~%7e+%2b')
  end
end

describe Addressable::URI, "when unencoding a bogus object" do
  it "should raise a TypeError" do
    expect do
      Addressable::URI.unencode_component(42)
    end.to raise_error(TypeError)
  end

  it "should raise a TypeError" do
    expect do
      Addressable::URI.unencode("/path?g%C3%BCnther", Integer)
    end.to raise_error(TypeError)
  end
end

describe Addressable::URI, "when encoding a bogus object" do
  it "should raise a TypeError" do
    expect do
      Addressable::URI.encode(Object.new)
    end.to raise_error(TypeError)
  end

  it "should raise a TypeError" do
    expect do
      Addressable::URI.normalized_encode(Object.new)
    end.to raise_error(TypeError)
  end

  it "should raise a TypeError" do
    expect do
      Addressable::URI.encode_component("günther", Object.new)
    end.to raise_error(TypeError)
  end

  it "should raise a TypeError" do
    expect do
      Addressable::URI.encode_component(Object.new)
    end.to raise_error(TypeError)
  end
end

describe Addressable::URI, "when given the input " +
    "'http://example.com/'" do
  before do
    @input = "http://example.com/"
  end

  it "should heuristically parse to 'http://example.com/'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.to_s).to eq("http://example.com/")
  end

  it "should not raise error when frozen" do
    expect do
      Addressable::URI.heuristic_parse(@input).freeze.to_s
    end.not_to raise_error
  end
end

describe Addressable::URI, "when given the input " +
    "'https://example.com/'" do
  before do
    @input = "https://example.com/"
  end

  it "should heuristically parse to 'https://example.com/'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.to_s).to eq("https://example.com/")
  end
end

describe Addressable::URI, "when given the input " +
    "'http:example.com/'" do
  before do
    @input = "http:example.com/"
  end

  it "should heuristically parse to 'http://example.com/'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.to_s).to eq("http://example.com/")
  end

  it "should heuristically parse to 'http://example.com/' " +
      "even with a scheme hint of 'ftp'" do
    @uri = Addressable::URI.heuristic_parse(@input, {:scheme => 'ftp'})
    expect(@uri.to_s).to eq("http://example.com/")
  end
end

describe Addressable::URI, "when given the input " +
    "'https:example.com/'" do
  before do
    @input = "https:example.com/"
  end

  it "should heuristically parse to 'https://example.com/'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.to_s).to eq("https://example.com/")
  end

  it "should heuristically parse to 'https://example.com/' " +
      "even with a scheme hint of 'ftp'" do
    @uri = Addressable::URI.heuristic_parse(@input, {:scheme => 'ftp'})
    expect(@uri.to_s).to eq("https://example.com/")
  end
end

describe Addressable::URI, "when given the input " +
    "'http://example.com/example.com/'" do
  before do
    @input = "http://example.com/example.com/"
  end

  it "should heuristically parse to 'http://example.com/example.com/'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.to_s).to eq("http://example.com/example.com/")
  end
end

describe Addressable::URI, "when given the input " +
    "'http://prefix\\.example.com/'" do
  before do
    @input = "http://prefix\\.example.com/"
  end

  it "should heuristically parse to 'http://prefix/.example.com/'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.authority).to eq("prefix")
    expect(@uri.to_s).to eq("http://prefix/.example.com/")
  end

  it "should heuristically parse to 'http://prefix/.example.com/' " +
      "even with a scheme hint of 'ftp'" do
    @uri = Addressable::URI.heuristic_parse(@input, {:scheme => 'ftp'})
    expect(@uri.to_s).to eq("http://prefix/.example.com/")
  end
end

describe Addressable::URI, "when given the input " +
    "'http://p:\\/'" do
  before do
    @input = "http://p:\\/"
  end

  it "should heuristically parse to 'http://p//'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.authority).to eq("p")
    expect(@uri.to_s).to eq("http://p//")
  end

  it "should heuristically parse to 'http://p//' " +
      "even with a scheme hint of 'ftp'" do
    @uri = Addressable::URI.heuristic_parse(@input, {:scheme => 'ftp'})
    expect(@uri.to_s).to eq("http://p//")
  end
end

describe Addressable::URI, "when given the input " +
    "'http://p://'" do
  before do
    @input = "http://p://"
  end

  it "should heuristically parse to 'http://p//'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.authority).to eq("p")
    expect(@uri.to_s).to eq("http://p//")
  end

  it "should heuristically parse to 'http://p//' " +
      "even with a scheme hint of 'ftp'" do
    @uri = Addressable::URI.heuristic_parse(@input, {:scheme => 'ftp'})
    expect(@uri.to_s).to eq("http://p//")
  end
end

describe Addressable::URI, "when given the input " +
    "'http://p://p'" do
  before do
    @input = "http://p://p"
  end

  it "should heuristically parse to 'http://p//p'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.authority).to eq("p")
    expect(@uri.to_s).to eq("http://p//p")
  end

  it "should heuristically parse to 'http://p//p' " +
      "even with a scheme hint of 'ftp'" do
    @uri = Addressable::URI.heuristic_parse(@input, {:scheme => 'ftp'})
    expect(@uri.to_s).to eq("http://p//p")
  end
end

describe Addressable::URI, "when given the input " +
    "'http://prefix .example.com/'" do
  before do
    @input = "http://prefix .example.com/"
  end

  # Justification here being that no browser actually tries to resolve this.
  # They all treat this as a web search.
  it "should heuristically parse to 'http://prefix%20.example.com/'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.authority).to eq("prefix%20.example.com")
    expect(@uri.to_s).to eq("http://prefix%20.example.com/")
  end

  it "should heuristically parse to 'http://prefix%20.example.com/' " +
      "even with a scheme hint of 'ftp'" do
    @uri = Addressable::URI.heuristic_parse(@input, {:scheme => 'ftp'})
    expect(@uri.to_s).to eq("http://prefix%20.example.com/")
  end
end

describe Addressable::URI, "when given the input " +
    "'  http://www.example.com/  '" do
  before do
    @input = "  http://www.example.com/  "
  end

  it "should heuristically parse to 'http://prefix%20.example.com/'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.scheme).to eq("http")
    expect(@uri.path).to eq("/")
    expect(@uri.to_s).to eq("http://www.example.com/")
  end
end

describe Addressable::URI, "when given the input " +
    "'http://prefix%2F.example.com/'" do
  before do
    @input = "http://prefix%2F.example.com/"
  end

  it "should heuristically parse to 'http://prefix%2F.example.com/'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.authority).to eq("prefix%2F.example.com")
    expect(@uri.to_s).to eq("http://prefix%2F.example.com/")
  end

  it "should heuristically parse to 'http://prefix%2F.example.com/' " +
      "even with a scheme hint of 'ftp'" do
    @uri = Addressable::URI.heuristic_parse(@input, {:scheme => 'ftp'})
    expect(@uri.to_s).to eq("http://prefix%2F.example.com/")
  end
end

describe Addressable::URI, "when given the input " +
    "'/path/to/resource'" do
  before do
    @input = "/path/to/resource"
  end

  it "should heuristically parse to '/path/to/resource'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.to_s).to eq("/path/to/resource")
  end
end

describe Addressable::URI, "when given the input " +
    "'relative/path/to/resource'" do
  before do
    @input = "relative/path/to/resource"
  end

  it "should heuristically parse to 'relative/path/to/resource'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.to_s).to eq("relative/path/to/resource")
  end
end

describe Addressable::URI, "when given the input " +
    "'example.com'" do
  before do
    @input = "example.com"
  end

  it "should heuristically parse to 'http://example.com'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.to_s).to eq("http://example.com")
  end
end

describe Addressable::URI, "when given the input " +
    "'example.com' and a scheme hint of 'ftp'" do
  before do
    @input = "example.com"
    @hints = {:scheme => 'ftp'}
  end

  it "should heuristically parse to 'http://example.com'" do
    @uri = Addressable::URI.heuristic_parse(@input, @hints)
    expect(@uri.to_s).to eq("ftp://example.com")
  end
end

describe Addressable::URI, "when given the input " +
    "'example.com:21' and a scheme hint of 'ftp'" do
  before do
    @input = "example.com:21"
    @hints = {:scheme => 'ftp'}
  end

  it "should heuristically parse to 'http://example.com:21'" do
    @uri = Addressable::URI.heuristic_parse(@input, @hints)
    expect(@uri.to_s).to eq("ftp://example.com:21")
  end
end

describe Addressable::URI, "when given the input " +
    "'example.com/path/to/resource'" do
  before do
    @input = "example.com/path/to/resource"
  end

  it "should heuristically parse to 'http://example.com/path/to/resource'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.to_s).to eq("http://example.com/path/to/resource")
  end
end

describe Addressable::URI, "when given the input " +
    "'http:///example.com'" do
  before do
    @input = "http:///example.com"
  end

  it "should heuristically parse to 'http://example.com'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.to_s).to eq("http://example.com")
  end
end

describe Addressable::URI, "when given the input which "\
  "start with digits and has specified port" do
  before do
    @input = "7777.example.org:8089"
  end

  it "should heuristically parse to 'http://7777.example.org:8089'" do
    uri = Addressable::URI.heuristic_parse(@input)
    expect(uri.to_s).to eq("http://7777.example.org:8089")
  end
end

describe Addressable::URI, "when given the input " +
    "'feed:///example.com'" do
  before do
    @input = "feed:///example.com"
  end

  it "should heuristically parse to 'feed://example.com'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.to_s).to eq("feed://example.com")
  end
end

describe Addressable::URI, "when given the input " +
    "'file://localhost/path/to/resource/'" do
  before do
    @input = "file://localhost/path/to/resource/"
  end

  it "should heuristically parse to 'file:///path/to/resource/'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.to_s).to eq("file:///path/to/resource/")
  end
end

describe Addressable::URI, "when given the input " +
    "'file://path/to/resource/'" do
  before do
    @input = "file://path/to/resource/"
  end

  it "should heuristically parse to 'file:///path/to/resource/'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.to_s).to eq("file:///path/to/resource/")
  end
end

describe Addressable::URI, "when given the input " +
    "'file://///path/to/resource/'" do
  before do
    @input = "file:///////path/to/resource/"
  end

  it "should heuristically parse to 'file:////path/to/resource/'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.to_s).to eq("file:////path/to/resource/")
  end
end

describe Addressable::URI, "when given the input " +
    "'feed://http://example.com'" do
  before do
    @input = "feed://http://example.com"
  end

  it "should heuristically parse to 'feed:http://example.com'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.to_s).to eq("feed:http://example.com")
  end
end

describe Addressable::URI, "when given the input " +
    "::URI.parse('http://example.com')" do
  before do
    @input = ::URI.parse('http://example.com')
  end

  it "should heuristically parse to 'http://example.com'" do
    @uri = Addressable::URI.heuristic_parse(@input)
    expect(@uri.to_s).to eq("http://example.com")
  end
end

describe Addressable::URI, "when given the input: 'user@domain.com'" do
  before do
    @input = "user@domain.com"
  end

  context "for heuristic parse" do
    it "should remain 'mailto:user@domain.com'" do
      uri = Addressable::URI.heuristic_parse("mailto:#{@input}")
      expect(uri.to_s).to eq("mailto:user@domain.com")
    end

    it "should have a scheme of 'mailto'" do
      uri = Addressable::URI.heuristic_parse(@input)
      expect(uri.to_s).to   eq("mailto:user@domain.com")
      expect(uri.scheme).to eq("mailto")
    end

    it "should remain 'acct:user@domain.com'" do
      uri = Addressable::URI.heuristic_parse("acct:#{@input}")
      expect(uri.to_s).to eq("acct:user@domain.com")
    end

    context "HTTP" do
      before do
        @uri = Addressable::URI.heuristic_parse("http://#{@input}/")
      end

      it "should remain 'http://user@domain.com/'" do
        expect(@uri.to_s).to eq("http://user@domain.com/")
      end

      it "should have the username 'user' for HTTP basic authentication" do
        expect(@uri.user).to eq("user")
      end
    end
  end
end

describe Addressable::URI, "when assigning query values" do
  before do
    @uri = Addressable::URI.new
  end

  it "should correctly assign {:a => 'a', :b => ['c', 'd', 'e']}" do
    @uri.query_values = {:a => "a", :b => ["c", "d", "e"]}
    expect(@uri.query).to eq("a=a&b=c&b=d&b=e")
  end

  it "should raise an error attempting to assign {'a' => {'b' => ['c']}}" do
    expect do
      @uri.query_values = { 'a' => {'b' => ['c'] } }
    end.to raise_error(TypeError)
  end

  it "should raise an error attempting to assign " +
      "{:b => '2', :a => {:c => '1'}}" do
    expect do
      @uri.query_values = {:b => '2', :a => {:c => '1'}}
    end.to raise_error(TypeError)
  end

  it "should raise an error attempting to assign " +
      "{:a => 'a', :b => [{:c => 'c', :d => 'd'}, " +
      "{:e => 'e', :f => 'f'}]}" do
    expect do
      @uri.query_values = {
        :a => "a", :b => [{:c => "c", :d => "d"}, {:e => "e", :f => "f"}]
      }
    end.to raise_error(TypeError)
  end

  it "should raise an error attempting to assign " +
      "{:a => 'a', :b => [{:c => true, :d => 'd'}, " +
      "{:e => 'e', :f => 'f'}]}" do
    expect do
      @uri.query_values = {
        :a => 'a', :b => [{:c => true, :d => 'd'}, {:e => 'e', :f => 'f'}]
      }
    end.to raise_error(TypeError)
  end

  it "should raise an error attempting to assign " +
      "{:a => 'a', :b => {:c => true, :d => 'd'}}" do
    expect do
      @uri.query_values = {
        :a => 'a', :b => {:c => true, :d => 'd'}
      }
    end.to raise_error(TypeError)
  end

  it "should raise an error attempting to assign " +
      "{:a => 'a', :b => {:c => true, :d => 'd'}}" do
    expect do
      @uri.query_values = {
        :a => 'a', :b => {:c => true, :d => 'd'}
      }
    end.to raise_error(TypeError)
  end

  it "should correctly assign {:a => 1, :b => 1.5}" do
    @uri.query_values = { :a => 1, :b => 1.5 }
    expect(@uri.query).to eq("a=1&b=1.5")
  end

  it "should raise an error attempting to assign " +
      "{:z => 1, :f => [2, {999.1 => [3,'4']}, ['h', 'i']], " +
      ":a => {:b => ['c', 'd'], :e => true, :y => 0.5}}" do
    expect do
      @uri.query_values = {
        :z => 1,
        :f => [ 2, {999.1 => [3,'4']}, ['h', 'i'] ],
        :a => { :b => ['c', 'd'], :e => true, :y => 0.5 }
      }
    end.to raise_error(TypeError)
  end

  it "should correctly assign {}" do
    @uri.query_values = {}
    expect(@uri.query).to eq('')
  end

  it "should correctly assign nil" do
    @uri.query_values = nil
    expect(@uri.query).to eq(nil)
  end

  it "should correctly sort {'ab' => 'c', :ab => 'a', :a => 'x'}" do
    @uri.query_values = {'ab' => 'c', :ab => 'a', :a => 'x'}
    expect(@uri.query).to eq("a=x&ab=a&ab=c")
  end

  it "should correctly assign " +
      "[['b', 'c'], ['b', 'a'], ['a', 'a']]" do
    # Order can be guaranteed in this format, so preserve it.
    @uri.query_values = [['b', 'c'], ['b', 'a'], ['a', 'a']]
    expect(@uri.query).to eq("b=c&b=a&a=a")
  end

  it "should preserve query string order" do
    query_string = (('a'..'z').to_a.reverse.map { |e| "#{e}=#{e}" }).join("&")
    @uri.query = query_string
    original_uri = @uri.to_s
    @uri.query_values = @uri.query_values(Array)
    expect(@uri.to_s).to eq(original_uri)
  end

  describe 'when a hash with mixed types is assigned to query_values' do
    it 'should not raise an error' do
      skip 'Issue #94'
      expect { subject.query_values = { "page" => "1", :page => 2 } }.to_not raise_error
    end
  end
end

describe Addressable::URI, "when assigning path values" do
  before do
    @uri = Addressable::URI.new
  end

  it "should correctly assign paths containing colons" do
    @uri.path = "acct:bob@sporkmonger.com"
    expect(@uri.path).to eq("acct:bob@sporkmonger.com")
    expect(@uri.normalize.to_str).to eq("acct%2Fbob@sporkmonger.com")
    expect { @uri.to_s }.to raise_error(
      Addressable::URI::InvalidURIError
    )
  end

  it "should correctly assign paths containing colons" do
    @uri.path = "/acct:bob@sporkmonger.com"
    @uri.authority = "example.com"
    expect(@uri.normalize.to_str).to eq("//example.com/acct:bob@sporkmonger.com")
  end

  it "should correctly assign paths containing colons" do
    @uri.path = "acct:bob@sporkmonger.com"
    @uri.scheme = "something"
    expect(@uri.normalize.to_str).to eq("something:acct:bob@sporkmonger.com")
  end

  it "should not allow relative paths to be assigned on absolute URIs" do
    expect do
      @uri.scheme = "http"
      @uri.host = "example.com"
      @uri.path = "acct:bob@sporkmonger.com"
    end.to raise_error(Addressable::URI::InvalidURIError)
  end

  it "should not allow relative paths to be assigned on absolute URIs" do
    expect do
      @uri.path = "acct:bob@sporkmonger.com"
      @uri.scheme = "http"
      @uri.host = "example.com"
    end.to raise_error(Addressable::URI::InvalidURIError)
  end

  it "should not allow relative paths to be assigned on absolute URIs" do
    expect do
      @uri.path = "uuid:0b3ecf60-3f93-11df-a9c3-001f5bfffe12"
      @uri.scheme = "urn"
    end.not_to raise_error
  end
end

describe Addressable::URI, "when initializing a subclass of Addressable::URI" do
  before do
    @uri = Class.new(Addressable::URI).new
  end

  it "should have the same class after being parsed" do
    expect(@uri.class).to eq(Addressable::URI.parse(@uri).class)
  end

  it "should have the same class as its duplicate" do
    expect(@uri.class).to eq(@uri.dup.class)
  end

  it "should have the same class after being normalized" do
    expect(@uri.class).to eq(@uri.normalize.class)
  end

  it "should have the same class after being merged" do
    expect(@uri.class).to eq(@uri.merge(:path => 'path').class)
  end

  it "should have the same class after being joined" do
    expect(@uri.class).to eq(@uri.join('path').class)
  end
end

describe Addressable::URI, "support serialization roundtrip" do
  before do
    @uri = Addressable::URI.new(
      :scheme => "http",
      :user => "user",
      :password => "password",
      :host => "example.com",
      :port => 80,
      :path => "/path",
      :query => "query=value",
      :fragment => "fragment"
    )
  end

  it "is in a working state after being serialized with Marshal" do
    @uri = Addressable::URI.parse("http://example.com")
    cloned_uri = Marshal.load(Marshal.dump(@uri))
    expect(cloned_uri.normalized_scheme).to be == @uri.normalized_scheme
  end

  it "is in a working state after being serialized with YAML" do
    @uri = Addressable::URI.parse("http://example.com")
    cloned_uri = if YAML.respond_to?(:unsafe_load)
      YAML.unsafe_load(YAML.dump(@uri))
    else
      YAML.load(YAML.dump(@uri))
    end
    expect(cloned_uri.normalized_scheme).to be == @uri.normalized_scheme
  end
end

describe Addressable::URI, "when initialized in a non-main `Ractor`" do
  it "should have the same value as if used in the main `Ractor`" do
    pending("Ruby 3.0+ for `Ractor` support") unless defined?(Ractor)
    main = Addressable::URI.parse("http://example.com")
    expect(
      Ractor.new { Addressable::URI.parse("http://example.com") }.take
    ).to eq(main)
  end
end

describe Addressable::URI, "when deferring validation" do
  subject(:deferred) { uri.instance_variable_get(:@validation_deferred) }

  let(:uri) { Addressable::URI.parse("http://example.com") }

  it "defers validation within the block" do
    uri.defer_validation do
      expect(deferred).to be true
    end
  end

  it "always resets deferral afterward" do
    expect { uri.defer_validation { raise "boom" } }.to raise_error("boom")
    expect(deferred).to be false
  end

  it "returns nil" do
    res = uri.defer_validation {}
    expect(res).to be nil
  end
end

describe Addressable::URI, "YAML safe loading" do
  it "doesn't serialize anonymous objects" do
    url = Addressable::URI.parse("http://example.com/")
    expect(YAML.dump(url)).to_not include("!ruby/object {}")
  end
end
