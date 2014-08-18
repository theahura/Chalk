/*
 * @author: Amol Kapoor
 * @version: 1
 * 
 * Description: The Teacher Client
 * 
 * Designed to send any drawing written on the teacher's board to the student's client through a central server. 
 */

	
/** Canvas Setup *****************************************************************
 * 
 *creates and sets up canvas, drawing events	
 *
 **/

//gets the canvas drawing board from HTML
TeacherLayer = document.getElementById('TeacherLayer');

CanvasInfoTeacher = new Array();

//sets default marker styling 	
CanvasInfoTeacher[0] = {};
CanvasInfoTeacher[0].context = TeacherLayer.getContext("2d");
CanvasInfoTeacher[0].canvas = TeacherLayer;

CanvasInfoTeacher[0].context.fillStyle = "solid";

//color
CanvasInfoTeacher[0].context.strokeStyle = "#A8A8A8";

//size
CanvasInfoTeacher[0].context.lineWidth = 5;

//cap style
CanvasInfoTeacher[0].context.lineCap = "round";

var TeacherPage;

HighlightCanvas = createCanvas(CanvasPixelHeight, CanvasPixelWidth, 0, 0, 0, true);

IsWhiteboard = true;

/********************************************Handles all communication**************************************************/
socket.on('CommandFromTeacher', function(data) 
{				
	TeacherPage = data.PageNumber;
				
	if (data.ToolType == "Paint")
	{
		MouseTeacherX = data.x; 
		MouseTeacherY = data.y;
		
		if(Math.abs(MouseTeacherX - data.lastX) > window.innerWidth/2 || Math.abs(MouseTeacherY - data.lastY) > window.innerHeight/2) //needs to be fixed 
			window.scrollTo(MouseTeacherX - window.innerWidth/2, MouseTeacherY - window.innerHeight/2); 
			

		if(data.opacity && data.opacity != 1.0) //highlighter
		{
			CanvasInfoTeacher[TeacherPage].context.save();
			CanvasInfoTeacher[TeacherPage].context.globalAlpha = data.opacity;
			CanvasInfoTeacher[TeacherPage].context.globalCompositeOperation = data.erase; 

			HighlightCanvas.getContext("2d").strokeStyle = data.color; 
			HighlightCanvas.getContext("2d").lineWidth = data.size;
			
			draw(data.x, data.y, data.type, false, data.lastX, data.lastY, HighlightCanvas.getContext("2d"), TeacherPage);
			
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
			
			draw(data.x, data.y, data.type, false, data.lastX, data.lastY, CanvasInfoTeacher[TeacherPage].context, TeacherPage);
		}
	}
	else if (data.ToolType == "Extend")
	{
		var canvasT = createCanvas(CanvasPixelHeight, CanvasPixelWidth, -2, 0, 0, true, null, null, CanvasHeight, CanvasWidth);
	
		contextT = canvasT.getContext("2d");

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
					var canvasT = createCanvas(CanvasPixelHeight, CanvasPixelWidth, -1, 0, 0, true, null, null, CanvasHeight, CanvasWidth);
					
					CanvasInfoTeacher[i] = {};
	
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
	
	if (TeacherPage && TeacherPage != CurrentPage);
	{
		document.body.removeChild(CanvasInfoTeacher[CurrentPage].canvas);
		CurrentPage = TeacherPage;
		document.body.appendChild(CanvasInfoTeacher[CurrentPage].canvas);
		
		var TotalPages = CanvasInfoTeacher.length-1;

		document.getElementById("PageNumber").innerHTML = CurrentPage + " of " + TotalPages;
	}
	
});
	
	