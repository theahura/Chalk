/**
 * @author: Amol Kapoor
 * @version: 1
 * 
 * Description: The Core API
 * 
 * A location to store all of the scripts common to student and teacher related to button pressing, etc.
 */


/*********************Shapes***********************************/

	document.getElementById("Box").onclick = function(){
		ToolType = "Box";
	}	
	
	document.getElementById("Line").onclick = function(){
		ToolType = "Line";
	}	
	
	document.getElementById("Circle").onclick = function(){
		ToolType = "Circle";
	}	
	
/*********************STYLING***********************************/

	//Red
	document.getElementById("Red").onclick = function(){
		changeStyle("#FF0000", "Red");
		};
		
	//Blue
	document.getElementById("Blue").onclick = function(){
		changeStyle("#0000FF", "Blue");};
		
	//Yellow
	document.getElementById("Yellow").onclick = function(){
		changeStyle("#FFFF00", "Yellow");};
		
	//Green
	document.getElementById("Green").onclick = function(){
		changeStyle("#00FF00", "Green");};
		
	//Purple
	document.getElementById("Purple").onclick = function(){
		changeStyle("#FF00FF", "Purple");};
		
	//Orange
	document.getElementById("Orange").onclick = function(){
		changeStyle("#FFA500", "Orange");};
		
	//Black
	document.getElementById("Black").onclick = function(){
		changeStyle("#A8A8A8", "Black");};
	
	//sizing
	$('#FontSize').on("input", function(){
		PaintType.size = $('#FontSize').val();
	    var v = $('#FontSize').val().toString();
	    $(".dot i").css({"font-size":v});
	});  	
	
	//Pen
	document.getElementById("Paint").onclick = function(){
		changePaintType(BackUpPen);
	};

	//Erase
	document.getElementById("Eraser").onclick = function()
	{
		changePaintType(BackUpErase);
	}; 

	//Highlight
	document.getElementById("Highlight").onclick = function() {
		changePaintType(BackUpHighlight);
	}	

/**Copy/Paste + Pan**************************************/	
	
	document.getElementById("Copy").onclick = function()
	{
		ToolType = "Copy";
	}
	
	document.getElementById("Pan").onclick = function()
	{
		ToolType = "Pan";
	}
	
	
	document.getElementById("LogIn").onclick = function()
	{
		//if you're already logged in...
		if(Auth)	
		{
			//confirm logout intent
			var check = prompt("Are you sure you want to log out? (Y/N)", "N");
			
			if (check.toLowerCase() == "n")
			{
				return;
			}
			else //Could be risky if its not a direct yes
			{
				logout();
			}
		}
		//if not already logged in...
		else
			//requests login info, and calls the login function handler on callback
			gapi.auth.authorize(
			           {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': false},
			           login);
		
	}
	
	
/**********************ZOOMING*****************************************************/
	
	document.getElementById("ZoomIn").onclick = function()
	{
		if (GlobalScale < MaxZoom)
			GlobalScale++;
		else
			return;

		Zoom(GlobalScale);
	}
	
	document.getElementById("ZoomOut").onclick = function()
	{
		if (GlobalScale > 1)
			GlobalScale--;
		else
			return;

		Zoom(GlobalScale);
	}
	
/*Drive tools*/
	/**
	 * Checks if the user has already logged in. If he hasn't, asks for login confirmation. 
	 * 
	 * Either way, begins the save flow. 
	 * 
	 * @Param: "Save"; String; ID of DOM element that begins save callback
	 */
	document.getElementById("Save").onclick = function()
	{
		//gets the save file name from the user if they want a different one; pastname is the previous save name
		var name = prompt("Please enter the name of the file (note: only saves current page)", PastName);
		
		if (name != null)
			PastName = name;
		
		if (Auth == false) //if not already logged in
		{
			//requests login
			gapi.auth.authorize(
			           {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': false},
			           login);
		}
		else
			Save(true, null,CanvasInfo[CurrentPage].canvas);
	};

	
	document.getElementById('Open').onclick = function () 
	{
		if (Auth == false) //if not already logged in
		{
			//requests login
			gapi.auth.authorize(
			           {'client_id': CLIENT_ID, 'scope': SCOPES, 'immediate': false},
			           login);
		}
		else
			createPicker(); 

	}
	