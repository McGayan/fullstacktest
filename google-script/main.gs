var billData = {}

function addKeellsLable() {
  const threads = GmailApp.getInboxThreads();
  const keellsLableName = "Keells"
  let keellsLable = GmailApp.getUserLabelByName(keellsLableName)
  if(keellsLable == null)
  {
    keellsLable = GmailApp.createLabel(keellsLableName)
  }

  threads.forEach((thread) => {
    let name = thread.getFirstMessageSubject()
    if(name.toLowerCase().includes("keells"))
    {
      thread.addLabel(keellsLable)
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
    Logger.log("correct one found. header length: " + matches.length);
    var valuePattern = />[\s\S]+?</gi;
    for (var i = 0; i < matches.length; i++)
    {
      var strValue= matches[i].match(valuePattern);
      var strColTitle = removeTagsFromValueString(strValue[0]);
      Logger.log(strColTitle);
      descriptions.push(strColTitle);
    }
    var tableRowPattern = /<tr[\s\S]*?>[\s\S]+?<\/tr>/gi;
    matches = table.match(tableRowPattern);
    for (var i = 0; i < matches.length; i++)
    {
      var dataEntryPattern = /<td[\s\S]*?>[\s\S]*?<\/td>/gi;
      var dataEntryMatches = matches[i].match(dataEntryPattern);
      if(dataEntryMatches == null) continue;
      var rowEntry = {};
      let descriptionIndex = 0;
      for (var j = 0; j < dataEntryMatches.length; j++)
      {
        var strDataEntry = dataEntryMatches[j];
        var dataMatches = strDataEntry.match(valuePattern);
        if (dataMatches.length > 0)
        {
          let strData = removeTagsFromValueString(dataMatches[0]);
          rowEntry[descriptions[descriptionIndex++]] = strData
        }
      }
      rows.push(rowEntry);
    }
    billData["rows"] = rows;
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
        /*else if(tmpStr.includes("Billed Store"))
        {
          var dataPattern = /\d{2}:\d{2}:\d{2}/gi;
          var dateMatches = tmpStr.match(dataPattern);
          if(dateMatches.length > 0)
          {
            metadata["store"] = dateMatches[0];
          }
        }
        else if(tmpStr.includes("Billed Address"))
        {
          var dataPattern = /\d{2}:\d{2}:\d{2}/gi;
          var dateMatches = tmpStr.match(dataPattern);
          if(dateMatches.length > 0)
          {
            metadata["address"] = dateMatches[0];
          }
        }*/
      }
      const newMeta = {epoch:convertToEpoch(metadata.date, metadata.time)}
      billData["metadata"] = newMeta;
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
  addKeellsLable();
  const keellsLableName = "Keells"
  let keellsLable = GmailApp.getUserLabelByName(keellsLableName)
  const threads = keellsLable.getThreads()
  threads.forEach((thread) => {
    const messages = thread.getMessages()
    //Logger.log(firstMsg.)
    messages.forEach((message) => {
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
          Logger.log(JSON.stringify(billData))
        }
        else
        {
          Logger.log("No tables found.");
        }
        message.markRead();
      }
     }
    )
  })
}

function testFunction() {
  let table = [];
  table["hello"] = "world";
  table[1] = 10;

  Logger.log(table["hello"]);
  Logger.log(table[1]);
}

function testPost() {
  var url = "http://mcgayan.kesug.com/testpost.php";
  var options = {
    "method": "post",
    "headers": {
     "Authorization": "Basic " + Utilities.base64Encode(" ...account.SID... : ...auth.token... ")
    },
    "payload": {
      "From": "+12025551212",
      "To": "+14155551212",
      "Body": "Test from Google Apps Script"
    }
  };
  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  var content = response.getContent();
  var headers = response.getHeaders();
  var contentText = response.getContentText();
  var str = response.toString();
  Logger.log(contentText);
}

function sendData() {
  var url = "mcgayan.kesug.com/hello.html"; // Replace with your PHP script URL
  var payload = {
    name: "John Doe",
    age: 30,
    city: "New York"
  };
  
  var options = {
    "method" : "get",
    "contentType" : "application/json",
    "payload" : JSON.stringify(payload)
  };
  
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
}

function sendToThingSpeak() {
  var url = 'https://api.thingspeak.com/update';
  var apiKey = '6O0OEFM8LZ2RYXE5'; // Replace with your ThingSpeak Write API Key
  
  // Example string values to send
  var field1Value = 'Hello';
  var field2Value = 'World';
  
  var payload = {
    'api_key': apiKey,
    'field3': field1Value,
    'field4': field2Value
  };
  
  var queryString = Object.keys(payload).map(function(key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(payload[key]);
  }).join('&');
  
  var response = UrlFetchApp.fetch(url + '?' + queryString);
  Logger.log(response.getContentText());
}