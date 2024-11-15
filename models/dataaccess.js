
//import { CosmosClient } from '@azure/cosmos';
const { CosmosClient } = require('@azure/cosmos');
//const CosmosClient = require('@azure/cosmos');
//import { appConfig } from "../appconfig/config.js";
const appConfig = require('../appconfig/config.js');

class DataAcecss
{
	constructor()
	{
		console.log("----> Connection string:" + appConfig.conneectionString);
		this.client = new CosmosClient(appConfig.conneectionString);
		this.databaseId = appConfig.databaseId;
		this.collectionId = appConfig.containerId;
	}
	
	async checkDatabaseExists(databaseId)
	{
		const { resources: databases } = await this.client.databases.readAll().fetchAll();
		
		// Check if the database with the given ID exists
		const databaseExists = databases.some(db => db.id === databaseId);
		return databaseExists;
	}
	

	async initDbAndContainer()
	{
		const exists = await this.checkDatabaseExists(this.databaseId);
		if (exists)
		{
			console.log(`Database "${this.databaseId}" exists.`);
		}
		else
		{
			console.log(`Database "${this.databaseId}" does not exist.`);
		}
		const responseDb = await this.client.databases.createIfNotExists( {id:this.databaseId});
		this.database = responseDb.database;
		console.log('Database Created ${this.database}');
		const responseContainer = await this.database.containers.createIfNotExists({id:this.collectionId});
		this.container =  responseContainer.container;
		console.log('Container Created ${this.container}');
		
	}
	
	async addProduct(product)
	{
		try
		{
			const resp = await this.container.items.create(product);
			console.log('In the addProduct ${JSON.stringify(resp.body)}');
			return resp.resource;
		}
		catch(ex)
		{
			return 
			{
				Message: 'The item creation failed ${ex.message}'
			}
		}
	}
	
	async getItems()
	{
		try
		{
			const query = 'SELECT * FROM c';
			if(!this.container)
			{
				throw new Error('The specified collection is not present');
			}
			const result = await this.container.items.query(query);
			console.log('Query Result ${(await(result.fetchAll())).resources}');
			var res =  await result.fetchAll();
			console.log('The Asybc Res = ${res.resources}');
			return res.resources;
		}
		catch(ex)
		{
			return({
				Message: 'Read oOperation failed',
				Exception: ex.message
			});
		}	 
	}
	
	async getItem(id){
		try
		{
			const record =  await this.container.item(id);
			const rec =  await record.read();
			if(rec.resource === {})
			{
				throw new Error('The item for record id as ${id} you are looking for is not avalaible.');
			}
			console.log(JSON.stringify(rec.resource));
			return rec.resource;
		}
		catch(ex)
		{
			return({
				Message: 'The item for record id as ${id} you are looking for is not avalaible.',
				Exception: ex.message
			 });
		}
	}
	async deleteItem(id)
	{
		try
		{
			const record =  await this.container.item(id).delete();
			return({
				Message: 'Item by id ${id} is deleted successfully',
				StatusCode: record.statusCode
			});
		}
		catch(ex)
		{
			return({
				Message: 'The item for record id as ${id} you are looking for is not avalaible.',
				Exception: ex.message
			});
		}
	}
	
	async updateProduct(id,product)
	{
		try
		{
			const record =  await this.container.item(id);
				let obj = {
					id:id,
					ProductId: product.ProductId,
					ProductName: product.ProductName,
					CategoryName: product.CategoryName,
					SubCategory: product.SubCategory,
					Description: product.Description,
					Price: product.Price
				};
				let result = await record.replace(obj);
				console.log('Trying to Read update ${record}');
				console.log('Status Code ${result.statusCode}');
				console.log('Resource Updated ${result.resource}');
				return result.resource;
		}
		catch(ex)
		{
			return({
				Message: 'The item for record id as ${id} you are looking for is not avalaible.',
				Exception: ex.message
			});
		}
	}
}

module.exports = DataAcecss;