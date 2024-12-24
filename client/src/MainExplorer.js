import React, {useEffect, useState} from 'react'
import utils from "./utils.js";
const clientConfig = require('./clientConfig.js');

function MainExplorer(props) {
	const callbackSwitchFunc = props.callbackSwitch;
	const handleClick_explore = (text) => {
		console.log(`You clicked on: ${text}`);
		callbackSwitchFunc({ epoch: text, flag: "entry" });
	};
  
	const [backendData, setBackendData] = useState([]);
	const [tableHeaders, setTableHeaders] = useState([]);
	useEffect(() => {
		setTableHeaders(["Date", "Amount"]);
		fetch("/getrecs?year=2024&month=11").then(
			response => response.json()
		).then(
			data => {
				const indexMap = utils.getIndexMap(data.records);
				let displayRows = [];
				data.records.forEach(record => {
					let displayRec = {}
					let date = new Date(record.epoch * 1000);
					displayRec.Date = date.getFullYear() + "/" + (date.getMonth() + 1) + "/" + date.getDate()
					displayRec.Amount = indexMap.amount != null ? utils.calculateTotal(record, indexMap.amount).toFixed(2) : 0;
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
								<td style={{color:clientConfig[row.super].linkTextForeColor, backgroundColor:clientConfig[row.super].linkTextBackColor}}>
									<span onClick={() => handleClick_explore(row.epoch)}>edit</span>
								</td>
							</tr>
						)) : <></>}
				</tbody>
			</table>
		</div>
	)
}

export default MainExplorer