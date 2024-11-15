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
	
	async deleteRecord(request, response) 
	{
		const responseMessage = await this.dao.deleteItem(request.params.id);
		response.send(responseMessage);
	}
	
	async addProduct(body)
	{
		//const body = request.body;
		console.log('Received Body ${JSON.stringify(body)}');
		const product = {
			date:body.metadata.date,
			time:body.metadata.time,
			expenses:body.rows
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
}

module.exports = ServiceController;