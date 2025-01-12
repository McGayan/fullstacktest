import React, { useState } from "react";

function YearMonthPicker(props) {
	var months = [
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

	const [filterDate, setFilterDate] = useState({
		year: new Date().getFullYear(),
		month: "Jan",
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
			<label for="txtYear">Year:</label>
			<input type="text" id="fname" name="txtYear" value={filterDate.year} style={{ width: "50px", marginLeft: "8px" }} onChange={handleYearChange}></input>
			<label for="lstMonth" style={{ margin: "0 8px 0 15px" }}>Month:</label>
			<select name="lstMonth" id="cars" onChange={handleMonthChange}>
				{months.map((month, index) => {
					return <option value={month}>{month}</option>;
				})}
			</select>
		</div>
	);
}

export default YearMonthPicker;
