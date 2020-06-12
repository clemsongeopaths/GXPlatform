// cache for transferring facebook login tokens:
var cache = CacheService.getPrivateCache();


/*

doGet() called on loading the web app
Uses the file 'form.html' to structure the
web app's web page

Parameters:

N/A

Effect:

creates the web page for the app using 
'form.html' for html structure

Returns:

HtmlOutput object
*/
function doGet(e) {
  Logger.log(e);
  
  // Use 'form.html' as a template for web page
  // This allows using gs code in scriplets
    return HtmlService.createTemplateFromFile('form.html')
        .evaluate()
        .setTitle("Student Image Upload")
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

/*

processForm(form) called after submit is clicked 
on the app page. Handles saving user uploaded image
to google drive

Parameters:

  form:    a Html form object, containing informaiton submitted
           within the <form> tag of 'form.html'
           
Effect:

Uploads user selected image to Google Drive. Renames file to 
match the uploader's username, the class the uploader belongs
to, and the form that the uploader is responding to

Returns:

N/A (void)

*/
function processForm(form) {
  // CONSTANT: id for destination folder
  var FOLDER_ID = '<Google folder ID>'   // production folder
  
  // file uploaded through form:
  var fileBlob = form.fileUpload;
  // screen shot uploaded:
  var scrnBlob = form.fileGCXUpload;
  // class uploader belongs to:
  var usrClass = form.usrClass
  // form uploader is responding to:
  var respForm = form.respForm;
  // post to facebook process:
  var doFbPost = form.postToFB;
  // post to facebook caption:
  var message  = form.postCaption;
  
  // Debug: log file name, file type, and fileblob object details
  Logger.log("fileBlob name: " + fileBlob.getName())
  Logger.log("fileBlob type: " + fileBlob.getContentType())
  Logger.log("fileBlob " + fileBlob)
  
  // open folder for file upload:
  var fldr = DriveApp.getFolderById(FOLDER_ID)
  // get user information:
  var username = getUsername()
  
  // write file to drive:
  writeFile(fldr, fileBlob, scrnBlob, username, usrClass, respForm, doFbPost, message)
  
}

/*

Helper function for processForm. Gets the username
of the current app user

Parameters:

N/A

Effect:

get's the current user's username through the use of
thier email

Returns:

String containing the current user's username

*/
function getUsername() {
  
  // get's user email:
  var email = Session.getActiveUser().getEmail()
  // emails in form <username> @ mail.domain
  // split --> parse_emial = ['username','mail.com']
  var parse_email = email.split("@")
  var username    = parse_email[0]
  
  return username
}

/*

Helper function for processForm. Writes uploaded file to
google drive and renames file to match uploader's username,
class, and response form

Parameters:

  fldr:        The folder the uploaded file will be saved to. 
               This is usually the public folder given by 
               FOLDER_ID in processForm
  
  fileBlob:    The blob object that holds the file the user has
               uploaded
  
  username:    The uploader's username
  
  usrClass:    The course the user belongs to
  
  respForm:    The Geopaths form the user is responding to
  
Effect:
  
creates a new file in google drive with the uploaded file's 
information. Renames the file to include the uploader's 
username, class, and response form

Returns:

N/A (void)

*/
function writeFile(fldr, fileBlob, scrnBlob, username, usrClass, respForm, doFbPost, message) {
  
  // create file on google drive. Save the drive
  // file object and send it to be renamed to match
  // <username>_<class>_<form>.<extension> format
  if (fileBlob.getName()) {
      var drive_file = fldr.createFile(fileBlob)
      // get the file extension:
      var extension = getExtension(fileBlob)
      // rename file:
      drive_file.setName(username + "_" + usrClass + 
                     "_" + respForm + "_geoselfie." + extension);
  }
  
  // if image was uploaded:
  if (scrnBlob.getName()) {
    var drive_file_scrn = fldr.createFile(scrnBlob)
    var extension_scrn  = getExtension(scrnBlob)
  
    drive_file_scrn.setName(username + "_" + usrClass + "_" + respForm + "_screenshot." + extension);
  }
  
  // update spreadsheeet to include class:
  update_sheet(respForm, usrClass);  
  
  Logger.log("doFbPost: " + doFbPost);
  Logger.log("message:  " + message);
  if (doFbPost == 'doFbPost') {
    drive_file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.EDIT);
    var url = 'https://docs.google.com/uc?id=' + drive_file.getId();
    Logger.log('photo url: ' + url);
    fncPostItemFB(url, message);
  }
}


//////////////////////////////////////////////////////////////////////
function update_sheet(respForm, usrClass) {
  var FOLDER_ID = '<Google Production Folder ID>'    // Production Folder
  var folder = DriveApp.getFolderById(FOLDER_ID);
  var str = respForm.replace('’',"'");
  
  var fileIter = folder.getFilesByName(str);
  
  var file = -1;
  while (fileIter.hasNext()) {
    file = fileIter.next();
        Logger.log('filename = ' + file.getName());
        Logger.log('fileMimeType = ' + file.getMimeType());
    if (file.getMimeType() == 'application/vnd.google-apps.spreadsheet') {
      break;
    }
    else
      file = -1;
  }

  if (file == -1) {
    throw("file not found");
  }


  var sheet = SpreadsheetApp.open(file);
  var data  = sheet.getActiveSheet()
                   .getDataRange()
                   .getDisplayValues();
  
  // find "Class" column:
  var class_col = -1;
  for (var i=0; i < data[0].length; i++) {
    if (data[0][i] == "Class") {
      class_col = i+1;
      break;
    }
  }
  
  // if "Class" column doesn't exist, create it:
  if (class_col < 0)  {
    // insert "Class" as first column.
    sheet.getActiveSheet().insertColumnBefore(1)
    class_col = 1;
    sheet.getActiveSheet().getRange(1,class_col,1,1).setValue("Class");
  }

  // find username row:
  // Since we inserted a column we need to reload the data values
  var emailAddressColumn = getEmailAddressColumn(data);
  data = sheet.getActiveSheet()
      .getDataRange()
      .getDisplayValues();
  var usr_row = findUserRow(data, Session.getActiveUser().getEmail(), emailAddressColumn);
  Logger.log("usr_row = " + usr_row);
  Logger.log("class_col = " + class_col);
  if (usr_row) {
    var class_cell = sheet.getActiveSheet().getRange(usr_row + 1, class_col,1,1);
    class_cell.setValue(usrClass);
  }
}

////////////////////////////////////////////////////////////

function getEmailAddressColumn(data) {
  for (var i=0; i < data[0].length; i++) {
    if (data[0][i] == "Email Address") {
      return (i+1);
    }
  }
  return -1;
}

/////////////////////////////////////////////////////////////
// find username:
function findUserRow(data, key_user, emailCol) {
  // find the row of key_user:
  var key_row = 0;
  
  if (key_user.toLowerCase() == "answer_key") return 0;
  
  // The first two rows should be headers and answer_key
  for (var i=2; i < data.length; i++) {
    Logger.log("data[1][1] = " + data[1][1]);
    Logger.log("data[i][emailCol-1] = " + data[i][emailCol-1]);
    if (data[i][emailCol-1] == key_user) {
      return i;
    }
  }
  return key_row;
}

/*

Helper function for writeFile. Get's the extension of an
uploaded file by using the getContentType() method of a
Blob object

Parameters:

  fileBlob:    The blob object that contains the file uploaded
               by the user
               
Effect:

grabs the file extension of an uploaded file

Returns:

string holding the extension of the file uploaded

*/
function getExtension(fileBlob) {

  // string separated by <file description>/<extension>
  var contentType = fileBlob.getContentType()
  var parsed_content = contentType.split("/")
  var extension = parsed_content[1]
  
  return extension
}

function processFB_LogIn(fb_tkn, expTime) {
  // constant: holds information for authentication with facebook app
  var APP_ACCSS_TKN = '<Authentication token for facebook app>'; 
  
  Logger.log("processing");
  cache.put('fbTkn', fb_tkn, 4000);
  cache.put('fbExpr', expTime, 4000);
  
  var myFBtkn = cache.get('fbTkn');
  
  Logger.log("FaceBook Token: " + myFBtkn);
  
  // debugging for verifying the user actually signed in through facebook:
  // The first FB token is passed in from the URL right after the user signs in, and when this apps Script loads
  var optnGetTkn = {"method" : "get", "muteHttpExceptions" : true};
  // This 'Debugs' the token returned in the URL after the user signed in with Facebook
  var rsltDebug = UrlFetchApp.fetch("https://graph.facebook.com/debug_token?input_token="  + myFBtkn  + "&access_token=" + APP_ACCSS_TKN, optnGetTkn);
  var debugTxt = rsltDebug.getContentText();
  Logger.log("debugTxt: " + debugTxt);
  
  var jsonObj = JSON.parse(debugTxt);
  Logger.log("jsonObj: " + jsonObj);
  // This is the FB user ID
  var useIdTxt = jsonObj.data.user_id;
  cache.put('pubIDcache', useIdTxt, 4000);
  
  var tknValid = jsonObj.data.is_valid;
  
  Logger.log("reslt of the debug: " + useIdTxt);
  Logger.log("tknValid: " + tknValid); // make sure this is true
  
  var getFbUseName = UrlFetchApp.fetch("https://graph.facebook.com/" + useIdTxt + "/?fields=first_name&access_token=" + APP_ACCSS_TKN, optnGetTkn);

  var objUseName = JSON.parse(getFbUseName);
  var arryFirstName = objUseName.first_name;  
  Logger.log("user name: " + arryFirstName, 4000);
  
  cache.put('fbFrstName', arryFirstName, 4000);
  
  if (tknValid === false) {
    return 'notValid';
  }
  else if (arryFirstName != null) {
    // This is how it's determined if someone is logged in or not:
    cache.put('imin', '9847594ujglfugfjogj', 4000);
    return arryFirstName;
  }
}

//A Facebook App Token never changes unless you go to the Facebook Developers Console, and you
//change the App Secret.  So, do NOT keep requesting a new App Token.  Just get it once, then
//hard code it into a backend secret function.
// The App Token can be used to modify your App, but you can just do that 'Manually'
function getOneTimeFB_AppToken() {
  // constants:
  var APP_ID = '<Facebook App ID'
  var APP_SECRET = 'Facebook App Secret';
  
  Logger.log("getOneTimeFB_AppToken ran");
  //keep this info secret
  //Generate an App Access Token
  var optnAppTkn = {"method" : "get"};
  var getAppTknURL = "https://graph.facebook.com/oauth/access_token?client_id=" + APP_ID + "&client_secret=" + APP_SECRET + "&grant_type=client_credentials"
  var getAppTkn = UrlFetchApp.fetch(getAppTknURL, optnAppTkn);
  Logger.log("Object returned from GET: " + getAppTkn)
  var myAppTkn = getAppTkn.getContentText();
  Logger.log("myAppTkn: " + myAppTkn);
};

function fncPostItemFB(url, message) {
  var fbCacheTkn = cache.get('fbTkn');
  Logger.log("fbCacheTkn: " + fbCacheTkn);
  
  if (fbCacheTkn === null) {
    return false;
  };
  Logger.log("fncPostItemFB ran: " + fbCacheTkn);
  return fncPostSecurly_(url, message);
}

function fncPostSecurly_(url, message) {
  var APP_SECRET = '<Facebook App Secret>'
  var PAGE_ID    = '<Facebook page ID>'
 

  var fromLogInTkn = cache.get('fbTkn');
  Logger.log('cache FB token: ' + fromLogInTkn);
  
  // This is addded securiy
  var appsecret_sig = Utilities.computeHmacSha256Signature(fromLogInTkn, APP_SECRET);
  var optnPostFB = {"method" : "post"};
  
  // Url to connect facebook graph api:
  var PostToFB_URL = "https://graph.facebook.com/" + PAGE_ID + "/photos?access_token=" + fromLogInTkn + "&message=" + message + "&url=" + url;

  // Make a post to the page:
  var whatHappened = UrlFetchApp.fetch(PostToFB_URL, optnPostFB);
  // The return from facebook is an object. Conver to string
  var strFromFbObj = whatHappened.getContentText();
  Logger.log("Return value of Post: " + strFromFbObj);
  
  var rtrnVerify = strFromFbObj.indexOf('{\"id\":\"');
  Logger.log("rtrnVerify: " + rtrnVerify);
  
  if (rtrnVerify != -1) {
    return true;
  } else {
    return false;
  };                                   
};

