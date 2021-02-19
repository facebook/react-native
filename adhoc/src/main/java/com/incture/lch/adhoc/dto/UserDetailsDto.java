package com.incture.lch.adhoc.dto;

import java.util.List;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * @author Shruti.Ghanshyam
 *
 */
public class UserDetailsDto {
	private String userId;
	private String userName;
	private String email;
	private String firstName;
	private String lastName;
	private List<JsonNode> roleCollections;

	public String getUserId() {
		return userId;
	}

	public void setUserId(String userId) {
		this.userId = userId;
	}

	public String getUserName() {
		return userName;
	}

	public void setUserName(String userName) {
		this.userName = userName;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getFirstName() {
		return firstName;
	}

	public void setFirstName(String firstName) {
		this.firstName = firstName;
	}

	public String getLastName() {
		return lastName;
	}

	public void setLastName(String lastName) {
		this.lastName = lastName;
	}

	public List<JsonNode> getRoleCollections() {
		return roleCollections;
	}

	public void setRoleCollections(List<JsonNode> roleCollections) {
		this.roleCollections = roleCollections;
	}

	@Override
	public String toString() {
		return "UserDetailsDto [userId=" + userId + ", userName=" + userName + ", email=" + email + ", firstName="
				+ firstName + ", lastName=" + lastName + ", roleCollections=" + roleCollections + "]";
	}

}
