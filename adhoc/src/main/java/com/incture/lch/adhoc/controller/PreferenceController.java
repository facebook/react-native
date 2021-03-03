package com.incture.lch.adhoc.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.json.JSONException;
import org.json.simple.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.incture.lch.adhoc.dto.PreferenceDto;
import com.incture.lch.adhoc.dto.PreferenceResponseDto;
import com.incture.lch.adhoc.service.PreferenceService;

@RestController
@RequestMapping(value = "/preference", produces = "application/json")

public class PreferenceController {
	@Autowired
	private PreferenceService preferenceService;

	/*
	 * @GetMapping("/getPreference") public List<PreferenceDto>
	 * getPreference( @RequestParam String userId) {
	 * 
	 * return preferenceService.getPreference(userId);
	 * 
	 * }
	 */

	// @GetMapping("/getPreference")
	@RequestMapping(value = "/getPreference", method = RequestMethod.POST, consumes = { "application/json" })
	@ResponseBody
	public List<PreferenceDto> getPreference(@RequestBody JSONObject user) throws JSONException {
		/*
		 * // System.out.println(userId.toString());
		 * 
		 * // System.out.println(user.get("userId"));
		 * 
		 * //user.get String u = (String) user.get("userId");
		 * 
		 * System.out.println(u);
		 */

		System.out.println(user);
		String u = (String) user.get("userId");
		return preferenceService.getPreference(u);

	}

	// @PostMapping("/setPreference")
	
	/*  @RequestMapping(value = "/setPreference", method = RequestMethod.POST,
	  consumes = { "application/json" })
	  
	  @ResponseBody public String setPreference(@RequestBody  List<PreferenceDto> preferenceDto, @RequestParam String userId) {
	  
	  return preferenceService.setPreference(preferenceDto, userId);
	  }*/
	  
	@RequestMapping(value = "/setPreference", method = RequestMethod.POST, consumes = { "application/json" })
	public String setPreference(@RequestBody PreferenceResponseDto preferenceResponseDto) {

		List<PreferenceDto> preferenceDto = new ArrayList<>();
		
		preferenceDto = preferenceResponseDto.getPreferenceDTOs();
		String userId = preferenceResponseDto.getUserId();
		System.out.println(preferenceDto.toString());
		System.out.println(userId);
		return preferenceService.setPreference(preferenceResponseDto.getPreferenceDTOs(), userId);
	}
	
	
	
	/////////////////////////////////////////////////////////////////////////
	
	/*
	@RequestMapping(value = "/test", method = RequestMethod.POST, consumes = { "application/json" })
	public String test(@RequestBody JSONObject userDetails) {

		String email=(String)userDetails.get("id");
		
		
		
		System.out.println((userDetails.get("name")).getClass().getSimpleName());
		System.out.println((userDetails.get("emails")).getClass().getSimpleName());
		//List(userDetails.get("emails");
		
		List emails=new ArrayList<>();
		
		emails= (List) userDetails.get("emails");
		System.out.println(emails.get(0));
		System.out.println(emails.get(0).getClass().getSimpleName());
		//String em=emails.get(0);
		System.out.println();
		LinkedHashMap<String, String> userEmailvalue = new LinkedHashMap<String , String >();
		userEmailvalue.putAll((Map<String,String>) emails.get(0));
		String em = userEmailvalue.get("value");
		System.out.println(em);
		return email;
	}*/

	
}
