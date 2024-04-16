# frozen_string_literal: true
require 'spec_helper'

describe Ethon::Easy::Options do
  let(:easy) { Ethon::Easy.new }

  [
    :accept_encoding, :cainfo, :capath, :connecttimeout, :connecttimeout_ms, :cookie,
    :cookiejar, :cookiefile, :copypostfields, :customrequest, :dns_cache_timeout,
    :followlocation, :forbid_reuse, :http_version, :httpauth, :httpget, :httppost,
    :infilesize, :interface, :keypasswd, :maxredirs, :nobody, :nosignal,
    :postfieldsize, :postredir, :protocols, :proxy, :proxyauth, :proxyport, :proxytype,
    :proxyuserpwd, :readdata, :readfunction, :redir_protocols, :ssl_verifyhost,
    :ssl_verifypeer, :sslcert, :sslcerttype, :sslkey, :sslkeytype, :sslversion,
    :timeout, :timeout_ms, :unrestricted_auth, :upload, :url, :useragent,
    :userpwd, :verbose, :pipewait, :dns_shuffle_addresses, :path_as_is
  ].each do |name|
    describe "#{name}=" do
      it "responds_to" do
        expect(easy).to respond_to("#{name}=")
      end

      it "sets option" do
        expect_any_instance_of(Ethon::Easy).to receive(:set_callbacks)
        expect(Ethon::Curl).to receive(:set_option).with(name, anything, anything)
        value = case name
        when :http_version
          :httpv1_0
        when :httpauth
          :basic
        when :protocols, :redir_protocols
          :http
        when :postredir
          :post_301
        when :proxytype
          :http
        when :sslversion
          :default
        when :httppost
          FFI::Pointer::NULL
        else
          1
        end
        easy.method("#{name}=").call(value)
      end
    end
  end

  describe '#escape?' do
    context 'by default' do
      it 'returns true' do
        expect(easy.escape?).to be_truthy
      end
    end

    context 'when #escape=nil' do
      it 'returns true' do
        easy.escape = nil
        expect(easy.escape?).to be_truthy
      end
    end

    context 'when #escape=true' do
      it 'returns true' do
        easy.escape = true
        expect(easy.escape?).to be_truthy
      end
    end

    context 'when #escape=false' do
      it 'returns true' do
        easy.escape = false
        expect(easy.escape?).to be_falsey
      end
    end
  end

  describe '#multipart?' do
    context 'by default' do
      it 'returns false' do
        expect(easy.multipart?).to be_falsey
      end
    end

    context 'when #multipart=nil' do
      it 'returns false' do
        easy.multipart = nil
        expect(easy.multipart?).to be_falsey
      end
    end

    context 'when #multipart=true' do
      it 'returns true' do
        easy.multipart = true
        expect(easy.multipart?).to be_truthy
      end
    end

    context 'when #multipart=false' do
      it 'returns false' do
        easy.multipart = false
        expect(easy.multipart?).to be_falsey
      end
    end
  end

  describe "#httppost=" do
    it "raises unless given a FFI::Pointer" do
      expect{ easy.httppost = 1 }.to raise_error(Ethon::Errors::InvalidValue)
    end
  end

  context "when requesting" do
    let(:url) { "localhost:3001" }
    let(:timeout) { nil }
    let(:timeout_ms) { nil }
    let(:connecttimeout) { nil }
    let(:connecttimeout_ms) { nil }
    let(:userpwd) { nil }

    before do
      easy.url = url
      easy.timeout = timeout
      easy.timeout_ms = timeout_ms
      easy.connecttimeout = connecttimeout
      easy.connecttimeout_ms = connecttimeout_ms
      easy.userpwd = userpwd
      easy.perform
    end

    context "when userpwd" do
      context "when contains /" do
        let(:url) { "localhost:3001/auth_basic/test/te%2Fst" }
        let(:userpwd) { "test:te/st" }

        it "works" do
          expect(easy.response_code).to eq(200)
        end
      end
    end

    context "when timeout" do
      let(:timeout) { 1 }

      context "when request takes longer" do
        let(:url) { "localhost:3001?delay=2" }

        it "times out" do
          expect(easy.return_code).to eq(:operation_timedout)
        end
      end
    end

    context "when connecttimeout" do
      let(:connecttimeout) { 1 }

      context "when cannot connect" do
        let(:url) { "localhost:3002" }

        it "times out" do
          expect(easy.return_code).to eq(:couldnt_connect)
        end
      end
    end

    if Ethon::Easy.supports_timeout_ms?
      context "when timeout_ms" do
        let(:timeout_ms) { 100 }

        context "when request takes longer" do
          let(:url) { "localhost:3001?delay=1" }

          it "times out" do
            expect(easy.return_code).to eq(:operation_timedout)
          end
        end
      end

      context "when connecttimeout_ms" do
        let(:connecttimeout_ms) { 100 }

        context "when cannot connect" do
          let(:url) { "localhost:3002" }

          it "times out" do
            # this can either lead to a timeout or couldnt connect depending on which happens first
            expect([:couldnt_connect, :operation_timedout]).to include(easy.return_code)
          end
        end
      end
    end
  end
end
