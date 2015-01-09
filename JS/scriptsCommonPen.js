/**
 * @author: Amol Kapoor
 * @version: 1
 * 
 * Description: The Core API
 * 
 * A location to store all of the scripts common to student and teacher, specifically editing pen stroke functionality 
 * 
 * Needs: scriptsCommon
 */

/**Drawing tools setup*************************************************************/
	
	
/*
Starts the setup for click handling and drawing to canvas. 

@param: context; canvas.drawcontext(2d); the context that we will be drawing to 
@param: pageNumber; int; the pageNumber that we will be drawing to
*/

function setup_click(context, pageNumber)
{
	//clears googledrive save timer 
	clearSaveTimer(); 
		
	//closes css/submenu tabs
	//CanvasInfo[pageNumber].canvas.focus();

	//settings for user in case of collaboration/change
	context.globalCompositeOperation = PaintType.erase; 
		
	context.lineWidth = DrawContext.lineWidth = PaintType.size*(MaxZoom - GlobalScale + 1);	
		
	context.strokeStyle = DrawContext.strokeStyle = PaintType.color;		
	
	context.globalAlpha = PaintType.opacity;
	
	//clears the redolist because the person made a change after the last undo/redo; prevents weird issues regarding non-chronological redo 
	CanvasInfo[pageNumber].RedoList = new Array();
}

/*
Handles all calls for paint/pen type functions

@param: x; int; the x location of the event
@param: y; int; the y location of the event
@param: lastX; int; the x location of the last event
@param: lastY; int; the y location of the last event
@param: context; canvas.drawcontext(2d); the context on which the event is called on
@param: pageNumber; int; where the event is being drawn
@param: isTeacher; bool; whether or not a teacher called the event
*/
function paint(x, y, type, lastX, lastY, context, pageNumber, isTeacher)
{
	if (type === "dragstart") 
	{	
		if(!(CanvasInfo[pageNumber].UndoList[CanvasInfo[pageNumber].UndoList.length - 1] instanceof Array) || (CanvasInfo[pageNumber].UndoList[CanvasInfo[pageNumber].UndoList.length - 1] instanceof Array && CanvasInfo[pageNumber].UndoList[CanvasInfo[pageNumber].UndoList.length - 1].length > 0))//debugging for paint events when dots dont get registered; only adds new array if previous array length != 0
		{
			CanvasInfo[pageNumber].UndoList.push(new Array());
		}
		
		//Resets midpoints to prepare for stroke commands with new input data
		XMid = 0;
		YMid = 0;
							
		DrawContext.save();			
	} 
	else if (type === "drag")
	{
		/*Running commands on the shapecanvas for editing due to non-object format of canvas painting*/
		DrawContext.beginPath();
		
		//Moves to either the midpoint calculated from the last curve, or the start of a new curve (pref. the former)
		DrawContext.moveTo(XMid || x, YMid || y);

		/*ink depth; changes canvasctx.linewidth based on user draw speed*/
		//Type: int; distance from the current point to the last point 
		var distance = Math.pow( lastX-x, 2 ) + Math.pow(  lastY-y, 2 );
		
		var ChangeAmount = .5/GlobalScale;
		var Size = context.lineWidth/GlobalScale;
		
		//based on the distance, decreases or increases the line width to create a sense of ink depth
		if (distance < Math.pow(5, 2))
		{
			if (DrawContext.lineWidth < Size)
				DrawContext.lineWidth = DrawContext.lineWidth + ChangeAmount;
		}
		else if (distance > Math.pow(5, 2 ) && distance < Math.pow(17, 2))
		{
			if (DrawContext.lineWidth >= Size)
				DrawContext.lineWidth = DrawContext.lineWidth - ChangeAmount;
		}
		else if (distance > Math.pow(17, 2 ))
		{
			if (DrawContext.lineWidth >= Size - 1)	
				DrawContext.lineWidth = DrawContext.lineWidth - ChangeAmount;
		}

	
		//calculates midpoints between the current and the last points
		XMid = (lastX + x) / 2;
	    YMid = (lastY + y) / 2;
	    
	    //and draws a curve (instead of a line) between the midpoints
	    DrawContext.quadraticCurveTo(lastX, lastY, XMid, YMid);
		
	    /*Pushes data as an undo command, to replicate later on*/
	    //debugs to make sure doesn't store excess points that are the same
		if (x != lastX || y != lastY) 
			//adds an extra point to a previous paint line
			CanvasInfo[pageNumber].UndoList[CanvasInfo[pageNumber].UndoList.length - 1].push(
			{
				//x,y position of the mouse
				x: x,
				y: y,
				//the previous x,y position of the mouse
				lastX: lastX,
				lastY: lastY, 
				//the properties of the draw
				color: context.strokeStyle,
				size: DrawContext.lineWidth,
				erase: context.globalCompositeOperation,
				//which canvas its drawing on 
				PageNumber: pageNumber,
				opacity: context.globalAlpha
			});
							
		//renders the drawing
		DrawContext.stroke();	
	}
	else if (type === "dragend")
	{
		//draws the second canvas onto the main one
		context.drawImage(DrawCanvas, 0, 0);
		
		//and clears the drawcanvas
		clear(true, DrawContext);
	}

	if (isTeacher)
	{
		/**
		 * Socket.io allows individual users to emit commands, which are then handled by the server to determine where 
		 * those commands go. Emit always takes two parameters; one is the name of the command for the server to listen 
		 * for, and the other is the data being passed in an object as strings
		 * 
		 * This command sends all of the information necessary to replicate the act of drawing a paint line on the student 
		 * side
		 * 
		 * @Param: 'CommandToStudent'; name of command being sent to student clients
		 * @Param: {}; object with data that will be handled on the student end
		 */
		socket.emit('CommandToStudent', { 
			//x,y position of the mouse
			x: x,
			y: y,
			//the type of click it was
			type: type,
			//the previous x,y position of the mouse
			lastX: lastX,
			lastY: lastY, 
			//the properties of the draw
			color: context.strokeStyle,
			size: DrawCanvas ? DrawContext.lineWidth : context.lineWidth,
			erase: context.globalCompositeOperation,
			//Paint, in this case...
			ToolType: ToolType,
			//Where it is being drawn
			PageNumber: pageNumber,
			opacity: context.globalAlpha
		}); 
	}
}


/*
Handles all calls for non-paint/pen type functions, including shape, copy, pan, etc. 

@param: x; int; the x location of the event
@param: y; int; the y location of the event
@param: lastX; int; the x location of the last event
@param: lastY; int; the y location of the last event
@param: context; canvas.drawcontext(2d); the context on which the event is called on
@param: pageNumber; int; where the event is being drawn
@param: isTeacher; bool; whether or not a teacher called the event
*/
function other_tools(x, y, type, lastX, lastY, context, pageNumber, isTeacher)
{
	if (type === "dragstart")
	{
		//sets up for shapes...
		//stores the current position of the mouse as the starting position for later use in determining 
		//shape size (not currently implemented) and selection area 
		StartPositionX = x;
		StartPositionY = y;
		CanvasPositionX = 0;
		CanvasPositionY = 0;
							
		DrawContext.save();
		
		if(ToolType != "Copy" && ToolType != "Pan")
			DrawContext.globalAlpha = 0.4;						
	}
	else if (type === "drag")
	{
		/*To create realtime size changing effect, clear the temporary canvas and redraw the shape slightly bigger/smaller each time*/
		//clears the canvas (see w3 school documentation)
		DrawContext.clearRect(0, 0, DrawCanvas.width, DrawCanvas.height);
		
		DrawContext.beginPath();

		if (ToolType == "Box")
		{
			var XDraw = Math.min(x, StartPositionX),
	        YDraw = Math.min(y, StartPositionY),
	        Width = Math.abs(x - StartPositionX),
	        Height = Math.abs(y - StartPositionY);
			return DrawContext.strokeRect(XDraw, YDraw, Width, Height);
		}
		else if (ToolType == "Circle")
		{
			//gets dimensions for circle
			var r = Math.abs(x-StartPositionX);		
			DrawContext.arc(StartPositionX,StartPositionY,r,0,2*Math.PI);
			return DrawContext.stroke();
		}
		else if (ToolType == "Line")
		{
			//Moves to start position and creates a line to the current x/y position
			DrawContext.moveTo(StartPositionX, StartPositionY);
			DrawContext.lineTo(x, y);
			return DrawContext.stroke();
		}
		else if (ToolType == "Copy" || ToolType == "Pan")
		{
			//finds the top/right most x/y point to determine where to draw the rect from
			var XDraw = Math.min(x, StartPositionX),
	        YDraw = Math.min(y, StartPositionY),
	        //determines the width and height of the rect
	        Width = Math.abs(x - StartPositionX),
	        Height = Math.abs(y - StartPositionY);
			//sets the line dash (space in pixels, dash in pixels)
			//settings
			DrawContext.strokeStyle = "#000000";
			DrawContext.lineWidth = 5*(MaxZoom - GlobalScale + 1);		
			DrawContext.setLineDash([5*(MaxZoom - GlobalScale + 1), 10*(MaxZoom - GlobalScale + 1)]);					
			//renders the actual rectangle 
			DrawContext.strokeRect(XDraw, YDraw, Width, Height);
		}
	}
	else if (type === "dragend")
	{
		
		//storing final key points for replication in undo lists and student transmission 
		EndPositionX = lastX;
		EndPositionY = lastY; 

		
		/*For copy and pan maneuvering, it has to constantly capture the image data from a fixed position later on. 
		 * To accomplish this, it creates another temporary canvas above the first two, and redraws by grabbing imagedata
		 * from the base canvas based on the selection area of the second canvas
		 */
		if(ToolType == "Copy" || ToolType == "Pan")
		{
			//gets the selection area size
			 var Width = Math.abs(EndPositionX - StartPositionX),
		     Height = Math.abs(EndPositionY - StartPositionY);
			 
			 //clears the area that is to be selected
			 DrawContext.clearRect(0, 0, DrawCanvas.width, DrawCanvas.height);
			 
			 //creates the third canvas
			 OverlayObject = document.createElement('canvas');
			 
			 //third canvas is as small as it needs to be
			 OverlayObject.width = Width;
			 OverlayObject.height = Height;
			 
			 /*Because image data selection must occur from the top left corner, 
			  * figuring out how to draw the copied image requires some brute force. 
			  * 
			  * The third canvas is created to be the size of the selected area, and maneuvered such that
			  * the selected image data can be directly copied on.  
			  */
			 if(StartPositionX > EndPositionX) //left side	
			 {
				 //Moves the starting spot over by one width
				 StartPositionX = StartPositionX - Width;
				 //Moves the third canvas to the starting position
				 OverlayObject.style.left = StartPositionX; 
				 
				 //upper left
				 if(StartPositionY > EndPositionY)	
				{
					 StartPositionY = StartPositionY - Height;
					 DrawContext.drawImage(CanvasInfo[CurrentPage].canvas, StartPositionX, StartPositionY, Width, Height, StartPositionX, StartPositionY, Width, Height);	 
					 OverlayObject.style.top = StartPositionY;  
					 OverlayObject.getContext("2d").drawImage(DrawCanvas, StartPositionX, StartPositionY, Width, Height, 0, 0, Width, Height); 
				}
				 //lower left
				 else		
				{
					 DrawContext.drawImage(CanvasInfo[CurrentPage].canvas, StartPositionX, StartPositionY, Width, Height, StartPositionX, StartPositionY, Width, Height);
					 OverlayObject.style.top = StartPositionY;  
					 OverlayObject.getContext("2d").drawImage(DrawCanvas, StartPositionX, StartPositionY, Width, Height, 0, 0, Width, Height); 
				}
			 }
			 else //right side
			 {
				 OverlayObject.style.left = StartPositionX; 
				 //upper right
				 if(StartPositionY > EndPositionY)	
				{
					 StartPositionY = StartPositionY - Height;
					 DrawContext.drawImage(CanvasInfo[CurrentPage].canvas, StartPositionX, StartPositionY, Width, Height, StartPositionX, StartPositionY, Width, Height);
					 OverlayObject.style.top = StartPositionY;  
					 OverlayObject.getContext("2d").drawImage(DrawCanvas, StartPositionX, StartPositionY, Width, Height, 0, 0, Width, Height); 
				}
			     else
			    {
					 DrawContext.drawImage(CanvasInfo[CurrentPage].canvas, StartPositionX, StartPositionY, Width, Height, StartPositionX, StartPositionY, Width, Height);
					 OverlayObject.style.top = StartPositionY;  
					 OverlayObject.getContext("2d").drawImage(DrawCanvas, StartPositionX, StartPositionY, Width, Height, 0, 0, Width, Height); 
			    }
			 }
				
			 //Stores the base locations of the image data that was grabbed and moved in case it needs to undo them later
			 CopyPanX = StartPositionX; 
			 CopyPanY = StartPositionY; 
			 CopyPanWidth = Width; 
			 CopyPanHeight = Height;
			 
			 //if the command is a pan, we don't need the original copy of the image data; it is cleared
			if (ToolType == "Pan")
			{
				 CanvasInfo[pageNumber].context.clearRect(StartPositionX, StartPositionY, Width, Height);
			}
		}


		//Tracks/Backs-up the tooltype to prevent conflicts from collaboration mode (not currently implemented)
		StoreToolType = ToolType;
		//sets to shape adjust mode for editing shape position once drawn
		ToolType = "ShapeAdjust";
	}
}	

/*
Handles all calls for paint/pen type functions when the person making the event call is not the user (e.g. teacher to student)

@param: x; int; the x location of the event
@param: y; int; the y location of the event
@param: lastX; int; the x location of the last event
@param: lastY; int; the y location of the last event
@param: context; canvas.drawcontext(2d); the context on which the event is called on
@param: pageNumber; int; where the event is being drawn
*/
function not_self(x, y, type, lastX, lastY, context, pageNumber)
{
	if (type == "dragstart")
	{
		XMidOther = YMidOther = 0;
			
		//begins the draw path
		context.beginPath();
		
		//Moves the pen to the starting location
		context.moveTo(x, y);
	}
	else if (type === "drag")
	{
		context.beginPath();
		context.moveTo(XMidOther || x, YMidOther || y);
		
		//draws curves for smoother lines
		XMidOther = (lastX + x) / 2;
	    YMidOther = (lastY + y) / 2;
	    
	    context.quadraticCurveTo(lastX, lastY, XMidOther, YMidOther);
	    context.stroke();
	}
}

/*
	Cleans up anything left for draw/rendering functions
*/

function cleanup_click()
{
	if(!IsWhiteboard)
		startSave();
	
	if(DrawContext)
	{
		DrawContext.restore();
	}
}


/**
 * Shape Adjust - this handles moving the shapes that were drawn/selected in the first part 
 * 
 * 1: Mousedown/dragstart: Nothing
 * 
 * 2: Mousemove/drag: Moves the image that is drawn on the DrawCanvas
 * 
 * 3: Puts everything from DrawCanvas to the basecanvas, sends image command to student
 * 
 * Note the missing isSelf variable in the params list. Shape drawings from external sources are always handled
 * separately; any call to AdjustShape should be local (teacher only).
 * 
 *  Could potentially add a canvas param that actually gets moved around instead of using a global DrawCanvas
 * 
 * @Param: x; int; the x position of the click event
 * @Param: y; int;  the y position of the click event
 * @Param: type; String; the type of event (click, drag, release)
 * @Param: lastX; int; the last registered X position 
 * @Param: lastY; int; the last registered Y position 
 * @Param: context; Canvas.getContext('2d'); the pen being used to draw (note: inefficient call due to...)
 * @Param: pageNumber; int; the page that is being drawn on
 */

function adjustShape(x, y, type, lastX, lastY, context, pageNumber, isTeacher)
{
	clearSaveTimer();
	
	//doesn't do anything on dragstart
	if (type == "dragstart")
	{
		DrawContext.save();
		return;
	}
	//heres the magic
	else if (type === "drag") 
	{			
		//finds distance changed
		var OffsetX = x - lastX; 
		var OffsetY = y - lastY; 				
		
		//adds it to the moved "new" position of the image that is being dragged around
		CanvasPositionX += OffsetX;
		CanvasPositionY += OffsetY; 	
					
		//clears canvas + preps for redrawing the image in a new spot
		DrawContext.beginPath();
		
		DrawContext.clearRect(-CanvasPositionX, -CanvasPositionY, DrawCanvas.width, DrawCanvas.height);
		
		//moves context over specified changed distance
		DrawContext.translate(OffsetX, OffsetY);
		
		if(StoreToolType == "Box")
		{
			//gets dimensions for rectangle
			var XDraw = Math.min(EndPositionX, StartPositionX),
	        YDraw = Math.min(EndPositionY, StartPositionY),
	        Width = Math.abs(EndPositionX - StartPositionX),
	        Height = Math.abs(EndPositionY - StartPositionY);
			return DrawContext.strokeRect(XDraw, YDraw, Width, Height);
		}
		else if (StoreToolType == "Circle")
		{
			//gets dimensions for circle
			var r = Math.abs(EndPositionX-StartPositionX);			
			DrawContext.arc(StartPositionX,StartPositionY,r,0,2*Math.PI);
			return DrawContext.stroke();
		}
		else if (StoreToolType == "Line")
		{
			//Moves to start position and creates a line to the current x/y position
			DrawContext.moveTo(StartPositionX, StartPositionY);
			DrawContext.lineTo(EndPositionX, EndPositionY);
			return DrawContext.stroke();
		}
		//For copy and paste, draw the image that was selected and stored in the OverlayObject on drag end earlier
		else if (StoreToolType == "Copy" || StoreToolType == "Pan")
		{					
			DrawContext.drawImage(OverlayObject, StartPositionX, StartPositionY);
		}
		else if (StoreToolType == "Image")
		{
			DrawContext.drawImage(OverlayObject, ImageScrollX, ImageScrollY);
		}
	} 
	else //mouse release
	{
		if (StoreToolType == "Copy" || StoreToolType == "Pan")
		{
			//makes sure we're not in erase mode
			context.globalCompositeOperation = "source-over";
		}
		
		//replicates the draw image command in its final location for replication on undo
		CanvasInfo[pageNumber].UndoList.push({
				x: EndPositionX + CanvasPositionX, 
				y: EndPositionY + CanvasPositionY, 
				//if its an image data set, we want only the amount the person moved the image over, not the amount + where the mouse 
				//ended up
				StartPositionX: StoreToolType == "Image" ? CanvasPositionX + ImageScrollX : StartPositionX + CanvasPositionX,
				StartPositionY: StoreToolType == "Image" ? CanvasPositionY + ImageScrollY : StartPositionY + CanvasPositionY, 
				PageNumber: pageNumber,
				ToolType: StoreToolType,
				color: DrawContext.strokeStyle,
				size: DrawContext.lineWidth,
				erase: context.globalCompositeOperation,
				PanX: CopyPanX,
				PanY: CopyPanY,
				PanWidth: CopyPanWidth,
				PanHeight: CopyPanHeight,
				Image: StoreToolType == "Image" ? OverlayObject : null,
				ImgData: StoreToolType == "Image" ? DrawCanvas.toDataURL() : null,
				opacity: context.globalAlpha
		});

		if(isTeacher)
		{
			/**
			 * Emits shape display to student such that the image created on the student side 
			 * is the shape in its final position
			 * 
			 * @Param: 'CommandToStudent'; name of command being sent to student clients
			 * @Param: {}; object with data that will be handled on the student end
			 */				
			socket.emit('CommandToStudent', 
			{
				//the final x/y positions
				x: EndPositionX + CanvasPositionX, 
				y: EndPositionY + CanvasPositionY, 
				StartPositionX: StartPositionX + CanvasPositionX,
				StartPositionY: StartPositionY + CanvasPositionY, 
				//the canvas page where this is drawn
				PageNumber: pageNumber,
				//What tool is being used; store tool type because shapeadjust functions are always done by the individual. 
				//Can't be influenced by outside user
				ToolType: StoreToolType,
				//Preferences
				color: DrawContext.strokeStyle,
				size: DrawContext.lineWidth,
				erase: context.globalCompositeOperation,
				//Where the copy or pan data was taken from 
				PanX: CopyPanX,
				PanY: CopyPanY,
				PanWidth: CopyPanWidth,
				PanHeight: CopyPanHeight,
				//note: if teacher uploads image and immediately starts drawing, the student 
				//loses some notes from the teacher due to overwriting/timing issues; perhaps add 
				//a loading screen teacher side to prevent additional writing immediately afterwords? food for thought
				ImgData: StoreToolType == "Image" ? DrawCanvas.toDataURL() : null,
				opacity: context.globalAlpha
			});
		}
							
		//Memory clearing 
		OverlayObject = null;			
		
		if(StoreToolType == "Copy" || StoreToolType == "Pan")
		{
			context.save();
			context.globalAlpha = 1.0;
			context.drawImage(DrawCanvas, 0, 0);
			context.restore();
		}
		else
		{
			context.drawImage(DrawCanvas, 0, 0);
		}

		//deletes/clears memory for temp canvas and resets any changed vars
		clear(true, DrawContext);
		CanvasPositionX = CanvasPositionY = 0;
		
		ToolType = StoreToolType = "Paint"; 
	
		startSave();
		
		DrawContext.restore();
							
		//makes sure the color preferences go back to the default color scheme after being changed to black-dashed lines for context
		return changeStyle(PaintType.color, null, PaintType.size, PaintType.opacity);
	}		
}


/*
	draws an empty box at the position specified by x/y
	@param: x; int; x location of the new textbox
	@param: y; int; y location of the new textbox
	@return: the textbox that gets created
*/
 function drawBox (x, y, type, lastX, lastY, box)
{
	if(type === "dragstart")
	{
		if (box)
			saveBox(box, CanvasInfo[CurrentPage].context, CurrentPage, IsTeacher);

		box = document.createElement('textarea'); // creates the element
	    box.id = "activeBox";

	   //places box at user's where the user clicked
	    box.style.position = 'absolute'; // position it
	    box.style.left = x + 'px';
	    box.style.top = y + 70 + 'px';

	    box.rows = 5;

	    //styles box
	    box.style.color = PaintType.color;
	    //some magic numbers
	    box.style.fontSize = PaintType.size*30/70 + 12;

	    BoxHeight = BoxWidth = 0; 

	   	document.body.appendChild(box); // add it as last child of body elemnt
	}
	else if (type === "drag")
	{
		//finds distance changed
		var OffsetX = x - lastX; 
		var OffsetY = y - lastY; 

		BoxHeight += OffsetY;
		BoxWidth += OffsetX;

		$(box).css({"height":BoxHeight+"px"});
		$(box).css({"width":BoxWidth+"px"});
	}
	else
	{
	    //places cursor in box
	    box.focus();
	}
	return box; 
}

/** 
*converts a textarea to writing on the canvas
*if the textarea is empty removes the box without saving
*if not, pushes the textarea onto context and draws
*removes the box afterwards
*
*/
function saveBox(box, context, pageNumber, isTeacher)
{
	var box = document.getElementById("activeBox");
 	if (box.value == "")
    {
        $("#activeBox").remove();
        ActiveBox = null;
    }
    else
    {
        var textObj= {
        	ToolType: ToolType,
        	PageNumber: pageNumber,
            color: box.style.color,
            StartPositionX: box.style.left,
            StartPositionY: box.style.top,
            EndPositionX: parseInt(box.style.left) + parseInt(box.style.width) + "px",
            EndPositionY: parseInt(box.style.top) - parseInt(box.style.height) + "px",
            ImgData: box.value,
            size: box.style.fontSize
        }        
        
        if(isTeacher)
		{
			/**
			 * Emits shape display to student such that the image created on the student side 
			 * is the shape in its final position
			 * 
			 * @Param: 'CommandToStudent'; name of command being sent to student clients
			 * @Param: {}; object with data that will be handled on the student end
			 */				
			socket.emit('CommandToStudent', {
				ToolType: ToolType,
	        	PageNumber: pageNumber,
	            color: box.style.color,
	            StartPositionX: box.style.left,
	            StartPositionY: box.style.top,
	            PanX: parseInt(box.style.left) + parseInt(box.style.width) + "px",
	            PanY: parseInt(box.style.top) - parseInt(box.style.height) + "px",
	            ImgData: box.value,
	            size: box.style.fontSize
			});
		}

		CanvasInfo[pageNumber].UndoList.push(textObj);

        wrapTextObj(textObj, context);

        $("#activeBox").remove();

        ActiveBox = null;
    }
}

/**
 *Writes the text from the passed object t onto the passed canvas
 *@param t the text object to be drawn
 *@param context the canvas context where the text will be writted
 *@precondition t.style == "text"
 */
function wrapTextObj(t, context)
{
	context.fillStyle = t.color;
	context.font = t.size + " Arial";
    var lineHeight= parseInt(t.size);

    //normalizes line breaks
    t.ImgData.replace(/\r\n/g, "\n");
    //splits the words by lines
    var lines = t.ImgData.split("\n");
    //represents the line to be added
    var line = '';
    //various magic numbers for making text look exactly like it did in the box
    //boxY+=(parseInt(inputSize) * 1.4);
    var bX= parseInt(t.StartPositionX);
    var bY= parseInt(t.StartPositionY) - 70;

    bY+=0.9295 * (parseInt(t.size)) + 4.86
    bX+=3;

    var maxWidth= parseInt(t.EndPositionX) - parseInt(t.StartPositionX);

    //looks at each line
    for(var n = 0; n < lines.length; n++) 
    {
    	//looks at each word, checks the width of the line and adds to a new line if the width is over 
    	var words = lines[n].split(' ');
    	for (var i = 0; i < words.length; i++)
    	{
    		var testline = line + words[i] + ' ';
	        var metrics = context.measureText(testline);
	        var testWidth = metrics.width;

	        if (testWidth > maxWidth && i > 0) 
	        {
	            context.fillText(line, bX, bY);
	            line = words[i] + ' ';
	            bY += lineHeight;
	        }
	        else 
	        {
	            line = testline;
	        }
    	}
	    context.fillText(line, bX, bY);
	    line = '';
    	bY += lineHeight;       
    }

    context.fillText(line, bX, bY);
    context.stroke();
    context.closePath();
}
	
