package com.incture.lch.adhoc.service.implementation;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.transaction.Transactional;

import org.apache.commons.codec.binary.Base64;
import org.json.simple.JSONArray;
import org.json.simple.JSONObject;
import org.json.simple.parser.JSONParser;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.incture.lch.adhoc.dto.ApplicationConstants;
import com.incture.lch.adhoc.dto.DestinationUtility;
import com.incture.lch.adhoc.dto.HttpResponseDto;
import com.incture.lch.adhoc.dto.ResponseStatusDto;
import com.incture.lch.adhoc.dto.UserDetailsDto;
import com.incture.lch.adhoc.service.AuthorizationService;

/**
 * @author Sushmita.Naresh
 * @version 1.0.0
 * @since 27-Oct-2020
 */
@Service
@Transactional
public class AuthorizationServiceImpl implements AuthorizationService {

	private final Logger logger = LoggerFactory.getLogger(this.getClass());

	/**
	 * @param authType
	 * @param jwt
	 * @return List<Map<String, String>>
	 */
	@Override
	public List<Map<String, String>> getAuthorizationDetails(String authType, Jwt jwt) {
		logger.info(" [AuthorizationServiceImpl]|[getAuthorizationDetails]  Execution start " + " Input is  authType "
				+ authType);
		List<Map<String, String>> autorizationDetailsList = null;

		try {

			RestTemplate restTemplate = new RestTemplate();
			HttpHeaders headers = new HttpHeaders();
			headers.setAccept(Arrays.asList(MediaType.APPLICATION_JSON));
			headers.add(ApplicationConstants.AUTHORIZATION, "Bearer " + jwt.getTokenValue());

			HttpEntity<String> entity = new HttpEntity<String>(headers);
			String url = ApplicationConstants.AUTHORIZATION_API_DESTINATION
					+ "/v2/rolecollections?showGroups=true&showRoles=true&showUsers=true";
			logger.info("final url" + url);
			String roleCollectionData = restTemplate.exchange(url, HttpMethod.GET, entity, String.class).getBody();
			logger.info("RoleCollectionData" + roleCollectionData);

			JsonNode node = new ObjectMapper().readValue(roleCollectionData, JsonNode.class);
			logger.info("node" + node);

			autorizationDetailsList = getWorkrulesSpecificRoleCollections(node, authType);

		} catch (

		Exception e) {
			logger.error(" [AuthorizationServiceImpl]|[getAuthorizationDetails]   " + " Exception Occured  message :"
					+ e.getMessage() + "At line no");

		}
		logger.info(" [AuthorizationServiceImpl]|[getAuthorizationDetails]  Execution end "
				+ " Output  is ResponseDto :" + autorizationDetailsList);

		return autorizationDetailsList;
	}

	/**
	 * @param jwt
	 * @return ResponseDto
	 */
	@Override
	public ResponseStatusDto getLoggedInUserDetails(Jwt jwt) {
		logger.info(" [AuthorizationServiceImpl]|[getLoggedInUserDetails]  Execution start ");

		ResponseStatusDto responseDto = new ResponseStatusDto();

		try {
			HttpHeaders headers = new HttpHeaders();
			headers.setAccept(Arrays.asList(MediaType.APPLICATION_JSON));
			headers.add(ApplicationConstants.AUTHORIZATION, "Bearer " + jwt.getTokenValue());
			UserDetailsDto userDetailsDto = new UserDetailsDto();

			userDetailsDto.setUserId(jwt.getClaims().get("sub").toString());
			userDetailsDto.setUserName(jwt.getClaims().get("user_name").toString());
			userDetailsDto.setEmail(jwt.getClaims().get(ApplicationConstants.USER_EMAIL) != null
					? jwt.getClaims().get(ApplicationConstants.USER_EMAIL).toString() : null);
			userDetailsDto.setFirstName(jwt.getClaims().get(ApplicationConstants.USER_FIRST_NAME) != null
					? jwt.getClaims().get(ApplicationConstants.USER_FIRST_NAME).toString() : null);
			userDetailsDto.setLastName(jwt.getClaims().get(ApplicationConstants.USER_LAST_NAME) != null
					? jwt.getClaims().get(ApplicationConstants.USER_LAST_NAME).toString() : null);
			jwt.getClaims().get("xs.system.attributes");

			responseDto.setData(userDetailsDto);
			responseDto.setStatus(Boolean.TRUE);
			responseDto.setStatusCode(200);

		} catch (Exception e) {
			logger.error(" [AuthorizationServiceImpl]|[getLoggedInUserDetails]   " + " Exception Occured  message :"
					+ e.getMessage() + "At line no");
			responseDto.setStatus(Boolean.FALSE);
			responseDto.setStatusCode(500);
			responseDto.setMessage(e.getMessage());

		}
		logger.info(" [AuthorizationServiceImpl]|[getLoggedInUserDetails]  Execution end " + " Output  is ResponseDto :"
				+ responseDto);
		return responseDto;
	}

	private List<Map<String, String>> getWorkrulesSpecificRoleCollections(JsonNode node, String authType) {

		if (node != null && node.isArray()) {
			List<Map<String, String>> authorizationDetailsList = new ArrayList<Map<String, String>>();
			node.forEach(roleCollection -> {
				logger.info("roleCollection" + roleCollection);
				String roleCollectionName = roleCollection.get(ApplicationConstants.ROLE_COLLECTION_NAME) != null
						? roleCollection.get(ApplicationConstants.ROLE_COLLECTION_NAME).asText() : null;
				if (roleCollectionName != null && roleCollectionName.toLowerCase()
						.startsWith(ApplicationConstants.WORKRULES_ROLE_COLLECTION_PREFIX)) {

					if (ApplicationConstants.AUTH_TYPE_GROUP.equalsIgnoreCase(authType)) {
						Map<String, String> authorizationDetails = new LinkedHashMap<String, String>();
						authorizationDetails.put("USER_GROUP", roleCollectionName);
						String roleCollectionDescription = roleCollection
								.get(ApplicationConstants.ROLE_COLLECTION_DESCRIPTION) != null

										? roleCollection.get(ApplicationConstants.ROLE_COLLECTION_DESCRIPTION).asText()
										: null;
						authorizationDetails.put("name", roleCollectionDescription);
						if (!authorizationDetailsList.contains(authorizationDetails)) {
							authorizationDetailsList.add(authorizationDetails);
						}
					} else if (ApplicationConstants.AUTH_TYPE_USER.equalsIgnoreCase(authType)) {
						JsonNode userData = roleCollection.get(ApplicationConstants.ROLE_COLLECTION_USERS);
						if (userData != null && userData.isArray()) {
							userData.forEach(user -> {
								Map<String, String> authorizationDetails = new LinkedHashMap<String, String>();

								String email = user.get(ApplicationConstants.USER_EMAIL) != null
										? user.get(ApplicationConstants.USER_EMAIL).asText().toLowerCase() : null;
								String userName = user.get(ApplicationConstants.USER_NAME) != null
										? user.get(ApplicationConstants.USER_NAME).asText() : null;
								String firstName = user.get(ApplicationConstants.USER_FIRST_NAME) != null
										? user.get(ApplicationConstants.USER_FIRST_NAME).asText() : null;
								String lastName = user.get(ApplicationConstants.USER_LAST_NAME) != null
										? user.get(ApplicationConstants.USER_LAST_NAME).asText() : null;

								authorizationDetails.put("email", email);
								authorizationDetails.put("USER_GROUP", userName);
								authorizationDetails.put("name", firstName + " " + lastName);
								if (!authorizationDetailsList.contains(authorizationDetails)) {
									authorizationDetailsList.add(authorizationDetails);
								}

							});

						}

					}

				}

			});
			return authorizationDetailsList;
		}
		return null;

	}

	public String getAcceesToken() {
		String accessToken = null;
		RestTemplate restTemplate = new RestTemplate();

		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
		headers.add(ApplicationConstants.AUTHORIZATION,
				createAuthHeaderString(ApplicationConstants.XSUAA_CLIENT_ID, ApplicationConstants.XSUAA_CLIENT_SECRET));

		MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
		map.add("response_type", "token");
		map.add("client_id", ApplicationConstants.XSUAA_CLIENT_ID);
		map.add("client_secret", ApplicationConstants.XSUAA_CLIENT_SECRET);

		map.add("username", ApplicationConstants.XSUAA_USER);
		map.add("password", ApplicationConstants.XSUAA_USER_PASSWORD);

		map.add("grant_type", "password");

		HttpEntity<MultiValueMap<String, String>> entity = new HttpEntity<>(map, headers);

		ResponseEntity<JsonNode> response = restTemplate.exchange(ApplicationConstants.XSUAA_TOKEN_URL, HttpMethod.POST,
				entity, JsonNode.class);
		if (response != null) {
			JsonNode res = response.getBody();
			accessToken = res.get("access_token") != null ? res.get("access_token").asText() : null;
		}

		return accessToken;

	}

	private String createAuthHeaderString(String username, String password) {
		String auth = username + ":" + password;
		byte[] encodedAuth = Base64.encodeBase64(auth.getBytes(StandardCharsets.US_ASCII));
		return "Basic " + new String(encodedAuth);
	}

	/**
	 * @param groupName
	 * @param jwt
	 * @return List<String>
	 */
	@Override
	public List<String> getEmailsForGroup(String groupName, Jwt jwt) {
		List<String> emailIdList = null;
		JSONParser parser = new JSONParser();
		try {

			RestTemplate restTemplate = new RestTemplate();
			HttpHeaders headers = new HttpHeaders();
			headers.setAccept(Arrays.asList(MediaType.APPLICATION_JSON));
			headers.add(ApplicationConstants.AUTHORIZATION, "Bearer " + jwt.getTokenValue());

			HttpEntity<String> entity = new HttpEntity<String>(headers);
			String url = ApplicationConstants.AUTHORIZATION_API_DESTINATION + "/v2/rolecollections/" + groupName
					+ "?withUsers=true";
			logger.info("final url" + url);
			String roleCollectionData = restTemplate.exchange(url, HttpMethod.GET, entity, String.class).getBody();
			logger.info("RoleCollectionData" + roleCollectionData);
			JSONObject jsonObject = (JSONObject) parser.parse(roleCollectionData);
			logger.info("node" + jsonObject);
			if (jsonObject != null) {
				JSONArray userReferenceArray = (JSONArray) jsonObject.get("userReferences");
				if (userReferenceArray != null && !userReferenceArray.isEmpty()) {
					emailIdList = new ArrayList<>();
					for (Object userReference : userReferenceArray) {
						JSONObject userReferenceJsonObject = (JSONObject) userReference;
						if (userReferenceJsonObject.get("email") != null) {
							emailIdList.add(userReferenceJsonObject.get("email").toString());
						}
					}
				}
			}

		} catch (Exception e) {
			logger.error(" [AuthorizationServiceImpl]|[getAuthorizationDetails]   " + " Exception Occured  message :"
					+ e.getMessage() + "At line no");

		}
		logger.info(" [AuthorizationServiceImpl]|[getAuthorizationDetails]  Execution end "
				+ " Output  is ResponseDto :" + emailIdList);

		return emailIdList;
	}

	/**
	 * @param userIdList
	 * @return Map<String, String>
	 * @throws JsonMappingException
	 * @throws JsonProcessingException
	 */
	@Override
	public Map<String, String> getUserDetails(List<String> userIdList)
			throws JsonMappingException, JsonProcessingException {

		logger.info("[AuthorizationServiceImpl]|[getUserDetails]|Execution  Start |input :" + userIdList);

		Map<String, String> userIdMap = new LinkedHashMap<String, String>();

		try {

			DestinationUtility destinationUtility = new DestinationUtility();
			StringBuilder str = new StringBuilder();
			str.append("/Users?attributes=userName,name,id,emails");
			if (userIdList != null && !userIdList.isEmpty()) {

				str.append("&filter=");
				userIdList.forEach(user -> {
					if (!userIdList.get(0).equals(user)) {
						str.append(" or ");

					}
					str.append(" userName eq " + "'" + user + "'");

				});

				logger.info("[AuthorizationServiceImpl]|[getUserDetails]|url to send |" + str.toString());

				HttpResponseDto httpResponseDto = destinationUtility.getDataFromDestinationSystem("authorization_api",
						str.toString(), "GET", null, null, null, "Rest Api");
				logger.info(
						"[AuthorizationServiceImpl]|[getUserDetails]|ResponseFrom Destination call|" + httpResponseDto);

				if (httpResponseDto.getStatuscode() == 200 && httpResponseDto.getResponseData() != null) {
					JsonNode node = new ObjectMapper().readValue(httpResponseDto.getResponseData(), JsonNode.class);
					JsonNode resourceNode = node.get("resources");
					if (!resourceNode.isEmpty()) {
						resourceNode.forEach(resource -> {
							JsonNode name = !resource.get("name").isEmpty() ? resource.get("name") : null;
							String firstName = null;
							String lastName = null;
							JsonNode userNameNode = resource.get("userName");

							String userName = userNameNode != null ? userNameNode.asText() : null;
							if (userName != null) {

								if (name != null) {
									lastName = name.get("familyName") != null ? name.get("familyName").asText() : null;
									firstName = name.get("givenName") != null ? name.get("givenName").asText() : null;
								}
								logger.info("[AuthorizationServiceImpl]|[getUserDetails]|FirstName +lastName+usrName"
										+ firstName + " " + lastName + " " + userName);

								if (firstName != null && lastName != null && !"unknown".equalsIgnoreCase(firstName)
										&& !"unknown".equalsIgnoreCase(lastName)) {
									userIdMap.put(userName, firstName + " " + lastName);

								} else {
									userIdMap.put(userName, userName);
								}
							}
						});
					}

				}
			}
		} catch (Exception e) {
			logger.info("[AuthorizationServiceImpl]|[getUserDetails]| Exception Occured  |" + e.getMessage());

		}
		return userIdMap;
	}

}
