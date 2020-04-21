PDFJS.reader.ProgressController = function() {
    var reader = this,
        settings = reader.settings,
        percentage = 0;

    var $progress = $("#progress"),
        $bar = $(".bar"),
        $download_icon = $("#download_icon"),
        $message = $(".message-text");

    var show = function () {
        $progress.removeClass("hide");
    };

    var hide = function () {
        $progress.addClass("hide");
    };

    var setSize = function (size) {
        settings.fileSize = size;
    };

    var setProgress = function (progress) {

        if (percentage < 1)
            $download_icon.addClass("active");

        percentage = Math.floor((progress.loaded / progress.total) * 100);
        $bar.css("width", percentage + "%");

        if (percentage === 100)
            $download_icon.removeClass("active").addClass("ok");
    };

    var reset = function() {
        $bar.css("width", 0);
    };

    var setMessage = function (text, category, state) {

        var $category_icon = $("#" + category + "_icon");

        $message.text(text);

        $category_icon[0].classList.remove("ok", "active", "error");
        $category_icon.addClass(state);
    };


    return {
        "show": show,
        "hide": hide,
        "setSize": setSize,
        "setProgress": setProgress,
        "setMessage": setMessage
    };
};
