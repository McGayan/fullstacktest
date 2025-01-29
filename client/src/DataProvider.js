class DataProvider {
	
	constructor() {
		console.log("Constructor-");
		this.currentYear = 0;
		this.currentMonth = 0;
		this.startMonth = 0;
		this.startYear = 0;
		this.endMonth = Number.MAX_VALUE;
		this.endYear = Number.MAX_VALUE;
		this.cash = {};
		this.debugEpoch = Date.now();
		this.lock = false;
		this.residualSet = [];
		this.backFrameStack = [];
	}

	updateCash(data) {
		if(data == null) return;
		data.records.forEach(record => {
			const year = record.year;
			const month = record.month;
			if(this.cash[year] == null) {
				this.cash[year] = {};
			}
			if(this.cash[year][month] == null) {
				this.cash[year][month] = [];
			}
			const existingEntries = this.cash[year][month].find(entry => {
				return entry.epoch == record.epoch;
			})
			if(existingEntries == null)
				this.cash[year][month].push(record);
		})
	}

	SetStartDate(year, month) {
		this.startMonth = month;
		this.startYear = year
	}

	SetEndDate(year, month) {
		this.endMonth = month;
		this.endYear = year
	}

	getValidatedSet(records) {
		return records;
	}

	decrementCurrentDate() {
		this.currentMonth--;
		if(this.currentMonth == 0) {
			this.currentMonth = 12;
			this.currentYear--;
		}
		console.log(this.currentYear + "/" + this.currentMonth);
	}

	incrementCurrentDate() {
		this.currentMonth++;
		if(this.currentMonth == 13) {
			this.currentMonth = 1;
			this.currentYear++;
		}
		console.log(this.currentYear + "/" + this.currentMonth);
	}

	sortRecords(records, ascending) {
		records.sort((a, b) => {
			return (a.epoch - b.epoch) * (ascending ? 1 : -1);
		});
	}

	getFrameSet(frame) {
		let set = frame.map(entry => {
			const monthSet = this.cash[entry.year][entry.month];
			for(let i=0; i<monthSet.length; i++) {
				if(monthSet[i].epoch === entry.epoch)
					return monthSet[i];
			}
		})
		let data = {};
		data.records = set;
		return data;
	}

	async getStartingSet(setLength) {
		this.residualSet = [];
		if(this.lock == false) {
			this.lock = true;
			let data = null;
			if((this.startYear > 0) && (this.startMonth > 0)) {
				this.currentYear = this.startYear;
				this.currentMonth = this.startMonth;
				this.incrementCurrentDate();	//compensate the initial decrement at the start of the getSetBackward() call
				data = await this.getSetBackward(setLength);
			}
			return data;
		}
		return null;
	}

	async getSetBackward(setLength) {
		let recordSet = this.residualSet;
		this.residualSet = [];
		while(recordSet.length < setLength) {
			this.decrementCurrentDate();
			const data = await this.GetRecords(this.currentYear, this.currentMonth);
			const tmpRecords = this.getValidatedSet(data.records);
			this.sortRecords(tmpRecords, false);
			for (var i = 0; i < tmpRecords.length; i++) {
				if(recordSet.length < setLength) {
					recordSet.push(tmpRecords[i]);
				}
				else {
					this.residualSet.push(tmpRecords[i]);
				}
			}
		}
		var data = {};
		data.records = recordSet;
		this.lock = false;
		return data;
	}

	async getSetForward(setLength) {
		let recordSet = this.residualSet;
		this.residualSet = [];
		while(recordSet.length < setLength) {
			this.incrementCurrentDate();
			const data = await this.GetRecords(this.currentYear, this.currentMonth);
			const tmpRecords = this.getValidatedSet(data.records);
			this.sortRecords(tmpRecords, true);
			for (var i = 0; i < tmpRecords.length; i++) {
				if(recordSet.length < setLength) {
					recordSet.push(tmpRecords[i]);
				}
				else {
					this.residualSet.push(tmpRecords[i]);
				}
			}
		}
		var data = {};
		data.records = recordSet;
		this.lock = false;
		return data;
	}

	async GetRecords(year, month) {
		if((this.cash[year] != null ) && (this.cash[year][month] != null)) {
			var data = {};
			data.records = this.cash[year][month];
			return data;
		}
		else {
			const url = "/getrecs?year=" + year + "&month=" + month;
			try {
				const response = await fetch(url); // Fetch data from the URL
				if (!response.ok) {
					throw new Error(`HTTP error! Status: ${response.status}`);
				}
				const data = await response.json(); // Convert JSON to an object
				this.updateCash(data);
				return data; // Return the data object
			} catch (error) {
				console.error('Error fetching data:', error);
				throw error; // Re-throw the error to the caller
			}
		}
	}
	async GetPreviousMonthRecord() {
		this.decrementCurrentDate();
		const data = await this.GetRecords(this.currentYear, this.currentMonth);
		return data;
	}
}

export default DataProvider;