
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
		this.metadata = null;
	}
	
	async checkDatabaseExists(databaseId)
	{
		const { resources: databases } = await this.client.databases.readAll().fetchAll();
		
		// Check if the database with the given ID exists
		const databaseExists = databases.some(db => db.id === databaseId);
		return databaseExists;
	}
	
	// Function to count items in the container
	async getContainerItemCount() 
	{
		const querySpec = {
			query: "SELECT VALUE COUNT(1) FROM c"
		};

		const { resources: results } = await this.container.items.query(querySpec).fetchAll();
		return results[0] || 0; // The count will be in the first (and only) item in results
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
		
		const containerDefinition = {
			id: this.collectionId,
			partitionKey: {
				paths: ["/year", "/month"],
				version: 2, /*PartitionKeyDefinitionVersion.V2*/
				kind: "MultiHash",/*PartitionKeyKind.MultiHash*/
			},
		}
		const responseContainer = await this.database.containers.createIfNotExists(containerDefinition);
		this.container =  responseContainer.container;
		console.log('Container Created ${this.container}');
		const itemCount = await this.getContainerItemCount();
		console.log(`Number of items in container "${this.collectionId}": ${itemCount}`);

		this.metadata = await this.getMetadataEntry();
		if(this.metadata == null) {
			this.metadata = await this.createMetadaataEntry();
		}
	}

	async updateMetadata(epoch) {
		var latestEpoch = this.metadata.latestepoch;
		var earliestEpoch = this.metadata.earliestepoch;
		if(latestEpoch < epoch)
			latestEpoch = epoch;
		if(earliestEpoch > epoch)
			earliestEpoch = epoch;
		if((this.metadata.latestepoch != latestEpoch) || (metadata.earliestepoch != earliestEpoch)) {
			this.metadata.latestepoch = latestEpoch;
			this.metadata.earliestepoch = earliestEpoch;
			try {
				await this.container.items.upsert(this.metadata);
			}
			catch(ex) {
				console.log("Error updating metadata ${ex.message}");
			}
		}
	}

	async createMetadaataEntry() {
		const queryEarliest = 'SELECT c.epoch FROM c WHERE c.epoch>-1 ORDER BY c.epoch ASC OFFSET 0 LIMIT 1';
		const queryLatest = 'SELECT c.epoch FROM c WHERE c.epoch>-1 ORDER BY c.epoch DESC OFFSET 0 LIMIT 1';
		try {
			if(!this.container)
			{
				throw new Error('The specified collection is not present');
			}
			const result1 = await this.container.items.query(queryEarliest);
			console.log('Query Result ${(await(result.fetchAll())).resources}');
			var res =  await result1.fetchAll();
			var earliestEpoch = 0;
			if((res.resources != null) && (res.resources.length > 0))
			{
				earliestEpoch = res.resources[0].epoch;
			}

			const result2 = await this.container.items.query(queryLatest);
			console.log('Query Result ${(await(result.fetchAll())).resources}');
			res =  await result2.fetchAll();
			var latestEpoch = 0;
			if((res.resources != null) && (res.resources.length > 0))
			{
				latestEpoch = res.resources[0].epoch;
			}
			if ((latestEpoch > 0) && (earliestEpoch > 0)) {
				const metaEntry = {
					id:"metadata",
					year:-1,
					month:-1,
					earliestepoch:earliestEpoch,
					latestepoch:latestEpoch,
				};
				const resp = await this.container.items.create(metaEntry);
				return metaEntry;
			}
		}
		catch(ex)
		{
			console.log('The metadata creation failed ${ex.message}');
			return null;
		}
	}
	
	async addProduct(product)
	{
		try
		{
			const resp = await this.container.items.create(product);
			await this.updateMetadata(product.epoch);
			console.log('In the addProduct ${JSON.stringify(resp.body)}');
			return resp.resource;
		}
		catch(ex)
		{
			return 
			{
				Message: 'The item creation failed ${ex.message}'
			}
			return null;
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
	
	async getMetadataEntry() {
		if(this.metadata != null)
			return this.metadata;

		const query = 'SELECT * FROM c WHERE c.id = "metadata"';
		try
		{	
			if(!this.container)
			{
				throw new Error('The specified collection is not present');
			}
			const result = await this.container.items.query(query);
			console.log('Query Result ${(await(result.fetchAll())).resources}');
			var res =  await result.fetchAll();
			if((res.resources != null) && (res.resources.length > 0))
			{
				var metadata = res.resources[0];
				return metadata;
			}
			else{
				return null;
			}
		}
		catch(ex)
		{
			return({
				Message: 'Read oOperation failed',
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

	async getRecordsForMonth(year, month)
	{
		try
		{
			// SQL query to fetch records
			const querySpec = {
				query: "SELECT * FROM c WHERE c.year = @year AND c.month = @month",
				parameters: [
					{ name: "@year", value: year },
					{ name: "@month", value: month },
				],
			};

			const { resources: records } = await this.container.items
											.query(querySpec, {
											partitionKey: [year, month], // Hierarchical partition key
											})
											.fetchAll();

			console.log(`Retrieved ${records.length} records for ${year}-${month}`);
			return records;
		}
		catch (error)
		{
			console.error("Error retrieving records:", error.message);
			throw new Error("Failed to retrieve records");
		}
	}

	async getRecordForEpoch(epoch)
	{
		try
		{
			// SQL query to fetch records
			const querySpec = {
				query: "SELECT * FROM c WHERE c.epoch = @epoch",
				parameters: [
					{ name: "@epoch", value: epoch },
				],
			};

			const { resources: records } = await this.container.items
											.query(querySpec)
											.fetchAll();

			console.log(`Retrieved ${records.length} records for ${epoch}`);
			return records;
		}
		catch (error)
		{
			console.error("Error retrieving records:", error.message);
			throw new Error("Failed to retrieve records");
		}
	}

}


module.exports = DataAcecss;