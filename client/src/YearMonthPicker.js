import React, { useState } from "react";

function YearMonthPicker(props) {

	const months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];

	const _year = ((props != null) && (props.initDate != null)) ? props.initDate.year : new Date().getFullYear()-5;
	const _month = ((props != null) && (props.initDate != null)) ? months[props.initDate.month] : months[0];

	const [filterDate, setFilterDate] = useState({
		year: _year,
		month: _month,
	});

	const handleYearChange = (event) => {
		setFilterDate({ ...filterDate, year: event.target.value });
		props.onChange(filterDate);
	};

	const handleMonthChange = (event) => {
		console.log(event.target.value);
		setFilterDate({ ...filterDate, month: event.target.value });
		props.onChange(filterDate);
		};

	return (
		<div>
			<label htmlFor="txtYear">Year:</label>
			<input type="text" id="fname" name="txtYear" value={filterDate.year} style={{ width: "50px", marginLeft: "8px" }} onChange={handleYearChange}></input>
			<label htmlFor="lstMonth" style={{ margin: "0 8px 0 15px" }}>Month:</label>
			<select name="lstMonth" id="cars" value={filterDate.month} onChange={handleMonthChange}>
				{months.map((month, index) => {
					return <option key={index} value={month}>{month}</option>;
				})}
			</select>
		</div>
	);
}

export default YearMonthPicker;
