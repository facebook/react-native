package com.incture.lch.adhoc.service.implementation;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.transaction.Transactional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import com.incture.lch.adhoc.dto.AdhocOrderDto;
import com.incture.lch.adhoc.dto.AdhocRequestDto;
import com.incture.lch.adhoc.dto.LkCountriesDto;
import com.incture.lch.adhoc.dto.LkDivisionsDto;
import com.incture.lch.adhoc.dto.LkShipperDetailsDto;
import com.incture.lch.adhoc.dto.ReasonCodeDto;
import com.incture.lch.adhoc.dto.ResponseDto;
import com.incture.lch.adhoc.repository.AdhocOrdersRepository;
import com.incture.lch.adhoc.service.AdhocOrdersService;

@Service
@Transactional
public class AdhocOrdersServiceImplementation implements AdhocOrdersService {

	private final Logger logger1 = LoggerFactory.getLogger(this.getClass());

	@Autowired
	private AdhocOrdersRepository adhocOrdersRepository;

	@Override
	public List<AdhocOrderDto> getAllAdhocOrders() {
		return adhocOrdersRepository.getAllAdhocOrders();
	}

	@Override
	public ResponseDto addAdhocOrders(AdhocOrderDto AdhocOrderDto) {
		return adhocOrdersRepository.addAdhocOrders(AdhocOrderDto);
	}

	@Override
	public ResponseDto deleteAdhocOrders(String adhocOrderId, String userId, String partNum) {
		ResponseDto responseDto = new ResponseDto();
		int result = adhocOrdersRepository.deleteAdhocOrders(adhocOrderId, userId, partNum);
		if (result == 1) {
			responseDto.setMessage("delete success");
			responseDto.setStatus("SUCCESS");
			responseDto.setCode("00");
			return responseDto;
		} else {
			responseDto.setMessage("delete failed");
			responseDto.setStatus("FAIL");
			responseDto.setCode("01");
			return responseDto;
		}
	}

	@Override
	public List<AdhocOrderDto> getAdhocOrders(AdhocRequestDto adhocRequestDto) {
		return adhocOrdersRepository.getAdhocOrders(adhocRequestDto);
	}

	@Override
	public Map<String, List<ReasonCodeDto>> getReasonCode() {
		return adhocOrdersRepository.getReasonCode();
	}

	@Override
	public ResponseDto addReasonCode(List<ReasonCodeDto> listReasonCodeDto) {
		ResponseDto responseDto = new ResponseDto();
		for (ReasonCodeDto reasonCodeDto : listReasonCodeDto) {
			responseDto = adhocOrdersRepository.addReasonCode(reasonCodeDto);
		}
		return responseDto;
	}

	@Override
	public String getReasonCodeDescById(String id) {
		return adhocOrdersRepository.getReasonCodeDescById(id);
	}

	@Override
	public List<LkShipperDetailsDto> getShipperDetails(String shipperName) {
		return adhocOrdersRepository.getShipperDetails(shipperName);

	}

	@Override
	public List<LkCountriesDto> getAllCountries() {
		/*
		 * List<LkCountriesDto> dtoList = new ArrayList<LkCountriesDto>(); for
		 * (LkCountries lkCouDo : lkCountryJpaRepo.findAll()) {
		 * dtoList.add(lkCouDao.exportCountries(lkCouDo)); }
		 */

		return adhocOrdersRepository.getAllCountries();
	}

	public List<LkDivisionsDto> getAllDivisions() {

		logger1.error("Enter into Division service inside");
		/*
		 * List<LkDivisionsDto> dtoList = new ArrayList<LkDivisionsDto>();
		 * 
		 * for (LkDivisions lkDivDo : lkDivJpaRepo.findAll()) {
		 * logger1.error("Enter into Division service iterating ...");
		 * dtoList.add(lkDivDao.exportDivisions(lkDivDo)); }
		 * logger1.error("Enter into Division service iterating ends..");
		 */
		return adhocOrdersRepository.getAllDivisions();
	}

	public List<LkShipperDetailsDto> getAllShipperDetails() {
		return adhocOrdersRepository.getAllShipperDetails();
	}

	public Map<String, Object> getLoggedInUser(Jwt jwt) {
		try {
			Map<String, Object> userDetailsMap = new LinkedHashMap<String, Object>();
			if (!jwt.getClaims().isEmpty()) {
				userDetailsMap.put("sub", jwt.getClaims().get("sub"));
				userDetailsMap.put("userId", jwt.getClaims().get("user_id"));
				userDetailsMap.put("user_name", jwt.getClaims().get("user_name"));
				userDetailsMap.put("xs.system.attributes", jwt.getClaims().get("xs.system.attributes"));
				userDetailsMap.put("Given_Name", jwt.getClaims().get("given_name"));
				userDetailsMap.put("email", jwt.getClaims().get("email"));
				userDetailsMap.put("family_name", jwt.getClaims().get("family_name"));
				userDetailsMap.put("scope", jwt.getClaims().get("scope"));

			}
			/*
			 * UserDetailsDto loggedInUser = new UserDetailsDto();
			 * loggedInUser.setID(token.getClaims().get("user_id").toString());
			 * loggedInUser.setDisplayName(token.getClaims().get("given_name").
			 * toString());
			 * loggedInUser.setFirstName(token.getClaims().get("given_name").
			 * toString());
			 * loggedInUser.setLastName(token.getClaims().get("family_name").
			 * toString());
			 * loggedInUser.setEmail(token.getClaims().get("email").toString());
			 * return ResponseEntity.ok().body(new
			 * Response<UserDetailsDto>(loggedInUser));
			 */
			return userDetailsMap;
		} catch (Exception e) {
			/*
			 * final Response<String> body = new
			 * Response<String>(e.getMessage());
			 * body.setStatus(HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase()
			 * ); body.setStatusCode(HttpStatus.INTERNAL_SERVER_ERROR.value());
			 * return
			 * ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body
			 * );
			 */}

		return null;
	}

}
