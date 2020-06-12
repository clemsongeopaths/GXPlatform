/**********************************************/
// Declare some variables...
var leaderBoardSheetId = '<googleSheetId>';
var userName = Session.getActiveUser().getEmail().split("@")[0].toLowerCase(); 
var leaderBoardData = SpreadsheetApp 
        .openById(leaderBoardSheetId)
        .getActiveSheet()
        .getDataRange()
        .getValues();  

/**********************************************
doGet() called on loading the web app
Uses the file 'form.html' to structure the
web app's web page

Parameters:

N/A

Effect:

creates the web page for the app using 
'formr.html' for html structure

Returns:
HtmlOutput object

**********************************************/


function doGet(e) {
  //Logger.log(e);
  // Use 'form.html' as a template for web page
  // This allows using gs code in scriplets
  return HtmlService.createTemplateFromFile('leaderboard')
        .evaluate()
        .setTitle("Geopaths Leaderboard")
        .setSandboxMode(HtmlService.SandboxMode.IFRAME)
}

/*

function for injecting local html content from file 'filename'

Parameters:

  filename:    The file containing the HTML you wish to include
  
Effect:

Writes the html contents of 'filename' into the current document

Returns:

N/A (void)

*/


function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
