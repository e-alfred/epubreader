PDFJS.reader.SettingsController = function() {

	var reader = this,
		book = this.book,
		settings = reader.settings;

    var $settings = $("#settingsView"),
        $viewer = $("#viewer"),
		$overlay = $(".overlay"),
        $next = $("#next"),
        $prev = $("#prev"),
        $close = $("#close"),
        $sidebarReflow = $('#sidebarReflow'),
        $scrollToTop = $('#scrollToTop'),
        $touch_nav = $("#touch_nav"),
        $page_turn_arrows = $("#page_turn_arrows"),
        $prev_arrow = $("#prev :first-child"),
        $next_arrow = $("#next :first-child");

	var show = function() {
        $settings.addClass('open');
	};

	var hide = function() {
        $settings.removeClass('open');
	};

    if (settings.scrollToTop) {
        $scrollToTop.prop('checked', true);
    } else {
        $scrollToTop.prop('checked', false);
    }

    $scrollToTop.off('click').on('click', function() {
        settings.scrollToTop = !settings.scrollToTop;
        settings.session.setDefault("scrollToTop", settings.scrollToTop);
    });

    if (settings.sidebarReflow) {
        $sidebarReflow.prop('checked', true);
    } else {
        $sidebarReflow.prop('checked', false);
    }

	$sidebarReflow.off('click').on('click', function() {
		settings.sidebarReflow = !settings.sidebarReflow;
        if (settings.sidebarReflow && reader.sidebarOpen) reader.ReaderController.slideOut();
        if (!settings.sidebarReflow && !reader.sidebarOpen) reader.ReaderController.slideIn();
        settings.session.setDefault("sidebarReflow", settings.sidebarReflow);
	});

	$settings.find(".closer").on("click", function() {
		hide();
	});

	$overlay.on("click", function() {
		hide();
	});

    // only enable close button when launched in an iframe default
    if (parent !== window) {
        $close.show();
        $close.on("click", function () {
            reader.book.destroy();
            parent.OCA.Files_Reader.Plugin.hide();
        });
    }

    // default for extra wide navigation controls;
    //  devices with touch navigation: on
    //  devices without touch navigation: off
    $touch_nav.prop('checked', !('ontouchstart' in document.documentElement));
    if (!($touch_nav.prop('checked'))) {
        $next.addClass("touch_nav");
        $prev.addClass("touch_nav");
    }

    // extra wide nagivation controls
    $touch_nav.off('change').on('change', function() {
        if ($(this).prop('checked')) {
            $prev.removeClass("touch_nav");
            $next.removeClass("touch_nav");
        } else {
            $prev.addClass("touch_nav");
            $next.addClass("touch_nav");
        }
    });

    // page turn arrows default
    if (settings.pageArrows) {
        $page_turn_arrows.prop('checked', true);
        $prev_arrow.removeClass("translucent");
        $next_arrow.removeClass("translucent");
    } else {
        $page_turn_arrows.prop('checked', false);
        $prev_arrow.addClass("translucent");
        $next_arrow.addClass("translucent");
    }

    // page turn arrows
    $page_turn_arrows.off('change').on('change', function() {
        if ($(this).prop('checked')) {
            settings.pageArrows = true;
            $prev_arrow.removeClass("translucent");
            $next_arrow.removeClass("translucent");
        } else {
            settings.pageArrows = false;
            $prev_arrow.addClass("translucent");
            $next_arrow.addClass("translucent");
        }

        settings.session.setDefault("pageArrows", settings.pageArrows);
    });

	return {
		"show" : show,
		"hide" : hide
	};
};
