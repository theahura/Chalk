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


---------------------------------------------------------------------------

Copyright (c) 2016 Amol Kapoor, Maulin Hemani

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
