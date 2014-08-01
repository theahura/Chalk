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


	//uses socket.io
var IsCollaborating = false; 
  
  //sets up server connection on localhost, channel 3000
var  io = require('socket.io').listen(3000);
//  io.set('log level', 1);
  io.sockets.on('connection', function(socket) 
  {   
	  socket.on('room', function(room) {
	      socket.join(room);
	      socket.room = room;
	      
	      //socket.in(room).emit('Joined',{});
	      
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
		  		PanHeight: data.PanHeight
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
		  		PushText: data.PushText
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
