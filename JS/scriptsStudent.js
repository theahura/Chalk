/**
 * @author: Amol Kapoor
 * @version: 1
 * 
 * Description: The Teacher Client
 * 
 * Designed to send any drawing written on the teacher's board to the student's client through a central server. 
 */	

	//List of canvases that are stored for teachers
	CanvasInfoTeacher = new Array();

	//current page of teacher
	var TeacherPage = 0;
	
	//Differences between student and teacher
	//var PageDifference = 0;
	
	/** Canvas Setup *****************************************************************
	 * 
	 *creates and sets up canvas, drawing events	
	 *
	 **/

	//gets the canvas drawing board from HTML
	var TeacherLayer = document.getElementById('TeacherLayer');
	
	//sets default marker styling 	
	CanvasInfoTeacher[0] = {};	
	CanvasInfoTeacher [0].context = TeacherLayer.getContext("2d");
	CanvasInfoTeacher[0].canvas = TeacherLayer;
	
	CanvasInfoTeacher[0].context.fillStyle = "solid";

	//color
	CanvasInfoTeacher[0].context.strokeStyle = "#A8A8A8";

	//size
	CanvasInfoTeacher[0].context.lineWidth = 5;

	//cap style
	CanvasInfoTeacher[0].context.lineCap = "round";
	

	//gets the canvas drawing board from HTML
	var StudentLayer = document.getElementById('StudentLayer');
	
	//sets default marker styling 
	CanvasInfo[0] = {};
	CanvasInfo[0].context = StudentLayer.getContext("2d");
	CanvasInfo[0].canvas = StudentLayer;

	CanvasInfo[0].context.fillStyle = "solid";

	//color
	CanvasInfo[0].context.strokeStyle = "#000000";
	BackUpColor = CanvasInfo[0].context.strokeStyle; 

	//size
	CanvasInfo[0].context.lineWidth = 5;
	BackUpSize = CanvasInfo[0].context.lineWidth;

	//cap style
	CanvasInfo[0].context.lineCap = "round";
	BackUpCap = CanvasInfo[0].context.lineCap;
	
	
	
	/**
	 * Starts the save counter, to be used after the last edit on the page
	 */
	function startSave()
	{
		//Calls save function timer
		if(Auth && !UpdateTimeOut)
		{
			if(CanvasInfo[CurrentPage].id) //Calls Update
				UpdateTimeOut = window.setTimeout(function(){Save(false, null, createSaveImage());}, 5000); //sets a timeout for 5 seconds post action
			else
				UpdateTimeOut = window.setTimeout(function(){Save(true, null, createSaveImage());}, 5000);  
		}	
	}
	
	
	/***Draw Events; binds mouse click to dragstart (click), drag (click+move), and dragend (release)*********************/
	//uses plugin
	$(document).on("dragstart", ".drag", function(ev, dd){
		
		x = (ev.pageX-120)*MaxZoom/GlobalScale; 
		y = (ev.pageY)*MaxZoom/GlobalScale; 
		
		if(!ShapeAdjust)
			//calls the drag start event
			draw(x, y, "dragstart", true, MouseX, MouseY, CanvasInfo[CurrentPage].context, CurrentPage, false);		
		else
			adjustShape(x, y, "dragstart", MouseX, MouseY, CanvasInfo[CurrentPage].context, CurrentPage, false);		

		MouseX = x;
		MouseY = y; 
	});
	
	$(document).on("drag", ".drag", function(ev, dd){
				
		x = (ev.pageX-120)*MaxZoom/GlobalScale; 
		y = (ev.pageY)*MaxZoom/GlobalScale; 

		if(!ShapeAdjust)
			//calls the drag start event
			draw(x, y, "drag", true, MouseX, MouseY, CanvasInfo[CurrentPage].context, CurrentPage, false);		
		else
			adjustShape(x, y, "drag", MouseX, MouseY, CanvasInfo[CurrentPage].context, CurrentPage, false);		
		
		MouseX = x;
		MouseY = y; 
	});
	
	$(document).on("dragend",".drag",function(ev, dd){

		x = (ev.pageX-120)*MaxZoom/GlobalScale; 
		y = (ev.pageY)*MaxZoom/GlobalScale; 
		
		if(!ShapeAdjust)
			//calls the drag start event
			draw(x, y, "dragend", true, MouseX, MouseY, CanvasInfo[CurrentPage].context, CurrentPage, false);		
		else
			adjustShape(x, y, "dragend", MouseX, MouseY, CanvasInfo[CurrentPage].context, CurrentPage, false);		
		
		MouseX = x;
		MouseY = y; 
	});
	
/****************************MODES***********************************/

	document.getElementById("Drag").onclick = function()
	{
		dragMode();
	}
	
	document.getElementById("toolbar").onclick = function()
	{
		if (DragMode)
		{
			dragMode();
		}
	}

/********************************************************************************************
  Random Tools 
  *******************************************************************************************/	 

	/**Move right/left****************************************/
	document.getElementById("Right").onclick = function()
	{
		window.scrollTo(1000, window.pageYOffset);
	}
	
	document.getElementById("Left").onclick = function()
	{
		window.scrollTo(0, window.pageYOffset);
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
	
	
	/***Color Change and Size***/ 

	//Red
	document.getElementById("Red").onclick = function(){
		changeStyle("#990000", "source-over", 5);
		};
		
	//Blue
	document.getElementById("Blue").onclick = function(){
		changeStyle("#000099", "source-over", 5);};
		
	//Yellow
	document.getElementById("Yellow").onclick = function(){
		changeStyle("#999900", "source-over", 5);};
		
	//Green
	document.getElementById("Green").onclick = function(){
		changeStyle("#009900", "source-over", 5);};
		
	//Purple
	document.getElementById("Purple").onclick = function(){
		changeStyle("#990099", "source-over", 5);};
		
	//Orange
	document.getElementById("Orange").onclick = function(){
		changeStyle("#996300", "source-over", 5);};
		
	//Black
	document.getElementById("Black").onclick = function(){
		changeStyle("#000000", "source-over", 5);};

	//Black
	document.getElementById("Paint").onclick = function(){
		changeStyle("#000000", "source-over", 5);};
	
	
	//Erase
	document.getElementById("Eraser").onclick = function(){
		changeStyle("rgba(0,0,0,1)", "destination-out", 70);}; 

	
/**Extend ************************************************************************/
	
	AddCanvas = function (IsRight)
	{
		if(!IsRight && CurrentPage == 0) //make sure it doesn't go below page zero
			return;
		if (IsRight && CurrentPage == CanvasInfo.length - 1)
		{
			return;
		}

		if (IsRight)
		{					
			document.body.removeChild(CanvasInfo[CurrentPage].canvas);
			
			document.body.appendChild(CanvasInfo[CurrentPage].canvas);
		}
		else //assume down is clicked
		{			
			document.body.removeChild(CanvasInfo[CurrentPage].canvas);

			document.body.appendChild(CanvasInfo[CurrentPage].canvas);
		}
		
		var TotalPages = CanvasInfo.length-1;

		document.getElementById("PageNumber").innerHTML = CurrentPage + " of " + TotalPages;
	}
	
	document.getElementById("PageUp").onclick = function()
	{		
		document.getElementById("LoadingColor").style.display = "block";
	
		if(CanvasInfo[CurrentPage + 1])
		{
			//specific changes for teacher canvases
			document.body.removeChild(CanvasInfoTeacher[CurrentPage].canvas);
			document.body.appendChild(CanvasInfoTeacher[CurrentPage + 1].canvas);	
		}
		
		changePage(true);		
				
		//saves previous page (not new page) on pageup/down		
		if(window.auth)
		{
			if (CanvasInfo[CurrentPage-1].id) //note: save call happens async, must make sure proper page number is used or it will throw errors
			{
				Save(false, CurrentPage - 1, createSaveImage());
				return;
			}
			else 
			{
				Save(true, CurrentPage - 1, createSaveImage());
				return;
			}
		}
	}
	
	document.getElementById("PageDown").onclick = function()
	{		
	
		document.getElementById("LoadingColor").style.display = "block";
	
	  	if(CurrentPage == 0)
		{
	  		alert("You are at the first page.");
	  	  	document.getElementById("LoadingColor").style.display = "none";

	  		return;
		}
	  	
		if(CanvasInfo[CurrentPage - 1])
		{
			//specific changes for teacher canvases
			document.body.removeChild(CanvasInfoTeacher[CurrentPage].canvas);
			document.body.appendChild(CanvasInfoTeacher[CurrentPage - 1].canvas);	
		}
		
		changePage(false);
								
		//saves previous page (not new page) on pageup/down		
		if(window.auth)
		{
			if (CanvasInfo[CurrentPage+1].id) //note: save call happens async, must make sure proper page number is used or it will throw errors
			{
				Save(false, CurrentPage + 1, createSaveImage());
				return;
			}
			else 
			{
				Save(true, CurrentPage + 1, createSaveImage());
				return;
			}
		}
	}
	

/**Save, Update, & Open***********************************************************************/    

	//creates the saveimage for the student
	function createSaveImage()
	{
		//current canvas image
		var TempCanvas = createCanvas(CanvasPixelHeight, CanvasPixelWidth);		

		var TempCtx = TempCanvas.getContext("2d");
		
		//makes sure 'transparent' is white instead of black
		TempCtx.fillStyle = "white";
		TempCtx.rect(0, 0, CanvasWidth, CanvasHeight);
		TempCtx.fill();
		
		//draws current page by drawing teacher then student
		TempCtx.drawImage(CanvasInfoTeacher[CurrentPage].canvas, 0, 0);
		TempCtx.drawImage(CanvasInfo[CurrentPage].canvas, 0, 0);
		
		return TempCanvas;
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
	
/*********UPDATE Student*********************************************************************/
		
	document.getElementById("Update").onclick = function()
	{
		SelfUpdating = true;
		socket.emit('CommandToTeacher', 
		{
			ToolType: "Update"
		});
	}
	
/**Undo and Redo***********************************************************************/    

	//pops last part of undo list and redraws entire page from scratch
	document.getElementById("Undo").onclick = function()
	{
		//stops update call 
		clearSaveTimer();
		
		//pops last undo command to redo, calls redraw
		if (UndoList.length > 0)
		{
			RedoList.push(UndoList.pop());
			
			redrawUndo(UndoList, CanvasInfo[CurrentPage]);
		}
		
		startSave();
	}
	
	document.getElementById("Redo").onclick = function()
	{
		//stops update call 
		clearSaveTimer();
		
		//pops last redo command to undo, calls redraw
		if (RedoList.length > 0)
		{
			UndoList.push(RedoList.pop());
			redrawUndo(UndoList, CanvasInfo[CurrentPage]);
		}
		
		startSave();
	}
	
	

/*************************Move to Teacher Info**************************************************************************/
	
	document.getElementById("MoveToTeacher").onclick = function()
	{		
		document.body.removeChild(CanvasInfo[CurrentPage].canvas);
		document.body.removeChild(CanvasInfoTeacher[CurrentPage].canvas);
				
		document.body.appendChild(CanvasInfoTeacher[TeacherPage].canvas);
		document.body.appendChild(CanvasInfo[TeacherPage].canvas);
		
		CurrentPage = TeacherPage;
		
		var TotalPages = CanvasInfo.length-1;

		document.getElementById("PageNumber").innerHTML = CurrentPage + " of " + TotalPages;

		window.scrollTo(MouseTeacherX - window.innerWidth/2, MouseTeacherY - window.innerHeight/2); 
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
		
	/************************Push Notifications**************************************/
		
//		document.getElementById("Push").onclick = function()
//		{
//			var note = prompt("Write what you want to send to the presenter here:");
//			
//			socket.emit('CommandToStudent', 
//			{
//				ToolType: "Notification",
//				PushText: note
//			});
//		}	
	
	
/********************************************Handles all communication**************************************************/
		
	socket.on('CommandFromTeacher', function(data) 
	{				
		TeacherPage = data.PageNumber;
					
		if (data.ToolType == "Paint")
		{
			MouseTeacherX = data.x; 
			MouseTeacherY = data.y;
			
			CanvasInfoTeacher[TeacherPage].context.strokeStyle = data.color;
			CanvasInfoTeacher[TeacherPage].context.lineWidth = data.size;
			CanvasInfoTeacher[TeacherPage].context.globalCompositeOperation = data.erase; 

			CanvasInfoTeacher[TeacherPage].context.globalAlpha = data.opacity; 
						
		    draw(data.x, data.y, data.type, false, data.lastX, data.lastY, CanvasInfoTeacher[TeacherPage].context, TeacherPage);
		}
		else if (data.ToolType == "Extend")
		{
			var canvas = createCanvas(CanvasPixelHeight, CanvasPixelWidth, -1, 0, 0, true, null, null, CanvasHeight, CanvasWidth);
			var canvasT = createCanvas(CanvasPixelHeight, CanvasPixelWidth, -2, 0, 0, true, null, null, CanvasHeight, CanvasWidth);
		
			context = canvas.getContext("2d");
			contextT = canvasT.getContext("2d");

			CanvasInfo.push({}); 
			CanvasInfo[CanvasInfo.length - 1].context = context; 
			CanvasInfo[CanvasInfo.length - 1].canvas = canvas; 
			
			CanvasInfoTeacher.push({}); 
			CanvasInfoTeacher[CanvasInfoTeacher.length - 1].context = contextT; 
			CanvasInfoTeacher[CanvasInfoTeacher.length - 1].canvas = canvasT; 
			
			var TotalPages = CanvasInfo.length-1;

			document.getElementById("PageNumber").innerHTML = CurrentPage + " of " + TotalPages;
		}
		else if (data.ToolType == "Update")
		{			
			if (SelfUpdating || data.type)
			{
				for (var i = 0; i < data.TotalPages; i++)
				{
					if(!CanvasInfo[i])
					{
						var canvas = createCanvas(CanvasPixelHeight, CanvasPixelWidth, 0, 0, 0, true, null, null, CanvasHeight, CanvasWidth);
						var canvasT = createCanvas(CanvasPixelHeight, CanvasPixelWidth, -1, 0, 0, true, null, null, CanvasHeight, CanvasWidth);
						
						CanvasInfo[i] = {};
						CanvasInfoTeacher[i] = {};
						
						CanvasInfo[i].context = canvas.getContext("2d");
						CanvasInfo[i].canvas = canvas; 
						
						CanvasInfoTeacher[i].context = canvasT.getContext("2d");
						CanvasInfoTeacher[i].canvas = canvasT; 
					}		
					
					if (data.ImgData[i])
					{
						var img = new Image();
						
						img.src = data.ImgData[i];
						CanvasInfoTeacher[i].context.drawImage(img,0,0);
					}
				}
				
				var TotalPages = CanvasInfo.length-1;
	
				document.getElementById("PageNumber").innerHTML = CurrentPage + " of " + TotalPages;
			}			
		}
		else if (data.ToolType == "Undo" || data.ToolType == "UndoUpdate")
		{
			if(data.ToolType == "UndoUpdate")
				if (!(data.type || SelfUpdating) )
				{
					return;
				}
			
			var UndoListTeacher = JSON.parse(data.UndoList);
			
			//if theres a previously stored image
			if (data.ImgData)
			{
				var img = new Image();
				img.src = data.ImgData;
				CanvasInfoTeacher[data.PageNumber].image = img;
			}
				
			redrawUndo(UndoListTeacher, CanvasInfoTeacher[data.PageNumber]);
			
			if(data.ToolType == "UndoUpdate")
				SelfUpdating = false;
		}
		else //shapes
		{
			CanvasInfoTeacher[TeacherPage].context.beginPath();

			//stores current location of mouse
			MouseTeacherX = data.x; 
			MouseTeacherY = data.y; 
			
			//makes sure styling is correct
			CanvasInfoTeacher[TeacherPage].context.strokeStyle = data.color; 
			CanvasInfoTeacher[TeacherPage].context.lineWidth = data.size; 
			CanvasInfoTeacher[TeacherPage].context.globalCompositeOperation = data.erase; 
			CanvasInfoTeacher[TeacherPage].context.globalAlpha = data.opacity;

			if (data.ToolType == "Box")
			{
				var XDraw = Math.min(data.x, data.ShapeStartX),
		        YDraw = Math.min(data.y, data.ShapeStartY),
		        Width = Math.abs(data.x - data.ShapeStartX),
		        Height = Math.abs(data.y - data.ShapeStartY);
				CanvasInfoTeacher[TeacherPage].context.strokeRect(XDraw, YDraw, Width, Height);
			}
			else if (data.ToolType == "Circle")
			{
				//gets dimensions for circle
				var r = Math.abs(data.x-data.ShapeStartX);		
				CanvasInfoTeacher[TeacherPage].context.arc(data.ShapeStartX,data.ShapeStartY,r,0,2*Math.PI);
				CanvasInfoTeacher[TeacherPage].context.stroke();
			}
			else if (data.ToolType == "Line")
			{
				//Moves to start position and creates a line to the current x/y position
				CanvasInfoTeacher[TeacherPage].context.moveTo(data.ShapeStartX, data.ShapeStartY);
				CanvasInfoTeacher[TeacherPage].context.lineTo(data.x, data.y);
				CanvasInfoTeacher[TeacherPage].context.stroke();
			}	
			else if(data.ToolType == "Pan" || data.ToolType == "Copy")
			{
				var CanvasStore = createCanvas(data.PanHeight, data.PanWidth);
				CanvasStore.getContext("2d").drawImage(CanvasInfoTeacher[TeacherPage].canvas, data.PanX, data.PanY, data.PanWidth, data.PanHeight, 0, 0, data.PanWidth, data.PanHeight);
				if (data.ToolType == "Pan")
				{
					CanvasInfoTeacher[TeacherPage].context.clearRect(data.PanX, data.PanY, data.PanWidth, data.PanHeight);
				}
							
				CanvasInfoTeacher[TeacherPage].context.drawImage(CanvasStore, data.ShapeStartX, data.ShapeStartY);
			}
			else if (data.ToolType == "Image")
			{
				var img = new Image();
				img.src = data.ImgData;
				img.onload = function()
				{
					CanvasInfoTeacher[TeacherPage].context.drawImage(img, 0, 0);
				}
			}
		}
		
	});
