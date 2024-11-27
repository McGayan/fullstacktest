import React, {useEffect, useState} from 'react'
const clientConfig = require('./clientConfig.js');

function getIndexMap(records)
{
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

function calculateTotal(record, amountIndex) {
	let total = 0;
;
	const expenses = record.expenses;
	expenses.forEach(expenseRow => {
		total += parseFloat(expenseRow[amountIndex]);
	});
	//console.log(total);
	return total;
}

function MainExplorer() {
	const [backendData, setBackendData] = useState([]);
	const [tableHeaders, setTableHeaders] = useState([]);
	useEffect(() => {
		setTableHeaders(["Date", "Amount"]);
		fetch("/getrecs?year=2024&month=11").then(
			response => response.json()
		).then(
			data => {
				const indexMap = getIndexMap(data.records);
				let displayRows = [];
				data.records.forEach(record => {
					let displayRec = {}
					let date = new Date(record.epoch * 1000);
					displayRec.Date = date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate()
					displayRec.Amount = calculateTotal(record, indexMap.amount).toFixed(2);
					displayRec.super = record.super;
					displayRec.epoch = record.epoch;
					displayRows.push(displayRec);
				})
				setBackendData(displayRows);
			}
		)
	}, [])
	return (
		<div>
			<div>HELLO WORLD</div>
			<table  style={{ borderCollapse: "collapse", width: "80%" }} border="1">
				<thead>
					<tr>
						<th>#</th>
						{((tableHeaders) && (tableHeaders.length > 0)) ?
							tableHeaders.map((header, index) => {return(
								<th key={index} style={{ padding: "8px", textAlign: "center" }}>{header}</th>
							)}) : <></>}
					</tr>
				</thead>
				<tbody>
					{((backendData) && (backendData.length > 0)) ?
						backendData.map((row, rowIndex) => (
							<tr key={row.epoch} style={{color:clientConfig[row.super].rowForeColor, backgroundColor:clientConfig[row.super].rowBackColor}}>
								<th>{rowIndex}</th>
								{tableHeaders.map((field, colIndex) => {return (
									<td  key={colIndex} style={{ paddingRight: "10%", textAlign: "right" }}>
										{row[field]}
									</td>
								)})}
							</tr>
						)) : <></>}
				</tbody>
			</table>
		</div>
	)
}

export default MainExplorer