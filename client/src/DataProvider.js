import utils from "./utils.js";

class DataProvider {
	
	constructor(_metadata) {
		this.dbSetGetYear = 0;
		this.dbSetGetMonth = 0;
		this.cash = {};
		this.debugEpoch = Date.now();
		this.lock = false;

		this.dataSetStartEpoch = 0;
		this.dataSetEndEpoch = 0;
		this.metadata = _metadata;
	}

	static async create() {
		let _metadata = await DataProvider.fetchMetaData();
		return new DataProvider(_metadata);
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
				return entry.epoch === record.epoch;
			})
			if(existingEntries == null)
				this.cash[year][month].push(record);
		})
	}

	getValidatedSet(records) {

		return records;
	}

	decrementDBGetMonth() {
		this.dbSetGetMonth--;
		if(this.dbSetGetMonth === 0) {
			this.dbSetGetMonth = 12;
			this.dbSetGetYear--;
		}
	}

	incrementDBGetMonth() {
		this.dbSetGetMonth++;
		if(this.dbSetGetMonth === 13) {
			this.dbSetGetMonth = 1;
			this.dbSetGetYear++;
		}
	}

	sortRecords(records, ascending) {
		records.sort((a, b) => {
			return (a.epoch - b.epoch) * (ascending ? 1 : -1);
		});
	}

	async getStartingSet(setLength) {
		this.dataSetStartEpoch = 0;
		this.dataSetEndEpoch = 0;

		if(this.lock === false) {
			this.lock = true;
			let data = null;
			if((this.dbSetGetYear > 0) && (this.dbSetGetMonth > 0)) {
				this.incrementDBGetMonth();	//compensate the initial decrement at the start of the getSetBackward() call
				data = await this.getSetBackward(setLength);
			}
			return data;
		}
		return null;
	}

	async getSetBackward(setLength) {
		let recordSet = [];

		if(this.dataSetStartEpoch > 0) {
			var d = new Date(this.dataSetStartEpoch * 1000);
			this.dbSetGetMonth = d.getMonth() + 1;	//convert 0 based month
			this.dbSetGetYear = d.getFullYear();
			this.incrementDBGetMonth();
		}
		var strartEpoch = this.dataSetStartEpoch;
		while(recordSet.length < setLength) {
			this.decrementDBGetMonth();
			if(utils.ToEpoch(this.dbSetGetYear, this.dbSetGetMonth) < this.metadata.metadata.earliestepoch) 
				break;
			const data = await this.GetRecords(this.dbSetGetYear, this.dbSetGetMonth);
			const tmpRecords = this.getValidatedSet(data.records);
			var startI = 0;
			if(strartEpoch > 0) {
				for(let i = 0; i < tmpRecords.length; i++)
					if(tmpRecords[i].epoch === strartEpoch) {
						startI = i++;
						strartEpoch = 0;
						break;
					}
			}
			
			for (let i = startI; i < tmpRecords.length; i++) {
				if(recordSet.length < setLength) {
					let record = tmpRecords[i];
					//Check for duplicate
					const existingEntries = recordSet.find(entry => {
						return entry.epoch === record.epoch;
					});
					if(existingEntries == null)
						recordSet.push(record);
				}
				else {
					break;
				}
			}
		}
		var data = {};
		data.records = recordSet;
		if((recordSet != null) && (recordSet.length > 0)) {
			this.dataSetEndEpoch = recordSet[0].epoch
			this.dataSetStartEpoch = recordSet[recordSet.length - 1].epoch
		}
		this.lock = false;
		return data;
	}

	async getSetForward(setLength) {
		let recordSet = [];

		if(this.dataSetEndEpoch > 0) {
			var d = new Date(this.dataSetEndEpoch * 1000);
			this.dbSetGetMonth = d.getMonth() + 1;	//convert 0 based month
			this.dbSetGetYear = d.getFullYear();
			this.decrementDBGetMonth();
		}
		var endEpoch = this.dataSetEndEpoch;
		while(recordSet.length < setLength) {
			this.incrementDBGetMonth();
			if(utils.ToEpoch(this.dbSetGetYear, this.dbSetGetMonth) > this.metadata.metadata.latestepoch)
				break;
			const data = await this.GetRecords(this.dbSetGetYear, this.dbSetGetMonth);
			const tmpRecords = this.getValidatedSet(data.records);
			var startI = tmpRecords.length - 1;
			if(endEpoch > 0) {
				for(let i = tmpRecords.length - 1; i >= 0; i--)
					if(tmpRecords[i].epoch === endEpoch) {
						startI = i--;
						endEpoch = 0;
						break;
					}
			}
			
			for (let i = startI; i >= 0; i--) {
				if(recordSet.length < setLength) {
					let record = tmpRecords[i];
					//Check for duplicate
					const existingEntries = recordSet.find(entry => {
						return entry.epoch === record.epoch;
					});
					if(existingEntries == null)
						recordSet.push(record);
				}
				else {
					break;
				}
			}
		}
		var data = {};
		data.records = recordSet.reverse();
		if((recordSet != null) && (recordSet.length > 0)) {
			this.dataSetEndEpoch = recordSet[0].epoch
			this.dataSetStartEpoch = recordSet[recordSet.length - 1].epoch
		}
		this.lock = false;
		return data;
	}

	async GetRecords(year, month) {
		let epoch = utils.ToEpoch(year, month);
		if((this.metadata.metadata.earliestepoch > epoch) || (this.metadata.metadata.latestepoch < epoch)) {
			let data = {};
			data.records = [];
			return data;
		}
		if((this.cash[year] != null ) && (this.cash[year][month] != null)) {
			console.log(year + "/" + month + " [H]");
			var data = {};
			data.records = this.cash[year][month];
			return data;
		}
		else {
			console.log(year + "/" + month + " [M]");
			const url = "/getrecs?year=" + year + "&month=" + month;
			try {
				const response = await fetch(url); // Fetch data from the URL
				if (!response.ok) {
					throw new Error(`HTTP error! Status: ${response.status}`);
				}
				const data = await response.json(); // Convert JSON to an object
				this.sortRecords(data.records, false);
				this.updateCash(data);
				return data; // Return the data object
			} catch (error) {
				console.error('Error fetching data:', error);
				throw error; // Re-throw the error to the caller
			}
		}
	}

	static async fetchMetaData() {
		const url = "/metadata";
		try {
			const response = await fetch(url); // Fetch data from the URL
			if (!response.ok) {
				throw new Error(`HTTP error! Status: ${response.status}`);
			}
			const data = await response.json(); // Convert JSON to an object
			return data;
		} catch (error) {
			console.error('Error fetching data:', error);
			throw error; // Re-throw the error to the caller
		}
	}

	SetStartMonth(year, month) {
		this.dbSetGetMonth = month;
		this.dbSetGetYear = year
	}
}

export default DataProvider;