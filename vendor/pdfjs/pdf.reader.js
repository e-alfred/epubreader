PDFJS.reader = {};
PDFJS.reader.plugins = {};

PDFJS.TextLayerBuilder = {};

(function(root, $) {

    var previousReader = root.pdfReader || {};

    var pdfReader = root.pdfReader = function(path, options) {
        return new PDFJS.Reader(path, options);
    };

})(window, jQuery);

PDFJS.Reader = function(bookPath, _options) {

    var reader = this,
        book,
        loader,
        $viewer = $("#viewer"),
        search = window.location.search;

    var TEXT_RENDER_DELAY = 200,    // ms
        PAGE_RENDER_DELAY = 200,    // ms
        LAZY_DELAY = 200,           // ms
        INITIAL_LAZY_DELAY = 2000,  // ms
        PRELOAD_OFFSET = 500,       // px
        THUMBNAIL_WIDTH = 200,      // px
        MAX_CANVAS_PIXELS = 5242880,
        CSS_UNITS = 96.0 / 72.0,
        MIN_SCALE = 0.25,
        MAX_SCALE = 10.0,
        DEFAULT_SCALE = 1;

    this.settings = this.defaults(_options || {}, {
        bookPath: bookPath,
        textRenderDelay: TEXT_RENDER_DELAY,
        pageRenderDelay: PAGE_RENDER_DELAY,
        preloadTextcontent: true,   // true || false, preload text content to speed up first full-text search operation
        canvasLimit: 0,
        cssZoomOnly: false, // true || false, only zoom using CSS, render document at 100% size
        textSelect: true,   // true || false, add selectable text layer
        annotationLayer: true,  // true || false. show PDF annotations
        mergeAnnotations: false,// true || false, merge PDF annotations into bookmarks/annotations
        doubleBuffer: true, // true || false, draw to off-screen canvas
        cacheNext: true,    // true || false, pre-render next page (by creathing thumbnail))
        scrollToTop: false, // true || false, scroll to top of page on page turn
        numPages: 0,
        currentPage: 1,
        scale: DEFAULT_SCALE,
        oddPageRight: true, // when true, odd pages render on the right side
        zoomLevel: window.outerWidth > window.outerHeight ? "spread" : "fit_page",  // spread, fit_page, fit_width, percentage
        rotation: 0,    // 0 || 90 || 180 || 270 
        thumbnails: false,  // true || false, show thumbnails (visual index)
        thumbnailWidth: THUMBNAIL_WIDTH,
        lazyDelay: LAZY_DELAY,     // ms, delay before lazyloader loads image
        initialLazyDelay: INITIAL_LAZY_DELAY,  // ms, delay before preloading images for lazyloader
        preloadOffset: PRELOAD_OFFSET,  // px, preload thumbs when they are within this distance from viewport
        history: true,
        keyboard: {
            32: 'next',         // space
            34: 'next',         // page-down
            39: 'next',         // cursor-right
            33: 'previous',     // page-up
            37: 'previous',     // cursor-left
            36: 'first',        // home
            35: 'last',         // end
            65: 'annotate',     // a
            66: 'bookmark',     // b
            76: 'rotateLeft',   // l
            82: 'rotateRight',  // r
            90: 'cycleZoom',    // z
            83: 'toggleSidebar',// s
            84: 'toggleTitlebar',   // t
            68: 'toggleDay',    // d
            78: 'toggleNight',  // n
            55: 'search',       // '/'
            80: 'previousMatch',  // p
            70: 'toggleFullscreen', // f
            27: 'closeSidebar', // esc
           114: 'nextMatch'     // F3 
        },
        nightMode: false,
        dayMode: false,
        pageArrows: false,
        annotations: {},
        customStyles: {},
        activeStyles: {},
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
    });

    // event bus service
    var eventBus = new PDFJS.Reader.EventBus();
    this.eventBus = eventBus;

    // link service
    var linkService = new PDFJS.Reader.LinkService( { eventBus: this.eventBus }, reader);
    this.linkService  = linkService;

    // used for annotations and bookmarks
    this.Annotation = function (type, anchor, body, id) {
        this.id = id || PDFJS.core.uuid();
        this.type = type;
        this.date = Date.now();
        this.readonly = true;
        this.edited = this.date;
        this.anchor = anchor;
        this.body = body;
    };

    // used for UI and book styles
    this.Style = function (name, selector, rules, extra) {
        this.name = name;
        this.selector = selector;
        this.rules = rules;
        this.extra = extra || null;
    };

    // resource list for single-page and 2-page display
    this.resourcelst = [
        {
            canvas: document.getElementById("left"),
            ctx: document.getElementById("left").getContext('2d'),
            textdiv: document.getElementById("text_left"),
            annotationdiv: document.getElementById("annotations_left"),
            textLayer: null,
            annotationLayer: null,
            renderTask: null,
            oscanvas: null,
            osctx: null,
            pageNum: null
        },
        {
            canvas: document.getElementById("right"),
            ctx: document.getElementById("right").getContext('2d'),
            textdiv: document.getElementById("text_right"),
            annotationdiv: document.getElementById("annotations_right"),
            textLayer: null,
            annotationLayer: null,
            renderTask: null,
            oscanvas: null,
            osctx: null,
            pageNum: null
        }
    ];

    // list of pages in the render queue which should be discarded
    this.cancelPage = {};

    this.renderQueue = false;

    // used for search, textlayer, hightlight etc
    this.pageContents = [];
    this.pageMatches = [];
    this.pageMatchesLength = null;
    this.search_state = null;
    this.selected = {
        pageIdx: -1,
        matchIdx: -1,
		at_start: false,
		at_end: false
    };

    // define which zoom states to cycle through in cycleZoom
    this.zoomCycle = {
        'spread':   'fit_page',
        'fit_page': 'fit_width',
        'fit_width':'spread'
    };

    this.thumbs = [];

    this.pageLabels = [];

    this.pageRefs = {};

    // Overide options with search parameters
    if(search) {
        parameters = search.slice(1).split("&");
        parameters.forEach(function(p){
            var split = p.split("=");
            var name = split[0];
            var value = split[1] || '';
            reader.settings[name] = decodeURIComponent(value);
        });
    }


    this.restoreDefaults(this.settings.session.defaults);
    this.restorePreferences(this.settings.session.preferences);
    this.restoreAnnotations(this.settings.session.annotations);
    this.sideBarOpen = false;
    this.viewerResized = false;
	this.pageNumPending = null;
    this.output_scaled = false;
    this.restricted_scaling = false;
    this.CSS_UNITS = CSS_UNITS;
    this.MIN_SCALE = MIN_SCALE;
    this.MAX_SCALE = MAX_SCALE;

    reader.ProgressController = PDFJS.reader.ProgressController.call(reader);

    loadingTask = PDFJS.getDocument(reader.settings.bookPath);

    reader.ProgressController.show();
    reader.ProgressController.setMessage("Loading " + reader.settings.session.title, "download", "active");

    loadingTask.onProgress = function getDocumentProgress(progress) {
        reader.ProgressController.setProgress(progress);
    };

	loadingTask.then(

		function(_book) {
			reader.book = book = _book;
			reader.settings.numPages = reader.book.numPages;
			document.getElementById('total_pages').textContent = reader.settings.numPages;
			if(!$.isEmptyObject(reader.settings.session.cursor)
                && (reader.settings.session.cursor.value !== null)
                && (reader.settings.session.cursor.value > 0)
                && (reader.settings.session.cursor.value <= reader.settings.numPages)) {
				reader.settings.currentPage = parseInt(reader.settings.session.cursor.value);
			}

			var firstPagePromise = book.getPage(1);
			reader.firstPagePromise = firstPagePromise;

			reader.linkService.setDocument(book, location.href.split('#')[0]);

			// set labels
			reader.book.getPageLabels().then(function (labels) {
				if (labels) {
					for (var i = 0; i < labels.length; i++) {
						if (labels[i] !== (i + 1).toString()) {
							reader.pageLabels[i + 1] = labels[i];
						}
					}
				}
			});

			reader.ReaderController = PDFJS.reader.ReaderController.call(reader, book);
			reader.SettingsController = PDFJS.reader.SettingsController.call(reader, book);
			reader.ControlsController = PDFJS.reader.ControlsController.call(reader, book);
			reader.SidebarController = PDFJS.reader.SidebarController.call(reader, book);
			reader.StyleController = PDFJS.reader.StylesController.call(reader, book);

			reader.queuePage(reader.settings.currentPage);
			reader.ReaderController.hideLoader();
			reader.ProgressController.hide();

			reader.book.getOutline().then(function (outline) {
				reader.OutlineController = PDFJS.reader.OutlineController.call(reader, outline);
			}); 
			reader.book.getMetadata().then(function (metadata) {
				reader.settings.pdfMetadata = metadata;
			});
			reader.book.getAttachments().then(function (attachments) {
				// console.log("attachments", attachments);
			});

			reader.book.getStats().then(function (stats) {
				// console.log("stats", stats);
			});

			// BookmarksController depends on NotesController so load NotesController first
			reader.NotesController = PDFJS.reader.NotesController.call(reader, book);
			reader.BookmarksController = PDFJS.reader.BookmarksController.call(reader, book);

            if (reader.settings.mergeAnnotations) {
                reader.firstPagePromise.then(function() {
                    var numPages = reader.settings.numPages;

                    function extractAnnotations(pageIndex) {
                        reader.book.getPage(pageIndex).then(function(page) {
                            page.getAnnotations().then(function(annotations) {
                                if (annotations.length > 0) {
                                    for (var annotation in annotations) {
                                        if (annotations.hasOwnProperty(annotation) && !annotations[annotation].parentId) {
                                            var ann = annotations[annotation],
                                                //type = (ann.contents && ann.contents !== "") ? "annotation" : "bookmark",
                                                type = "annotation",
                                                item;

                                            item = new reader.Annotation(
                                                type,
                                                pageIndex,
                                                ann.contents,
                                                ann.id || PDFJS.core.uuid()
                                            );

											item.body = ann.subtype.toString() + ":" + ann.id.toString();

                                            reader.NotesController.addItem(item);
                                        }
                                    }
                                }
                            });

                            if ((pageIndex + 1) <= reader.settings.numPages) {
                                extractAnnotations(pageIndex + 1);
                            }
                        });
                    }
                    extractAnnotations(1);
                });
            }

		reader.SearchController = PDFJS.reader.SearchController.call(reader, book);
		//reader.MetaController = PDFJS.reader.MetaController.call(reader, meta);
		reader.TocController = PDFJS.reader.TocController.call(reader, book);
	},
		function getDocumentError(exception) {
			var message = exception && exception.message;
			var errormsg = "An error occurred while loading the PDF";
			if (exception instanceof PDFJS.InvalidPDFException) {
				errormsg = "Invalid or corrupted PDF file";
			} else if (exception instanceof PDFJS.MissingPDFException) {
				errormsg = "Missing PDF file";
			} else if (exception instanceof PDFJS.UnexpectedResponseException) {
				errormsg = "Unexpected server response";
			}

			console.log("Reader: ", errormsg);
			reader.ProgressController.setMessage(errormsg, "download", "error");
		}
);

	return this;
};


// Annotations - bookmarks and PDF annotations
PDFJS.Reader.prototype.pageToId = function (pageNum) {
    return "page_" + pageNum;
};

PDFJS.Reader.prototype.addAnnotation = function (note) {
    this.settings.annotations[note.id] = note;
    this.settings.session.setBookmark(note.id, note.anchor, note.type, note);
};

PDFJS.Reader.prototype.removeAnnotation = function (id) {
    if (this.settings.annotations[id] !== undefined) {
        var type = this.settings.annotations[id].type;
        this.eventBus.dispatch(type + "removed", {
            source: this,
            id: id
        });
        this.settings.session.deleteBookmark(id);
        delete this.settings.annotations[id];
    }
};

PDFJS.Reader.prototype.updateAnnotation = function (note) {
    note.edited = Date.now();
    this.settings.annotations[note.id] = note;
    this.settings.session.setBookmark(note.id, note.anchor, note.type, note);
};

PDFJS.Reader.prototype.clearAnnotations = function(type) {
    if (type) {
        for (var id in this.settings.annotations) {
            if (this.settings.annotations.hasOwnProperty(id) && this.settings.annotations[id].type === type)
                this.removeAnnotation(id);
        }
    }
};

PDFJS.Reader.prototype.isBookmarked = function (id) {
    return (this.settings.annotations[id] !== undefined);
};

PDFJS.Reader.prototype.addBookmark = function(pageNum) {
    var id = this.pageToId(pageNum);

    var text = " ",
        bookmark;

    // TODO: get text content around bookmark location, needed for annotation editor (not yet implemented)
    for (var i = 0; i <= 1; i++) {
        if (this.resourcelst[i].pageNum == pageNum
            && this.resourcelst[i].textdiv.textContent !== null) {
                text = this.ellipsize(this.resourcelst[i].textdiv.textContent);
            }
    }

    if (this.isBookmarked(id)) {
        bookmark = this.getAnnotation(id);
        this.updateAnnotation(bookmark);
    } else {
        bookmark = new this.Annotation("bookmark", pageNum, text, id);
        bookmark.readonly = false;
        this.addAnnotation(bookmark);
    }

    this.eventBus.dispatch("bookmarkcreated", {
        source: this,
        id: id
    });

    return bookmark;
};

PDFJS.Reader.prototype.updateBookmark = function (bookmark) {
    this.updateAnnotation(bookmark);
};

PDFJS.Reader.prototype.removeBookmark = function (pageNum) {
    var id = this.pageToId(pageNum);
    this.removeAnnotation(id);
};

PDFJS.Reader.prototype.clearBookmarks = function () {
    this.clearAnnotations("bookmark");
};

PDFJS.Reader.prototype.getAnnotation = function (id) {
    return this.settings.annotations[id];
};

PDFJS.Reader.prototype.restoreAnnotations = function (annotations) {
    if (annotations !== {}) {
        for (var note in this.settings.session.annotations) {
            if (annotations.hasOwnProperty(note) && annotations[note].content !== null) {
                this.settings.annotations[annotations[note].name] = annotations[note].content;
            }
        }
    }
};

// Render thumbnail, page, etc.

PDFJS.Reader.prototype.getThumb = function (pageNum, insert) {

    var reader = this,
        thumb,
        scale,
        initial_viewport,
        viewport,
        canvas,
        ctx,
        page_aspect,
        page_width,
        page_height,
        page_rotation,
        rotation,
        outputscale,
        transform,
        renderContext,
        renderTask;

    if (pageNum > 0 &&
		pageNum <= reader.settings.numPages &&
		reader.thumbs[pageNum] === undefined) {

        reader.thumbs[pageNum] = true;

        reader.book.getPage(parseInt(pageNum)).then(function(page) {
            page_rotation = page.rotate;
            rotation = (page_rotation + reader.settings.rotation) % 360;
            initial_viewport = page.getViewport(1, rotation);
            canvas = document.createElement("canvas");
            ctx = canvas.getContext("2d");
            outputscale = reader.getOutputScale(ctx);
            if (outputscale < 1)
                outputscale = 1;    // ignore browser zoom
            page_width = initial_viewport.width;
            page_height = initial_viewport.height;
            page_aspect = parseFloat(page_width / page_height);
            scale = parseFloat(reader.settings.thumbnailWidth / page_width);
            canvas.width = parseInt(reader.settings.thumbnailWidth * outputscale);
            canvas.height = parseInt(canvas.width / page_aspect);

            viewport = initial_viewport.clone({scale: scale, rotation: rotation});

            //ctx.scale(outputscale, outputscale);
            transform = (outputscale === 1)
                ? null
                : [outputscale, 0, 0, outputscale, 0, 0];

            renderContext = {
                canvasContext: ctx,
                viewport: viewport,
                transform: transform
            };

            renderTask = page.render(renderContext);

            renderTask.promise.then(
                function pdfPageRenderCallback () {
                    thumb = new Image();
                    thumb.id = "thumb_" + pageNum;
                    thumb.className = "thumbnail";
                    thumb.src = canvas.toDataURL();
                    canvas.width = canvas.height = 0;
                    delete canvas;
                    if (insert) {
                        reader.TocController.tocInsert(thumb, pageNum, true);
                    } else {
                        reader.thumbs[pageNum] = thumb;
                    }
                },
                function pdfPageRenderError (error) {
                    console.log("pdfPageRenderError in getThumb: " + error);
                }
            );
        });
    }
};

PDFJS.Reader.prototype.setZoom = function(zoom) {
    
    var reader = this,
        page = reader.settings.currentPage;

    reader.settings.zoomLevel = zoom;
    reader.ControlsController.setZoomIcon(zoom);
    reader.queuePage(page);
};

PDFJS.Reader.prototype.cycleZoom = function() {

    var reader = this,
        zoom = reader.settings.zoomLevel,
        nextzoom,
        page = reader.settings.currentPage;

    nextzoom = reader.zoomCycle[zoom];

    if (nextzoom !== undefined) {
        reader.setZoom(nextzoom);
    }
};

PDFJS.Reader.prototype.setRotation = function (rotation) {

    var reader = this,
        page = reader.settings.currentPage;

    if (rotation % 90 === 0) {
        reader.settings.rotation = rotation;
        reader.ControlsController.setRotateIcon(rotation);
        reader.queuePage(page);
    }
};

PDFJS.Reader.prototype.cancelRender = function (index) {

    var reader = this,
        resourcelst = reader.resourcelst[index];

    if (resourcelst.renderTask) {
        resourcelst.renderTask.cancel();
        resourcelst.renderTask = resourcelst.pageNum = null;
        resourcelst.oscanvas = resourcelst.osctx = null;
    }

    if (resourcelst.textLayer) {
        resourcelst.textLayer.cancel();
        resourcelst.textLayer = null;
    }

    if (resourcelst.annotationLayer) {
        resourcelst.annotationLayer = null;
    }
};

PDFJS.Reader.prototype.renderPage = function(pageNum) {

    var reader = this,
        $viewer = $("#viewer");

    var index,
    	canvas,     // actual canvas
    	ctx,        // actual context
        oscanvas,   // off-screen canvas
        osctx,      // off-screen context
        textdiv,
        annotationdiv,
        textLayer,
		outputscale,
        max_view_width,
        max_view_height,
        page_width,
        page_height,
        scale_width, 
        scale_height,
        view_aspect,
        document_aspect,
        scale,
        page_rotation,
        rotation,
        initial_viewport,
        viewport,
        zoom,
        fraction,
        offset,
        renderContext,
        renderTask,
        resourcelst,
        swap_orientation,
        double_buffer,
        cache_next,
        scroll_to_top,
        pageShift;

    max_view_width = window.innerWidth;
    max_view_height = window.innerHeight;

    if (this.settings.zoomLevel === "spread") {

        // show second canvas and textlayer
        reader.resourcelst[1].canvas.style.display = "block";
        reader.resourcelst[1].textdiv.style.display = "block";
        max_view_width /= 2;
        // select canvas and ctx based on pageNum, pageShift and oddPageRight
        pageShift = 2;
        oddPageShift = reader.settings.oddPageRight ? 0 : 1;
        index = (pageNum - oddPageShift) % pageShift;

    } else {

        index = 0;
        pageShift = 1;
        // hide second canvas
        reader.resourcelst[1].canvas.style.display = "none";
        // hide second text layer
        reader.resourcelst[1].textdiv.style.display = "none";
        // clear text layer
        reader.resourcelst[1].textdiv.innerHTML = "";
        // clear annotation layer
        reader.resourcelst[1].annotationdiv.innerHTML = "";
        // clear page number
        reader.resourcelst[1].pageNum = null;

        // don't try to render non-existing page 0 (which is used
        // to indicate the empty left page when oddPageRight === true)
        if (pageNum === 0)
            pageNum++;

    }

    resourcelst = reader.resourcelst[index];

    canvas = resourcelst.canvas;
    ctx = resourcelst.ctx;
    textdiv = resourcelst.textdiv;
    annotationdiv = resourcelst.annotationdiv;
    outputscale = reader.getOutputScale(resourcelst.ctx);
    fraction = reader.approximateFraction(outputscale);
    double_buffer = reader.settings.doubleBuffer;
    cache_next = reader.settings.cacheNext;
    scroll_to_top = reader.settings.scrollToTop;

    textdiv.innerHTML = "";
    annotationdiv.innerHTML = "";

    if (pageNum <= this.settings.numPages && pageNum >= 1) {

        if (resourcelst.renderTask) {
            resourcelst.renderTask.cancel();
            resourcelst.renderTask = null;
        }

        if (resourcelst.textLayer) {
            resourcelst.textLayer.cancel();
            resourcelst.textLayer = null;
        }

        if (resourcelst.annotationLayer) {
            //resourcelst.annotationLayer.hide();
            resourcelst.annotationLayer = null;
        }

        resourcelst.pageNum = pageNum;

        if (reader.cancelPage[pageNum])
            delete reader.cancelPage[pageNum];

        this.book.getPage(pageNum).then(function(page) {
            page.getAnnotations().then(function (annotations) {
                console.log("annotations", annotations);
            });
            page_rotation = page.rotate;
            rotation = (page_rotation + reader.settings.rotation) % 360;
            initial_viewport = page.getViewport(1, rotation);
            page_width = initial_viewport.width;
            page_height = initial_viewport.height;

            document_aspect = parseFloat(page_width / page_height);
            view_aspect = parseFloat(max_view_width / max_view_height);
            
            scale_height = parseFloat(max_view_height / page_height);
            scale_width = parseFloat(max_view_width / page_width);

            switch (reader.settings.zoomLevel) {

                case "spread":

                    // INTENTIONAL FALL-THROUGH

                case "fit_page":

                    $viewer.addClass("flex");

                    if (scale_width > scale_height) {
                        scale = scale_height;
                        canvas.height = reader.roundToDivide(max_view_height * outputscale, fraction[0]);
                        canvas.width = reader.roundToDivide(parseInt(canvas.height * document_aspect), fraction[0]);
                    } else {
                        scale = scale_width;
                        canvas.width = reader.roundToDivide(max_view_width * outputscale, fraction[0]);
                        canvas.height = reader.roundToDivide(parseInt(canvas.width / document_aspect), fraction[0]);
                    }

                    break;

                case "fit_width":

                    $viewer.removeClass("flex");

                    if (scale_width < scale_height) {
                        scale = scale_height;
                        canvas.height = reader.roundToDivide(max_view_height * outputscale, fraction[0]);
                        canvas.width = reader.roundToDivide(parseInt(canvas.height * document_aspect), fraction[0]);
                    } else {
                        scale = scale_width;
                        canvas.width = reader.roundToDivide(max_view_width * outputscale, fraction[0]);
                        canvas.height = reader.roundToDivide(parseInt(canvas.width / document_aspect), fraction[0]);
                    }

                    break;

                default:

                    $viewer.removeClass("flex");
                    scale = parseFloat(reader.settings.zoomLevel * reader.CSS_UNITS);
                    canvas.width = reader.roundToDivide(parseInt(page_width * scale * outputscale), fraction[0]);
                    canvas.height = reader.roundToDivide(parseInt(page_height * scale * outputscale), fraction[0]);
                    break;
            }

            viewport = initial_viewport.clone({scale: scale, rotation: rotation});

            if (reader.settings.cssZoomOnly) {
                var actualSizeViewport = viewport.clone({scale: 1});
                canvas.width = actualSizeViewport.width;
                canvas.height = actualSizeViewport.height;
                outputscale = actualSizeViewport.width / viewport.width;
                reader.output_scaled = true;
            } 

            if (reader.settings.canvasLimit > 0) {
                var pixelsInViewport = viewport.width * viewport.height;
                var maxscale =
                    Math.sqrt(reader.settings.canvasLimit / pixelsInViewport);
                if (outputscale > maxscale) {
                    outputscale = maxscale;
                    reader.output_scaled = true;
                    reader.restricted_scaling = true;
                } else {
                    reader.restricted_scaling = false;
                }
            }

            transform = (outputscale === 1)
                ? null
                : [outputscale, 0, 0, outputscale, 0, 0];


            if (outputscale !== 1) {
                canvas.style.width = reader.roundToDivide(viewport.width, fraction[1]) + 'px';
                canvas.style.height = reader.roundToDivide(viewport.height, fraction[1]) + 'px';
            } else {
                canvas.style.width = "";
                canvas.style.height = "";
            }

            /* textlayer */
            if (reader.settings.textSelect) {
                textdiv.style.width = reader.roundToDivide(viewport.width, fraction[1]) + 'px';
                textdiv.style.height = 0;
                offset = $(canvas).offset();
                $(textdiv).offset({
                    top: offset.top,
                    left: offset.left
                });
                page.getTextContent({ normalizeWhitespace: true }).then(function (textContent) {
                    resourcelst.textLayer = textLayer = new PDFJS.Reader.TextLayerController({
						textLayerDiv: textdiv,
						pageIndex: pageNum - 1,
						viewport: viewport,
						enhanceTextSelection: true
					}, reader);
                    textLayer.setTextContent(textContent);
                });
            } else {
                resourcelst.textLayer = textLayer = null;
            }
            /* /textLayer */

            /* annotationLayer */
            if (reader.settings.annotationLayer) {
                annotationdiv.style.width = reader.roundToDivide(viewport.width, fraction[1]) + 'px';
                annotationdiv.style.height = 0;
                offset = $(canvas).offset();
                $(annotationdiv).offset({
                    top: offset.top,
                    left: offset.left
                });
                resourcelst.annotationLayer = new PDFJS.Reader.AnnotationLayerController({
                    annotationDiv: annotationdiv,
                    pdfPage: page,
                    renderInteractiveForms: false,
                    linkService: reader.linkService,
                    downloadManager: null
                }, reader);
                resourcelst.annotationLayer.render(viewport, 'display');
            }
            /* /annotationLayer */

            if (double_buffer) {
                resourcelst.oscanvas = oscanvas = document.createElement("canvas");
                resourcelst.osctx = context = osctx = oscanvas.getContext('2d');
                oscanvas.width = canvas.width;
                oscanvas.height = canvas.height;
            } else {
                context = ctx;
            }

            renderContext = {
                canvasContext: context,
                viewport: viewport,
                transform: transform,
                textLayer: textLayer
            };

            resourcelst.renderTask = renderTask = page.render(renderContext);

            renderTask.promise.then(
                function pdfPageRenderCallback (something) {
                    if (reader.cancelPage[pageNum] === undefined) { 
                        if (scroll_to_top)
                            document.getElementById('viewer').scrollTo(0,0);
                        if (double_buffer)
                            ctx.drawImage(oscanvas, 0, 0);
                        if (textLayer)
                            textLayer.render(reader.settings.textRenderDelay);
                        if (cache_next)
                            reader.getThumb(parseInt(pageNum + pageShift), true);
                        reader.eventBus.dispatch("renderer:pagechanged", {
                            source: this,
                            pageNum: pageNum
                        });
                    } 
                },
                function pdfPageRenderError(error) {
                    console.log("pdfPageRenderError: " + error);
                }
            );
        });

    } else {
        // clear canvas (by resizing it), use maximum size
        canvas.width = 0;
        canvas.height = 0;
        canvas.width = reader.roundToDivide(max_view_width * outputscale, fraction[0]);
        canvas.height = reader.roundToDivide(max_view_height * outputscale, fraction[0]);
        if (outputscale !== 1) {
            canvas.style.width = reader.roundToDivide(max_view_width, fraction[1]) + 'px';
            canvas.style.height = reader.roundToDivide(max_view_height, fraction[1]) + 'px';
        }
        // reset pageNum
        resourcelst.pageNum = null;
    }
};

PDFJS.Reader.prototype.queuePage = function(page) {
    
    var reader = this,
        zoom = reader.settings.zoomLevel,
        oddPageRight = reader.settings.oddPageRight,
        pageShift;

    if (page < 1)
        page = 1;
    if (page > this.settings.numPages)
        page = this.settings.numPages;

    if (zoom === "spread") {
        pageShift = 2;
        if (oddPageRight === true) {
            page -= page % 2;
        } else {
            page -= (page + 1) % 2;
        }

    } else {
        pageShift = 1;
    }

    reader.settings.currentPage = page;

    reader.ControlsController.setCurrentPage(page);
    reader.settings.session.setCursor(page);

    if (typeof reader.renderQueue === 'number') {
        window.clearTimeout(reader.renderQueue);
        reader.renderQueue = false;
    }

    reader.renderQueue = window.setTimeout(function queuePages() {
        for (var i = 0; i < pageShift; i++) {
            reader.renderPage(page + i);
        }
    }, reader.settings.pageRenderDelay);
};

PDFJS.Reader.prototype.prevPage = function() {

    var reader = this;

	var pageShift = (this.settings.zoomLevel === "spread") ? 2 : 1;

    var oddPageShift = this.settings.oddPageRight ? 0 : 1;

    if (this.settings.currentPage - pageShift < oddPageShift) {
        return;
    } else {
        for (var i = 0; i < pageShift; i++) {
            reader.cancelPage[this.settings.currentPage - i] = true;
        }
        this.queuePage(this.settings.currentPage - pageShift);
    }
};

PDFJS.Reader.prototype.nextPage = function() {

    var reader = this;

	var pageShift = (this.settings.zoomLevel === "spread") ? 2 : 1;

    if (this.settings.currentPage + pageShift > this.settings.numPages) {
        return;
    } else {
        for (var i = 0; i < pageShift; i++) {
            reader.cancelPage[this.settings.currentPage + i] = true;
        }
        this.queuePage(this.settings.currentPage + pageShift);
    }
};

PDFJS.Reader.prototype.defaults = function (obj) {
  for (var i = 1, length = arguments.length; i < length; i++) {
    var source = arguments[i];
    for (var prop in source) {
      if (obj[prop] === void 0) obj[prop] = source[prop];
    }
  }
  return obj;
};

// Defaults and Preferences
// Preferences are per-book settings and can override defaults
PDFJS.Reader.prototype.restoreDefaults = function (defaults) {
    for (var i=0; i < defaults.length; i++) {
        this.settings[defaults[i].name] = defaults[i].value;
    }
};

PDFJS.Reader.prototype.restorePreferences = function (preferences) {
    for (var i=0; i < preferences.length; i++) {
        this.settings[preferences[i].name] = preferences[i].value;
    }
};

PDFJS.Reader.prototype.setScale = function (scale) {

};

PDFJS.Reader.prototype.getOutputScale = function (ctx) {
	var devicePixelRatio = window.devicePixelRatio || 1,
		backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
			ctx.mozBackingStorePixelRatio ||
			ctx.msBackingStorePixelRatio ||
			ctx.oBackingStorePixelRatio ||
			ctx.backingStorePixelRatio || 1,
  	pixelRatio = devicePixelRatio / backingStoreRatio;

	return pixelRatio;
};

PDFJS.Reader.prototype.roundToDivide = function (x, div) {

    var r = x % div;

    return r === 0
        ? x
        : Math.round(x - r + div);
};


/**
 *  Approximates float number as a fraction using Farey sequence (max order
 *  of 8).
 *  @param {number} x - Positive float number.
 *  @returns {Array} Estimated fraction: the first array item is a numerator,
 *                   the second one is a denominator.
 */
PDFJS.Reader.prototype.approximateFraction = function (x) {

    // Fast paths for int numbers or their inversions.
    if (Math.floor(x) === x) {
        return [x, 1];
    }
    var xinv = 1 / x;
    var limit = 8;
    if (xinv > limit) {
        return [1, limit];
    } else if (Math.floor(xinv) === xinv) {
        return [1, xinv];
    }

    var x_ = x > 1 ? xinv : x;
    // a/b and c/d are neighbours in Farey sequence.
    var a = 0, b = 1, c = 1, d = 1;
    // Limiting search to order 8.
    while (true) {
        // Generating next term in sequence (order of q).
        var p = a + c, q = b + d;
        if (q > limit) {
            break;
        }
        if (x_ <= p / q) {
            c = p; d = q;
        } else {
            a = p; b = q;
        }
    }
    var result;
    // Select closest of the neighbours to x.
    if (x_ - a / b < c / d - x_) {
        result = x_ === x ? [a, b] : [b, a];
    } else {
        result = x_ === x ? [c, d] : [d, c];
    }
    return result;
};

PDFJS.Reader.prototype.isMobile = function () {

    var reader = this;

    var isMobile = (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);

    if (isMobile) {
        reader.isMobile = true;
        reader.canvasLimit = reader.settings.canvasLimit;
    }

    return isMobile;
};

PDFJS.Reader.prototype.getPageLabel = function (page) {

    var reader = this;

    if (reader.pageLabels[parseInt(page)] !== undefined) {
        return reader.pageLabels[parseInt(page)].toString();
    } else {
        return page.toString();
    }
};

PDFJS.Reader.prototype.getPageTextContent = function (pageIndex) {

    var reader = this,
        book = reader.book;

    return book.getPage(pageIndex + 1).then(function (page) {
        return page.getTextContent({
            normalizeWhitespace: true,
        });
    });
};

PDFJS.Reader.prototype.setStyles = function (element, item) {

	var styleStr = "";

	if (item.bold) {
		styleStr += 'font-weight: bold;';
	}

	if (item.italic) {
		styleStr += 'font-style: italic;';
	}

	if (styleStr) {
		element.setAttribute('style', styleStr);
	}
};


PDFJS.Reader.prototype.bindLink = function (element, item) {

	var reader = this,
        linkService = this.linkService,
		destination = item.dest;

	if (item.url) {

		PDFJS.addLinkAttributes (element, {
			url: item.url,
			target: (item.newWindow
				? PDFJS.LinkTarget.BLANK
					: undefined),
		});

		return;
	} else {

		element.href = linkService.getDestinationHash(destination);
		element.onclick = function () {
			if (destination) {
				linkService.navigateTo(destination);
			}

			return false;
		};
	}
};

// https://github.com/mvhenten/ellipsize/blob/master/index.js
PDFJS.Reader.prototype.ellipsize = function(str, max, opts) {

	var defaults = {
		ellipse: '…',
		chars: [' ', '-'],
		max: 140,
		truncate: true
	};

	if (typeof str !== 'string' || str.length === 0) return '';
	if (max === 0) return '';

	opts = opts || {};

	for (var key in defaults) {
		if (opts[key] === null || typeof opts[key] === 'undefined') {
			opts[key] = defaults[key];
		}
	}

	opts.max = max || opts.max;

	var last = 0,
		c = '';

	if (str.length < opts.max) return str;

	for (var i = 0, len = str.length; i < len; i++) {
		c = str.charAt(i);

		if (opts.chars.indexOf(c) !== -1) {
			last = i;
		}

		if (i < opts.max) continue;
		if (last === 0) {
			return !opts.truncate ? '' : str.substring(0, opts.max - 1) + opts.ellipse;
		}

		return str.substring(0, last) + opts.ellipse;
	}

	return str;
};

PDFJS.Reader.prototype.isVisible = function (element) {

	var reader = this,
		viewport = element.getBoundingClientRect(),
		visible;

	visible = (
		viewport.top  >= 0
			&& viewport.left >= 0
			&& viewport.right < window.innerWidth
			&& viewport.bottom < window.innerHeight
	);

	return visible;
};

PDFJS.Reader.prototype.addStyleSheet = function (_id, _parentNode) {
    var id = _id,
        parentNode = _parentNode || document.head,
        style = document.createElement("style");
    // WebKit hack
    style.appendChild(document.createTextNode(""));
    style.setAttribute("id", id);
    parentNode.appendChild(style);
    return style.sheet;
};

PDFJS.Reader.prototype.getStyleSheet = function (id, _parentNode) {
    if (id !== undefined) {
        var parentNode = _parentNode || document.head;
        var style = $(parentNode).find("style#" + id);
        if (style.length) return style[0];
    }
};

PDFJS.Reader.prototype.addCSSRule = function (sheet, selector, rules, index) {
    if (index === undefined) index = 0;
    if("insertRule" in sheet) {
        sheet.insertRule(selector + "{" + rules + "}", index);
    } else if ("addRule" in sheet) {
        sheet.addRule(selector, rules, index);
    }
};

PDFJS.Reader.prototype.addStyle = function (name, selector, rules, extra) {
    if (undefined === this.settings.customStyles[name]) {
        this.settings.customStyles[name] = new this.Style(name, selector, rules, extra);
        this.settings.session.setDefault("customStyles",this.settings.customStyles)
    }
};

PDFJS.Reader.prototype.enableStyle = function (style) {
    var currentMain = this.getStyleSheet(style.name);
    if (currentMain) $(currentMain).remove();
    var rules = "",
        sheetMain = this.addStyleSheet(style.name);
    for (var clause in style.rules) {
        rules += clause + ":" + style.rules[clause] + "!important;";
    }
    this.addCSSRule(sheetMain, (style.selector === "*") ? "#main" : style.selector, rules, 0);
    this.settings.activeStyles[style.name] = true;

    this.settings.session.setDefault("activeStyles", this.settings.activeStyles);
};

PDFJS.Reader.prototype.disableStyle = function (style) {
    var currentMain = this.getStyleSheet(style.name, document.head);
    if (currentMain) $(currentMain).remove();
    if (this.settings.activeStyles[style.name]) {
        delete this.settings.activeStyles[style.name];
        this.settings.session.setDefault("activeStyles", this.settings.activeStyles);
    }
};

PDFJS.Reader.prototype.updateStyle = function (style) {
    this.settings.session.setDefault("customStyles",this.settings.customStyles)
    var current = this.getStyleSheet(style.name);
    if (current) this.enableStyle(style);
};

PDFJS.Reader.prototype.deleteStyle = function (style) {
    this.disableStyle(style);
    delete this.customStyles[style.name];
    this.settings.session.setDefault("customStyles",this.settings.customStyles);
};

PDFJS.Reader.prototype.refreshStyles = function (callback) {
    var activeStyles = this.settings.activeStyles,
        customStyles = this.settings.customStyles;

    for (var style in activeStyles) {
        if (!activeStyles.hasOwnProperty(style)) continue;

        var rules = "",
            sheet = this.addStyleSheet(style);

        for (var clause in customStyles[style].rules) {
            if (!customStyles[style].rules.hasOwnProperty(clause)) continue;
            rules += clause + ":" + customStyles[style].rules[clause] + "!important;";
        }

        this.addCSSRule(sheet, customStyles[style].selector, rules, 0);
    }

    if (callback) callback();
};


