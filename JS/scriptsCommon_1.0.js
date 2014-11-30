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
	
	//Keeps track of who is sending out update calls to figure out who actually needs to be updated
	var SelfUpdating = false; 

	//keeps track of the zoom levels
	var GlobalScale = 4;
	var MaxZoom = 4;
		
/*Storage of preferences for canvas; used for resetting properties on drag resizing or for multiple drawers */
	
	//The following are objects that track pen settings for each different type of pen (Pen, Erase, and Highlight)
	//Each setting obj contains the type, color, size, globalOperation, and Opacity of the preference (with opacity, type, and globalOperation hardcoded)
	//colorElementID stores the DOM UI element for later CSS/UI usage
	var BackUpPen = 
	{
		type: "Pen", 
		color:"",
		size: 5,
		erase: "source-over",
		opacity: 1.0,
		colorElementID: "Black"
	};
	
	var BackUpErase = 
	{
			type: "Erase",
			color:"#000000",
			size: 70,
			erase: "destination-out",
			opacity: 1.0
	};
	
	var BackUpHighlight =
	{
		type: "Highlight",
		color:"#FFFF00",
		size: 40,
		erase: "source-over",
		opacity: 0.4,
		colorElementID: "Yellow"
	};
	
	//This is the preference set that actually gets edited at any given time. It's default setting is pen. 
	var PaintType = BackUpPen;
	
	
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

	CanvasInfo[0] = {};
	
	//Type: Array List; stores a list of commands the user has done to undo/redo mistakes, etc. Paint commands are stored as arrays
	//within the array to account for strokes and to avoid undo-ing each individual point; other commands are stored as single objects
	CanvasInfo[0].UndoList = new Array();
	CanvasInfo[0].RedoList = new Array();
	
	
	//Type: Int; stores the page the user is currently on to access info from CanvasInfo array list
	var CurrentPage = 0;
	
	//Type: Canvas; this canvas overlays the rendered canvas whenever the user takes an action in order to make dynamic changes 
	//before posting to permanent image as well as avoiding editing drawings directly below the image until absolutely necessary
	
	if(document.getElementById("DrawLayer"))
	{
		var DrawCanvas = document.getElementById("DrawLayer"); 
		
		var DrawContext = DrawCanvas.getContext("2d");
	
		DrawContext.fillStyle = "solid";
		DrawContext.lineCap = "round";
	}
	
	//Type: Varies; A third layer to store image things (either canvases or images) when moving them around
	var OverlayObject;
	
	//Type: Int; keeps track of X/Y positioning of midpoints between two registered points for smooth quadratic curves
	var XMid;
	var YMid;
	
	//Used for the student/teacher to keep track of X/Y positioning of incoming commands
	var XMidOther;
	var YMidOther;
	
	//stores image start location (for scrolling)
	var ImageScrollX;
	var ImageScrollY;
	
	//Used to store highlight commands on student side before transferring to main canvas; acts as temp
	var HighlightCanvas;

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

	//The starting visible number of pixels of the canvas
	var CanvasHeight = 500;
	var CanvasWidth = 500;
	
	//The total number of pixels in the canvas
	var CanvasPixelHeight = 2000;
	var CanvasPixelWidth = 2000;
	
	//Type: Socket; used to transfer data/commands to the student
	socket = io('http://54.86.173.127:3000');
	//socket = io();
	
	var IsWhiteboard = false; 
	
/**Rooms Setup ************************************************************************
 * Analyzes URL for room name and joins corresponding room
 */

	//Type: Int; stores the location within the document URL of the questionmark for data splicing (finding querystring)
	var Index_Question = document.URL.indexOf("?");	
	var Index_Ampersand = document.URL.indexOf("&");
	
	//Type: String; based on whether the index exists, the room is either the string after the index number in the URL, or a test room
	var Room;
	
	//Type: String; based on whether the & index exists, the name is either Anonymous or the string after the index in the URL
	var Name;
	
	if (Index_Question == -1) //no question mark
	{
		Room = "Test";
		
		if (Index_Ampersand == -1)
		{
			Name = "Anonymous";
		}
		else
		{
			Name = document.URL.substring(Index_Ampersand + 1);
		}
	}
	else
	{
		if (Index_Ampersand == -1)
		{
			Room = document.URL.substring(Index_Question + 1);
			Name = "Anonymous";
		}
		else 
		{
			Room = document.URL.substring(Index_Question + 1, Index_Ampersand);
			Name = document.URL.substring(Index_Ampersand + 1);
		}
	}
	
	//Error checking in case either scenario is not filled
	if (Room == "")
	{
		Room = "Test";
	}
	
	if (Name == "")
	{
		Name = "Anonymous";
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
		socket.emit('room', 
		{
			Room: Room 
		});
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
		//alert("You joined: " + data.Room);
	});

/**End of Rooms Setup **************************************************************************/

/**Fast button setup***************************************************************************/

	//Type: array; stores every button in the UI, indicated in css/html by class .button
	var templist = document.getElementsByClassName("button");
	
	//Goes through each button in the UI and sets an eventlistener for touchstart, hijacks click function to start immediately on touchstart
	//to prevent 300ms lag on iPads/touch screens
	for(var i = 0; i < templist.length; i++)
	{
		templist[i].addEventListener('touchstart', function(e)
		{
			this.focus();
			if(this.onclick)
				this.onclick;
			
			$(this).trigger("click"); 
			
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
			canvas.style.left = left + "px";
		else
			canvas.style.left = "0px";
		
		//Sets layer
		canvas.style.zIndex = zIndex + "";
				
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
	 *  @Param: Don'tStoreUndo; Boolean; makes sure the clear command isn't being called by the undo list because once implemented as 
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
			CanvasInfo[CurrentPage].UndoList.push({ToolType: "Clear"});
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

/**Drawing tool setup*************************************************************/
	
	/**
	 *  Used to change preferences in the PaintType object that are later stored into backups
	 *  
	 *  If changeStyle is being used, it automatically sets the tooltype to Paint; only is called by 
	 *  pen related functions
	 *  
	 *  @Param: color; Hex/RGB; the color the pen needs to become
	 *  @Param: colorElementID; the element used to change the color, used to set CSS settings in the UI
	 *  @Param: size; double; the number of pixels the pen draws 
	 *  @Param: opacity; double; tracks how transparent the pen stroke is
	 */
	function changeStyle(color, colorElementID, size, opacity)
	{
		ToolType = "Paint";
		
		if (color)
			PaintType.color = color; 
		
		if(colorElementID)
			PaintType.colorElementID = colorElementID;
		
		if (size)
			PaintType.size = size;
		
		if (opacity)
			PaintType.opacity = opacity; 
	}
	
	/**
	 * Used to initiate changes between different pen styles (pen, erase, highlighter)
	 * 
	 * @Param: BackUpObj; Pen Pref Obj; used to determine what the new painttype will be
	 */
	function changePaintType(BackUpObj)
	{
		alert(BackUpObj.color);
		//checks which backup to save latest preferences too
		if(PaintType.type == "Pen")
			BackUpPen = PaintType; 
		else if (PaintType.type == "Highlight")
			BackUpHighlight = PaintType;
		else if (PaintType.type == "Erase")
			BackUpErase = PaintType;
		
		//pulls old preferences
		PaintType = BackUpObj;
		
		//UI settings
		document.getElementById("FontSize").value = PaintType.size;
		$(".dot i").css({"font-size":PaintType.size});
        $('.color-list ul li').css({"box-shadow":"none"});        
		$("#"+PaintType.colorElementID).css({"box-shadow":"0px 0px 0px 4px white inset"});
	}
	
	/**
	 * The main tool for pages. Handles adding new pages and flipping up and down between pages
	 * 
	 * @Param: DirectionUp; boolean; tracks whether the page flip is up or down 
	 */
	function changePage(directionUp)
	{	
		if (directionUp)
		{
			//makes sure it doesn't go above to a page thats not created; teachers going up a page should have created 
			//a new page in scriptsTeacher
			if(!CanvasInfo[CurrentPage + 1])
			{
				document.getElementById("LoadingColor").style.display = "none"; //turns off the loading screen				
				return;
			}
			
			//renders the next upper page
			document.body.removeChild(CanvasInfo[CurrentPage].canvas);
			CurrentPage++;
			document.body.appendChild(CanvasInfo[CurrentPage].canvas);
			
			document.getElementById("LoadingColor").style.display = "none"; //turns off the loading screen				
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
			
			document.getElementById("LoadingColor").style.display = "none";
		}
		
		//makes sure the new page's zoom is the same as the last one's
		Zoom(GlobalScale);
		
		//Used to write to the pageNumber div
		var TotalPages = CanvasInfo.length;
		
		var CurrentPageTemp = CurrentPage + 1;
		
		//edits the page number div to let the user know what page they are on
		document.getElementById("PageNumber").innerHTML = CurrentPageTemp + " of " + TotalPages;
		
		//makes sure when you jump to a page you always start at the 0/0 spot
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
	    
	    //Saves the current canvascontext setup, for restoration after undo/redo build
	    canvasListObject.context.save();
	    canvasListObject.context.globalAlpha = 1.0;
	    
	    //Debugging
	    if (list.length == 0)
	    {
	    	canvasListObject.context.restore();
	        return;
	    }
	    	    
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
	        	
	        	if (pt[0].opacity != 1.0)
	        		if(HighlightCanvas)
	        			canvasctx = HighlightCanvas.getContext("2d"); 
	        		else
	        			canvasctx = DrawContext;
	        		        	
	        	canvasctx.strokeStyle = pt[0].color;
	        	canvasctx.globalCompositeOperation = pt[0].erase;
	        		        		     	        	
	        	var XMid_Undo = 0;
	        	var YMid_Undo = 0;
	        		     
	        	//to draw a consistent highlighting line, need to draw a full line at complete opaqueness on a doubled canvas, and then copy to the 
	        	//base canvas at a lower opacity setting
        		canvasListObject.context.globalAlpha = pt[0].opacity; 

	        	//draws pointbypoint
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
	        	
	        	//copies from drawcanvas to base if opacity is in highlight mode
	        	if (pt[0].opacity != 1.0)
	        	{
	        		if(HighlightCanvas)
	        			canvasListObject.context.drawImage(HighlightCanvas, 0, 0);
	        		else
	        			canvasListObject.context.drawImage(DrawCanvas, 0, 0);

	        	    clear(true, canvasctx); 
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
	        	canvasctx.globalAlpha = pt.opacity;
	        	
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
	        			canvasListObject.context.drawImage(img, 0, 0);
	        		}
	        	}
	        }	       
	    }
	    
	    canvasListObject.context.restore();
	}
	
	/**********************************Zooming***********************************************************/
	
	/**
	 * Zoom functionality is designed to access/hide hidden pixels within a given canvas.
	 * 
	 * @param: Scale; int; scale multiply by the default canvasheight/width to determine current view size
	 */
	function Zoom(Scale)
	{
		//changing the visible size of both the back canvas and the drawcanvas
		if(CanvasInfo)
		{
			CanvasInfo[CurrentPage].canvas.style.width = DrawCanvas.style.width = CanvasWidth*Scale + "px";
			CanvasInfo[CurrentPage].canvas.style.height = DrawCanvas.style.height = CanvasHeight*Scale + "px";
		}
		
		//if a teachercanvas exists...
		if(CanvasInfoTeacher)
		{
			//do the same for the teacher canvas set
			CanvasInfoTeacher[CurrentPage].canvas.style.width = CanvasWidth*Scale + "px";
			CanvasInfoTeacher[CurrentPage].canvas.style.height = CanvasWidth*Scale + "px";
		}
	}
	
	//weird window refresh glitch, scrolls to 0,0 on refresh
	$(window).on('beforeunload', function() {
	    $(window).scrollTop(0, 0);
	});
	
