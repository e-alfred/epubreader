PDFJS.reader.SidebarController = function(book) {
    var reader = this,
        settings = reader.settings;

    var $sidebar = $("#sidebar"),
        $panels = $("#panels"),
        $views = $("#views"),
        $close = $("#hide-Sidebar");
        $slider = $("#slider");

    var activePanel = "Toc";

    var changePanelTo = function(viewName) {
        var controllerName = viewName + "Controller";

        if (!(activePanel == viewName || typeof reader[controllerName] === 'undefined' )) {
            reader[activePanel+ "Controller"].hide();
            reader[controllerName].show();
            activePanel = viewName;

            //$panels.find('.open').removeClass("open");
            $sidebar.find('.open').removeClass("open");
            $panels.find("#show-" + viewName ).addClass("open");
            $views.find("#" + viewName.toLowerCase() + "View").addClass("open");
        }
        show();
    };

    var getActivePanel = function() {
        return activePanel;
    };

    var show = function() {
        reader.sidebarOpen = true;
        if (settings.sidebarReflow) reader.ReaderController.slideOut();
        $slider.hide();
        $sidebar.addClass("open");
        if (getActivePanel() === "Toc")
            reader.TocController.scrollToPage(settings.currentPage);
    }

    var hide = function() {
        reader.sidebarOpen = false;
        $slider.show();
        reader.ReaderController.slideIn();
        $sidebar.removeClass("open");
    };

    var toggle = function () {
        (reader.sidebarOpen) ? hide() : show();
    };

    $close.on("click", function () {
        reader.SidebarController.hide();
        // $slider.addClass("icon-menu");
        // $slider.removeClass("icon-right");

    });

    $panels.find(".show_view").on("click", function(e) {
        var view = $(this).data("view");

        changePanelTo(view);
        e.preventDefault();
    });

    $sidebar.css("width", "calc(" + parseInt(settings.thumbnailWidth) + "px + 2em)");

    return {
        'show' : show,
        'hide' : hide,
        'toggle' : toggle,
        'getActivePanel' : getActivePanel,
        'changePanelTo' : changePanelTo
    };
};
