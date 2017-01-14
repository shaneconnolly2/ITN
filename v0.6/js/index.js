/*
 **************************************************************************************************
 * Author: Team 9
 * Module: WE4.1 Major Project, Digital Skills Academy
 * Title: ITN app 
 * Date: 2016/11/30
 **************************************************************************************************
 *
 * Copyright 2016 Irish Tech News
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

/*********************************
    PHONEGAP APP INITIALISE
**********************************

var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.addEventListener('offline', onOffline, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {

        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {

        //console.log(navigator.notification); // http://cordova.apache.org/docs/en/latest/reference/cordova-plugin-dialogs/index.html
        //alert('Received Event: ' + id);
        startup();

    }
};

app.initialize();
*/

/*************************************
     DESKTOP INITIALISE
**************************************

*/

//Globals
GLOBAL_currentPage = "1";
GLOBAL_gettingAJAX = false;
GLOBAL_perPage = 15;
GLOBAL_paramData = {};
GLOBAL_endOfData = false;
var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var errorCounter = 0; // for debugging only


$(document).ready(function() 
{
    startup();  
});



// JSON DATA FEED
// URL endpoints
var postsURL = "http://irishtechnews.net/ITN3/wp-json/wp/v2/posts/";
var categoriesURL = "http://irishtechnews.net/ITN3/wp-json/wp/v2/categories";
//http://irishtechnews.net/ITN3/wp-json/wp/v2/categories/?per_page=100&page=3
// Mega is the name of the custom menu that ITN update.
var menusURL = "http://irishtechnews.net/ITN3/wp-json/ITN_menus/v1/menus/mega";




function startup() 
{
    //Chaining the AJAX calls and then function to set up Dynamic Menu Panel
   $.when(getTopStories()).done(getCategoryList());
}


function getJSON(JSONurl, callback, parameters) 
{
    if(GLOBAL_endOfData === false)
    {
        console.log(JSONurl);
        GLOBAL_gettingAJAX = true;
        //JSONP HTML Request to Wordpress API
        $.ajax({
            url: JSONurl, // Create the endpoint from given string 
            data: parameters,
            timeout: 25000,
            cache: true,
            // Work with the response
            success: function(data) 
            {
                if(data.length < GLOBAL_perPage)
                {
                    console.log("no more data dude " + data.length + " " + GLOBAL_perPage);
                    GLOBAL_endOfData = true;
                }
              
                callback(data);

            },        
            error: function() 
            {
                //errorCounter++;
                //toast("Ajax error #" + errorCounter).show();
                //checkConnection();
            },
            complete: function()
            {
                GLOBAL_gettingAJAX = false; 
            }            

        }); //End Ajax call
    }
    else{
        console.log("skipping AJAX call");
    } 
}


//Function to get the Most Recent Posts from the API
function getTopStories() 
{
    GLOBAL_paramData.page = GLOBAL_currentPage.toString();
    GLOBAL_paramData.per_page = GLOBAL_perPage.toString();
 
    getJSON(postsURL, displayPost, GLOBAL_paramData);
    $('#title-header').html("Irish Tech News"); 
}

function getNextArticles()
{
    GLOBAL_currentPage++;

    GLOBAL_paramData.page = GLOBAL_currentPage.toString();
    console.log(GLOBAL_paramData);

    getJSON(postsURL, displayPost, GLOBAL_paramData);

}

function getPostsByCategory(categoryID, categoryName) 
{
    //Reset Globals for new Category
    GLOBAL_paramData = {};
    GLOBAL_currentPage = "1";
    GLOBAL_endOfData = false;

    GLOBAL_paramData.page = GLOBAL_currentPage.toString();
    GLOBAL_paramData.per_page = GLOBAL_perPage.toString();
    GLOBAL_paramData.categories = categoryID.toString();
    console.log(GLOBAL_paramData);

    $.mobile.changePage('#main', { transition: "slide" });

    getJSON(postsURL, displayPost, GLOBAL_paramData);

    $('#title-header').html(categoryName); // update title-header to active category clicked
}



function displayPost(data) 
{
    if(GLOBAL_currentPage === "1")
    {
        console.log(data);
        $("#myList").empty();
    }
    
    
    // populate News List
    $(data).each(function(i, item) 
    {
        var date = new Date(item.date); 
        date = timeSince(date);

        var listHTML = '<div class="box">';
        listHTML += '<a class="pageLink" id="' + item.id + '" href="#page' + item.id + '" data-transition="slide">'; 
        listHTML += '<div class="boxInner textOverlay"><img src="' + item.image_URLs[0].thumbImage + '" />';
        listHTML += '<p>' + item.title.rendered;
        listHTML += '<br><span class="authorText">' + (item.author_info.first_name + " " + item.author_info.last_name).toUpperCase();
        listHTML += '  -- ' + date + '</span></p>';
        listHTML += '</div></a></div>';

        $("#myList").append(listHTML);
    });

    //Add infinite scroll functionality
    $(window).scroll(function() 
    {
        if(GLOBAL_gettingAJAX == false)
        {
            if($(window).scrollTop() + $(window).height() == $(document).height()) 
            {
                if(GLOBAL_endOfData === false)
                {
                    getNextArticles();
                }
                else
                {
                    console.log("skipping AJAX Call now");
                }
            }
        }
    });



    // generate and display single news page on click 
    $(".pageLink").on("click", function()
    {
        var myId = parseInt(this.id); // parsing string to integer
        var myPost = findPostById(myId, data);

        // Date formatting
        var date = new Date(myPost.date); // parse date in string to object
        date = timeSince(date);

        var details = myPost.content.rendered;
        details = details.replace('auto_play=true', 'auto_play=false'); // podcast autoplay fix

        //Create string for Related Categories
        var catArray = myPost.post_categories; //array
        console.log(myPost.post_categories);
        var catString = [];
        for (var n = 0; n < catArray.length; n++) {
            catString.push('<a data-catID="' + catArray[n].term_id + '" class="ui-btn ui-btn-inline ui-mini cats" href ="#" id="' + catArray[n].slug + '">' + catArray[n].name + '</a>');
        }
        catString = catString.join(' ');

        // create single news page html
        var pHTML = '<div data-role="page" data-theme="a" id="page' + myPost.id + '">';
        pHTML += '<div data-role="header" id="head' + myPost.id + '">';
        pHTML += '<h1>Irish Tech News</h1>';
        pHTML += '<a href ="#" data-rel="back" data-icon="back" data-iconpos="notext">Back</a></div>'; // end of Header
        pHTML += '<div data-role="content">';
        pHTML += '<h2>' + myPost.title.rendered + '</h2>';
        pHTML += '<strong>' + (myPost.author_info.first_name + " " + myPost.author_info.last_name).toUpperCase() + '</strong> ' + date + '<p/>';
        pHTML += '<img src="' + myPost.image_URLs[0].fullImage + '">' + details + '<br>'; 
        pHTML += '<strong>Related Categories</strong><br>' + catString;
        pHTML += '<hr> <div class="footer">&copy; 2016 Irish Tech News</div></div></div>';

        // append generated html page to the DOM
        $("body").append(pHTML);

        // Category buttons  
        $('.cats').on('click', function(e) 
        { 
            var catID = $(this).data('catid');

            getPostsByCategory(catID); 
        });

        // Go Home  
        $('#home').on('click', function() { getTopStories(); });            

    });
}


function findPostById(myId, dataPostsArray) {
    for (var a = 0, len = dataPostsArray.length; a < len; a++) {
        if (dataPostsArray[a].id === myId)
            return dataPostsArray[a]; // Return as soon as the object is found
    }
    return null; // The object was not found
}

// Time & day conversion to xxx-ago format 
function timeSince(date) {

    var seconds = Math.floor((new Date() - date) / 1000);

    var interval = Math.floor(seconds / 31536000);
    /*
    if (interval > 1) {
        return interval + " years ago";
    }

    if (interval == 1) {
        return interval + " year";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months";
    }
    if (interval == 1) {
        return interval + " month";
    }
    */
    interval = Math.floor(seconds / 86400); 
    if (interval > 6) { // over 6 days
        return date.getDate() + ' ' + monthNames[date.getMonth()] + ' ' + date.getFullYear();
    }
    //interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days ago";
    }
    if (interval == 1) {
        return interval + " day ago";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hours ago";
    }
    if (interval == 1) {
        return interval + " hour ago";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutes ago";
    }
    return Math.floor(seconds) + " seconds ago";
}








/* ********************** MENU FUNCTIONALITY ********************** */
//Function to get the Category List from the API
//Stupidly, there are 250+ categories.  The API only returns 100 at a time, so we have to chain 3 calls together.
//This will only work up to 300 categories.
function getCategoryList() 
{        
    $.when(getJSON("http://irishtechnews.net/ITN3/wp-json/wp/v2/categories/?per_page=100&page=1", updateCategories), 
            getJSON("http://irishtechnews.net/ITN3/wp-json/wp/v2/categories/?per_page=100&page=2", updateCategories),
            getJSON("http://irishtechnews.net/ITN3/wp-json/wp/v2/categories/?per_page=100&page=3", updateCategories),
            getJSON(menusURL, updateTrendingMenu));
}


// inject all categories in Burger Menu
function updateCategories(data) {
    $('#menuPanel').enhanceWithin().panel();

    var myCats = data;

    $(myCats).each(function(index, oneJSONCat) {
        $("#allCatsList").append('<li><a data-catname="' + oneJSONCat.name + '"href = "#main" class ="cats" id = "' + oneJSONCat.id + '">' + oneJSONCat.name + '</a></li>').listview("refresh");
    });

    $('.cats').unbind().click(function(e) 
    {
        LOBAL_currentPage = "1";
        $( "#menuPanel" ).panel( "close" ); // close sidebar
        $('html,body').scrollTop(0);  // navigate to top of the page

        getPostsByCategory(this.id,  $(this).data('catname')); 
    });
}

function updateTrendingMenu(data)
{
     $('#menuPanel').enhanceWithin().panel();

    var myCats = data.items;

    $(myCats).each(function(index, oneJSONCat) 
    {
        $("#trendingList").append('<li><a data-catname="' + oneJSONCat.title + '"href = "#main" class ="trendingCats" id = "' + oneJSONCat.object_id + '">' + oneJSONCat.title + '</a></li>').listview("refresh");
    });

     $('.trendingCats').unbind().click(function(e) 
    {
        LOBAL_currentPage = "1";
        $( "#menuPanel" ).panel( "close" ); // close sidebar
        $('html,body').scrollTop(0);  // navigate to top of the page

        getPostsByCategory(this.id,  $(this).data('catname')); 
    });
}

/* ********************** END MENU FUNCTIONALITY ********************** */






//PhoneGap - Network Info Plugin - determine the device's network connection state, and type of connection
function checkConnection() {
    var networkState = navigator.connection.type;

    var states = {};
    states[Connection.UNKNOWN]  = 'Unknown connection';
    states[Connection.ETHERNET] = 'Ethernet connection';
    states[Connection.WIFI]     = 'WiFi connection';
    states[Connection.CELL_2G]  = 'Cell 2G connection';
    states[Connection.CELL_3G]  = 'Cell 3G connection';
    states[Connection.CELL_4G]  = 'Cell 4G connection';
    states[Connection.CELL]     = 'Cell generic connection';
    states[Connection.NONE]     = 'No network connection';

//window.plugins.toast.showShortTop('Hello there!', function(a){console.log('toast success: ' + a);}, function(b){alert('toast error: ' + b);});
   //alert('Connection type: ' + states[networkState]);
   
   toast('Connection type: ' + states[networkState]);

}

function onOffline() {
    // Handle the offline event()

    //alert('Cannot access content. Check your internet settings.');
    toast('Lost connection. Check your internet settings.');
    //navigator.notification.alert("Cannot access contect. Check your internet settings.", startUp, "Lost Connection", "Retry");
}



/* https://gist.github.com/kamranzafar/3136584 */

function toast(message) {
    var $toast = $('<div class="ui-loader ui-overlay-shadow ui-body-e ui-corner-all">' + message + '</div>');

    $toast.css({
        display: 'block',
        color: '#fff', 
        background: 'grey',
        opacity: 0.50, 
        position: 'fixed',
        padding: '7px',
        'text-align': 'center',
        width: '270px',
        left: ($(window).width() - 284) / 2,
        top: $(window).height() / 2 - 20
    });

    var removeToast = function(){
        $(this).remove();
    };

    $toast.click(removeToast);

    $toast.appendTo($.mobile.pageContainer).delay(3000);
    $toast.fadeOut(600, removeToast);
}