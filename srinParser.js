const { parse } = require("path");

const controller = new AbortController();

var billData = null;

function convertReceiptUrlToApi(url) {
	const parsedUrl = new URL(url);

	const invNo = parsedUrl.searchParams.get("receiptno");
	if (!invNo) {
		throw new Error("Missing 'receiptno' parameter in URL");
	}
	const hostname = parsedUrl.hostname;
	// Construct new API URL
	const apiUrl = `http://${hostname}:4021/api/Invoice/GetInvByInvNo?invNo=${encodeURIComponent(invNo)}`;
	return apiUrl;
}

function convertToEpoch(dateString, timeString)
{
  const combinedString = `${dateString} ${timeString}`;
  const date = new Date(combinedString);
  const unixEpoch = Math.floor(date.getTime() / 1000);
  return unixEpoch;
}

async function parseSrinPromUrl(obj)
{
	const url = obj.billUrl;
	if (!url) {
		throw new Error("Missing 'billUrl' in the provided object");
	}
	const apiUrl = convertReceiptUrlToApi(url);
	if (!apiUrl) {
		throw new Error("Failed to convert URL to API endpoint");	
	}
	console.log("API URL:", apiUrl);
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 5000);
	let response = null;
	try {
		response = await fetch(apiUrl, { signal: controller.signal });
		clearTimeout(timeout);
		if (!response.ok){
			response = null;
		}
		else {
			billData = {};
			const jsonString = await response.text();
			const jsonObj = JSON.parse(jsonString);
			if (jsonObj) {
				billData['metadata'] = {};
				billData.metadata.super = 's';
				billData.metadata.desc = ["#", "Item", "Description", "Qty", "Price", "Amount"];
				const strIsoDate = jsonObj.InvoiceHeader[0].RecDate;
				if (strIsoDate) {
					const dateOnly = strIsoDate.split("T")[0];
					billData.metadata.epoch = convertToEpoch(dateOnly, "00:00:01");
				}
				billData.metadata.store = "Sriyani - " + jsonObj.InvoiceHeader[0].Head3;
				billData.metadata.address = jsonObj.InvoiceHeader[0].Head2;

				const rows = [];
				billData["rows"] = rows;
				let itemCount = 0;
				jsonObj.InvoiceBody.forEach(expenseRow => {
					console.log("Expense Row:", expenseRow);
					//["1","100420","SURF EXCEL DETERGENT POWDER COMFORT 1KG","1.0","540.00","540.00"]
					const rowEntry = [];
					rowEntry.push(++itemCount);
					rowEntry.push(expenseRow.ItemCode);
					rowEntry.push(expenseRow.Descrip);
					rowEntry.push(expenseRow.Qty.toString());
					rowEntry.push(expenseRow.Price.toString());
					rowEntry.push(expenseRow.Amount.toString());
					rows.push(rowEntry);
				});

			}
			else {
				throw new Error("Invalid response format");
			}
		}
	}
	catch (error) {
		clearTimeout(timeout);
		if (error.name === 'AbortError') 
		{
			console.error('Fetch request timed out');
		}
		else
		{
			console.error('Fetch error:', error);
		}
		response = null;
	}
	return billData;
}

const SrinParser = {parseSrinPromUrl};

module.exports = SrinParser;