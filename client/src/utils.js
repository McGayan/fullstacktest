
const getIndexMapFunc = (records) => {
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

const calculateTotalFunc = (record, amountIndex) => {
	let total = 0;
	const expenses = record.expenses;
	expenses.forEach(expenseRow => {
		total += parseFloat(expenseRow[amountIndex]);
	});
	//console.log(total);
	return total;
}

const utils = {getIndexMap: getIndexMapFunc, calculateTotal: calculateTotalFunc}

module.exports = utils;