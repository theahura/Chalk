/**
 * @author: Amol Kapoor
 * @version: 1
 * 
 * Description: Google Drive Login
 * 
 * A location to store all of the scripts required to communicate with gapi
 */


	
var CLIENT_ID = '1019578559045-6alrhfpff3iqauja90gucjr3sccn1f5f.apps.googleusercontent.com';
var SCOPES = 'https://www.googleapis.com/auth/drive';

/*First time login*/

/**
 * Called when the client library is loaded to start the auth flow.
 */
window.onload = function () 
{
  //  document.getElementById("LoadingColor").style.display = "block";
    gapi.client.load('drive', 'v2', handleClientLoad);
    gapi.load('picker', {});
}

/**
 * Called when the client library is loaded to start the authorization flow.
 */
function handleClientLoad() {
  window.setTimeout(checkAuth, 1);
}

/**
 * Check if the current user has authorized the application.
 */
function checkAuth() {
 gapi.auth.authorize(
	           {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': true},
	           login);
}

/*General login*/

//Type: String; the name of the current user logged into gDrive
var User;

//Type: Token; the string used by google to authorize calls to a user's drive
var OauthToken = null;

//Type: Bool; tracks whether someone is logged in currently
var Auth = false;

/**
 * Called when authorization server replies. Sets login vars, manipulates loading vars
 *
 * @param {Object} authResult Authorization result.
 */
function login(authResult) 
{    	 
   if (authResult && !authResult.error) {
	   var request = gapi.client.drive.about.get(); //gets username
	   request.execute(function(resp) 
	   {
		   	  User = resp.name;
	    	  alert("Logged in to Google Drive as: " + User);
	    	  
	    	  //loading div
	    	  document.getElementById("LoadingColor").style.display = "none";

	    	  document.getElementById("LogIn").innerHTML = "Log Out";
	    	  
	    	  document.getElementById("LoginName").innerHTML = "Cloud Tools - " + User;
	    		  
	    	  Auth = true;	 
	    	  OauthToken = authResult.access_token;
	    	  
	    	  return true;
	   });
   }
   else if (authResult && authResult.error)
   {
	   if (authResult.error === "immediate_failed" || authResult.error === "access_denied")
	   {
		   alert("Not logged in to Google Drive");
		   document.getElementById("LoadingColor").style.display = "none";
	   }
	   else
	   {
		   alert("There was an error: " + authResult.error)
		   document.getElementById("LoadingColor").style.display = "none";
   	   }
	   return false; 
   }
   else
   {
	   alert("Not logged in to Google Drive");
	   document.getElementById("LoadingColor").style.display = "none";
	   return false;
   }
}

/**
 * Logout scripts. Sets authorization vars to false, clears googledrive save ids, and revokes the URL token. 
 * Alerts user when finished. 
 * 
 */
function logout()
{	
	
	//sets up the url to revoke the login token
	var revokeUrl = 'https://accounts.google.com/o/oauth2/revoke?token=' + gapi.auth.getToken().access_token;

	  // Perform an asynchronous GET request to revoke the google account login token
	  $.ajax({
	    type: 'GET',
	    url: revokeUrl,
	    async: false,
	    contentType: "application/json",
	    dataType: 'jsonp',
	    success: function(nullResponse) {
	    	//clears user tracker and modified UI accordingly 
	    	  User = null;
	    	  OauthToken = null;
	    	  //sets login tracker to logout
	    	  Auth = false;
	    	  
	    	//clears the canvas id list to prep for new user
	    	  for(var i = 0; i < CanvasInfo.length; i++)
	    		CanvasInfo[i].id = null; 
	    		
	    	  
	    	  alert("Logged Out");
	    	  
	    	  document.getElementById("LogIn").innerHTML = "Log In";
	    	  document.getElementById("LoginName").innerHTML = "Cloud Tools - Not Logged In";
	    },
	    error: function(e) {
	    	alert("There was an error: " + e);
	    }
	 });
}

/**
 * Save function that actually does most of the heavy lifting with regards to saving to google drive
 * This is where the image compilation happens as well. 
 * 
 * Does some styling to let the user know that the app is saving, creates a canvas that can store the image necessary, 
 * loads the drive API and calls the appropriate request based on whether its a saveas or not
 * 
 * Must be called after scriptsCommon has loaded
 * 
 * @Param: IsSaveAs; Boolean; defines whether or not the file should be SAVED (i.e. new file) or UPDATED (i.e. change old file)
 * @Param: PageNumber; int; which page that needs to be saved (if null, assume the current page) 
 * @Param: Canvas; canvas; the image that needs to be saved (for student, assumes double image is built and already passed to save function)
 */
function Save(IsSaveAs, PageNumber, Canvas) 
{
	//debugging/functionality, assumes the pagenumber is the current page if null
	if (PageNumber == null)
		PageNumber = CurrentPage;
		
	/*styling to let the user know whats going on*/
	if(IsSaveAs)
    {
    	//styles for updating tag
    	document.getElementById("Updating").innerHTML = "Saving " + PastName + "_" + PageNumber + "...";
    	document.getElementById("Updating").style.display = "block";
    }
    else
    {
    	//styles for updating tag
    	document.getElementById("Updating").innerHTML = "Updating " + PastName + "_" + PageNumber + "...";
    	document.getElementById("Updating").style.display = "block";
    }		

	 /*creates the current canvas image*/ 
	var TempCanvas = createCanvas(CanvasPixelHeight, CanvasPixelWidth)
	var TempCtx = TempCanvas.getContext("2d");
	
	//makes sure 'transparent' is white instead of black by painting the entire canvas white to start;
	//should probly just edit the css to make background white...
	TempCtx.fillStyle = "white";
	TempCtx.rect(0, 0, CanvasPixelWidth, CanvasPixelHeight);
	TempCtx.fill();
	
	//draws the current page to the now-white canvas
	TempCtx.drawImage(Canvas, 0, 0);
	
	//memory clearing
	TempCtx = null;
	
	//loads api and calls proper function function
	 gapi.client.load('drive', 'v2', function () {		        
		 
		 	//creates the metadata for the file that is being loaded
	        var metadata = {
	            'title': PastName + "_" + PageNumber,
	                'mimeType': 'image/png'
	        };
	        
	        /*creates the URL that will be uploaded to drive*/
	        
	        //the part of the 'todataurl' that needs to be stripped
	        var pattern = 'data:image/png;base64,';
	        
	        //converts the image to a url
	        var base64Data = TempCanvas.toDataURL().replace(pattern, '');
		    
		    //clears memory
		    TempCanvas = null;
		    
	        //based on the call type, calls either update or saveas
	        if(IsSaveAs)
	        {
	        	//calls the save function
	        	newInsertFile(base64Data, metadata);
	        }
	        else
	        {
	        	//calls the update function
	        	updateFile(CanvasInfo[PageNumber].id, base64Data, metadata)
	        }
	    });
}

/**
 * (From google api docs)
 * Insert new file to root folder in drive; SAVEAS
 *
 * @param {Image} Base 64 image data
 * @param {Metadata} Image metadata
 * @param {Function} callback Function to call when the request is complete.
 */
function newInsertFile(base64Data, metadata, callback) {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";
    var contentType = metadata.mimeType || 'application/octet-stream';
    var multipartRequestBody = delimiter +
        'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) + delimiter +
        'Content-Type: ' + contentType + '\r\n' +
        'Content-Transfer-Encoding: base64\r\n' +
        '\r\n' + base64Data + close_delim;

    var request = gapi.client.request({
        'path': '/upload/drive/v2/files',
            'method': 'POST',
            'params': {
            'uploadType': 'multipart'
        },
            'headers': {
            'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
        },
            'body': multipartRequestBody
    });
    if (!callback) {
        callback = function (file) {
        	//stores the id of the file in the file list for future reference
        	CanvasInfo[CurrentPage].id = file.id;
        	//styles for updating tag
        	document.getElementById("Updating").style.display = "none";
        };
    }
    request.execute(callback);
}

/**
 * (From google api docs)
 * Update an existing file's metadata and content.
 *
 * @param {String} fileId ID of the file to update.
 * @param {Object} fileMetadata existing Drive file's metadata.
 * @param {File} fileData File object to read data from.
 * @param {Function} callback Callback function to call when the request is complete.
 */

function updateFile(fileId, base64Data, metadata, callback) {
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";
    var contentType = metadata.mimeType || 'application/octet-stream';
    var multipartRequestBody = delimiter +
        'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) + delimiter +
        'Content-Type: ' + contentType + '\r\n' +
        'Content-Transfer-Encoding: base64\r\n' +
        '\r\n' + base64Data + close_delim;

    var request = gapi.client.request({
        'path': '/upload/drive/v2/files/' + fileId,
        'method': 'PUT',
        'params': {'uploadType': 'multipart', 'alt': 'json'},
        'headers': {
            'Content-Type': 'multipart/mixed; boundary="' + boundary + '"'
        },
            'body': multipartRequestBody
    });
    if (!callback) {
        callback = function (file) {
        	//styles for updating tag
        	document.getElementById("Updating").style.display = "none";
        };
    }
    request.execute(callback);
}

/**Open********************************************************************************/

// Type: String; Verification key used by google to ensure registration of google picker API
var developerKey = 'AIzaSyArQbQNXR9K69jqBuWh7k6x9zgZyKC-LYY';

/**
 * Called on the open button, the create picker opens a google open UI that allows users
 * to select information from their google drive. That info is then sent through the pickerCallback
 * function, from which we can strip the selected file ID. 
 */
function createPicker() {
  var view = new google.picker.View(google.picker.ViewId.DOCS);
  //only allow them to open images
  view.setMimeTypes("image/png,image/jpeg,image/jpg");
  
  var picker = new google.picker.PickerBuilder()
     // .enableFeature(google.picker.Feature.NAV_HIDDEN)
      .setAppId(1019578559045) //project number
      .setOAuthToken(OauthToken)
      .addView(view)
      .addView(new google.picker.DocsUploadView())
      .setDeveloperKey(developerKey)
      .setCallback(pickerCallback)
      .build();
   picker.setVisible(true);
}

/**
 * Callback for the picker object, used to get the fileID from the file selected by the user in the
 * createPicker function. This info is then used to get the actual content using the gapi.get function
 * 
 * @Param: data; object; the data for the user-selected file 
 */
function pickerCallback(data) {
  if (data.action == google.picker.Action.PICKED) {
    var fileId = data.docs[0].id;
    getFile(fileId);
  }
}

/**
 * Print a file's metadata.
 *
 * @param {String} fileId ID of the file to print metadata for.
 */
function getFile(fileId) {
  var request = gapi.client.drive.files.get({
    'fileId': fileId
  });
    
  request.execute(function(resp) {
    downloadFile(resp);
  });
}

/**
 * Download a file's content.
 *
 * @param {File} file Drive File instance.
 */
function downloadFile(file) {
  if (file.downloadUrl) {
    var accessToken = gapi.auth.getToken().access_token;
    var xhr = new XMLHttpRequest();
    xhr.open('GET', file.downloadUrl);
    xhr.responseType =  'blob' ;
    xhr.setRequestHeader('Authorization', 'Bearer ' + OauthToken);
    xhr.onload = function() 
    {	
    	//creates a blob (a variable data struct) from the content
    	var blob =  this.response;

        var img = new Image();

        //uses the blob to create the url for the img
        img.src =  URL.createObjectURL ( blob ); 
        
        img.onload =  function ()  
        {
        	//stores the storage overlay
        	OverlayObject = img;

        	//draws the image to temp canvas
        	DrawCanvas.getContext("2d").drawImage( img, document.body.scrollLeft,  document.body.scrollTop ); 
        	
        	//saves location for redrawing
        	ImageScrollX = document.body.scrollLeft;
        	ImageScrollY = document.body.scrollTop;
        	
        	StoreToolType = "Image";
        	
        	//prepares to move the image around
        	ShapeAdjust = true;
        }; 
    };
    xhr.onerror = function() {
    	alert("There was an error");
    };
    xhr.send();
  } else {
  	alert("There was an error");
  }
}

