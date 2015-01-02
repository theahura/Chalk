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

//sizing
$('#FontSize').on("input", function(){
	PaintType.size = $('#FontSize').val();
    var v = $('#FontSize').val().toString();
    $(".dot i").css({"font-size":v});
});  	

//Pen
document.getElementById("Paint").onclick = document.getElementById("toPen").onclick = function(){
	changePaintType(BackUpPen);
};

//Erase
document.getElementById("Eraser").onclick = document.getElementById("toEraser").onclick = function()
{
	changePaintType(BackUpErase);
}; 

//Highlight
document.getElementById("Highlight").onclick = document.getElementById("toHighlight").onclick = function() {
	changePaintType(BackUpHighlight);
}	

$('.color-list').click(function(){
	if(PaintType.type === "Erase")
	{
    	$('.color-list').fadeTo(250, 1.0);
    	$('#Eraser').css({"box-shadow":"none"});
    	changePaintType(BackUpPen);
	}
});

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
		$("#AlertText_2").html("Are you sure you want to log out?");

		document.getElementById("Accept_2").onclick = function(){
			logout();
		};

		$("#AlertBox_2").fadeIn(250);
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
	$("#PromptText").html("Please enter the name of the file (note: only saves current page)");
	document.getElementById("PromptInput").value = PastName;

	document.getElementById("Prompt_Accept").onclick = function()
	{
		var name = document.getElementById("PromptInput").value;

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

	$("#PromptBox").fadeIn(250);
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

/**Text Boxes****************************************************/
document.getElementById("TextMode").onclick = function()
{
	if(ToolType !== "TextMode")
	{
		changePaintType(BackUpPen);
		StoreToolType = ToolType; 
		ToolType = "TextMode";
		$("#TextMode").css({"background":"red"});
	}
	else
	{
		$("#TextMode").css({"background":"-webkit-gradient( linear, left top, left bottom, color-stop(0.05, #ededed), color-stop(1, #dfdfdf) )"});

		if(ActiveBox)
			saveBox(ActiveBox, CanvasInfo[CurrentPage].context, CurrentPage, IsTeacher);

		ToolType = StoreToolType;
	}
}