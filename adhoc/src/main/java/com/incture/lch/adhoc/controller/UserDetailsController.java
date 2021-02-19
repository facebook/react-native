package com.incture.lch.adhoc.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.incture.lch.adhoc.dto.Response;
import com.incture.lch.adhoc.service.AdhocOrdersService;

@RestController
@CrossOrigin
public class UserDetailsController {

	@Autowired
	private AdhocOrdersService adhocOrdersService;

	@RequestMapping(value = "/UserDetails/currentuser", method = RequestMethod.GET)
	@ResponseBody
	//public ResponseEntity<Response<?>> currentUserDetails(@RequestBody @AuthenticationPrincipal Jwt token) {
	public Map<String, Object> currentUserDetails(@RequestBody @AuthenticationPrincipal Jwt token) {
	return adhocOrdersService.getLoggedInUser(token);
	}

}
