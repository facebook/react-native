require File.expand_path('helper', File.join(File.dirname(__FILE__),  ".."))


class PEMUtilsTest < Test::Unit::TestCase
  include Helper

  def setup
    @raw_cert = "-----BEGIN CERTIFICATE-----\nMIIDOTCCAiGgAwIBAgIBAjANBgkqhkiG9w0BAQsFADBCMRMwEQYKCZImiZPyLGQB\nGRYDb3JnMRkwFwYKCZImiZPyLGQBGRYJcnVieS1sYW5nMRAwDgYDVQQDDAdSdWJ5\nIENBMB4XDTE2MDgxMDE3MjEzNFoXDTE3MDgxMDE3MjEzNFowSzETMBEGCgmSJomT\n8ixkARkWA29yZzEZMBcGCgmSJomT8ixkARkWCXJ1YnktbGFuZzEZMBcGA1UEAwwQ\nUnVieSBjZXJ0aWZpY2F0ZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEB\nAJCfsSXpSMpmZCVa+ZCM+QDgomnhDlvnrGDq6pasTaIspGTXgws+7r8Dt/cNe6EH\nHJpRH2cGRiO4yPcfcT9eS4X7k8OC4f33wHfACOmLu6LeoNE8ujmSk6L6WzLUI+sE\nnLZbFrXxoAo4XHsm8vEG9C+jEoXZ1p+47wrAGaDwDQTnzlMy4dT9pRQEJP2G/Rry\nUkuZn8SUWmh3/YS78iaSzsNF1cgE1ealHOrPPFDjiCGDaH/LHyUPYlbFSLZ/B7Qx\nLxi5sePLcywWq/EJrmWpgeVTDjtNijsdKv/A3qkY+fm/oD0pzt7XsfJaP9YKNyJO\nQFdxWZeiPcDF+Hwf+IwSr+kCAwEAAaMxMC8wDgYDVR0PAQH/BAQDAgeAMB0GA1Ud\nDgQWBBQNvzYzJyXemGhxbA8NMXLolDnPyjANBgkqhkiG9w0BAQsFAAOCAQEARIJV\noKejGlOTn71QutnNnu07UtTu0IHs6YqjYzzND+m4JXLN+wvYm72AFUG0b1L7dRg0\niK8XjQrlNQNVqP1Mc6tffchy20neOPOHeiO6qTdRU8P2S8D3Uwe+1qhgxjfE+cWc\nwZmWxYK4HA8c58PxWMqrkr2QqXDplG9KWLvOgrtPGiLLZcQSKhvvB63QzItHBDU6\nRayiJY3oPkK/HrIvFlySqFqzWmuyknkciOFywEHQMz/tcSFJ2QFpPj/tBz9VXohH\nZ8KscmfhZrTPBjo+ky1lz/WraWoz4LMiLnkC2ABczWLRSawu+v3Irx1NFJngt05e\npqwtqIUeg7j+JLiTaA==\n-----END CERTIFICATE-----"
  end

  def test_read_certificate
    assert_nothing_raised do
      binary = HTTPClient::JRubySSLSocket::PEMUtils.read_certificate(@raw_cert)
    end
  end

  def test_read_certificate_works_with_random_ascii_text_outside_begin_end
    raw_cert_with_ascii = "some text before begin\n" + @raw_cert + "\nsome text after end"
    assert_nothing_raised do
      binary = HTTPClient::JRubySSLSocket::PEMUtils.read_certificate(raw_cert_with_ascii)
    end
  end

  def test_read_certificate_uses_all_content_if_missing_begin_end
    cert = @raw_cert.sub(/-----BEGIN CERTIFICATE-----/, '').sub(/-----END CERTIFICATE-----/, '')
    assert_nothing_raised do
      binary = HTTPClient::JRubySSLSocket::PEMUtils.read_certificate(cert)
    end
  end


end
