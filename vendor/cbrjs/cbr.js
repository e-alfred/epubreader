var CBRJS = CBRJS || {};
CBRJS.VERSION = "0.0.1";

CBRJS.basePath = CBRJS.basePath || "";
CBRJS.session = CBRJS.session || {};

CBRJS.Reader = function(bookPath, _options) {

    var reader = this,
        $progressbar = $('.bar'),
		search = window.location.search,
		parameters,
        options,
        found;

    this.options = options = $.extend(true, _options || {}, {
        bookPath: bookPath,
        session: {}
    });

    // Overide options with search parameters
    if(search) {
        parameters = search.slice(1).split("&");
        parameters.forEach(function(p){
            var split = p.split("=");
            var name = split[0];
            var value = split[1] || '';
            reader.options[name] = decodeURIComponent(value);
        });
    }

	function extractImages(url, opts) {

		var images = [],
		    xhr = new XMLHttpRequest(),
		    filename = decodeURIComponent(url.split('/').pop()),
            re_file_ext = new RegExp(/\.([a-z]+)$/),
            format = filename.toLowerCase().match(re_file_ext)[1],
		    archive_class = ({ cbz: 'Unzipper', cbr: 'Unrarrer' })[format],
		    options = $.extend({
			    start: function () {},
			    extract: function (page_url) {},
			    progress: function (percent_complete) {},
			    finish: function (images) {}
		    }, opts);

		if (!archive_class) {
			alert('invalid file type, only cbz and cbr are supported.');
			return false;
		}

		xhr.open('GET',url, true);

		options.start(filename);

		xhr.responseType = "arraybuffer";

		xhr.onprogress = function (e) {
			if (e.lengthComputable) {
				$progressbar.css('width', Math.floor((e.loaded / e.total) * 100) + '%');
			}
		};

		xhr.onloadstart = function (e) {
			$progressbar.css('width', '0%');
		};

		xhr.onloadend = function (e) {
			$('.icon-cloud_download').addClass('ok');
            reader.options.session.size = e.total;
		};

		xhr.onload = function () {
			if ((this.status === 200) && this.response) {
				var done = false;
				var ua = new bitjs.archive[archive_class](this.response, document.head.dataset.basepath + 'vendor/bitjs/');

				ua.addEventListener(bitjs.archive.UnarchiveEvent.Type.START, function (e) {
					$progressbar.css('width', '0%');
					$('.icon-unarchive').addClass('active');
				});

				ua.addEventListener(bitjs.archive.UnarchiveEvent.Type.EXTRACT, function (e) {

					var mimetype, blob, url;
					var file_extension = e.unarchivedFile.filename.toLowerCase().match(re_file_ext)[1];

					switch (file_extension) {
						case 'jpg':
						case 'jpeg':
							mimetype = 'image/jpeg';
							break;
						case 'png':
							mimetype = 'image/png';
							break;
						case 'gif':
							mimetype = 'image/gif';
							break;
						default:
							return false;
					}

					blob = new Blob([e.unarchivedFile.fileData], { type: mimetype });
					url = window.URL.createObjectURL(blob);

					images.push(url);

					options.extract(url, blob);
				});

				ua.addEventListener(bitjs.archive.UnarchiveEvent.Type.PROGRESS, function (e) {
					options.progress(Math.floor(e.currentBytesUnarchived / e.totalUncompressedBytesInArchive * 100));
				});

				ua.addEventListener(bitjs.archive.UnarchiveEvent.Type.FINISH, function (e) {
					options.finish(images);
				});

				ua.addEventListener(bitjs.archive.UnarchiveEvent.Type.ERROR, function (e) {
					$('.icon-unarchive').removeClass('active');
					$('.icon-unarchive').addClass('error');
					$('#message').text('Failed to extract images from archive, file corrupted?');

				});
			}

			ua.start();
		};

		xhr.send();
	}

	function openComicArchive(url, options) {

		var title, page = 0;

		extractImages(url, {
			start: function (filename) {
				this.filename = filename;
                $('.toolbar').addClass('hide');
                $('.navigation').addClass('hide');
				$('.icon-cloud_download').addClass('active');
				$('.message-text').text(filename);
				$('#progressbar').show();
			},
			extract: function (url, blob) {
				$('.message-text').text('extracting page #' + ++page);
			},
			progress: function (percent_complete) {
				$progressbar.css('width', percent_complete + '%');
			},
			finish: function (pages) {

			    $('.icon-unarchive').addClass('ok');
				var name = this.filename.replace(/\.[a-z]+$/, '');
				var id = encodeURIComponent(name.toLowerCase());
				var book = new ComicBook('viewer', pages, options);

				document.title = name;

                $('.toolbar').removeClass('hide');
                $('.navigation').removeClass('hide');
				$('#progressbar').hide();
				$('#viewer').show();

				book.draw();

				$(window).on('resize', function () {
					book.draw();
				});
				$(window).on('beforeunload', function(e) {
					book.destroy();
				});
            }
		});

	}


    function getPref (arr, name) {
        if ((arr.constructor === Array) && (found = arr.filter(function(e) { return e.name === name; }))) {
            if (found.hasOwnProperty("value")) {
                return found.value;
            }
        }
    };

	openComicArchive(bookPath, {
        currentPage: parseInt(options.session.cursor.value) || 0,
        enhance: getPref(options.session.preferences, "enhance") || {},
        manga: getPref(options.session.preferences, "manga") || false,
        thumbnails: getPref(options.session.defaults, "thumbnails"),
        thumbnailWidth: parseInt(getPref(options.session.defaults, "thumbnailWidth")) || 200,
        session: options.session
    });

    return this;
};

var ComicBook;
ComicBook = (function ($) {


    'use strict';

    /**
     * Merge two arrays. Any properties in b will replace the same properties in
     * a. New properties from b will be added to a.
     *
     * @param a {Object}
     * @param b {Object}
     */
    function merge(a, b) {

        var prop;

        if (typeof b === 'undefined') {
            b = {};
        }

        for (prop in a) {
            if (a.hasOwnProperty(prop)) {
                if (prop in b) {
                    continue;
                }
                b[prop] = a[prop];
            }
        }

        return b;
    }

    /**
     * Exception class. Always throw an instance of this when throwing exceptions.
     *
     * @param {String} type
     * @param {Object} object
     * @returns {ComicBookException}
     */
    var ComicBookException = {
        INVALID_ACTION: 'invalid action',
        INVALID_PAGE: 'invalid page',
        INVALID_PAGE_TYPE: 'invalid page type',
        UNDEFINED_CONTROL: 'undefined control',
        INVALID_ZOOM_MODE: 'invalid zoom mode',
        INVALID_NAVIGATION_EVENT: 'invalid navigation event'
    };

    function ComicBook(id, srcs, opts) {

        var self = this;
        var canvas_id = id; // canvas element id
        this.srcs = srcs; // array of image srcs for pages

        var defaults = {
            displayMode: (window.innerWidth > window.innerHeight) ? 'double' : 'single', // single / double
            zoomMode: 'fitWindow', // manual / fitWidth / fitWindow
            manga: false, // true / false
            fullscreen: false, // true / false
            enhance: {}, // image filters to use
            thumbnails: true, // true / false (use thumbnails in index)
            thumbnailWidth: 200, // width of thumbnail
            sidebarWide: false, // use wide sidbar
            currentPage: 0, // current page
            keyboard: {
                32: 'next', // space
                34: 'next', // page-down
                39: 'next', // cursor-right
                33: 'previous', // page-up
                37: 'previous', // cursor-left
                36: 'first', // home
                35: 'last', // end
                83: 'sidebar', // s
                84: 'toolbar', // t
                76: 'toggleLayout', // l
                70: 'toggleFullscreen', // f
                27: 'closeSidebar' // esc
            },
            vendorPath: document.head.dataset.basepath + 'vendor/',
            forward_buffer: 3,
            session: {
                getCursor: function() {},
                setCursor: function(value) {},
                getBookmark: function(name, type) {},
                setBookmark: function(name, value, type, content) {},
                getDefault: function(name) {},
                setDefault: function(name, value) {},
                getPreference: function(name) {},
                setPreference: function(name, value) {}
            }
        };

		var options = {};

        this.isMobile = false;

        // mobile enhancements
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent)) {
            this.isMobile = true;
            document.body.classList.add('mobile');

            window.addEventListener('load', function () {
                setTimeout(function () {
                    window.scrollTo(0, 1);
                }, 0);
            });
        }

        window.addEventListener('resize', function () {
            self.setLayout((window.innerWidth > window.innerHeight) ? 'double' : 'single');
        });

        $.extend(true, options, defaults, opts); // options array for internal use

        var no_pages = srcs.length;
        var pages = []; // array of preloaded Image objects
        var canvas; // the HTML5 canvas object
        var context; // the 2d drawing context
        var tcv = document.createElement("canvas"); // canvas used for thumbnailer
        var tctx = tcv.getContext('2d'); // context used for thumbnailer
        var toc = document.getElementById('toc'); // context used for thumbnailer
        var loaded = []; // the images that have been loaded so far
        var scale = 1; // page zoom scale, 1 = 100%
        var is_double_page_spread = false;
        var controlsRendered = false; // have the user controls been inserted into the dom yet?
        var page_requested = false; // used to request non preloaded pages
        var shiv = false;

        /**
         * Gets the window.innerWidth - scrollbars
         */
        function windowWidth() {

            var height = window.innerHeight + 1;

            if (shiv === false) {
                shiv = $(document.createElement('div'))
                    .attr('id', 'cbr-width-shiv')
                    .css({
                        width: '100%',
                        position: 'absolute',
                        top: 0,
                        zIndex: '-1000'
                    });

                $('body').append(shiv);
            }

            shiv.height(height);

            return shiv.innerWidth();
        }

        /**
         * enables the back button
         */
        function checkHash() {

            var hash = getHash();

            if (hash !== options.currentPage && loaded.indexOf(hash) > -1) {
                options.currentPage = hash;
                self.draw();
            }
        }

        function getHash() {
            var hash = parseInt(location.hash.substring(1), 10) - 1 || 0;
            if (hash < 0) {
                setHash(0);
                hash = 0;
            }
            return hash;
        }

        function setHash(pageNo) {
            location.hash = pageNo;
        }

        // page hash on first load
        var hash = getHash();

        /**
         * Setup the canvas element for use throughout the class.
         */
        function init() {

            // setup canvas
            canvas = document.getElementById(canvas_id);
            context = canvas.getContext('2d');

            // render user controls
            if (controlsRendered === false) {
                self.renderControls();
                self.tocCreate(no_pages);
                controlsRendered = true;
            }

            // add page controls
            window.addEventListener('keydown', self.navigation, false);
            window.addEventListener('hashchange', checkHash, false);

            // fill in metadata
            options.session.pagecount = srcs.length;
            $('.book-title').text(options.session.title);
            $('.book-format').text(options.session.format);
            $('.book-pagecount').text(options.session.pagecount);
            $('.book-size').text(options.session.size);
        }

        window.addEventListener('touchstart', function (e) {
            var $el = $(e.target);
            if ($el.attr('id') === 'viewer') {
                self.toggleToolbar();
            }
        }, false);

        /**
         * Connect controls to events
         */
        ComicBook.prototype.renderControls = function () {

            var controls = {}, $toolbar;

            // set values from preferences or defaults
            // do this before connecting listeners to avoid triggering callbacks
            for (var prop in options.enhance) {
                if(options.enhance.hasOwnProperty(prop)) {
                    switch (prop) {
                        case 'brightness':
                            document.getElementById('brightness').value = options.enhance.brightness['brightness'];
                            document.getElementById('contrast').value = options.enhance.brightness['contrast'];
                            break;
                        case 'sharpen':
                            document.getElementById('sharpen').value = options.enhance.sharpen['strength'];
                            break;
                        case 'desaturate':
                            $('#image-desaturate').prop('checked', true);
                            break;
                        case 'removenoise':
                            $('#image-removenoise').prop('checked', true);
                            break;
                        default:
                            console.log("unknown enhancement: " + JSON.stringify(prop));
                    }
                }
            };

            // thumbnail controls
            $('#thumbnail-generate').prop('checked', options.thumbnails);
            $('#thumbnail-width').val(options.thumbnailWidth);
            if (!options.thumbnails) {
                $('#toc-populate').addClass('open');
                $('#thumbnail-width').prop('disabled', true);
            }

            // connect callbacks
            $('.control').each(function () {

                controls[$(this).attr('name')] = $(this);

                // add event listeners to controls that specify callbacks
                $(this).find('*').andSelf().filter('[data-action][data-trigger]').each(function () {

                    var $this = $(this);
                    var trigger = $this.data('trigger');
                    var action = $this.data('action');

                    // trigger a direct method if exists
                    if (typeof self[$this.data('action')] === 'function') {
                        $this.on(trigger, self[action]);
                    }

                    // throw an event to be caught outside if the app code
                    $this.on(trigger, function (e) {
                        $(self).trigger(trigger, e);
                    });
                });
            });

            this.controls = controls;

            $toolbar = this.getControl('toolbar');
            $toolbar
                .find('.manga-' + options.manga).show().end()
                .find('.manga-' + !options.manga).hide().end()
                .find('.layout').hide().end().find('.layout-' + options.displayMode).show().end()
                .find('.fullscreen-' + options.fullscreen).show().end()
                .find('.fullscreen-' + !options.fullscreen).hide();

            if (parent !== window) {
                $('.close').removeClass('hide');
                $('.close').on('click', function() { parent.OCA.Files_Reader.Plugin.hide(); });
            }
        };

        ComicBook.prototype.getControl = function (control) {
            if (typeof this.controls[control] !== 'object') {
                throw ComicBookException.UNDEFINED_CONTROL + ' ' + control;
            }
            return this.controls[control];
        };

        ComicBook.prototype.showControl = function (control) {
            this.getControl(control).show().addClass('open');
        };

        ComicBook.prototype.hideControl = function (control) {
            this.getControl(control).removeClass('open').hide();
        };

        ComicBook.prototype.toggleControl = function (control) {
            this.getControl(control).toggle().toggleClass('open');
        };

        ComicBook.prototype.toggleLayout = function () {
            self.setLayout((options.displayMode === 'single') ? 'double' : 'single');
        };

        ComicBook.prototype.setLayout = function (layout) {
            var $toolbar = self.getControl('toolbar');
            options.displayMode = (layout === 'single') ? 'single' : 'double';

            $toolbar.find('.layout').hide().end().find('.layout-' + options.displayMode).show();

            self.drawPage();
        };


        /**
         * Create thumbnail for image
         *
         * @return Image
         */
        ComicBook.prototype.getThumb = function (image) {
            var thumb = new Image();
            var scale = image.width / options.thumbnailWidth;
            tcv.width = options.thumbnailWidth;
            tcv.height = Math.floor(image.height / scale);
            tctx.drawImage(image, 0, 0, tcv.width, tcv.height);
            thumb.src = tcv.toDataURL();
            tctx.clearRect(0, 0, tcv.width, tcv.height);

            return thumb;
        };

        /**
         * Create empty TOC with placeholder images
         */
        ComicBook.prototype.tocCreate = function (no_pages) {
            // use small image with reasonable aspect ratio
            tcv.width = 5;
            tcv.height = 7;
            // transparent, style with .placeholder in CSS
            tctx.fillStyle = "rgba(200, 200, 200, 0)";
            tctx.fillRect(0, 0, tcv.width, tcv.height);
            var imgsrc = tcv.toDataURL();

            for(var i = 0; i < no_pages; i++) {
                var item = document.createElement('li');
                item.setAttribute("id", "page-" + parseInt(i + 1));
                var placeholder = new Image();
                placeholder.src = imgsrc;
                var label = document.createElement('span');
                label.innerHTML = i + 1;
                item.appendChild(placeholder);
                item.appendChild(label);
                toc.appendChild(item);
            }
        };

        /**
         * Insert thumbnail into TOC
         */
        ComicBook.prototype.tocInsert = function (image, page, replace) {
            var placeholder = toc.children[page].firstChild;
            if (replace === true) {
                placeholder.parentNode.replaceChild(
                    self.getThumb(image),
                    placeholder
                );
            }

            toc.children[page].addEventListener('click', function (e) {
                self.drawPage(page + 1, true);
            });
        };

        /**
         * Populate TOC on demand
         */
        ComicBook.prototype.tocPopulate = function () {
            var i = 0;
            while (i < srcs.length) {
                self.tocInsert(pages[i], i, true);
                i++;
            }

            // set, but don't save for future sessions
            options.thumbnails = true;
            $('#toc-populate').removeClass('open');
        };

        /**
         * Get the image for a given page.
         *
         * @return Image
         */
        ComicBook.prototype.getPage = function (i) {

            if (i < 0 || i > srcs.length - 1) {
                throw ComicBookException.INVALID_PAGE + ' ' + i;
            }

            if (typeof pages[i] === 'object') {
                return pages[i];
            } else {
                page_requested = i;
                this.showControl('loadingOverlay');
            }
        };

        /**
         * @see #preload
         */
        ComicBook.prototype.draw = function () {

            init();

            // resize navigation controls
            $('.navigate').outerHeight(window.innerHeight);
            $('.overlay').outerWidth(windowWidth()).height(window.innerHeight);

            // preload images if needed
            if (pages.length !== no_pages) {
                this.preload();
            } else {
                this.drawPage();
            }
        };

        /**
         * Zoom the canvas
         *
         * @param new_scale {Number} Scale the canvas to this ratio
         */
        ComicBook.prototype.zoom = function (new_scale) {
            options.zoomMode = 'manual';
            scale = new_scale;
            if (typeof this.getPage(options.currentPage) === 'object') {
                this.drawPage();
            }
        };

        ComicBook.prototype.zoomIn = function () {
            self.zoom(scale + 0.1);
        };

        ComicBook.prototype.zoomOut = function () {
            self.zoom(scale - 0.1);
        };

        ComicBook.prototype.fitWidth = function () {
            options.zoomMode = 'fitWidth';
            self.drawPage();
        };

        ComicBook.prototype.fitWindow = function () {
            options.zoomMode = 'fitWindow';
            self.drawPage();
        };

        /**
         * Preload all images, draw the page only after a given number have been loaded.
         *
         * @see #drawPage
         */
        ComicBook.prototype.preload = function () {

            var i = options.currentPage; // the current page counter for this method
            var rendered = false;
            var queue = [];

            this.showControl('loadingOverlay');

            function loadImage(i) {

                var page = new Image();
                page.src = srcs[i];

                page.onload = function () {

                    pages[i] = this;

                    self.tocInsert(this, i, options.thumbnails);

                    loaded.push(i);

                    $('#cbr-progress-bar .progressbar-value').css('width', Math.floor((loaded.length / no_pages) * 100) + '%');

                    // double page mode needs an extra page added
                    var buffer = (options.displayMode === 'double' && options.currentPage < srcs.length - 1) ? 1 : 0;

                    // start rendering the comic when the requested page is ready
                    if ((rendered === false && ($.inArray(options.currentPage + buffer, loaded) !== -1) ||
                        (typeof page_requested === 'number' && $.inArray(page_requested, loaded) !== -1))) {
                        // if the user is waiting for a page to be loaded, render that one instead of the default options.currentPage
                        if (typeof page_requested === 'number') {
                            options.currentPage = page_requested - 1;
                            page_requested = false;
                        }

                        self.drawPage();
                        self.hideControl('loadingOverlay');
                        rendered = true;
                    }

                    if (queue.length) {
                        loadImage(queue[0]);
                        queue.splice(0, 1);
                    } else {
                        $('#cbr-status').delay(500).fadeOut();
                    }
                };
            }

            // loads pages in both directions so you don't have to wait for all pages
            // to be loaded before you can scroll backwards
            function preload(start, stop) {

                var j = 0;
                var count = 1;
                var forward = start;
                var backward = start - 1;

                while (forward <= stop) {

                    if (count > options.forward_buffer && backward > -1) {
                        queue.push(backward);
                        backward--;
                        count = 0;
                    } else {
                        queue.push(forward);
                        forward++;
                    }
                    count++;
                }

                while (backward > -1) {
                    queue.push(backward);
                    backward--;
                }

                loadImage(queue[j]);
            }

            preload(i, srcs.length - 1);
        };

        ComicBook.prototype.pageLoaded = function (page_no) {
            return (typeof loaded[page_no - 1] !== 'undefined');
        };

        /**
         * Draw the current page in the canvas
         */
        ComicBook.prototype.drawPage = function (page_no, reset_scroll) {

            var scrollY;

            reset_scroll = (typeof reset_scroll !== 'undefined') ? reset_scroll : true;
            scrollY = reset_scroll ? 0 : window.scrollY;

            // if a specific page is given try to render it, if not bail and wait for preload() to render it
            if (typeof page_no === 'number' && page_no < srcs.length && page_no > 0) {
                options.currentPage = page_no - 1;
                if (!this.pageLoaded(page_no)) {
                    this.showControl('loadingOverlay');
                    return;
                }
            }

            if (options.currentPage < 0) {
                options.currentPage = 0;
            }

            var zoom_scale;
            var offsetW = 0,
                offsetH = 0;

            var page = self.getPage(options.currentPage);
            var page2 = false;

            if (options.displayMode === 'double' && options.currentPage < srcs.length - 1) {
                page2 = self.getPage(options.currentPage + 1);
            }

            if (typeof page !== 'object') {
                throw ComicBookException.INVALID_PAGE_TYPE + ' ' + typeof page;
            }

            var width = page.width,
                height = page.height;

            // reset the canvas to stop duplicate pages showing
            canvas.width = 0;
            canvas.height = 0;

            // show double page spreads on a single page
            is_double_page_spread = (
            typeof page2 === 'object' &&
            (page.width > page.height || page2.width > page2.height) &&
            options.displayMode === 'double'
            );
            if (is_double_page_spread) {
                options.displayMode = 'single';
            }

            if (options.displayMode === 'double') {

                // for double page spreads, factor in the width of both pages
                if (typeof page2 === 'object') {
                    width += page2.width;
                }

                // if this is the last page and there is no page2, still keep the canvas wide
                else {
                    width += width;
                }
            }

            // update the page scale if a non manual mode has been chosen
            switch (options.zoomMode) {

                case 'manual':
                    document.body.style.overflowX = 'auto';
                    zoom_scale = (options.displayMode === 'double') ? scale * 2 : scale;
                    break;

                case 'fitWidth':
                    document.body.style.overflowX = 'hidden';

                    // scale up if the window is wider than the page, scale down if the window
                    // is narrower than the page
                    zoom_scale = (windowWidth() > width) ? ((windowWidth() - width) / windowWidth()) + 1 : windowWidth() / width;

                    // update the interal scale var so switching zoomModes while zooming will be smooth
                    scale = zoom_scale;
                    break;

                case 'fitWindow':
                    document.body.style.overflowX = 'hidden';

                    var width_scale = (windowWidth() > width) ?
                    ((windowWidth() - width) / windowWidth()) + 1 // scale up if the window is wider than the page
                        :
                    windowWidth() / width; // scale down if the window is narrower than the page
                    var windowHeight = window.innerHeight;
                    var height_scale = (windowHeight > height) ?
                    ((windowHeight - height) / windowHeight) + 1 // scale up if the window is wider than the page
                        :
                    windowHeight / height; // scale down if the window is narrower than the page

                    zoom_scale = (width_scale > height_scale) ? height_scale : width_scale;
                    scale = zoom_scale;
                    break;

                default:
                    throw ComicBookException.INVALID_ZOOM_MODE + ' ' + options.zoomMode;
            }

            var canvas_width = page.width * zoom_scale;
            var canvas_height = page.height * zoom_scale;

            var page_width = (options.zoomMode === 'manual') ? page.width * scale : canvas_width;
            var page_height = (options.zoomMode === 'manual') ? page.height * scale : canvas_height;

            canvas_height = page_height;

            // make sure the canvas is always at least full screen, even if the page is more narrow than the screen
            canvas.width = (canvas_width < windowWidth()) ? windowWidth() : canvas_width;
            canvas.height = (canvas_height < window.innerHeight) ? window.innerHeight : canvas_height;

            // always keep pages centered
            if (options.zoomMode === 'manual' || options.zoomMode === 'fitWindow') {

                // work out a horizontal position
                if (canvas_width < windowWidth()) {
                    offsetW = (windowWidth() - page_width) / 2;
                    if (options.displayMode === 'double') {
                        offsetW = offsetW - page_width / 2;
                    }
                }

                // work out a vertical position
                if (canvas_height < window.innerHeight) {
                    offsetH = (window.innerHeight - page_height) / 2;
                }
            }

            // in manga double page mode reverse the page(s)
            if (options.manga && options.displayMode === 'double' && typeof page2 === 'object') {
                var tmpPage = page;
                var tmpPage2 = page2;
                page = tmpPage2;
                page2 = tmpPage;
            }

            // draw the page(s)
            context.drawImage(page, offsetW, offsetH, page_width, page_height);
            if (options.displayMode === 'double' && typeof page2 === 'object') {
                context.drawImage(page2, page_width + offsetW, offsetH, page_width, page_height);
            }

            this.pixastic = new Pixastic(context, options.vendorPath + 'pixastic/');

            // apply any image enhancements previously defined
            $.each(options.enhance, function (action, options) {
                self.enhance[action](options);
            });

            var current_page =
                (options.displayMode === 'double' &&
                options.currentPage + 2 <= srcs.length) ? (options.currentPage + 1) + '-' + (options.currentPage + 2) : options.currentPage + 1;

            this.getControl('toolbar')
                .find('.current-page').text(current_page)
                .end()
                .find('.page-count').text(srcs.length);

            // revert page mode back to double if it was auto switched for a double page spread
            if (is_double_page_spread) {
                options.displayMode = 'double';
            }

            // disable the fit width button if needed
            $('button.cbr-fit-width').attr('disabled', (options.zoomMode === 'fitWidth'));
            $('button.cbr-fit-window').attr('disabled', (options.zoomMode === 'fitWindow'));

            // disable prev/next buttons if not needed
            $('.navigate').show();
            if (options.currentPage === 0) {
                if (options.manga) {
                    $('.navigate-left').show();
                    $('.navigate-right').hide();
                } else {
                    $('.navigate-left').hide();
                    $('.navigate-right').show();
                }
            }

            if (options.currentPage === srcs.length - 1 || (typeof page2 === 'object' && options.currentPage === srcs.length - 2)) {
                if (options.manga) {
                    $('.navigate-left').hide();
                    $('.navigate-right').show();
                } else {
                    $('.navigate-left').show();
                    $('.navigate-right').hide();
                }
            }

            if (options.currentPage !== getHash()) {
                $(this).trigger('navigate');
            }

            // update hash location
            if (getHash() !== options.currentPage) {
                setHash(options.currentPage + 1);
            }

            options.session.setCursor(options.currentPage);
        };

        /**
         * Increment the counter and draw the page in the canvas
         *
         * @see #drawPage
         */
        ComicBook.prototype.drawNextPage = function () {

            var page;

            try {
                page = self.getPage(options.currentPage + 1);
            } catch (e) {
            }

            if (!page) {
                return false;
            }

            if (options.currentPage + 1 < pages.length) {
                options.currentPage += (options.displayMode === 'single' || is_double_page_spread) ? 1 : 2;
                try {
                    self.drawPage();
                } catch (e) {
                }
            }

            // make sure the top of the page is in view
            window.scroll(0, 0);
        };

        /**
         * Decrement the counter and draw the page in the canvas
         *
         * @see #drawPage
         */
        ComicBook.prototype.drawPrevPage = function () {

            var page;

            try {
                page = self.getPage(options.currentPage - 1);
            } catch (e) {
            }

            if (!page) {
                return false;
            }

            is_double_page_spread = (page.width > page.height); // need to run double page check again here as we are going backwards

            if (options.currentPage > 0) {
                options.currentPage -= (options.displayMode === 'single' || is_double_page_spread) ? 1 : 2;
                self.drawPage();
            }

            // make sure the top of the page is in view
            window.scroll(0, 0);
        };

        /* default settings */

        ComicBook.prototype.thumbnails = function() {
            if ($(this).is(':checked')) {
                options.thumbnails = true;
                document.getElementById('thumbnail-width').disabled = false;
            } else {
                options.thumbnails = false;
                document.getElementById('thumbnail-width').disabled = true;
            }

            options.session.setDefault("thumbnails", options.thumbnails);
        };

        ComicBook.prototype.thumbnailWidth = function() {
            options.thumbnailWidth = $(this).val();
            options.session.setDefault("thumbnailWidth", options.thumbnailWidth);
        };

        ComicBook.prototype.sidebarWide = function (wide) {
            if (typeof(wide) !== "boolean") {
                wide = ($(this).is(':checked') === true);
            }

            if (wide) {
                options.sidebarWide = true;
                document.getElementById('sidebar').classList.add('wide');
            } else {
                options.sidebarWide = false;
                document.getElementById('sidebar').classList.remove('wide');
                self.sidebarWidth(0);
            }

            options.session.setDefault("sidebarWide", options.sidebarWide);
        };

        ComicBook.prototype.sidebarWidth = function(width) {
            if (typeof(width) !== "number") {
                width = $(this).val();
            }
            options.sidebarWidth = width;

            // width === 0 is interpreted as 'use value from CSS'
            if (options.sidebarWidth > 0) {
                document.getElementById('sidebar').style.width = options.sidebarWidth + "%";
            } else {
                document.getElementById('sidebar').style.width = "";
            }

            options.session.setDefault("sidebarWidth", options.sidebarWidth);
        };

        ComicBook.prototype.resetSidebar = function () {
            self.sidebarWide(false);
            self.sidebarWidth(0);
        };

        /* book-specific settings */

        ComicBook.prototype.brightness = function () {
            var $brightness = {
                brightness: $('#brightness').val(),
                contrast: $('#contrast').val()
            };

            self.enhance.brightness($brightness);
            options.enhance.brightness = $brightness;
            options.session.setPreference("enhance",options.enhance);
        };

        ComicBook.prototype.sharpen = function () {
            options.enhance.sharpen = $(this).val();
            self.enhance.sharpen({
                strength: options.enhance.sharpen
            });

            options.session.setPreference("enhance",options.enhance);
        };

        ComicBook.prototype.desaturate = function () {
            if ($(this).is(':checked')) {
                options.enhance.desaturate = {};
                self.enhance.desaturate();
            } else {
                delete options.enhance.desaturate;
                self.enhance.resaturate();
            }

            options.session.setPreference("enhance",options.enhance);
        };

        ComicBook.prototype.removenoise = function () {
            if ($(this).is(':checked')) {
                options.enhance.removenoise = {};
                self.enhance.removenoise();
            } else {
                delete options.enhance.removenoise;
                self.enhance.unremovenoise();
            }

            options.session.setPreference("enhance",options.enhance);
        };

        ComicBook.prototype.resetEnhancements = function () {
            self.enhance.reset();
            options.session.setPreference("enhance",options.enhance);
        };

        /**
         * Apply image enhancements to the canvas.
         */
        ComicBook.prototype.enhance = {

            /**
             * Reset enhancements.
             * This can reset a specific enhancement if the method name is passed, or
             * it will reset all.
             *
             * @param method {string} the specific enhancement to reset
             */
            reset: function (method) {
                if (!method) {
                    options.enhance = {};
                } else {
                    delete options.enhance[method];
                }
                self.drawPage(null, false);
            },

            /**
             * Pixastic progress callback
             * @param  {float} progress
             */
            // progress: function (progress) {
            progress: function () {
                // console.info(Math.floor(progress * 100));
            },

            /**
             * Pixastic on complete callback
             */
            done: function () {

            },

            /**
             * Adjust brightness / contrast
             *
             * params
             *    brightness (int) -150 to 150
             *    contrast: (float) -1 to infinity
             *
             * @param {Object} params Brightness & contrast levels
             * @param {Boolean} reset Reset before applying more enhancements?
             */
            brightness: function (params, reset) {

                if (reset !== false) {
                    this.reset('brightness');
                }

                // merge user options with defaults
                var opts = merge({
                    brightness: 0,
                    contrast: 0
                }, params);

                options.enhance.brightness = opts;

                // run the enhancement
                self.pixastic.brightness({
                    brightness: opts.brightness,
                    contrast: opts.contrast
                }).done(this.done, this.progress);
            },

            /**
             * Force black and white
             */
            desaturate: function () {
                options.enhance.desaturate = {};
                self.pixastic.desaturate().done(this.done, this.progress);
            },

            /**
             * Undo desaturate
             */
            resaturate: function () {
                delete options.enhance.desaturate;
                self.drawPage(null, false);
            },

            /**
             * Sharpen
             *
             * options:
             *   strength: number (-1 to infinity)
             *
             * @param {Object} options
             */
            sharpen: function (params) {

                this.desharpen();

                var opts = merge({
                    strength: 0
                }, params);

                options.enhance.sharpen = opts;

                self.pixastic.sharpen3x3({
                    strength: opts.strength
                }).done(this.done, this.progress);
            },

            desharpen: function () {
                delete options.enhance.sharpen;
                self.drawPage(null, false);
            },

            /**
             * Remove noise
             */
            removenoise: function () {
                options.enhance.removenoise = {};
                self.pixastic.removenoise().done(this.done, this.progress);
            },

            unremovenoise: function () {
                delete options.enhance.removenoise;
                self.drawPage(null, false);
            }
        };

        ComicBook.prototype.navigation = function (e) {

            // disable navigation when the overlay is showing
            if ($('#cbr-loading-overlay').is(':visible')) {
                return false;
            }

            var side = false, page_no = false;

            switch (e.type) {

                case 'click':
                    side = e.currentTarget.getAttribute('data-navigate-side');
                    break;

                case 'keydown':

                    // console.log("keydown: " + e.keyCode);

                    switch (options.keyboard[e.keyCode]) {
                        case 'previous':
                            side = 'left';
                            break;
                        case 'next':
                            side = 'right';
                            break;
                        case 'first':
                            page_no = 1;
                            break;
                        case 'last':
                            page_no = srcs.length - 1;
                            break;
                        case 'sidebar':
                            self.toggleSidebar();
                            break;
                        case 'toolbar':
                            self.toggleToolbar();
                            break;
                        case 'toggleLayout':
                            self.toggleLayout();
                            break;
                        case 'toggleFullscreen':
                            self.toggleFullscreen();
                            break;
                        case 'closeSidebar':
                            self.closeSidebar();
                            break;
                        default:
                            /*
                                throw ComicBookException.INVALID_NAVIGATION_EVENT + ' ' + e.type;
                            */
                    }
                    break;

                default:
                    throw ComicBookException.INVALID_NAVIGATION_EVENT + ' ' + e.type;
            }

            if (side) {

                e.stopPropagation();

                // western style (left to right)
                if (!options.manga) {
                    if (side === 'left') {
                        self.drawPrevPage();
                    }
                    if (side === 'right') {
                        self.drawNextPage();
                    }
                }
                // manga style (right to left)
                else {
                    if (side === 'left') {
                        self.drawNextPage();
                    }
                    if (side === 'right') {
                        self.drawPrevPage();
                    }
                }

                return false;
            }

            if (page_no) {
                self.drawPage(page_no, true);
                return false;
            }
        };

        ComicBook.prototype.toggleReadingMode = function () {
            options.manga = !options.manga;
            self.getControl('toolbar')
                .find('.manga-' + options.manga).show().end()
                .find('.manga-' + !options.manga).hide();
            options.session.setPreference("manga",options.manga);
        };

        ComicBook.prototype.toggleToolbar = function () {
            self.toggleControl('toolbar');
        };

        ComicBook.prototype.openSidebar = function () {
            $('.sidebar').addClass('open');
            $('.toolbar').addClass('open');
            self.showControl('busyOverlay');
            self.scrollToc();
        };

        ComicBook.prototype.closeSidebar = function () {
            $('.sidebar').removeClass('open');
            $('.toolbar').removeClass('open');
            self.toggleToolbar();
            self.hideControl('busyOverlay');
        };

        ComicBook.prototype.toggleSidebar = function () {
            $('.sidebar').hasClass('open')
                ? self.closeSidebar()
                : self.openSidebar();
        };

        ComicBook.prototype.toggleFullscreen = function () {
            options.fullscreen = !options.fullscreen;
            self.getControl('toolbar')
                .find('.fullscreen-' + options.fullscreen).show().end()
                .find('.fullscreen-' + !options.fullscreen).hide();
            if (options.fullscreen) {
                screenfull.request($('#container')[0]);
            } else {
                screenfull.exit($('#container')[0]);
            }
        };


        /*
         * Scroll TOC to page (default: current page)
         */
        ComicBook.prototype.scrollToc = function (page) {
            if (page === undefined) {
                page = options.currentPage;
            }

            document.getElementById('toc').parentNode.scrollTop =
                document.getElementById('page-' + String(page + 1)).offsetTop
                - Math.floor($('.panels').height() * 1.5);
        };

        ComicBook.prototype.showToc = function () {
            self.getControl('sidebar')
                .find('.open').removeClass('open').end()
                .find('.toc-view').addClass('open');
            if (!options.thumbnails) {
                $('#toc-populate').addClass('open');
            }
        };

        ComicBook.prototype.showBookSettings = function () {
            self.getControl('sidebar')
                .find('.open').removeClass('open').end()
                .find('.book-settings-view').addClass('open');
        };

        ComicBook.prototype.showSettings = function () {
            self.getControl('sidebar')
                .find('.open').removeClass('open').end()
                .find('.settings-view').addClass('open');
        };

        ComicBook.prototype.destroy = function () {

            $.each(this.controls, function (name, $control) {
                $control.remove();
            });

            canvas.width = 0;
            canvas.height = 0;

            window.removeEventListener('keydown', this.navigation, false);
            window.removeEventListener('hashchange', checkHash, false);

            setHash('');

            // $(this).trigger('destroy');
        };

    }

    return ComicBook;

})(jQuery);

(function(root, $) {

        var previousReader = root.cbReader || {};

        var cbReader = root.cbReader = function(path, options) {
                return new CBRJS.Reader(path, options);
        };

        //exports to multiple environments
        if (typeof define === 'function' && define.amd) {
                //AMD
                define(function(){ return Reader; });
        } else if (typeof module != "undefined" && module.exports) {
                //Node
                module.exports = cbReader;
        }

})(window, jQuery);
