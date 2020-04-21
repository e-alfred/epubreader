PDFJS.reader.TocController = function() {

    var reader = this,
	    book = this.book,
        settings = reader.settings,
        toc = document.getElementById("toc"),
        tovView = document.getElementById("tocView"),
        $toc_populate = $("#toc_populate"),
        timeout;

    var isVisible = function (element) {

		var viewport = element.getBoundingClientRect(),
			visible,
            offset = settings.preloadOffset;

		visible = (
			viewport.top  >= (0 - offset)
				&& viewport.left >= (0 - offset)
				&& viewport.right < (window.innerWidth + offset)
				&& viewport.bottom < (window.innerHeight + offset)
		);

        return visible;
	};

	var lazyLoad = function () {

		var elements = toc.querySelectorAll('img[data-pagenum]'),
			pagenum,
            count;

		for (var i = 0; i < elements.length; i++) {
			if (isVisible(elements[i])) {
				pagenum = elements[i].getAttribute("data-pagenum");
				elements[i].removeAttribute("data-pagenum");
				reader.getThumb(parseInt(pagenum), true);
                count++;
			}
		}

        if (!elements.length || count === elements.length ) {
            removeLazyLoader(tocView);
        }
	};

    var lazyLoader = function () {
        timeout = setTimeout( function () {
            lazyLoad();
        }, settings.lazyDelay);
    };

    var addLazyLoader = function (_element) {

        var element = _element || window;

        element.addEventListener("scroll", lazyLoader, false);
        element.addEventListener("load", lazyLoader, false);
    };

    var removeLazyLoader = function (_element) {

        var element = _element || window;

        element.removeEventListener("scroll", lazyLoader);
        element.removeEventListener("load", lazyLoader);
    };

    var tocCreate = function (no_pages, width, height, populate) {
        
        var canvas = document.createElement("canvas"),
            ctx = canvas.getContext("2d"),
            aspect,
            imgsrc,
            preloadcount,
            scale,
            timeout;

        aspect = parseFloat(width / height);

        // create small placeholder image
        canvas.width = 10;
        canvas.height = parseInt(canvas.width / aspect);

        placeholder_width = reader.settings.thumbnailWidth;
        placeholder_height = parseInt(reader.settings.thumbnailWidth / aspect);

        // fill with transparent black, style in CSS
        ctx.fillStyle = "rgba(0, 0, 0, 0)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        imgsrc = canvas.toDataURL();

        for(var i = 0; i < no_pages; i++) {
            var item = document.createElement('li'),
                placeholder = new Image(),
                label = document.createElement('span'),
                page_label = reader.pageLabels[i + 1];

            item.setAttribute("id", "page_" + parseInt(i + 1));
            placeholder.src = imgsrc;
            placeholder.style.width = reader.settings.thumbnailWidth;
            placeholder.style.height = parseInt(reader.settings.thumbnailWidth / aspect);
            placeholder.classList.add("placeholder");
            label.innerHTML = page_label || (i + 1).toString();
            label.classList.add("page_label");
            //label.style.left = width;
            item.appendChild(placeholder);
            item.appendChild(label);
            toc.appendChild(item);
            if (populate) {
                reader.getThumb(i + 1, true);
            } else {
                placeholder.setAttribute("data-pagenum", parseInt(i + 1));
            }
        }

        if (!populate) {

            // preload first screenfull of thumbnails
            scale = parseFloat(settings.thumbnailWidth / width);
            preloadcount = parseInt(window.innerHeight / placeholder_height) + 2;
            if (preloadcount > settings.numPages)
                preloadcount = settings.numPages;

            var _timeout = setTimeout(function () {
                for (var i = 1; i <= preloadcount; i++) {
                    reader.getThumb(i, true);
                }
            }, settings.initialLazyDelay);
        }
    };

    var tocInsert = function (image, page, replace) {
        var placeholder = toc.children[page - 1].firstChild;
        if (replace === true) {
            placeholder.parentNode.replaceChild(image, placeholder);
        }

        toc.children[page - 1].addEventListener('click', function (e) {
            reader.queuePage(page);
        });
    };

    var tocPopulate = function () {
        var i = 0;
        while (i < reader.settings.numPages) {
            reader.getThumb(i, true);
            i++;
        }

        reader.thumbnails = true;
        $toc_populate.addClass("hide");
		remove_lazy_loader();
    };

    if (!settings.thumbnails) {
        addLazyLoader(tocView);
    }

    reader.book.getPage(1).then(function(page) {
        var width,
            height,
            viewport,
            page_rotation,
            rotation;

        page_rotation = page.rotate;
        rotation = (page_rotation + reader.settings.rotation) % 360;

        viewport = page.getViewport(1, rotation);

        width = viewport.width;
        height = viewport.height;

        tocCreate(settings.numPages, width, height, settings.thumbnails);
    });

	var onShow = function() {
        tocView.classList.add('open');
        scrollToPage(settings.currentPage);
	};

	var onHide = function() {
        tocView.classList.remove('open');
	};

    var scrollToPage = function (pageNum) {
        if (pageNum > 0 && pageNum <= settings.numPages) {
            thumb = document.getElementById("page_" + pageNum);
            if (thumb)
                thumb.scrollIntoView();
        }
    };

	return {
		"show" : onShow,
		"hide" : onHide,
        "tocInsert": tocInsert,
        "totPopulate": tocPopulate,
        "scrollToPage": scrollToPage
	};
};
