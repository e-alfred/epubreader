epubreader
------------

Reader is an ebook reader based on pure javascript renderers. It works for publications formatted according to the following standards:

 - [Epub]
 - [PDF]
 - [CBR and CBZ] ('comics')

For Epub Reader uses the futurepress [epub.js] renderer to provide near-native looks, especially when used full-screen. Turn pages by pressing the left/right hand side of the screen/window or using the cursor keys (if you have those), use the sidebar to browse through chapters or bookmarks and add annotations.

PDF is handled by Mozilla's [pdf.js] renderer in combination with a custom reader app to enable side-by-side display, batch search and more. Controls are like those used in the Epub renderer with a few exceptions, e.g. night mode has not been implemented yet.

CBR and CBZ are supported using a custom renderer inspired by [balaclark]'s work. As with Epub, books can be navigated using the keyboard as well as mouse or touch navigation. Reader generates a visual index of all pages, show in the sidebar (thumbnail generation can be disabled for low-memory and/or -speed devices). As CBx files are often of varying quality, a set of image enhancement filters are provided.

# Features
Reader remembers the last-visited page in a book and returns to that page when the book is re-opened. As all settings are stored on the server these features are device-independent, ie. you can start reading on a mobile device, continue on a PC to finish the book on a tablet.

### Text-based formats incl. PDF

  - seamless full-screen mode supported on browsers which allow full user-control, ie. not on Apple)
  - single- and double-page viewing mode
  - user-configurable font and colour settings
  - night mode, toggled by clicking the book title/author on top of the viewer or the night mode button (PDF)
  - full-text search with keyword highlighting
  - bookmarks (with automatic snippet generation)
  - annotations (not yet implemented for PDF)
  - keyboard and pointer/touch-based navigation

### CBR/CBZ ('Comics')

  - seamless full-screen mode supported on browsers which allow full user-control, ie. not on Apple)
  - single- and double-page viewing mode
  - optional image enhancement filters
  - Left-to-right and right-to-left (_manga_) modes
  - visual index (thumbnail size user-configurable, can be disabled for low-memory or -cpu devices)
  - keyboard and pointer/touch-based navigation

PDF support is still somewhat rough around the edges, not all features have been implemented yet. There is a known cosmetical issue in that in spread mode the (invisible but selectable) text layer for the left page is offset from the left when opening a document. As soon as a page is turned this problem disappears.

### Keyboard navigation
Reader supports both pointer/touch-based as well as keyboard-based navigation. Pointer/touch based is mostly self-explanatory,

| key | function |
| ---:| --- |
|_left_, _page-up_ | move to previous page; move to next page in RTL(_manga_) mode |
|_right_, _page-down_, _space_ | move to next page; move to previous page in RTL (_mange_) mode |
|_home_| move to first page |
|_end_| move to last page |
|s| toggle side bar |
|_esc_| close sidebar |
|f| toggle full screen|
|t| toggle toolbar |
|l| _CBR_: toggle layout |
|a| _EPUB_: annotate |
|b| _EPUB_: bookmark |
|r| _EPUB_: reflow text when sidebar is open |
|d| _EPUB_: toggle day (custom colour) mode |
|n| _EPUB_: toggle night mode |

### Defaults and Preferences

Reader stores __defaults__ - settings which are independent of _fileId_ (ie. independent of the book currently open) - and __preferences__ - _fileId_-dependent (ie. different for every book) - on the server. Defaults are not shared between renderers, ie. the CBR renderer does not share defaults with the EPUB or PDF renderer. Defaults and preferences are removed from the server when the associated book or user is deleted.

### Annotations and Bookmarks

Reader supports _annotations_ (notes linked to a given position in a book) and _bookmarks_ (position markers with automatically generated text snippets). An automatically generated bookmark (called '__ CURSOR __', not visible in the bookmarks list) is used to keep track of the current reading position. Annotations and bookmark snippets can be edited or deleted in the sidebar.


# Screenshots
### Epub
|   |   |
---|---
Reader showing page spread in 'night mode'|![Reader showing page spread in 'night mode'][SS01]
Epub single page, full screen on a small-screen device |![Epub single page, full screen][SS02]
Day mode color selector|![Day mode color selector][SS03]
Longing for that olde-time terminal feeling...|![Longing for that olde-time terminal feeling...][SS04]
Full-text search|![Full-text search][SS05]
Small screen device, __maximize text area__ enabled|![Small screen device, maximize text area enabled][SS06]
Search on small-screen device|![Search on small-screen device][SS07]
As close to full-screen as you can get on iOS|![As close to full-screen as you can get on iOS][SS08]
Android supports true fullscreen (as do most other systems)|![Android supports true fullscreen (as do most other systems)][SS09]

### PDF
|   |   |
---|---
Reader showing PDF Reference document in spread mode (pages side by side)|![Reader showing PDF Reference document in spread mode (pages side by side)][SS20]
Search through a document, showing all results in the sidebar|![Search through a document, showing all results in the sidebar][SS19]
Dropdown showing page format options - spread, single page, page width and zoom options|![Dropdown showing page format options - spread, single page, page width and zoom options][SS21]
Reader showing PDF in spread mode, thumbnails in the sidebar|![Reader showing PDF in spread mode, thumbnails in the sidebar][SS22]

### CBR/CBZ
|   |   |
---|---
 iOS approximation of full screen, CBR|![iOS approximation of full screen, CBR][SS10]
The same book, now in landscape mode, switch to 2-page spread is automatic|![The same book, now in landscape mode, switch to 2-page spread is automatic][SS11]
Sidebar open, showing index, landscape mode|![Sidebar open, showing index, landscape mode][SS12]
Sidebar open, showing index, portrait mode|![Sidebar open, showing index, portrait mode][SS13]
Image enhancement filters, desaturate (grayscale) active|![Image enhancement filters, desaturate (grayscale) active][SS14]
full screen (apart from iOS restrictions), controls hidden|![full screen (apart from iOS restrictions), controls hidden][SS15]
Same page, zoomed in|![Same page, zoomed in][SS16]
Small-screen, low memory (Android) device showing full-page book cover|![Small-screen, low memory Android device showing full-page book cover][SS17]
The same Android device showing a zoomed-in part of a page|![The same Android device showing a zoomed-in part of a page][SS18]



   [epub.js]: https://github.com/futurepress/epub.js
   [Epub]: http://idpf.org/epub
   [CBR and CBZ]: https://wiki.mobileread.com/wiki/CBR_and_CBZ
   [balaclark]: https://github.com/balaclark/HTML5-Comic-Book-Reader
   [PDF]: https://en.wikipedia.org/wiki/Portable_Document_Format
   [pdf.js]: https://github.com/mozilla/pdf.js
   [SS01]: https://raw.githubusercontent.com/e-alfred/epubreader/master/screenshots/epubreader-1.png "Reader showing day/nighyt mode"
   [SS02]: https://raw.githubusercontent.com/e-alfred/epubreader/master/screenshots/epubreader-3.png "Single page full screen on a small-screen device"
   [SS03]: https://raw.githubusercontent.com/e-alfred/epubreader/master/screenshots/photo_2017-03-15_17-21-39.jpg "Day mode color selector"
   [SS04]: https://raw.githubusercontent.com/e-alfred/epubreader/master/screenshots/photo_2017-03-15_17-21-41.jpg?raw=true "Longing For that olde-time terminal feeling..."
   [SS05]: https://raw.githubusercontent.com/e-alfred/epubreader/master/screenshots/photo_2017-03-15_17-21-53.jpg "Full-text search"
   [SS06]: https://raw.githubusercontent.com/e-alfred/epubreader/master/screenshots/photo_2017-03-15_18-28-46.jpg "Small screen device, __maximize text area__ enabled"
   [SS07]: https://github.com/e-alfred/epubreader/blob/master/screenshots/photo_2017-03-15_18-28-49.jpg?raw=true "Search on small-screen device"
   [SS08]: https://github.com/e-alfred/epubreader/blob/master/screenshots/photo_2017-03-15_17-21-52.jpg?raw=true "As close to full-screen as you can get on iOS"
   [SS09]: https://github.com/e-alfred/epubreader/blob/master/screenshots/Screenshot_2014-09-29-20-21-50.png?raw=true "Android supports true fullscreen (as do most other systems)"
   [SS10]: https://github.com/e-alfred/epubreader/blob/master/screenshots/photo_2017-03-15_17-21-59.jpg?raw=true "iOS approximation of full screen, CBR"
   [SS11]: https://github.com/e-alfred/epubreader/blob/master/screenshots/photo_2017-03-15_17-22-00.jpg?raw=true "The same book, now in landscape mode, switch to 2-page spread is automatic"
   [SS12]: https://github.com/e-alfred/epubreader/blob/master/screenshots/photo_2017-03-15_17-22-01.jpg?raw=true "Sidebar open, showing index, landscape mode"
   [SS13]: https://github.com/e-alfred/epubreader/blob/master/screenshots/photo_2017-03-15_17-22-02.jpg?raw=true "Sidebar open, showing index, portrait mode"
   [SS14]: https://github.com/e-alfred/epubreader/blob/master/screenshots/photo_2017-03-15_17-22-05.jpg?raw=true "Image enhancement filters, desaturate (grayscale) active"
   [SS15]: https://github.com/e-alfred/epubreader/blob/master/screenshots/photo_2017-03-15_17-22-08.jpg?raw=true "full screen (apart from iOS restrictions), controls hidden"
   [SS16]: https://github.com/e-alfred/epubreader/blob/master/screenshots/photo_2017-03-15_17-22-10.jpg?raw=true "Same page, zoomed in"
   [SS17]: https://github.com/e-alfred/epubreader/blob/master/screenshots/photo_2017-03-15_18-28-54.jpg?raw=true "Small-screen, low memory (Android) device showing full-page book cover"
   [SS18]: https://github.com/e-alfred/epubreader/blob/master/screenshots/photo_2017-03-15_18-28-56.jpg?raw=true "The same Android device showing a zoomed-in part of a page"
   [SS19]: https://github.com/e-alfred/epubreader/blob/master/screenshots/epubreader_PDF_001.png?raw=true "Search through a document, showing all results in the sidebar"
   [SS20]: https://github.com/e-alfred/epubreader/blob/master/screenshots/epubreader_PDF_002.png?raw=true "Reader showing PDF Reference document in spread mode (pages side by side)"
   [SS21]: https://github.com/e-alfred/epubreader/blob/master/screenshots/epubreader_PDF_005.png?raw=true "Dropdown showing page format options - spread, single page, page width and zoom options"
   [SS22]: https://github.com/e-alfred/epubreader/blob/master/screenshots/epubreader_PDF_006.png?raw=true "Reader showing PDF in spread mode, thumbnails in the sidebar"
