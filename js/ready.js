document.onreadystatechange = function () {  

    if (document.readyState == "complete") {

        var type=decodeURIComponent(getUrlParameter('type')),
            file=decodeURIComponent(getUrlParameter('file')),
            options = {},
            $session = $('.session');

        options.session = {};
        options.session.filename = decodeURI($session.data('filename'));
        options.session.format = $session.data('filetype');
        options.session.fileId = $session.data('fileid');
        options.session.title = options.session.filename;
        options.session.nonce = $session.data('nonce') || "";
        options.session.version = $session.data('version') || "";
        options.session.metadata = $session.data('metadata') || {};
        options.session.annotations = $session.data('annotations') || {};
        options.session.fileId = $session.data('fileid') || "";
        options.session.scope = $session.data('scope') || "";
        options.session.cursor = $session.data('cursor') || {};
        options.session.defaults = $session.data('defaults') || {};
        options.session.preferences = $session.data('preferences') || {};
        options.session.defaults = $session.data('defaults') || {};
        options.session.basePath = $session.data('basepath');
        options.session.downloadLink = $session.data('downloadlink');

        console.log(options.session.basePath);


        /* functions return jquery promises */
        options.session.getPreference = function(name) {
            return $.get(options.session.basePath + "preference/" + options.session.fileId + "/" + options.session.scope + "/" + name);
        };
        options.session.setPreference = function(name, value) {
            return $.post(options.session.basePath + "preference",
                {
                    "fileId": options.session.fileId,
                    "scope": options.session.scope,
                    "name": name,
                    "value": JSON.stringify(value)
                });
        };
        options.session.deletePreference = function(name) {
            return $.delete(options.session.basePath + "preference/" + options.session.fileId + "/" + options.session.scope + "/" + name);
        };
        options.session.getDefault = function(name) {
            return $.get(options.session.basePath + "preference/default/" + options.session.scope + "/" + name);
        };
        options.session.setDefault = function(name, value) {
            return $.post(options.session.basePath + "preference/default",
                {
                    "scope": options.session.scope,
                    "name": name,
                    "value": JSON.stringify(value)
                });
        };
        options.session.deleteDefault = function(name) {
            return $.delete(options.session.basePath + "preference/default/" + options.session.scope + "/" + name);
        };
        options.session.getBookmark = function(name, type) {
            return $.get(options.session.basePath + "bookmark/" + options.session.fileId + "/" + type + "/" + name);
        };
        options.session.setBookmark = function(name, value, type, content) {
            return $.post(options.session.basePath + "bookmark",
                {
                    "fileId": options.session.fileId,
                    "name": name,
                    "value": JSON.stringify(value),
                    "type": type,
                    "content": JSON.stringify(content)
                });
        };
        options.session.deleteBookmark = function(name) {
            return $.delete(options.session.basePath + "bookmark/" + options.session.fileId + "/" + name);
        };
        options.session.getCursor = function() {
            return $.get(options.session.basePath + "bookmark/cursor/" + options.session.fileId);
        };
        options.session.setCursor = function(value) {
            return $.post(options.session.basePath + "bookmark/cursor", 
                {
                    "fileId": options.session.fileId,
                    "value": JSON.stringify(value)
                });
        };
        options.session.deleteCursor = function() {
            return $.delete(options.session.basePath + "bookmark/cursor/" + options.session.fileId);
        };

        switch (type) {
            case 'application/epub+zip':
                options['contained'] = true;
                renderEpub(file, options);
                break;
            case 'application/x-cbr':
                renderCbr(file, options);
                break;
            case 'application/pdf':
                renderPdf(file, options);
                break;
            default:
                console.log(type + ' is not supported by Reader');
        }
    }

    // why is there no standard library function for this? 
    function getUrlParameter (param) {
        var pattern = new RegExp('[?&]'+param+'((=([^&]*))|(?=(&|$)))','i');
        var m = window.location.search.match(pattern);
        return m && ( typeof(m[3])==='undefined' ? '' : m[3] );
    }

    // start epub.js renderer
    function renderEpub(file, options) {

        // some parameters... 
        EPUBJS.filePath = "vendor/epubjs/";
        EPUBJS.cssPath = "vendor/epubjs/css/";
        EPUBJS.basePath = $('.session').data('basepath');

        /* device-specific boilerplate */

        // IE < 11
        if (navigator.userAgent.indexOf("MSIE") != -1) {
            EPUBJS.Hooks.register("beforeChapterDisplay").wgxpath = function(callback, renderer){
                wgxpath.install(renderer.render.window);
                if(callback)
                    callback();
            };
            wgxpath.install(window);
        }

        var reader = ePubReader(file, options);
    }

    // start cbr.js renderer
    function renderCbr(file, options) {
        CBRJS.filePath = "vendor/cbrjs/";

        var reader = cbReader(file, options);
    }

    // start pdf.js renderer
    function renderPdf(file, options) {
        PDFJS.filePath = "vendor/pdfjs/";
        PDFJS.imageResourcesPath = "vendor/pdfjs/css/images/";
        PDFJS.workerSrc = options.session.basePath + 'vendor/pdfjs/lib/pdf.worker.js';

        var reader = pdfReader(file, options);
    }

};

