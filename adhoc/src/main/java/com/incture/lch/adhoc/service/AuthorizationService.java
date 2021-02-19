package com.incture.lch.adhoc.service;

import java.util.List;
import java.util.Map;

import org.springframework.security.oauth2.jwt.Jwt;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.incture.lch.adhoc.dto.ResponseDto;
import com.incture.lch.adhoc.dto.ResponseStatusDto;

/**
 * @author Sushmita.Naresh
 * @version 1.0.0
 * @since 27-Oct-2020
 */
public interface AuthorizationService {

	/**
	 * @param authType
	 * @param jwt
	 * @return List<Map<String, String>>
	 */
	List<Map<String, String>> getAuthorizationDetails(String authType, Jwt jwt);

	/**
	 * @param jwt
	 * @return ResponseDto
	 */
	ResponseStatusDto getLoggedInUserDetails(Jwt jwt);

	/**
	 * @param userIdList
	 * @return Map<String, String>
	 * @throws JsonMappingException
	 * @throws JsonProcessingException
	 */
	Map<String, String> getUserDetails(List<String> userIdList) throws JsonMappingException, JsonProcessingException;

	/**
	 * @param groupName
	 * @param jwt
	 * @return List<String>
	 */
	List<String> getEmailsForGroup(String groupName, Jwt jwt);

}
