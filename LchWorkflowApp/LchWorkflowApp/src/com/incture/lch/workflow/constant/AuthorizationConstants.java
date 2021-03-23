package com.incture.lch.workflow.constant;

public class AuthorizationConstants {

	public static final String OAUTH_TOKEN_BASE_URL = "https://api.us3.hana.ondemand.com/oauth2/apitoken/v1?grant_type=client_credentials";
	public static final String GET_TOKEN_BASE_URL = "https://api.us3.hana.ondemand.com/oauth2/";
	public static final String GET_TOKEN_URL = "apitoken/v1?grant_type=client_credentials";
	public static final String ASSIGN_ROLE_URL = "groups/users/?groupName=";
	public static final String UN_ASSIGN_ROLE_URL = "&users=";
	public static final String BEARER = "Bearer";
	public static final int AUTH_API_SUCCESS_CODE = 201;

}
