require 'spec_helper'

describe Typhoeus::EasyFactory do
  let(:base_url) { "http://localhost:3001" }
  let(:hydra) { Typhoeus::Hydra.new(:max_concurrency => 1) }
  let(:options) { {} }
  let(:request) { Typhoeus::Request.new(base_url, options) }
  let(:easy_factory) { described_class.new(request, hydra) }

  describe "#get" do
    context "when option[:cache_ttl]" do
      let(:options) { {:cache_ttl => 1} }

      it "creates Ethon::Easy" do
        expect(easy_factory.get).to be_a(Ethon::Easy)
      end
    end
    
    context "timeouts" do
      it "sets nosignal to true by default" do
        expect(easy_factory.easy).to receive(:http_request).with(anything(), anything(), hash_including(:nosignal => true))
        easy_factory.get
      end

      context "when timeout is not a whole number and timeout_ms is not set" do
        let(:options) { {:timeout => 0.1} }
        it "ceils timeout and sets timeout_ms" do
          expect(easy_factory.easy).to receive(:http_request).with(anything(), anything(), hash_including(:timeout_ms => 100, :timeout => 1))
          easy_factory.get
        end
      end

      context "when timeout is not a whole number and timeout_ms is set" do
        let(:options) { {:timeout => 0.1, :timeout_ms => 123} }
        it "ceils timeout and does not change timeout_ms" do
          expect(easy_factory.easy).to receive(:http_request).with(anything(), anything(), hash_including(:timeout_ms => 123, :timeout => 1))
          easy_factory.get
        end
      end

      context "when connecttimeout is not a whole number and connecttimeout_ms is not set" do
        let(:options) { {:connecttimeout => 0.1} }
        it "ceils connecttimeout and sets connecttimeout_ms" do
          expect(easy_factory.easy).to receive(:http_request).with(anything(), anything(), hash_including(:connecttimeout_ms => 100, :connecttimeout => 1))
          easy_factory.get
        end
      end

      context "when connecttimeout is not a whole number and connecttimeout_ms is set" do
        let(:options) { {:connecttimeout => 0.1, :connecttimeout_ms => 123} }
        it "ceils connecttimeout and does not change connecttimeout_ms" do
          expect(easy_factory.easy).to receive(:http_request).with(anything(), anything(), hash_including(:connecttimeout_ms => 123, :connecttimeout => 1))
          easy_factory.get
        end
      end


    end

    context "when invalid option" do
      let(:options) { {:invalid => 1} }

      it "reraises" do
        expect{ easy_factory.get }.to raise_error(Ethon::Errors::InvalidOption)
      end
    end

    context "when removed option" do
      let(:options) { {:cache_timeout => 1} }

      it "reraises with help" do
        expect{ easy_factory.get }.to raise_error(
          Ethon::Errors::InvalidOption, /The option cache_timeout was removed/
        )
      end
    end

    context "when changed option" do
      let(:options) { {:proxy_auth_method => 1} }

      it "reraises with help" do
        expect{ easy_factory.get }.to raise_error(
          Ethon::Errors::InvalidOption, /Please try proxyauth instead of proxy_auth_method/
        )
      end
    end

    context "when renamed option" do
      let(:options) { {:connect_timeout => 1} }

      it "warns" do
        expect(easy_factory).to receive(:warn).with(
          "Deprecated option connect_timeout. Please use connecttimeout instead."
        )
        easy_factory.get
      end

      it "passes correct option" do
        expect(easy_factory).to receive(:warn)
        expect(easy_factory.easy).to receive(:connecttimeout=).with(1)
        easy_factory.get
      end
    end
  end

  describe "#set_callback" do
    it "sets easy.on_progress callback when an on_progress callback is provided" do
      request.on_progress { 1 }
      expect(easy_factory.easy).to receive(:on_progress)
      easy_factory.send(:set_callback)
    end

    it "sets easy.on_complete callback" do
      expect(easy_factory.easy).to receive(:on_complete)
      easy_factory.send(:set_callback)
    end

    it "finishes request" do
      easy_factory.send(:set_callback)
      expect(request).to receive(:finish)
      easy_factory.easy.complete
    end

    it "resets easy" do
      easy_factory.send(:set_callback)
      expect(easy_factory.easy).to receive(:reset)
      easy_factory.easy.complete
    end

    it "pushes easy back into the pool" do
      easy_factory.send(:set_callback)
      easy_factory.easy.complete
      expect(Typhoeus::Pool.send(:easies)).to include(easy_factory.easy)
    end

    it "adds next request" do
      easy_factory.hydra.instance_variable_set(:@queued_requests, [request])
      expect(easy_factory.hydra).to receive(:add).with(request)
      easy_factory.send(:set_callback)
      easy_factory.easy.complete
    end
  end
end
