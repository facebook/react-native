package com.incture.lch.adhoc.controller;

import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

import com.incture.lch.adhoc.dto.AdhocOrderDto;
import com.incture.lch.adhoc.dto.AdhocRequestDto;
import com.incture.lch.adhoc.dto.LkCountriesDto;
import com.incture.lch.adhoc.dto.LkDivisionsDto;
import com.incture.lch.adhoc.dto.LkShipperDetailsDto;
import com.incture.lch.adhoc.dto.PartNumberDescDto;
import com.incture.lch.adhoc.dto.ReasonCodeDto;
import com.incture.lch.adhoc.dto.ResponseDto;
import com.incture.lch.adhoc.service.AdhocOrdersService;
import com.incture.lch.adhoc.util.ServiceUtil;
//import com.sap.conn.jco.JCoException;

@RestController
@CrossOrigin
@RequestMapping(value = "/adhocorders", produces = "application/json")
public class AdhocOrdersController {

	private final Logger logger1 = LoggerFactory.getLogger(this.getClass());

	@Autowired
	private AdhocOrdersService adhocOrdersService;

/*	@Autowired
	private JcoApiConnector jcoApiConnector;*/

	@RequestMapping(value = "/addAdhocOrders", method = RequestMethod.POST, consumes = { "application/json" })
	@ResponseBody
	public ResponseDto addAdhocOrders(@RequestBody AdhocOrderDto AdhocOrderDto) {
		return adhocOrdersService.addAdhocOrders(AdhocOrderDto);
	}
	
	@RequestMapping(value = "/saveAdhocOrders", method = RequestMethod.POST, consumes = { "application/json" })
	@ResponseBody
	public AdhocOrderDto saveAdhocOrders(@RequestBody AdhocOrderDto AdhocOrderDto) {
		return adhocOrdersService.saveAdhocOrders(AdhocOrderDto);
	}

	@RequestMapping(value = "/getAllAdhocOrders", method = RequestMethod.POST, consumes = { "application/json" })
	@ResponseBody
	public List<AdhocOrderDto> getAllAdhocOrders() {
		return adhocOrdersService.getAllAdhocOrders();
	}
	
	@RequestMapping(value = "/getKpiBasedResult/{days}", method = RequestMethod.POST, consumes = { "application/json" })
	@ResponseBody
	public List<AdhocOrderDto> getKpiBasedResult(@PathVariable(value = "days") int  days) {
		return adhocOrdersService.getKpi(days);
	}
	

	
	@RequestMapping(value = "/getByPartNumber", method = RequestMethod.POST, consumes = { "application/json" })
	@ResponseBody
	public PartNumberDescDto getByPartNumber(@RequestBody PartNumberDescDto partNum) {
		return adhocOrdersService.getByPartNumber(partNum);
	}

	@RequestMapping(value = "/deleteAdhocOrders", method = RequestMethod.DELETE, consumes = { "application/json" })
	@ResponseBody
	public ResponseDto deleteAdhocOrders(String adhocOrderId, String userId, String partNum) {
		return adhocOrdersService.deleteAdhocOrders(adhocOrderId, userId, partNum);
	}

	@RequestMapping(value = "/getAdhocOrders", method = RequestMethod.POST, consumes = { "application/json" })
	@ResponseBody
	public List<AdhocOrderDto> getAdhocOrders(@RequestBody AdhocRequestDto adhocRequestDto) {
		return adhocOrdersService.getAdhocOrders(adhocRequestDto);
	}

	@RequestMapping(value = "/getReasonCode", method = RequestMethod.GET)
	@ResponseBody
	public Map<String, List<ReasonCodeDto>> getReasonCode() {
		return adhocOrdersService.getReasonCode();
	}

	@RequestMapping(value = "/addReasonCode", method = RequestMethod.POST, consumes = { "application/json" })
	@ResponseBody
	public ResponseDto addReasonCode(@RequestBody List<ReasonCodeDto> listReasonCodeDto) {
		return adhocOrdersService.addReasonCode(listReasonCodeDto);
	}

	@RequestMapping(value = "/getAllCountries", method = RequestMethod.GET, consumes = { "application/json" })
	@ResponseBody
	public List<LkCountriesDto> getAllCountries() {
		return adhocOrdersService.getAllCountries();
	}

	@RequestMapping(value = "/getAllDivisions", method = RequestMethod.GET, consumes = { "application/json" })
	@ResponseBody
	public List<LkDivisionsDto> getAllDivisions() {
		logger1.error("Enter into Division controller");
		return adhocOrdersService.getAllDivisions();
	}

	@RequestMapping(value = "/getReasonCodeById/{id}", method = RequestMethod.GET, consumes = { "application/json" })
	@ResponseBody
	public String getReasonCodeById(@PathVariable(value = "id") String id) {
		return adhocOrdersService.getReasonCodeDescById(id);
	}

	@RequestMapping(value = "/getShipperDetails/{shipperName}", method = RequestMethod.GET, consumes = {
			"application/json" })
	@ResponseBody
	public List<LkShipperDetailsDto> getShipperDetails(@PathVariable(value = "shipperName") String shipperName) {
		return adhocOrdersService.getShipperDetails(shipperName);
	}

	@RequestMapping(value = "/getAllShipperDetails", method = RequestMethod.GET, consumes = { "application/json" })
	@ResponseBody
	public List<LkShipperDetailsDto> getAllShipperDetails() {
		return adhocOrdersService.getAllShipperDetails();
	}

	@RequestMapping(value = "/postMessage", method = RequestMethod.GET)
	public String testPostMessage() {
		return "Your message has been posted to IOP. Reference No. #" + ServiceUtil.generateRandomDigits(16);
	}
	
	

	/*
	 * @RequestMapping(value = "/UserDetails/currentuser", method =
	 * RequestMethod.GET)
	 * 
	 * @ResponseBody public ResponseEntity<Response<?>>
	 * currentUserDetails(@RequestBody @AuthenticationPrincipal Token token) {
	 * return adhocOrdersService.getLoggedInUser(token); }
	 */

/*	@RequestMapping(value = "/getTableData", method = RequestMethod.POST, consumes = { "application/json" })
	@ResponseBody
	public List<PartNumberDescDto> getTableData(@RequestBody PartNumberDescDto partNumberDto) throws JCoException {
		List<PartNumberDescDto> dtoList = new ArrayList<PartNumberDescDto>();
		try {
			return jcoApiConnector.getPartNumberDescDto("MAKT", partNumberDto.getPartNum(), Arrays.asList("MAKTX"), 1000, dtoList);
		} catch (JCoException e) {
			dtoList.add(new PartNumberDescDto("NA", "NA", e.toString()));
			return dtoList;
		}
	}*/
}
