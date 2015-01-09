/**
 * @author: Amol Kapoor
 * @version: 1
 * 
 * Description: The Server
 * 
 * Acts as a tunnel to connect the teacher to any student
 * 
 * 
 * ssh into the server as the diagraphic user; 
 * screen -r to resume the past session, and cntrl c to stop the program; 
 * node server_1.0.js to run the thing again (the updated version if there is an update)
 * cntrl a d to quit
 * 
 */

//Type: Bool; checks whether collaboration mode is on or not for students to access the teacher board (not implemented)
var IsCollaborating = false; 

//Type: obj; Stores the undolists for temp saving of room data in room objs
var BackUpUndoLists = {};
  
//Type: io; sets up server connection on localhost, channel 3000
var  io = require('socket.io').listen(3000);
//  io.set('log level', 1);

	//On an io socket connection...
    io.sockets.on('connection', function(socket) 
    {   

    	/*
    		Socket 'room' event call, used to set basic socket parameters on the serverside from the client
    		@Param: data.Room; int; the room number associated with this socket
    		@Param: data.Name; String; the name associated with this socket
    	*/
	    socket.on('room', function(data) {
	      socket.join(data.Room);

	      socket.room = data.Room;
	      socket.name = data.Name; 

	      //Checks to see if the room already exists; adds it to storage if it doesn't
	      if(!BackUpUndoLists[data.Room])
	      {
	      	BackUpUndoLists[data.Room] = {};
	      }



	     // socket.in(data.Room).emit('Joined',{Room: data.Room});
	      
	   });


	    /*
	    	Checks if a given object is empty or not. 
	    	@Param: obj; obj; the object being checked for elements
	    */
		function isEmpty(obj) 
	  	{
		    for(var prop in obj) {
		        if(obj.hasOwnProperty(prop))
		            return false;
		    }

		    return true;
		}

		/*
			Socket disconnect event, used to prune the backup list
		*/
	  	socket.on('disconnect', function() {
	  		if(isEmpty(io.sockets.adapter.rooms[socket.room]))
	  		{
	  			delete BackUpUndoLists[socket.room];
	  		}
		});

		/*
			Socket save event, called on autosave, used to edit the backup list
			@Param: data.UndoList; JSON array; the JSON version of the undolist of the user
		*/
		socket.on('save', function(data)
		{
			if(!BackUpUndoLists[socket.room][data.PageNumber])
				BackUpUndoLists[socket.room][data.PageNumber] = {};

			BackUpUndoLists[socket.room][data.PageNumber].list = data.UndoList;
			BackUpUndoLists[socket.room][data.PageNumber].pageNum = data.PageNumber;
		});


		/*
			Socket update event, called on update button press, used to pull the backup list back to the client
		*/
		socket.on('UpdateToServer', function(data)
		{
			for(var thing in BackUpUndoLists[socket.room]) 
			{
		        //foreach thing in backupundolists[socket.room]
				socket.emit('UpdateToClient',{
					UndoList : BackUpUndoLists[socket.room][thing].list, 
					PageNumber: BackUpUndoLists[socket.room][thing].pageNum
				});
		    }
		});

	  //handles all student commands
	  socket.on('CommandToStudent', function(data) 
	  { 
		  	socket.broadcast.to(socket.room).emit('CommandFromTeacher', 
		  	{ 
		  		ToolType: data.ToolType,
		  		x: data.x,
		  		y: data.y,
		  		lastX: data.lastX,
		  		lastY: data.lastY,
		  		ShapeStartX: data.StartPositionX, 
		  		ShapeStartY: data.StartPositionY,
		  		type: data.type,
		  		color: data.color,
		  		size: data.size,
		  		erase: data.erase,
		  		PageNumber: data.PageNumber,
		  		TotalPages: data.TotalPages,
		  		ImgData: data.ImgData,
		  		Pages: data.Pages,
		  		UndoList: data.UndoList,
		  		PanX: data.PanX,
		  		PanY: data.PanY,
		  		PanWidth: data.PanWidth,
		  		PanHeight: data.PanHeight,
		  		opacity: data.opacity
		  	});
	  });
		  
	  //handles all teacher collab commands
	  socket.on('CommandToTeacher', function(data) 
	  { 
		  	socket.broadcast.to(socket.room).emit('CommandFromStudent', 
		  	{ 
		  		ToolType: data.ToolType,
		  		x: data.x,
		  		y: data.y,
		  		lastX: data.lastX,
		  		lastY: data.lastY,
		  		ShapeStartX: data.StartPositionX, 
		  		ShapeStartY: data.StartPositionY,
		  		type: data.type,
		  		color: data.color,
		  		size: data.size,
		  		erase: data.erase,
		  		PageNumber: data.PageNumber,
		  		ImgData: data.ImgData,
		  		Pages: data.Pages,
		  		UndoList: data.UndoList,
		  		PushText: data.PushText,
		  		Name: data.Name
		  	});
	  });
	  
	  //Call for Update from student for teacher -> student
	  socket.on('NeedUpdate', function(data)
	  {
		socket.broadcast.emit('CallUpdate', {});   
	  });
	  
	  //sets collaboration up on connection 
	  socket.on('checkCollab', function(data) 
	  {
		  if(IsCollaborating)
			  socket.broadcast.emit('collabon', {});
		  else
			  socket.broadcast.emit('collaboff', {});
	  });
	  

});
