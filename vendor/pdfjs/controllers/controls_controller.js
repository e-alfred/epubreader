PDFJS.reader.ControlsController = function(book) {
    var reader = this,
        eventBus = this.eventBus,
        settings = reader.settings,
        customStyles = reader.settings.customStyles,
        activeStyles = reader.settings.activeStyles;

    var $store = $("#store"),
        $viewer = $("#viewer"),
        $fullscreen = $("#fullscreen"),
        $fullscreenicon = $("#fullscreenicon"),
        $cancelfullscreenicon = $("#cancelfullscreenicon"),
        $slider = $("#slider"),
        $main = $("#main"),
        $sidebar = $("#sidebar"),
        $titlebar = $("#titlebar"),
        $settings = $("#setting"),
        $bookmark = $("#bookmark"),
        $note = $("#note"),
        $togglelayout = $("#toggle-layout"),
        $zoom_icon = $("#zoom_icon"),
        $zoom_options = $("#zoom_options"),
        $zoom_option = $(".zoom_option"),
        $rotate_icon = $("#rotate_icon"),
        $rotate_options = $("#rotate_options"),
        $rotate_option = $(".rotate_option"),
        $rotate_left = $("#rotate_left"),
        $rotate_right = $("#rotate_right"),
        $page_num = $("#page_num"),
        $total_pages = $("#total_pages"),
        $status_message_left = $("#status_message_left"),
        $status_message_right = $("#status_message_right"),
        $nightmode = $("#nightmode"),
        $nightshift = $(".nightshift");

    var STATUS_MESSAGE_LENGTH = 30,
        STATUS_MESSAGE_TIMEOUT = 3000,
        status_timeout_left,
        status_timeout_right;

    if (reader.isMobile() === true) {
        $titlebar.addClass("background_visible");
    }

    var show = function () {
        $titlebar.removeClass("hide");
    };

    var hide = function () {
        $titlebar.addClass("hide");
    };

    var toggle = function () {
        $titlebar.toggleClass("hide");
    };

    $viewer.on("touchstart", function(e) {
        reader.ControlsController.toggle();
    });

    var setStatus = function (message, right) {

        $status_message = (right) ? $status_message_right : $status_message_left;
        status_timeout = (right) ? status_timeout_right : status_timeout_left;

        $status_message[0].textContent = reader.ellipsize(message, STATUS_MESSAGE_LENGTH);
        //$status_message[0].textContent = message;

        if (typeof status_timeout === "number") {
            clearTimeout(status_timeout);
            status_timeout = undefined;
        }
        
        status_timeout = setTimeout(function () {
            $status_message[0].textContent = "";
        }, STATUS_MESSAGE_TIMEOUT);

        if (right) {
            status_timeout_right = status_timeout;
        } else {
            status_timeout_left = status_timeout;
        }
    };


    var fullscreen = false;

    $slider.on("click", function () {
        if(reader.sidebarOpen) {
            reader.SidebarController.hide();
        } else {
            reader.SidebarController.show();
        }
    });

    if(typeof screenfull !== 'undefined') {
        $fullscreen.on("click", function() {
            screenfull.toggle($('#container')[0]);
        });
        if(screenfull.raw) {
            document.addEventListener(screenfull.raw.fullscreenchange, function() {
                fullscreen = screenfull.isFullscreen;
                if(fullscreen) {
                    $fullscreen
                        .addClass("icon-fullscreen_exit")
                        .removeClass("icon-fullscreen");
                } else {
                    $fullscreen
                        .addClass("icon-fullscreen")
                        .removeClass("icon-fullscreen_exit");
                }
            });
        }
    }

    $settings.on("click", function() {
        reader.SettingsController.show();
    });

    $note.on("click", function() {
        reader.SidebarController.changePanelTo("Notes");
    });

    $bookmark.on("click", function() {
        var currentPage = reader.settings.currentPage,
            id = reader.pageToId(currentPage);

        if (!reader.isBookmarked(id))
            reader.addBookmark(currentPage)
        else
            reader.removeBookmark(currentPage);
    });

    /* select works fine on most browsers, but - of course - apple mobile has 'special needs' so
     * a custom select is needed...
    */ 

    /* custom select, supports icons in drop-down list */
    // zooooooooooooooom
    $zoom_icon.on("click", function () {
        var offset = $(this).offset();
        $zoom_options.css("opacity", 0);
        $zoom_options.toggleClass("hide");
        $zoom_options.css({
            'left': parseInt(offset.left - ($zoom_options.width() / 2)) + "px",
            'top' : parseInt(parseInt(offset.top) + parseInt($zoom_icon.height())) + "px"
        });

        $zoom_options.css("opacity", "");
    });

    var setZoomIcon = function(zoom) {
        $zoom_icon[0].className="";
        var $current_zoom_option = $zoom_options.find("[data-value='" + zoom + "']");
        if ($current_zoom_option.data("class")) {
            $zoom_icon.addClass($current_zoom_option.data("class"));
        } else {
            $zoom_icon[0].textContent = $current_zoom_option.data("text");
        }
    };

    setZoomIcon(settings.zoomLevel);

    $zoom_option.on("click", function () {
        var $this = $(this);
        reader.setZoom($this.data("value"));
        $zoom_icon[0].className="";
        $zoom_icon[0].textContent = "";
        if ($this.data("class")) {
            $zoom_icon.addClass($this.data("class"));
        } else {
            $zoom_icon[0].textContent = $this.data("text");
        }
        $zoom_options.addClass("hide");
    });

    // rotate
    var setRotateIcon = function (rotation) {
        $rotate_icon[0].className = "";
        $rotate_icon[0].className = "icon-rotate_" + rotation;
    };

    setRotateIcon(settings.rotation);

    $rotate_icon.on("click", function () {
        var offset = $(this).offset();
        $rotate_options.css("opacity", 0);
        $rotate_options.toggleClass("hide");
        $rotate_options.css({
            'left': parseInt(offset.left - ($rotate_options.width() / 2)) + "px",
            'top' : parseInt(parseInt(offset.top) + parseInt($rotate_icon.height())) + "px"
        });

        $rotate_options.css("opacity", "");
    });

    $rotate_option.on("click", function () {
        var $this = $(this);
        reader.setRotation($this.data("value"));
        $rotate_icon[0].className="";
        $rotate_icon[0].textContent = "";
        if ($this.data("class")) {
            $rotate_icon.addClass($this.data("class"));
        } else {
            $rotate_icon[0].textContent = $this.data("text");
        }
        $rotate_options.addClass("hide");
    });

    $rotate_left.on("click", function () {
        // add 360 to avoid negative rotation value
        var rotation = (settings.rotation - 90 + 360) % 360;
        reader.setRotation(rotation);
        $rotate_icon[0].className = "";
        $rotate_icon[0].className = "icon-rotate_" + rotation;
    });

    $rotate_right.on("click", function () {
        var rotation = (settings.rotation + 90) % 360;
        reader.setRotation(rotation);
        $rotate_icon[0].className = "";
        $rotate_icon[0].className = "icon-rotate_" + rotation;
    });
    /* end custom select */
    
    var setNightmodeIcon = function (mode) {
        if (mode) 
            $nightmode.removeClass("icon-brightness_low2").addClass("icon-brightness_4");
        else
            $nightmode.removeClass("icon-brightness_4").addClass("icon-brightness_low2");
    };

    $nightshift.off('click').on('click', function () {
        if (settings.nightMode) {
            reader.disableStyle(customStyles.nightMode);
            settings.nightMode = false;
        } else {
            reader.enableStyle(customStyles.nightMode);
            settings.nightMode = true;
        }

        setNightmodeIcon(settings.nightMode);
    });

    var enterPageNum = function(e) {
        var text = e.target,
            page;

        switch (e.keyCode) {
            case 27: // escape - cancel, discard changes
                $page_num[0].removeEventListener("keydown", enterPageNum, false);
                $page_num.removeClass("editable");
                $page_num.prop("contenteditable",false);
                $page_num.text($page_num.data("content"));
                break;
            case 13: // enter - accept changes
                $page_num[0].removeEventListener("keydown", enterPageNum, false);
                $page_num.removeClass("editable");
                $page_num.attr("contenteditable", false);
                page = parseInt($page_num.text());
                if (page > 0 && page <= reader.settings.numPages) {
                    reader.queuePage(page);
                } else {
                    $page_num.text($page_num.data("content"));
                }
                break;
        }

        e.stopPropagation();
    };


    $page_num.on("click", function() {
        $page_num.data("content", $page_num.text());
        $page_num.text("");
        $page_num.prop("contenteditable", true);
        $page_num.addClass("editable");
        $page_num[0].addEventListener("keydown", enterPageNum, false);
    });

    eventBus.on("renderer:pagechanged", function toggleControls1(e) {
        var page = e.pageNum,
            id = reader.pageToId(page);

        if (reader.isBookmarked(id))
            $bookmark
                .addClass("icon-turned_in")
                .removeClass("icon-turned_in_not");
        else
            $bookmark
                .removeClass("icon-turned_in")
                .addClass("icon-turned_in_not");
    });

    var setPageCount = function (_numPages) {

        var numPages = _numPages || reader.settings.numPages;

        $total_pages[0].textContent = parseInt(numPages).toString();
    };

    var setCurrentPage = function (_page) {

        var page = _page || reader.settings.currentPage,
            zoom = reader.settings.zoomLevel,
            oddPageRight = reader.settings.oddPageRight,
            total_pages = reader.settings.numPages,
            text;

        if (zoom === "spread") {
            if (oddPageRight === true) {
                page -= page % 2;
            } else {
                page -= (page + 1) % 2;
            }

            if (page >= 0 && page <= total_pages) {
                if (page === total_pages) {
                    text = reader.getPageLabel(page);
                } else if (page === 0) {
                    text = reader.getPageLabel(page + 1);
                } else {
                    text = reader.getPageLabel(page) + "-" + reader.getPageLabel(page + 1);
                }
            }
        } else {
            text = reader.getPageLabel(page);
        }

        $page_num[0].textContent = text;
    };

    return {
        "show": show,
        "hide": hide,
        "toggle": toggle,
        "setZoomIcon": setZoomIcon,
        "setRotateIcon": setRotateIcon,
        "setNightmodeIcon": setNightmodeIcon,
        "setCurrentPage": setCurrentPage,
        "setPageCount": setPageCount,
        "setStatus": setStatus
    };
};
