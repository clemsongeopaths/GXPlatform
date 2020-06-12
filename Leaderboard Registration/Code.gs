/***************************************/
// Start initializing our variables... 
var leaderBoardSheetId = '<Google Sheet ID>'; 
var activityLinksSheetId = '<Google Sheet ID>';
var activityQueryName = "";
var activityQueryLink = "";
var geopathsAdminEmail = "mail@mail.domain";
var alreadyRegistered = false;

var formName = 'form';

var userNameEmail = Session.getActiveUser().getEmail(); 
var leadBoardName;
        
// Leaderboard data that we might need to populate fields.
var leaderBoardData = SpreadsheetApp 
        .openById(leaderBoardSheetId)
        .getActiveSheet()
        .getDataRange()
        .getValues();
        
// List of activity forms and the links to get to them
var activityLinks = SpreadsheetApp 
        .openById(activityLinksSheetId)
        .getActiveSheet()
        .getDataRange()
        .getValues();
        
                      
// Class List. These will be used as selector options in the HTML form.
var classList = [];
// Current userName.
var userName = userNameEmail.split("@")[0];
// CSS Display property will equal: none or inline.
var nameDisplay = "none";
//leaderboard Data to use in the form if already registered.
var nameData = {};

// Is user listed in leaderboard already.                      
var nameMatch = false;
// Status message to be displayed.
var nameMsg = "Please, fill out the fields above..." ;
        
// Initialize nameData with blanks so that we can just plug in the blanks to the 
// form input if the user hasn't registered already.
for(var i=0;leaderBoardData[0][i]!=null;i++) {
  nameData[leaderBoardData[0][i]] = "";     
}
       
// Add classes to the class list.
for (var i = 1; i < activityLinks.length; i++) {
// if blank, skip entry:
  if (!(activityLinks[i][0] == "")) { 
    classList.push(activityLinks[i][0]);
  }
}
    
//loop until either a match is found or all UserIDs have been checked...
for (var i=1;i<leaderBoardData.length;i++) {
  leaderBoardName = leaderBoardData[i][0].toLowerCase();
  //Logger.log("leaderBoardName = " + leaderBoardName);
  
  // If the user name is in the leaderboard table or if the email is the 
  // geopaths admin email address then just redirect to the 
  // geopaths activity form. 
  if ((userName.toLowerCase() == leaderBoardName) || (userNameEmail == geopathsAdminEmail)) { 
    formName = 'redirect';
    alreadyRegistered = true;
    //HtmlService.createTemplateFromFile('redirect').evaluate().getContent();
    break;
  }
}

/*********************************************
doGet() called on loading the web app
Uses the file 'form.html' to structure the
web app's web page

Parameters:

N/A

Effect:

creates the web page for the app using 
'register.html' for html structure

Returns:
HtmlOutput object
**********************************************/
function doGet(e) {
  //Logger.log("doGet parms = " + e.parameters.a);
  //Logger.log("doGet parms = " + e.parameters.r);
  if (e.parameters.r == 'successful') {
    return HtmlService.createTemplateFromFile('successful')
          .evaluate()
          .setTitle("Register for Leaderboard")
          .setSandboxMode(HtmlService.SandboxMode.IFRAME)
  }
  if (e.parameters.a) {
    activityQueryName = e.parameters.a + "";
    //Logger.log(activityQueryName.toLowerCase());
    for(var i=1;i<activityLinks.length;i++) {
      //Logger.log("activityLinks[i][0] = " + activityLinks[i][2].toLowerCase());
      if (activityQueryName.toLowerCase() == activityLinks[i][3].toLowerCase()) {
        activityQueryLink = activityLinks[i][4];
        //Logger.log("func: doGet -- activityQueryLink = " + activityQueryLink);
        break;
      }
    }
   
  // Use 'form.html' as a template for web page
  // This allows using gs code in scriplets
    return HtmlService.createTemplateFromFile(formName)
          .evaluate()
          .setTitle("Register for Leaderboard")
          .setSandboxMode(HtmlService.SandboxMode.IFRAME)
  }
  else {
    if (alreadyRegistered) {
      formName = 'error';
    }
    return HtmlService.createTemplateFromFile(formName)
          .evaluate()
          .setTitle("Register for Leaderboard")
          .setSandboxMode(HtmlService.SandboxMode.IFRAME)
  }
  
}

/**********************************************
function include(filename):
Inject local html content from file 'filename'

Parameters:
  filename:    The file containing the HTML you wish to include
  
Effect:
Writes the html contents of 'filename' into the current document

Returns:

N/A (void)
**********************************************/
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**********************************************
function checkForDuplicateAlias(aliasName) 

parms:
aliasName - alias name user is checking against.

Check to see if user entered duplicate alias
returns true if they did false if they didn't

returns boolean value.
**********************************************/
function checkForDuplicateAlias(aliasName) {
  var leaderBoardAlias;

  for (var i=1;i<leaderBoardData.length;i++) {
    // go through each alias to see if it's a duplicate.
    // column 2 in the leader board table is where the aliases are stored,
    // but the array starts at index 0 so we do (column - 1).
    leaderBoardAlias = String(leaderBoardData[i][1]).toLowerCase();
    if (String(aliasName).toLowerCase() == leaderBoardAlias) {
        return true;
    }
  }
  return false;
}


/**********************************************
function processForm(formData)

parms:
formData - Data submitted from the registration form.

Enter form data into the leaderboard spreadsheet.

returns nothing
**********************************************/
function processForm(formData) {

  // Put form data into variables
  var firstName = formData.firstName;
  var lastName = formData.lastName;
  var classesList = formData.classesList;
  var userId = formData.userId;
  var alias = String(formData.alias);
  
  var sheetRow = [userId,alias,firstName,lastName,classesList,'=sum(indirect("G" & row()):indirect("ZZ" & row()))'];
  
  // Assign active sheet (which there is only one in this spreadsheet) of the 
  // leaderboard Spreadsheet to a variable.
  var leaderBoardSS = SpreadsheetApp.openById(leaderBoardSheetId).getSheets()[0];
  
  // Append a row to the sheet.
  leaderBoardSS.appendRow(sheetRow);
  
  // added 08/14/2017
  //Logger.log("func: processform -- activityQueryLink = " + activityQueryLink);
  return activityQueryLink;
 /*  
  Logger.log("leaderBoardSS = " + leaderBoardSS);
  Logger.log("firstName = " + firstName);
  Logger.log("lastName = " + lastName);
  Logger.log("classesList = " + classesList);
  Logger.log("userId = " + userId);
  Logger.log("alias = " + alias);
 */
 
}