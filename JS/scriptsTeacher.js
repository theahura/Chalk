/**
 * @author: Amol Kapoor
 * @version: 1
 * 
 * Description: The Teacher Client
 * 
 * Designed to send any drawing written on the teacher's board to the student's client through a central server. executive file.
 * Needs: scriptsCommon, jquery.event.drag-2.2, scriptsCommonPen, scriptsLogin
 */

	/**
	 * Starts the save counter, to be used after the last edit on the page
	 */
	function startSave()
	{
		//Calls save function timer
		if(Auth && !UpdateTimeOut)
		{
			if(CanvasInfo[CurrentPage].id) //Calls Update
				UpdateTimeOut = window.setTimeout(function(){Save(false, null, CanvasInfo[CurrentPage].canvas);}, 5000); //sets a timeout for 5 seconds post action
			else
				UpdateTimeOut = window.setTimeout(function(){Save(true, null, CanvasInfo[CurrentPage].canvas);}, 5000);  
		}	
	}
	

/** Canvas Setup *****************************************************************
 * 
 *creates and sets up canvas, drawing events; canvas creation is used often enough that it will probly be made its own helper method
 *
 **/

//Type: Canvas; gets the canvas drawing board from HTML
var TeacherLayer = document.getElementById('TeacherLayer');

/*sets up CanvasInfo list*/

var CanvasSize = 2000; //remove later

//creates a new object for the list
CanvasInfo[0] = {};
//adds the first canvas context info and the canvas itself
CanvasInfo[0].context = TeacherLayer.getContext("2d");
CanvasInfo[0].canvas = TeacherLayer;

/*sets starting pen info + backups*/
//How it fills shapes/lines
CanvasInfo[0].context.fillStyle = "solid";

//color of lines
CanvasInfo[0].context.strokeStyle = "#A8A8A8";
BackUpPen.color = PaintType.color = CanvasInfo[0].context.strokeStyle; 

//size of lines
CanvasInfo[0].context.lineWidth = BackUpPen.size;

//cap style of lines
CanvasInfo[0].context.lineCap = "round";



/**
 * $(document).on is a jquery command looking for an event defined in the first parameter, on a DOM object (read: an html object)
 * with class defined in parameter two. Parameter three is the callback function/handler. These events are called from the plugin 
 * (jquery.event.drag-2.2). These commands invariably call the draw command or shapeadjust command in some shape or form. 
 * 
 * @Param: "dragstart"; String; name of event being called
 * @Param: ".drag"; String; name of class of event target. Used to differentiate between objects that need to be drawn on (i.e. canvas) and those that don't (i.e. toolbar, dragpad)
 * @Param: function; function; call back operation
 * 		@Param: ev; event; event information from ipad or computer registration
 * 		@Param: dd; data pulled from plugin (not currently used) 
 */
$(document).on("dragstart", ".drag", function(ev, dd){
	//the x/y location of the event hit
	x = (ev.pageX)*MaxZoom/GlobalScale; 
	y = (ev.pageY)*MaxZoom/GlobalScale; 
	
	if(!ShapeAdjust)
		//calls the drag start event
		draw(x, y, "dragstart", true, MouseX, MouseY, CanvasInfo[CurrentPage].context, CurrentPage, true);		
	else
		adjustShape(x, y, "dragstart", MouseX, MouseY, CanvasInfo[CurrentPage].context, CurrentPage, true);		

		
	//Sets last mouse location 
	MouseX = x;
	MouseY = y; 
});

$(document).on("drag", ".drag", function(ev, dd){
	//the x/y location of the event hit
	x = (ev.pageX)*MaxZoom/GlobalScale; 
	y = (ev.pageY)*MaxZoom/GlobalScale;   
	
	
	if(!ShapeAdjust)
		//calls the drag start event
		draw(x, y, "drag", true, MouseX, MouseY, CanvasInfo[CurrentPage].context, CurrentPage, true);		
	else
		adjustShape(x, y, "drag", MouseX, MouseY, CanvasInfo[CurrentPage].context, CurrentPage, true);		
	
	MouseX = x;
	MouseY = y; 
});

$(document).on("dragend",".drag",function(ev, dd){
	//the x/y location of the event hit
	x = (ev.pageX)*MaxZoom/GlobalScale; 
	y = (ev.pageY)*MaxZoom/GlobalScale; 
	
	if(!ShapeAdjust)
		//calls the drag start event
		draw(x, y, "dragend", true, MouseX, MouseY, CanvasInfo[CurrentPage].context, CurrentPage, true);		
	else
		adjustShape(x, y, "dragend", MouseX, MouseY, CanvasInfo[CurrentPage].context, CurrentPage, true);		
	
	MouseX = x;
	MouseY = y; 
});

/**
 * The dragcanceled event is fired if the computer decides that the input is bad (i.e. from a wrist). It then 
 * clears the ShapeCanvas and resets the touch events. Not currently implemented.
 * 
 * @Param: "dragcanceled"; String; name of event 
 * @Param: ".drag"; String; name of CSS class of event target
 * @Param: function; function; call back operation
 * 		@Param: ev; event; event information from ipad or computer registration
 * 		@Param: dd; data pulled from plugin (not currently used) 
 */
$(document).on("dragcanceled",".drag",function(ev, dd){
	if(ToolType == "Paint")
		DrawCanvas.getContext("2d").clearRect(0, 0, CanvasSize, CanvasSize);
});


/****************MODES*****************************
 Modes fundamentally change what a drawstroke does. Unlike single click tools (e.g. update), these tools can be used continuously to modify what 
 happens on click, stroke, and general user input
 **************************************************/	
	
/* The first of which is Drag mode */	

/**
 * Every DOM (HTML) element has an onclick event that can be set to do different things. We can call and set 
 * the onclick events by searching for a specific ID given to a div/whatever, and then change the .onclick function. 
 * 
 * This function switches the UI to dragmode. It creates a div over the entire canvas screen to make sure the user doesn't accidentally 
 * draw while panning and to make it very easy to quickly traverse the entire canvas area
 * 
 * @Param: "drag"; String; the ID that is used to search for what is 'clicked' 
 */
//document.getElementById("Drag").onclick = function()
//{
//	dragMode(); 
//}

/*Removes the dragpad (basically same as the de-toggle) whenever anything on the main toolbar div is touched*/
//document.getElementById("toolbar").onclick = function()
//{
//	if (DragMode)
//	{
//		dragMode();
//	}
//}


/********************************************************************************************
  Random Tools 
  *******************************************************************************************/	 	


/**Extend ************************************************************************/

/* Actually calls the page extension event, and also an automatic save call for the page below it	 */
document.getElementById("PageUp").onclick = function()
{
  	document.getElementById("LoadingColor").style.display = "block";
	//creates a new canvas and sends an extension command to the student if it doesn't exist
	if(!CanvasInfo[CurrentPage + 1])
	{
		if(CurrentPage >= 2)
		{
			alert("You have reached the maximum number of pages. Use save-as to reuse previous pages. Have the class (teacher and student) use " +
					"save-as to name their page something new, and then erase previous data. Auto-updating will begin to save the image as a new page.");
			document.getElementById("LoadingColor").style.display = "none";
					
			return;
		}
		
		/**
		 * Sends the extend command to the student side to ensure both student and teacher are
		 * synched up regarding number of pages
		 * 
		 * @Param: 'CommandToStudent'; String; name of the command that is being emitted
		 * @Param: {}; Object; in this case, stores the tool type (extend) and the page the teacher is on
		 */
		socket.emit('CommandToStudent', {
			ToolType: "Extend",
			PageNumber: CurrentPage});
		
		
		/*Actually creates the new page*/ 
		var canvas = createCanvas(CanvasPixelHeight, CanvasPixelWidth, -1, 0, 0, true, null, null, CanvasHeight*GlobalScale, CanvasWidth*GlobalScale);
		
		//create a new spot in the canvasinfo list
		CanvasInfo.push({});
		//to store the data for our new canvas/page
		CanvasInfo[CanvasInfo.length - 1].context = canvas.getContext("2d"); 
		CanvasInfo[CanvasInfo.length - 1].canvas = canvas;
	}
	
	//adds the canvas
	changePage(true);
		
	//if logged in 
	if(Auth)
	{
		//if the previous page had an id already (i.e. previously saved) 
		if (CanvasInfo[CurrentPage-1].id) 
		{
			//calls the update function 
			Save(false, CurrentPage - 1, CanvasInfo[CurrentPage-1].canvas);
			return;
		}
		else 
		{
			//calls the save function
			Save(true, CurrentPage - 1, CanvasInfo[CurrentPage-1].canvas);
			return;
		}
	}
}

/* Same as above, and also an automatic save call for the page above it	 */
document.getElementById("PageDown").onclick = function()
{		
  	document.getElementById("LoadingColor").style.display = "block";

  	if(CurrentPage == 0)
	{
  		alert("You are at the first page.");
  	  	document.getElementById("LoadingColor").style.display = "none";

  		return;
	}
  	
	changePage(false);
		
	if(Auth)
	{
		if (CanvasInfo[CurrentPage + 1].id) 
		{
			Save(false, CurrentPage + 1, CanvasInfo[CurrentPage + 1].canvas);
			return;
		}
		else 
		{
			Save(true, CurrentPage + 1, CanvasInfo[CurrentPage + 1].canvas);
			return;
		}
	}
}

/**Undo and Redo***********************************************************************/   

/*Undo/Redo onclick basically just pop off the last part of the respective lists to the other list, and then call back*/
document.getElementById("Undo").onclick = function()
{
	//stops update call for google drive
	clearSaveTimer();
	
	if (UndoList.length > 0)
	{			
		RedoList.push(UndoList.pop());
		redrawUndo(UndoList, CanvasInfo[CurrentPage]);
	}

	//make a helper method
	//if a storage image exists, convert it to a string to send it over
	var TempImgData = null;
	
	if (CanvasInfo[CurrentPage].image)
	{
		var canvas = createCanvas(CanvasInfo[CurrentPage].image.height, CanvasInfo[CurrentPage].image.width);
		canvas.getContext("2d").drawImage(CanvasInfo[CurrentPage].image, 0, 0);
		TempImgData = canvas.toDataURL();
	}
	
	/**
	 * Sends the undo list to the student. This allows the student to recreate the teacher board on their end as well
	 * 
	 * @Param: 'CommandToStudent'; String; name of command 
	 */
	socket.emit('CommandToStudent', 
	{
		ToolType: "Undo",
		TotalPages: CanvasInfo.length,
		ImgData: TempImgData,
		PageNumber: CurrentPage,
		
		//sends a string form of the undolist array
		UndoList: JSON.stringify(UndoList, function(key, value) //makes objects into strings
		{
			if(value instanceof Image) //images returned as empty if there are any in the undolist (which there shouldn't be YET)
			{
				return undefined;
			}
			return value;
		})
	});
	
	//Calls save function timer again
	startSave();
}

//see above
document.getElementById("Redo").onclick = function()
{
	//stops update call 
	clearSaveTimer();
	
	if (RedoList.length > 0)
	{
		UndoList.push(RedoList.pop());
		redrawUndo(UndoList, CanvasInfo[CurrentPage]);
	}
	
	var TempImgData = null;
	
	if (CanvasInfo[CurrentPage].image)
	{
		var canvas = createCanvas(CanvasInfo[CurrentPage].image.height, CanvasInfo[CurrentPage].image.width);
		canvas.getContext("2d").drawImage(CanvasInfo[CurrentPage].image, 0, 0);
		TempImgData = canvas.toDataURL();
	}
	
	socket.emit('CommandToStudent',   
	{
		ToolType: "Undo",
		TotalPages: CanvasInfo.length,
		ImgData: TempImgData,
		PageNumber: CurrentPage,

		UndoList: JSON.stringify(UndoList, function(key, value)
		{
			if(value instanceof Image)
			{
				return undefined;
			}
			return value;
		})
	});
	
	//Calls save function timer
	startSave();
}

/*****************************UPDATE******************************************/

/**
 * The update commands are built to allow students who come late to a lecture or experience tech difficulties to jump back into 
 * the program by sending the teacher's undolist to the student and rebuilding everything on the student end. 
 * 
 * This socket command is listening to an update request from the student (once collab works, will be used to add a lot more)
 * 
 * @Param: "CommandFromStudent"; String; command to listen for
 * @Param: function; function; callback method
 * 		@Param: data; object; info passed along from the student
 */
socket.on('CommandFromStudent', function(data) 
{
	if (data.ToolType == "Update")
	{
		Update();
	}	
});

//calls the same update function from the teacher end, to update the whiteboard mostly
document.getElementById("Update").onclick = function()
{
	SelfUpdating = true;
	Update();
}

/**
 * This function emits two separate commands: an update command, and an undo command. The update 
 * command sends the number of pages to the student to ensure the page numbers on both ends are correct; the
 * Undo command sends the current Undolist WITHOUT POPPING ANYTHING, which allows the student to seamlessly recreate
 * the board from the teacher's commands
 * 
 */
function Update()
{
	var ImageList = new Array();
	
	for (var i = 0; i < CanvasInfo.length; i++)
		if (i != CurrentPage)
			ImageList[i] = CanvasInfo[i].canvas.toDataURL(); 
		else
			ImageList[i] = null;
	 
	//the update call; need to send the images from the previous pages as well
	socket.emit('CommandToStudent', 
	{
		ToolType: "Update",
		//sends the total pages to make sure the student is synced in terms of page number
		TotalPages: CanvasInfo.length,
		PageNumber: CurrentPage,
		ImgData: ImageList, 
		type: SelfUpdating
	});
	
	var TempImgData = null;
	
	if (CanvasInfo[CurrentPage].image)
	{
		var canvas = createCanvas(CanvasInfo[CurrentPage].image.height, CanvasInfo[CurrentPage].image.width);
		canvas.getContext("2d").drawImage(CanvasInfo[CurrentPage].image, 0, 0);
		TempImgData = canvas.toDataURL();
	}
	
	//the undo call
	socket.emit('CommandToStudent', 
	{
		ToolType: "UndoUpdate",
		PageNumber: CurrentPage,
		ImgData: TempImgData,
		type: SelfUpdating, 
		//basically just sends the undolist
		UndoList: JSON.stringify(UndoList, function(key, value)
		{
			if(value instanceof Image)
			{
				return undefined;
			}
			
			return value;
		})
	});
	
	SelfUpdating = false;
}
	
/********************************************Handles all communication**************************************************/

socket.on('CommandFromStudent', function(data) 
{
	if (data.ToolType == "Notification")
	{
		alert(data.PushText);
	}
});