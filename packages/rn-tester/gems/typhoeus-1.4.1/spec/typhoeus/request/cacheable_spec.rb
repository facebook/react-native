require 'spec_helper'

describe Typhoeus::Request::Cacheable do
  let(:cache) { MemoryCache.new }
  let(:options) { {} }
  let(:request) { Typhoeus::Request.new("http://localhost:3001", options) }
  let(:response) { Typhoeus::Response.new }

  before { Typhoeus::Config.cache = cache }
  after { Typhoeus::Config.cache = false }

  describe "#response=" do
    context "when cache activated" do
      context "when request new" do
        it "caches response" do
          request.response = response
          expect(cache.memory[request]).to be
        end

        it "doesn't set cached on response" do
          request.response = response
          expect(request.response.cached?).to be_falsey
        end
      end

      context "when request in memory" do
        before { cache.memory[request] = response }

        it "finishes request" do
          expect(request).to receive(:finish).with(response)
          request.run
        end

        it "sets cached to true for response" do
          request.run
          expect(request.response.cached?).to be_truthy
        end
      end
    end
  end

  describe "#run" do
    context "when cache activated" do
      context "when request new" do
        it "fetches response" do
          expect(request.response).to_not be(response)
        end
      end

      context "when request in memory" do
        before { cache.memory[request] = response }

        it "finishes request" do
          expect(request).to receive(:finish).with(response)
          request.run
        end
      end

      context "when cache is specified on a request" do
        before { Typhoeus::Config.cache = false }

        context "when cache is false" do
          let(:options) { { :cache => false } }

          it "finishes request" do
            expect(request.response).to_not be(response)
            request.run
          end
        end

        context "when cache is defined" do
          let(:options) { { :cache => cache } }

          before { cache.memory[request] = response }

          it "finishes request" do
            expect(request).to receive(:finish).with(response)
            request.run
          end
        end
      end
    end
  end

  describe "#cache_ttl" do
    context "when option[:cache_ttl]" do
      let(:options) { {:cache_ttl => 1} }

      it "returns" do
        expect(request.cache_ttl).to be(1)
      end
    end
  end
end
