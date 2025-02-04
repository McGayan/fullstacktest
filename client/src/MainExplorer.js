import "./styles.css";
import React, {useEffect, useState, useRef} from 'react'
import utils from "./utils.js";
import { SlOptionsVertical } from "react-icons/sl";
import YearMonthPicker from "./YearMonthPicker.js";
//import DataProvider from "./DataProvider.js";
const clientConfig = require('./clientConfig.js');

function MainExplorer(props) {
	const setSize = 15;
	const [openMenuId, setOpenMenuId] = useState(null);
	const menuRef = useRef(null);
	const callbackSwitchFunc = props.callbackSwitch;

	const handleClick_explore = (text) => {
		console.log(`You clicked on: ${text}`);
		callbackSwitchFunc({ epoch: text, flag: "entry" });
	};
	
	const toggleMenu = (id) => {
		setOpenMenuId(openMenuId === id ? null : id);
	  };
	  
	const [backendData, setBackendData] = useState([]);
	const [tableHeaders, setTableHeaders] = useState([]);
	const [timeFilterEnabled, setTimeFilterEnabled] = useState(false);
	
	const processBackEndData = (data) => {
		if(data != null) {
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
	}

	useEffect(() => {
		setTableHeaders(["Date", "Amount"]);
		const fetchData = async () => {
			try {
				const data = await props.dataProvider.getStartingSet(setSize);//GetRecords(2024, 11)
				processBackEndData(data);
			}catch (err) {

			}
		}
		fetchData();
	}, [props.dataProvider]);

	  // Close menu on Escape key press
	  useEffect(() => {
		const handleKeyDown = (event) => {
		  if (event.key === "Escape") {
			setOpenMenuId(null);
		  }
		};
		document.addEventListener("keydown", handleKeyDown);
		// Cleanup event listener on component unmount
		return () => {
		  document.removeEventListener("keydown", handleKeyDown);
		};
	  }, []);
	
	  // Close menu on outside click
	  useEffect(() => {
		const handleClickOutside = (event) => {
		  if (menuRef.current && !menuRef.current.contains(event.target)) {
			setOpenMenuId(null);
		  }
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
		  document.removeEventListener("mousedown", handleClickOutside);
		};
	  }, []);

	const fetchPreviousSet = async () => {
		try {
			const data = await props.dataProvider.getSetBackward(setSize);//GetRecords(2024, 11)
			processBackEndData(data);
		}catch (err) {

		}
	}

	const fetchNextSet = async () => {
		try {
			const data = await props.dataProvider.getSetForward(setSize);//GetRecords(2024, 11)
			processBackEndData(data);
		}catch (err) {

		}
	}


	const fetchInitialSet = async () => {
		try {
			const data = await props.dataProvider.getStartingSet(setSize);//GetRecords(2024, 11)
			processBackEndData(data);
		}catch (err) {

		}
	}

	const onClickNext = () => {
		fetchNextSet();
	}

	const  onClickPrevious = () => {
		fetchPreviousSet();
	}

	const  onClickFirstSet = () => {
		fetchInitialSet();
	}

	const onClickDebug = () => {
		console.log("Debug pressed");
	}

	return (
		<div>
			<div style={{margin: "10px"}}>
				<input type="checkbox" id="vehicle1" name="chkEnableTimeFilter" value={timeFilterEnabled} onChange={event => {setTimeFilterEnabled(event.target.checked)}}></input>
				<label for="chkEnableTimeFilter"> Enable TTime Filter:</label><br></br>
				<div className={timeFilterEnabled ? "timeFilterPanal_active" : "timeFilterPanal_inactive"}>
					<YearMonthPicker />
					<YearMonthPicker />
				</div>
			</div>
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
								<td>
									<div className="menu-dot">
										<SlOptionsVertical onClick={() => toggleMenu(row.epoch)}></SlOptionsVertical>
									</div>
									{openMenuId === row.epoch && (
										<div ref={menuRef}style={{
																	position: "absolute",
																	background: "#fff",
																	border: "1px solid #ccc",
																	padding: "1px",
																	borderRadius: "5px",}}>
											<p className="menu-item" onClick={() => handleClick_explore(row.epoch)}>View</p>
											<p className="menu-item" onClick={() => alert(`Delete `)}>Delete</p>
										</div>)}
								</td>
							</tr>
						)) : <></>}
				</tbody>
			</table>
			<button onClick={onClickFirstSet} className="tableNavControlBtn">{"<<"}</button>
			<button onClick={onClickPrevious} className="tableNavControlBtn">{"< Back"}</button>
			<button onClick={onClickNext} className="tableNavControlBtn">{"Next >"}</button>
			<div><button onClick={onClickDebug} >{"DEBUG"}</button></div>
		</div>
	)
}

export default MainExplorer