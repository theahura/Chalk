
//Red click indicator (note, the red click for textmode is in scriptsCommonFeatures)
$('#ZoomOut,  #ZoomIn, #Undo, #Redo, #PageUp, #PageDown, #Scroll, #Pen, #Shapes, #Tools, #MoveToTeacher, #Left, #Right, #toPen, #toEraser, #toHighlight').click(function(){
    
    var currentBackground = $(this).css('background');
    var storedThis = this;

    $(this).css({"background":"red"});

    setTimeout(function() {
        $(storedThis).css({"background":currentBackground});
    }, 50);

});

//Tabs
$('#Pen').click(function(){
    $('.pen').fadeIn(250); 
    DragMode = true; 
});

$('#Shapes').click(function(){
    $('.shapes').fadeIn(250); 
    DragMode = true; 
});

$('#Tools').click(function(){
    $('.tools').fadeIn(250); 
    DragMode = true; 
});

$('#Scroll').click(function(){
    $('.scroll').fadeIn(250);
    DragMode = true; 
});

$('.cover, .cover-exit').click(function(){
    DragMode = false;
	$('.help-text').fadeTo(125, 0.0);   	
    $('.cover').children().click(function(e){
    	return false;
    });
    $('.cover').fadeOut(125);
});

//Seletion styling
$('.color-list ul li').click(function(){
    $('.color-list ul li').css({"box-shadow":"none"});
    $(this).css({"box-shadow":"0px 0px 0px 4px white inset"});
});

$('.pen-type ul li').click(function(){
    $('.pen-type ul li').css({"box-shadow":"none"});
    $(this).css({"box-shadow":"0px 0px 0px 3px black inset"});
});


$('.tool-picker ul li').click(function(){
    DragMode = false; 

    $('.tool-picker ul li').css({"box-shadow":"none"});
    $(this).css({"box-shadow":"0px 0px 0px 3px black inset"});

    //auto closes the tab when a tool is clicked - assumes the need to return to the canvas due to single click functions 
    $('.cover.tools').fadeOut(250);
    $('.help-text').fadeTo(250, 0.0);

    var storedThis = this;

    setTimeout(function() {
        $(storedThis).css({"box-shadow":"none"});
    }, 250);
});

 $('.shapes-list ul li').click(function(){
    
    DragMode = false; 

    $('.shapes-list ul li').css({"box-shadow":"none"});

    $(this).css({"box-shadow":"0px 0px 0px 3px black inset"});

    //auto closes the tab when a shape is clicked - assumes the need to return to the canvas due to single click functions ; will change as features get added
    $('.cover.shapes').fadeOut(250);
    $('.help-text').fadeTo(250, 0.0); 
    
    var storedThis = this;

    setTimeout(function() {
        $(storedThis).css({"box-shadow":"none"});
    }, 250);
});  

//if paint or highlight is selected, brings back color list if faded out
$('#Paint, #Highlight').click(function(){
    $('.color-list').fadeTo(250, 1.0);
});

//Styling for the mini-pen change buttons
$('#toPen').click(function(){
    $('.pen-type ul li').css({"box-shadow":"none"});
    $('.color-list').fadeTo(250, 1.0);      
    $("#Paint").css({"box-shadow":"0px 0px 0px 3px black inset"});
});

$('#toEraser').click(function(){
    $('.pen-type ul li').css({"box-shadow":"none"});
    $('.color-list').fadeTo(250, 0.5);      
    $("#Eraser").css({"box-shadow":"0px 0px 0px 3px black inset"});
});

$('#toHighlight').click(function(){
    $('.pen-type ul li').css({"box-shadow":"none"});
    $('.color-list').fadeTo(250, 1.0);      
    $("#Highlight").css({"box-shadow":"0px 0px 0px 3px black inset"});
});

//Help text
 $('.pen .help').click(function(){
 	$('.pen .help-text').fadeTo(250, 1.0);
});

$('.tools .help').click(function(){
 	$('.tools .help-text').fadeTo(250, 1.0);
});

$('.pen .help').click(function(){
 	$('.pen .help-text').fadeTo(250, 1.0);
});

$('.shapes .help').click(function(){
    $('.shapes .help-text').fadeTo(250, 1.0);
});


//Pen Tab Options 
$('#Eraser').click(function(){
    //when eraser is clicked, removes color options
    $('.color-list').fadeTo(250, 0.5);      
});


//alert stuff
$("#Cancel_2, #Accept_2").click(function(){
    $("#AlertBox_2").fadeOut(250);
});

$("#Accept").click(function(){
    $("#AlertBox").fadeOut(250);
});

$("#Prompt_Accept").click(function(){
    $("#PromptBox").fadeOut(250);   
});

//automatically expands textareas that are dynamically generated
$(document).on('input.textarea', '#activeBox', function(e) 
{
    while($("#activeBox").outerHeight() < document.getElementById("activeBox").scrollHeight + parseFloat($("#activeBox").css("borderTopWidth")) + parseFloat($("#activeBox").css("borderBottomWidth"))) {
        $("#activeBox").height($("#activeBox").height()+20);
    };
});