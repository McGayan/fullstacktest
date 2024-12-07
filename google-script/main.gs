var billData = {}

function addLable() {
   const keellsLableName = "Keells"
  let keellsLable = GmailApp.getUserLabelByName(keellsLableName)
  if(keellsLable == null)
  {
    keellsLable = GmailApp.createLabel(keellsLableName)
  }
  const arpicoLableName = "Arpico"
  let arpicoLable = GmailApp.getUserLabelByName(arpicoLableName)
  if(arpicoLable == null)
  {
    arpicoLable = GmailApp.createLabel(arpicoLableName)
  }
  const threads = GmailApp.getInboxThreads();
  threads.forEach((thread) => {
    let name = thread.getFirstMessageSubject()
    if(name.toLowerCase().includes("keells"))
    {
      thread.addLabel(keellsLable)
      thread.moveToArchive()
    }
    else if(name.toLowerCase().includes("arpico"))
    {
      thread.addLabel(arpicoLable)
      thread.moveToArchive()
    }
  })
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

function convertToEpoch(dateString, timeString)
{
  const combinedString = `${dateString} ${timeString}`;
  const date = new Date(combinedString);
  const unixEpoch = Math.floor(date.getTime() / 1000);
  return unixEpoch;
}

function Trim(str, regExPattern)
{
  var result;
  if (typeof str === 'string') 
  {
    result = str.replace(regExPattern, '');
    return result;
  }
  else
  {
    return false;
  }
}

function extractTableRowCellValues(strRow)
{
	strRow = Trim(strRow, /\s*<tr>\s*/g);
	strRow = Trim(strRow, /\s*<\/tr>\s*/g)
	const cellArr = strRow.split("</td>");
	const retArr = [];
	for(i=0; i<cellArr.length; i++)
	{
		let cellData = Trim(cellArr[i], /\s*<td>/g);
		cellData = removeTagsFromValueString(cellData);
    if(cellData.length > 0)
		  retArr.push(cellData);
	}
	return retArr;
}

function parseIfDescriptionTable(table)
{
  //check if the header contains <th> row. If not this is now the correct table
  var headerEntryPattern = /<th[\s\S]*?>[\s\S]*?<\/th>/gi;
  var matches = table.match(headerEntryPattern);
  var descriptions = [];
  var rows = [];
  var metadata = {};
  if(matches && matches.length > 0)
  {
    var valuePattern = />[\s\S]+?</gi;
    for (var i = 0; i < matches.length; i++)
    {
      var strValue= matches[i].match(valuePattern);
      var strColTitle = removeTagsFromValueString(strValue[0]);
      descriptions.push(strColTitle);
    }
    var tableRowPattern = /<tr[\s\S]*?>[\s\S]+?<\/tr>/gi;
    matches = table.match(tableRowPattern);
    for (var i = 0; i < matches.length; i++)
    {
      var dataEntryPattern = /<td[\s\S]*?>[\s\S]*?<\/td>/gi;
      var dataEntryMatches = matches[i].match(dataEntryPattern);
      if(dataEntryMatches == null) continue;
      var rowEntry = [];
      let descriptionIndex = 0;
      for (var j = 0; j < dataEntryMatches.length; j++)
      {
        var strDataEntry = dataEntryMatches[j];
        var dataMatches = strDataEntry.match(valuePattern);
        if (dataMatches.length > 0)
        {
          let strData = removeTagsFromValueString(dataMatches[0]);
          rowEntry.push(strData);
        }
      }
      rows.push(rowEntry);
    }
    billData["rows"] = rows;
    if(billData.metadata == null) billData.metadata = {};
    billData['metadata'].desc = descriptions;
  }
  else
  {
    if(table.includes("Bill Date"))
    {//This is the table containing bill metadata
      //get transaction date/time info
      var tableRowPattern = /<tr[\s\S]*?>[\s\S]+?<\/tr>/gi;
      matches = table.match(tableRowPattern);
      for (var i = 0; i < matches.length; i++)
      {
        var tmpStr = matches[i];
        if(tmpStr.includes("Bill Date"))
        {
          var dataPattern = /\d{2}-[a-zA-Z]{3}-20\d{2}/gi;
          var dateMatches = tmpStr.match(dataPattern);
          if(dateMatches.length > 0)
          {
            metadata["date"] = dateMatches[0];
          }
        }
        else if(tmpStr.includes("Billed Time"))
        {
          var dataPattern = /\d{2}:\d{2}:\d{2}/gi;
          var dateMatches = tmpStr.match(dataPattern);
          if(dateMatches.length > 0)
          {
            metadata["time"] = dateMatches[0];
          }
        }
        else if(tmpStr.includes("Billed Store"))
        {
          let cellDataArr = extractTableRowCellValues(tmpStr);
          if(cellDataArr.length > 0)
          {
            metadata["store"] = cellDataArr[cellDataArr.length - 1];
          }
        }
        else if(tmpStr.includes("Store Address"))
        {
          let cellDataArr = extractTableRowCellValues(tmpStr);
          if(cellDataArr.length > 0)
          {
            metadata["address"] = cellDataArr[cellDataArr.length - 1];
          }
        }}
      if(billData.metadata == null) billData.metadata = {};
      billData["metadata"].epoch = convertToEpoch(metadata.date, metadata.time);
      billData["metadata"].store = metadata.store;
      billData["metadata"].address = metadata.address;
    }
  }
  return true;
}

function logInDrive(msgBody, fileName)
{
  //Logger.log(msgBody)
  // Define the file name
  // Create a new text file in Google Drive
  var file = DriveApp.createFile(fileName, msgBody, MimeType.PLAIN_TEXT);
}

function getKeelsMails() {
  addLable();
  const keellsLableName = "Keells"
  let keellsLable = GmailApp.getUserLabelByName(keellsLableName)
  const threads = keellsLable.getThreads()
  threads.forEach((thread) => {
    const messages = thread.getMessages()
    for(msgIndex=0; msgIndex<messages.length; msgIndex++)
    {
      let message = messages[msgIndex];
      if(message.isUnread())
      {
        let msgBody = message.getBody()
        //Log message body in Drive
        //logInDrive(msgBody, "keells.txt");
        var tablePattern = /<table[\s\S]*?>[\s\S]*?<\/table>/gi;
        // Find all matches
        var matches = msgBody.match(tablePattern);
        if (matches)
        {
          for (var i = 0; i < matches.length; i++)
          {
            parseIfDescriptionTable(matches[i])
          }
          billData.metadata.super = "k"
          Logger.log(JSON.stringify(billData))
          postBillDataToAzure();
          message.markRead();
          break;  //skip the rest of the messages in this thread
        }
        else
        {
          Logger.log("No tables found.");
        }
      }
     }
  })
}

function postBillDataToAzure()
{
  const apiUrl = "https://mcx.azurewebsites.net/exprec";
  const options = {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(billData)
  };
  try
  {
    const response = UrlFetchApp.fetch(apiUrl, options);

    Logger.log("Response Code: " + response.getResponseCode());
    Logger.log("Response Body: " + response.getContentText());
  }
  catch (error)
  {
    // Handle any errors
    Logger.log("Error: " + error.message);
  }
}

function parseArpicoMails()
{
  const lableName = "arpico"
  let lable = GmailApp.getUserLabelByName(lableName)
  const threads = lable.getThreads()
  threads.forEach((thread) => {
    const messages = thread.getMessages()
    for(msgIndex=0; msgIndex<messages.length; msgIndex++)
    {
      let message = messages[msgIndex];
      if(message.isUnread())
      {
        let msgBody = message.getBody()
        //Log message body in Drive
        //logInDrive(msgBody, "keells.txt");
        var hrefPattern = /<a\s+href([^>]*)>/gi;
        // Find all matches
        var matches = msgBody.match(hrefPattern);
        if (matches)
        {
          for (var i = 0; i < matches.length; i++)
          {
            Logger.log(matches[i]);
            if(matches[i].includes("ebill"))
            {
              billData = {};
              var urlPattern = /"([^"]*)"/gi;
              var urlMatches = matches[i].match(urlPattern);
              if (urlMatches.length > 0)
              {
                  billData.metadata = {};
                  billData.metadata.super = "a";
                  billData.billUrl = urlMatches[0].replace(/^\s*\"|\"\s*$/g, ''); //replace leading and trailing spaces and the double quots
                  //postBillDataToAzure();

                  Logger.log(JSON.stringify(billData));
                  break;
              }
            }
          }
        }
      }
    }
  })
}