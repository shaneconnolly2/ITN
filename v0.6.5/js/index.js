/*
 **************************************************************************************************
 * Author: Team 9
 * Module: WE4.1 Major Project, Digital Skills Academy
 * Title: ITN app 
 * Date: 2016/11/30
 * Versio 0.6.1
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
GLOBAL_perCategory = 4;
GLOBAL_paramData = {};
GLOBAL_endOfData = false;
GLOBAL_currentCategory = 0;
var monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var errorCounter = 0; // for debugging only

// API setup
var rootURL = "http://we41team9.webelevate.net";
var APIPath = "/wp-json";
var namespaceWP = "/wp/v2";
var namespaceITN = "/ITN_api/v1";
var homePageRoute = "/homepage";
var postsRoute = "/posts";
var categoriesRoute = "/categories";
var menusRoute = "/menu";
var trendingMenuName = "mega";

var homePageURL = rootURL + APIPath + namespaceITN + homePageRoute;
var postsURL = rootURL + APIPath + namespaceWP + postsRoute;
var categoriesURL = rootURL + APIPath + namespaceITN + categoriesRoute;
var menusURL = rootURL + APIPath + namespaceITN + menusRoute;


/**
 * On document Ready Function
 */
 $(document).ready(function() 
 {
    // are we running in native app or in a browser?
    window.isphone = false;
    if(document.URL.indexOf("http://") === -1 
        && document.URL.indexOf("https://") === -1) {
        window.isphone = true;
    }

    //Only for testing 
    window.isphone = false;

    if( window.isphone ) {
        document.addEventListener("deviceready", onDeviceReady, false);
    } else {
        onDeviceReady();
    }
});

function onDeviceReady() 
{ 
    //$("#splash").html('<br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>');

    //Get the Home Page Stories
    GLOBAL_paramData.percategory = GLOBAL_perCategory.toString();
    GLOBAL_paramData.menu = trendingMenuName;

    $.when(getJSON(homePageURL, GLOBAL_paramData)).done(function(data)
    {
        displayPost(data);
        GLOBAL_endOfData = true;
        loadLocalVariables();
    });

    // Setup event hooks
    $('#home').on('click', function() 
    {
        getHomePage(); 
    });

    $('#title-header').on('click', function() 
    {
        refreshPage($('#title-header').data('catid'), $('#title-header').innerHTML);

    }); 

}

function setupCarousel()
{
    var $carousel = $('.carousel').flickity();

    $carousel.on( 'staticClick.flickity', function( event, pointer, cellElement, cellIndex ) 
    {
        if ( typeof cellIndex == 'number' ) 
        {
            $carousel.flickity( 'selectCell', cellIndex );

            if($(cellElement).data('catname') === "home")
            {
                getHomePage();
            }
            else
            {
                //If we changed category
                if(GLOBAL_currentCategory !== $(cellElement).data('catid'))
                {
                    getPostsByCategory($(cellElement).data('catid'),  $(cellElement).data('catname'));
                }
                
                
            }
        }
    });   
}

function refreshPage(catID, catName)
{
        if(catID !== -1 ) // refresh a category page
        {
            getPostsByCategory(catID, catName);
        }
        else // refresh the home page
        {
             getHomePage(); 
        }

}

function getHomePage()
{
    GLOBAL_paramData = {};
    GLOBAL_paramData.percategory = GLOBAL_perCategory.toString();
    GLOBAL_paramData.menu = trendingMenuName;
    GLOBAL_currentCategory = 0;

     $.when(getJSON(homePageURL, GLOBAL_paramData)).done(function(data)
    {
        $('#title-header').html("Irish Tech News"); // update title-header to active category clicked
        $('#title-header').data('catid',-1);        // set a flag to tell us we are on the home page
        displayPost(data);
        GLOBAL_endOfData = true;
    });
}



/**
 * Ajax call to the Wordpress REST API
 * @param {string} JSONurl - The URL we are calling using the ajax call 
 * @param {object array} - parameters - array of parameters for the ajax call in {"key" : "value"} format
 * @return {deferred promise} deferred promise object from ajax call
 */
function getJSON(JSONurl, parameters) 
{
    GLOBAL_gettingAJAX = true;

    return $.ajax({
            url: JSONurl, // Create the endpoint from given string 
            data: parameters,
            timeout: 25000,
            cache: true,
            // Work with the response
            beforeSend : function() 
            {   
                $.mobile.loading('show'); // show loader icon
                //$(".box").css({opacity: 0.50});
            }, 
            success: function(data) 
            {
                $("#splash").html(''); // remove splash loader after data loaded
                if(data.length < GLOBAL_perPage)
                {
                    GLOBAL_endOfData = true;
                } 

            },        
            error: function(xhr,textStatus,errorThrown) { 
                console.log("error: " + textStatus + " " + errorThrown);
                //errorCounter++;
                //toast("Ajax error #" + errorCounter).show();
                //checkConnection();
            },
            complete: function()
            {
                GLOBAL_gettingAJAX = false; 
                $.mobile.loading('hide'); // hide loader icon
                //$(".box").css({opacity: 1}); 
            }            

        }); //End Ajax call    
   
}       

function loadLocalVariables()
{
    localStorage.clear();

    if (typeof(Storage) !== "undefined") //Local Storage is Available
    {        
        if (localStorage.getItem("localCats") === null) //Only nmake ajax request if we have no local data
        {
            getCategoryList();            
        }
        else
        {
            console.log("adding from local");
            addCategoriesToMenu();
            addTrendingToMenu();
            addMyITNToMenu();
        }
    } 
    else 
    {
        //Local Storage is not Available
        //Could hard code some here - dunno!
    }
}

function getNextArticles()
{
    GLOBAL_currentPage++;

    GLOBAL_paramData.page = GLOBAL_currentPage.toString();

    $.when(getJSON(postsURL, GLOBAL_paramData)).done(function(data)
    {
        displayPost(data);
    });

}

function getPostsByCategory(categoryID, categoryName) 
{
    //Reset Globals for new Category
    GLOBAL_paramData = {};
    GLOBAL_currentPage = "1";
    GLOBAL_endOfData = false;
    GLOBAL_currentCategory = categoryID;

    GLOBAL_paramData.page = GLOBAL_currentPage.toString();
    GLOBAL_paramData.per_page = GLOBAL_perPage.toString();
    GLOBAL_paramData.categories = categoryID.toString();

    $.mobile.changePage('#main', { transition: "slide" });

    $.when(getJSON(postsURL, GLOBAL_paramData)).done(function(data)
    {
        $('#title-header').html(categoryName); // update title-header to active category clicked
        $('#title-header').data('catid',categoryID);;
        displayPost(data);

    });    
}

function displayPost(data) 
{
    if(GLOBAL_currentPage === "1")
    {
        $("#myList").empty();
    }
    
    
    // Check if we are using the home page data
    if (!("from_cat" in data[0]))
    {  
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
    }
    else
    {
        var currentCat = "";

        $(data).each(function(i, item) 
        {
            var listHTML = "";
            var date = new Date(item.date); 
            date = timeSince(date);
            if(item.from_cat.toString() !== currentCat)
            {
                //First post from the category
                currentCat = item.from_cat.toString();
                listHTML += '<div class = "catHeading" data-catid="' + item.from_cat_ID + '" data-catname="' + item.from_cat + '">' + item.from_cat;
                listHTML += '</div>'
            }
           
            listHTML += '<div class="box">';
            listHTML += '<a class="pageLink" id="' + item.id + '" href="#page' + item.id + '" data-transition="slide">'; 
            listHTML += '<div class="boxInner textOverlay"><img src="' + item.image_URLs[0].thumbImage + '" />';
            listHTML += '<p>' + item.title.rendered;
            listHTML += '<br><span class="authorText">' + (item.author_info.first_name + " " + item.author_info.last_name).toUpperCase();
            listHTML += '  -- ' + date + '</span></p>';
            listHTML += '</div></a></div>';
            

            $("#myList").append(listHTML);
        });

        $('.catHeading').on('click', function(e) 
        {    
            getPostsByCategory($(this).data('catid'), $(this).data('catname')); 
        });

    }

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
        var catArray = myPost.post_categories; 

        var catString = [];
        for (var n = 0; n < catArray.length; n++) {
            catString.push('<a data-catid="' + catArray[n].term_id + '" data-catname="' + catArray[n].name + '"class="ui-btn ui-btn-inline ui-mini cats" href ="#" id="' + catArray[n].name + '">' + catArray[n].name + '</a>');
        }
        catString = catString.join(' ');

        // create single news page html
        var pHTML = '<div data-role="page" data-theme="a" id="page' + myPost.id + '">';
        pHTML += '<div data-role="header" id="head' + myPost.id + '">';
        pHTML += '<h1>Irish Tech News</h1>';
        pHTML += '<a href ="#" data-rel="back" data-icon="back" data-iconpos="notext"></a></div>'; // end of Header
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
            getPostsByCategory($(this).data('catid'),  $(this).data('catname')); 
        });                  

    });
}









/* ********************** MENU FUNCTIONALITY ********************** */
//Function to get the Category List from our API
function getCategoryList() 
{ 
    GLOBAL_paramData.menu = trendingMenuName;

    $.when(getJSON(categoriesURL, GLOBAL_paramData), getJSON(menusURL, GLOBAL_paramData))
        .done(function(catData, trendingData)
        {
            updateCategories(catData[0]);
            updateTrendingCats(trendingData[0].items);        
        });
}



// Save Category Data to Local Storage
function updateCategories(data) 
{
    var ITNCats = [];
    if(localStorage.getItem("localCats") !== null) //If we already have some data in localStorage
    {
        ITNCats = JSON.parse(localStorage.getItem("localCats"));
    }

    $.each(data, function(index, oneJSONCat) 
    {
        ITNCats.push({"catName" : oneJSONCat.name, "catID" : oneJSONCat.cat_ID, "catFave" : "false"});        
    });

    localStorage.setItem("localCats", JSON.stringify(ITNCats));

    addCategoriesToMenu();    
}

function updateTrendingCats(data)
{
    var ITNCats = [];
    if(localStorage.getItem("trendingCats") !== null) //If we already have some data in localStorage
    {
        ITNCats = JSON.parse(localStorage.getItem("trendingCats"));
    }

    $(data).each(function(index, oneJSONCat) 
    {
        ITNCats.push({"trendingCatName" : oneJSONCat.title, "trendingCatID" : oneJSONCat.object_id });        
    });

    localStorage.setItem("trendingCats", JSON.stringify(ITNCats));

    addTrendingToMenu();
    addTrendingToCarousel();
}



function addCategoriesToMenu()
{
    $('#menuPanel').enhanceWithin().panel();

    var ITNCats = [];
    var icon = "";
    var blank = "";
    ITNCats = JSON.parse(localStorage.getItem("localCats"));

    $(ITNCats).each(function(index, oneCat)
    {

        if(oneCat.catFave.toString() === "false")
        {
            icon = "blank";
            blank = "true";

        }
        else
        {
            icon = "star";
            blank = "false";
        }

        $("#allCatsList").append('<li><a href="#main" class="cats" data-catid="' + oneCat.catID + '"data-catname="' + oneCat.catName + '" id = "' + "catList" + oneCat.catID + '">' + oneCat.catName + '</a><a id="' + "catListFave" + oneCat.catID + '" data-blank="' + blank + '" data-catname="' + oneCat.catName + '" data-catid = "' + oneCat.catID + '" data-icon="' + icon + '" class="favouriteToggle" ></a></li>').listview("refresh");
    });

    $('.favouriteToggle').unbind().click(function(e) 
    { 
        var isBlank = $(this).data('blank');
        if(isBlank.toString() === "true")
        {
            $(this).buttonMarkup({ icon: "star" });
            $(this).data('blank',"false");
            
        }
        else
        {
            $(this).buttonMarkup({ icon: "blank" });
            $(this).data('blank',"true");
        }
        toggleFave($(this).data('catid'));
        addMyITNToMenu();
        
    });

    $('.cats').unbind().click(function(e) 
    {
        //GLOBAL_currentPage = "1";
        $( "#menuPanel" ).panel( "close" ); // close sidebar
        $('html,body').scrollTop(0);  // navigate to top of the page
        getPostsByCategory($(this).data('catid'),  $(this).data('catname')); 
    });
    
}

function addTrendingToMenu()
{
    $('#menuPanel').enhanceWithin().panel();

    var ITNTrendingCats = [];
    ITNTrendingCats = JSON.parse(localStorage.getItem("trendingCats"));

    $(ITNTrendingCats).each(function(index, oneJSONCat) 
    {
        $("#trendingList").append('<li><a data-catname="' + oneJSONCat.trendingCatName + '"href = "#main" class ="trendingCats" id = "' + oneJSONCat.trendingCatID + '">' + oneJSONCat.trendingCatName + '</a></li>').listview("refresh");
    });

    $('.trendingCats').unbind().click(function(e) 
    {
        $( "#menuPanel" ).panel( "close" ); // close sidebar
        $('html,body').scrollTop(0);  // navigate to top of the page

        getPostsByCategory(this.id,  $(this).data('catname')); 
    });
}

function addTrendingToCarousel()
{
    var ITNTrendingCats = [];
    ITNTrendingCats = JSON.parse(localStorage.getItem("trendingCats"));

    $(ITNTrendingCats).each(function(index, oneJSONCat) 
    {
        var $cellElems = $('<div data-catid="' + oneJSONCat.trendingCatID + '"data-catname="' + oneJSONCat.trendingCatName + '"class="carousel-cell2"><div class="cell-title" id="carousel' + oneJSONCat.trendingCatID + '">' + oneJSONCat.trendingCatName + '</div></div>');
        $('.carousel').flickity( 'append', $cellElems );
    });

    setupCarousel();

}

function toggleFave(catID)
{
    var ITNCats = [];
    ITNCats = JSON.parse(localStorage.getItem("localCats"));


    for (var i = 0, len = ITNCats.length; i < len; i++)
    {
        if (ITNCats[i] && ITNCats[i]["catID"] === catID)
        {
            if(ITNCats[i]["catFave"].toString() === "false")
            {
                ITNCats[i].catFave = "true";            
            }
            else
            {
                ITNCats[i].catFave = "false";
            }

            localStorage.setItem("localCats", JSON.stringify(ITNCats));
            return;
        }
    }    
}

function addMyITNToMenu()
{
    $('#menuPanel').enhanceWithin().panel();
    $("#myITNList").empty();

    var ITNCats = [];
    ITNCats = JSON.parse(localStorage.getItem("localCats"));

    $(ITNCats).each(function(index, oneCat)
    {
        if(oneCat.catFave.toString() === "true")
        {
            $("#myITNList").append('<li><a href="#main" class="myITNCats" data-catname="' + oneCat.catName + '" id = "' + oneCat.catID + '">' + oneCat.catName + '</a><a data-blank="true" data-catname="' + oneCat.catName + '" data-catid = "' + oneCat.catID + '" data-icon="star" class="myITNFave" ></a></li>').listview("refresh");
        }
    });

    $('.myITNFave').unbind().click(function(e) 
    { 
        $('#' + "catListFave" + $(this).data('catid')).buttonMarkup({ icon: "blank" });
        $('#' + "catListFave" + $(this).data('catid')).data('blank',"true");

        toggleFave($(this).data('catid'));
        addMyITNToMenu();        
    });

    $('.myITNCats').unbind().click(function(e) 
    {
        //GLOBAL_currentPage = "1";
        $( "#menuPanel" ).panel( "close" ); // close sidebar
        $('html,body').scrollTop(0);  // navigate to top of the page

        getPostsByCategory(this.id,  $(this).data('catname')); 
    });

}

/* ********************** END MENU FUNCTIONALITY ********************** */







/* ********************** HELPER FUNCTIONS ********************** */
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
/* ********************** END HELPER FUNCTIONS ********************** */











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