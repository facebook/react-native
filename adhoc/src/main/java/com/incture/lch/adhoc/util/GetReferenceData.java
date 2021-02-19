package com.incture.lch.adhoc.util;

import java.util.Calendar;

import org.hibernate.SessionFactory;
import org.springframework.stereotype.Component;

@Component
public class GetReferenceData {

	public String execute(String type) {
		Calendar now = Calendar.getInstance();
		String year = now.get(Calendar.YEAR) + "";
		String month = String.valueOf(now.get(Calendar.MONTH) + 1);
		String day = String.valueOf(now.get(Calendar.DATE));
		if (month.length() != 2) {
			month = "0" + month;
		}
		if (day.length() != 2) {
			day = "0" + day;
		}
		return type + year.substring(2, 4) + month + day;
	}

	public String executeDmfrt(String type) {
		// Calendar now = Calendar.getInstance();
		// String year = now.get(Calendar.YEAR) + "";
		// String month = String.valueOf(now.get(Calendar.MONTH) + 1);
		// String day = String.valueOf(now.get(Calendar.DATE));
		// if (month.length() != 2) {
		// month = "0" + month;
		// }
		// if (day.length() != 2) {
		// day = "0" + day;
		// }
		return type;
	}

	public String executeFo(String type) {
		Calendar now = Calendar.getInstance();
		String year = now.get(Calendar.YEAR) + "";
		String month = String.valueOf(now.get(Calendar.MONTH) + 1);
		String day = String.valueOf(now.get(Calendar.DATE));
		String hour = String.valueOf(now.get(Calendar.HOUR_OF_DAY));
		if (month.length() != 2) {
			month = "0" + month;
		}
		if (day.length() != 2) {
			day = "0" + day;
		}
		if (hour.length() != 2) {
			hour = "0" + hour;
		}
		return type + year.substring(2, 4) + month + day + hour;
	}

/*	public String getNextSeqNumber(String referenceCode, int noOfDigits, SessionFactory sessionFactory) {
		return SequenceNumberGen.getInstance().getNextSeqNumber(referenceCode, noOfDigits,
				sessionFactory.getCurrentSession());
	}*/

	public String getNextSeqNumberAdhoc(String referenceCode, int noOfDigits, SessionFactory sessionFactory) {
		return SequenceNumberGenAdhoc.getInstance().getNextSeqNumber(referenceCode, noOfDigits,
				sessionFactory.getCurrentSession());
	}

	/*public String getNextSeqNumberAttachment(String referenceCode, int noOfDigits, SessionFactory sessionFactory) {
		return SequenceNumberGenAttachment.getInstance().getNextSeqNumber(referenceCode, noOfDigits,
				sessionFactory.getCurrentSession());
	}

	public String getNextSeqNumberCompliance(String referenceCode, int noOfDigits, SessionFactory sessionFactory) {
		return SequenceNumberGenCompliance.getInstance().getNextSeqNumber(referenceCode, noOfDigits,
				sessionFactory.getCurrentSession());
	}*/

/*	public String getNextSeqNumberCrossDock(String referenceCode, int noOfDigits, SessionFactory sessionFactory) {
		return SequenceNumberGenCrossDock.getInstance().getNextSeqNumber(referenceCode, noOfDigits,
				sessionFactory.getCurrentSession());
	}

	public String getNextSeqNumberGroup(String referenceCode, int noOfDigits, SessionFactory sessionFactory) {
		return SequenceNumberGenGroup.getInstance().getNextSeqNumber(referenceCode, noOfDigits,
				sessionFactory.getCurrentSession());
	}

	public String getNextSeqNumberPackaging(String referenceCode, int noOfDigits, SessionFactory sessionFactory) {
		return SequenceNumberGenPackaging.getInstance().getNextSeqNumber(referenceCode, noOfDigits,
				sessionFactory.getCurrentSession());
	}
*/
	/*public String getNextSeqNumberPremiumFo(String referenceCode, int noOfDigits, SessionFactory sessionFactory) {
		return SequenceNumberGenPremiumFo.getInstance().getNextSeqNumber(referenceCode, noOfDigits,
				sessionFactory.getCurrentSession());
	}

	public String getNextSeqNumberSrm(String referenceCode, int noOfDigits, SessionFactory sessionFactory) {
		return SequenceNumberGenSrm.getInstance().getNextSeqNumber(referenceCode, noOfDigits,
				sessionFactory.getCurrentSession());
	}

	public String getNextSeqNumberCassAttachment(String referenceCode, int noOfDigits, SessionFactory sessionFactory) {
		return SequenceNumberGenAttachment.getInstance().getNextSeqNumber(referenceCode, noOfDigits,
				sessionFactory.getCurrentSession());
	}

	public String getNextSeqNumberPremiumFoDmfrt(String referenceCode, int noOfDigits, SessionFactory sessionFactory) {
		return SequenceNumberGenDmfrt.getInstance().getNextSeqNumber(referenceCode, noOfDigits,
				sessionFactory.getCurrentSession());
	}*/
}
