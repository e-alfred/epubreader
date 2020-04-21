PDFJS.Reader.TextLayerController = function (options, reader) {

    var EXPAND_DIVS_TIMEOUT = 300; // ms

    this.reader = reader;
    this.textLayerDiv = options.textLayerDiv;
    this.eventBus = options.eventBus || null;
    this.textContent = null;
    this.renderingDone = false;
    this.pageIdx = options.pageIndex;
    this.pageNumber = this.pageIdx + 1;
    this.matches = [];
    this.viewport = options.viewport;
    this.textDivs = [];
    this.textLayerRenderTask = null;
    this.enhanceTextSelection = options.enhanceTextSelection;
    this._bindMouse();

    return this;
};

PDFJS.Reader.TextLayerController.prototype._finishRendering = function () {
    this.renderingDone = true;

    if (!this.enhanceTextSelection) {
        var endOfContent = document.createElement('div');
        endOfContent.className = 'endOfContent';
        this.textLayerDiv.appendChild(endOfContent);
    }

    if (this.eventBus !== null) {
        this.eventBus.dispatch('textlayerrendered', {
            source: this,
            pageNumber: this.pageNumber,
            numTextDivs: this.textDivs.length,
        });
    }
};

/**
 * Renders the text layer.
 * @param {number} timeout (optional) if specified, the rendering waits
 *   for specified amount of ms.
 */
PDFJS.Reader.TextLayerController.prototype.render = function(timeout) {
    if (!this.textContent || this.renderingDone) {
        return;
    }
    this.cancel();

    this.textDivs = [];
    var textLayerFrag = document.createDocumentFragment();
    this.textLayerRenderTask = PDFJS.renderTextLayer({
        textContent: this.textContent,
        container: textLayerFrag,
        viewport: this.viewport,
        textDivs: this.textDivs,
        timeout: timeout,
        enhanceTextSelection: this.enhanceTextSelection,
    });
    this.textLayerRenderTask.promise.then(function () {
        this.textLayerDiv.appendChild(textLayerFrag);
        this._finishRendering();
        this.updateMatches();
    }.bind(this), function (reason) {
        // cancelled or failed to render text layer -- skipping errors
    });
};

/**
 * Cancels rendering of the text layer.
 */
PDFJS.Reader.TextLayerController.prototype.cancel = function () {
    if (this.textLayerRenderTask) {
        this.textLayerRenderTask.cancel();
        this.textLayerRenderTask = null;
    }
};

PDFJS.Reader.TextLayerController.prototype.setTextContent = function (textContent) {
    this.cancel();
    this.textContent = textContent;
};

PDFJS.Reader.TextLayerController.prototype.convertMatches = function(matches, matchesLength) {

    var reader = this.reader;

    var i = 0;
    var iIndex = 0;
    var bidiTexts = this.textContent.items;
    var end = bidiTexts.length - 1;
    var queryLen = reader.search_state ?
        reader.search_state.query.length : null;
    var ret = [];
    if (!matches) {
        return ret;
    }
    for (var m = 0, len = matches.length; m < len; m++) {
        // Calculate the start position.
        var matchIdx = matches[m];

        // Loop over the divIdxs.
        while (i !== end && matchIdx >= (iIndex + bidiTexts[i].str.length)) {
            iIndex += bidiTexts[i].str.length;
            i++;
        }

        if (i === bidiTexts.length) {
            console.error('Could not find a matching mapping');
        }

        var match = {
            begin: {
                divIdx: i,
                offset: matchIdx - iIndex
            }
        };

        // Calculate the end position.
        if (matchesLength) { // multiterm search
            matchIdx += matchesLength[m];
        } else { // phrase search
            matchIdx += queryLen;
        }

        // Somewhat the same array as above, but use > instead of >= to get
        // the end position right.
        while (i !== end && matchIdx > (iIndex + bidiTexts[i].str.length)) {
            iIndex += bidiTexts[i].str.length;
            i++;
        }

        match.end = {
            divIdx: i,
            offset: matchIdx - iIndex
        };
        ret.push(match);
    }

    return ret;
};

PDFJS.Reader.TextLayerController.prototype.renderMatches = function (matches) {
    // Early exit if there is nothing to render.
    if (matches.length === 0) {
        return;
    }

    var reader = this.reader;

    var bidiTexts = this.textContent.items;
    var textDivs = this.textDivs;
    var prevEnd = null;
    var pageIdx = this.pageIdx;
    var isSelectedPage = (pageIdx === reader.selected.pageIdx);
    var selectedMatchIdx = reader.selected.matchIdx;
    var highlightAll = true;
    var infinity = {
        divIdx: -1,
        offset: undefined
    };

    function beginText(begin, className) {
        var divIdx = begin.divIdx;
        textDivs[divIdx].textContent = '';
        appendTextToDiv(divIdx, 0, begin.offset, className);
    }

    function appendTextToDiv(divIdx, fromOffset, toOffset, className) {
        var div = textDivs[divIdx];
        var content = bidiTexts[divIdx].str.substring(fromOffset, toOffset);
        var node = document.createTextNode(content);
        if (className) {
            var span = document.createElement('span');
            span.className = className;
            span.appendChild(node);
            div.appendChild(span);
            return;
        }
        div.appendChild(node);
    }

    var i0 = selectedMatchIdx, i1 = i0 + 1;
    if (highlightAll) {
        i0 = 0;
        i1 = matches.length;
    } else if (!isSelectedPage) {
        // Not highlighting all and this isn't the selected page, so do nothing.
        return;
    }

    for (var i = i0; i < i1; i++) {
        var match = matches[i];
        var begin = match.begin;
        var end = match.end;
        var isSelected = (isSelectedPage && i === selectedMatchIdx);
        var id = "match:" + pageIdx + ":" + i;
        var highlightSuffix = (isSelected ? ' selected ' + id : ' ' + id);

        // Match inside new div.
        if (!prevEnd || begin.divIdx !== prevEnd.divIdx) {
            // If there was a previous div, then add the text at the end.
            if (prevEnd !== null) {
                appendTextToDiv(prevEnd.divIdx, prevEnd.offset, infinity.offset);
            }
            // Clear the divs and set the content until the starting point.
            beginText(begin);
        } else {
            appendTextToDiv(prevEnd.divIdx, prevEnd.offset, begin.offset);
        }

        if (begin.divIdx === end.divIdx) {
            appendTextToDiv(begin.divIdx, begin.offset, end.offset,
                'highlight' + highlightSuffix);
        } else {
            appendTextToDiv(begin.divIdx, begin.offset, infinity.offset,
                'highlight begin' + highlightSuffix);
            for (var n0 = begin.divIdx + 1, n1 = end.divIdx; n0 < n1; n0++) {
                textDivs[n0].className = 'highlight middle' + highlightSuffix;
            }
            beginText(end, 'highlight end' + highlightSuffix);
        }
        prevEnd = end;
    }

    if (prevEnd) {
        appendTextToDiv(prevEnd.divIdx, prevEnd.offset, infinity.offset);
    }
};

PDFJS.Reader.TextLayerController.prototype.updateMatches = function () {
    // Only show matches when all rendering is done.
    if (!this.renderingDone) {
        return;
    }

    var reader = this.reader;

    // Only show matches when search is active
    if (reader.search_active !== true) {
        return;
    }

    // Clear all matches.
    var matches = this.matches;
    var textDivs = this.textDivs;
    var bidiTexts = this.textContent.items;
    var clearedUntilDivIdx = -1;

    // Clear all current matches.
    for (var i = 0, len = matches.length; i < len; i++) {
        var match = matches[i];
        var begin = Math.max(clearedUntilDivIdx, match.begin.divIdx);
        for (var n = begin, end = match.end.divIdx; n <= end; n++) {
            var div = textDivs[n];
            div.textContent = bidiTexts[n].str;
            div.className = '';
        }
        clearedUntilDivIdx = match.end.divIdx + 1;
    }

    // Convert the matches on the page controller into the match format
    // used for the textLayer.
    var pageMatches = reader.pageMatches[this.pageIdx] || null,
        pageMatchesLength = reader.pageMatchesLength ? 
        reader.pageMatchesLength[this.pageIdx] || null : null;


    this.matches = this.convertMatches(pageMatches, pageMatchesLength);
    this.renderMatches(this.matches);
};

/**
 * Fixes text selection: adds additional div where mouse was clicked.
 * This reduces flickering of the content if mouse slowly dragged down/up.
 * @private
 */
PDFJS.Reader.TextLayerController.prototype._bindMouse = function () {
    var div = this.textLayerDiv;
    var self = this;
    var expandDivsTimer = null;

    div.addEventListener('mousedown', function (e) {
        if (self.enhanceTextSelection && self.textLayerRenderTask) {
            self.textLayerRenderTask.expandTextDivs(true);
            if ((typeof PDFJSDev === 'undefined' ||
                !PDFJSDev.test('FIREFOX || MOZCENTRAL')) &&
                    expandDivsTimer) {
                        clearTimeout(expandDivsTimer);
                        expandDivsTimer = null;
                    }
            return;
        }
        var end = div.querySelector('.endOfContent');
        if (!end) {
            return;
        }
        if (typeof PDFJSDev === 'undefined' ||
            !PDFJSDev.test('FIREFOX || MOZCENTRAL')) {
                // On non-Firefox browsers, the selection will feel better if the height
                // of the endOfContent div will be adjusted to start at mouse click
                // location -- this will avoid flickering when selections moves up.
                // However it does not work when selection started on empty space.
                var adjustTop = e.target !== div;
                if (typeof PDFJSDev === 'undefined' || PDFJSDev.test('GENERIC')) {
                    adjustTop = adjustTop && window.getComputedStyle(end).
                        getPropertyValue('-moz-user-select') !== 'none';
                }
                if (adjustTop) {
                    var divBounds = div.getBoundingClientRect();
                    var r = Math.max(0, (e.pageY - divBounds.top) / divBounds.height);
                    end.style.top = (r * 100).toFixed(2) + '%';
                }
            }
        end.classList.add('active');
    });

    div.addEventListener('mouseup', function (e) {
        if (self.enhanceTextSelection && self.textLayerRenderTask) {
            if (typeof PDFJSDev === 'undefined' ||
                !PDFJSDev.test('FIREFOX || MOZCENTRAL')) {
                    expandDivsTimer = setTimeout(function() {
                        if (self.textLayerRenderTask) {
                            self.textLayerRenderTask.expandTextDivs(false);
                        }
                        expandDivsTimer = null;
                    }, 300);
                } else {
                    self.textLayerRenderTask.expandTextDivs(false);
                }
            return;
        }
        var end = div.querySelector('.endOfContent');
        if (!end) {
            return;
        }
        if (typeof PDFJSDev === 'undefined' ||
            !PDFJSDev.test('FIREFOX || MOZCENTRAL')) {
                end.style.top = '';
            }
        end.classList.remove('active');
    });
};

