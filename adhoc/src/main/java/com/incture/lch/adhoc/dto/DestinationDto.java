package com.incture.lch.adhoc.dto;

public class DestinationDto {

	private String name;
	private String description;
	private String type;
	private String url;
	private String authentication;
	private String proxytype;
	private String tokenServiceURL;
	private String clientId;
	private String clientSecret;
	private String tokenServiceURLType;
	private String userName;
	private String password;

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getUrl() {
		return url;
	}

	public void setUrl(String url) {
		this.url = url;
	}

	public String getAuthentication() {
		return authentication;
	}

	public void setAuthentication(String authentication) {
		this.authentication = authentication;
	}

	public String getProxytype() {
		return proxytype;
	}

	public void setProxytype(String proxytype) {
		this.proxytype = proxytype;
	}

	public String getTokenServiceURL() {
		return tokenServiceURL;
	}

	public void setTokenServiceURL(String tokenServiceURL) {
		this.tokenServiceURL = tokenServiceURL;
	}

	public String getClientId() {
		return clientId;
	}

	public void setClientId(String clientId) {
		this.clientId = clientId;
	}

	public String getClientSecret() {
		return clientSecret;
	}

	public void setClientSecret(String clientSecret) {
		this.clientSecret = clientSecret;
	}

	public String getTokenServiceURLType() {
		return tokenServiceURLType;
	}

	public void setTokenServiceURLType(String tokenServiceURLType) {
		this.tokenServiceURLType = tokenServiceURLType;
	}

	public String getUserName() {
		return userName;
	}

	public void setUserName(String userName) {
		this.userName = userName;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	@Override
	public String toString() {
		return "DestinationDto [name=" + name + ", description=" + description + ", type=" + type + ", url=" + url
				+ ", authentication=" + authentication + ", proxytype=" + proxytype + ", tokenServiceURL="
				+ tokenServiceURL + ", clientId=" + clientId + ", clientSecret=" + clientSecret
				+ ", tokenServiceURLType=" + tokenServiceURLType + ", userName=" + userName + ", password=" + password
				+ "]";
	}

}
