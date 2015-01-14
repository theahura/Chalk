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
	
	var MouseTeacherX, MouseTeacherY;
	
	//note: highlightcanvas can be drawn on, even though it is not ever rendered
	HighlightCanvas = createCanvas(CanvasPixelHeight, CanvasPixelWidth, 0, 0, 0, true);
	
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
	CanvasInfo[0].context = StudentLayer.getContext("2d");
	CanvasInfo[0].canvas = StudentLayer;

	CanvasInfo[0].context.fillStyle = "solid";

	//color
	CanvasInfo[0].context.strokeStyle = "#000000";
	BackUpPen.color = PaintType.color = CanvasInfo[0].context.strokeStyle; 
		
	//size
	CanvasInfo[0].context.lineWidth = 5;

	//cap style
	CanvasInfo[0].context.lineCap = "round";
	
	
	
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
	
	/**	Colors **/
	//Red
	document.getElementById("Red").onclick = function(){
		changeStyle("#cc0000", "Red");
		};
		
	//Blue
	document.getElementById("Blue").onclick = function(){
		changeStyle("#0000cc", "Blue");};
		
	//Yellow
	document.getElementById("Yellow").onclick = function(){
		changeStyle("#cccc00", "Yellow");};
		
	//Green
	document.getElementById("Green").onclick = function(){
		changeStyle("#00cc00", "Green");};
		
	//Purple
	document.getElementById("Purple").onclick = function(){
		changeStyle("#44146f", "Purple");};
		
	//Orange
	document.getElementById("Orange").onclick = function(){
		changeStyle("#cc8400", "Orange");};
		
	//Black
	document.getElementById("Black").onclick = function(){
		changeStyle("#000000", "Black");};
	
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
		
		var TotalPages = CanvasInfo.length;
		
		var CurrentPagesTemp = CurrentPage + 1;

		document.getElementById("PageNumber").innerHTML = CurrentPagesTemp + " of " + TotalPages;
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


/*********UPDATE Student*********************************************************************/
		
	// document.getElementById("Update").onclick = function()
	// {
	// 	SelfUpdating = true;
	// 	socket.emit('CommandToTeacher', 
	// 	{
	// 		ToolType: "Update"
	// 	});
	// }
	
/**Undo and Redo***********************************************************************/   

	//pops last part of undo list and redraws entire page from scratch
	document.getElementById("Undo").onclick = function()
	{
		//stops update call 
		clearSaveTimer();
		
		//pops last undo command to redo, calls redraw
		if (CanvasInfo[CurrentPage].UndoList.length > 0)
		{
			CanvasInfo[CurrentPage].RedoList.push(CanvasInfo[CurrentPage].UndoList.pop());
			
			redrawUndo(CanvasInfo[CurrentPage].UndoList, CanvasInfo[CurrentPage]);
		}
		
		startSave();
	}
	
	document.getElementById("Redo").onclick = function()
	{
		//stops update call 
		clearSaveTimer();
		
		//pops last redo command to undo, calls redraw
		if (CanvasInfo[CurrentPage].RedoList.length > 0)
		{
			CanvasInfo[CurrentPage].UndoList.push(CanvasInfo[CurrentPage].RedoList.pop());
			redrawUndo(CanvasInfo[CurrentPage].UndoList, CanvasInfo[CurrentPage]);
		}
		
		startSave();
	}
	
	

/*************************Move to Teacher Info**************************************************************************/
	
	document.getElementById("MoveToTeacher").onclick = function()
	{		
		if(TeacherPage != CurrentPage)
		{
			document.body.removeChild(CanvasInfo[CurrentPage].canvas);
			document.body.removeChild(CanvasInfoTeacher[CurrentPage].canvas);
					
			document.body.appendChild(CanvasInfoTeacher[TeacherPage].canvas);
			document.body.appendChild(CanvasInfo[TeacherPage].canvas);
		}
		
		CurrentPage = TeacherPage;
		
		var TotalPages = CanvasInfo.length;
		
		var CurrentPagesTemp = CurrentPage + 1;

		document.getElementById("PageNumber").innerHTML = CurrentPagesTemp + " of " + TotalPages;

		window.scrollTo(MouseTeacherX - window.innerWidth/2, MouseTeacherY - window.innerHeight/2); 
	}
	


		
	/************************Push Notifications**************************************/
		
		document.getElementById("Push").onclick = function()
		{
			$("#PromptText").html("Write what you want to send to the presenter here:");
			document.getElementById("PromptInput").value = "";

			document.getElementById("Prompt_Accept").onclick = function()
			{
				var note = document.getElementById("PromptInput").value;
				socket.emit('CommandToTeacher', 
				{
					ToolType: "Notification",
					PushText: note,
					Name: Name
				});
			};

			$("#PromptBox").fadeIn(250);
		}	

	
	
/********************************************Handles all communication**************************************************/
		
	socket.on('CommandFromTeacher', function(data) 
	{				
		TeacherPage = data.PageNumber;
					
		if (data.ToolType == "Paint")
		{
			MouseTeacherX = data.x; 
			MouseTeacherY = data.y;
			
			if(data.opacity && data.opacity != 1.0) //highlighter
			{
				CanvasInfoTeacher[TeacherPage].context.save();
				CanvasInfoTeacher[TeacherPage].context.globalAlpha = data.opacity;
				CanvasInfoTeacher[TeacherPage].context.globalCompositeOperation = data.erase; 

				HighlightCanvas.getContext("2d").strokeStyle = data.color; 
				HighlightCanvas.getContext("2d").lineWidth = data.size;
				

				//not_self(x, y, type, lastX, lastY, context, pageNumber, isTeacher)
				not_self(data.x, data.y, data.type, data.lastX, data.lastY, HighlightCanvas.getContext("2d"), TeacherPage);
				
				if(data.type == "dragend")
				{
					CanvasInfoTeacher[TeacherPage].context.drawImage(HighlightCanvas, 0, 0);
					clear(true, HighlightCanvas.getContext("2d"));
					CanvasInfoTeacher[TeacherPage].context.restore();
				}
			}
			else
			{
				CanvasInfoTeacher[TeacherPage].context.strokeStyle = data.color;
				CanvasInfoTeacher[TeacherPage].context.lineWidth = data.size;
				CanvasInfoTeacher[TeacherPage].context.globalCompositeOperation = data.erase; 
				CanvasInfoTeacher[TeacherPage].context.globalAlpha = 1.0;

				not_self(data.x, data.y, data.type, data.lastX, data.lastY, CanvasInfoTeacher[TeacherPage].context, TeacherPage);
			}
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
			CanvasInfo[CanvasInfo.length - 1].UndoList = new Array(); 
			CanvasInfo[CanvasInfo.length - 1].RedoList = new Array(); 

			CanvasInfoTeacher.push({}); 
			CanvasInfoTeacher[CanvasInfoTeacher.length - 1].context = contextT; 
			CanvasInfoTeacher[CanvasInfoTeacher.length - 1].canvas = canvasT; 
			
			var TotalPages = CanvasInfo.length;
			
			var CurrentPagesTemp = CurrentPage + 1;

			document.getElementById("PageNumber").innerHTML = CurrentPagesTemp + " of " + TotalPages;
		}
		// else if (data.ToolType == "Update")
		// {			
		// 	if (SelfUpdating || data.type)
		// 	{
		// 		for (var i = 0; i < data.TotalPages; i++)
		// 		{
		// 			if(!CanvasInfo[i])
		// 			{
		// 				var canvas = createCanvas(CanvasPixelHeight, CanvasPixelWidth, -1, 0, 0, true, null, null, CanvasHeight, CanvasWidth);
		// 				var canvasT = createCanvas(CanvasPixelHeight, CanvasPixelWidth, -2, 0, 0, true, null, null, CanvasHeight, CanvasWidth);
						
		// 				CanvasInfo[i] = {};
		// 				CanvasInfoTeacher[i] = {};
						
		// 				CanvasInfo[i].context = canvas.getContext("2d");
		// 				CanvasInfo[i].canvas = canvas; 
						
		// 				CanvasInfoTeacher[i].context = canvasT.getContext("2d");
		// 				CanvasInfoTeacher[i].canvas = canvasT; 
		// 			}		
					
		// 			if (data.ImgData[i])
		// 			{		
		// 				redrawUndo(data.ImgData[i], CanvasInfoTeacher[i]);
		// 			}
		// 		}
				
		// 		var TotalPages = CanvasInfo.length;
						
		// 		var CurrentPagesTemp = CurrentPage + 1;
	
		// 		document.getElementById("PageNumber").innerHTML = CurrentPagesTemp + " of " + TotalPages;
		// 	}			
		// }
		else if (data.ToolType == "Undo")
		{			
			var UndoListTeacher = JSON.parse(data.UndoList);
				
			redrawUndo(UndoListTeacher, CanvasInfoTeacher[data.PageNumber]);
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
						
				CanvasInfoTeacher[TeacherPage].context.save();
				CanvasInfoTeacher[TeacherPage].context.globalAlpha = 1.0;

				CanvasInfoTeacher[TeacherPage].context.drawImage(CanvasStore, data.ShapeStartX, data.ShapeStartY);

				CanvasInfoTeacher[TeacherPage].context.restore();
			}
			else if (data.ToolType == "Image")
			{
				var img = new Image();
				img.onload = function()
				{
					CanvasInfoTeacher[TeacherPage].context.drawImage(img, 0, 0);
				}
				img.src = data.ImgData;
			}
			else if (data.ToolType === "TextMode")
			{
				data.StartPositionX = data.ShapeStartX;
				data.StartPositionY = data.ShapeStartY;
				data.EndPositionX = data.Panx;
				data.EndPositionY = data.Pany; 
				
				wrapTextObj(data, CanvasInfoTeacher[TeacherPage].context);
			}
		}
		
	});
