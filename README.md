Design document: 

Chalk is a global whiteboard notetaking application. 
========================================
Three clients, 1 backend that serves as a tunnel.

Client 1: Teacher

Client 2: Student

Client 3: Whiteboard
========================================
Teacher is the head whiteboard. All data the teacher writes on his whiteboard is transmitted through the backend to student and whiteboard.

Student is reciever. It listens for any command broadcast by the teacher and writes the same output accordingly. 
Student client can write on overlay layer without affecting teacher layer.

Whiteboard is student client without the additional student layer.

Each layer is composed of an HTML canvas element. Drawing of any kind is transmitted as a series of points through the socket and redrawn on 
the corresponding layer on the other end as necessary. 

Each class session maintains a global update list, which contains all details of what the teacher has drawn. Each student maintains a 
local undo/redo list. 

Drive integration is built in and isolated. Treats canvases as images, and loads images from drive. 

