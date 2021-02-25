package com.incture.lch.adhoc.util;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.nio.charset.Charset;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import javax.naming.Context;
import javax.naming.InitialContext;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sap.core.connectivity.api.configuration.ConnectivityConfiguration;
import com.sap.core.connectivity.api.configuration.DestinationConfiguration;

public class ServiceUtil {

	public static final String NOT_APPLICABLE = "N/A";
	public static SimpleDateFormat DEFAULT_DATE_FORMAT = new SimpleDateFormat("yyyyMMdd");

	public static boolean isEmpty(Object o) {
		if (o == null || (o instanceof Long && (Long) o == 0L)) {
			return true;
		}
		return false;
	}

	public static boolean isEmpty(Object[] objs) {
		if (objs == null || objs.length == 0) {
			return true;
		}
		return false;
	}

	public static boolean isEmpty(Collection<?> o) {
		if (o == null || o.isEmpty()) {
			return true;
		}
		return false;
	}

	public static int nullHandler(Collection<?> o) {
		if (o == null || o.isEmpty()) {
			return 0;
		} else
			return o.size();
	}

	public static boolean isEmpty(String str) {
		if (str == null || str.trim().isEmpty()) {
			return true;
		}
		return false;
	}

	public static boolean isEmpty(StringBuffer sb) {
		if (sb == null || sb.length() == 0) {
			return true;
		}
		return false;
	}

	public static boolean isEmpty(StringBuilder sb) {
		if (sb == null || sb.length() == 0) {
			return true;
		}
		return false;
	}

	public static String getCSV(Object... objs) {
		if (!isEmpty(objs)) {
			if (objs[0] instanceof Collection<?>) {
				return getCSVArr(((Collection<?>) objs[0]).toArray());
			} else {
				return getCSVArr(objs);
			}

		} else {
			return "";
		}
	}

	private static String getCSVArr(Object[] objs) {
		if (!isEmpty(objs)) {
			StringBuffer sb = new StringBuffer();
			for (Object obj : objs) {
				sb.append(',');
				if (obj instanceof Field) {
					sb.append(extractFieldName((Field) obj));
				} else {
					sb.append(extractStr(obj));
				}
			}
			sb.deleteCharAt(0);
			return sb.toString();
		} else {
			return "";
		}
	}

	public static String extractStr(Object o) {
		return o == null ? "" : o.toString();
	}

	public static String extractFieldName(Field o) {
		return o == null ? "" : o.getName();
	}

	public static String buildNoRecordMessage(String queryName, Object... parameters) {
		StringBuffer sb = new StringBuffer("No Record found for query: ");
		sb.append(queryName);
		if (!isEmpty(parameters)) {
			sb.append(" for params:");
			sb.append(getCSV(parameters));
		}
		return sb.toString();
	}

	public static byte[] hexStringToByteArray(String s) {
		int len = s.length();
		byte[] data = new byte[len / 2];
		for (int i = 0; i < len; i += 2) {
			data[i / 2] = (byte) ((Character.digit(s.charAt(i), 16) << 4) + Character.digit(s.charAt(i + 1), 16));
		}
		return data;
	}

	public static BigDecimal nullHandler(BigDecimal b) {
		if (ServiceUtil.isEmpty(b)) {
			return BigDecimal.ZERO;
		}
		return b;
	}

	public static Boolean nullHandler(Boolean b) {
		if (ServiceUtil.isEmpty(b)) {
			return b = false;
		} else
			return b;
	}

	public static String getExceptionTrace(Exception ex) {
		StringWriter errors = new StringWriter();
		ex.printStackTrace(new PrintWriter(errors));
		return errors.toString();
	}

	public static boolean isTrue(Boolean b) {
		if (!isEmpty(b) && b == true) {
			return true;
		} else {
			return false;
		}
	}

	public static boolean isFalse(Boolean b) {
		if (isEmpty(b) || b == false) {
			return true;
		} else {
			return false;
		}
	}

	public static BigDecimal min(BigDecimal a, BigDecimal b) {
		if (a.compareTo(b) >= 0) {
			return b;
		} else {
			return a;
		}
	}

	public static BigDecimal max(BigDecimal a, BigDecimal b) {
		if (a.compareTo(b) < 0) {
			return b;
		} else {
			return a;
		}
	}

	public static String formatDate(Date d, String format) {
		SimpleDateFormat sdf = new SimpleDateFormat(format);
		return sdf.format(d);
	}

	public static String formatDate(Date d) {
		return DEFAULT_DATE_FORMAT.format(d);
	}

	// removes all leading zeros in a string
	public static String removeLeadingZeros(String s) {
		s = s.replaceFirst("^0*", "");
		return s;
	}

	public static String replaceLast(String string, String substring, String replacement) {
		int index = string.lastIndexOf(substring);
		if (index == -1)
			return string;
		return string.substring(0, index) + replacement + string.substring(index + substring.length());
	}

	public static Date getEndOfDay(Date date) {
		Calendar calendar = Calendar.getInstance();
		calendar.setTime(date);
		calendar.set(Calendar.HOUR_OF_DAY, 23);
		calendar.set(Calendar.MINUTE, 59);
		calendar.set(Calendar.SECOND, 59);
		calendar.set(Calendar.MILLISECOND, 999);
		return calendar.getTime();
	}

	public static String timeConvert(long time) {
		long days = time / 24 / 60;
		long hours = time / 60 % 24; // since both are ints, you get an int
		long minutes = time % 60;
		return String.format("%02d : %02d : %02d", days, hours, minutes);
		// return time/24/60 + " : " + time/60%24 + " : " + time%60;
	}

	public static BigDecimal catchNull(BigDecimal value) {
		if (!ServiceUtil.isEmpty(value))
			return value;
		else
			return BigDecimal.ZERO;
	}

	public static BigDecimal catchNull(String value) {
		if (!ServiceUtil.isEmpty(value))
			return new BigDecimal(value);
		else
			return BigDecimal.ZERO;
	}

	static DateFormat dateFormat1 = new SimpleDateFormat("yyyy-MM-dd");
	static DateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

	private static final Logger LOGGER = LoggerFactory.getLogger(ServiceUtil.class);

	public static String DateIntoString(Date input) {
		String output = dateFormat1.format(input);
		return output;
	}

	public static Date StringIntoDate(String input) {
		Date output = null;
		try {
			output = dateFormat1.parse(input);
		} catch (ParseException e) {
			LOGGER.error("Date format Exception:" + e.getMessage());
		}
		return output;
	}

	public static String convertDateToString(Date input) {
		String output = dateFormat.format(input);
		return output;
	}

	public static String DateToString(Date input) {
		String output = dateFormat1.format(input);
		return output;
	}

	public static Date convertStringToDateForYard(String input) {
		Date date = null;
		try {
			Date uiDate = dateFormat.parse(input);
			DateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
			String newFormat = sdf.format(uiDate);
			date = sdf.parse(newFormat);
		} catch (ParseException e) {
			e.printStackTrace();
		}
		return date;
	}

	public static Date convert(String input) {
		DateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
		Date date = null;
		;
		try {
			date = sdf.parse(input);
		} catch (ParseException e) {
			e.printStackTrace();
		}
		return date;
	}

	public static String convertTMDateToJava(String input) {
		DateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
		Date date = null;
		try {
			date = sdf.parse(input);
		} catch (ParseException e) {
			LOGGER.error("Date format Exception:" + e.getMessage());
		}
		String output = dateFormat.format(date);
		return output;
	}

	public static String convertTMDate(String input) {
		DateFormat dateFormatTM = new SimpleDateFormat("dd-MMM-YYYY");
		DateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
		Date date = null;
		try {
			date = sdf.parse(input);
		} catch (ParseException e) {
			LOGGER.error("Date format Exception:" + e.getMessage());
		}
		String output = dateFormatTM.format(date);
		return output;
	}

	public static String convertBusinessDate(String input) {
		DateFormat dateFormatBusiness = new SimpleDateFormat("dd-MMM-YYYY");
		DateFormat sdf = new SimpleDateFormat("yyyyMMddHHmmss");
		Date date = null;
		try {
			date = sdf.parse(input);
		} catch (ParseException e) {
			LOGGER.error("Date format Exception:" + e.getMessage());
		}
		String output = dateFormatBusiness.format(date);
		return output;
	}

	public static Date convertStringToDate(String input) {
		Date output = null;
		try {
			output = dateFormat.parse(input);
		} catch (ParseException e) {
			LOGGER.error("Date format Exception:" + e.getMessage());
		}
		return output;
	}

	public static String convertBooleanToString(Boolean input) {
		String output = "false";
		if (input != null && !(input.equals(""))) {
			output = Boolean.toString(input);
		}
		return output;
	}

	public static String convertIntegerToString(Integer input) {
		String output = "";
		if (input != null && !(input.equals(""))) {
			output = Integer.toString(input);
		}
		return output;
	}

	public static String convertBigDecimalToString(BigDecimal input) {
		String output = "";
		if (input != null && !(input.equals(""))) {
			output = String.valueOf(input);
		}

		return output;
	}

	public static String parseCostValue(String cost) {
		BigDecimal parse = new BigDecimal(10000);
		BigDecimal inputval = convertStringToBigDecimal(cost);
		BigDecimal actual = inputval.multiply(parse);
		actual = actual.setScale(2, BigDecimal.ROUND_FLOOR);
		String val = convertBigDecimalToString(actual);
		return val;
	}

	public static BigDecimal convertStringToBigDecimal(String input) {

		if(input!=null && input.equalsIgnoreCase(""))
		{
		BigDecimal output = new BigDecimal(input);
		return output;
		}
		return null;
	}

	public static Boolean convertStringToBoolean(String input) {
		Boolean output = false;
		if (input != null && !(input.equals(""))) {
			output = Boolean.parseBoolean(input);
		}
		return output;
	}

	public static Integer convertStringToInteger(String input) {
		
		if(input!=null && input.equalsIgnoreCase(""))
		{
		Integer output = Integer.parseInt(input);
		return output;
		}
		return null;
	}

	public static String paddingZeros(String number) {
		long decimal = Long.parseLong(number);
		String value = String.format("%010d", decimal);
		return value;
	}

	public static String convertStringto2DecimalPrecidingZero(String number) {
		float f = Float.parseFloat(number);
		String value = String.format("%.2f", f);
		return value;
	}

	public static String paddingZerosThirdParty(String number) {
		long decimal = Long.parseLong(number);
		String value = String.format("%01d", decimal);
		return value;
	}

	public static String stringSplitWithDot(String number) {
		String val = "";
		if (!isEmpty(number)) {
			String[] subStr = number.split("\\.");
			val = subStr[0];
		}
		return val;
	}

	public static DestinationConfiguration getDest(String destinationName) {
		if (!ServiceUtil.isEmpty(destinationName)) {
			try {
				Context ctx = new InitialContext();
				ConnectivityConfiguration configuration = (ConnectivityConfiguration) ctx
						.lookup("java:comp/env/connectivityConfiguration");
				DestinationConfiguration destConfiguration = configuration.getConfiguration(destinationName);
				return destConfiguration;
			} catch (Exception e) {
				LOGGER.error("Workflow getting destination error:" + e.getMessage());
			}
		}
		return null;
	}

	public static String getAuthorization(String accessToken, String tokenType) {
		return tokenType + " " + accessToken;
	}

	public static String getBasicAuth(String userName, String password) {
		String userpass = userName + ":" + password;
		return "Basic " + javax.xml.bind.DatatypeConverter.printBase64Binary(userpass.getBytes());
	}

	public static boolean isEmpty(Cell cellIndex) {
		DataFormatter df = new DataFormatter();
		if (null == cellIndex || df.formatCellValue(cellIndex).equalsIgnoreCase("")
				|| df.formatCellValue(cellIndex).equalsIgnoreCase(null))
			return true;
		else
			return false;
	}

	public static Date getCurrentDate() throws ParseException {
		SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");
		Date todayDate = new Date();
		String CurrentDateStr = ServiceUtil.convertDateToString(todayDate);
		Date currentDateValue = (Date) formatter.parse(CurrentDateStr);
		return currentDateValue;
	}

	@SuppressWarnings({ "unchecked" })
	public static <T> Predicate<T> distinctByKeys(Function<? super T, ?>... keyExtractors) {
		final Map<List<?>, Boolean> seen = new ConcurrentHashMap<>();
		return t -> {
			final List<?> keys = Arrays.stream(keyExtractors).map(ke -> ke.apply(t)).collect(Collectors.toList());
			return seen.putIfAbsent(keys, Boolean.TRUE) == null;
		};
	}

	public static Long generateRandomDigits(int n) {
		long number = (long) Math.floor(Math.random() * 9000000000000000L) + 1000000000000000L;
		return number;
		
	}

	public static String getAlphaNumericString(int n) {

		// length is bounded by 256 Character
		byte[] array = new byte[256];
		new Random().nextBytes(array);

		String randomString = new String(array, Charset.forName("UTF-8"));

		// Create a StringBuffer to store the result
		StringBuffer r = new StringBuffer();

		// remove all spacial char
		String AlphaNumericString = randomString.replaceAll("[^A-Z0-9]", "");

		// Append first 20 alphanumeric characters
		// from the generated random String into the result
		for (int k = 0; k < AlphaNumericString.length(); k++) {

			if (Character.isLetter(AlphaNumericString.charAt(k)) && (n > 0)
					|| Character.isDigit(AlphaNumericString.charAt(k)) && (n > 0)) {

				r.append(AlphaNumericString.charAt(k));
				n--;
			}
		}

		// return the resultant string
		return r.toString();
	}
}
