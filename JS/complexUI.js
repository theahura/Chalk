/*!
 * Complex UI Javascript
 * Copyright 2014, Kunal Nabar
 *
 * Includes jquery.js
 * Copyright 2005, 2014 jQuery Foundation, Inc.
 *
 * Date: 2014-07-05T05:06:00
 */
$(document).ready(function(){
    var prev = 0;
    $('body').click(function(){
        $('.dropdown').slideUp(200);
        $('.hidden').animate({"left":"-80%"}, 200);
        $('.header').animate({"left":"0%"}, 200);
        $('.scroll').css({"background-color":"#000080"});
    }).children().click(function(e){
        return false; 
    });
    $('.header').click(function(){
        if($(this).css("left") == "0px" || $(this).css("left") == "0%")
        {
            $('.hidden').animate({"left":"-80%"}, 200);
            $('.header').animate({"left":"0%"}, 200);
            $('.dropdown').slideUp("fast");
            $('.scroll').css({"background-color":"#000080"});
            $(this).animate({"left":"80%"}, 200);
            $(this).next().animate({"left":"0%"}, 200);
        }
        else
        {
            $('.hidden').animate({"left":"-80%"}, 200);
            $('.header').animate({"left":"0%"}, 200);
            $('.dropdown').slideUp("fast");
        }
    });
    $('.drop').click(function(){
        $('.dropdown').slideUp(200);
        $(this).next().next().slideDown(200);
    });
    $('.close').click(function(){
        $(this).css({"color":"white"});
        $('.hidden').animate({"left":"-80%"}, 200);
        $('.header').animate({"left":"0%"}, 200);
        $('.dropdown').slideUp(200);
        $(this).css({"color":"black"});
    });
    $('.settings').click(function(){
        $('.cover').fadeIn(400);
        $('.settings-panel').fadeIn(400);
    });
    $('.cover').click(function(){
        $('.settings-panel').fadeOut(400);
        $('.cover').fadeOut(400);
    });
});