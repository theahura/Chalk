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
	
	
	/**
	 * This function handles strokes done by the user. It controls drawing (paint and shapes), 
	 * and selecting paint areas (pan + copy/paste). When called, it resets any
	 * googledrive save timer to 0 and starts it again once the call for paint calls is finished.
	 * 
	 * 1: Mousedown/dragstart: resets all vars necessary for whatever tool, prepares the shapecanvas to for temp drawing
	 * 
	 * 2: Mousemove/drag: does the actual draw command over a series of individual draw function calls, either by scaling an image
	 * 	  or connecting lines through quadratic curves
	 * 
	 * 3: Mouseup/dragend: puts everything from shapecanvas to the base canvas, preps for shapeadjust if necessary
	 * 
	 * Sends paint command to student outside of drag check
	 * 
	 * 
	 * @Param: x; int; the x position of the click event
	 * @Param: y; int;  the y position of the click event
	 * @Param: type; String; the type of event (click, drag, release)
	 * @Param: isSelf; Bool; whether the teacher or the student is drawing (not currently implemented) 
	 * @Param: lastX; int; the last registered X position 
	 * @Param: lastY; int; the last registered Y position 
	 * @Param: context; Canvas.getContext('2d'); the pen being used to draw (note: inefficient call due to...)
	 * @Param: pageNumber; int; the page that is being drawn on
	 */
	function draw(x, y, type, isSelf, lastX, lastY, context, pageNumber, isTeacher)
	{
		//clears googledrive save timer 
		clearSaveTimer(); 
			
		//If its not editing the position of a shape on drag...
		/*if in collaboration mode (not currently implemented) and the person drawing 
		 * is the teacher, make sure the 'teacher' preferences are set*/
		if (isSelf)
		{
			//closes css/submenu tabs
			CanvasInfo[CurrentPage].canvas.focus();

			//settings for user in case of collaboration/change
			context.globalCompositeOperation = PaintType.erase; 
				
			context.lineWidth = DrawContext.lineWidth = PaintType.size*(MaxZoom - GlobalScale + 1);	
				
			context.strokeStyle = DrawContext.strokeStyle = PaintType.color;		
			
			context.globalAlpha = PaintType.opacity;
			
			//clears the redolist because the person made a change after the last undo/redo; prevents weird issues regarding non-chronological redo 
			CanvasInfo[pageNumber].RedoList = new Array();
		}

		//on mouse click down...
		if (type === "dragstart") 
		{		
			if(isSelf)
			{
				//sets up for shapes...
				if(ToolType != "Paint")
				{
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
				//or, if it is a paint command, adds a new array to the undo list
				//if the previous one is not an array; or if it is an array and the length is greater than 0 (i.e. exists)
				else 
				{
					console.log(CanvasInfo[pageNumber] + " " + CanvasInfo[pageNumber].UndoList);
					if(!(CanvasInfo[pageNumber].UndoList[CanvasInfo[pageNumber].UndoList.length - 1] instanceof Array) || (CanvasInfo[pageNumber].UndoList[CanvasInfo[pageNumber].UndoList.length - 1] instanceof Array && CanvasInfo[pageNumber].UndoList[CanvasInfo[pageNumber].UndoList.length - 1].length > 0))//debugging for paint events when dots dont get registered; only adds new array if previous array length != 0
					{
						CanvasInfo[pageNumber].UndoList.push(new Array());
					}
					
					//Resets midpoints to prepare for stroke commands with new input data
					XMid = 0;
					YMid = 0;
										
					DrawContext.save();			
				}					
			}
			else //not self writing 
			{
				XMidOther = YMidOther = 0;
				
				//begins the draw path
				context.beginPath();
				
				//Moves the pen to the starting location
				context.moveTo(x, y);
			}			
		} 
		//on mouse click down and move...
		else if (type === "drag") 
		{			
			if (ToolType == "Paint")
			{				
				if (isSelf)
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
				else
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
			//if its some sort of shape drawing; assumed to be self because all non-paint commands handled separately
			else if (ToolType != "Paint")
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
		} 
		//on mouse release...
		else 
		{			
			//if its shapes, etc. 
			if(ToolType != "Paint")
			{
				//sets to shape adjust mode for editing shape position once drawn
				ShapeAdjust = true;
				
				//storing final key points for replication in undo lists and student transmission 
				EndPositionX = lastX;
				EndPositionY = lastY; 
				
				//Tracks/Backs-up the tooltype to prevent conflicts from collaboration mode (not currently implemented)
				StoreToolType = ToolType;

				
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
				
				//moves on to shape adjust mode
				
			}
			//Paint mode
			else if (ToolType == "Paint") 
			{
				if (isSelf)
				{
					//draws the second canvas onto the main one
					context.drawImage(DrawCanvas, 0, 0);
					
					//and clears the drawcanvas
					clear(true, DrawContext);
					
				}

				if(!IsWhiteboard)
					startSave();
			}
			
			if(DrawContext)
				DrawContext.restore();
		}
				
		/*sends draw function to server with socket.io if its paint; shapes are handled separately in shapeadjust mode; 
		 * not on the client just cause its more organized here*/
		if(ToolType == "Paint" && isSelf && isTeacher)
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
			
			//draws the image from the temporary canvas to the main canvas, permanently 
			context.drawImage(DrawCanvas, 0, 0);
					
			//deletes/clears memory for temp canvas and resets any changed vars
			clear(true, DrawContext);
			CanvasPositionX = CanvasPositionY = 0;
			ShapeAdjust = false; 
		
			startSave();
			
			DrawContext.restore();
								
			//makes sure the color preferences go back to the default color scheme after being changed to black-dashed lines for context
			return changeStyle(PaintType.color, null, PaintType.size, PaintType.opacity);
		}		
	}
	