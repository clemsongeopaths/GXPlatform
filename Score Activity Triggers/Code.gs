/**********************************************
Global variables used throughout this script...
**********************************************/
var formLinksSheetId = '<Google Sheet ID>';
var leaderboardSheetId = '<Google Sheet ID>';
var testSpreadsheetId = '<Google Sheet ID>'

var spreadsheetRange = SpreadsheetApp
        .openById(formLinksSheetId)
        .getActiveSheet()
        .getDataRange();

var formLinksData = SpreadsheetApp
        .openById(formLinksSheetId)
        .getActiveSheet()
        .getDataRange()
        .getValues();
        
var leaderboardSpreadsheetRange = SpreadsheetApp
    .openById(leaderboardSheetId)
    .getActiveSheet()
    .getDataRange();

/**********************************************
doGet() called on loading the web app
Uses a HTML file to structure the
web app's web page

Parameters:
N/A

Effect:
creates the web page for the app using a
HTML file for html structure

Returns:
HtmlOutput object

**********************************************/
function doGet(e) {
  //Logger.log(e);
  
  // Get this form ready for the user to modify
  setUpForm();
  
  
  // Use 'score.html' as a template for web page
  // This allows using gs code in scriplets
    return HtmlService.createTemplateFromFile('score')
          .evaluate()
          .setTitle("Set triggers for scoring forms")
          .setSandboxMode(HtmlService.SandboxMode.IFRAME)
}


/***********************************************
function for injecting local HTML content from a HTML file

Parameters:
  filename:    The file containing the HTML you wish to include
  
Effect:
Writes the HTML contents of the <filename> into the current document

Returns:
N/A (void)

************************************************/
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


/************************************************
************************************************/
function setUpForm() {
  var userNameEmail = Session.getActiveUser().getEmail();
  var userName = userNameEmail.split("@")[0];
  
}

/************************************************
************************************************/
function openFormSubmitTrigger(sheetId) {
  var spreadsheet = null;
  var triggerFound = false;
  
  //Logger.log("sheetId = " + sheetId);
  spreadsheet = SpreadsheetApp.openById(sheetId);
  var triggerList = ScriptApp.getUserTriggers(spreadsheet);
    
  triggerList.forEach(function(trigger) {
    if (trigger.getHandlerFunction() == "formSubmitClosed") {
      ScriptApp.deleteTrigger(trigger);
    }
    else if (trigger.getHandlerFunction() == "formSubmitOpen") {
      // Trigger already exists.
      triggerFound = true;
    }
  });
   
  if (!triggerFound) {
    // Create the trigger that allows people to submit answers.
    ScriptApp.newTrigger("formSubmitOpen").forSpreadsheet(sheetId).onFormSubmit().create();
  }
  return true;
}


/************************************************
************************************************/
function closeFormSubmitTrigger(sheetId) {
  var spreadsheet = null;
  var triggerFound = false;
  
  //Logger.log("sheetId = " + sheetId);
  spreadsheet = SpreadsheetApp.openById(sheetId);
  var triggerList = ScriptApp.getUserTriggers(spreadsheet);
  
  triggerList.forEach(function(trigger) {
    if (trigger.getHandlerFunction() == "formSubmitOpen") {
      ScriptApp.deleteTrigger(trigger);
    }
    else if (trigger.getHandlerFunction() == "formSubmitClosed") {
      // Trigger already exists.
      triggerFound = true;
    }
  });

  if (!triggerFound) {
    // Create the trigger that allows people to submit answers.
    ScriptApp.newTrigger("formSubmitClosed").forSpreadsheet(sheetId).onFormSubmit().create();
  }
  
  return false;
}


/************************************************
************************************************/
function archiveResponseSheet(sheetId, folderId) {
  var spreadsheet = null;
  var ssRange = null;
 
  try {
    spreadsheet = SpreadsheetApp.openById(sheetId);
  } 
  catch(err) {
      throw new Error(["spreadsheet with ID: \"" + sheetId + "\" couldn't be opened"]);
  }
  
  var d = new Date();
  var fileName = spreadsheet.getName() + " -- archived (" + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + ")";
  var copyOfSpreadsheet = SpreadsheetApp.create(fileName);
  var copyOfSheet = spreadsheet.getActiveSheet();


  copyOfSheet.copyTo(copyOfSpreadsheet);
  copyOfSpreadsheet.deleteActiveSheet();
  
  ssRange = spreadsheet.getActiveSheet().getDataRange();
  //Logger.log("copying spreadsheet...");
  var folder = DriveApp.getFolderById(folderId);
  var spreadsheetFile = DriveApp.getFileById(copyOfSpreadsheet.getId());
  var numRows = ssRange.getNumRows();
  
  if (numRows > 2) {
    spreadsheetFile.makeCopy(fileName, folder)
    spreadsheet.deleteRows(3, (numRows-2));
    return fileName;
  }
  else {
    throw new Error(["'" + spreadsheet.getName() + "' spreadsheet has no data"]);
  }

}

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
/**
 * Test function for Spreadsheet Form Submit trigger functions.
 * Loops through content of sheet, creating simulated Form Submit Events.
 *
 * Check for updates: https://stackoverflow.com/a/16089067/1677912
 *
 * See https://developers.google.com/apps-script/guides/triggers/events#google_sheets_events
 */
function test_onFormSubmit() {
  var dataRange = SpreadsheetApp.openById(testSpreadsheetId).getActiveSheet().getDataRange();
  var data = dataRange.getValues();
  var headers = data[0];
  var e = {};

  // This is the row and columns you want to process within the spreadsheet.
  e["range"] = {	
    "columnStart":2,
    "rowStart":4,
	"rowEnd":4,
	"columnEnd":11
  };
  
  var rStrt = e.range["rowStart"];
  var cStrt = e.range["columnStart"];
  var cEnd = e.range["columnEnd"];
  e.values = [];
  for(var j=cStrt-1; j<cEnd; j++) {
    e.values.push(data[rStrt-1][j]);     //.filter(Boolean);  // filter: https://stackoverflow.com/a/19888749
    //Logger.log("data[rStrt-1][j] = " + data[rStrt-1][j]);
  }
 
  e.namedValues = {};
  // Loop through headers to create namedValues object
  // NOTE: all namedValues are arrays.
  for (var col=cStrt-1; col<cEnd; col++) {
    e.namedValues[headers[col]] = [data[rStrt-1][col]];
  }
  e.source = SpreadsheetApp.openById(testSpreadsheetId);
  // Pass the simulated event to onFormSubmit
  formSubmitOpen(e);
}

/************************************************
************************************************/
function formSubmitOpen(e) {
  Logger.log("formSubmitOpen() is a go...");
  
  //Logger.log(JSON.stringify(e));
  var adminEmail = "admin@mail.domain";
  
  // Get the spreadsheet object provided.
  var spreadsheet = e.source;
  var spreadsheetActiveSheet = e.source.getActiveSheet();
  
  // This offset will provide us the headers (assumed to be first row) of the sheet.
  var rowHeaders = spreadsheetActiveSheet.getDataRange().offset(0, 0, 1);
  
  // What column holds the timestamps, email addresses, and names?
  var emailColumn = 0;
  var timestampColumn = 0;
  
  // Get the column of the timestamp and email address. 
  var headerColumns = rowHeaders.getValues()[0];
  
  for (var i=0;i<headerColumns.length;i++) {
    if ((headerColumns[i].toLowerCase().indexOf("email")) >= 0) {
      emailColumn = i;
    }
    if ((headerColumns[i].toLowerCase().indexOf("timestamp")) >= 0) {
      timestampColumn = i;
    }
  }
  
  // Call this function to remove all duplicate entries. Those entries that have later
  // timestamps will overwrite entries with earlier timestamps. Also this function
  // will move the answer key to the 2nd row of the sheet if it wasn't there before.
  // The function returns the answerKey if one was found.
  var answerKey = removeDuplicates(spreadsheetActiveSheet, emailColumn, timestampColumn, adminEmail);
 
  // Check for answer key.
  if (!answerKey) {
    throw "No answer key is present in the activity sheet - " + spreadsheet.getName();
  }


///////////////////////////////////////////////////////////////////////////////////////


  // The 2nd element of the e.values array should always be the email address.
  var userEmail = e.values[1];
  var userId = userEmail.split("@")[0];
  
  var data = spreadsheetActiveSheet.getDataRange().getValues();
  var userAnswers = null;
  
  for (i in data) {
    if (data[i][emailColumn] == userEmail) {
      userAnswers = spreadsheetActiveSheet.getDataRange().offset(i,0,1);
      //Logger.log("userAnswers = " + userAnswers.getValues()[0].join());
      break;
    }
  }

  //var submitterAnswersRange = ssRange.offset(startRow,0,1)
  
  //Logger.log("submitterAnswersRange = " + submitterAnswersRange.getValues()[0]);
  var score = gradeUser(rowHeaders, answerKey, userAnswers);
  var ssName = getSheetName(spreadsheet);
  var columnKey = getColumnKey(spreadsheet);
  addToLeaderBoard(score, userId, ssName, columnKey);
}

/************************************************
************************************************/
function formSubmitClosed(e) {
  Logger.log("formSubmitClosed() is a go...");
  var spreadsheet = e.source.getActiveSheet()

  // The form is closed. Delete the submission.
  //spreadsheet.deleteRow(spreadsheet.getLastRow());

}


/************************************************
************************************************/
function gradeUser(headers, answers, submitted) {
  Logger.log("Grading User...");
  //Logger.log("answers = " + submitted.getValues());
  var correctAnswerColor = "#e6ffee";  // The answer cell will be shaded with this color if the answer is correct.
  var wrongAnswerColor = "#ffe6e6";    // The answer cell will be shaded with this color if the answer is incorrect.
  var notAQuestionColor = "#ffffff";   // If the column header isn't this color then it's a question.
  var questionColumnArray = [];        // String array of columns that contain questions.
  var pointsPerQuestion = 45;          // Each correct answer is worth this many points.
  var totalScore = 0;                  // The tally for all the answers.
  
  
  for (var i=1;i<=headers.getLastColumn();i++) {
    //Logger.log("headers.getCell(1,i).getBackground() = " + headers.getCell(1,i).getBackground());
    // Is the header background a different color besides white. If yes it's a question we need to grade.
    if (headers.getCell(1,i).getBackground() != "#ffffff") {
      //Logger.log("This is a question: " + headers.getCell(1,i).getValue());
      var scored = scoreQuestion(answers.getCell(1,i), submitted.getCell(1,i))
      //Logger.log("scored = " + scored);
      // check for return value (boolean or numbervalue) to see if answer is correct.
      if (typeof(scored) == "boolean") {
        //Logger.log("scored is not a number.");
        if (scored) {
          totalScore += pointsPerQuestion;
          submitted.getCell(1,i).setBackground(correctAnswerColor);
        }
        else {
          submitted.getCell(1,i).setBackground(wrongAnswerColor);
        }
      }
      else {
        //Logger.log("scored IS a number!");
        totalScore += scored;
      }
    }
  }
  return totalScore;
}


/************************************************
************************************************/
function scoreQuestion (answerKeyCell, submittedAnswerCell) {
  Logger.log("scoreQuestion()... ");
  var answerKeyValue = answerKeyCell.getValue();               // Get the value stored in that sheet cell.
  var submittedAnswerValue = submittedAnswerCell.getValue();   // Get the value stored in that sheet cell.
  var answerParm = checkForAnswerParm(answerKeyValue);         // 
  
  // Is there an answer parm on how to treat the answers?
  // If no...
  if (answerParm.type == "") {
    // Do answers match?
    if (answerKeyValue == submittedAnswerValue) 
      return true;
    else 
      return false;
  }
  // If yes...
  else {
    //Logger.log("answerParm.type = " + answerParm.type);
    switch (answerParm.type) {
      case "range" :
        return answerParm.check(answerParm.hiRange, answerParm.lowRange, submittedAnswerValue)
        break;
      case "text" :
        return answerParm.check(submittedAnswerValue);
        break;
      case "score" : 
        return answerParm.check(submittedAnswerValue);
    }
  }
}


/************************************************
************************************************/
function checkForAnswerParm(answerKeyValue) {
  Logger.log("checkForAnswerParm()...");
  var answerParm = {"type": ""};
  var leftBracketPosition = answerKeyValue.indexOf("[");
  var rightBracketPosition = answerKeyValue.indexOf("]");
  
  // Is there a starting bracket and ending bracket in the answer key value?
  
  if ((leftBracketPosition >= 0) && (rightBracketPosition >= 0)) {
    var tempParm = answerKeyValue.slice(leftBracketPosition+1,rightBracketPosition).toLowerCase().split(" ");
    //Logger.log("tempParm = " + tempParm);
   
    switch (tempParm[0]) {
      case "range" :
        answerParm.type = tempParm[0];
        answerParm.lowRange = parseFloat(tempParm[1]);
        answerParm.hiRange = parseFloat(tempParm[2]);
        answerParm.check =  
          function (hiValue, lowValue, answerNum) {
            var floatNumber = parseFloat(answerNum);
            if (floatNumber != "NaN") {
              if ((floatNumber <= hiValue) && (floatNumber >= lowValue))
                return true;
              else
                return false;
              }
            else {
              return false;
            }
          }
        break;
      case "text"  :
        answerParm.type = tempParm[0];
        answerParm.check =  
          function (answerStr) {
            if (answerStr != "") 
              return true;
            else
              return false;
          }
        break;
      case "score" : 
        answerParm.type = tempParm[0];
        answerParm.maxScore = parseInt(tempParm[1]);
        answerParm.check =  
          function (answerStr) {
            var score = parseInt(answerStr);
            if ((score == "NaN") || (score > answerParm.maxScore))
              score = 0;
            
            return score;
          }
        break;
    }
  }
  return answerParm;
}

/************************************************
************************************************/
function gradeAllUsers(sheetId) {
  Logger.log("Grading users for sheet: " + sheetId);
  
  // Administrator Email
  var adminEmail = "admin@mail.domain";
  
  // Get the spreadsheet object provided.
  var spreadsheet = null;
  var spreadsheetActiveSheet = null;  //e.source.getActiveSheet();
 
  try {
    spreadsheet = SpreadsheetApp.openById(sheetId);
  } 
  catch(err) {
      throw new Error(["spreadsheet with ID: \"" + sheetId + "\" couldn't be opened"]);
  }
  
  // Get the active sheet within the spreadsheet file.
  spreadsheetActiveSheet = spreadsheet.getActiveSheet();
  
  // This offset will provide us the headers (assumed to be first row) of the sheet.
  var rowHeaders = spreadsheetActiveSheet.getDataRange().offset(0, 0, 1);
  
  // What column holds the timestamps, email addresses, and names?
  var emailColumn = 0;
  var timestampColumn = 0;
  
  // Get the column of the timestamp and email address. 
  var headerColumns = rowHeaders.getValues()[0];
  
  for (var i=0;i<headerColumns.length;i++) {
    if ((headerColumns[i].toLowerCase().indexOf("email")) >= 0) {
      emailColumn = i;
    }
    if ((headerColumns[i].toLowerCase().indexOf("timestamp")) >= 0) {
      timestampColumn = i;
    }
  }
  
  // Call this function to remove all duplicate entries. Those entries that have later
  // timestamps will overwrite entries with earlier timestamps. Also this function
  // will move the answer key to the 2nd row of the sheet if it wasn't there before.
  // The function returns the answerKey if one was found.
  var answerKey = removeDuplicates(spreadsheetActiveSheet, emailColumn, timestampColumn, adminEmail);

  
  if (!answerKey) {
    throw "No answer key is present in the activity sheet - " + spreadsheet.getName();
  }

  if (spreadsheetActiveSheet.getDataRange().getNumRows() < 3) {
    throw "There are no users to grade for the activity sheet - " + spreadsheet.getName();
  }
  
  // We can always assume that the answer key will be in row 2 so
  // we'll start the index after that.
  var numRows = spreadsheetActiveSheet.getDataRange().getNumRows();

  
  for (var i=2; i<numRows; i++) {
    // get the answer row.
    var answers = spreadsheetActiveSheet.getDataRange().offset(i,0,1);
    var userId = answers.getValues()[0][emailColumn].split("@")[0];
    var score = gradeUser(rowHeaders, answerKey, answers);
    var ssName = getSheetName(spreadsheet);
    var columnKey = getColumnKey(spreadsheet);
    addToLeaderBoard(score, userId, ssName, columnKey);
  }

}


/************************************************
************************************************/
function addToLeaderBoard(score, userId, sheetName, columnKey) {
  Logger.log("Sending to leaderboard...");
  var leaderboardValues = leaderboardSpreadsheetRange.getValues();
   
  // Go through leaderboard entries to find our user.
  for (var i=1;i<leaderboardSpreadsheetRange.getNumRows();i++) {
    // check userId for a match
    //Logger.log("leaderboardValues[i][0] = " + leaderboardValues[i][0]);
    //Logger.log("userId = " + userId);

    if(leaderboardValues[i][0] == userId) {
      //Logger.log("Found Name in leaderboard....");
      var scoreCell = "" + columnKey + (i + 1);
      //Logger.log("scoreCell = " + scoreCell);
      leaderboardSpreadsheetRange.getSheet().getRange(scoreCell).setValue(score);
      return;
    }
  }
}


/************************************************
************************************************/
function removeDuplicates(activeSheet, emailColumnCheck, timestampColumn, adminEmail) {

  Logger.log("removing duplicate entries...");

  activeSheet.getDataRange().offset(1,0).setBackground("white");
  var data = activeSheet.getDataRange().getValues(); 
  var newData = new Array();
  var answerKeyFound = false;
  var answerKey = null;
  for (i in data) {
    var row = data[i];
    var duplicate = false;
    for(j in newData) {
      //Check to see if emails are the same. If yes then it's a duplicate.
      if (row[emailColumnCheck] == newData[j][emailColumnCheck]) {
        duplicate = true;
        // If the timestamp is later than the duplicate then remove the entry 
        // from newData[] and set duplicate to false.
        if (row[timestampColumn] >= newData[j][timestampColumn]) {
          newData.splice(j,1);
          duplicate = false;
        }
      }
    }
    
    if (!duplicate) {
      if (row[emailColumnCheck] == adminEmail) {
        answerKeyFound = true;
        newData.splice(1,0,row);
      }
      else {
        newData.push(row);
      }
    }
  }
  
  activeSheet.clearContents();
  activeSheet.getRange(1,1, newData.length, newData[0].length).setValues(newData);
  
  if (answerKeyFound) {
    answerKey = activeSheet.getDataRange().offset(1,0,1);
    answerKey.setBackground("cyan");
  }
    
  return answerKey;
}

/************************************************
************************************************/
function getSheetName(ss) {
  var ssId = ss.getId();
  
  for (i=1;i<formLinksData.length;i++) {
    if (ssId == formLinksData[i][5])
      return formLinksData[i][3];
  }
}




/************************************************
************************************************/
function getColumnKey(ss) {
  var ssId = ss.getId();
  
  for (i=1;i<formLinksData.length;i++) {
    if (ssId == formLinksData[i][5])
      return formLinksData[i][1];
  }
}



