PDFJS.reader.ReaderController = function() {
    var $main = $("#main"),
        $viewer = $("#viewer"),
        $divider = $("#divider"),
        $loader = $("#loader"),
        $next = $("#next"),
        $prev = $("#prev"),
        $sidebarReflow = $('#sidebarReflow'),
        $metainfo = $("#metainfo"),
        $use_custom_colors = $("#use_custom_colors"),
        $container = $("#container"),
        $fullscreen = $("#fullscreen"),
        $bookmark = $("#bookmark"),
        $note = $("#note"),
        $nightmode = $("#nightmode"),
        $rotate_left = $("#rotate_left"),
        $rotate_right = $("#rotate_right"),
        $clear_search = $("#clear_search");

    var reader = this,
        book = this.book,
        settings = reader.settings;

    var slideIn = function() {
        if (reader.viewerResized) {
            var currentPosition = settings.currentPage;
            reader.viewerResized = false;
        }
    };

    var slideOut = function() {
        var currentPosition = settings.currentPage;
        reader.viewerResized = true;
    };

    var showLoader = function() {
        $loader.show();
        hideDivider();
    };

    var hideLoader = function() {
        $loader.hide();
    };

    var showDivider = function() {
        $divider.addClass("show");
    };

    var hideDivider = function() {
        $divider.removeClass("show");
    };

    var keylock = false;

    var showActive = function (obj) {
        keylock = true;
        obj.addClass("active");	
        setTimeout(function () {
            keylock = false;
            obj.removeClass("active");
        }, 100);
    };

    var keyCommands = function(e) {

        var page_no = false;

        e.preventDefault();

        switch (settings.keyboard[e.keyCode]) {
            case 'previous':
                $prev.click();
                break;
            case 'next':
                $next.click();
                break;
            case 'first':
                page_no = 1;
                break;
            case 'last':
                page_no = reader.settings.numPages;
                break;
            case 'annotate':
                $note.click();
                break;
            case 'bookmark':
                $bookmark.click();
                break;
            case 'toggleTitlebar':
                reader.ControlsController.toggle();
                break;
            case 'toggleSidebar':
                reader.SidebarController.toggle();
                break;
            case 'closeSidebar':
                reader.SidebarController.hide();
                break;
            case 'toggleFullscreen':
                $fullscreen.click();
                break;
            case 'toggleNight':
                $nightmode.click();
                break;
            case 'rotateLeft':
                $rotate_left.click();
                break;
            case 'rotateRight':
                $rotate_right.click();
                break;
            case 'cycleZoom':
                reader.cycleZoom();
                break;
            case 'previousMatch':
                reader.SearchController.nextMatch(true);
                break;
            case 'nextMatch':
                if (e.shiftKey)
                    reader.SearchController.nextMatch(true);
                else
                    reader.SearchController.nextMatch(false);
                break;
            case 'clearSearch':
                $clear_search.click();
                break;
            case 'search':
                if (e.shiftKey) {
                    reader.SidebarController.changePanelTo("Search");
                    reader.SearchController.show();
                }

                break;
            default:
                console.log("unsupported keyCode: " + e.keyCode);
        }

        if (page_no) {
            reader.queuePage(page_no);
        }
    };

    document.addEventListener('keydown', keyCommands, false);

    $next.on("click", function(e){

        reader.nextPage();
        showActive($next);
        e.preventDefault();
    });

    $prev.on("click", function(e){

        reader.prevPage();
        showActive($prev);
        e.preventDefault();
    });

    return {
        "slideOut" : slideOut,
        "slideIn"  : slideIn,
        "showLoader" : showLoader,
        "hideLoader" : hideLoader,
        "showDivider" : showDivider,
        "hideDivider" : hideDivider,
        "keyCommands" : keyCommands
    };
};
