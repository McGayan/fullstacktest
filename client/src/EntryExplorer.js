import React, {useEffect, useState} from 'react'
import utils from './utils';
import clientConfig from './clientConfig';

let totalExpended = 0;
function EntryExplorer(props) {
	const callbackSwitchFunc = props.callbackSwitch;
	const onClickHome = () => {
	  callbackSwitchFunc({ flag: "main", epoch: props.epoch });
	};


	const [expenseRecord, setExpenseRecord] = useState({});
	useEffect(() => {

		fetch(`/getrecs?epoch=${props.epoch}`).then(
			response => response.json()
		).then(
			data => {

				if(data.records.length > 0)
				{
					const indexMap = utils.getIndexMap(data.records);
					totalExpended = indexMap.amount != null ? utils.calculateTotal(data.records[0], indexMap.amount).toFixed(2) : 0;
					setExpenseRecord(data.records[0]);
				}
			}
		)
	
	}, [props.epoch])

	return (
		<div>
			{expenseRecord.epoch != null ? 
			<table style={{padding: "20px", textAlign: "left" }}>
				<tr><th>Date: </th><td>{utils.getFormatedDateAndTimeFromEposh(expenseRecord.epoch).dateStr}</td></tr>
				<tr><th>Time: </th><td>{utils.getFormatedDateAndTimeFromEposh(expenseRecord.epoch).timeSTr}</td></tr>
				<tr><th>Super: </th><td>{clientConfig[expenseRecord.super].type}</td></tr>
				<tr><th>Store: </th><td>{expenseRecord.store}</td></tr>
				<tr><th>Address: </th><td>{expenseRecord.address}</td></tr>
			</table>  : <></>}
		  <table
			style={{
			  borderCollapse: "collapse",
			  width: "80%",
			  padding: { left: 100 },
			}}
			border="1"
		  >
			<thead>
			  <tr>
				{expenseRecord.desc != null ?
					expenseRecord.desc.map((item, index) => {
					return (
						<th key={index} style={{ padding: "8px", textAlign: "center" }}>
						{item}
						</th>
					);
					}) : <></>}
			  </tr>
			</thead>
			<tbody>
			{expenseRecord.expenses != null ?
			  expenseRecord.expenses.map((row, rowIndex) => {
				return (
				  <tr key={rowIndex}>
					{row.map((item, itemIndex) => {
					  console.log(JSON.stringify(item));
					  return (
						<td
						  key={itemIndex}
						  style={{
							paddingRight: "1%",
							paddingLeft: "1%",
							textAlign: itemIndex === 2 ? "left" : "right",
						  }}
						>
						  {item}
						</td>
					  );
					})}
				  </tr>
				);
			  }) : <></>}
			  {(expenseRecord != null && expenseRecord.desc != null) ? <tr>
					<th colSpan={expenseRecord.desc.length - 1}>Total</th>
					<th>{totalExpended}</th>
				</tr> : <></>
			}
			</tbody>
		  </table>
		  <button onClick={onClickHome}>home{props.epoch}</button>
		</div>
	  );
  }
  

export default EntryExplorer