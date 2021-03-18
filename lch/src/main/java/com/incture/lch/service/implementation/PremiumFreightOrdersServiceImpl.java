/**
 * 
 */
package com.incture.lch.service.implementation;

import java.util.List;

import javax.transaction.Transactional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.incture.lch.dto.CarrierDetailsDto;
import com.incture.lch.dto.ChargeRequestDto;
import com.incture.lch.dto.PremiumFreightOrderDto;
import com.incture.lch.dto.PremiumRequestDto;
import com.incture.lch.entity.PremiumFreightChargeDetails;
import com.incture.lch.repository.PremiumFreightOrdersRepository;
import com.incture.lch.service.PremiumFreightOrdersService;

/**
 * @author Urmil Sarit
 *
 */

@Service
@Transactional
public class PremiumFreightOrdersServiceImpl implements PremiumFreightOrdersService{

	@Autowired
	private PremiumFreightOrdersRepository premiumFreightOrdersRepo;
	
	
	@Override
	public List<PremiumFreightOrderDto> getAllPremiumFreightOrders(PremiumRequestDto premiumRequestDto) {
		return premiumFreightOrdersRepo.getAllPremiumFreightOrders(premiumRequestDto);
	}

	@Override
	public List<CarrierDetailsDto> getAllCarrierDetails() {
		return premiumFreightOrdersRepo.getAllCarrierDetails();
	}

	@Override
	public List<String> getMode(String bpNumber) {
		return premiumFreightOrdersRepo.getMode(bpNumber);
	}

	@Override
	public List<PremiumFreightOrderDto> setCarrierDetails(List<ChargeRequestDto> chargeRequestDto) {
		return premiumFreightOrdersRepo.setCarrierDetails(chargeRequestDto);
	}

	@Override
	public String setCharge(ChargeRequestDto dto) {
		return premiumFreightOrdersRepo.setCharge(dto);
	}

	@Override
	public String forwardToApprover(List<PremiumRequestDto> premiumRequestDtos) {
		return premiumFreightOrdersRepo.forwardToApprover(premiumRequestDtos);
	}

	@Override
	public String RejectPremiumOrder(String adhocOrderId) {
		return premiumFreightOrdersRepo.RejectPremiumOrder(adhocOrderId);
	}
	
	@Override
	public String addCarrier(CarrierDetailsDto carrierdto)
	{
		return premiumFreightOrdersRepo.addCarrier(carrierdto); 
	}

}
