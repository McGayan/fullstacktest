const DataAcecss = require('../models/dataaccess.js');
class ServiceController
{
	constructor()
	{
		this.dao = new DataAcecss();
	}
	
	async init()
	{
		await this.dao.initDbAndContainer();
	}
	
	async getRecords(request, response)
	{
		const products = await this.dao.getItems();
		console.log('In COntroller ${JSON.stringify(products)}');  
		response.send({ data: products });
	}
	
	async getRecord(request, response)
	{
		const product = await this.dao.getItem(request.params.id);
		console.log('In Controller ${JSON.stringify(product)}');  
		response.send({ data: product });
	}
	
	async getMetadata()
	{
		var metadata = await this.dao.getMetadataEntry();
		return metadata;
	}

	async deleteRecord(request, response) 
	{
		const responseMessage = await this.dao.deleteItem(request.params.id);
		response.send(responseMessage);
	}
	
	async #CheckforDuplicate(month, year, epoch) {
		let data = await this.getRecordsByMonthAndYear(year, month);
		let duplicate = false;
		data.forEach(element => {
			if(element.epoch == epoch) {
				duplicate = true;
			}
		});
	}

	async addProduct(body)
	{
		const epoch = body.metadata.epoch;
		const dateKey = this.#getYearAndMonthFromEpoch(epoch);
		let isDuplicate = this.#CheckforDuplicate(dateKey.month, dateKey.year, epoch);
		if(isDuplicate) {
			return { message: 'Duplicate Entry' };
		}
		const product = {
			epoch:body.metadata.epoch,
			year:dateKey.year,
			month:dateKey.month,
			store:body.metadata.store,
			address:body.metadata.address,
			super:body.metadata.super,
			desc:body.metadata.desc,
			expenses:body.rows,
		};
		console.log('Product ${JSON.stringify(product)}');
		let data = await this.dao.addProduct(product);
		return data
	}
	// 4.5 this method is used to update the product
	async updateProduct(request, response)
	{
		const body = request.body;
		const id = request.params.id;
		console.log('Received Body ${JSON.stringify(body)}');
		const product = {
			ProductId:body.ProductId,
			ProductName:body.ProductName,
			CategoryName:body.CategoryName,
			SubCategory:body.SubCategory,
			Description:body.Description,
			Manyfacturer:body.Manyfacturer,
			Price:body.Price
		};
		console.log('Product ${JSON.stringify(product)}');
		let data = await this.dao.updateProduct(id,product);
		response.send({ data: data });
	}

	async getRecordsByMonthAndYear(year, month)
	{
		let qResult = await this.dao.getRecordsForMonth(year, month);
		return qResult;
	}

	async getRecordByEpoch(epoch)
	{
		let qResult = await this.dao.getRecordForEpoch(epoch);
		return qResult;
	}

	#getYearAndMonthFromEpoch(epoch) {
		// Convert to milliseconds if the epoch is in seconds
		if (epoch.toString().length === 10) {
		  epoch *= 1000;
		}
	  
		// Create a Date object from the epoch
		const date = new Date(epoch);
	  
		// Extract the year and month
		const year = date.getFullYear(); // Get the year
		const month = date.getMonth() + 1; // Get the month (0-based, so add 1)
	  
		return { 'year':year, 'month':month };
	  }
}

module.exports = ServiceController;