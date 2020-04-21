PDFJS.reader.StylesController = function (renderer) {

    var reader = this,
		settings = reader.settings,
        customStyles = reader.settings.customStyles,
        activeStyles = reader.settings.activeStyles,
        $main = $("#main"),
        $nightmode_form = $('#nightmode_form'),
        $nightmode_reset = $('#nightmode_reset'),
        $night_brightness = $('#night_brightness'),
        $night_contrast = $('#night_contrast'),
        $night_sepia = $('#night_sepia'),
        $night_huerotate = $('#night_huerotate'),
        $night_saturate = $('#night_saturate'),
        $nightshift = $('.nightshift');

    this.addStyle("nightMode", "*", {
        filter: 'invert(1) sepia(' + $night_sepia.val() + ') hue-rotate(' + $night_huerotate.val() + 'deg) brightness(' + $night_brightness.val() + ') contrast(' + $night_contrast.val() + ') saturate(' + $night_saturate.val() + ')'
    });
    
    this.addStyle("appleBugs", "document, html, body, p, span, div", {
        "cursor": "pointer"
    });

    // fix click-bug in apple products
    if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g))
        activeStyles['appleBugs'] = true;

    for (var style in activeStyles) {
        if (!activeStyles.hasOwnProperty(style)) continue;

        switch (style) {
            case "nightMode":
                reader.ControlsController.setNightmodeIcon(true);
                break;
            case "appleBugs":
                console.log("Apple mobile bugs detected, applying workarounds...");
                break;
        }

        reader.enableStyle(customStyles[style]);
    }

    $night_brightness.off('change').on('change', function() {
        updateNightmode();
    });

    $night_contrast.off('change').on('change', function() {
        updateNightmode();
    });

    $night_sepia.off('change').on('change', function() {
        updateNightmode();
    });

    $night_huerotate.off('change').on('change', function() {
        updateNightmode();
    });

    $night_saturate.off('change').on('change', function() {
        updateNightmode();
    });

    $nightmode_form.off('reset').on('reset', function () {
        setTimeout(function() {
            updateNightmode();
        }, 10);
    });

    var parseFilter = function(str, element) {
		var re = new RegExp(element+'\\(([\\d.]+)\\S*\\)'),
            value = null;

        if (re.test(str))
            value = str.match(re)[1];
        
		return value;
	};

    var updateNightmode = function() {
        customStyles.nightMode.rules.filter = 'invert(1) sepia(' + $night_sepia.val() + ') hue-rotate(' + $night_huerotate.val() + 'deg) brightness(' + $night_brightness.val() + ') contrast(' + $night_contrast.val() + ') saturate(' + $night_saturate.val() + ')';
        reader.updateStyle(customStyles.nightMode);
    };

    $night_brightness.val(parseFilter(customStyles.nightMode.rules.filter,"brightness"));
    $night_contrast.val(parseFilter(customStyles.nightMode.rules.filter,"contrast"));
    $night_sepia.val(parseFilter(customStyles.nightMode.rules.filter,"sepia"));
    $night_huerotate.val(parseFilter(customStyles.nightMode.rules.filter,"hue-rotate"));
    $night_saturate.val(parseFilter(customStyles.nightMode.rules.filter,"saturate"));

    return {
    };
};
