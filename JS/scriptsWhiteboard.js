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

//sets default marker styling 	
CanvasInfo[0] = {};
CanvasInfo[0].context = TeacherLayer.getContext("2d");
CanvasInfo[0].canvas = TeacherLayer;

CanvasInfo[0].context.fillStyle = "solid";

//color
CanvasInfo[0].context.strokeStyle = "#A8A8A8";

//size
CanvasInfo[0].context.lineWidth = 5;

//cap style
CanvasInfo[0].context.lineCap = "round";

/********************************************Handles all communication**************************************************/
		
	socket.on('CommandFromTeacher', function(data) 
	{				
		var TeacherPage = data.PageNumber;
		
		if (data.ToolType == "Paint")
		{
			MouseTeacherX = data.x; 
			MouseTeacherY = data.y;
			
			CanvasInfo[TeacherPage].context.strokeStyle = data.color;
			CanvasInfo[TeacherPage].context.globalCompositeOperation = data.erase;
			CanvasInfo[TeacherPage].context.lineWidth = data.size;
			
			
		    if(Math.abs(MouseTeacherX - data.lastX) > window.innerWidth/2 || Math.abs(MouseTeacherY - data.lastY) > window.innerHeight/2) //needs to be fixed 
		    	window.scrollTo(MouseTeacherX - window.innerWidth/2, MouseTeacherY - window.innerHeight/2); 
			
		    draw(data.x, data.y, data.type, false, data.lastX, data.lastY, CanvasInfo[TeacherPage].context, TeacherPage);
		}
		else if (data.ToolType == "Extend")
		{
			var canvas = createCanvas(CanvasHeight, CanvasWidth, -1, 0, 0, true);

			context = canvas.getContext("2d");
		
			CanvasInfo.push({}); 
			CanvasInfo[CanvasInfo.length - 1].context = context; 
			CanvasInfo[CanvasInfo.length - 1].canvas = canvas; 
			
			var TotalPages = CanvasInfo.length-1;

			document.getElementById("PageNumber").innerHTML = CurrentPage + " of " + TotalPages;
		}
		else if (data.ToolType == "Update")
		{			
			for (var i = 0; i < data.TotalPages; i++)
			{
				if(!CanvasInfo[i])
				{
					var canvas = createCanvas(CanvasHeight, CanvasWidth, 0, 0, 0, true);
					
					CanvasInfo[i] = {};					
					CanvasInfo[i].context = canvas.getContext("2d");
					CanvasInfo[i].canvas = canvas; 
				}			
				
				if (data.ImgData[i])
				{
					var img = new Image();
					
					img.src = data.ImgData[i];
					CanvasInfo[i].context.drawImage(img,0,0);
				}
			}
			
			var TotalPages = CanvasInfo.length-1;

			document.getElementById("PageNumber").innerHTML = CurrentPage + " of " + TotalPages;
		}
		else if (data.ToolType == "Undo")
		{
			var UndoListTeacher = JSON.parse(data.UndoList);
			
			//if theres a previously stored image
			if (data.ImgData)
			{
				var img = new Image();
				img.src = data.ImgData;
				CanvasInfo[data.PageNumber].image = img;
			}
				
			redrawUndo(UndoListTeacher, CanvasInfo[data.PageNumber]);
		}
		else //shapes
		{
			//stores current location of mouse
			MouseTeacherX = data.x; 
			MouseTeacherY = data.y; 
			
			//makes sure styling is correct
			CanvasInfo[TeacherPage].context.strokeStyle = data.color; 
			CanvasInfo[TeacherPage].context.lineWidth = data.size; 
			CanvasInfo[TeacherPage].context.globalCompositeOperation = "source-over"; 

			if(data.ToolType == "Pan" || data.ToolType == "Copy")
			{
				var CanvasStore = createCanvas(data.PanHeight, data.PanWidth);
				CanvasStore.getContext("2d").drawImage(CanvasInfo[TeacherPage].canvas, data.PanX, data.PanY, data.PanWidth, data.PanHeight, 0, 0, data.PanWidth, data.PanHeight);
				if (data.ToolType == "Pan")
				{
					CanvasInfo[TeacherPage].context.clearRect(data.PanX, data.PanY, data.PanWidth, data.PanHeight);
				}
							
				CanvasInfo[TeacherPage].context.drawImage(CanvasStore, data.ShapeStartX, data.ShapeStartY);
			}
			else if (data.ToolType == "Image")
			{
				var img = new Image();
				img.src = data.ImgData;
				img.onload = function()
				{
					CanvasInfo[TeacherPage].context.drawImage(img, 0, 0);
				}
			}
		}
				
		if (TeacherPage && TeacherPage != CurrentPage);
		{
			document.body.removeChild(CanvasInfo[CurrentPage].canvas);
			CurrentPage = TeacherPage;
			document.body.appendChild(CanvasInfo[CurrentPage].canvas);
			
			var TotalPages = CanvasInfo.length-1;

			document.getElementById("PageNumber").innerHTML = CurrentPage + " of " + TotalPages;
		}
		
	});
	
