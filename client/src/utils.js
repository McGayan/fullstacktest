
const getIndexMap = (records) => {
	let indexMap = {}
	if(records.length > 0)
	{
		const firstRecord = records[0];
		const descriptionRow = firstRecord.desc
		for (let i = 0; i < descriptionRow.length; i++)
			indexMap[descriptionRow[i].toLowerCase()] = i;
	}
	return indexMap;
}

const calculateTotal = (record, amountIndex) => {
	let total = 0;
	const expenses = record.expenses;
	expenses.forEach(expenseRow => {
		total += parseFloat(expenseRow[amountIndex].replace(/,/g, ""));
	});
	//console.log(total);
	return total;
}

const getYearAndMonthFromEpoch = (epoch) => {
	// Convert to milliseconds if the epoch is in seconds
	if (epoch.toString().length === 10) {
	  epoch *= 1000;
	}
  
	// Create a Date object from the epoch
	const date = new Date(epoch);
  
	// Extract the year and month
	const year = date.getFullYear(); // Get the year
	const month = date.getMonth() + 1; // Get the month (0-based, so add 1)
	const day = date.getDay();
	const hour = date.getHours();
	const minutes = date.getMinutes();
  
	return { year, month, day, hour, minutes };
}

const getFormatedDateAndTimeFromEposh = (epoch) => {
	const { year, month, day, hour, minutes } = getYearAndMonthFromEpoch(epoch);
	const dateStr = "" + year + "-" + month + "-" + day;
	const timeSTr = "" + hour + ":" + minutes;
	return {dateStr, timeSTr};

}

const ToEpoch = (year, month) => {
	return new Date(year, month - 1, 1).getTime() / 1000;
}

const FilterProperties = () => {
	return {
		"startDate": {"year": 0, "month": 1},
		"endDate": {"year": 0, "month": 12},
	}
}

const utils = {getIndexMap, calculateTotal, getYearAndMonthFromEpoch, getFormatedDateAndTimeFromEposh, ToEpoch, FilterProperties};

module.exports = utils;