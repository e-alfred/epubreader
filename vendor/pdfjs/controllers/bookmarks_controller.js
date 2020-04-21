PDFJS.reader.BookmarksController = function() {

	var reader = this,
        eventBus = this.eventBus,
	    book = this.book,
        annotations = reader.settings.annotations;

	var $bookmarks = $("#bookmarksView"),
        $list = $bookmarks.find("#bookmarks"),
        $bookmark = $("#bookmark");
	
	var show = function() {
        $bookmarks.addClass('open');
	};

	var hide = function() {
        $bookmarks.removeClass('open');
	};

    var addBookmarkItem = function (bookmark) {
        $list.append(reader.NotesController.createItem(bookmark));
        //reader.settings.session.setBookmark(bookmark.id, bookmark.anchor, bookmark.type, bookmark);
    };

    eventBus.on('bookmarkcreated', function createBookmark1(e) {
        var id = e.id,
            $item =  $("#"+id);

        addBookmarkItem(reader.getAnnotation(id));

        if (id === reader.pageToId(reader.settings.currentPage)) 
            $bookmark
                .addClass("icon-turned_in")
                .removeClass("icon-turned_in_not");
    });

    eventBus.on('bookmarkremoved', function removeBookmark1(e) {
        var id = e.id,
            $item = $("#"+id);

        console.log($item);
        
        console.log("event bookmarkremoved caught:",e,id);

        if (reader.isBookmarked(id)) {
            //delete reader.settings.annotations[id];
            //reader.settings.session.deleteBookmark(id);
            console.log("removing bookmark ", $item, reader.pageToId(reader.settings.currentPage), id);

            $item.remove();
            $item.remove();
            $item.remove();
            $item.remove();

            if (id === reader.pageToId(reader.settings.currentPage))
                $bookmark
                    .removeClass("icon-turned_in")
                    .addClass("icon-turned_in_not");
        }
    });

    for (var bookmark in annotations) {
        if (annotations.hasOwnProperty(bookmark) && (annotations[bookmark].type === "bookmark"))
            addBookmarkItem(annotations[bookmark]);
	};

	return {
		"show" : show,
		"hide" : hide,
        "addItem" : addBookmarkItem,
	};
};
