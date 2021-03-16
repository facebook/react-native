package com.incture.lch.dao;

import org.springframework.stereotype.Repository;

import com.incture.lch.dto.CarrierDetailsDto;
import com.incture.lch.dto.LkShipperDetailsDto;
import com.incture.lch.entity.CarrierDetails;
import com.incture.lch.entity.LkShipperDetails;

@Repository
public class CarrierDetailsDao 
{
	public CarrierDetails importCarrierDetails(CarrierDetailsDto dto) {
		CarrierDetails cdetails = new CarrierDetails();
		cdetails.setId(dto.getId());
		cdetails.setBpNumber(dto.getBpNumber());
		cdetails.setCarrierScac(dto.getCarrierScac());
		cdetails.setCarrierDetails(dto.getCarrierDetails());
		cdetails.setCarrierMode(dto.getCarrierMode());
		cdetails.setCarrierRatePerKM(dto.getCarrierRatePerKM());
		return cdetails;
	}

	public CarrierDetailsDto exportCarrierDetails(CarrierDetails cdetails) {
		CarrierDetailsDto carrierDetailsDto= new CarrierDetailsDto();
		carrierDetailsDto.setId(cdetails.getId());
		carrierDetailsDto.setBpNumber(cdetails.getBpNumber());
		carrierDetailsDto.setCarrierScac(cdetails.getCarrierScac());
		carrierDetailsDto.setCarrierDetails(cdetails.getCarrierDetails());
		carrierDetailsDto.setCarrierMode(cdetails.getCarrierMode());
		carrierDetailsDto.setCarrierRatePerKM(cdetails.getCarrierRatePerKM());
	
		return carrierDetailsDto;

	}

}
