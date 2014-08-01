/**
 * @author: Amol Kapoor
 * @version: 1
 * 
 * Description: The Core API
 * 
 * A location to store all of the scripts common to student and teacher
 */

/*Tool functionality variables*/

	//Type: bool; Defines whether collaboration mode is on (not currently implemented)
	var IsCollaborating = false;
	
	//Type: bool; Defines whether dragging is on or not
	var DragMode = false
	
	//Type: canvas; the overlay to prevent user drawing while in dragmode
	var DragCanv;
	
	//Type: String; stores what tool the user is currently using, modifies users stroke and click
	var ToolType = "Paint";
	var StoreToolType = "Paint";
	
	//Type: Array List; stores a list of commands the user has done to undo/redo mistakes, etc. Paint commands are stored as arrays
	//within the array to account for strokes and to avoid undo-ing each individual point; other commands are stored as single objects
	var UndoList = new Array();
	var RedoList = new Array();
	
	//Keeps track of who is sending out update calls to figure out who actually needs to be updated
	var SelfUpdating = false; 

	//keeps track of the zoom levels
	var GlobalScale = 4;
	var MaxZoom = 4;
	
/*Storage of preferences for canvas; used for resetting properties on drag resizing or for multiple drawers */
	
	//Type: String; Stores Color, in hex or RGB
	var BackUpColor;
	
	//Type: double; Stores Size of the line being drawn
	var BackUpSize;
	
	//Type: String; Stores Line design (specifically, cap of line)
	var BackUpCap;
	
	//Type: String; Stores whether the object erases or not
	var BackUpErase = "source-over";
	
/*Saving vars*/ 

	//used to save an image as the same name as previously given
	var PastName = "notes";
	
	//Type: TimeOut; sets a counter for the amount of time since the last action to trigger google drive saving
	var UpdateTimeOut;

/*Canvas/Drawing vars*/
	
	//Type: Int; stores /previous/ mouse position in X/Y coordinates
	var MouseX = 0; 
	var MouseY = 0;	
	
	//Type: ArrayList; Keeps track of all of the canvas info (context, canvas, google drive ID,
	//as a tracker of pages, where the index represents the pageNumber
	var CanvasInfo = new Array();
	var CanvasInfoTeacher;
	
	//Type: Int; stores the page the user is currently on to access info from CanvasInfo array list
	var CurrentPage = 0;
	
	//Type: Canvas; this canvas overlays the rendered canvas whenever the user takes an action in order to make dynamic changes 
	//before posting to permanent image as well as avoiding editing drawings directly below the image until absolutely necessary
	var DrawCanvas = document.getElementById("DrawLayer"); 
	
	var DrawContext = DrawCanvas.getContext("2d");
	
	DrawContext.fillStyle = "solid";
	DrawContext.lineCap = "round";
	
	//Type: Varies; A third layer to store image things (either canvases or images) when moving them around
	var OverlayObject;
	
	//Type: Int; keeps track of X/Y positioning of midpoints between two registered points for smooth quadratic curves
	var XMid;
	var YMid;
	
	var XMidOther;
	var YMidOther;

/*Shape vars (including copy/paste and pan)*/
	
	//Type: Int; keeps track of X/Y positioning, specifically the start and end positions
	//of shapes/images for transmission + editing
	var StartPositionX = 0;
	var StartPositionY = 0;
	var EndPositionX = 0;
	var EndPositionY = 0;
	
	//Type: Int; keeps track of X/Y positioning, specifically how far a shape/image has moved when dragged by user
	var CanvasPositionX = 0;
	var CanvasPositionY = 0;
		
	//Type: Int; Keeps track of X/Y positioning for user selection of drawing area that needs to be panned/copied
	var CopyPanX, CopyPanY, CopyPanWidth, CopyPanHeight;
	
	//Type: Boolean; Checks whether the user has just drawn a shape and is now in shape maneuvering mode
	var ShapeAdjust = false; 

/*Misc*/

	//make this 8 by 11, or the default for powerpoint
	var CanvasHeight = 500;
	var CanvasWidth = 500;
	
	var CanvasPixelHeight = 2000;
	var CanvasPixelWidth = 2000;
	
	//Type: Socket; used to transfer data/commands to the student
	//socket = io.connect('notepad.pingry.org:4000');
	socket = io();

/**Rooms Setup ************************************************************************
 * Analyzes URL for room name and joins corresponding room
 */

	//Type: Int; stores the location within the document URL of the questionmark for data splicing (finding querystring)
	var Index = document.URL.indexOf("?");	
	
	//Type: String; based on whether the index exists, the room is either the string after the index number in the URL, or a test room
	var Room = Index == -1 ? "Test" : document.URL.substring(Index + 1); //plus 1 gets rid of question mark
	
	if (Room == "")
	{
		Room = "Test";
	}
	
	/**
	 * When the socket connects (recieving 'connect' as a command) 
	 * it emits it's room choice to the socket.io server, which 
	 * then handles room delegation. 
	 * 
	 * This is done to ensure that multiple teachers only communicate with their own students
	 * 
	 * @Param: 'connect'; name of command that socket is listening for
	 * @Param: function; callback upon recieving command
	 */
	socket.on('connect', function() 
	{
		// Connected, let's sign-up for to receive messages for this room
		socket.emit('room', Room);
	});
	
	/**
	 * When a room is joined, the app alerts the user (mostly debugging tool)
	 * 
	 * @Param: 'Joined'; name of command that socket is listening for
	 * @Param: function; callback upon recieving command
	 * 		@Param: data; data passed along from server to client through 
	 * 				socket.io in String form
	 */
	socket.on('Joined', function(data) 
	{
	//	alert("You joined: " + Room);
	});

/**End of Rooms Setup **************************************************************************/

/**Fast button setup***************************************************************************/

	var templist = document.getElementsByClassName("button");
	
	for(var i = 0; i < templist.length; i++)
	{
		templist[i].addEventListener('touchstart', function(e)
		{
			this.focus();
			this.onclick();
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
		});	
	};
		
/**End of that*********************************************************************************/
	
/**Multipurpose functions***********************************************************************/
		
	/**
	 * General purpose function used for creating canvases of various shapes, sizes, and uses
	 * 
	 * @Param: height; int; the height of the new canvas
	 * @Param: width; int; the width of the new canvas
	 * @Param: zIndex; int; which layer the new canvas is on
	 * @Param: top; int; the distance (in px) from the top for the new canvas
	 * @Param: left; int; the distance (in px) from the left for the new canvas
	 * @Param: canDraw; bool; whether or not the user can draw brush strokes on the canvas
	 * @Param: color; RGB/Hex; the color of the pen used to draw on the canvas, only used if canDraw is true
	 * @Param: size; int; the size of the pen used to draw on the canvas, only used if canDraw is true
	 * @Param: sytleHeight; int; css height that is displayed
	 * @Param: styleWidth; int; css width that is displayed
	 * @Return: canvas; canvas; the newly created canvas with all of the proper parameters as input
	 */
	function createCanvas(height, width, zIndex, top, left, canDraw, color, size, styleHeight, styleWidth)
	{
		var canvas = document.createElement('canvas');
		var ctx = canvas.getContext("2d");
	
		/*canvas settings*/
		
		//Sets dimensions
		if(height)
			canvas.height = height;
		else
			canvas.height = CanvasHeight;
		
		if(width)
			canvas.width = width;
		else 
			canvas.width = CanvasWidth;
		
		//sets visible dimensions
		if(styleHeight)
			canvas.style.height = styleHeight + "px";
		
		if(styleWidth)
		{
			canvas.style.width = styleWidth + "px";
		}
	
		//Sets location
		canvas.style.position = "absolute";
		
		if (top)
			canvas.style.top =  top + "px";
		else 
			canvas.style.top = "0px";
		
		if (left)
			canvas.style.left = 120 + left + "px";
		else
			canvas.style.left = "120px";
		
		//Sets layer
		if (zIndex)
			canvas.style.zIndex = zIndex;
		
		
		/*ctx settings; only touched if you can actually edit the canvas*/
		
		if(canDraw)
		{
			canvas.className = "drag";
			ctx.lineCap = "round";
			ctx.fillStyle = "solid";
			
			if(color)
				ctx.strokeStyle = color; 
			
			if(size)
				ctx.lineWidth = size; 
		}
	
		return canvas;
	}
	
	/**
	 *  The clear function does just what you'd expect: it clears the page the user currently on. Will eventually be 
	 *  implemented as an actual button; for now, its used as a helper method
	 *  
	 *  @Param: IsUndo; Boolean; makes sure the clear command isn't being called by the undo list because once implemented as 
	 *  		a button, it can't create an infinite loop in which the undo list calls a clear that is added to the undo list and 
	 *  		called again
	 *  
	 *  @Param: context; context; which canvas to clear
	 */

	function clear(DontStoreUndo, context)
	{
		//cycles through each canvas and clears
		context.clearRect(0, 0, 2000, 2000);
		
		if(!DontStoreUndo)
			UndoList.push({ToolType: "Clear"});
	}
	
	/**
	 * Clears the save timer that tracks when to update google drive
	 */
	function clearSaveTimer()
	{
		if (UpdateTimeOut)
		{
			window.clearTimeout(UpdateTimeOut);
			UpdateTimeOut = null;
		}
	}
	
	
	//Add a 'draw to canvas' helper method that takes in an image, a page number, and draws that image to the appropriate page
	//Used for open and update
	

	
/**End of Multipurpose************************************************************/


	/**
	 * Toggles the UI for the drag canvas. It creates a canvas overlay and sets the css styling so that
	 * the user cannot drag over it. Although it creates a canvas, it would be far more efficient for the 
	 * code to create a div; will change as soon as I can figure out why the div is not working. 
	 */
	function dragMode()
	{
		//toggles between drag or not with the same button
		DragMode = !DragMode;
		
		//turn dragmode on
		if (DragMode)
		{
			//Changes text of the inside of the drag box to indicate what will happen on click
			document.getElementById("Drag").innerHTML = "Click Here to Paint";

			/*creates the div that covers the page and acts as a drag pad; should be div...*/ 
			DragCanv = createCanvas(CanvasHeight*GlobalScale, CanvasWidth*GlobalScale, 3, 0, 0)
		
			//mostly CSS styling that sets it apart from normal canvases
			DragCanv.style.opacity = "0.2";
			DragCanv.style.background = 'blue';

			//renders to screen
			document.body.appendChild(DragCanv);
		}
		//turn dragmode off
		else
		{
			//Again, changes inner html text
			document.getElementById("Drag").innerHTML = "Click Here to Drag";

			//removes the dragcanvas if it exists
			if (DragCanv != null)
			{
				document.body.removeChild(DragCanv);
				DragCanv = null;
			}
		}
	}
	

/**End of Drawing tool setup*************************************************************/
	
	/**
	 *  changeStyle is the central function that handles changing the context of the overall pen being used
	 *  It should probly be used more often in the above sections of the code than it is, especially if it took 
	 *  in a fourth parameter for the context that's being edited (a simplification that may appear later). Note that 
	 *  the actual context variables are never changed, only the backups; this is due to the redundancy of having 
	 *  the context changed in the actual draw function anyway.
	 *  
	 *  If changeStyle is being used, it automatically sets the tooltype to Paint
	 *  
	 *  Erase is done by switching between destination-out (i.e. erase mode) and source-over
	 *  
	 *  @Param: color; Hex/RGB; the color the pen needs to become
	 *  @Param: erase; String; whether the pen becomes an eraser or not (destination-out or source-over)
	 *  @Param: size; double; the number of pixels the pen draws 
	 */
	function changeStyle(color, erase, size)
	{
		ToolType = "Paint";

		//stores current properties as backups
		if(size)
			BackUpSize = size;
		
		if(color)
			BackUpColor = color;
		
		if(erase)
			BackUpErase = erase;
	}
	

	/**
	 * The main tool for pages. Handles adding new pages and flipping up and down between pages
	 * 
	 * @Param: DirectionUp; boolean; tracks whether the page flip is up or down 
	 */
	function changePage(directionUp)
	{
		//clears undo/redo list on page change to save space
		UndoList = new Array();
		RedoList = new Array();

		/*Stores the image for undo/redo due to undo/redo list clear*/
		var previous_image = new Image(); 
		
		//creates the image
		previous_image.src = CanvasInfo[CurrentPage].canvas.toDataURL();
		
		if (directionUp)
		{
			//makes sure it doesn't go above to a page thats not created
			if(!CanvasInfo[CurrentPage + 1])
			{
				document.getElementById("LoadingColor").style.display = "none"; //turns off the loading screen				
				return;
			}
			
			//renders the next upper page
			document.body.removeChild(CanvasInfo[CurrentPage].canvas);
			CurrentPage++;
			document.body.appendChild(CanvasInfo[CurrentPage].canvas);
			
			previous_image.onload = function()
			{
				CanvasInfo[CurrentPage - 1].image = previous_image;
				
				document.getElementById("LoadingColor").style.display = "none"; //turns off the loading screen				
			}
		}
		else 
		{	
			//makes sure it doesn't go below page zero
			if (CurrentPage == 0)
			{
				document.getElementById("LoadingColor").style.display = "none"; //turns off the loading screen				
				return; 
			}
			
			//renders the next lower page
			document.body.removeChild(CanvasInfo[CurrentPage].canvas);
			CurrentPage--;
			document.body.appendChild(CanvasInfo[CurrentPage].canvas);
			
			previous_image.onload = function()
			{
				CanvasInfo[CurrentPage + 1].image = previous_image;
				
				document.getElementById("LoadingColor").style.display = "none";
			}
		}
		
		//Used to write to the pageNumber div
		var TotalPages = CanvasInfo.length-1;
		
		//edits the page number div to let the user know what page they are on
		document.getElementById("PageNumber").innerHTML = CurrentPage + " of " + TotalPages;
		
		//makes sure when you jump to a new page you always start at the 0/0 spot
		window.scrollTo(0, 0);
	}
	

	/**
	 * The last of the massive functions. Called on undo or redo, this function wipes the canvas clean and then rebuilds 
	 * the current canvas, command by command, due to the paint-like nature of the html canvas 
	 * 
	 * @Param: List; Array; the undo list that gets recreated
	 * @Param: canvasListObject; Object; a data struct that contains the information from a specific page in canvas info
	 */
	function redrawUndo(list, canvasListObject)
	{
		//wipes the canvas to prep for rebuild
	    clear(true, canvasListObject.context); 
	    
	    //redraws what happened before the undolist was cleared on page up or down
	    if(canvasListObject.image)
	    {
	    	canvasListObject.context.drawImage(canvasListObject.image, 0, 0);
	    }
	    
	    //Debugging
	    if (list.length == 0) 
	        return;
	    
	    //makes sure object doesn't accidentally erase
	    canvasListObject.context.globalCompositeOperation = "source-over";
	    
	    //runs through the entire undo list
	    for (var i = 0; i < list.length; i++) 
	    {
	        var pt = list[i];

	        //paint command
	        if (pt instanceof Array)
	        { 
	        	/*pt has: x, y, lastX, lastY, color, size, erase, XCanvas, YCanvas*/
	        	
	        	//debugging for empty arrays
	        	if(pt[0] == null)
	        		continue;
	        		        	
	        	/*redraws the line; note that it currently does not account for varying line depths, which is 
	        	why hitting undo/redo makes all the text look a lot less smooth all of a sudden*/
	        	
	        	var PageNumber = pt[0].PageNumber;

	        	var canvasctx = canvasListObject.context;
	        		        	
	        	canvasctx.strokeStyle = pt[0].color;
	        	canvasctx.globalCompositeOperation = pt[0].erase;
	        		     
	        	var XMid_Undo = 0;
	        	var YMid_Undo = 0;
	        	
	        	for (var j = 0; j < list[i].length; j++)
	        	{
		        	canvasctx.beginPath();
		        	
		        	//Moves to either the midpoint calculated from the last curve, or the start of a new curve (pref. the former)
					canvasctx.moveTo(XMid_Undo || pt[j].x, YMid_Undo || pt[j].y);

	        		canvasctx.lineWidth = pt[j].size;
		        	
	        		//calculates midpoints between the current and the last points
					XMid_Undo = (pt[j].lastX + pt[j].x) / 2;
				    YMid_Undo = (pt[j].lastY + pt[j].y) / 2;
				    
				    //and draws a curve (instead of a line) between the midpoints
				    canvasctx.quadraticCurveTo(pt[j].lastX, pt[j].lastY, XMid_Undo, YMid_Undo);
	     
				    canvasctx.stroke();
	        	}
	        }
	    	else //not paint; shapes
	    	{	
	    		/*pt has x, y, StartPositionX, StartPositionY, PageNumber, ToolType, Color, Size, Erase*/
	    		
	        	var PageNumber = pt.PageNumber;
	        
	        	var canvasctx = canvasListObject.context;
	        	
	        	canvasctx.beginPath();
	
	        	canvasctx.lineWidth = pt.size;
	        	canvasctx.strokeStyle = pt.color;
	        	canvasctx.globalCompositeOperation = pt.erase;
	        	
	        	/*rebuilds the shape by pulling the info from a previous location instead of storing 
	        	 * imgdata; can cause problems if it desyncs for copy, pan*/
				if (pt.ToolType == "Box")
				{
					var XDraw = Math.min(pt.x, pt.StartPositionX),
			        YDraw = Math.min(pt.y, pt.StartPositionY),
			        Width = Math.abs(pt.x - pt.StartPositionX),
			        Height = Math.abs(pt.y - pt.StartPositionY);
					canvasctx.strokeRect(XDraw, YDraw, Width, Height);
				}
				else if (pt.ToolType == "Circle")
				{
					//gets dimensions for circle
					var r = Math.abs(pt.x-pt.StartPositionX);		
					canvasctx.arc(pt.StartPositionX,pt.StartPositionY,r,0,2*Math.PI);
					canvasctx.stroke();
				}
				else if (pt.ToolType == "Line")
				{
					//Moves to start position and creates a line to the current x/y position
					canvasctx.moveTo(pt.StartPositionX, pt.StartPositionY);
					canvasctx.lineTo(pt.x, pt.y);
					canvasctx.stroke();
				}
	        	else if (pt.ToolType == "Pan" || pt.ToolType == "Copy")
	        	{
	        		var TempCanvas = document.createElement('canvas');
					TempCanvas.width = pt.PanWidth;
					TempCanvas.height = pt.PanHeight;
					TempCanvas.getContext("2d").drawImage(canvasListObject.canvas, pt.PanX, pt.PanY, pt.PanWidth, pt.PanHeight, 0, 0, pt.PanWidth, pt.PanHeight);
					
					if (pt.ToolType == "Pan")
					{
						canvasListObject.context.clearRect(pt.PanX, pt.PanY, pt.PanWidth, pt.PanHeight);
					}
					
					canvasListObject.context.drawImage(TempCanvas, pt.StartPositionX, pt.StartPositionY);    
	        	}
	        	else if (pt.ToolType == "Image")
	        	{
	        		//if the actual image exists, just load that
	        		if (pt.Image)
		        		canvasListObject.context.drawImage(pt.Image, pt.StartPositionX, pt.StartPositionY);
	        		//otherwise, recreate the image from string
	        		else if (pt.ImgData)
	        		{
	        			var img = new Image();
	        			img.src = pt.ImgData; 
	        			canvasListObject.context.drawImage(img, pt.StartPositionX, pt.StartPositionY);
	        		}
	        	}
	        }	       
	    }
	}
	
	/**********************************Zooming***********************************************************/
	
	/**
	 * Zoom functionality is designed to access/hide hidden pixels within a given canvas.
	 * 
	 * @param: Scale; int; scale multiply by the default canvasheight/width to determine current view size
	 */
	function Zoom(Scale)
	{
		CanvasInfo[CurrentPage].canvas.style.width = DrawCanvas.style.width = CanvasWidth*Scale + "px";
		CanvasInfo[CurrentPage].canvas.style.height = DrawCanvas.style.height = CanvasHeight*Scale + "px";//changing the visible size of both the back canvas and the drawcanvas
	
		if(CanvasInfoTeacher)
		{
			CanvasInfoTeacher[CurrentPage].canvas.style.width = CanvasWidth*Scale + "px";
			CanvasInfoTeacher[CurrentPage].canvas.style.height = CanvasWidth*Scale + "px";
		}
	}
	
	//weird window refresh glitch, scrolls to 0,0 on refresh
	$(window).on('beforeunload', function() {
	    $(window).scrollTop(0, 0);
	});
	
