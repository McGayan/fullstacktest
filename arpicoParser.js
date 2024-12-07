const controller = new AbortController();

var billData = null;
const descriptorMap = {"#": "#", "PLU": "Item", "Description": "Description", "QTY": "Qry", "Rate": "Price","Gross": "Gross", "Dis%": "Dis%", "Net Amount": "Amount"};

function convertToEpoch(dateString, timeString)
{
  const combinedString = `${dateString} ${timeString}`;
  const date = new Date(combinedString);
  const unixEpoch = Math.floor(date.getTime() / 1000);
  return unixEpoch;
}

function TrimHtmlTags(str)
{
	str = str.replace(/<[^<]*?>/gi, "")
	return str;
}

function removeTagsFromValueString(strValueMatch)
{
  var str = "";
  var i = 0;
  for (i = 0; i < strValueMatch.length; i++)
  {
    var char = strValueMatch.charAt(i);
    if(char != " " && char != ">" && char != '\r' && char != '\n')
      break;
  }
  
  var j = strValueMatch.length - 1;
  for(; j>=0; j--)
  {
    var char = strValueMatch.charAt(j);
    if(char != " " && char != "<" && char != '\r' && char != '\n')
      break;
  }
  for(var k=i; k<=j; k++)
    str += strValueMatch.charAt(k);
  return str;
}

function parseMetaData(data) {
	const dateDivPattern = /Bill Date[\s\S]*?<\/div>/gi
	var matches = data.match(dateDivPattern);
	if (matches) {
		const datePattern = /(\d{4}|\d{2})-\d{2}-\d{2}/gi;
		const dateMatches = matches[0].match(datePattern);
		if(dateMatches) {
			const date = dateMatches[0];
			billData.metadata.epoch = convertToEpoch(date, "00:00:01");
		}
	}

	//Get address
	const addressDivPattern = /Richard Pieris[\s\S]*?<\/div>/gi;
	matches = data.match(addressDivPattern)
	if(matches) {
		const strAddDiv = matches[0];
		const addPPattern = /<p[^>]*?>.+?<\/p>/gi;
		matches = strAddDiv.match(addPPattern);
		if(matches) {
			var tmpStr = matches[0];
			tmpStr = TrimHtmlTags(tmpStr)
			billData.metadata.address = tmpStr;
		}
	}
}

function parseHtml(data) {
	billData['metadata'] = {};
	billData.metadata.super = 'a';
	billData.metadata.store = "Arpico"
	parseMetaData(data)
	const tablePattern = /<table[\s\S]*?>[\s\S]*?<\/table>/gi;

	const matches = data.match(tablePattern);
	const descriptions = [];
	const rows = [];
	const metadata = [];
	if (matches) {
	  for (var i = 0; i < matches.length; i++) {
		const tableStr = matches[i];
		//console.log(tableStr);
		const headPattern = /<thead[\s\S]*?>[\s\S]*?<\/thead>/gs;
		const headMatches = tableStr.match(headPattern);
		if(headMatches)	{//This is the main table containing expenses
			const headerSer = headMatches[0];
			const thPattern = /<th\s[\s\S]*?>[\s\S]*?<\/th>/gi;
			const  thEntries = headerSer.match(thPattern)
			const valuePattern = />[\s\S]+?</gi;
			if(thEntries) {
				thEntries.forEach((entry, index) => {
					const strValue= entry.match(valuePattern);
					const strColTitle = removeTagsFromValueString(strValue[0]);
					if(descriptorMap[strColTitle] != null)
						descriptions.push(descriptorMap[strColTitle]);
				})
				if(descriptions) {
					billData['metadata'].desc = descriptions;
				}
			}

			const tBodyPattern = /<tBody[\s\S]*?>[\s\S]*?<\/tbody>/gi;
			const bodyMatches = tableStr.match(tBodyPattern);
			if(bodyMatches) {
				const bodyStr = bodyMatches[0];
				const tableRowPattern = /<tr[\s\S]*?>[\s\S]+?<\/tr>/gi;
				const rowMatches = bodyStr.match(tableRowPattern);
				if(rowMatches) {
					rowMatches.forEach((rowStr, index) => {
						const dataEntryPattern = /<td[\s\S]*?>[\s\S]*?<\/td>/gi;
						const dataEntryMatches = rowStr.match(dataEntryPattern);
						if(dataEntryMatches) {
							const rowEntry = []
							dataEntryMatches.forEach(dataEntry => {
								const dataMatches = dataEntry.match(valuePattern);
								if (dataMatches.length > 0) {
									let strData = removeTagsFromValueString(dataMatches[0]);
									rowEntry.push(strData);
								}
							})
							rows.push(rowEntry);
						}
					});
				}
				billData["rows"] = rows;
				console.log(JSON.stringify(billData));
			}
		}
	  }
	}
}

async function parseArpicoFromUrl(obj)
{
	const url = obj.billUrl;
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 5000);
	let response = null;
	try {
		response = await fetch(url, { signal: controller.signal });
		clearTimeout(timeout);
		if (!response.ok){
			//throw new Error(`HTTP error! Status: ${response.status}`);
			response = null;
		}
		else {
			billData = {};
			const htmlString = await response.text();
			parseHtml(htmlString);
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

const ArpicoParser = {parseArpicoFromUrl};

module.exports = ArpicoParser;