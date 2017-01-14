This app is a student project meant to take data in JSON format from Irish Tech News. Not fully functional yet.



Version 0.1
- JSON data read from test wordpress site using JSON API plugin 
- displayed news title and date on home page, thumbnail, author's name, news text on newspage 

Version 0.2
- news excerpt displayed as well in home page
- added navigation bar with 8 items with empty links
- added several list iems in left sidebar burger menu
- displayed 3 dots menu icon with no functionality yet

Version 0.3
- plugged to ITN site
- 6 items in top navbar without links
- improved date/time view:
   2016-10-22 21:31:18 -> Wed, 23 Nov 2016 13:17:06 GMT

Version 0.3.1
- main.js created, all js moved there
- time-date changed to 'xx ago' format
- single news title fixed   
- iFrame size fixed
- Related Categories buttons added to single news view

Version 0.4
- All Categories list & Searchbar shown in Burger Menu
- Categories links are working - associated with on click event
- back icon applied
- slow performance!

Version 0.4.1
- Single news page is now generated on the fly!!!
- improved performance
- hardcoded categories (only) in burger menu are closing side bar on click
- oversized images fix 


Version 0.4.3
- collapsible Categories in Burger Menu
- Listview improvements: thumbnail, author, date
- loading spinner added
- toast info added for debugging

Version 0.4.3.B
- moved to Wordpress Rest API
- removed functionality of the category ajax call temporarily
- changed the getPostsByCategory function to search using the id
- changed layout to image tiles (no longer using listview)
Issues
- NavBar no longer working
- Only pulling in 10 posts per request
- Currently using a stretched thumbnail image in the tiles.  Need to add another line to the server side api extenstion
- Menu system totally goosed

Version 0.6
- Menu bars now being updated from ITN Website dynamically
- Automatic AJAX calls on scroll to the bottom of the page


Version 0.6.1
Rejigged Ajax calls to return deferred objects for proper async chaining
Added split functionality to categories menu with favourite star

Version 0.6.2
- myITN functionality
- small fixes (navbar, podcast links)