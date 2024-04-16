require 'spec_helper'

describe Typhoeus::Request do
  let(:base_url) { "localhost:3001" }
  let(:options) do
    {
      verbose: true,
      headers: { "User-Agent" => "Fubar", "Expect" => "" },
      maxredirs: 50
    }
  end
  let(:request) { Typhoeus::Request.new(base_url, options) }

  describe ".url" do
    context "when no parameters" do
      it "returns base_url" do
        expect(request.url).to eq(request.base_url)
      end
    end

    context "when parameters" do
      let(:options) { {:params => {:a => 1}} }

      it "returns full url" do
        expect(request.url).to eq("#{request.base_url}?a=1")
      end
    end

    it "pushes an easy back into the pool" do
      easy = double.as_null_object
      allow(Typhoeus::Pool).to receive(:get).and_return(easy)
      expect(Typhoeus::Pool).to receive(:release).with(easy)
      request.url
    end
  end

  describe ".new" do
    it "stores base_url" do
      expect(request.base_url).to eq(base_url)
    end

    it "stores options" do
      expect(request.options).to eq(options)
    end

    it "stores original options" do
      expect(request.original_options).to eq(options)
      expect(request.original_options).to_not be(request.options)
    end

    it "sets defaults" do
      expect(request.options[:headers]['User-Agent']).to be
    end
  end

  describe "set_defaults" do
    context "when header with user agent" do
      let(:options) { {:headers => {'User-Agent' => "Custom"} } }

      it "doesn't modify user agent" do
        expect(request.options[:headers]['User-Agent']).to eq("Custom")
      end
    end

    context "when header without user agent" do
      let(:options) { {:headers => {} } }

      it "add user agent" do
        agent = request.options[:headers]['User-Agent']
        expect(agent).to eq(Typhoeus::USER_AGENT)
      end
    end

    context "when Config.user_agent set" do
      before { Typhoeus.configure { |config| config.user_agent = "Default" } }
      after { Typhoeus.configure { |config| config.user_agent = nil } }

      context "with headers" do
        let(:options) { {:headers => { "User-Agent" => "Fubar" } } }

        it "uses the request options' user agent" do
          expect(request.options[:headers]["User-Agent"]).to eq("Fubar")
        end
      end

      context "without headers" do
        let(:options) { {:headers => {} } }

        it "uses the global options' user agent" do
          expect(request.options[:headers]["User-Agent"]).to eq("Default")
        end
      end
    end

    context "when Config.verbose set" do
      before { Typhoeus.configure { |config| config.verbose = true} }
      after { Typhoeus.configure { |config| config.verbose = false} }

      it "respects" do
        expect(request.options[:verbose]).to be_truthy
      end
    end

    context "when Config.timeout set" do
      before { Typhoeus.configure { |config| config.timeout = 10 } }
      after { Typhoeus.configure { |config| config.timeout = nil } }

      it "respects configuration" do
        expect(request.options[:timeout]).to eq(10)
      end
    end

    context "when Config.connecttimeout set" do
      before { Typhoeus.configure { |config| config.connecttimeout = 10 } }
      after { Typhoeus.configure { |config| config.connecttimeout = nil } }

      it "respects configuration" do
        expect(request.options[:connecttimeout]).to eq(10)
      end
    end

    context "when maxredirs" do
      context "when not set" do
        it "defaults to 50" do
          expect(request.options[:maxredirs]).to be(50)
        end
      end

      context "when set" do
        let(:options) { {:maxredirs => 1} }

        it "respects" do
          expect(request.options[:maxredirs]).to be(1)
        end
      end
    end

    context "when Config.proxy set" do
      before { Typhoeus.configure { |config| config.proxy = "http://proxy.internal" } }
      after { Typhoeus.configure { |config| config.proxy = nil } }

      it "respects" do
        expect(request.options[:proxy]).to eq("http://proxy.internal")
      end

      context "when option proxy set" do
        let(:options) { {:proxy => nil} }

        it "does not override" do
          expect(request.options[:proxy]).to be_nil
        end
      end
    end
  end

  describe "#eql?" do
    context "when another class" do
      let(:other) { "" }

      it "returns false" do
        expect(request).to_not eql other
      end
    end

    context "when same class" do
      let(:other) { Typhoeus::Request.new("base_url", options) }

      context "when other base_url" do
        it "returns false" do
          expect(request).to_not eql other
        end
      end

      context "when same base_url and other options" do
        let(:other) { Typhoeus::Request.new(base_url, {}) }

        it "returns false" do
          expect(request).to_not eql other
        end
      end


      context "when same base_url and options" do
        context "when same order" do
          let(:other) { Typhoeus::Request.new(base_url, options) }

          it "returns true" do
            expect(request).to eql other
          end
        end

        context "when different order" do
          let(:other_options) {
            {:headers => { 'User-Agent' => "Fubar", 'Expect' => ""}, :verbose => true }
          }
          let(:other) { Typhoeus::Request.new(base_url, other_options)}

          it "returns true" do
            expect(request).to eql other
          end
        end
      end
    end
  end

  describe "#hash" do
    context "when request.eql?(other)" do
      context "when different order" do
        let(:other_options) {
          {:headers => { 'User-Agent' => "Fubar", 'Expect' => "" }, :verbose => true }
        }
        let(:other) { Typhoeus::Request.new(base_url, other_options)}

        it "has same hashes" do
          expect(request.hash).to eq(other.hash)
        end
      end

      context "when same order" do
        let(:other) { Typhoeus::Request.new(base_url, options) }

        it "has same hashes" do
          expect(request.hash).to eq(other.hash)
        end
      end

      context "when hashes with different orders are contained in arrays" do
        let(:request) { Typhoeus::Request.new(base_url, :params => [{:b => 2, :a => 1}]) }
        let(:other) { Typhoeus::Request.new(base_url, :params => [{:a => 1, :b => 2}]) }
        it "has different hashes" do
          expect(request.hash).to eq(other.hash)
        end
      end
    end

    context "when not request.eql?(other)" do
      let(:request) { Typhoeus::Request.new(base_url, :params => {:foo => 'bar'}) }
      let(:other) { Typhoeus::Request.new(base_url, :params => {:foo => 'baz'}) }

      it "has different hashes" do
        expect(request.hash).to_not eq(other.hash)
      end
    end
  end

  describe "#encoded_body" do
    let(:request) {
      Typhoeus::Request.new("www.example.com",:body => {:a => 1})
    }

    it "returns encoded body" do
      expect(request.encoded_body).to eq("a=1")
    end
  end

end
