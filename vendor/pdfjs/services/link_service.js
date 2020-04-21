PDFJS.Reader.LinkService = function (options, reader) {

    options = options || {};

	this.eventBus = options.eventBus || reader.eventBus;
    this.reader = reader;
    this.baseUrl = null;
    this.pdfDocument = null;
    this.pdfHistory = null;
    this.pageRefs = null;

    return this;
};

Object.defineProperties(PDFJS.Reader.LinkService, {
    'pagesCount': {
        get: function () { return this.pdfDocument ? this.pdfDocument.numPages : 0; }
    },
    'page': {
        get: function () { return reader.settings.currentPage; },
        set: function(value) { reader.settings.currentPage = value; }
    }
});

PDFJS.Reader.LinkService.prototype.setDocument = function (pdfDocument, baseUrl) {

    this.baseUrl = baseUrl;
    this.pdfDocument = pdfDocument;
    this.pageRefs = Object.create(null);
};

PDFJS.Reader.LinkService.prototype.setHistory = function (pdfHistory) {

    this.pdfHistory = pdfHistory;
};

PDFJS.Reader.LinkService.prototype.navigateTo = function (destination) {

	var self = this,
		destString = "",
		destinationPromise,
		goToDestination;

	goToDestination = function (destRef) {

		var pageNumber;

		if (destRef instanceof Object) {
			pageNumber = self._cachedPageNum(destRef);
		} else if ((destRef | 0) === destRef) { // Integer
			pageNumber = destRef + 1;
		} else {
			console.error('PDFJS.Reader.LinkService.navigateTo: "' + destRef
				+ '" is not a valid destination reference.');

			return;
		}

		if (pageNumber) {

			if (pageNumber < 1 || pageNumber > self.pagesCount) {
				console.error('PDFJS.Reader.LinkService.navigateTo: "' + pageNumber
					+ '" is a non-existent page number.');

				return;
			}

			self.reader.queuePage(pageNumber);

		} else {

			self.pdfDocument.getPageIndex(destRef).then(function (pageIndex) {
				self.cachePageRef(pageIndex + 1, destRef);
				goToDestination(destRef);
			}).catch(function () {
				console.error('PDFJS.Reader.LinkService.navigateTo: "', destRef,
					'" is not a valid page reference.');

				return;
			});
		}
	};

	if (typeof destination === 'string') {

		destString = destination;
		destinationPromise = self.pdfDocument.getDestination(destination);

	} else {

		destinationPromise = Promise.resolve(destination);

	}

	destinationPromise.then(function (_destination) {

		destination = _destination;

		if (!(destination instanceof Array)) {

			console.error('PDFJS.Reader.LinkService.navigateTo: "' + destination
				+ '" is not a valid destination array.');

			return;
		}
		goToDestination(destination[0]);

	});
};

PDFJS.Reader.LinkService.prototype.getDestinationHash = function (destination) {

	var url = this.baseUrl,
		str;

	if (typeof destination === 'string') {

		url += "#"
			+ (parseInt(destination) === destination)
			? "nameddest="
			: ""
			+ escape(destination);

	} else if (destination instanceof Array) {

		url += "#"
			+ escape(JSON.stringify(destination));
	}

	return url;
};

PDFJS.Reader.LinkService.prototype.setHash = function (hash) {
    var reader = this,
	    pageNumber,
        dest;

	if (hash.indexOf('=') >= 0) {
		var params = parseQueryString(hash);
		if ('search' in params) {
			this.eventBus.dispatch('findfromurlhash', {
				source: this,
				query: params['search'].replace(/"/g, ''),
				phraseSearch: (params['phrase'] === 'true')
			});
		}
		// borrowing syntax from "Parameters for Opening PDF Files"
		if ('nameddest' in params) {
			if (this.pdfHistory) {
				this.pdfHistory.updateNextHashParam(params.nameddest);
			}
			this.navigateTo(params.nameddest);
			return;
		}
		if ('page' in params) {
			pageNumber = (params.page | 0) || 1;
		}
		if ('zoom' in params) {
			// Build the destination array.
			var zoomArgs = params.zoom.split(','); // scale,left,top
			var zoomArg = zoomArgs[0];
			var zoomArgNumber = parseFloat(zoomArg);

			if (zoomArg.indexOf('Fit') === -1) {
				// If the zoomArg is a number, it has to get divided by 100. If it's
				// a string, it should stay as it is.
				dest = [null, { name: 'XYZ' },
					zoomArgs.length > 1 ? (zoomArgs[1] | 0) : null,
					zoomArgs.length > 2 ? (zoomArgs[2] | 0) : null,
					(zoomArgNumber ? zoomArgNumber / 100 : zoomArg)];
			} else {
				if (zoomArg === 'Fit' || zoomArg === 'FitB') {
					dest = [null, { name: zoomArg }];
				} else if ((zoomArg === 'FitH' || zoomArg === 'FitBH') ||
					(zoomArg === 'FitV' || zoomArg === 'FitBV')) {
						dest = [null, { name: zoomArg },
							zoomArgs.length > 1 ? (zoomArgs[1] | 0) : null];
					} else if (zoomArg === 'FitR') {
						if (zoomArgs.length !== 5) {
							console.error('PDFLinkService_setHash: ' +
								'Not enough parameters for \'FitR\'.');
						} else {
							dest = [null, { name: zoomArg },
								(zoomArgs[1] | 0), (zoomArgs[2] | 0),
								(zoomArgs[3] | 0), (zoomArgs[4] | 0)];
						}
					} else {
						console.error('PDFLinkService_setHash: \'' + zoomArg +
							'\' is not a valid zoom value.');
					}
			}
		}
		if (dest) {

            reader.queuePage(pageNumber || this.page);

		} else if (pageNumber) {
			this.page = pageNumber; // simple page
		}
		if ('pagemode' in params) {
			this.eventBus.dispatch('pagemode', {
				source: this,
				mode: params.pagemode
			});
		}
	} else { // Named (or explicit) destination.
		if ((typeof PDFJSDev === 'undefined' || PDFJSDev.test('GENERIC')) &&
			isPageNumber(hash) && hash <= this.pagesCount) {
				console.warn('PDFLinkService_setHash: specifying a page number ' +
					'directly after the hash symbol (#) is deprecated, ' +
						'please use the "#page=' + hash + '" form instead.');
				this.page = hash | 0;
			}

		dest = unescape(hash);
		try {
			dest = JSON.parse(dest);

			if (!(dest instanceof Array)) {
				// Avoid incorrectly rejecting a valid named destination, such as
				// e.g. "4.3" or "true", because `JSON.parse` converted its type.
				dest = dest.toString();
			}
		} catch (ex) {}

		if (typeof dest === 'string' || this.isValidExplicitDestination(dest)) {
			if (this.pdfHistory) {
				this.pdfHistory.updateNextHashParam(dest);
			}
			this.navigateTo(dest);
			return;
		}
		console.error('PDFLinkService_setHash: \'' + unescape(hash) +
			'\' is not a valid destination.');
	}
};

PDFJS.Reader.LinkService.prototype.executeNamedAction = function (action) {
	// See PDF reference, table 8.45 - Named action
	switch (action) {
		case 'GoBack':
			if (this.pdfHistory) {
				this.pdfHistory.back();
			}
			break;

		case 'GoForward':
			if (this.pdfHistory) {
				this.pdfHistory.forward();
			}
			break;

		case 'NextPage':
			if (this.page < this.pagesCount) {
				this.page++;
			}
			break;

		case 'PrevPage':
			if (this.page > 1) {
				this.page--;
			}
			break;

		case 'LastPage':
			this.page = this.pagesCount;
			break;

		case 'FirstPage':
			this.page = 1;
			break;

		default:
			break; // No action according to spec
	}

	this.eventBus.dispatch('namedaction', {
		source: this,
		action: action
	});
};

PDFJS.Reader.LinkService.prototype.onFileAttachmentAnnotation = function (params) {
	this.eventBus.dispatch('fileattachmentannotation', {
		source: this,
		id: params.id,
		filename: params.filename,
		content: params.content,
	});
};

PDFJS.Reader.LinkService.prototype.pageRefStr = function (pageRef) {

    return pageRef.num + ' ' + pageRef.gen + ' R';
};

PDFJS.Reader.LinkService.prototype.cachePageRef = function (pageNum, pageRef) {

    this.pageRefs[this.pageRefStr(pageRef)] = pageNum;
};

PDFJS.Reader.LinkService.prototype._cachedPageNum = function (pageRef) {

    return (this.pageRefs[this.pageRefStr(pageRef)])
        || null;
};

PDFJS.Reader.LinkService.prototype.isValidExplicitDestination = function (dest) {
	if (!(dest instanceof Array)) {
		return false;
	}
	var destLength = dest.length, allowNull = true;
	if (destLength < 2) {
		return false;
	}
	var page = dest[0];
	if (!(typeof page === 'object' &&
		typeof page.num === 'number' && (page.num | 0) === page.num &&
			typeof page.gen === 'number' && (page.gen | 0) === page.gen) &&
			!(typeof page === 'number' && (page | 0) === page && page >= 0)) {
				return false;
			}
	var zoom = dest[1];
	if (!(typeof zoom === 'object' && typeof zoom.name === 'string')) {
		return false;
	}
	switch (zoom.name) {
		case 'XYZ':
			if (destLength !== 5) {
				return false;
			}
			break;
		case 'Fit':
		case 'FitB':
			return destLength === 2;
		case 'FitH':
		case 'FitBH':
		case 'FitV':
		case 'FitBV':
			if (destLength !== 3) {
				return false;
			}
			break;
		case 'FitR':
			if (destLength !== 6) {
				return false;
			}
			allowNull = false;
			break;
		default:
			return false;
	}
	for (var i = 2; i < destLength; i++) {
		var param = dest[i];
		if (!(typeof param === 'number' || (allowNull && param === null))) {
			return false;
		}
	}
	return true;
};
